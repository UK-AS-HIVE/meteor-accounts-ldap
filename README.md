Accounts-Ldap
==
##Overview##
This is a package to implement authentication against an LDAP server and retrieval of user attributes from that server in Meteor.js.

##Installation##

Since this is a private package for now, it needs to be manually cloned and added to your meteor app. 
To install the package, create a packages/ directory in your meteor app, and move hive:accounts-ldap there. Then add a line containing hive:accounts-ldap in .meteor/packages and run your app.

* mkdir -p packages
* git clone https://github.com/UK-AS-HIVE/meteor-accounts-ldap packages/hive:accounts-ldap
* meteor add hive:accounts-ldap

##Usage##
Your server's URL and a DN or DNs to search will need to be set in a settings.json file as `serverUrl` and `serverDn`, respectively. In addition, you can select an array of `whiteListedFields` from an LDAP search to add to the user object in Meteor.users. An example is in `examples/basic/config/settings.json.example`. 

`{{> ldapLogin}}` renders a template with username and password inputs. If login is successful, the user will be added to Meteor.users(). It is up to the app to publish and subscribe fields. By default, only the username is published.

To run example:
- cd hive:accounts-ldap/examples/basic
- meteor --settings config/settings.json

##Future Possibilities##

