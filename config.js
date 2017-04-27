var config = require(__dirname + '/node_modules/webgme/config/index.js');

// console.trace(config.plugin);

// webgme configuration:
config.plugin.basePaths.push(__dirname + '/src/plugins')
config.webhooks.enable = true

// webgme-rdf configuration:
config.webgme_rdf = {
    // Fuseki URL
    RdfServerUrl: 'http://localhost::8890',
    ListenPort: 8080,
    // Named graphs start with this:
    WebGmeServerUrl: 'http://localhost:8888'
}

module.exports = config;
