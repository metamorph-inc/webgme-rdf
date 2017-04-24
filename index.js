const http = require('http')  
const port = 8080

const pluginName = 'RdfPlugin'
const projectName = 'MyProject'

const child_process = require('child_process')
const express = require('express')
const app = express()

const winston = require('winston')
 
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
        var hookData = JSON.parse(body);
        if (hookData.event === 'BRANCH_HASH_UPDATED' && hookData.data.branchName === 'master') {
            winston.info(`Hash updated. Calling node node_modules\\webgme\\src\\bin\\run_plugin.js  -c ${hookData.data.newHash} ${pluginName} ${projectName}`)
            // TODO: max one process at a time
            child_process.execFile(process.argv[0], ['node_modules\\webgme\\src\\bin\\run_plugin.js', '-c', hookData.data.newHash, pluginName, projectName], {},
                function (error, stdout, stderr) {
                    if (error) {
                        winston.error(`run_plugin.js returned error ${error}: ` + stderr)
                        return
                    }
                    const successString = 'execution was successful: '
                    const successIndex = stdout.indexOf(successString)
                    if (successIndex === -1) {
                        winston.error(`run_plugin.js did not succesd ` + stdout)
                        return
                    }
                    const data = JSON.parse(stdout.substring(successIndex + successString.length))
                    console.log(data.messages[0].message)
                }
            );
        }
        res.send('ok');
    });
})

app.listen(port, function () {
    winston.info(`Listening on port ${port}`)
})

