if (Meteor.isClient) {
  Deps.autorun(function () {
      Meteor.subscribe("userData");
  });
}

if (Meteor.isServer) {
  Accounts.onLogin(function(info) {
    console.log("onLogin fired");
  });
  Meteor.startup(function () {
    // code to run on server at startup
    Meteor.publish("userData", function () {
      return Meteor.users.find();
    });
  });
}
