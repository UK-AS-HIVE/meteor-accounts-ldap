Package.describe({
  'summary': 'Meteor account login via LDAP',
  'version': '0.4.2',
  'git' : 'https://github.com/UK-AS-HIVE/meteor-accounts-ldap',
  'name' : 'hive:accounts-ldap'
});

Npm.depends({'ldapjs' : '0.7.1', 'connect' : '2.19.3'});

Package.on_use(function (api) {
  api.use(['routepolicy@1.0.0', 'webapp@1.0.0'], 'server');
  api.use(['accounts-base@1.0.0', 'underscore@1.0.0'], ['client', 'server']);
  //api.imply('accounts-base', ['client', 'server']);
  //api.use('srp', ['client_functions', 'server']);
  api.use(['ui@1.0.0', 'templating@1.0.0', 'jquery@1.0.0', 'spacebars@1.0.0'], 'client');
  api.export('LDAP','server');
  api.add_files([
    'ldap_client.html',
    'ldap_client.js'], 'client');
  api.add_files('ldap_server.js', 'server');
});
