import * as assert from 'assert';
import * as nock from 'nock';
import { execFileSync } from 'child_process';
import * as fs from 'fs';
import * as http from 'http';
import * as https from 'https';
import * as os from 'os';
import * as path from 'path';
import * as crypto from 'crypto';
import { BitGoAPI } from '../../src/bitgoAPI';
import { createBitGoTlsPolicy, spkiPin } from '../../src/tlsPolicy';

class TestableBitGoAPI extends BitGoAPI {
  req(url: string) {
    return this.getAgentRequest('get', url);
  }
}

function openssl(cwd: string, ...args: string[]): void {
  execFileSync('openssl', args, { cwd, stdio: 'pipe' });
}

interface Pki {
  caPem: string;
  leafKey: string;
  leafPem: string;
  leafPin: string;
}

function makePki(dir: string, name: string): Pki {
  openssl(
    dir,
    'req',
    '-x509',
    '-newkey',
    'rsa:2048',
    '-nodes',
    '-keyout',
    `${name}-ca.key`,
    '-out',
    `${name}-ca.pem`,
    '-subj',
    `/CN=${name} CA`,
    '-days',
    '2',
    '-addext',
    'basicConstraints=critical,CA:TRUE'
  );
  openssl(
    dir,
    'req',
    '-newkey',
    'rsa:2048',
    '-nodes',
    '-keyout',
    `${name}-leaf.key`,
    '-out',
    `${name}-leaf.csr`,
    '-subj',
    '/CN=localhost'
  );
  fs.writeFileSync(path.join(dir, `${name}-ext.cnf`), 'subjectAltName=DNS:localhost\nbasicConstraints=CA:FALSE\n');
  openssl(
    dir,
    'x509',
    '-req',
    '-in',
    `${name}-leaf.csr`,
    '-CA',
    `${name}-ca.pem`,
    '-CAkey',
    `${name}-ca.key`,
    '-CAcreateserial',
    '-out',
    `${name}-leaf.pem`,
    '-days',
    '2',
    '-extfile',
    `${name}-ext.cnf`
  );
  const read = (f: string) => fs.readFileSync(path.join(dir, f), 'utf8');
  const leafPem = read(`${name}-leaf.pem`);
  return {
    caPem: read(`${name}-ca.pem`),
    leafKey: read(`${name}-leaf.key`),
    leafPem,
    leafPin: spkiPin(new crypto.X509Certificate(leafPem)),
  };
}

function listen(pki: Pki, handler: http.RequestListener): Promise<{ server: https.Server; url: string }> {
  return new Promise((resolve) => {
    const server = https.createServer({ key: pki.leafKey, cert: pki.leafPem }, handler);
    server.listen(0, '127.0.0.1', () => {
      resolve({ server, url: `https://localhost:${(server.address() as { port: number }).port}` });
    });
  });
}

describe('BitGo TLS policy', function () {
  let dir: string;
  let trusted: Pki;
  let rogue: Pki;
  const servers: https.Server[] = [];

  before(function () {
    nock.enableNetConnect();
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tls-policy-'));
    trusted = makePki(dir, 'trusted');
    rogue = makePki(dir, 'rogue');
  });

  afterEach(function () {
    servers.splice(0).forEach((s) => s.close());
  });

  after(function () {
    nock.disableNetConnect();
    fs.rmSync(dir, { recursive: true, force: true });
  });

  async function serve(pki: Pki, handler: http.RequestListener = (_req, res) => res.end('ok')) {
    const s = await listen(pki, handler);
    servers.push(s.server);
    return s.url;
  }

  function api(options: { spkiPins?: string[]; hosts?: string[] } = {}) {
    const tlsPolicy = createBitGoTlsPolicy({
      ca: trusted.caPem,
      hosts: options.hosts ?? ['localhost'],
      spkiPins: options.spkiPins,
    });
    return new TestableBitGoAPI({ env: 'test', tlsPolicy });
  }

  it('accepts a certificate issued by the approved CA', async function () {
    const url = await serve(trusted);
    const res = await api().req(url);
    assert.strictEqual(res.text, 'ok');
  });

  it('rejects a certificate issued by an unapproved CA', async function () {
    const url = await serve(rogue);
    await assert.rejects(api().req(url), /unable to verify|self.signed|UNABLE_TO_GET_ISSUER/i);
  });

  it('accepts a matching SPKI pin and ignores extra backup pins', async function () {
    const url = await serve(trusted);
    const res = await api({ spkiPins: [trusted.leafPin, 'backup+pin+not+yet+deployed='] }).req(url);
    assert.strictEqual(res.text, 'ok');
  });

  it('accepts a pin on the issuing CA key, which survives leaf rotation', async function () {
    const url = await serve(trusted);
    const caPin = spkiPin(new crypto.X509Certificate(trusted.caPem));
    const res = await api({ spkiPins: [caPin] }).req(url);
    assert.strictEqual(res.text, 'ok');
  });

  it('rejects a trusted-CA certificate when no pin matches', async function () {
    const url = await serve(trusted);
    await assert.rejects(api({ spkiPins: [rogue.leafPin] }).req(url), /SPKI pin/);
  });

  it('does not apply to hosts outside the allowlist', function () {
    const policy = createBitGoTlsPolicy({ ca: trusted.caPem, hosts: ['bitgo.com', '.bitgo.com'] });
    assert.ok(policy.appliesTo('https://app.bitgo.com/api/v2'));
    assert.ok(policy.appliesTo('https://bitgo.com'));
    assert.ok(!policy.appliesTo('https://evilbitgo.com'));
    assert.ok(!policy.appliesTo('https://bitgo.com.evil.example'));
    assert.ok(!policy.appliesTo('http://app.bitgo.com'));
    assert.ok(!policy.appliesTo('not a url'));
  });

  it('leaves non-BitGo hosts on the default trust store', async function () {
    const url = await serve(trusted);
    const req = api({ hosts: ['.bitgo.com'] }).req(url);
    // Default store does not trust our test CA, so the connection must fail rather than use the policy agent.
    await assert.rejects(req, /unable to verify|self.signed|UNABLE_TO_GET_ISSUER/i);
  });

  it('does not follow a redirect off the allowlisted host', async function () {
    let targetHit = false;
    const target = await serve(trusted, (_req, res) => {
      targetHit = true;
      res.end('escaped');
    });
    const origin = await serve(trusted, (_req, res) => {
      res.writeHead(302, { Location: `${target.replace('localhost', '127.0.0.1')}/` });
      res.end();
    });
    await assert.rejects(api().req(origin));
    assert.strictEqual(targetHit, false);
  });

  it('refuses to combine with a custom proxy agent', function () {
    const tlsPolicy = createBitGoTlsPolicy({ ca: trusted.caPem, hosts: ['localhost'] });
    assert.throws(
      () => new BitGoAPI({ env: 'test', tlsPolicy, customProxyAgent: new https.Agent() }),
      /cannot be combined/
    );
  });

  it('requires at least one host and a non-empty pin list', function () {
    assert.throws(() => createBitGoTlsPolicy({ ca: trusted.caPem, hosts: [] }));
    assert.throws(() => createBitGoTlsPolicy({ ca: trusted.caPem, hosts: ['a.com'], spkiPins: [] }));
  });
});
