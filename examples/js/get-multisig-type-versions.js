/**
 * Get supporting multiSigTypeVersion (and cold/custodial variants) for selected coins
 * from BitGo TSS settings. Writes result to multisig-type-versions.json in this directory.
 *
 * Usage:
 *   BITGO_ACCESS_TOKEN="your-token" node get-multisig-type-versions.js
 *   BITGO_ACCESS_TOKEN="your-token" BITGO_ENV=prod node get-multisig-type-versions.js
 *
 * Environment:
 *   BITGO_ACCESS_TOKEN (required)
 *   BITGO_ENV (optional, default: 'test')
 *   BITGO_CUSTOM_ROOT_URI (optional)
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');

const COINS = ['eth', 'btc', 'sol', 'bsc', 'polygon', 'sonic'];
const OUTPUT_FILE = path.join(__dirname, 'multisig-type-versions.json');

async function main() {
  const accessToken = process.env.BITGO_ACCESS_TOKEN || '';
  if (!accessToken) {
    throw new Error('BITGO_ACCESS_TOKEN is required');
  }

  const bitgoOptions = {
    env: process.env.BITGO_ENV || 'test',
    accessToken,
    useProduction: false,
  };
  if (process.env.BITGO_CUSTOM_ROOT_URI) {
    bitgoOptions.customRootURI = process.env.BITGO_CUSTOM_ROOT_URI;
  }

  const BitGo = require('bitgo').BitGo;
  const bitgo = new BitGo(bitgoOptions);
  bitgo.authenticateWithAccessToken({ accessToken });

  const tssSettings = await bitgo.get(bitgo.url('/tss/settings', 2)).result();
  const bitgoEnv = process.env.BITGO_ENV || 'test';

  const results = COINS.map((coinId) => {
    const baseCoin = bitgo.coin(coinId);
    const family = baseCoin.getFamily();
    const walletCreationSettings =
      tssSettings.coinSettings?.[family]?.walletCreationSettings;
    return {
      coin: coinId,
      family,
      multiSigTypeVersion: walletCreationSettings?.multiSigTypeVersion,
      coldMultiSigTypeVersion: walletCreationSettings?.coldMultiSigTypeVersion,
      custodialMultiSigTypeVersion:
        walletCreationSettings?.custodialMultiSigTypeVersion,
    };
  });

  const output = {
    generatedAt: new Date().toISOString(),
    bitgoEnv,
    coins: results,
  };

  console.log(JSON.stringify(output, null, 2));
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2), 'utf8');
  console.error(`\nWrote ${OUTPUT_FILE}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
