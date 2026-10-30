import * as crypto from 'crypto';
import * as https from 'https';
import * as tls from 'tls';

export interface BitGoTlsPolicyOptions {
  /**
   * PEM-encoded CA certificates that BitGo hosts are allowed to chain to. Replaces (does not extend)
   * the system trust store for connections to `hosts`.
   */
  ca: string | Buffer | Array<string | Buffer>;
  /**
   * Hostnames the policy applies to. `example.com` matches only that host; `.example.com` matches any
   * subdomain of example.com (but not example.com itself).
   */
  hosts: string[];
}

export interface BitGoTlsPolicy {
  /**
   * True for a covered host over https. THROWS for a covered host contacted over http, because a silent
   * downgrade would bypass the policy's trust constraints. False for non-covered hosts (any protocol).
   */
  appliesTo(url: string): boolean;
  /** Agent that enforces the CA bundle; only to be used for URLs where `appliesTo` is true. */
  readonly agent: https.Agent;
}

export interface CaExpiry {
  subject: string;
  validTo: Date;
  daysRemaining: number;
}

function parseCaCertificates(ca: string | Buffer | Array<string | Buffer>): {
  blocks: string[];
  certs: crypto.X509Certificate[];
} {
  const blocks: string[] = [];
  const certs: crypto.X509Certificate[] = [];
  const entries = Array.isArray(ca) ? ca : [ca];
  for (const entry of entries) {
    // typeof narrowing is used because sdk-api's browser typings define a Buffer that does not relate to
    // the @types/node Buffer in the union, which would defeat instanceof narrowing.
    const text = typeof entry === 'string' ? entry : entry.toString('utf8');
    const matches = text.match(/-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----/g);
    if (!matches || matches.length === 0) {
      throw new Error('BitGo TLS policy ca must contain at least one PEM certificate');
    }
    for (const block of matches) {
      try {
        certs.push(new crypto.X509Certificate(block));
      } catch (err) {
        throw new Error(`BitGo TLS policy ca contains an invalid certificate: ${(err as Error).message}`);
      }
      blocks.push(block);
    }
  }
  if (blocks.length === 0) {
    throw new Error('BitGo TLS policy ca must contain at least one PEM certificate');
  }
  return { blocks, certs };
}

/**
 * Splits a PEM bundle into its individual certificate blocks and parses each one, so a malformed or empty
 * bundle is rejected at policy build time instead of at the first handshake. Node's crypto.X509Certificate
 * only reads the FIRST certificate of a concatenated PEM string, so multi-cert bundles must be split first.
 */
export function normalizeCaBundle(ca: string | Buffer | Array<string | Buffer>): string[] {
  return parseCaCertificates(ca).blocks;
}

/** Expiry information for every certificate in a bundle, for expiry monitoring and alerting. */
export function getCaExpiries(ca: string | Buffer | Array<string | Buffer>): CaExpiry[] {
  const now = Date.now();
  return parseCaCertificates(ca).certs.map((cert) => {
    const validTo = new Date(cert.validTo);
    return {
      subject: cert.subject,
      validTo,
      daysRemaining: Math.floor((validTo.getTime() - now) / 86_400_000),
    };
  });
}

function matchesHost(hostname: string, pattern: string): boolean {
  const host = hostname.toLowerCase().replace(/\.+$/, '');
  const p = pattern.toLowerCase().replace(/\.+$/, '');
  return p.startsWith('.') ? host.endsWith(p) : host === p;
}

/**
 * Normalizes an operator-supplied host pattern to the canonical form `matchesHost` understands: lower-case,
 * no scheme/path, no trailing dot. Rejects glob patterns, because translating `*.bitgo.com` into a covering
 * pattern requires guessing intent (subdomains only vs. apex too) — a silent guess would be a false sense of
 * safety. Runs once at policy build time, so a malformed host list fails at startup instead of silently
 * protecting nothing at connection time.
 */
