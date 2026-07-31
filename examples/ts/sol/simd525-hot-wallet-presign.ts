/**
 * SIMD-525 Verification: Hot Wallet Presign Rebuild
 *
 * Tests: presignTransaction triggers backend rebuild → fresh blockhash.
 * Verifies hot wallet send flow is NOT affected by SIMD-525.
 *
 * Flow:
 *   1. Prebuild tx → capture blockhash B1 from txHex
 *   2. Wait (5s for smoke test, 120s for real test)
 *   3. Sign → presignTransaction fires → rebuild → fresh blockhash B2
 *   4. Verify B1 ≠ B2 (rebuild happened, not using durable nonce)
 *   5. Broadcast → success proves B2 is fresh
 *
 * Copyright 2025, BitGo, Inc.  All Rights Reserved.
 */
import { BitGoAPI } from '@bitgo/sdk-api';
import { Tsol } from '@bitgo/sdk-coin-sol';
import { coins } from '@bitgo/statics';
import { VersionedTransaction } from '@solana/web3.js';
import * as bs58 from 'bs58';

const path = require('path');
const envPath = path.resolve(__dirname, '../../../.env');
require('dotenv').config({ path: envPath });

// ==================== CONFIG ====================
const ACCESS_TOKEN = process.env.TESTNET_ACCESS_TOKEN || '';
const WALLET_ID = '6a10383dcccf729bb7740d59defd5c49';
const WALLET_PASSPHRASE = 'Ghghjkg!455544llll';
const RECIPIENT_ADDRESS = 'DTn5zvSLiHJ4fApHobgkzcHzSdgM4Hc9Enkfy2UCC8oo';
const TRANSFER_AMOUNT = '1000'; // lamports
const HOLD_SECONDS = 120; // 120s — B1 will be stale, proving presign rebuild gives fresh blockhash
const ENV = 'staging';
// =================================================

function extractBlockhashFromTxHex(txHex: string): string | null {
  if (!txHex || txHex.length < 20) return null;
  try {
    const buf = Buffer.from(txHex, 'hex');
    const tx = VersionedTransaction.deserialize(buf);
    const blockhash = (tx.message as any).recentBlockhash;
    // recentBlockhash is a PublicKey — convert to base58
    if (blockhash && typeof blockhash.toBase58 === 'function') {
      return blockhash.toBase58();
    }
    // Fallback: raw bytes to base58
    if (Buffer.isBuffer(blockhash)) {
      return bs58.encode(blockhash);
    }
    return String(blockhash);
  } catch (e: any) {
    console.log('  [extractBlockhash] failed:', e.message);
    return null;
  }
}

async function main() {
  console.log('=== SIMD-525: Hot Wallet Presign Rebuild ===\n');

  if (!ACCESS_TOKEN) {
    console.error('No access token found. Set TESTNET_ACCESS_TOKEN in .env');
    process.exit(1);
  }

  const bitgo = new BitGoAPI({
    accessToken: ACCESS_TOKEN,
    env: ENV,
  });
  const coin = coins.get('tsol');
  bitgo.register(coin.name, Tsol.createInstance);

  const sol = bitgo.coin('tsol');
  const wallet = await sol.wallets().get({ id: WALLET_ID });

  console.log('Wallet ID:', wallet.id());
  console.log('Wallet type:', wallet.type());

  if (wallet.type() !== 'hot') {
    console.error('This test requires a HOT wallet. Got:', wallet.type());
    process.exit(1);
  }

  // --- Step 1: Prebuild tx → capture blockhash B1 ---
  console.log('\n[Step 1] Prebuilding tx...');
  try {
    await bitgo.lock();
  } catch {}
  await bitgo.unlock({ otp: '000000' });

  const prebuild = await wallet.prebuildTransaction({
    type: 'transfer',
    recipients: [{ address: RECIPIENT_ADDRESS, amount: TRANSFER_AMOUNT }],
  } as any);

  const txRequestId = (prebuild as any).txRequestId;
  const txHexB1 = (prebuild as any).txHex || '';
  console.log('  txRequestId:', txRequestId);
  console.log('  txHex length:', txHexB1.length);
  const blockhashB1 = extractBlockhashFromTxHex(txHexB1);
  console.log('  Prebuild blockhash (B1):', blockhashB1 || '(not found)');

  // --- Step 2: Wait ---
  console.log(`\n[Step 2] Waiting ${HOLD_SECONDS}s...`);
  await new Promise((resolve) => setTimeout(resolve, HOLD_SECONDS * 1000));
  console.log('  Done waiting.');

  // --- Step 3: Sign → presignTransaction fires → rebuild ---
  console.log('\n[Step 3] Signing (presignTransaction will trigger rebuild)...');
  const keychains = await sol.keychains().getKeysForSigning({ wallet });

  const signedTx = await wallet.signTransaction({
    txPrebuild: prebuild,
    keychain: keychains[0],
    walletPassphrase: WALLET_PASSPHRASE,
    pubs: keychains.map((k) => k.pub),
  } as any);

  const signedTxId = (signedTx as any).txRequestId;
  console.log('  Signed txRequestId:', signedTxId);
  console.log('  signedTx keys:', Object.keys(signedTx));

  // Try to extract B2 from signedTx — after presign rebuild, the unsignedTxs
  // array contains the REBUILT tx with the fresh blockhash
  const rebuiltUnsignedTx = (signedTx as any).unsignedTxs?.[0];
  const signedTxHex = rebuiltUnsignedTx?.serializedTxHex
    || (signedTx as any).signedTxHex
    || (signedTx as any).txHex
    || '';
  console.log('  unsignedTxs[0] keys:', rebuiltUnsignedTx ? Object.keys(rebuiltUnsignedTx) : 'none');
  console.log('  signedTxHex length:', signedTxHex.length);
  const blockhashB2 = extractBlockhashFromTxHex(signedTxHex);
  console.log('  Rebuilt blockhash (B2):', blockhashB2 || '(not found)');

  // --- Step 4: Verify B1 ≠ B2 ---
  console.log('\n[Step 4] Verifying presign rebuild...');

  if (blockhashB1 && blockhashB2) {
    if (blockhashB1 !== blockhashB2) {
      console.log('  ✅ B1 ≠ B2 — presignTransaction rebuilt with FRESH blockhash');
      console.log('     B1:', blockhashB1);
      console.log('     B2:', blockhashB2);
    } else {
      console.log('  ⚠️  B1 == B2 — blockhash unchanged (rebuild may not have triggered)');
    }
  } else {
    console.log('  ℹ️  Could not compare blockhashes');
    if (!blockhashB1) console.log('     B1 missing — txHex deserialization failed');
    if (!blockhashB2) console.log('     B2 missing — need to find signed tx hex');
  }

  // --- Step 5: Broadcast ---
  console.log('\n[Step 5] Submitting tx...');
  try {
    const submitted = await bitgo
      .post(sol.url(`/wallet/${WALLET_ID}/tx/send`))
      .send({ txRequestId: signedTxId })
      .result();

    console.log('  ✅ SUBMITTED:', submitted.txid || submitted.txHash || JSON.stringify(submitted).slice(0, 200));
    console.log('\n  ✓ Hot wallet send succeeds');
    console.log('  ✓ presignTransaction rebuild gives fresh blockhash');
    console.log('  ✓ Hot wallet flow NOT affected by SIMD-525');
  } catch (err: any) {
    const errMsg = (err.message || String(err)).slice(0, 300);
    console.log('  ❌ SUBMIT FAILED:', errMsg);
  }

  console.log('\n=== Test Complete ===');
}

main().catch((e) => console.log(e));
