const http = require('http')

const pluginName = 'RdfPlugin'

const child_process = require('child_process')
const fs = require('fs')
const express = require('express')
const app = express()

const winston = require('winston')
winston.remove(winston.transports.Console)
winston.add(winston.transports.Console, {timestamp: true});

const config = require('./config')
const FusekiServerUrl = config.webgme_rdf.FusekiServerUrl
const VirtuosoServerUrl = config.webgme_rdf.VirtuosoServerUrl
const port = config.webgme_rdf.ListenPort
const WebGmeServerUrl = config.webgme_rdf.WebGmeServerUrl

app.get('/', function (req, res) {
    res.send('todo')
})

app.post('/webgme_webhook', function (req, res) {
    var body = '';
    req.on('data', function (data) {
        body += data;
        if (body.length > 1e6) {
            req.connection.destroy();
        }
    });
    req.on('end', function () {
        var hookData;
        try {
            hookData = JSON.parse(body);
        } catch (e) {
            return res.status(400).send('invalid JSON');
        }
        if (hookData.event === 'BRANCH_HASH_UPDATED' && hookData.data.branchName === 'master') {
            // FIXME: use this instead?: projectId: 'guest+Factory',
            const projectName = hookData.projectName;

            update(hookData.data.newHash, projectName);
        }
        res.send('ok');
    });
})

var updatesRunning = {}
function update(hash, projectName) {
    // TODO: max one process per project at a time
    const pluginConfig = 'plugin_config.json';
    fs.writeFileSync(pluginConfig, JSON.stringify({VirtuosoServerUrl: VirtuosoServerUrl, FusekiServerUrl: FusekiServerUrl, WebGmeServerUrl: WebGmeServerUrl}))
    if (updatesRunning[projectName]) {
        winston.info(`Hash updated for ${projectName}. Deferring update`)
        updatesRunning[projectName] = hash
        return
    }
    updatesRunning[projectName] = hash

    winston.info(`Calling node node_modules/webgme/src/bin/run_plugin.js  -c ${hash} ${pluginName} ${projectName}`)

    child_process.execFile(process.argv[0], ['node_modules/webgme/src/bin/run_plugin.js', '--pluginConfigPath', pluginConfig, '-c', hash, pluginName, projectName], {},
        function (error, stdout, stderr) {
            var newHash = updatesRunning[projectName];
            delete updatesRunning[projectName];
            if (newHash && newHash !== hash) {
                setImmediate(function () {
                    winston.info(`Running deferred update for ${projectName}`)
                    update(newHash, projectName)
                });
            }
            if (error) {
                winston.error(`run_plugin.js returned error ${error}: ` + stderr)
                return
            }
            const successString = 'execution was successful: '
            const successIndex = stdout.indexOf(successString)
            if (successIndex === -1) {
                winston.error(`run_plugin.js did not succeed ` + stdout)
                return
            }
            winston.info(`Updating ${projectName} to ${hash} succeeded`)
            // const data = JSON.parse(stdout.substring(successIndex + successString.length))
            // console.log(data.messages[0].message)
        }
    );

}

app.listen(port, function () {
    winston.info(`Listening on port ${port}`)
})
