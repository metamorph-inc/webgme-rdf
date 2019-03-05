var config = require(__dirname + '/node_modules/webgme/config/index.js');

// console.trace(config.plugin);

// webgme configuration:
config.plugin.basePaths.push(__dirname + '/src/plugins')
config.webhooks.enable = true

// webgme-rdf configuration:
config.webgme_rdf = {
    FusekiServerUrl: 'http://localhost:3030/FactoryStatic',
    VirtuosoServerUrl: 'http://localhost:8890',
    GraphDBUrl: 'http://localhost:7200/repositories/test',
    ListenPort: 8080,
    // Named graphs start with this:
    WebGmeServerUrl: 'http://localhost:8888'
}

module.exports = config;
