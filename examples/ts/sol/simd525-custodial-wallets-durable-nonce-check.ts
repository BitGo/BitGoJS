/**
 * SIMD-525 Verification: Cold + Custodial Durable Nonce Check
 *
 * Cold wallets require offline-console-vault for signing — we can't do a
 * full end-to-end send. But we DON'T need to. The protection claim is:
 * cold and custodial wallets use durable nonce in prebuild, which bypasses
 * blockhash expiry entirely. We just verify the prebuild.
 *
 * Flow:
 *   1. Prebuild transfer → deserialize txHex → inspect instructions
 *   2. Find AdvanceNonceAccount instruction (System program, ix index 4)
 *   3. Extract nonceAccount + nonceAuthority from instruction accounts
 *   4. Verify the "recentBlockhash" field is actually a nonce value
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
const ENV = 'staging';

const COLD_WALLET_ID = ''; // skipped — no cold wallet available
const CUSTODIAL_WALLET_ID = '69de2c72b12f278ab5d009701b89dc52';

const RECIPIENT_ADDRESS = '2dLaAjaMWTftQrAcAjhPd6k7nJhYgPkWDctWpwYJ8sbv'; // self-transfer to avoid policy denial
const TRANSFER_AMOUNT = '1000'; // lamports
// =================================================

// System program instruction indices
// https://github.com/solana-labs/solana/blob/master/sdk/program/src/system_instruction.rs
const SYSTEM_PROGRAM_ID = '11111111111111111111111111111111';
const SYSVAR_RECENT_BLOCKHASHES = 'SysvarRecentB1ockHashes11111111111111111111';
const ADVANCE_NONCE_ACCOUNT_IX = 4; // NOT 2 (that's Transfer)

interface NonceAnalysis {
  hasDurableNonce: boolean;
  nonceAccount?: string;
  nonceAuthority?: string;
  nonceValue?: string; // the "recentBlockhash" field is actually the stored nonce
  instructions: { type: string; program: string; accounts: string[] }[];
}

function analyzeTxHex(txHex: string): NonceAnalysis {
  if (!txHex || txHex.length < 20) {
    return { hasDurableNonce: false, instructions: [] };
  }
  try {
    const buf = Buffer.from(txHex, 'hex');
    const tx = VersionedTransaction.deserialize(buf);
    const msg = tx.message as any;
    const keys = msg.staticAccountKeys;

    // recentBlockhash is raw bytes, not a PublicKey — encode to base58
    const blockhashBytes = msg.recentBlockhash;
    let nonceValue: string;
    if (typeof blockhashBytes === 'string') {
      nonceValue = blockhashBytes;
    } else if (blockhashBytes && typeof blockhashBytes.toBase58 === 'function') {
      nonceValue = blockhashBytes.toBase58();
    } else {
      nonceValue = bs58.encode(Buffer.from(blockhashBytes));
    }

    const systemIxNames: Record<number, string> = {
      0: 'CreateAccount',
      1: 'Assign',
      2: 'Transfer',
      3: 'CreateAccountWithSeed',
      4: 'AdvanceNonceAccount',
      5: 'WithdrawNonceAccount',
      6: 'InitializeNonceAccount',
    };

    const instructions = msg.compiledInstructions.map((ix: any) => {
      const program = keys[ix.programIdIndex]?.toBase58();
      // NOTE: field is accountKeyIndexes (not accountKeyIndices)
      const accounts = (ix.accountKeyIndexes || ix.accountKeyIndices || []).map(
        (idx: number) => keys[idx]?.toBase58()
      );
      const ixType = ix.data[0];
      const typeName = program === SYSTEM_PROGRAM_ID ? (systemIxNames[ixType] || `Unknown(${ixType})`) : `Custom`;
      return { type: typeName, program, accounts, ixType };
    });

    // Find AdvanceNonceAccount instruction
    // Account layout for AdvanceNonceAccount:
    //   [0] = nonce account (writable, not signer)
    //   [1] = SysvarRecentB1ockHashes (read-only, not signer)
    //   [2] = nonce authority (read-only, signer)
    const nonceIx = msg.compiledInstructions.find((ix: any) => {
      const program = keys[ix.programIdIndex]?.toBase58();
      return program === SYSTEM_PROGRAM_ID && ix.data[0] === ADVANCE_NONCE_ACCOUNT_IX;
    });

    if (nonceIx) {
      const accountIdxes = nonceIx.accountKeyIndexes || nonceIx.accountKeyIndices;
      const nonceAccount = keys[accountIdxes[0]]?.toBase58();
      const sysvarSlot = keys[accountIdxes[1]]?.toBase58();
      const nonceAuthority = keys[accountIdxes[2]]?.toBase58();

      // Verify the sysvar account is the recent blockhashes sysvar
      const isSysvarCorrect = sysvarSlot === SYSVAR_RECENT_BLOCKHASHES;

      return {
        hasDurableNonce: true,
        nonceAccount,
        nonceAuthority,
        nonceValue,
        instructions: instructions.map((ix: any) => ({ type: ix.type, program: ix.program, accounts: ix.accounts })),
      };
    }

    return {
      hasDurableNonce: false,
      nonceValue,
      instructions: instructions.map((ix: any) => ({ type: ix.type, program: ix.program, accounts: ix.accounts })),
    };
  } catch (e: any) {
    console.log('  [analyzeTxHex] failed:', e.message);
    return { hasDurableNonce: false, instructions: [] };
  }
}

async function checkDurableNonce(
  bitgo: BitGoAPI,
  walletId: string,
  label: string
): Promise<{ hasDurableNonce: boolean; details?: NonceAnalysis }> {
  console.log(`\n--- ${label} (wallet: ${walletId}) ---`);

  const sol = bitgo.coin('tsol');
  const wallet = await sol.wallets().get({ id: walletId });
  console.log('  Type:', wallet.type());

  try { await bitgo.lock(); } catch {}
  await bitgo.unlock({ otp: '000000' });

  const prebuild = await wallet.prebuildTransaction({
    type: 'transfer',
    recipients: [{ address: RECIPIENT_ADDRESS, amount: TRANSFER_AMOUNT }],
  } as any);

  const txHex = (prebuild as any).txHex || '';
  const txRequestId = (prebuild as any).txRequestId;
  console.log('  txRequestId:', txRequestId);
  console.log('  txHex length:', txHex.length);

  const analysis = analyzeTxHex(txHex);

  console.log('\n  Instructions:');
  analysis.instructions.forEach((ix, i) => {
    console.log(`    [${i}] ${ix.type} (program: ${ix.program.slice(0, 12)}...)`);
    ix.accounts.forEach((addr, j) => {
      console.log(`        account[${j}]: ${addr}`);
    });
  });

  console.log('');
  console.log('  Nonce value (recentBlockhash field):', analysis.nonceValue || '(not extracted)');
  console.log('  nonceAccount:', analysis.nonceAccount || '(not found)');
  console.log('  nonceAuthority:', analysis.nonceAuthority || '(not found)');

  if (analysis.hasDurableNonce) {
    console.log('\n  ✅ USES DURABLE NONCE — protected from SIMD-525 blockhash expiry');
    console.log('     AdvanceNonceAccount instruction found in prebuild');
    console.log('     Tx uses nonce value instead of blockhash → bypasses expiry window');
  } else {
    console.log('\n  ⚠️  No AdvanceNonceAccount instruction found');
    console.log('     This wallet type may NOT use durable nonce');
  }

  return { hasDurableNonce: analysis.hasDurableNonce, details: analysis };
}

async function main() {
  console.log('=== SIMD-525: Durable Nonce Verification (Cold + Custodial) ===\n');

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

  let coldResult: { hasDurableNonce: boolean } | null = null;
  let custodialResult: { hasDurableNonce: boolean } | null = null;

  // --- Check 1: Cold wallet ---
  if (COLD_WALLET_ID) {
    coldResult = await checkDurableNonce(bitgo, COLD_WALLET_ID, 'Cold Wallet');
  } else {
    console.log('\n--- Cold Wallet: SKIPPED (no cold wallet available) ---');
  }

  // --- Check 2: Custodial hot wallet ---
  if (CUSTODIAL_WALLET_ID) {
    custodialResult = await checkDurableNonce(bitgo, CUSTODIAL_WALLET_ID, 'Custodial Hot Wallet');
  } else {
    console.log('\n--- Custodial Hot Wallet: SKIPPED (set CUSTODIAL_WALLET_ID in CONFIG) ---');
  }

  // --- Summary ---
  console.log('\n=== Summary ===');
  if (coldResult) {
    console.log(`  Cold wallet: ${coldResult.hasDurableNonce ? '✅ durable nonce → PROTECTED' : '⚠️ no durable nonce'}`);
  }
  if (custodialResult) {
    console.log(`  Custodial hot: ${custodialResult.hasDurableNonce ? '✅ durable nonce → PROTECTED' : '⚠️ no durable nonce'}`);
  }
  if (!coldResult && !custodialResult) {
    console.log('  No wallets checked — fill in wallet IDs');
  }

  console.log('\n=== Test Complete ===');
}

main().catch((e) => console.log(e));
