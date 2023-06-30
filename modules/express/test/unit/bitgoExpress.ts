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
import { Environments } from 'bitgo';
import { coroutine as co } from 'bluebird';

import { SSL_OP_NO_TLSv1 } from 'constants';
import { TlsConfigurationError, NodeEnvironmentError } from '../../src/errors';

nock.disableNetConnect();

import { app as expressApp, startup, createServer, createBaseUri, prepareIpc } from '../../src/expressApp';
import * as clientRoutes from '../../src/clientRoutes';

describe('Bitgo Express', function () {
  describe('server initialization', function () {
    const validPrvJSON =
      '{"61f039aad587c2000745c687373e0fa9":"xprv9s21ZrQH143K3EuPWCBuqnWxydaQV6et9htQige4EswvcHKEzNmkVmwTwKoadyHzJYppuADB7Us7AbaNLToNvoFoSxuWqndQRYtnNy5DUY2"}';

    it('should require NODE_ENV to be production when running against prod env', function () {
      const envStub = sinon.stub(process, 'env').value({ NODE_ENV: 'production' });

      try {
        (() =>
          expressApp({
            env: 'prod',
            bind: 'localhost',
          } as any)).should.not.throw();

        process.env.NODE_ENV = 'dev';
        (() =>
          expressApp({
            env: 'prod',
            bind: 'localhost',
          } as any)).should.throw(NodeEnvironmentError);
      } finally {
        envStub.restore();
      }
    });

    it('should disable NODE_ENV check if disableenvcheck argument is given', function () {
      const envStub = sinon.stub(process, 'env').value({ NODE_ENV: 'dev' });

      try {
        (() =>
          expressApp({
            env: 'prod',
            bind: 'localhost',
            disableEnvCheck: true,
          } as any)).should.not.throw();
      } finally {
        envStub.restore();
      }
    });

    it('should require TLS for prod env when listening on external interfaces', function () {
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

    it('should require both keypath and crtpath when using TLS, but TLS is not required', function () {
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

    it(
      'should create an http server when not using TLS',
      co(function* () {
        const createServerStub = sinon.stub(http, 'createServer');

        const args: any = {
          env: 'prod',
          bind: 'localhost',
        };

        createServer(args, null as any);

        createServerStub.should.be.calledOnce();
        createServerStub.restore();
      })
    );

    it(
      'should create an https server when using TLS',
      co(function* () {
        const createServerStub = sinon.stub(https, 'createServer');
        const readFileAsyncStub = sinon
          .stub(fs.promises, 'readFile' as any)
          .onFirstCall()
          .resolves('key')
          .onSecondCall()
          .resolves('cert');

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
      })
    );

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

    it('should output signer mode upon server startup', () => {
      const logStub = sinon.stub(console, 'log');

      const args: any = {
        env: 'test',
        signerMode: 'signerMode',
      };

      startup(args, 'base')();

      logStub.should.have.callCount(4);
      logStub.should.have.been.calledWith('BitGo-Express running');
      logStub.should.have.been.calledWith(`Environment: ${args.env}`);
      logStub.should.have.been.calledWith('Base URI: base');
      logStub.should.have.been.calledWith(`External signer mode: ${args.signerMode}`);

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

    it('should fail if IPC option is used on windows', async () => {
      const platformStub = sinon.stub(process, 'platform').value('win32');
      await prepareIpc('testipc').should.be.rejectedWith(/^IPC option is not supported on platform/);
      platformStub.restore();
    });

    it("should not remove the IPC socket if it doesn't exist", async () => {
      const statStub = sinon.stub(fs, 'statSync').throws({ code: 'ENOENT' });
      const unlinkStub = sinon.stub(fs, 'unlinkSync');
      await prepareIpc('testipc').should.be.resolved();
      unlinkStub.notCalled.should.be.true();
      statStub.restore();
      unlinkStub.restore();
    });

    it('should remove the socket before binding if IPC socket exists and is a socket', async () => {
      const statStub = sinon.stub(fs, 'statSync').returns({ isSocket: () => true } as unknown as fs.Stats);
      const unlinkStub = sinon.stub(fs, 'unlinkSync');
      await prepareIpc('testipc').should.be.resolved();
      unlinkStub.calledWithExactly('testipc').should.be.true();
      unlinkStub.calledOnce.should.be.true();
      statStub.restore();
      unlinkStub.restore();
    });

    it('should fail if IPC socket is not actually a socket', async () => {
      const statStub = sinon.stub(fs, 'statSync').returns({ isSocket: () => false } as unknown as fs.Stats);
      const unlinkStub = sinon.stub(fs, 'unlinkSync');
      await prepareIpc('testipc').should.be.rejectedWith(/IPC socket is not actually a socket/);
      unlinkStub.notCalled.should.be.true();
      statStub.restore();
      unlinkStub.restore();
    });

    it('should print the IPC socket path on startup', async () => {
      const logStub = sinon.stub(console, 'log');

      const args: any = {
        env: 'test',
        customRootUri: 'customuri',
        ipc: 'expressIPC',
      };

      startup(args, 'base')();
      logStub.should.have.been.calledWith('IPC path: expressIPC');
      logStub.restore();
    });

    it('should only call setupAPIRoutes when running in regular mode', () => {
      const args: any = {
        env: 'test',
        signerMode: undefined,
      };

      const apiStub = sinon.stub(clientRoutes, 'setupAPIRoutes');
      const signerStub = sinon.stub(clientRoutes, 'setupSigningRoutes');

      expressApp(args);
      apiStub.should.have.been.calledOnce();
      signerStub.called.should.be.false();
      apiStub.restore();
      signerStub.restore();
    });

    it('should only call setupSigningRoutes when running in signer mode', () => {
      const args: any = {
        env: 'test',
        signerMode: 'signerMode',
        signerFileSystemPath: 'signerFileSystemPath',
      };

      const apiStub = sinon.stub(clientRoutes, 'setupAPIRoutes');
      const signerStub = sinon.stub(clientRoutes, 'setupSigningRoutes');
      const readFileStub = sinon.stub(fs, 'readFileSync').returns(validPrvJSON);

      expressApp(args);
      signerStub.should.have.been.calledOnce();
      apiStub.called.should.be.false();
      apiStub.restore();
      signerStub.restore();
      readFileStub.restore();
    });

    it('should require a signerFileSystemPath and signerMode are both set when running in signer mode', function () {
      const args: any = {
        env: 'test',
        signerMode: 'signerMode',
        signerFileSystemPath: undefined,
      };

      (() => expressApp(args)).should.throw({
        name: 'ExternalSignerConfigError',
        message: 'signerMode and signerFileSystemPath must both be set in order to run in external signing mode.',
      });

      args.signerMode = undefined;
      args.signerFileSystemPath = 'signerFileSystemPath';
      (() => expressApp(args)).should.throw({
        name: 'ExternalSignerConfigError',
        message: 'signerMode and signerFileSystemPath must both be set in order to run in external signing mode.',
      });

      const readFileStub = sinon.stub(fs, 'readFileSync').returns(validPrvJSON);
      args.signerMode = 'signerMode';
      (() => expressApp(args)).should.not.throw();

      readFileStub.restore();
    });

    it('should require that an externalSignerUrl and signerMode are not both set', function () {
      const args: any = {
        env: 'test',
        signerMode: 'signerMode',
        externalSignerUrl: 'externalSignerUrl',
      };
      (() => expressApp(args)).should.throw({
        name: 'ExternalSignerConfigError',
        message: 'signerMode or signerFileSystemPath is set, but externalSignerUrl is also set.',
      });

      args.signerMode = undefined;
      (() => expressApp(args)).should.not.throw();
    });

    it('should require that an signerFileSystemPath contains a parsable json', function () {
      const args: any = {
        env: 'test',
        signerMode: 'signerMode',
        signerFileSystemPath: 'invalidSignerFileSystemPath',
      };
      (() => expressApp(args)).should.throw();

      const invalidPrv = '{"invalid json"}';
      const readInvalidStub = sinon.stub(fs, 'readFileSync').returns(invalidPrv);
      (() => expressApp(args)).should.throw();
      readInvalidStub.restore();

      const readValidStub = sinon.stub(fs, 'readFileSync').returns(validPrvJSON);
      (() => expressApp(args)).should.not.throw();
      readValidStub.restore();
    });
  });
});
