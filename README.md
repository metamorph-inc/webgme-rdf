## Prerequisites
- WebGME server
  - MongoDB
- NodeJS
- Semantic Graph DB (such as Virtuoso or Apache Jena-Fuseki)

WebGME is installed as a NodeJS package dependency for WebGME-RDF, and may be used for this.

## Setup
1. `npm install`
2. Edit `config.js`
3. Run WebGME: `node node_modules\webgme\src\bin\start_server.js`
4. Go to the WebGME interface an create a new project. By default, you can find it at `http://localhost:8888/`
5. Register WebHooks for the projects you want to track. Run this command from the server that's running WebGME, from the WebGME root directory:
```
node src/bin/manage_webhooks.js add [Name of the Project] [Name you want the Hook to have] http://[webgme-rdf server]:[ListenPort from config.js]/webgme_webhook -e all
```
6. If the URL of the WebHook recipient changes, update its location.
```
node src/bin/manage_webhooks.js update [Name of the Project] [Name you want the Hook to have] --url http://[webgme-rdf server]:[ListenPort from config.js]/webgme_webhook -e all
```
7. Run the webgme-rdf listener:
```
node index.js
```

## Notes
Virtuoso configuration:
System Admin->User Accounts->SPARQL-> Add SPARQL_UPDATE

Install Faceted Browser at http://localhost:8890/conductor/vad.vspx?realm=virtuoso_admin
Access it at http://localhost:8890/fct

Manual data upload:  
curl --digest --user dba:dba --verbose --url "http://localhost:8890/sparql-graph-crud-auth?graph-uri=http%3A%2F%2Flocalhost%3A8888%2F%3Fproject%3DTESTTEST" -T gme-factory.ttl

View Apache Fuseki data at:
http://localhost:3030/FactoryStatic/get
