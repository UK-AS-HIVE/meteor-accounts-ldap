Package.describe({
  'summary': 'LinkBlue account login via LDAP',
  'version': '0.2.0',
  'git' : 'https://github.com/UK-AS-HIVE/meteor-accounts-ldap',
  'name' : 'hive:accounts-linkblue'
});

Npm.depends({'ldapjs' : '0.7.1', 'connect' : '2.19.3'});

Package.on_use(function (api) {
  api.use(['routepolicy', 'webapp'], 'server');
  api.use(['accounts-base'], ['client', 'server']);
  api.imply('accounts-base', ['client', 'server']);
  //api.use('srp', ['client_functions', 'server']);
  api.use(['underscore', 'ui', 'templating', 'jquery', 'spacebars'], 'client');
  api.use('underscore', 'server');

  api.add_files([
    'ldap_client_functions.html',
    'ldap_client_functions.js'], 'client');
  api.add_files([
    'ldap_authenticate.js',
    'ldap_loginhandler.js'], 'server');

Package.on_test(function (api) {
  api.use(['routepolicy', 'webapp'], 'server');
  api.use(['accounts-base'], ['client_functions', 'server']);
  //api.use('srp', ['client_functions', 'server']);
  api.use(['underscore', 'ui', 'templating', 'jquery', 'spacebars'], 'client');

  api.use(['tinytest', 'test-helpers'], ['client_functions', 'server']);
  api.add_files([
    'ldap_client_functions.html',
    'ldap_client_functions.js'], 'client');
  api.add_files([
    'ldap_authenticate.js',
    'ldap_loginhandler.js'], 'server');
  api.add_files('accounts-ldap-tests.js', ['client', 'server']);


});

});
