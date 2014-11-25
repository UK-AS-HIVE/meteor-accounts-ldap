
/*UI.registerHelper(
  "ldapLogin",
  function (option) {
    return new Spacebars.SafeString(Template.ldapLogin());
  }
);*/

var firstAttempt = true;

Template.ldapLogin.events({
  'click button[name="login"]': function(e, tpl) {
    initLogin(e,tpl);
  },
  'keyup input' : function (e, tpl){
    if (e.keyCode == 13){ //If Enter Key Pressed
        initLogin(e,tpl)
      }
  },
  'click button[name="logout"]': function(e) {
    firstAttempt = true;
    Meteor.logout();
  }
});

Meteor.loginWithLdap = function (username, password, callback) {
  Accounts.callLoginMethod({
    methodName: 'loginWithLdap',
    methodArguments: [{username: username, password: password}],
    validateResult: function (result) {
    },
    userCallback: callback
  });
};

Template.ldapLogin.helpers({
  failedLogin : function(){
    return !firstAttempt; //return true if more than one attempt has been made. Show Error Message
  }
})


// Initiate Login Process:
initLogin = function(e, tpl)
{
  firstAttempt = false;
    var username = $(tpl.find('input[name="ldap"]')).val();
    var password = $(tpl.find('input[name="password"]')).val();
    var result = Meteor.loginWithLdap(username, password, function() {
      if (Meteor.userId())
        return true;
      else 
        return false
    });
    return result;
}