export function parsePolicyHost(host: string): string {
  let h = host.trim().toLowerCase();
  h = h
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '')
    .replace(/\.+$/, '');
  if (h.includes('*')) {
    throw new Error(
      `BitGo TLS policy host pattern '${host}' must not use wildcards; use an exact host or '.domain.com' for subdomains`
    );
  }
  const body = h.startsWith('.') ? h.slice(1) : h;
  if (!body || !/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/.test(body)) {
    throw new Error(`BitGo TLS policy host pattern '${host}' is not a valid hostname`);
  }
  return h;
}

export function createBitGoTlsPolicy(options: BitGoTlsPolicyOptions): BitGoTlsPolicy {
  // Node-only: browser bundles stub `tls` and lack crypto.X509Certificate, which this policy is built on.
  // Fail with a clear message instead of a cryptic throw at the first X509Certificate use.
  if (typeof tls.checkServerIdentity !== 'function' || typeof crypto.X509Certificate !== 'function') {
    throw new Error('BitGo TLS policy is only supported in Node.js (it requires the Node crypto and tls APIs)');
  }
  const { ca, hosts } = options;
  if (hosts.length === 0) {
    throw new Error('BitGo TLS policy requires at least one host');
  }
  // Normalize once at build time so every later appliesTo comparison is exact (parsePolicyHost).
  const normalizedHosts = hosts.map((h) => parsePolicyHost(h));
  if (ca === undefined) {
    throw new Error('BitGo TLS policy requires a CA bundle');
  }

  // Validate the CA bundle at build time so a malformed bundle fails here, not at the first handshake.
  const normalizedCa = normalizeCaBundle(ca);

  const agent = new https.Agent({
    ca: normalizedCa,
    keepAlive: true,
    // Mirror Node's default https.globalAgent (timeout: 5000, scheduling: 'lifo') so idle pooled
    // sockets expire before BitGo's load balancer closes them — otherwise a request reusing a
    // socket in the close window fails with ECONNRESET / 'socket hang up' on non-retried POSTs.
    timeout: 5000,
    scheduling: 'lifo',
    // Node's built-in env proxy (NODE_USE_ENV_PROXY=1 / --use-env-proxy) is only applied to the global
    // agents, so inherit whatever it resolved — otherwise covered requests bypass HTTPS_PROXY and connect
    // directly. CONNECT keeps TLS end to end, so `ca` is still enforced. Undefined when the proxy is off.
    proxyEnv: https.globalAgent.options.proxyEnv,
  });

  return {
    agent,
    appliesTo(url: string): boolean {
      // superagent prepends 'http://' when a URL lacks an explicit scheme; mirror that fallback so
      // schemeless, host:port and protocol-relative URLs to covered hosts are caught and rejected as
      // http downgrades. A scheme only counts when followed by at least one slash — 'app.bitgo.com:443'
      // would otherwise be misparsed as a scheme with an empty hostname, while WHATWG's URL parser
      // (like superagent's legacy url.parse) accepts 'https:/host' and 'https:////host' as https.
      // Backslashes are normalized to '/' first for the same reason.
      const normalizedUrl = url.replace(/\\/g, '/');
      const candidate = /^[a-z][a-z0-9+.-]*:\//i.test(normalizedUrl)
        ? normalizedUrl
        : `http://${normalizedUrl.replace(/^\/+/, '')}`;
      let parsed: URL;
      try {
        parsed = new URL(candidate);
      } catch {
        return false;
      }
      const covered = normalizedHosts.some((h) => matchesHost(parsed.hostname, h));
      // The schemeless fallback above forces http:// onto bare/protocol-relative URLs, so `parsed.protocol
      // !== 'https:'` is sufficient to reject every insecure form (including http://, ws://, and
      // 'app.bitgo.com/...'), while still accepting case-insensitive uppercase HTTPS:// URLs.
      if (covered && parsed.protocol !== 'https:') {
        throw new Error(
          `BitGo TLS policy refuses insecure ${parsed.protocol}//${parsed.hostname} connection to a covered host; only https is allowed`
        );
      }
      return covered;
    },
  };
}
