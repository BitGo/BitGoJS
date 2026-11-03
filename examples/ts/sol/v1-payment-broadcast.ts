/**
 * Solana v1 (SIMD-0296/0385) native SOL payment built by the SDK and broadcast directly
 *
 * Proves the *SDK* surface: V1PaymentBuilder produces a valid 0x81 wire from
 * structured params (sender + recipient + amount + transactionConfig), the wire
 * round-trips through the parser byte-for-byte, and a node accepts it.
 *
 * Counterpart to `v1-payment-bitgo-send.ts`:
 *   - v1-payment-broadcast.ts  — the SDK builds the v1 wire and broadcasts to a node.
 *   - v1-payment-bitgo-send.ts — BitGo builds and broadcasts; the SDK only signs.
 *
 * Assertions worth keeping (each has caught a real regression):
 *   - wire[0] === 0x81 and wire.length <= 4096
 *   - tx.isVersionedTransaction() is true
 *   - parser round-trip: fromRawTransaction(wire) -> toBroadcastFormat() is byte-identical
 *   - cluster reports version 1 for the landed transaction
 *
 * transactionConfig is mandatory for v1 — the builder asserts on it, and the
 * compute-unit limit cannot ride as an instruction the way it does in v0.
 *
 * Env (loaded from the repo-root .env):
 *   SOL_DEVNET_RPC    devnet RPC endpoint                        (required)
 *   SENDER_SECRET_B58 base58 of the 64-byte ed25519 secret key   (required unless DRY_RUN)
 *   RECIPIENT         destination owner address                  (required)
 *   AMOUNT_LAMPORTS   default 1000 (0.000001 SOL)
 *   DRY_RUN           when set, build and assert but do not broadcast
 *   V1_COMPUTE_UNIT_LIMIT       default 200000
 *   V1_PRIORITY_FEE_MICRO_LAMPORTS default 5000
 *
 * Run:
 *   SOL_DEVNET_RPC=<rpc> SENDER_SECRET_B58=<secret> RECIPIENT=<address> \
 *     node_modules/.bin/tsx examples/ts/sol/v1-payment-broadcast.ts
 *
 * Copyright 2026, BitGo, Inc.  All Rights Reserved.
 */
import { KeyPair, Transaction, TransactionBuilderFactory } from '@bitgo/sdk-coin-sol';
import { coins } from '@bitgo/statics';
import { setTimeout as delay } from 'node:timers/promises';

const path = require('path');
const envPath = path.resolve(__dirname, '../../../.env');
require('dotenv').config({ path: envPath });

const RPC_URL = process.env.SOL_DEVNET_RPC || '';
const SENDER_SECRET_B58 = process.env.SENDER_SECRET_B58 || '';
const RECIPIENT = process.env.RECIPIENT || '';
const AMOUNT_LAMPORTS = process.env.AMOUNT_LAMPORTS || '1000';
const DRY_RUN = Boolean(process.env.DRY_RUN);
const COMPUTE_UNIT_LIMIT = Number(process.env.V1_COMPUTE_UNIT_LIMIT || 200_000);
const PRIORITY_FEE = Number(process.env.V1_PRIORITY_FEE_MICRO_LAMPORTS || 5_000);

type JsonObject = Record<string, unknown>;

function asObject(value: unknown): JsonObject | undefined {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? (value as JsonObject) : undefined;
}

function fail(stage: string, message: string, extra?: unknown): never {
  console.error(`\n[FAIL] stage=${stage}: ${message}`);
  if (extra !== undefined) {
    console.error(JSON.stringify(extra, null, 2).slice(0, 2000));
  }
  process.exit(1);
}

/** Minimal JSON-RPC call — keeps the example free of a web3.js dependency. */
async function rpc(url: string, method: string, params: unknown[]): Promise<unknown> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  });
  const body: unknown = await response.json();
  return asObject(body)?.result;
}

async function latestBlockhash(url: string): Promise<string> {
  const result = asObject(await rpc(url, 'getLatestBlockhash', [{ commitment: 'finalized' }]));
  const value = asObject(result?.value);
  const blockhash = value?.blockhash;
  if (typeof blockhash !== 'string' || blockhash.length === 0) {
    fail('blockhash', 'getLatestBlockhash returned no blockhash', result);
  }
  return blockhash;
}

