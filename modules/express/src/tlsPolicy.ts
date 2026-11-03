import * as fs from 'fs';
import * as path from 'path';
import debugLib from 'debug';
import { BitGoTlsPolicy, createBitGoTlsPolicy, getCaExpiries } from 'bitgo';
import { Config } from './config';
import { TlsConfigurationError } from './errors';

const debug = debugLib('bitgo:express');

/**
 * Official BitGo domain patterns covered by the default CA bundle restriction.
 * Covers apex and all subdomains (`app.*`, `admin.*`, `cdn.*`, etc.) across prod, test, staging, and dev.
 */
export const BITGO_DEFAULT_TLS_HOSTS: string[] = [
  'bitgo.com',
  '.bitgo.com',
  'bitgo-test.com',
  '.bitgo-test.com',
  'bitgo-staging.com',
  '.bitgo-staging.com',
  'bitgo-dev.com',
  '.bitgo-dev.com',
];

function resolveBundledCaPath(): string {
  const candidates = [path.resolve(__dirname, '../bitgo-ca.pem'), path.resolve(__dirname, '../../bitgo-ca.pem')];
  const found = candidates.find((p) => fs.existsSync(p));
  if (!found) {
    throw new TlsConfigurationError(`Bundled BitGo CA file not found (searched: ${candidates.join(', ')})`);
  }
  return found;
}

let cachedBundledCaPem: string | undefined;

function getBundledCaPem(): string {
  if (cachedBundledCaPem === undefined) {
    cachedBundledCaPem = fs.readFileSync(resolveBundledCaPath(), 'utf8');
  }
  return cachedBundledCaPem;
}

const policies = new WeakMap<Config, BitGoTlsPolicy | undefined>();

/**
 * Logs the policy summary to debug, plus a console.warn per bundle CA expiring within 30 days, so an operator
 * can update Express before a bundled root CA expiry breaks connections.
 */
function logPolicyStatus(hosts: string[], ca: string | Buffer | Array<string | Buffer>): void {
  const expiries = getCaExpiries(ca);
  debug('BitGo TLS policy enabled for %d host pattern(s), %d CA(s)', hosts.length, expiries.length);
  for (const expiry of expiries) {
    if (expiry.daysRemaining < 30) {
      const when =
        expiry.daysRemaining < 0
          ? `expired ${-expiry.daysRemaining} day(s) ago`
          : `expires in ${expiry.daysRemaining} day(s)`;
      console.warn(
        `BitGo TLS policy CA '${
          expiry.subject
        }' ${when} (${expiry.validTo.toISOString()}); update @bitgo/express to refresh the bundled CA roots`
      );
    }
  }
}

/**
 * Builds (once per config) the default outbound TLS policy for BitGo hostnames using the bundled multi-provider
 * CA store (`bitgo-ca.pem`), or returns undefined when disabled via `disablePinCerts` (`--disablepincerts` /
 * `BITGO_DISABLE_PIN_CERTS`) or when `BITGO_USE_PROXY` is set.
 *
 * @param config Express config (drives opt-out / proxy behaviour).
 * @param caBundlePath Optional path override used by unit tests; bypasses the WeakMap cache.
 */
export function getBitGoTlsPolicy(config: Config, caBundlePath?: string): BitGoTlsPolicy | undefined {
  const useProxy = Boolean(process.env.BITGO_USE_PROXY);
  // Cache check first so every result (including the "disabled" / "proxy" undefined state) is returned
  // without re-logging warnings — otherwise checkPreconditions and prepareBitGo each warn once per boot.
  if (!caBundlePath && policies.has(config)) {
    return policies.get(config);
  }

  if (config.disablePinCerts) {
    console.warn(
      'warning: BitGo TLS CA pinning is disabled via disablePinCerts (--disablepincerts / BITGO_DISABLE_PIN_CERTS).'
    );
    policies.set(config, undefined);
    return undefined;
  }

  if (useProxy) {
    console.warn(
      'warning: BitGo TLS CA pinning is skipped because BITGO_USE_PROXY is set; the proxy agent owns the TLS connection.'
    );
    policies.set(config, undefined);
    return undefined;
  }

  // Node's `ca` option replaces the whole trust store for the policy agent, so NODE_EXTRA_CA_CERTS is
  // silently ignored for BitGo domains. Operators behind a corporate TLS-inspecting firewall (no
  // BITGO_USE_PROXY) must opt out, so warn loudly at startup and point at the escape hatch.
  if (process.env.NODE_EXTRA_CA_CERTS) {
    console.warn(
      'warning: NODE_EXTRA_CA_CERTS is set, but BitGo TLS CA pinning replaces the CA store for BitGo domains and ignores NODE_EXTRA_CA_CERTS. If you rely on a TLS-inspecting proxy/firewall, pass --disablepincerts or set BITGO_DISABLE_PIN_CERTS=true.'
    );
  }

  let policy: BitGoTlsPolicy;
  try {
    const ca = caBundlePath ? fs.readFileSync(caBundlePath) : getBundledCaPem();
    policy = createBitGoTlsPolicy({ ca, hosts: BITGO_DEFAULT_TLS_HOSTS });
    logPolicyStatus(BITGO_DEFAULT_TLS_HOSTS, ca);
  } catch (err) {
    throw err instanceof TlsConfigurationError ? err : new TlsConfigurationError((err as Error).message);
  }

  if (!caBundlePath) {
    policies.set(config, policy);
  }
  return policy;
}
