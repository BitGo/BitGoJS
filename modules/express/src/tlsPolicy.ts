import * as fs from 'fs';
import { BitGoTlsPolicy, createBitGoTlsPolicy, Environments } from 'bitgo';
import { Config } from './config';

const policies = new WeakMap<Config, BitGoTlsPolicy | undefined>();

function defaultHosts(config: Config): string[] {
  const baseUrl = config.customRootUri ?? Environments[config.env]?.uri;
  return baseUrl ? [new URL(baseUrl).hostname] : [];
}

/**
 * Builds (once per config) the outbound TLS policy for BitGo hostnames, or returns undefined when neither a CA
 * bundle nor SPKI pins are configured. Throws at startup on misconfiguration so a bad bundle cannot silently
 * fall back to the system trust store.
 */
export function getBitGoTlsPolicy(config: Config): BitGoTlsPolicy | undefined {
  if (policies.has(config)) {
    return policies.get(config);
  }

  const { bitgoCaBundlePath, bitgoSpkiPins, bitgoTlsHosts } = config;
  let policy: BitGoTlsPolicy | undefined;
  if (bitgoCaBundlePath || bitgoSpkiPins) {
    if (process.env.BITGO_USE_PROXY) {
      throw new Error('BITGO_CA_BUNDLE_PATH / BITGO_SPKI_PINS cannot be combined with BITGO_USE_PROXY');
    }
    const ca = bitgoCaBundlePath ? fs.readFileSync(bitgoCaBundlePath) : undefined;
    if (ca && !ca.includes('BEGIN CERTIFICATE')) {
      throw new Error(`CA bundle at ${bitgoCaBundlePath} contains no PEM certificates`);
    }
    const hosts = [...defaultHosts(config), ...(bitgoTlsHosts ?? [])];
    policy = createBitGoTlsPolicy({ ca, hosts, spkiPins: bitgoSpkiPins });
  }

  policies.set(config, policy);
  return policy;
}
