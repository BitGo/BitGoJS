import * as assert from 'assert';
import * as nock from 'nock';
import { execFileSync } from 'child_process';
import * as fs from 'fs';
import * as http from 'http';
import * as https from 'https';
import * as net from 'net';
import * as os from 'os';
import * as path from 'path';
import crypto from 'crypto';
import { BitGoAPI } from '../../src/bitgoAPI';
import { type BitGoTlsPolicyOptions, createBitGoTlsPolicy, getCaExpiries, parsePolicyHost } from '../../src/tlsPolicy';

function openssl(cwd: string, ...args: string[]): void {
  execFileSync('openssl', args, { cwd, stdio: 'pipe' });
}

interface Pki {
  caPem: string;
  leafKey: string;
  leafPem: string;
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
  return {
    caPem: read(`${name}-ca.pem`),
    leafKey: read(`${name}-leaf.key`),
    leafPem: read(`${name}-leaf.pem`),
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
  const servers: Array<http.Server | https.Server | net.Server> = [];

  before(function () {
    nock.enableNetConnect(/^(127\.0\.0\.1|localhost)(:\d+)?$/);
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

  function api(options: { ca?: string | Buffer | Array<string | Buffer>; hosts?: string[] } = {}) {
    const tlsPolicy = createBitGoTlsPolicy({
      ca: options.ca ?? trusted.caPem,
      hosts: options.hosts ?? ['localhost'],
    });
    return new BitGoAPI({ env: 'test', tlsPolicy, clientConstants: {} as any });
  }

  it('accepts a certificate issued by the approved CA', async function () {
    const url = await serve(trusted);
    const res = await api().get(url);
    assert.strictEqual(res.text, 'ok');
  });

  it('rejects a certificate issued by an unapproved CA', async function () {
    const url = await serve(rogue);
    await assert.rejects(api().get(url), /unable to verify|self.signed|UNABLE_TO_GET_ISSUER/i);
  });

  it('enforces the policy on fetchConstants()', async function () {
    const url = await serve(rogue, (_req, res) => {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ maxFee: 100 }));
    });
    const tlsPolicy = createBitGoTlsPolicy({ ca: trusted.caPem, hosts: ['localhost'] });
    const client = new BitGoAPI({ env: 'custom', customRootURI: url, tlsPolicy, clientConstants: {} as any });
    (BitGoAPI as unknown as { _constants: Record<string, unknown> })._constants = {};
    await assert.rejects(client.fetchConstants(), /unable to verify|self.signed|UNABLE_TO_GET_ISSUER/i);
  });

  it('does not apply to hosts outside the allowlist and handles trailing-dot FQDNs', function () {
    const policy = createBitGoTlsPolicy({ ca: trusted.caPem, hosts: ['bitgo.com', '.bitgo.com'] });
    assert.ok(policy.appliesTo('https://app.bitgo.com/api/v2'));
    assert.ok(policy.appliesTo('https://app.bitgo.com./api/v2'));
    assert.ok(policy.appliesTo('https://bitgo.com'));
    assert.ok(policy.appliesTo('https://bitgo.com.'));
    assert.ok(!policy.appliesTo('https://evilbitgo.com'));
    assert.ok(!policy.appliesTo('https://bitgo.com.evil.example'));
    assert.ok(!policy.appliesTo('http://evilbitgo.com'));
    assert.ok(!policy.appliesTo('not a url'));
  });

  it('refuses plain http and schemeless URLs to a covered host instead of silently skipping the policy', function () {
    const policy = createBitGoTlsPolicy({ ca: trusted.caPem, hosts: ['bitgo.com', '.bitgo.com'] });
    assert.throws(() => policy.appliesTo('http://app.bitgo.com/api/v2'), /refuses insecure/);
    assert.throws(() => policy.appliesTo('http://app.bitgo.com./api/v2'), /refuses insecure/);
    assert.throws(() => policy.appliesTo('http://bitgo.com'), /refuses insecure/);
    assert.throws(() => policy.appliesTo('app.bitgo.com/api/v2'), /refuses insecure/);
    assert.throws(() => policy.appliesTo('app.bitgo.com:443/api/v2'), /refuses insecure/);
    assert.throws(() => policy.appliesTo('//app.bitgo.com/api/v2'), /refuses insecure/);
    // superagent's legacy url.parse treats backslashes as path separators, so the policy must too.
    assert.ok(policy.appliesTo('https:\\app.bitgo.com/api/v2'));
    assert.ok(policy.appliesTo('https:\\\\app.bitgo.com/api/v2'));
    assert.ok(policy.appliesTo('https:/app.bitgo.com/api/v2'));
    assert.ok(policy.appliesTo('https:////app.bitgo.com/api/v2'));
    assert.throws(() => policy.appliesTo('http:\\app.bitgo.com/api/v2'), /refuses insecure/);
    // Uppercase HTTPS:// is a valid scheme — accepted (review #10073 item 5).
    assert.ok(policy.appliesTo('HTTPS://app.bitgo.com/api/v2'));
  });

