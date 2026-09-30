/**
 * CHALO-1602 Verification: SDK-built Solana v1 Confidential Transfer broadcast
 *
 * Builds a Token-2022 confidential Transfer as a v1 transaction (SIMD-0296/0385)
 * via the SDK ConfidentialTransferBuilder, consumes pre-created proof contexts,
 * and broadcasts + confirms on devnet.
 *
 * Prerequisites (produced by coins-sandbox `sol/confidentialTransfers/ct_sdk_feed.mjs`):
 *   - sdk-e2e-input.json: source/dest ATA, mint, pre-created proof-context accounts,
 *     and the transfer ciphertext fields (no credentials).
 *   - extB_e2e.json: source authority secret (for signing).
 *   - A funded devnet fee payer secret (base64 of the 64-byte ed25519 secret).
 *
 * Run:
 *   SOL_DEVNET_RPC=<rpc> SDK_E2E_INPUT=<path/sdk-e2e-input.json> EXTB_STATE=<path/extB_e2e.json> \
 *     PAYER_SECRET_B64=<base64> node_modules/.bin/tsx examples/ts/sol/sdk-ct-v1-broadcast.ts
 *
 * Copyright 2026, BitGo, Inc.  All Rights Reserved.
 */
import { KeyPair, Transaction, TransactionBuilderFactory } from '@bitgo/sdk-coin-sol';
import { coins } from '@bitgo/statics';
import { Connection } from '@solana/web3.js';
import * as bs58 from 'bs58';
import { readFileSync } from 'node:fs';

const path = require('path');
const envPath = path.resolve(__dirname, '../../../.env');
require('dotenv').config({ path: envPath });

async function main() {
  const rpcUrl = process.env.SOL_DEVNET_RPC;
  const inputPath = process.env.SDK_E2E_INPUT;
  const statePath = process.env.EXTB_STATE;
  const payerSecretB64 = process.env.PAYER_SECRET_B64;
  if (!rpcUrl || !inputPath || !statePath || !payerSecretB64) {
    throw new Error('SOL_DEVNET_RPC, SDK_E2E_INPUT, EXTB_STATE, PAYER_SECRET_B64 env are required');
  }

  const input = JSON.parse(readFileSync(inputPath, 'utf8'));
  const e2e = JSON.parse(readFileSync(statePath, 'utf8'));
  const authoritySecret = bs58.encode(Uint8Array.from(e2e.ownerSecretKey));
  const payerSecret = bs58.encode(Uint8Array.from(Buffer.from(payerSecretB64, 'base64')));
  const payerAddress = new KeyPair({ prv: payerSecret }).getKeys().pub;
  const authorityAddress = input.authorityAddress;

  const connection = new Connection(rpcUrl, 'confirmed');
  const { blockhash } = await connection.getLatestBlockhash('finalized');

  const factory = new TransactionBuilderFactory(coins.get('sol'));
  const builder = factory.getConfidentialTransferBuilder();
  builder.nonce(blockhash).sender(authorityAddress).feePayer(payerAddress);
  builder.sign({ key: payerSecret });
  builder.sign({ key: authoritySecret });
  builder.version(1).transactionConfig({
    computeUnitLimit: 1_400_000,
    heapSize: null,
    loadedAccountsDataSizeLimit: 1_048_576,
    priorityFee: 5_000,
  });
  builder.confidentialTransfer({
    sourceTokenAddress: input.sourceTokenAddress,
    mintAddress: input.mintAddress,
    destinationTokenAddress: input.destinationTokenAddress,
    authorityAddress,
    equalityProofContextStateAddress: input.equalityProofContextStateAddress,
    ciphertextValidityProofContextStateAddress: input.ciphertextValidityProofContextStateAddress,
    rangeProofContextStateAddress: input.rangeProofContextStateAddress,
    newSourceDecryptableAvailableBalance: input.newSourceDecryptableAvailableBalance,
    transferAmountAuditorCiphertextLo: input.transferAmountAuditorCiphertextLo,
    transferAmountAuditorCiphertextHi: input.transferAmountAuditorCiphertextHi,
    equalityProofInstructionOffset: 0,
    ciphertextValidityProofInstructionOffset: 0,
    rangeProofInstructionOffset: 0,
  });

  const tx = (await builder.build()) as Transaction;
  const b64 = tx.toBroadcastFormat();
  const wire = Buffer.from(b64, 'base64');
  console.log('SDK-built tx isVersioned:', tx.isVersionedTransaction());
  console.log('wire[0] = 0x' + wire[0].toString(16) + (wire[0] === 0x81 ? ' (v1)' : ' (NOT v1!)'));
  console.log('wire bytes =', wire.length);
  if (wire[0] !== 0x81) throw new Error('SDK builder did not produce a v1 transaction');
  if (wire.length > 4096) throw new Error('SDK v1 tx exceeds 4096 bytes');

  const signature = await connection.sendEncodedTransaction(b64, { encoding: 'base64', maxRetries: 3 });
  console.log('broadcast signature:', signature);

  let confirmed = false;
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    const status = await connection.getSignatureStatus(signature);
    const s = status?.value;
    if (s && (s.confirmationStatus === 'confirmed' || s.confirmationStatus === 'finalized')) {
      confirmed = true;
      if (s.err) throw new Error('SDK-built v1 tx failed: ' + JSON.stringify(s.err));
      console.log('confirmed at slot', s.slot);
      break;
    }
    if (s?.err) throw new Error('SDK-built v1 tx errored: ' + JSON.stringify(s.err));
  }
  if (!confirmed) throw new Error('SDK-built v1 tx not confirmed within 60s');
  console.log('SDK-built v1 CT Transfer CONFIRMED:', signature, '| wire bytes', wire.length);
}

main().catch((e) => {
  console.error('FATAL:', e);
  process.exit(1);
});
