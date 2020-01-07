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
    const envStub = sinon.stub(process, 'env').value({ DISABLE_SSL: undefined });
    config().disableSSL.should.equal(true);
    argStub.restore();
    envStub.restore();
  });

  it('should allow DISABLE_SSL option', () => {
    const argStub = sinon.stub(args, 'args').returns({});
    const envStub = sinon.stub(process, 'env').value({ DISABLE_SSL: true });
    config().disableSSL.should.equal(true);
    argStub.restore();
    envStub.restore();
  });

  it('should also allow DISABLESSL option', () => {
    const argStub = sinon.stub(args, 'args').returns({});
    const envStub = sinon.stub(process, 'env').value({ DISABLESSL: true });
    config().disableSSL.should.equal(true);
    argStub.restore();
    envStub.restore();
  });
});
