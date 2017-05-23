'use strict';

/*
MIT license
 https://github.com/bnjjj/node-request-digest
*/
// const requestUrl = require('request');
const superagent = require('superagent');
const createHash = require('crypto').createHash;
// import _ from 'lodash';

class HTTPDigest {
    constructor(username, password) {
        this.nc = 0;
        this.username = username;
        this.password = password;
    }

    request(url, options, callback) {
        var self = this;
        // const port = options.port ? options.port : 80;

        // options.url = `${options.host}:${port}${options.path}`;
        // FIXME: should be superagent[lower(options.method)]
        superagent.get(url)
            //.on('error', function (error, res) {
            //    this._handleResponse(options, error.response, callback) }.bind(this))
            .end(function (error, response) {
                if (error && error.status === 401) {
                    self._handleResponse(options, error.response, callback)
                }
                else if (error)
                {
                    callback(error)
                }
                else
                {
                    callback('no auth needed')
                }
            })
    }

    _handleResponse(options, res, callback) {
        if (!res) {
          return callback(new Error('Bad request, answer is empty'));
        }
        if (res.statusCode === 200) {
            return callback(null, res, res.body);
        }
        if (typeof res.header['www-authenticate'] !== 'string' || res.header['www-authenticate'] === '') {
            return callback(new Error('Bad request, www-authenticate field is malformed'));
        }

        var challenge = this._parseDigestResponse(res.header['www-authenticate']);
        var ha1 = createHash('md5');
        ha1.update([this.username, challenge.realm, this.password].join(':'));
        var ha2 = createHash('md5');
        ha2.update([options.method, options.path].join(':'));

        var tmp = this._generateCNONCE(challenge.qop);
        var nc = tmp.nc;
        var cnonce = tmp.cnonce;

        // Generate response hash

        // response=MD5(HA1:nonce:nonceCount:cnonce:qop:HA2)
        var response = createHash('md5');
        var responseParams = [
            ha1.digest('hex'),
            challenge.nonce
        ];

        if (cnonce) {
            responseParams.push(nc);
            responseParams.push(cnonce);
        }

        responseParams.push(challenge.qop);
        responseParams.push(ha2.digest('hex'));
        response.update(responseParams.join(':'));

        // Setup response parameters
        var authParams = {
            username: this.username,
            realm: challenge.realm,
            nonce: challenge.nonce,
            uri: options.path,
            qop: challenge.qop,
            algorithm: "MD5",
            opaque: challenge.opaque,
            response: response.digest('hex')
        };

        authParams = this._omitNull(authParams);

        if (cnonce) {
            authParams.nc = nc;
            authParams.cnonce = cnonce;
        }

        var headers = options.headers || {};
        headers.Authorization = this._compileParams(authParams);
        options.headers = headers;
        return callback(null, headers);

        return requestUrl(options, function (error, response, body) {
            if (response.statusCode >= 400) {
                var errorMessage = {
                    statusCode: response.statusCode,
                    response: response,
                    body: body
                };

                return callback(errorMessage);
            }
            callback(error, response, body);
        }.bind(this));
    }

    _omitNull(data) {
        // _.omit(data, (elt) => {
        //   console.log('elt ' + elt + ' et condition : ' + elt === null);
        //   return elt == null;
        // });
        var newObject = {};
        for (var key in data) {
        // _.forEach(data, function (elt, key) {
            var elt = data[key]
            if (elt != null) {
                newObject[key] = elt;
            }
        }

        return newObject;
    }

    _parseDigestResponse(digestHeader) {
        var prefix = 'Digest ';
        var challenge = digestHeader.substr(digestHeader.indexOf(prefix) + prefix.length);
        var parts = challenge.split(',');
        var length = parts.length;
        var params = {};

        for (var i = 0; i < length; i++) {
            var paramSplitted = this._splitParams(parts[i]);

            if (paramSplitted.length > 2) {
                params[paramSplitted[1]] = paramSplitted[2].replace(/\"/g, '');
            }
        }

        return params;
    }

    _splitParams(paramString) {
        return paramString.match(/^\s*?([a-zA-Z0-0]+)=("?(.*)"?|MD5|MD5-sess|token|TRUE|FALSE)\s*?$/);
    }

    //
    // ## Parse challenge digest
    //
    _generateCNONCE(qop) {
        var cnonce = false;
        var nc = false;

        if (typeof qop === 'string') {
            var cnonceHash = createHash('md5');

            cnonceHash.update(Math.random().toString(36));
            cnonce = cnonceHash.digest('hex').substr(0, 8);
            nc = this._updateNC();
        }

        return {cnonce: cnonce, nc: nc};
    }

    //
    // ## Compose authorization header
    //

    _compileParams(params) {
        var parts = [];
        for (var i in params) {
            if (typeof params[i] === 'function') {
              continue;
            }

            var param = i + '=' + (this._putDoubleQuotes(i) ? '"' : '') + params[i] + (this._putDoubleQuotes(i) ? '"' : '');
            parts.push(param);
        }

        return 'Digest ' + parts.join(',');
    }

    //
    // ## Define if we have to put double quotes or not
    //

    _putDoubleQuotes(i) {
        var excludeList = ['qop', 'nc'];

        // return !_.includes(excludeList, i);
        return i;
    }

    //
    // ## Update and zero pad nc
    //

    _updateNC() {
        var max = 99999999;
        var padding = new Array(8).join('0') + '';
        this.nc = (this.nc > max ? 1 : this.nc + 1);
        var nc = this.nc + '';

        return padding.substr(0, 8 - nc.length) + nc;
    }

}

module.exports = function (username, password) {
    return new HTTPDigest(username, password);
};
