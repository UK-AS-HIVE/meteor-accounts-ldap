Accounts.registerLoginHandler("ldap", function(loginRequest) {
  if (LDAP.checkAccount(loginRequest)) {
    var userId;
    var user = Meteor.users.findOne({ username : loginRequest.username });
    if (user) {
      userId = user._id;
    } else {
      userId = Meteor.users.insert({ username: loginRequest.username });
    }
  
    return {
      userId: userId
    };
  }
  
  return undefined;

});
