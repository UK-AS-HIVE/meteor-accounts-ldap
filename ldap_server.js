LDAP = {};
var ldap = Npm.require('ldapjs');
var Future = Npm.require('fibers/future');
var assert = Npm.require('assert');

LDAP.bind = function (username, password) {
  //Create our LDAP client and bind to the LDAP server.

  LDAP.client = ldap.createClient({
    url: Meteor.settings.ldap.serverUrl
  });

  var userDn = username+'@'+Meteor.settings.ldap.serverDn;
  var bindFuture = new Future();

  LDAP.client.bind(userDn, password, function (err) {
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

LDAP.search = function (searchUsername) {
  //Search our previously bound connection. If the LDAP client isn't bound, this should throw an error.
  var opts = {
    filter: '(&(cn='+searchUsername+')(objectClass=user))',
    scope: 'sub',
    timeLimit: 2
  };
  var searchFuture = new Future();
  LDAP.client.search(Meteor.settings.ldap.serverDc, opts, function(err, res) {
    userObj = {};
    if(err) {
      searchFuture.return(500)
    }
    else {
      res.on('searchEntry', function(entry) {
        userObj = _.extend({username: searchUsername},_.pick(entry.object, Meteor.settings.ldap.whiteListedFields));
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

  return searchFuture.wait();
}

Meteor.methods({
  loginWithLdap: function (request) {
    if (!Meteor.settings.ldap) {
      throw new Error("LDAP settings missing.");
    }
    console.log('LDAP authentication for ' + request.username);

    LDAP.bind(request.username, request.password);
    userObj = LDAP.search(request.username);

    var userId;
    var user = Meteor.users.findOne({username: request.username});
    if (user) {
      userId = user._id;
      Meteor.users.update(userId, {$set: userObj});
    } else {
      userId = Meteor.users.insert(userObj);
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

