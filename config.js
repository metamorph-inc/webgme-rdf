var config = require(__dirname + '/node_modules/webgme/config/index.js');

// console.trace(config.plugin);

//config.components.plugins.RdfPlugin = {
//        "src": "src/plugins/RdfPlugin",
//        "test": "test/plugins/RdfPlugin"
//    };
config.plugin.basePaths.push(__dirname + '/src/plugins')
config.webhooks.enable = true

module.exports = config;