  it('leaves non-BitGo hosts on the default trust store', async function () {
    const url = await serve(trusted);
    const req = api({ hosts: ['.bitgo.com'] }).get(url);
    // Default store does not trust our test CA, so the connection must fail rather than use the policy agent.
    await assert.rejects(req, /unable to verify|self.signed|UNABLE_TO_GET_ISSUER/i);
  });

  it('does not follow a redirect off the allowlisted host', async function () {
    let targetHit = false;
    const targetServer = http.createServer((_req, res) => {
      targetHit = true;
      res.end('escaped');
    });
    await new Promise<void>((resolve) => targetServer.listen(0, '127.0.0.1', () => resolve()));
    servers.push(targetServer);
    const targetPort = (targetServer.address() as { port: number }).port;

    const origin = await serve(trusted, (_req, res) => {
      res.writeHead(302, { Location: `http://127.0.0.1:${targetPort}/` });
      res.end();
    });
    // Redirect targets are re-validated per hop: an off-policy (uncovered) or http target is refused
    // (surfaced as superagent's 'Aborted' error) before the follow-up connection is opened.
    await assert.rejects(api().get(origin), (err: { code?: string }) => err.code === 'ABORTED');
    assert.strictEqual(targetHit, false);
  });

  for (const scheme of ['http', 'https']) {
    it(`opens no TCP connection to a refused ${scheme} redirect target`, async function () {
      let connections = 0;
      const target = net.createServer((socket) => {
        connections++;
        socket.destroy();
      });
      await new Promise<void>((resolve) => target.listen(0, '127.0.0.1', () => resolve()));
      servers.push(target);
      const targetPort = (target.address() as net.AddressInfo).port;

      // 127.0.0.1 is outside the policy hosts (['localhost']), so both schemes are refused.
      const origin = await serve(trusted, (_req, res) => {
        res.writeHead(302, { Location: `${scheme}://127.0.0.1:${targetPort}/` });
        res.end();
      });
      await assert.rejects(api().get(origin), (err: { code?: string }) => err.code === 'ABORTED');
      await new Promise((resolve) => setTimeout(resolve, 100));
      assert.strictEqual(connections, 0);
    });
  }

  it("inherits Node's built-in env proxy settings from the global agent", function () {
    const globalOpts = https.globalAgent.options;
    const original = globalOpts.proxyEnv;
    try {
      globalOpts.proxyEnv = { HTTPS_PROXY: 'http://proxy.example:3128' };
      const policy = createBitGoTlsPolicy({ ca: trusted.caPem, hosts: ['localhost'] });
      assert.deepStrictEqual(policy.agent.options.proxyEnv, { HTTPS_PROXY: 'http://proxy.example:3128' });
    } finally {
      globalOpts.proxyEnv = original;
    }
  });

  it('follows a redirect to another covered https host', async function () {
    let targetHit = false;
    const target = await serve(trusted, (_req, res) => {
      targetHit = true;
      res.end('done');
    });
    const origin = await serve(trusted, (_req, res) => {
      res.writeHead(302, { Location: target });
      res.end();
    });
    // Both servers present the trusted cert for DNS:localhost, which is in the policy hosts: ['localhost'].
    const res = await api().get(origin);
    assert.strictEqual(res.text, 'done');
    assert.strictEqual(targetHit, true);
  });

  it('refuses to combine with a custom proxy agent', function () {
    const tlsPolicy = createBitGoTlsPolicy({ ca: trusted.caPem, hosts: ['localhost'] });
    assert.throws(
      () => new BitGoAPI({ env: 'test', tlsPolicy, customProxyAgent: new https.Agent() }),
      /cannot be combined/
    );
  });

  it('keeps the policy agent sockets alive for reuse', function () {
    const policy = createBitGoTlsPolicy({ ca: trusted.caPem, hosts: ['localhost'] });
    // @types/node does not expose keepAlive/timeout on the Agent class, only on AgentOptions.
    const agentOpts = (
      policy.agent as unknown as { options: { keepAlive?: boolean; timeout?: number; scheduling?: string } }
    ).options;
    assert.strictEqual(agentOpts.keepAlive, true);
    assert.strictEqual(agentOpts.timeout, 5000);
    assert.strictEqual(agentOpts.scheduling, 'lifo');
  });