async function main(): Promise<void> {
  if (!RPC_URL) {
    fail('init', 'SOL_DEVNET_RPC is required');
  }
  if (!RECIPIENT) {
    fail('init', 'RECIPIENT is required');
  }
  if (!SENDER_SECRET_B58 && !DRY_RUN) {
    fail('init', 'SENDER_SECRET_B58 is required (base58 of the 64-byte ed25519 secret)');
  }
  if (!SENDER_SECRET_B58) {
    fail('init', 'SENDER_SECRET_B58 is required even for DRY_RUN — the builder needs a signer to assemble slots');
  }

  const senderAddress = new KeyPair({ prv: SENDER_SECRET_B58 }).getKeys().pub;
  console.log('=== Solana v1 native payment (SDK built, direct broadcast) ===');
  console.log(`sender=${senderAddress} amount=${AMOUNT_LAMPORTS} lamports dryRun=${DRY_RUN}`);

  // ---- build -------------------------------------------------------------
  const blockhash = await latestBlockhash(RPC_URL);
  const builder = new TransactionBuilderFactory(coins.get('sol')).getV1PaymentBuilder();
  builder.sender(senderAddress).feePayer(senderAddress).nonce(blockhash).transactionConfig({
    computeUnitLimit: COMPUTE_UNIT_LIMIT,
    priorityFee: PRIORITY_FEE,
    loadedAccountsDataSizeLimit: 65_536,
    heapSize: 32_768,
  });
  builder.send({ address: RECIPIENT, amount: AMOUNT_LAMPORTS });
  builder.sign({ key: SENDER_SECRET_B58 });

  const built = await builder.build();
  if (!(built instanceof Transaction)) {
    fail('build', `builder returned ${built.constructor.name}, expected a Solana Transaction`);
  }
  const transaction = built;
  const broadcastFormat = transaction.toBroadcastFormat();
  const wire = Buffer.from(broadcastFormat, 'base64');

  console.log(`  blockhash=${blockhash}`);
  console.log(`  isVersionedTransaction=${transaction.isVersionedTransaction()}`);
  console.log(`  wire[0]=0x${wire[0].toString(16)} wireBytes=${wire.length}`);

  if (!transaction.isVersionedTransaction()) {
    fail('build', 'builder produced a non-versioned transaction');
  }
  if (wire[0] !== 0x81) {
    fail('build', `wire does not start with the v1 prefix 0x81 (got 0x${wire[0].toString(16)})`);
  }
  if (wire.length > 4096) {
    fail('build', `v1 wire is ${wire.length} bytes, over the 4096 limit`);
  }

  // ---- parser round-trip -------------------------------------------------
  const reparsed = new Transaction(coins.get('sol'));
  reparsed.fromRawTransaction(broadcastFormat);
  if (reparsed.toBroadcastFormat() !== broadcastFormat) {
    fail('roundtrip', 'parser round-trip changed the wire bytes');
  }
  console.log('  ok: parser round-trip is byte-identical');

  if (DRY_RUN) {
    console.log('\nRESULT: v1 wire built and asserted (DRY_RUN — not broadcast)');
    return;
  }

  // ---- broadcast ---------------------------------------------------------
  console.log('\n[2/3] BROADCAST — sendTransaction (base64)');
  const signature = await rpc(RPC_URL, 'sendTransaction', [broadcastFormat, { encoding: 'base64', maxRetries: 3 }]);
  if (typeof signature !== 'string' || signature.length === 0) {
    fail('broadcast', 'sendTransaction returned no signature', signature);
  }
  console.log(`  ok: signature=${signature}`);

  // ---- confirm -----------------------------------------------------------
  console.log('\n[3/3] CONFIRM — reading the on-chain version');
  let onChainVersion: unknown;
  for (let attempt = 0; attempt < 30; attempt++) {
    const result = asObject(
      await rpc(RPC_URL, 'getTransaction', [signature, { encoding: 'json', maxSupportedTransactionVersion: 1 }])
    );
    if (result) {
      const meta = asObject(result.meta);
      if (meta?.err) {
        fail('confirm', `transaction landed with an error: ${JSON.stringify(meta.err)}`, { signature });
      }
      onChainVersion = result.version;
      console.log(`  ok: slot=${String(result.slot)} version=${String(onChainVersion)}`);
      break;
    }
    await delay(2000);
  }
  if (onChainVersion === undefined) {
    fail('confirm', 'transaction not visible within 60s', { signature });
  }
  if (onChainVersion !== 1) {
    fail('confirm', `cluster reports version=${String(onChainVersion)} — expected 1`, { signature });
  }

  console.log(`\nRESULT: v1 payment CONFIRMED: ${signature} (version 1, ${wire.length} bytes)`);
}

main().catch((e) => {
  console.error('FATAL:', e);
  process.exit(1);
});
