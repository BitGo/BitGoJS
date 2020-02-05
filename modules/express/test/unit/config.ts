// eslint-disable-next-line
/// <reference types="mocha" />
// eslint-disable-next-line
/// <reference types="node" />
import 'should';
import * as sinon from 'sinon';

import { config, DefaultConfig } from '../../src/config';
import * as args from '../../src/args';

describe('Config:', () => {
  it('should take command line config options', () => {
    const argStub = sinon.stub(args, 'args').returns({ port: 12345 });
    config().port.should.equal(12345);
    argStub.restore();
  });

  it('should take environment variable config options', () => {
    const argStub = sinon.stub(args, 'args').returns({});
    const envStub = sinon.stub(process, 'env').value({ BITGO_PORT: '12345' });
    config().port.should.equal(12345);
    argStub.restore();
    envStub.restore();
  });

  it('should fall back to default config options', () => {
    const argStub = sinon.stub(args, 'args').returns({});
    config().port.should.equal(DefaultConfig.port);
    argStub.restore();
  });

  it('should correctly handle config precedence', () => {
    const argStub = sinon.stub(args, 'args').returns({ port: 23456 });
    const envStub = sinon.stub(process, 'env').value({ BITGO_PORT: '12345' });
    config().port.should.equal(23456);
    argStub.restore();
    envStub.restore();
  });

  it('should correctly handle boolean config precedence', () => {
    const argStub = sinon.stub(args, 'args').returns({ disablessl: true });
    const envStub = sinon.stub(process, 'env').value({ BITGO_DISABLE_SSL: undefined });
    config().disableSSL.should.equal(true);
    argStub.restore();
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
      const argStub = sinon.stub(args, 'args').returns({});
      const envStub = sinon.stub(process, 'env').value(form);
      const consoleStub = sinon.stub(console, 'warn').returns(undefined);
      config().disableSSL.should.equal(true);
      argStub.restore();
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
      const argStub = sinon.stub(args, 'args').returns({});
      const envStub = sinon.stub(process, 'env').value(form);
      const consoleStub = sinon.stub(console, 'warn').returns(undefined);
      config().disableProxy.should.equal(true);
      argStub.restore();
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
      const argStub = sinon.stub(args, 'args').returns({});
      const envStub = sinon.stub(process, 'env').value(form);
      const consoleStub = sinon.stub(console, 'warn').returns(undefined);
      config().disableEnvCheck.should.equal(true);
      argStub.restore();
      envStub.restore();
      consoleStub.restore();
      if (deprecated) {
        consoleStub.calledOnceWithExactly(sinon.match(/deprecated environment variable/)).should.be.true();
      }
    }
  });
});
