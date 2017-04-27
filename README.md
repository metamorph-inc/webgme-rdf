
Note: requires current git webgme

Setup:

    npm install

    cd node_modules\webgme
    rm -rf *
    git clone https://github.com/webgme/webgme .
    npm install -g bower
    mkdir node_modules
    bower install
    node utils/build/webgme.classes/build_classes.js
    node utils/build/dist/build.js

Edit `config.js`

    node node_modules\webgme\src\bin\start_server.js

Create project

    node src/bin/manage_webhooks.js add MyProject MyHook http://localhost:8080/webgme_webhook -e all
    node src/bin/manage_webhooks.js update MyProject MyHook --url http://localhost:8080/webgme_webhook -e all

Run:

    node index.js

Virtuoso configuration:
System Admin->User Accounts->SPARQL-> Add SPARQL_UPDATE

Install Faceted Browser at http://localhost:8890/conductor/vad.vspx?realm=virtuoso_admin
Access it at http://localhost:8890/fct

Manual data upload:  
curl --digest --user dba:dba --verbose --url "http://localhost:8890/sparql-graph-crud-auth?graph-uri=http%3A%2F%2Flocalhost%3A8888%2F%3Fproject%3DTESTTEST" -T gme-factory.ttl
