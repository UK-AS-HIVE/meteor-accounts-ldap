Package.describe({
  'summary': 'Meteor account login via LDAP',
  'version': '0.4.1',
  'git' : 'https://github.com/UK-AS-HIVE/meteor-accounts-ldap',
  'name' : 'hive:accounts-ldap'
});

Npm.depends({'ldapjs' : '0.7.1', 'connect' : '2.19.3'});

Package.on_use(function (api) {
  api.use(['routepolicy', 'webapp'], 'server');
  api.use(['accounts-base', 'underscore'], ['client', 'server']);
  api.imply('accounts-base', ['client', 'server']);
  //api.use('srp', ['client_functions', 'server']);
  api.use(['ui', 'templating', 'jquery', 'spacebars'], 'client');
  api.export('LDAP','server');
  api.add_files([
    'ldap_client.html',
    'ldap_client.js'], 'client');
  api.add_files('ldap_server.js', 'server');
});
