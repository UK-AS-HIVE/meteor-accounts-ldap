Accounts-Linkblue
==
##Overview##
This is a package to implement authentication against an LDAP server and retrieve user attributes from that server in Meteor.js. 

##Installation##

Since this is a private package for now, it needs to be manually cloned and added to your meteor app. 
To install the package, create a packages/ directory in your meteor app, and move hive:accounts-linkblue there. Then add a line containing hive:accounts-linkblue in .meteor/packages and run your app.

* mkdir -p packages
* git clone https://github.com/UK-AS-HIVE/meteor-accounts-linkblue packages/hive:accounts-linkblue
* meteor add hive:accounts-linkblue

##Usage##
Your server's DN, DC, and URL will need to be set in a settings.json file as `server_dn`, `server_dc`, and `server_url`, respectively. In addition, you should select an array of `whiteListedFields` to pull from the LDAP object. An example is in `examples/basic/config/settings.json.example`. 

`{{> linkblueLogin}}` renders a template with username and password inputs. If login is successful, the user will be added to Meteor.users(). It is up to the app to publish and subscribe fields. By default, only the username is published.

To run example:
- cd hive:accounts-linkblue/examples/basic
- source config/env.sh.example
- meteor run

##Future Possibilities##
Would like to get this registered as a login handler for meteor-accounts.

