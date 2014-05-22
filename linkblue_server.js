Meteor.methods({
  loginWithLdap: function (request) {
    console.log ('LinkBlue authentication for ' + request.username);

    // Authenticate against LDAP
    var ldap = Npm.require('ldapjs');
    var Future = Npm.require('fibers/future');

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

    // If the user name is not found, create a new user
    var userId;
    var user = Meteor.users.findOne({username: request.username});

    if (user) {
      userId = user._id;
    } else {
      userId = Meteor.users.insert({username: request.username});
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

