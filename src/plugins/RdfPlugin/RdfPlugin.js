/*globals define*/
/*jshint node:true, browser:true, esversion: 6*/

/**
 * Generated by PluginGenerator 1.7.0 from webgme on Mon Jun 27 2016 16:44:40 GMT-0500 (CDT).
 * A plugin that inherits from the PluginBase. To see source code documentation about available
 * properties and methods visit %host%/docs/source/PluginBase.html.
 */

define([
    'plugin/PluginConfig',
    'text!./metadata.json',
    'plugin/PluginBase',
    'plugin/PluginMessage',
    'common/util/ejs',
    'text!./Templates/language.ttl.ejs',
    'text!./Templates/node.ttl.ejs',
    'text!./Templates/project.ttl.ejs',
    './utils',
    'q'
], function (PluginConfig,
             pluginMetadata,
             PluginBase,
             PluginMessage,
             ejs,
             languageTemplate,
             nodeTemplate,
             projectTemplate,
             utils,
             q) {
    'use strict';

    const superagent = require('superagent');

    function getSubTypesOfNode(core, metaNodes, path) {
        var subTypePaths = [],
            subTypePath;

        for (subTypePath in metaNodes) {
            if (core.isTypeOf(metaNodes[subTypePath], metaNodes[path])) {
                subTypePaths.push(subTypePath);
            }
        }
        subTypePaths.sort();

        return subTypePaths;
    }

    function getParentTypes(core, metaNodes, path) {
        var parentTypePaths = [],
            parentTypePath;

        for (parentTypePath in metaNodes) {
            if (core.isValidChildOf(metaNodes[path], metaNodes[parentTypePath])) {
                parentTypePaths.push(parentTypePath);
            }
        }

        parentTypePaths.sort();

        return parentTypePaths;
    }

    function getPointerInfo(core, metaNodes, path) {
        var info = {},
            names = core.getValidPointerNames(metaNodes[path]),
            i, targetPath;

        info['base'] = ['/1'];
        for (i = 0; i < names.length; i += 1) {
            info[names[i]] = [];
            for (targetPath in metaNodes) {
                if (core.isValidTargetOf(metaNodes[targetPath], metaNodes[path], names[i])) {
                    info[names[i]].push(targetPath);
                }
            }
            info[names[i]].sort();
        }

        return info;
    }

    function getSetInfo(core, metaNodes, path) {
        var info = {},
            names = core.getValidSetNames(metaNodes[path]),
            i, targetPath;

        for (i = 0; i < names.length; i += 1) {
            info[names[i]] = [];
            for (targetPath in metaNodes) {
                if (core.isValidTargetOf(metaNodes[targetPath], metaNodes[path], names[i])) {
                    info[names[i]].push(targetPath);
                }
            }
            info[names[i]].sort();
        }

        return info;
    }

    function generateLanguageDomain(core, metaNodes) {
        var ejsParameters = {
            order: Object.keys(metaNodes || {}).sort(),
            nodes: {}
        }, i, node;

        for (i = 0; i < ejsParameters.order.length; i += 1) {
            node = metaNodes[ejsParameters.order[i]];
            ejsParameters.nodes[ejsParameters.order[i]] = {
                id: ejsParameters.order[i],
                // guid: self.core.getGuid(node),
                // base: self.core.getPath(self.core.getBase(node)),
                // type: self.core.getPath(self.core.getBaseType(node)),
                name: core.getFullyQualifiedName(node),
                parentTypes: getParentTypes(core, metaNodes, ejsParameters.order[i]),
                subTypes: getSubTypesOfNode(core, metaNodes, ejsParameters.order[i]),
                // isAbstract: self.core.isAbstract(node),
                // isConnection: self.core.isConnection(node),
                meta: core.getJsonMeta(node),
                pointerNames: core.getValidPointerNames(node),
                pointerInfo: getPointerInfo(core, metaNodes, ejsParameters.order[i]),
                attributeNames: core.getOwnValidAttributeNames(node),
                setNames: core.getValidSetNames(node),
                setInfo: getSetInfo(core, metaNodes, ejsParameters.order[i])
            };
            // ejsParameters.nodes[ejsParameters.order[i]].pointerNames.push('base');
            ejsParameters.nodes[ejsParameters.order[i]].pointerNames.sort();
            ejsParameters.nodes[ejsParameters.order[i]].attributeNames.sort();
            ejsParameters.nodes[ejsParameters.order[i]].setNames.sort();
        }

        for (i = 0; i < ejsParameters.order.length; i += 1) {
            node = metaNodes[ejsParameters.order[i]];
            if (core.getBase(node)) {
                ejsParameters.nodes[ejsParameters.order[i]].base = ejsParameters.nodes[core.getPath(core.getBase(node))];
            }
            // ejsParameters.nodes[ejsParameters.order[i]].baseType = ejsParameters.nodes[core.getPath(core.getBaseType(node))];
        }
        return ejsParameters;
    }

    pluginMetadata = JSON.parse(pluginMetadata);

    /**
     * Initializes a new instance of GenFORMULA.
     * @class
     * @augments {PluginBase}
     * @classdesc This class represents the plugin GenFORMULA.
     * @constructor
     */
    var GenFORMULA = function () {
        // Call base class' constructor.
        PluginBase.call(this);
        this.pluginMetadata = pluginMetadata;
    };

    /**
     * Metadata associated with the plugin. Contains id, name, version, description, icon, configStructue etc.
     * This is also available at the instance at this.pluginMetadata.
     * @type {object}
     */
    GenFORMULA.metadata = pluginMetadata;

    // Prototypical inheritance from PluginBase.
    GenFORMULA.prototype = Object.create(PluginBase.prototype);
    GenFORMULA.prototype.constructor = GenFORMULA;

    /**
     * Main function for the plugin to execute. This will perform the execution.
     * Notes:
     * - Always log with the provided logger.[error,warning,info,debug].
     * - Do NOT put any user interaction logic UI, etc. inside this method.
     * - callback always has to be called even if error happened.
     *
     * @param {function(string, plugin.PluginResult)} callback - the result callback
     */
    GenFORMULA.prototype.main = function (callback) {
        // Use self to access core, project, result, logger etc from PluginBase.
        // These are all instantiated at this point.
        var self = this,
            languageParameters,
            nodeTexts = [];

        languageParameters = generateLanguageDomain(self.core, self.core.getAllMetaNodes(self.rootNode));

        self.core.traverse(self.rootNode, {excludeRoot: true}, function (visited, next) {
            if (self.core.isMetaNode(visited)) {
                return next(null);
            }
            // This is the visit function
            const name = self.core.getAttribute(visited, 'name');
            const own = self.core.getOwnAttributeNames(visited);
            const ownValid = self.core.getOwnValidAttributeNames(visited);
            var nodeParameters = {
                    id: self.core.getPath(visited),
                    parent: self.core.getParent(visited) === null ? 'NULL' :
                        self.core.getPath(self.core.getParent(visited)),
                    type: languageParameters.nodes[self.core.getPath(self.core.getBaseType(visited))],
                    name: self.core.getAttribute(visited, 'name'),
                    pointerNames: self.core.getOwnPointerNames(visited),
                    attributeNames: self.core.getAttributeNames(visited).sort(),
                    setNames: self.core.getOwnSetNames(visited).sort(),
                    attributes: {},
                    pointers: {},
                    sets: {},
                },
                i;

            // nodeParameters.pointerNames.push('base');
            nodeParameters.pointerNames.sort();
            nodeParameters.attributeNames.sort();
            nodeParameters.setNames.sort();

            for (var type = nodeParameters.type; type; type = type.base) {
                for (i = 0; i < type.attributeNames.length; i++) {
                    nodeParameters.attributes[type.attributeNames[i]] = {
                        type: self.core.getAttributeMeta(visited, type.attributeNames[i]).type || 'string',
                        value: self.core.getAttribute(visited, type.attributeNames[i]),
                        meta: type
                    };
                }

                for (i = 0; i < type.pointerNames.length; i++) {
                    nodeParameters.pointers[type.pointerNames[i]] = {
                        path: self.core.getPointerPath(visited, type.pointerNames[i]),
                        meta: type
                    };
                }
            }
            if (nodeParameters.pointerNames.indexOf('base') !== -1) {
                nodeParameters.pointers.base = {
                    path: self.core.getPath(self.core.getBase(visited)),
                    meta: self.core.getFCO(visited)
                };
            }

            for (i = 0; i < nodeParameters.setNames.length; i += 1) {
                nodeParameters.sets[nodeParameters.setNames[i]] =
                    self.core.getMemberPaths(visited, nodeParameters.setNames[i]).sort();
            }

            nodeTexts.push(ejs.render(nodeTemplate, nodeParameters));
            next(null);
        })
            .then(function () {
                var projectParameters = {
                        commitHash: self.commitHash,
                        projectName: self.projectName,
                        language: ejs.render(languageTemplate, languageParameters),
                        nodes: nodeTexts,
                        // constraints: self.core.getAttribute(self.rootNode, '_formulaConstraints') || "",
                        WebGmeServerUrl: self.getCurrentConfig().WebGmeServerUrl
                    },
                    projectText = ejs.render(projectTemplate, projectParameters);

                self.result.addMessage(new PluginMessage({
                    commitHash: self.commitHash,
                    activeNode: '', //always point to the root
                    message: projectText
                }));

                // console.log(projectText);

                if (self.getCurrentConfig().RdfServerUrl) {
                    return self.upload(projectText)
                        .then(self.rename.bind(self));
                }
            }).then(function () {

                self.result.setSuccess(true);
                callback(null, self.result);
            })
            .catch(function (err) {
                self.logger.error(err);
                self.result.setSuccess(false);
                callback(null, self.result);
            });

    };

    GenFORMULA.prototype.upload = function (ttl) {
        const http = require('http');
        const WebGmeServerUrl = this.getCurrentConfig().WebGmeServerUrl;
        const deferred = q.defer();

        superagent.post(this.getCurrentConfig().RdfServerUrl + '/upload')
            .attach('file', Buffer.from(ttl), 'webgme.ttl')
            // value must be a URI
            .field('graph', WebGmeServerUrl + '/?project=' + this.projectName + '_tmp')
            .on('error', deferred.reject)
            .end(function(err, res) {
                if (err) {
                    return deferred.reject(err);
                }
                if (res.error) {
                    return deferred.reject(res.status);
                }
                return deferred.resolve(res);
            });


        return deferred.promise;
    };

    GenFORMULA.prototype.rename = function () {
        const deferred = q.defer();
        const WebGmeServerUrl = this.getCurrentConfig().WebGmeServerUrl;
        superagent.post(this.getCurrentConfig().RdfServerUrl  + '/update')
            .set('Content-Type', 'application/sparql-update')
            .send('MOVE GRAPH <' + WebGmeServerUrl + '/?project=' + this.projectName + '_tmp> TO <' + WebGmeServerUrl + '/?project=' + this.projectName + '>')
            .on('error', deferred.reject)
            .end(function(err, res) {
                if (err) {
                    return deferred.reject(err);
                }
                if (res.error) {
                    return deferred.reject(res.status);
                }
                return deferred.resolve(res);
            });
        return deferred.promise;
    };

    return GenFORMULA;
});