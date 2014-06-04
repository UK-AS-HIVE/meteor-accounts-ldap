
/*UI.registerHelper(
  "linkblueLogin",
  function (option) {
    return new Spacebars.SafeString(Template.linkblueLogin());
  }
);*/
var firstAttempt = true;

Template.linkblueLogin.events({
  'click button[name="login"]': function(e, tpl) {
    initLogin(e,tpl);
    console.log(firstAttempt);
  },
  'keyup input' : function (e, tpl){
    if (e.keyCode == 13){ //If Enter Key Pressed
        initLogin(e,tpl)
      }
  },
  'click button[name="logout"]': function(e) {
    Meteor.logout();
  }
});

Meteor.loginWithLdap = function (username, password, callback) {
  Accounts.callLoginMethod({
    methodName: 'loginWithLdap',
    methodArguments: [{username: username, password: password}],
    validateResult: function (result) {
      console.log ('validating results of login attempt...');
      console.log (result);
    },
    userCallback: callback
  });
};

Template.linkblueLogin.helpers({
  failedLogin : function(){
    return !firstAttempt; //return true if more than one attempt has been made. Show Error Message
  }
})


// Initiate Login Process:
var initLogin = function(e, tpl)
{
  firstAttempt = false;
    var username = $(tpl.find('input[name="linkblue"]')).val();
    var password = $(tpl.find('input[name="password"]')).val();
    var result = Meteor.loginWithLdap(username, password, function() {
      console.log ('Callback from Meteor.loginWithLdap');
      console.log (Meteor.userId());
    });
}

