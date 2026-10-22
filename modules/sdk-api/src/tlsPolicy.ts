import * as crypto from 'crypto';
import * as https from 'https';
import * as tls from 'tls';

export interface BitGoTlsPolicyOptions {
  /**
   * PEM-encoded CA certificates that BitGo hosts are allowed to chain to. Replaces (does not extend)
   * the system trust store for connections to `hosts`. When omitted, the system trust store is used.
   */
  ca?: string | Buffer | Array<string | Buffer>;
  /**
   * Hostnames the policy applies to. `example.com` matches only that host; `.example.com` matches any
   * subdomain of example.com (but not example.com itself).
   */
  hosts: string[];
  /**
   * Optional base64 SHA-256 digests of SubjectPublicKeyInfo structures. When set, at least one certificate
   * in the presented chain must match one of the pins. Include a backup pin before rotating keys.
   */
  spkiPins?: string[];
}

export interface BitGoTlsPolicy {
  /** True when `url` is an https URL whose hostname is covered by the policy. */
  appliesTo(url: string): boolean;
  /** Agent that enforces the CA bundle and pins; only to be used for URLs where `appliesTo` is true. */
  readonly agent: https.Agent;
}

export function spkiPin(cert: { raw: Buffer }): string {
  const spki = new crypto.X509Certificate(cert.raw).publicKey.export({ type: 'spki', format: 'der' });
  return crypto.createHash('sha256').update(spki).digest('base64');
}

function chainPins(leaf: tls.DetailedPeerCertificate): string[] {
  const pins: string[] = [];
  const seen = new Set<Buffer>();
  let cert: tls.DetailedPeerCertificate | undefined = leaf;
  while (cert && cert.raw && !seen.has(cert.raw)) {
    seen.add(cert.raw);
    pins.push(spkiPin(cert));
    cert = cert.issuerCertificate;
  }
  return pins;
}

function matchesHost(hostname: string, pattern: string): boolean {
  const host = hostname.toLowerCase();
  const p = pattern.toLowerCase();
  return p.startsWith('.') ? host.endsWith(p) : host === p;
}

export function createBitGoTlsPolicy(options: BitGoTlsPolicyOptions): BitGoTlsPolicy {
  const { ca, hosts, spkiPins } = options;
  if (hosts.length === 0) {
    throw new Error('BitGo TLS policy requires at least one host');
  }
  if (spkiPins !== undefined && spkiPins.length === 0) {
    throw new Error('BitGo TLS policy spkiPins must be omitted or contain at least one pin');
  }

  const agent = new https.Agent({
    ca,
    checkServerIdentity: (hostname, cert) => {
      const err = tls.checkServerIdentity(hostname, cert);
      if (err || !spkiPins) {
        return err;
      }
      const presented = chainPins(cert as tls.DetailedPeerCertificate);
      if (!presented.some((pin) => spkiPins.includes(pin))) {
        return new Error(`No certificate in the chain for ${hostname} matches a configured SPKI pin`);
      }
      return undefined;
    },
  });

  return {
    agent,
    appliesTo(url: string): boolean {
      let parsed: URL;
      try {
        parsed = new URL(url);
      } catch {
        return false;
      }
      return parsed.protocol === 'https:' && hosts.some((h) => matchesHost(parsed.hostname, h));
    },
  };
}