  it('requires at least one host and a CA bundle', function () {
    assert.throws(() => createBitGoTlsPolicy({ ca: trusted.caPem, hosts: [] }));
    assert.throws(() => createBitGoTlsPolicy({ hosts: ['a.com'] } as unknown as BitGoTlsPolicyOptions));
    assert.throws(() => createBitGoTlsPolicy({ ca: [], hosts: ['a.com'] }), /at least one PEM certificate/);
  });

  it('rejects an empty policy at compile time', function () {
    // Never invoked: exists only to prove that `{ hosts }` alone is a compile error.
    function compileCheck(): void {
      // @ts-expect-error a policy must provide a CA bundle
      createBitGoTlsPolicy({ hosts: ['a.com'] });
    }
    void compileCheck;
  });

  it('parses every certificate in a multi-cert bundle and trusts non-first CAs', async function () {
    const bundle = `${trusted.caPem}\n${rogue.caPem}`;
    const url = await serve(rogue);
    const res = await api({ ca: bundle }).get(url);
    assert.strictEqual(res.text, 'ok');
  });

  it('rejects a bundle containing a malformed certificate', function () {
    const garbage = `${trusted.caPem}\n-----BEGIN CERTIFICATE-----\nnot base64 at all\n-----END CERTIFICATE-----`;
    assert.throws(() => createBitGoTlsPolicy({ ca: garbage, hosts: ['localhost'] }), /invalid certificate/);
  });

  it('rejects a bundle with no certificates', function () {
    assert.throws(
      () => createBitGoTlsPolicy({ ca: 'no certificates here', hosts: ['localhost'] }),
      /at least one PEM certificate/
    );
  });

  it('reports expiry information for every bundle certificate', function () {
    const expiries = getCaExpiries(trusted.caPem);
    assert.strictEqual(expiries.length, 1);
    assert.ok(expiries[0].subject.includes('trusted CA'));
    assert.ok(expiries[0].validTo.getTime() > Date.now());
    assert.ok(expiries[0].daysRemaining > 0 && expiries[0].daysRemaining <= 2);
  });

  it('normalizes host patterns to the canonical form the matcher understands', function () {
    assert.strictEqual(parsePolicyHost('https://app.bitgo.com'), 'app.bitgo.com');
    assert.strictEqual(parsePolicyHost('https://app.bitgo.com/api/v2'), 'app.bitgo.com');
    assert.strictEqual(parsePolicyHost('APP.BITGO.COM...'), 'app.bitgo.com');
    assert.strictEqual(parsePolicyHost('.bitgo.com'), '.bitgo.com');
    assert.strictEqual(parsePolicyHost('app.bitgo.com'), 'app.bitgo.com');
  });

  it('rejects malformed host patterns at policy build time', function () {
    assert.throws(() => createBitGoTlsPolicy({ ca: trusted.caPem, hosts: ['*.bitgo.com'] }), /must not use wildcards/);
    assert.throws(() => createBitGoTlsPolicy({ ca: trusted.caPem, hosts: ['not a host!'] }), /not a valid hostname/);
    assert.throws(() => createBitGoTlsPolicy({ ca: trusted.caPem, hosts: ['..'] }), /not a valid hostname/);
    assert.throws(() => createBitGoTlsPolicy({ ca: trusted.caPem, hosts: ['..bitgo.com'] }), /not a valid hostname/);
    assert.throws(() => createBitGoTlsPolicy({ ca: trusted.caPem, hosts: ['bitgo..com'] }), /not a valid hostname/);
    assert.throws(() => createBitGoTlsPolicy({ ca: trusted.caPem, hosts: ['-bitgo.com'] }), /not a valid hostname/);
  });

  it('applies a pasted full URL host pattern to the intended host', function () {
    const policy = createBitGoTlsPolicy({ ca: trusted.caPem, hosts: ['https://app.bitgo.com'] });
    assert.ok(policy.appliesTo('https://app.bitgo.com/api/v2'));
    assert.ok(!policy.appliesTo('https://evilbitgo.com'));
  });

  it('refuses to build a policy without the Node crypto/tls APIs', function () {
    // Simulates a browser bundle, where crypto.X509Certificate does not exist.
    const apiObj = crypto as unknown as { X509Certificate: unknown };
    const original = apiObj.X509Certificate;
    try {
      apiObj.X509Certificate = undefined;
      assert.throws(
        () => createBitGoTlsPolicy({ ca: trusted.caPem, hosts: ['localhost'] }),
        /only supported in Node.js/
      );
    } finally {
      apiObj.X509Certificate = original;
    }
  });
});
