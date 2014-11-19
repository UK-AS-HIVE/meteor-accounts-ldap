Meteor.methods({
  loginWithLdap: function (request) {
    console.log ('LDAP authentication for ' + request.username);
    serverURL='ldap://gc.ad.uky.edu:3268';
    serverDN = 'AD.UKY.EDU';    
    serverDC="DC=ad,DC=uky,DC=edu";
    // Authenticate against LDAP
    var ldap = Npm.require('ldapjs');
    var Future = Npm.require('fibers/future');
    var assert = Npm.require('assert');
    var client = ldap.createClient({
      url: serverURL
    });

    var userDN = request.username+'@'+serverDN;
    var bindFuture = new Future();
 
    client.bind(userDN, request.password, function (err) {
      console.log ('Callback from binding LDAP');
      if (err) {
        console.log('LDAP bind failed');
        console.log([err.dn, err.code, err.name, err.message]);
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
    
    var fields = {};
    whiteListedFields = ['displayName', 'givenName', 'department', 'employeeNumber', 'mail', 'title', 'address', 'phone', 'memberOf'];
 
    client.search(serverDC, opts, function(err, res) {
      assert.ifError(err);
      res.on('searchEntry', function(entry) {
        fields = _.pick(entry.object, whiteListedFields);
        searchFuture.return(true);
      });
      
      res.on('searchReference', function(referral) {
        console.log('referral: ' + referral.uris.join());
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


    // If the user name is not found, create a new user
    var userId;
    var user = Meteor.users.findOne({username: request.username});
    userObj = _.extend({username: request.username}, fields);
    
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

