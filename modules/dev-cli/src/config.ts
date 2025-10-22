import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load .env from the dev-cli module directory
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

export interface Config {
  env: string;
  coin: string;
  accessToken: string;
  walletId?: string;
  walletPassphrase?: string;
  otp?: string;
  enterpriseId?: string;
  customRootUri?: string;
  customBitcoinNetwork?: string;
  walletId2?: string;
}

interface ConfigFile {
  [env: string]: {
    [coin: string]: {
      accessToken?: string;
      walletId?: string;
      walletPassphrase?: string;
      otp?: string;
      enterpriseId?: string;
      customRootUri?: string;
      customBitcoinNetwork?: string;
      walletId2?: string;
    };
  };
}

function loadConfigFile(): ConfigFile | null {
  const configPath = path.join(__dirname, '..', '..', 'config.json');

  if (fs.existsSync(configPath)) {
    try {
      const fileContents = fs.readFileSync(configPath, 'utf8');
      return JSON.parse(fileContents);
    } catch (error) {
      console.warn(`Warning: Failed to parse config.json: ${error.message}`);
      return null;
    }
  }

  return null;
}

export function getConfig(): Config {
  const env = process.env.BITGO_ENV || 'test';
  const coin = process.env.BITGO_COIN || 'tbtc';

  // Load from config file first
  const configFile = loadConfigFile();
  const fileConfig = configFile?.[env]?.[coin] || {};

  // Environment variables override config file
  const config: Config = {
    env,
    coin,
    accessToken: process.env.BITGO_ACCESS_TOKEN || fileConfig.accessToken || '',
    walletId: process.env.BITGO_WALLET_ID || fileConfig.walletId,
    walletPassphrase: process.env.BITGO_WALLET_PASSPHRASE || fileConfig.walletPassphrase,
    otp: process.env.BITGO_OTP || fileConfig.otp,
    enterpriseId: process.env.BITGO_ENTERPRISE_ID || fileConfig.enterpriseId,
    customRootUri: process.env.BITGO_CUSTOM_ROOT_URI || fileConfig.customRootUri,
    customBitcoinNetwork: process.env.BITGO_CUSTOM_BITCOIN_NETWORK || fileConfig.customBitcoinNetwork,
    walletId2: process.env.BITGO_WALLET_ID_2 || fileConfig.walletId2,
  };

  if (!config.accessToken) {
    throw new Error(
      `BITGO_ACCESS_TOKEN is required for ${env}/${coin}. ` +
        `Set it in config.json under ${env}.${coin}.accessToken or via BITGO_ACCESS_TOKEN environment variable.`
    );
  }

  return config;
}

export function validateWalletId(config: Config): string {
  if (!config.walletId) {
    throw new Error(
      `BITGO_WALLET_ID is required for ${config.env}/${config.coin}. ` +
        `Set it in config.json under ${config.env}.${config.coin}.walletId or via BITGO_WALLET_ID environment variable.`
    );
  }
  return config.walletId;
}
