import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as sinon from 'sinon';
import 'should';
import { Config, DefaultConfig } from '../../src/config';
import { getBitGoTlsPolicy } from '../../src/tlsPolicy';

const PEM = '-----BEGIN CERTIFICATE-----\nMIIB\n-----END CERTIFICATE-----\n';

describe('getBitGoTlsPolicy', function () {
  let dir: string;
  let bundle: string;

  before(function () {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'express-tls-'));
    bundle = path.join(dir, 'ca.pem');
    fs.writeFileSync(bundle, PEM);
  });

  after(function () {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  afterEach(function () {
    sinon.restore();
  });

  const cfg = (overrides: Partial<Config> = {}): Config => ({ ...DefaultConfig, ...overrides });

  it('is disabled when nothing is configured', function () {
    (getBitGoTlsPolicy(cfg()) === undefined).should.be.true();
  });

  it('covers the host of the configured environment by default', function () {
    const policy = getBitGoTlsPolicy(cfg({ env: 'prod', bitgoCaBundlePath: bundle }));
    policy!.appliesTo('https://app.bitgo.com/api/v2/ping').should.be.true();
    policy!.appliesTo('https://api.etherscan.io/v2').should.be.false();
  });

  it('covers a custom root URI and extra hosts', function () {
    const policy = getBitGoTlsPolicy(
      cfg({
        customRootUri: 'https://bitgo.internal.example',
        bitgoCaBundlePath: bundle,
        bitgoTlsHosts: ['.cdn.example'],
      })
    );
    policy!.appliesTo('https://bitgo.internal.example/x').should.be.true();
    policy!.appliesTo('https://a.cdn.example/x').should.be.true();
    policy!.appliesTo('https://app.bitgo.com').should.be.false();
  });

  it('supports pins without a CA bundle', function () {
    const policy = getBitGoTlsPolicy(cfg({ bitgoSpkiPins: ['abc='] }));
    (policy !== undefined).should.be.true();
  });

  it('returns the same policy for the same config', function () {
    const c = cfg({ bitgoCaBundlePath: bundle });
    (getBitGoTlsPolicy(c) === getBitGoTlsPolicy(c)).should.be.true();
  });

  it('fails when the bundle is missing or has no certificates', function () {
    (() => getBitGoTlsPolicy(cfg({ bitgoCaBundlePath: path.join(dir, 'missing.pem') }))).should.throw(/ENOENT/);
    const empty = path.join(dir, 'empty.pem');
    fs.writeFileSync(empty, 'garbage');
    (() => getBitGoTlsPolicy(cfg({ bitgoCaBundlePath: empty }))).should.throw(/no PEM certificates/);
  });

  it('refuses to run with BITGO_USE_PROXY', function () {
    sinon.stub(process, 'env').value({ BITGO_USE_PROXY: 'http://proxy:1' });
    (() => getBitGoTlsPolicy(cfg({ bitgoCaBundlePath: bundle }))).should.throw(/BITGO_USE_PROXY/);
  });
});
