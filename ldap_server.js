Meteor.methods({
  loginWithLdap: function (request) {
    if(!Meteor.settings.ldap) {
      throw new Error("LDAP settings missing.");
    }
    console.log ('LDAP authentication for ' + request.username);
    var ldap = Npm.require('ldapjs');
    var Future = Npm.require('fibers/future');
    var assert = Npm.require('assert');
    var client = ldap.createClient({
      url: Meteor.settings.ldap.server_url
    });

    var userDN = request.username+'@'+Meteor.settings.ldap.server_dn;
    var bindFuture = new Future();

    //Bind to the LDAP server.  
    client.bind(userDN, request.password, function (err) {
      console.log ('Callback from binding LDAP:');
      if (err) {
        console.log('LDAP bind failed with error');
        console.log({dn: err.dn, code: err.code, name: err.name, message: err.message});
        bindFuture.return(false);
      } else {
        bindFuture.return(true);
      }
    });
    
    var success = bindFuture.wait();
    if (!success || request.password === '') {
      throw new Meteor.Error(403, "Invalid credentials");
    }

    var opts = {
      filter: '(&(cn='+request.username+')(objectClass=user))',
      scope: 'sub'
    };
    var searchFuture = new Future();
    var userObj = {};

    //Searching to retrieve the other fields for our user.
    client.search(Meteor.settings.ldap.server_dc, opts, function(err, res) {
      assert.ifError(err);
      res.on('searchEntry', function(entry) {
        userObj = _.extend({username: request.username},_.pick(entry.object, Meteor.settings.ldap.whiteListedFields));
        searchFuture.return(true); 
      });
      
      res.on('error', function(err) {
        console.error('error: ' + err.message);
        searchFuture.return(false);
      });
     
      res.on('end', function(result) {
        console.log('status: ' + result.status);
      });
    });
    var searchSuccess = searchFuture.wait();
    //Add the user to users, or update the user if it already exists.
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

