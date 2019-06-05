import 'should';
import 'should-http';
import 'should-sinon';
import '../lib/asserts';

const nock = require('nock');
const sinon = require('sinon');

const fs = require('fs');
const http = require('http');
const https = require('https');
const debug = require('debug');
const path = require('path');
const httpProxy = require('http-proxy');
const { Environments } = require('bitgo');
const co = require('bluebird').coroutine;

// eslint-disable-next-line @typescript-eslint/camelcase
import { SSL_OP_NO_TLSv1 } from 'constants';
import { TlsConfigurationError, NodeEnvironmentError } from '../../src/errors';

nock.disableNetConnect();

const {
  app: expressApp,
  startup,
  createServer,
  createBaseUri
} = require('../../src/expressApp');

describe('Bitgo Express', function() {

  describe('server initialization', function() {

    it('should require NODE_ENV to be production when running against prod env', function() {
      const envStub = sinon.stub(process, 'env').value({ NODE_ENV: 'production' });

      try {
        (() => expressApp({
          env: 'prod',
          bind: 'localhost'
        })).should.not.throw();

        process.env.NODE_ENV = 'dev';
        (() => expressApp({
          env: 'prod',
          bind: 'localhost'
        })).should.throw(NodeEnvironmentError);
      } finally {
        envStub.restore();
      }
    });

    it('should disable NODE_ENV check if disableenvcheck argument is given', function() {
      const envStub = sinon.stub(process, 'env').value({ NODE_ENV: 'dev' });

      try {
        (() => expressApp({
          env: 'prod',
          bind: 'localhost',
          disableenvcheck: true
        })).should.not.throw();
      } finally {
        envStub.restore();
      }
    });

    it('should require TLS for prod env when listening on external interfaces', function() {
      const args = {
        env: 'prod',
        bind: '1',
        disableenvcheck: true,
        disablessl: false,
        crtpath: null,
        keypath: null,
      };

      (() => expressApp(args)).should.throw(TlsConfigurationError);

      args.bind = 'localhost';
      (() => expressApp(args)).should.not.throw();

      args.bind = '1';
      args.env = 'test';
      (() => expressApp(args)).should.not.throw();

      args.disablessl = true;
      args.env = 'prod';
      (() => expressApp(args)).should.not.throw();

      delete args.disablessl;
      args.crtpath = '/tmp/cert.pem';
      (() => expressApp(args)).should.throw(TlsConfigurationError);

      delete args.crtpath;
      args.keypath = '/tmp/key.pem';
      (() => expressApp(args)).should.throw(TlsConfigurationError);

    });

    it('should require both keypath and crtpath when using TLS, but TLS is not required', function() {
      const args = {
        env: 'test',
        bind: '1',
        keypath: '/tmp/key.pem',
        crtpath: null,
      };

      (() => expressApp(args)).should.throw(TlsConfigurationError);

      delete args.keypath;
      args.crtpath = '/tmp/cert.pem';

      (() => expressApp(args)).should.throw(TlsConfigurationError);
    });

    it('should create an http server when not using TLS', co(function *() {
      sinon.stub(http, 'createServer');

      const args = {
        env: 'prod',
        bind: 'localhost'
      };

      createServer(args);

      http.createServer.should.be.calledOnce();
      http.createServer.restore();
    }));

    it('should create an https server when using TLS', co(function *() {
      sinon.stub(https, 'createServer');
      sinon.stub(fs, 'readFileAsync')
      .onFirstCall().resolves('key')
      .onSecondCall().resolves('cert');

      const args = {
        env: 'prod',
        bind: '1.2.3.4',
        crtpath: '/tmp/crt.pem',
        keypath: '/tmp/key.pem'
      };

      yield createServer(args, true);

      https.createServer.should.be.calledOnce();
      https.createServer.should.be.calledWith({ secureOptions: SSL_OP_NO_TLSv1, key: 'key', cert: 'cert' });

      https.createServer.restore();
      fs.readFileAsync.restore();
    }));

    it('should output basic information upon server startup', () => {
      sinon.stub(console, 'log');

      const args = {
        env: 'test'
      };

      startup(args, 'base')();

      (console.log.should.have as any).callCount(3);
      (console.log.should.have.been as any).calledWith('BitGo-Express running');
      (console.log.should.have.been as any).calledWith(`Environment: ${args.env}`);
      (console.log.should.have.been as any).calledWith('Base URI: base');

      (console.log as any).restore();
    });

    it('should output custom root uri information upon server startup', () => {
      sinon.stub(console, 'log');

      const args = {
        env: 'test',
        customrooturi: 'customuri'
      };

      startup(args, 'base')();

      (console.log.should.have as any).callCount(4);
      (console.log.should.have.been as any).calledWith('BitGo-Express running');
      (console.log.should.have.been as any).calledWith(`Environment: ${args.env}`);
      (console.log.should.have.been as any).calledWith('Base URI: base');
      (console.log.should.have.been as any).calledWith(`Custom root URI: ${args.customrooturi}`);

      (console.log as any).restore();
    });

    it('should output custom bitcoin network information upon server startup', () => {
      sinon.stub(console, 'log');

      const args = {
        env: 'test',
        custombitcoinnetwork: 'customnetwork'
      };

      startup(args, 'base')();

      (console.log.should.have as any).callCount(4);
      (console.log.should.have.been as any).calledWith('BitGo-Express running');
      (console.log.should.have.been as any).calledWith(`Environment: ${args.env}`);
      (console.log.should.have.been as any).calledWith('Base URI: base');
      (console.log.should.have.been as any).calledWith(`Custom bitcoin network: ${args.custombitcoinnetwork}`);

      (console.log as any).restore();
    });

    it('should create base URIs', () => {
      const args = {
        bind: '1',
        port: 2
      };

      createBaseUri(args, false).should.equal(`http://${args.bind}:${args.port}`);
      createBaseUri(args, true).should.equal(`https://${args.bind}:${args.port}`);

      args.port = 80;
      createBaseUri(args, false).should.equal(`http://${args.bind}`);
      createBaseUri(args, true).should.equal(`https://${args.bind}:80`);

      args.port = 443;
      createBaseUri(args, false).should.equal(`http://${args.bind}:443`);
      createBaseUri(args, true).should.equal(`https://${args.bind}`);
    });

    it('should set up logging with a logfile', () => {
      sinon.spy(path, 'resolve');
      sinon.spy(fs, 'createWriteStream');
      sinon.stub(console, 'log');

      const args = {
        logfile: '/dev/null',
        disableproxy: true
      };

      expressApp(args);

      path.resolve.should.have.been.calledWith(args.logfile);
      fs.createWriteStream.should.have.been.calledOnceWith(args.logfile, { flags: 'a' });
      (console.log.should.have.been as any).calledOnceWith(`Log location: ${args.logfile}`);

      path.resolve.restore();
      fs.createWriteStream.restore();
      (console.log as any).restore();
    });

    it('should enable specified debug namespaces', () => {
      sinon.stub(debug, 'enable');

      const args = {
        debugnamespace: ['a', 'b'],
        disableproxy: true
      };

      expressApp(args);

      debug.enable.should.have.been.calledTwice();
      debug.enable.should.have.been.calledWith(args.debugnamespace[0]);
      debug.enable.should.have.been.calledWith(args.debugnamespace[1]);

      debug.enable.restore();
    });

    it('should configure a custom root URI', () => {
      const args = {
        customrooturi: 'customroot',
        env: null,
      };

      expressApp(args);

      args.env.should.equal('custom');
      Environments.custom.uri.should.equal(args.customrooturi);
    });

    it('should configure a custom bitcoin network', () => {
      const args = {
        custombitcoinnetwork: 'custombitcoinnetwork',
        env: null,
      };

      expressApp(args);

      args.env.should.equal('custom');
      Environments.custom.network.should.equal(args.custombitcoinnetwork);
    });

    it('should configure the request proxy for testnet', () => {
      const onStub = sinon.stub();
      sinon.stub(httpProxy, 'createProxyServer').returns({ on: onStub });

      const args = {
        env: 'test'
      };

      expressApp(args);

      httpProxy.createProxyServer.should.have.been.calledOnceWith({ secure: false, timeout: 305 * 1000, proxyTimeout: 305 * 1000 });
      onStub.should.have.been.calledThrice();
      onStub.should.have.been.calledWith('proxyReq');
      onStub.should.have.been.calledWith('error');
      onStub.should.have.been.calledWith('econnreset');

      const onCallback = onStub.args[0][1];

      const setHeaderStub = sinon.stub();

      onCallback({ setHeader: setHeaderStub }, { headers: [] });

      setHeaderStub.should.have.been.calledTwice();
      setHeaderStub.should.have.been.calledWith('host');
      setHeaderStub.should.have.been.calledWith('User-Agent');

      httpProxy.createProxyServer.restore();
    });

    it('should configure the request proxy for mainnet', () => {
      const onStub = sinon.stub();
      sinon.stub(httpProxy, 'createProxyServer').returns({ on: onStub });

      const args = {
        env: 'prod',
        disablessl: true,
        disableenvcheck: true
      };

      expressApp(args);

      httpProxy.createProxyServer.should.have.been.calledOnceWith({ timeout: 305 * 1000, secure: null, proxyTimeout: 305 * 1000 });
      onStub.should.have.been.calledThrice();
      onStub.should.have.been.calledWith('proxyReq');
      onStub.should.have.been.calledWith('error');
      onStub.should.have.been.calledWith('econnreset');

      const onCallback = onStub.args[0][1];

      const setHeaderStub = sinon.stub();

      onCallback({ setHeader: setHeaderStub }, { headers: [] });

      setHeaderStub.should.have.been.calledTwice();
      setHeaderStub.should.have.been.calledWith('host');
      setHeaderStub.should.have.been.calledWith('User-Agent');

      httpProxy.createProxyServer.restore();
    });

    it('should configure the request proxy for testnet with custom timeout', () => {
      const onStub = sinon.stub();
      sinon.stub(httpProxy, 'createProxyServer').returns({ on: onStub });

      const args = {
        env: 'test',
        timeout: 1000
      };

      expressApp(args);

      httpProxy.createProxyServer.should.have.been.calledOnceWith({ timeout: args.timeout, secure: false, proxyTimeout: args.timeout });
      onStub.should.have.been.calledThrice();
      onStub.should.have.been.calledWith('proxyReq');
      onStub.should.have.been.calledWith('error');
      onStub.should.have.been.calledWith('econnreset');

      const onCallback = onStub.args[0][1];

      const setHeaderStub = sinon.stub();

      onCallback({ setHeader: setHeaderStub }, { headers: [] });

      setHeaderStub.should.have.been.calledTwice();
      setHeaderStub.should.have.been.calledWith('host');
      setHeaderStub.should.have.been.calledWith('User-Agent');

      httpProxy.createProxyServer.restore();
    });
  });
});
