Meteor.methods({
  loginWithLdap: function (request) {
    console.log ('LinkBlue authentication for ' + request.username);

    // Authenticate against LDAP
    var fs = Npm.require('fs');
    var ldap = Npm.require('ldapjs');
    var Future = Npm.require('fibers/future');
    var assert = Npm.require('assert');
    var client = ldap.createClient({
      url: 'ldap://gc.ad.uky.edu:3268'
    });

    var userDN = request.username+'@AD.UKY.EDU';


    var bindFuture = new Future();


    client.bind(userDN, request.password, function (err) {
      console.log ('Callback from binding LDAP');
      if (err) {
        console.log(err.dn);
        console.log(err.code);
        console.log(err.name);
        console.log(err.message);
        console.log('LDAP bind failed');
        bindFuture.return(false);
      } else {
        bindFuture.return(true);
      }
    });

    var success = bindFuture.wait();

    if (!success || request.password == '') {
      throw new Meteor.Error(403, "Invalid credentials");
      return;
    }

    var opts = {
    filter: '(&(cn='+request.username+')(objectClass=user))',
    scope: 'sub'
    };


  var searchFuture = new Future();
  var displayName = '';
  var givenName = '';
  var department = '';
  var employeeNumber = '';
  var mail = '';
  var title = '';
  var address = '';
  var phone = '';
  var memberOf = [];
  var connect = Npm.require('connect');
  var path = Npm.require('path');

function serveFolder(urlPath, diskPath){
    if(!fs.existsSync(diskPath))
        return false;
    RoutePolicy.declare(urlPath, 'network');
    WebApp.connectHandlers.use(urlPath, connect.static(diskPath));
    return true;
}
  client.search( "DC=ad,DC=uky,DC=edu",opts, function(err, res) {
    assert.ifError(err);
    res.on('searchEntry', function(entry) {
      displayName = entry.object.displayName;
      givenName = entry.object.givenName;
      department = entry.object.department;
      employeeNumber = entry.object.employeeNumber;
      mail = entry.object.mail;
      title = entry.object.title;
      address = entry.object.physicalDeliveryOfficeName;
      phone = entry.object.homePhone;
      memberOf = entry.object.memberOf;
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

    if (user) {
      userId = user._id;
      Meteor.users.update(userId, {$set: {
        displayName: displayName, 
        givenName: givenName, 
        department:department,
        employeeNumber: employeeNumber,
        mail: mail,
        title: title,
        address: address,
        phone: phone,
        memberOf: memberOf
      }});
    } else {
      userId = Meteor.users.insert({
        username: request.username,
        displayName: displayName,
        givenName: givenName, 
        department: department,
        employeeNumber: employeeNumber,
        mail: mail,
        title: title,
        address : address,
        phone: phone,
        memberOf: memberOf
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

Accounts.registerLoginHandler(function (options) {
  // TODO: This could be useful if we want mixed-mode login.
  // For using LDAP only, it is not really relevant.
});

