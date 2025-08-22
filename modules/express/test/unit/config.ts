// eslint-disable-next-line
/// <reference types="mocha" />
// eslint-disable-next-line
/// <reference types="node" />
import * as should from 'should';
import * as sinon from 'sinon';

import { DefaultConfig } from '../../src/config';
import * as args from '../../src/args';
import proxyquire from 'proxyquire';

describe('Config:', () => {
  it('should take command line config options', () => {
    const { config: proxyConfig } = proxyquire('../../src/config', {
      './args': {
        args: () => {
          return {
            port: 12345,
          };
        },
      },
    });
    proxyConfig().port.should.equal(12345);
  });

  it('should take environment variable config options', () => {
    const envStub = sinon.stub(process, 'env').value({ BITGO_PORT: '12345' });
    const { config: proxyConfig } = proxyquire('../../src/config', {
      './args': {
        args: () => {
          return {};
        },
      },
    });
    proxyConfig().port.should.equal(12345);
    envStub.restore();
  });

  it('should fall back to default config options', () => {
    const { config: proxyConfig } = proxyquire('../../src/config', {
      './args': {
        args: () => {
          return {};
        },
      },
    });
    proxyConfig().port.should.equal(DefaultConfig.port);
  });

  it('should correctly handle config precedence', () => {
    const envStub = sinon.stub(process, 'env').value({ BITGO_PORT: '12345' });
    const { config: proxyConfig } = proxyquire('../../src/config', {
      './args': {
        args: () => {
          return { port: 23456 };
        },
      },
    });
    proxyConfig().port.should.equal(23456);
    envStub.restore();
  });

  it('should transform urls to secure urls when disableSSL is undefined', () => {
    const envStub = sinon
      .stub(process, 'env')
      .value({ BITGO_DISABLE_SSL: undefined, BITGO_CUSTOM_ROOT_URI: 'test.com' });
    const { config: proxyConfig } = proxyquire('../../src/config', {
      './args': {
        args: () => {
          return { disableSSL: undefined, customrooturi: 'test.com' };
        },
      },
    });
    proxyConfig().disableSSL.should.equal(false);
    proxyConfig().should.have.property('customRootUri', 'https://test.com');
    envStub.restore();
  });

  it('should transform urls to secure urls when disableSSL is false', () => {
    const envStub = sinon.stub(process, 'env').value({ BITGO_DISABLE_SSL: false, BITGO_CUSTOM_ROOT_URI: 'test.com' });
    const { config: proxyConfig } = proxyquire('../../src/config', {
      './args': {
        args: () => {
          return { disableSSL: false, customrooturi: 'test.com' };
        },
      },
    });
    proxyConfig().disableSSL.should.equal(false);
    proxyConfig().should.have.property('customRootUri', 'https://test.com');
    envStub.restore();
  });

  it('should not transform urls to secure urls when disableSSL is true', () => {
    const envStub = sinon.stub(process, 'env').value({ BITGO_DISABLE_SSL: true, BITGO_CUSTOM_ROOT_URI: 'test.com' });
    const { config: proxyConfig } = proxyquire('../../src/config', {
      './args': {
        args: () => {
          return { disableSSL: true, customrooturi: 'test.com' };
        },
      },
    });
    proxyConfig().disableSSL.should.equal(true);
    proxyConfig().should.have.property('customRootUri', 'test.com');
    envStub.restore();
  });

  it('should correctly handle config precedence for a complete config', () => {
    const envStub = sinon.stub(process, 'env').value({
      BITGO_PORT: 'env12345',
      BITGO_BIND: 'envbind',
      BITGO_IPC: 'envipc',
      BITGO_ENV: 'envenv',
      BITGO_DEBUG_NAMESPACE: 'envdebug',
      BITGO_KEYPATH: 'envkeypath',
      BITGO_CRTPATH: 'envcrtpath',
      BITGO_SSL_KEY: 'sslkey',
      BITGO_SSL_CERT: 'sslcert',
      BITGO_LOGFILE: 'envlogfile',
      BITGO_DISABLE_SSL: 'envdisableSSL',
      BITGO_DISABLE_PROXY: 'envdisableProxy',
      BITGO_DISABLE_ENV_CHECK: 'envdisableEnvCheck',
      BITGO_TIMEOUT: 'envtimeout',
      BITGO_CUSTOM_ROOT_URI: 'envcustomRootUri',
      BITGO_CUSTOM_BITCOIN_NETWORK: 'envcustomBitcoinNetwork',
      BITGO_EXTERNAL_SIGNER_URL: 'envexternalSignerUrl',
      BITGO_ENCLAVED_EXPRESS_URL: 'envenclavedExpressUrl',
      BITGO_ENCLAVED_EXPRESS_SSL_CERT: 'envenclavedExpressSSLCert',
      BITGO_SIGNER_MODE: 'envsignerMode',
      BITGO_SIGNER_FILE_SYSTEM_PATH: 'envsignerFileSystemPath',
      BITGO_LIGHTNING_SIGNER_FILE_SYSTEM_PATH: 'envlightningSignerFileSystemPath',
      BITGO_KEEP_ALIVE_TIMETOUT: 'envkeepalivetimeout',
      BITGO_HEADERS_TIMETOUT: 'envheaderstimeout',
    });

    const { config: proxyConfig } = proxyquire('../../src/config', {
      './args': {
        args: () => {
          return {
            port: 23456,
            bind: 'argbind',
            ipc: 'argipc',
            env: 'argenv',
            debugnamespace: 'argdebug',
            keypath: 'argkeypath',
            crtpath: 'argcrtpath',
            logfile: 'arglogfile',
            disablessl: 'argdisableSSL',
            disableproxy: 'argdisableProxy',
            disableenvcheck: 'argdisableEnvCheck',
            timeout: 'argtimeout',
            customrooturi: 'argcustomRootUri',
            custombitcoinnetwork: 'argcustomBitcoinNetwork',
            externalSignerUrl: 'argexternalSignerUrl',
            enclavedExpressUrl: 'argenclavedExpressUrl',
            enclavedExpressSSLCert: 'argenclavedExpressSSLCert',
            signerMode: 'argsignerMode',
            signerFileSystemPath: 'argsignerFileSystemPath',
            lightningSignerFileSystemPath: 'arglightningSignerFileSystemPath',
            keepalivetimeout: 'argkeepalivetimeout',
            headerstimeout: 'argheaderstimeout',
          };
        },
      },
    });
    proxyConfig().should.eql({
      port: 23456,
      bind: 'argbind',
      ipc: 'argipc',
      env: 'argenv',
      debugNamespace: 'argdebug',
      keyPath: 'argkeypath',
      crtPath: 'argcrtpath',
      sslKey: 'sslkey',
      sslCert: 'sslcert',
      logFile: 'arglogfile',
      disableSSL: 'argdisableSSL',
      disableProxy: 'argdisableProxy',
      disableEnvCheck: 'argdisableEnvCheck',
      timeout: 'argtimeout',
      customRootUri: 'https://argcustomRootUri',
      customBitcoinNetwork: 'argcustomBitcoinNetwork',
      authVersion: 2,
      externalSignerUrl: 'https://argexternalSignerUrl',
      enclavedExpressUrl: 'https://argenclavedExpressUrl',
      enclavedExpressSSLCert: 'argenclavedExpressSSLCert',
      signerMode: 'argsignerMode',
      signerFileSystemPath: 'argsignerFileSystemPath',
      lightningSignerFileSystemPath: 'arglightningSignerFileSystemPath',
      keepAliveTimeout: 'argkeepalivetimeout',
      headersTimeout: 'argheaderstimeout',
    });
    envStub.restore();
  });

  it('should correctly handle boolean config precedence', () => {
    const envStub = sinon.stub(process, 'env').value({ BITGO_DISABLE_SSL: undefined });
    const { config: proxyConfig } = proxyquire('../../src/config', {
      './args': {
        args: () => {
          return { disablessl: true };
        },
      },
    });
    proxyConfig().disableSSL.should.equal(true);
    envStub.restore();
  });

  it('should allow all DISABLE_SSL option forms, including deprecated', () => {
    const optionForms = [
      { deprecated: true, DISABLESSL: true },
      { deprecated: true, DISABLE_SSL: true },
      { BITGO_DISABLE_SSL: true },
      { deprecated: true, BITGO_DISABLESSL: true },
    ];

    for (const { deprecated, ...form } of optionForms) {
      const envStub = sinon.stub(process, 'env').value(form);
      const consoleStub = sinon.stub(console, 'warn').returns(undefined);
      const { config: proxyConfig } = proxyquire('../../src/config', {
        './args': {
          args: () => {
            return {};
          },
        },
      });
      proxyConfig().disableSSL.should.equal(true);
      envStub.restore();
      consoleStub.restore();
      if (deprecated) {
        consoleStub.calledOnceWithExactly(sinon.match(/deprecated environment variable/)).should.be.true();
      }
    }
  });

  it('should allow all DISABLE_PROXY option forms, including deprecated', () => {
    const optionForms = [{ deprecated: true, DISABLE_PROXY: true }, { BITGO_DISABLE_PROXY: true }];

    for (const { deprecated = false, ...form } of optionForms) {
      const envStub = sinon.stub(process, 'env').value(form);
      const consoleStub = sinon.stub(console, 'warn').returns(undefined);
      const { config: proxyConfig } = proxyquire('../../src/config', {
        './args': {
          args: () => {
            return {};
          },
        },
      });
      proxyConfig().disableProxy.should.equal(true);
      envStub.restore();
      consoleStub.restore();
      if (deprecated) {
        consoleStub.calledOnceWithExactly(sinon.match(/deprecated environment variable/)).should.be.true();
      }
    }
  });

  it('should allow all DISABLE_ENV_CHECK option forms, including deprecated', () => {
    const optionForms = [{ BITGO_DISABLE_ENV_CHECK: true }, { deprecated: true, DISABLE_ENV_CHECK: true }];

    for (const { deprecated = false, ...form } of optionForms) {
      const envStub = sinon.stub(process, 'env').value(form);
      const consoleStub = sinon.stub(console, 'warn').returns(undefined);
      const { config: proxyConfig } = proxyquire('../../src/config', {
        './args': {
          args: () => {
            return {};
          },
        },
      });
      proxyConfig().disableEnvCheck.should.equal(true);
      envStub.restore();
      consoleStub.restore();
      if (deprecated) {
        consoleStub.calledOnceWithExactly(sinon.match(/deprecated environment variable/)).should.be.true();
      }
    }
  });

  it('should set omitted boolean command line args to null and not false', () => {
    const argvStub = sinon.stub(process, 'argv').value([process.argv[0]]);
    const parsed = args.args();
    should.not.exist(parsed.disablessl);
    should.not.exist(parsed.disableenvcheck);
    should.not.exist(parsed.disableproxy);
    argvStub.restore();
  });
});
