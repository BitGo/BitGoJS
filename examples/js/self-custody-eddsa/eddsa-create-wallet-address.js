/**
 * Create a new receive address on an existing EdDSA TSS (MPC) wallet.
 *
 * Works with wallets created via eddsa-self-custody-online/offline.js or create-tss-wallet.js.
 *
 * Usage (from repo root):
 *   BITGO_ACCESS_TOKEN=... COIN=tsol WALLET_ID=... node ./examples/js/self-custody-eddsa/eddsa-create-wallet-address.js
 *
 * Optional: read WALLET_ID from keygen workspace if omitted:
 *   EDDSA_KEYGEN_WORKSPACE_DIR=./examples/js/self-custody-eddsa/eddsa-keygen-workspace
 *
 * Environment:
 *   BITGO_ACCESS_TOKEN (required)
 *   COIN (default: tsol) — EdDSA TSS coin, e.g. tsol, tapt, tsui
 *   WALLET_ID (required unless wallet-result.json exists in keygen workspace)
 *   ADDRESS_LABEL (optional) — label for the new address
 *   BITGO_ENV (default: test)
 *   BITGO_CUSTOM_ROOT_URI (optional) — BitGo Express URL
 *
 * Copyright 2022, BitGo, Inc.  All Rights Reserved.
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { WORKSPACE_DIR, FILES, workspacePath } = require('./eddsa-keygen-workspace-schema');
const { wrapBitGoForV1Auth } = require('../self-custody-mcp-v2/bitgo-auth-utils');

function resolveWalletId() {
  if (process.env.WALLET_ID) {
    return process.env.WALLET_ID;
  }
  const walletResultPath = workspacePath(FILES.walletResult);
  if (fs.existsSync(walletResultPath)) {
    const result = JSON.parse(fs.readFileSync(walletResultPath, 'utf8'));
    if (result.walletId) {
      console.log('[INFO] Using walletId from', FILES.walletResult);
      return result.walletId;
    }
  }
  throw new Error('WALLET_ID required (set env or create wallet first — wallet-result.json in keygen workspace)');
}

async function main() {
  const BitGo = require('bitgo').BitGo;
  const accessToken = process.env.BITGO_ACCESS_TOKEN || '';
  if (!accessToken) throw new Error('BITGO_ACCESS_TOKEN required');

  const coinId = process.env.COIN || 'tsol';
  const walletId = resolveWalletId();

  const opts = {
    env: process.env.BITGO_ENV || 'test',
    accessToken,
  };
  if (process.env.BITGO_CUSTOM_ROOT_URI) {
    opts.customRootURI = process.env.BITGO_CUSTOM_ROOT_URI;
  }

  let bitgo = new BitGo(opts);
  bitgo = wrapBitGoForV1Auth(bitgo);
  bitgo.authenticateWithAccessToken({ accessToken });

  const wallet = await bitgo.coin(coinId).wallets().get({ id: walletId });

  const createParams = {};
  if (process.env.ADDRESS_LABEL) {
    createParams.label = process.env.ADDRESS_LABEL;
  }

  const newAddress = await wallet.createAddress(createParams);

  const addressRecord = {
    walletId: wallet.id(),
    coin: coinId,
    defaultReceiveAddress: wallet.receiveAddress(),
    newAddress,
    createdAt: new Date().toISOString(),
  };

  if (!fs.existsSync(WORKSPACE_DIR)) {
    fs.mkdirSync(WORKSPACE_DIR, { recursive: true });
  }
  const outPath = path.join(WORKSPACE_DIR, 'address-result.json');
  fs.writeFileSync(outPath, JSON.stringify(addressRecord, null, 2), { mode: 0o600 });

  console.log('Wallet ID:', addressRecord.walletId);
  console.log('Coin:', addressRecord.coin);
  console.log('Default receive address:', addressRecord.defaultReceiveAddress);
  console.log('New receive address:', typeof newAddress === 'string' ? newAddress : newAddress.address || newAddress);
  console.log('Saved to', outPath);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
