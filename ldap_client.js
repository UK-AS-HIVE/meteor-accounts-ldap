var firstAttempt = true;

Template.ldapLogin.events({
  'click button[name="login"]': function(e, tpl) {
    initLogin(e,tpl);
  },
  'keyup input' : function (e, tpl){
    if (e.keyCode == 13){ //If Enter Key Pressed
        initLogin(e,tpl);
      }
  },
  'click button[name="logout"]': function(e) {
    firstAttempt = true;
    Meteor.logout();
  }
});

Meteor.loginWithLdap = function (username, password, callback) {
  Accounts.callLoginMethod({
    methodArguments: [{username: username, password: password, ldap: true}],
    validateResult: function (result) {
    },
    userCallback: callback
  });
};

Template.ldapLogin.helpers({
  failedLogin : function(){
    return !firstAttempt; //return true if more than one attempt has been made. Show Error Message
  }
});


// Initiate Login Process:
initLogin = function(e, tpl) {
    var username = $(tpl.find('input[name="ldap"]')).val();
    var password = $(tpl.find('input[name="password"]')).val();
    var result = Meteor.loginWithLdap(username, password, function() {
      if (Meteor.userId())
        return true;
      else {
        firstAttempt = false;
        return false;
      }
    });
    return result;
};
