// eslint-disable-next-line
/// <reference types="mocha" />
import * as should from 'should';
import 'should-http';
import 'should-sinon';
import '../lib/asserts';

import * as nock from 'nock';
import * as sinon from 'sinon';

import * as fs from 'fs';
import * as http from 'http';
import * as https from 'https';
import * as debugLib from 'debug';
import * as path from 'path';
import * as httpProxy from 'http-proxy';
import { Environments } from 'bitgo';
import { coroutine as co } from 'bluebird';

// eslint-disable-next-line @typescript-eslint/camelcase
import { SSL_OP_NO_TLSv1 } from 'constants';
import { TlsConfigurationError, NodeEnvironmentError } from '../../src/errors';

nock.disableNetConnect();

import {
  app as expressApp,
  startup,
  createServer,
  createBaseUri
} from '../../src/expressApp';

describe('Bitgo Express', function() {

  describe('server initialization', function() {

    it('should require NODE_ENV to be production when running against prod env', function() {
      const envStub = sinon.stub(process, 'env').value({ NODE_ENV: 'production' });

      try {
        (() => expressApp({
          env: 'prod',
          bind: 'localhost',
        } as any)).should.not.throw();

        process.env.NODE_ENV = 'dev';
        (() => expressApp({
          env: 'prod',
          bind: 'localhost',
        } as any)).should.throw(NodeEnvironmentError);
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
          disableEnvCheck: true,
        } as any)).should.not.throw();
      } finally {
        envStub.restore();
      }
    });

    it('should require TLS for prod env when listening on external interfaces', function() {
      const args: any = {
        env: 'prod',
        bind: '1',
        disableEnvCheck: true,
        disableSSL: false,
        crtPath: undefined as string | undefined,
        keyPath: undefined as string | undefined,
      };

      (() => expressApp(args)).should.throw(TlsConfigurationError);

      args.bind = 'localhost';
      (() => expressApp(args)).should.not.throw();

      args.bind = '1';
      args.env = 'test';
      (() => expressApp(args)).should.not.throw();

      args.disableSSL = true;
      args.env = 'prod';
      (() => expressApp(args)).should.not.throw();

      delete args.disableSSL;
      args.crtPath = '/tmp/cert.pem';
      (() => expressApp(args)).should.throw(TlsConfigurationError);

      delete args.crtPath;
      args.keyPath = '/tmp/key.pem';
      (() => expressApp(args)).should.throw(TlsConfigurationError);
    });

    it('should require both keypath and crtpath when using TLS, but TLS is not required', function() {
      const args: any = {
        env: 'test',
        bind: '1',
        keyPath: '/tmp/key.pem',
        crtPath: undefined as string | undefined,
      };

      (() => expressApp(args)).should.throw(TlsConfigurationError);

      delete args.keyPath;
      args.crtPath = '/tmp/cert.pem';

      (() => expressApp(args)).should.throw(TlsConfigurationError);
    });

    it('should create an http server when not using TLS', co(function *() {
      const createServerStub = sinon.stub(http, 'createServer');

      const args: any = {
        env: 'prod',
        bind: 'localhost',
      };

      createServer(args, null as any);

      createServerStub.should.be.calledOnce();
      createServerStub.restore();
    }));

    it('should create an https server when using TLS', co(function *() {
      const createServerStub = sinon.stub(https, 'createServer');
      const readFileAsyncStub = sinon.stub(fs, 'readFileAsync' as any)
        .onFirstCall().resolves('key')
        .onSecondCall().resolves('cert');

      const args: any = {
        env: 'prod',
        bind: '1.2.3.4',
        crtPath: '/tmp/crt.pem',
        keyPath: '/tmp/key.pem',
      };

      yield createServer(args, null as any);

      https.createServer.should.be.calledOnce();
      https.createServer.should.be.calledWith({ secureOptions: SSL_OP_NO_TLSv1, key: 'key', cert: 'cert' });

      createServerStub.restore();
      readFileAsyncStub.restore();
    }));

    it('should output basic information upon server startup', () => {
      const logStub = sinon.stub(console, 'log');

      const args: any = {
        env: 'test',
      };

      startup(args, 'base')();

      logStub.should.have.callCount(3);
      logStub.should.have.been.calledWith('BitGo-Express running');
      logStub.should.have.been.calledWith(`Environment: ${args.env}`);
      logStub.should.have.been.calledWith('Base URI: base');

      logStub.restore();
    });

    it('should output custom root uri information upon server startup', () => {
      const logStub = sinon.stub(console, 'log');

      const args: any = {
        env: 'test',
        customRootUri: 'customuri',
      };

      startup(args, 'base')();

      logStub.should.have.callCount(4);
      logStub.should.have.been.calledWith('BitGo-Express running');
      logStub.should.have.been.calledWith(`Environment: ${args.env}`);
      logStub.should.have.been.calledWith('Base URI: base');
      logStub.should.have.been.calledWith(`Custom root URI: ${args.customRootUri}`);

      logStub.restore();
    });

    it('should output custom bitcoin network information upon server startup', () => {
      const logStub = sinon.stub(console, 'log');

      const args: any = {
        env: 'test',
        customBitcoinNetwork: 'customnetwork',
      };

      startup(args, 'base')();

      logStub.should.have.callCount(4);
      logStub.should.have.been.calledWith('BitGo-Express running');
      logStub.should.have.been.calledWith(`Environment: ${args.env}`);
      logStub.should.have.been.calledWith('Base URI: base');
      logStub.should.have.been.calledWith(`Custom bitcoin network: ${args.customBitcoinNetwork}`);

      logStub.restore();
    });

    it('should create http base URIs', () => {
      const args: any = {
        bind: '1',
        port: 2,
      };

      createBaseUri(args).should.equal(`http://${args.bind}:${args.port}`);

      args.port = 80;
      createBaseUri(args).should.equal(`http://${args.bind}`);

      args.port = 443;
      createBaseUri(args).should.equal(`http://${args.bind}:443`);
    });

    it('should create https base URIs', () => {
      const args: any = {
        bind: '6',
        port: 8,
        keyPath: '3',
        crtPath: '4',
      };

      createBaseUri(args).should.equal(`https://${args.bind}:${args.port}`);

      args.port = 80;
      createBaseUri(args).should.equal(`https://${args.bind}:80`);

      args.port = 443;
      createBaseUri(args).should.equal(`https://${args.bind}`);
    });

    it('should set up logging with a logfile', () => {
      const resolveSpy = sinon.spy(path, 'resolve');
      const createWriteStreamSpy = sinon.spy(fs, 'createWriteStream');
      const logStub = sinon.stub(console, 'log');

      const args: any = {
        logFile: '/dev/null',
        disableProxy: true,
      };

      expressApp(args);

      path.resolve.should.have.been.calledWith(args.logFile);
      fs.createWriteStream.should.have.been.calledOnceWith(args.logFile, { flags: 'a' });
      logStub.should.have.been.calledOnceWith(`Log location: ${args.logFile}`);

      resolveSpy.restore();
      createWriteStreamSpy.restore();
      logStub.restore();
    });

    it('should enable specified debug namespaces', () => {
      const enableStub = sinon.stub(debugLib, 'enable');

      const args: any = {
        debugNamespace: ['a', 'b'],
        disableProxy: true,
      };

      expressApp(args);

      enableStub.should.have.been.calledTwice();
      enableStub.should.have.been.calledWith(args.debugNamespace[0]);
      enableStub.should.have.been.calledWith(args.debugNamespace[1]);

      enableStub.restore();
    });

    it('should configure a custom root URI', () => {
      const args: any = {
        customRootUri: 'customroot',
        env: undefined as string | undefined,
      };

      expressApp(args);

      should(args.env).equal('custom');
      Environments.custom.uri.should.equal(args.customRootUri);
    });

    it('should configure a custom bitcoin network', () => {
      const args: any = {
        customBitcoinNetwork: 'custombitcoinnetwork',
        env: undefined as string | undefined,
      };

      expressApp(args);

      should(args.env).equal('custom');
      Environments.custom.network.should.equal(args.customBitcoinNetwork);
    });

    it('should configure the request proxy for testnet', () => {
      const onStub = sinon.stub();
      const createProxyServerStub = sinon.stub(httpProxy, 'createProxyServer')
        .returns({ on: onStub } as any);

      const timeout = 100000;
      const args: any = {
        env: 'test',
        timeout,
      };

      expressApp(args);

      createProxyServerStub.should.have.been.calledOnceWith({ secure: false, timeout, proxyTimeout: timeout });
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

      createProxyServerStub.restore();
    });

    it('should configure the request proxy for mainnet', () => {
      const onStub = sinon.stub();
      const createProxyServerStub = sinon.stub(httpProxy, 'createProxyServer')
        .returns({ on: onStub } as any);

      const args: any = {
        env: 'prod',
        disableSSL: true,
        disableEnvCheck: true,
        timeout: 305 * 1000,
      };

      expressApp(args);

      createProxyServerStub.should.have.been.calledOnceWith({ timeout: 305 * 1000, secure: true, proxyTimeout: 305 * 1000 });
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

      createProxyServerStub.restore();
    });

    it('should configure the request proxy for testnet with custom timeout', () => {
      const onStub = sinon.stub();
      const createProxyServerStub = sinon.stub(httpProxy, 'createProxyServer')
        .returns({ on: onStub } as any);

      const args: any = {
        env: 'test',
        timeout: 1000,
      };

      expressApp(args);

      createProxyServerStub.should.have.been.calledOnceWith({ timeout: args.timeout, secure: false, proxyTimeout: args.timeout });
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

      createProxyServerStub.restore();
    });
  });
});
