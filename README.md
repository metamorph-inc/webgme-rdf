
Note: requires current git webgme

Setup:

    npm install

    cd node_modules\webgme
    rm -rf *
    git clone https://github.com/webgme/webgme .
    node utils\build\webgme.classes\build_classes.js

    node src/bin/manage_webhooks.js add MyProject MyHook http://localhost:8080/webgme_webhook -e all
    node src/bin/manage_webhooks.js update MyProject MyHook --url http://localhost:8080/webgme_webhook -e all

Run:

    node node_modules\webgme\src\bin\start_server.js
    node index.js
