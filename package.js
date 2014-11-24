Package.describe({
  'summary': 'LinkBlue account login via LDAP',
  'version': '0.2.0',
  'git' : 'https://github.com/UK-AS-HIVE/meteor-accounts-linkblue',
  'name' : 'hive:accounts-linkblue'
});

Npm.depends({'ldapjs' : '0.7.1', 'connect' : '2.19.3'});

Package.on_use(function (api) {
  api.use(['routepolicy', 'webapp'], 'server');
  api.use(['accounts-base', 'underscore'], ['client', 'server']);
  api.imply('accounts-base', ['client', 'server']);
  //api.use('srp', ['client_functions', 'server']);
  api.use(['ui', 'templating', 'jquery', 'spacebars'], 'client');

  api.add_files([
    'ldap_client.html',
    'ldap_client.js'], 'client');
  api.add_files('ldap_server.js', 'server');

Package.on_test(function (api) {
  api.use(['routepolicy', 'webapp'], 'server');
  api.use(['accounts-base'], ['client_functions', 'server']);
  //api.use('srp', ['client_functions', 'server']);
  api.use(['underscore', 'ui', 'templating', 'jquery', 'spacebars'], 'client');

  api.use(['tinytest', 'test-helpers'], ['client_functions', 'server']);
  api.add_files([
    'ldap_client.html',
    'ldap_client.js'], 'client');
  api.add_files('ldap_server.js', 'server');
  api.add_files('accounts-ldap-tests.js', ['client', 'server']);


});

});
