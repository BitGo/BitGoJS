import { promises as fs } from 'fs';
import { decodeOrElse } from '@bitgo/sdk-core';
import { LightningSignerConfigs, LightningSignerConfig } from './codecs';
import { forceSecureUrl } from '../config';

/**
 * Get the lightning signer configurations from the given file path
 */
export async function getLightningSignerConfigs(path: string): Promise<LightningSignerConfigs> {
  const configFile = await fs.readFile(path, { encoding: 'utf8' });
  const configs: unknown = JSON.parse(configFile);
  const decoded = decodeOrElse(LightningSignerConfigs.name, LightningSignerConfigs, configs, (errors) => {
    throw new Error(`Invalid lightning signer config file: ${errors}`);
  });
  const lightningSignerConfigs: LightningSignerConfigs = {};
  for (const [walletId, { url, tlsCert }] of Object.entries(decoded)) {
    const secureUrl = forceSecureUrl(url);
    lightningSignerConfigs[walletId] = { url: secureUrl, tlsCert };
  }
  return lightningSignerConfigs;
}

/**
 * Get the lightning signer configuration for the given walletId
 */
export async function getLightningSignerConfig(
  walletId: string,
  config: { lightningSignerFileSystemPath?: string }
): Promise<LightningSignerConfig> {
  if (!config.lightningSignerFileSystemPath) {
    throw new Error('Missing required configuration: lightningSignerFileSystemPath');
  }
  const lightningSignerConfigs = await getLightningSignerConfigs(config.lightningSignerFileSystemPath);
  const lightningSignerConfig = lightningSignerConfigs[walletId];
  if (!lightningSignerConfig) {
    throw new Error(`Missing required configuration for walletId: ${walletId}`);
  }
  return lightningSignerConfig;
}
