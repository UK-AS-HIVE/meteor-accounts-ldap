Package.describe({
  summary: "LinkBlue logon account"
});

Npm.depends({'ldapjs' : '0.7.1'});

Package.on_use(function (api) {
  api.use(['accounts-base'], ['client', 'server']);
  api.imply('accounts-base', ['client', 'server']);
  //api.use('srp', ['client', 'server']);
  api.use(['underscore', 'ui', 'templating', 'bootstrap', 'jquery', 'spacebars'], 'client');

  api.add_files('linkblue_common.js', ['client', 'server']);
  api.add_files([
    'linkblue_client.html',
    'linkblue_client.js'], 'client');
  api.add_files('linkblue_server.js', 'server');

});
