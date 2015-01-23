var express = require('express');
var httpProxy = require('http-proxy');
var url  = require('url');
var q = require('q');

var common = require('./common');

module.exports = function(args) {
  // Create express app
  var app = express();

  // Promise handler wrapper to handle sending responses and error cases
  var wrapper = function(promiseRequestHandler) {
    return function (req, res, next) {
      if (args.debug) {
        console.log('handle: ' + url.parse(req.url).pathname);
      }
      q.fcall(promiseRequestHandler, req, res, next)
      .then(function (result) {
        var status = 200;
        if (result.__redirect) {
          res.redirect(result.url);
          status = 302;
        } else if (result.__render) {
          res.render(result.template, result.params);
        } else {
          res.status(status).send(result);
        }
      })
      .catch(function(caught) {
        var err;
        if (caught instanceof Error) {
          err = caught;
        } else if (typeof caught === 'string') {
          err = new Error("(string_error) " + caught);
        } else {
          err = new Error("(object_error) " + JSON.stringify(caught));
        }

        var message = err.message || 'local error';
        // use attached result, or make one
        var result = err.result || {error: message};
        var status = err.status || 500;
        console.log('error %s: %s', status, err.message);
        if (status == 500) {
          console.log(err.stack);
        }
        res.status(status).send(result);
      })
      .done();
    };
  };

  // Decorate the client routes
  require('./clientRoutes')(app, wrapper);

  // Mount the proxy middleware
  var options = {};
  if (common.Environments[args.env].network === 'testnet') {
    // Need to do this to make supertest agent pass (set rejectUnauthorized to false)
    options = { secure: false };
  }

  var proxy = httpProxy.createProxyServer(options);

  proxy.on('proxyReq', function (proxyReq, req, res, options) {
    // Need to rewrite the host, otherwise cross-site protection kicks in
    proxyReq.setHeader('host', url.parse(common.Environments[args.env].uri).hostname);
  });

  app.use(function (req, res) {
    if (args.debug) {
      console.log('proxy: ' + url.parse(req.url).pathname);
    }
    proxy.web(req, res, { target: common.Environments[args.env].uri });
  });

  return app;
};
