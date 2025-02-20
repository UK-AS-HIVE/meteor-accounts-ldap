LDAP = {};
var ldap = Npm.require('ldapjs');
var Future = Npm.require('fibers/future');
var assert = Npm.require('assert');

LDAP.createClient = function(serverUrl) {
  var client = ldap.createClient({
    url: serverUrl
  });
  return client;
};

LDAP.bind = function (client, username, password) {
  var success = null;
  //Bind our LDAP client.
  var ldap = Meteor.settings.ldap;
    var serverDNs = typeof(ldap.serverDn) == 'string'?[ldap.serverDn]:ldap.serverDn;
  for (var k in serverDNs) {
    var serverDn = serverDNs[k].split(/,?DC=/).slice(1).join('.');
    var userDn = username+'@'+serverDn;

    console.log ('Trying to bind ' + userDn + '...');

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
    success = bindFuture.wait();
    if (success) {
      break;
    }
  }

  if (!success || password === '') {
    throw new Meteor.Error(403, "Invalid credentials");
  }
  return ;
};

LDAP.search = function (client, searchUsername) {
  //Search our previously bound connection. If the LDAP client isn't bound, this should throw an error.
  var opts = {
    filter: '(&(sAMAccountType=805306368)(!(userAccountControl:1.2.840.113556.1.4.803:=2))(cn='+searchUsername+')(sAMAccountName='+searchUsername+')(objectClass=user))',
    scope: 'sub',
    timeLimit: 2
  };
  var serverDNs = typeof(Meteor.settings.ldap.serverDn) == 'string'?[Meteor.settings.ldap.serverDn]:Meteor.settings.ldap.serverDn;
  var result = false;
  for (var k in serverDNs) {
    var searchFuture = new Future();
    var serverDn = serverDNs[k];
    console.log ('Searching '+serverDn);
    client.search(serverDn, opts, function(err, res) {
      userObj = {};
      if(err) {
        console.log("  -> err!", err);
        searchFuture.return(500);
      }
      else {
        res.on('searchEntry', function(entry) {
          console.log('  -> searchEntry', entry.object.dn);
          userObj = _.extend({username: searchUsername.toLowerCase()},_.pick(entry.object, Meteor.settings.ldap.whiteListedFields));
          if(userObj.memberOf) {
            userObj.memberOf = [].concat(userObj.memberOf) // Be sure memberOf is an array
          }
          if (!result) {
            searchFuture.return(userObj);
          }
        });
        res.on('searchReference', function (referral) {
          console.log('  -> referral: ' + referral.uris.join());
          if (!result) {
            searchFuture.return(false);
          }
        });
        res.on('error', function(err) {
          console.error('  -> error: ', err.message);
          if (!result) {
            searchFuture.return(false);
          }
        });
        res.on('end', function(endResult) {
          console.log('  -> end');
          if (_.isEmpty(userObj)) {
            //Our LDAP server gives no indication that we found no entries for our search, so we have to make sure our object isn't empty.
            console.log("No result found.");
            if (!result) {
              searchFuture.return(false);
            }
          }
          console.log('status: ' + endResult.status);
        });
      }
    });
    result = searchFuture.wait();
    if (result) {
      return result;
    }
  }
  //If we're in debugMode, return an object with just the username. If not, return null to indicate no result was found.
  if(Meteor.settings.ldap.debugMode === true) {
    return {username: searchUsername.toLowerCase()};
  } else {
    return null;
  }
};

Accounts.registerLoginHandler("ldap", function (request) {
  if (!Meteor.settings.ldap) {
    throw new Error("LDAP settings missing.");
  }

  if (Meteor.settings.ldap.debugMode === true) {
    userObj = {username: request.username.toLowerCase()};
  } else {
    console.log('LDAP authentication for ' + request.username);
    var client = LDAP.createClient(Meteor.settings.ldap.serverUrl);
    LDAP.bind(client, request.username, request.password);
    userObj = LDAP.search(client, request.username);
    client.unbind();
  }

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
  var hashStampedToken = Accounts._hashStampedToken(stampedToken);
  Meteor.users.update(userId,
      {$push: {'services.resume.loginTokens': hashStampedToken}}
      );
  return {
    userId: userId,
      token: stampedToken.token,
      tokenExpires: Accounts._tokenExpiration(hashStampedToken.when)
  };
});

