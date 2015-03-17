LDAP = {};
var ldap = Npm.require('ldapjs');
var Future = Npm.require('fibers/future');
var assert = Npm.require('assert');

LDAP.createClient = function(serverUrl) {
  var client = ldap.createClient({
    url: serverUrl
  });
  return client;
}

LDAP.bind = function (client, username, password) {
  //Bind our LDAP client.
  var userDn = username+'@'+Meteor.settings.ldap.serverDn;
  var bindFuture = new Future();

  client.bind(userDn, password, function (err) {
    console.log ('Callback from binding LDAP:');
    if (err) {
    console.log(err);
      console.log('LDAP bind failed with error');
      console.log({dn: err.dn, code: err.code, name: err.name, message: err.message});
      bindFuture.return(false);
    } else {
      bindFuture.return(true);
    }
  });

  var success = bindFuture.wait();
  if (!success || password === '') {
    throw new Meteor.Error(403, "Invalid credentials");
  }
  return bindFuture.wait();
}

LDAP.search = function (client, searchUsername) {
  //Search our previously bound connection. If the LDAP client isn't bound, this should throw an error.
  var opts = {
    filter: '(&(cn='+searchUsername+')(objectClass=user))',
    scope: 'sub',
    timeLimit: 2
  };
  var serverDCs = typeof(Meteor.settings.ldap.serverDc) == 'string'?[Meteor.settings.ldap.serverDc]:Meteor.settings.ldap.serverDc;
  var result = false;
  _.each(serverDCs, function(serverDc) {
    var searchFuture = new Future();
    client.search(Meteor.settings.ldap.serverDc, opts, function(err, res) {
      userObj = {};
      if(err) {
        searchFuture.return(500)
      }
      else {
        res.on('searchEntry', function(entry) {
          userObj = _.extend({username: searchUsername.toLowerCase()},_.pick(entry.object, Meteor.settings.ldap.whiteListedFields));
          searchFuture.return(userObj); 
        });
        res.on('searchReference', function (referral) {
          console.log('referral: ' + referral.uris.join());
          searchFuture.return(false);
        });
        res.on('error', function(err) {
          console.error('error: ' + err.message);
          searchFuture.return(false);
        });
        res.on('end', function(result) {
          if (_.isEmpty(userObj)) {
            //Our LDAP server gives no indication that we found no entries for our search, so we have to make sure our object isn't empty.
            console.log("No result found.");
            searchFuture.return(false)
          }
          console.log('status: ' + result.status);
        });
      }
    });
    res = searchFuture.wait();
    if (res) {
      result = res;
      break;
    }
  });
  return result;
}

Meteor.methods({
  loginWithLdap: function (request) {
    if (!Meteor.settings.ldap) {
      throw new Error("LDAP settings missing.");
    }
    console.log('LDAP authentication for ' + request.username);
    var client = LDAP.createClient(Meteor.settings.ldap.serverUrl);
    LDAP.bind(client, request.username, request.password);
    userObj = LDAP.search(client, request.username);
    client.unbind();
    var userId;
    var user = Meteor.users.findOne({username: request.username.toLowerCase()});
    if (user) {
      userId = user._id;
      Meteor.users.update(userId, {$set: userObj});
    } else {
      userId = Meteor.users.insert(userObj);
    }
    if(Meteor.settings.ldap.autopublishFields) {
      Accounts.addAutopublishFields({
        forLoggedInUser: Meteor.settings.ldap.autopublishFields,
        forOtherUsers: Meteor.settings.ldap.autopublishFields
      });
    }
    var stampedToken = Accounts._generateStampedLoginToken();
    Meteor.users.update(userId,
        {$push: {'services.resume.loginTokens': stampedToken}}
        );

    this.setUserId(userId);

    return {
      id: userId,
      token: stampedToken.token,
      tokenExpires: Accounts._tokenExpiration(stampedToken.when)
    };
  }
});

