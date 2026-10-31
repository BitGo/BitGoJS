import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as sinon from 'sinon';
import { execFileSync } from 'child_process';
import 'should';
import { Config, DefaultConfig } from '../../src/config';
import { TlsConfigurationError } from '../../src/errors';
import { BITGO_DEFAULT_TLS_HOSTS, getBitGoTlsPolicy } from '../../src/tlsPolicy';

describe('getBitGoTlsPolicy', function () {
  let dir: string;
  let shortLivedBundle: string;

  before(function () {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'express-tls-'));
    shortLivedBundle = path.join(dir, 'ca.pem');
    execFileSync(
      'openssl',
      [
        'req',
        '-x509',
        '-newkey',
        'rsa:2048',
        '-nodes',
        '-keyout',
        path.join(dir, 'ca.key'),
        '-out',
        shortLivedBundle,
        '-subj',
        '/CN=test CA',
        '-days',
        '2',
        '-addext',
        'basicConstraints=critical,CA:TRUE',
      ],
      { stdio: 'pipe' }
    );
  });

  let savedEnv: NodeJS.ProcessEnv;

  beforeEach(function () {
    // getBitGoTlsPolicy reads the real environment; keep a developer/CI shell that exports these from
    // changing results. Tests that need them stub process.env explicitly.
    savedEnv = process.env;
    process.env = { ...savedEnv };
    delete process.env.BITGO_USE_PROXY;
    delete process.env.NODE_EXTRA_CA_CERTS;
  });

  afterEach(function () {
    sinon.restore();
    process.env = savedEnv;
  });

  after(function () {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  const cfg = (overrides: Partial<Config> = {}): Config => ({ ...DefaultConfig, ...overrides });

  it('is enabled by default, covers all official BitGo domains (apex + subdomains), and does not warn on healthy CAs', function () {
    const warnStub = sinon.stub(console, 'warn');
    const policy = getBitGoTlsPolicy(cfg());
    (policy !== undefined).should.be.true();
    warnStub.notCalled.should.be.true();
    for (const host of [
      'bitgo.com',
      'app.bitgo.com',
      'admin.bitgo.com',
      'cdn.bitgo.com',
      'bitgo-test.com',
      'app.bitgo-test.com',
      'admin.bitgo-test.com',
      'bitgo-staging.com',
      'app.bitgo-staging.com',
      'admin.bitgo-staging.com',
      'bitgo-dev.com',
      'app.bitgo-dev.com',
      'admin.bitgo-dev.com',
    ]) {
      policy!.appliesTo(`https://${host}/api/v2/ping`).should.be.true();
    }
    policy!.appliesTo('https://api.etherscan.io/v2').should.be.false();
    policy!.appliesTo('https://localhost:3000/api/v2').should.be.false();
    BITGO_DEFAULT_TLS_HOSTS.length.should.equal(8);
  });

  it('can be opted out with disablePinCerts (--disablepincerts / BITGO_DISABLE_PIN_CERTS) and logs a warning', function () {
    const warnStub = sinon.stub(console, 'warn');
    const policy = getBitGoTlsPolicy(cfg({ disablePinCerts: true }));
    (policy === undefined).should.be.true();
    warnStub.calledWith(sinon.match(/disablePinCerts/)).should.be.true();
  });

  it('returns the same policy for the same config', function () {
    const c = cfg();
    getBitGoTlsPolicy(c)!.should.equal(getBitGoTlsPolicy(c));
  });

  it('logs startup warnings only once per config for disablePinCerts and BITGO_USE_PROXY', function () {
    const warnStub = sinon.stub(console, 'warn');
    const disabled = cfg({ disablePinCerts: true });
    getBitGoTlsPolicy(disabled);
    getBitGoTlsPolicy(disabled);
    warnStub.callCount.should.equal(1);
    warnStub.resetHistory();

    sinon.stub(process, 'env').value({ BITGO_USE_PROXY: 'http://proxy:1' });
    const proxyCfg = cfg();
    getBitGoTlsPolicy(proxyCfg);
    getBitGoTlsPolicy(proxyCfg);
    warnStub.callCount.should.equal(1);
  });

  it('warns at startup when NODE_EXTRA_CA_CERTS is set', function () {
    sinon.stub(process, 'env').value({ NODE_EXTRA_CA_CERTS: '/etc/ssl/corp-ca.pem' });
    const warnStub = sinon.stub(console, 'warn');
    const policy = getBitGoTlsPolicy(cfg());
    (policy !== undefined).should.be.true();
    warnStub.calledWith(sinon.match(/NODE_EXTRA_CA_CERTS/)).should.be.true();
  });

  it('skips CA pinning with a startup warning when BITGO_USE_PROXY is set', function () {
    sinon.stub(process, 'env').value({ BITGO_USE_PROXY: 'http://proxy:1' });
    const warnStub = sinon.stub(console, 'warn');
    const policy = getBitGoTlsPolicy(cfg());
    (policy === undefined).should.be.true();
    warnStub.calledWith(sinon.match(/BITGO_USE_PROXY/)).should.be.true();
  });

  it('returns a previously built policy from cache even if BITGO_USE_PROXY appears later', function () {
    // prepareBitGo reads BITGO_USE_PROXY per request and omits tlsPolicy when it is set, so a cached
    // policy is safe to return here; the runtime proxy guard lives in clientRoutes.
    const c = cfg();
    (getBitGoTlsPolicy(c) !== undefined).should.be.true();
    sinon.stub(process, 'env').value({ BITGO_USE_PROXY: 'http://proxy:1' });
    (getBitGoTlsPolicy(c) !== undefined).should.be.true();
  });

  it('warns on bundle CAs expiring within 30 days', function () {
    const warnStub = sinon.stub(console, 'warn');
    const policy = getBitGoTlsPolicy(cfg(), shortLivedBundle);
    (policy !== undefined).should.be.true();
    warnStub.calledWith(sinon.match(/expires in/)).should.be.true();
  });

  it('raises TlsConfigurationError when the bundle is missing or invalid', function () {
    (() => getBitGoTlsPolicy(cfg(), path.join(dir, 'missing.pem'))).should.throw(TlsConfigurationError);
    const empty = path.join(dir, 'empty.pem');
    fs.writeFileSync(empty, 'garbage');
    (() => getBitGoTlsPolicy(cfg(), empty)).should.throw(TlsConfigurationError);
  });
});
