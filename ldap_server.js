Meteor.methods({
  loginWithLdap: function (request) {
    console.log ('LDAP authentication for ' + request.username);
    var ldap = Npm.require('ldapjs');
    var Future = Npm.require('fibers/future');
    var assert = Npm.require('assert');
    var client = ldap.createClient({
      url: process.env.SERVERURL
    });

    var userDN = request.username+'@'+process.env.SERVERDN;
    var bindFuture = new Future();
    //Bind client (our app) to the LDAP server.  
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
    whiteListedFields = ['username,', 'displayName', 'givenName', 'department', 'employeeNumber', 'mail', 'title', 'address', 'phone', 'memberOf'];
 
    client.search(process.env.SERVERDC, opts, function(err, res) {

      assert.ifError(err);
      res.on('searchEntry', function(entry) {
        userObj = _.extend({username: request.username},_.pick(entry.object, whiteListedFields));
        console.log(userObj);
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

    // If the user name is not found, create a new user
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

