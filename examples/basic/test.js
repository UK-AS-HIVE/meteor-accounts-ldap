if (Meteor.isClient) {
  Deps.autorun(function () {
      Meteor.subscribe("userData");
  });
}

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
    Meteor.publish("userData", function () {
      return Meteor.users.find();
    });
  });
}
