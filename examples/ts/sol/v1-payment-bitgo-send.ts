/**
 * Solana v1 (SIMD-0296/0385) native SOL payment through the BitGo API
 *
 * Proves the *server* path end to end: the intent carries `version: 1`, wallet
 * platform builds the 0x81 wire, the SDK signs the txRequest, and BitGo accepts
 * the signed wire at POST /wallet/{id}/tx/send.
 *
 * Counterpart to `v1-payment-broadcast.ts`:
 *   - v1-payment-broadcast.ts  — the SDK builds the v1 wire and broadcasts to a node.
 *   - v1-payment-bitgo-send.ts — BitGo builds and broadcasts; the SDK only signs.
 *
 * Stages are reported separately so a failure names the leg that broke:
 *   1. PREBUILD — intent accepted, server returned a v1 wire, `intent.version` persisted
 *   2. SIGN     — txRequest signed; the signed wire is checked when the API echoes it
 *   3. SEND     — POST /tx/send accepted the signed wire (the leg that regressed CHALO-1940)
 *   4. CONFIRM  — optional, needs SOL_DEVNET_RPC; asserts the cluster reports version 1
 *
 * A silent v0 fallback is the failure mode this example exists to catch: if the
 * SDK drops the version marker the server builds a v0 payment and everything
 * "succeeds". Stage 1 therefore inspects the wire prefix rather than trusting
 * the request.
 *
 * Env (loaded from the repo-root .env, override anything on the command line):
 *   TESTNET_ACCESS_TOKEN | STAGING_ACCESS_TOKEN   staging API token
 *   SOL_WALLET_ID                                 tsol hot wallet id        (required)
 *   SOL_WALLET_PASSPHRASE                         wallet passphrase         (required)
 *   RECIPIENT                                     destination owner address (required)
 *   AMOUNT_LAMPORTS                               default 1000 (0.000001 SOL)
 *   SOL_BITGO_ENV                                 default 'staging' (never BITGO_ENV)
 *   SOL_DEVNET_RPC                                optional confirmation probe
 *   OTP                                           default '000000'
 *
 * Run:
 *   SOL_WALLET_ID=<id> SOL_WALLET_PASSPHRASE=<passphrase> RECIPIENT=<address> \
 *     node_modules/.bin/tsx examples/ts/sol/v1-payment-bitgo-send.ts
 *
 * Copyright 2026, BitGo, Inc.  All Rights Reserved.
 */
import { BitGoAPI } from '@bitgo/sdk-api';
import { Tsol } from '@bitgo/sdk-coin-sol';
import { coins } from '@bitgo/statics';
import { setTimeout as delay } from 'node:timers/promises';

const path = require('path');
const envPath = path.resolve(__dirname, '../../../.env');
require('dotenv').config({ path: envPath });

const ACCESS_TOKEN = process.env.TESTNET_ACCESS_TOKEN || process.env.STAGING_ACCESS_TOKEN || '';
const WALLET_ID = process.env.SOL_WALLET_ID || '';
const WALLET_PASSPHRASE = process.env.SOL_WALLET_PASSPHRASE || '';
const RECIPIENT = process.env.RECIPIENT || '';
const AMOUNT_LAMPORTS = process.env.AMOUNT_LAMPORTS || '1000';
const BITGO_ENV = process.env.SOL_BITGO_ENV === 'test' ? 'test' : 'staging';
const RPC_URL = process.env.SOL_DEVNET_RPC || '';
const OTP = process.env.OTP || '000000';

type JsonObject = Record<string, unknown>;

/** Narrow untrusted JSON to an object. */
function asObject(value: unknown): JsonObject | undefined {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? (value as JsonObject) : undefined;
}

/** Narrow untrusted JSON to a non-empty string. */
function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function fail(stage: string, message: string, extra?: unknown): never {
  console.error(`\n[FAIL] stage=${stage}: ${message}`);
  if (extra !== undefined) {
    console.error(JSON.stringify(extra, null, 2).slice(0, 2000));
  }
  process.exit(1);
}

/**
 * Decode a wire that may arrive base64- or hex-encoded.
 * @param {string} txHex serialized transaction in either encoding
 * @returns {{ wire: Buffer; encoding: string } | null} bytes when they start with 0x81
 */
function decodeV1Wire(txHex: string): { wire: Buffer; encoding: string } | null {
  for (const encoding of ['base64', 'hex'] as const) {
    try {
      const wire = Buffer.from(txHex, encoding);
      if (wire.length > 0 && wire[0] === 0x81) {
        return { wire, encoding };
      }
    } catch {
      // try the next encoding
    }
  }
  return null;
}

/**
 * Read the serialized wire out of a txRequest-shaped payload.
 * @param {JsonObject} payload txRequest body from the API
 * @returns {string} the wire, or an empty string when the field is absent
 */
function wireFromTxRequest(payload: JsonObject): string {
  const unsigned = asObject(payload.unsignedTxs);
  const firstUnsigned = Array.isArray(payload.unsignedTxs) ? asObject(payload.unsignedTxs[0]) : undefined;
  const transactions = Array.isArray(payload.transactions) ? payload.transactions : [];
  const firstTransaction = asObject(transactions[0]);
  return (
    asString(firstUnsigned?.serializedTxHex) ??
    asString(asObject(firstTransaction?.unsignedTx)?.serializedTxHex) ??
    asString(asObject(unsigned?.[0])?.serializedTxHex) ??
    ''
  );
}

/** Minimal JSON-RPC call — avoids pulling @solana/web3.js in for one probe. */
async function rpc(url: string, method: string, params: unknown[]): Promise<unknown> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  });
  const body: unknown = await response.json();
  return asObject(body)?.result;
}

async function main(): Promise<void> {
  if (!ACCESS_TOKEN) {
    fail('init', 'no access token (set TESTNET_ACCESS_TOKEN or STAGING_ACCESS_TOKEN in .env)');
  }
  if (!WALLET_ID) {
    fail('init', 'SOL_WALLET_ID is required');
  }
  if (!WALLET_PASSPHRASE) {
    fail('init', 'SOL_WALLET_PASSPHRASE is required');
  }
  if (!RECIPIENT) {
    fail('init', 'RECIPIENT is required');
  }

  console.log('=== Solana v1 payment through the BitGo API ===');
  console.log(`env=${BITGO_ENV} wallet=${WALLET_ID} amount=${AMOUNT_LAMPORTS} lamports`);

  const bitgo = new BitGoAPI({ accessToken: ACCESS_TOKEN, env: BITGO_ENV });
  const coin = coins.get('tsol');
  bitgo.register(coin.name, Tsol.createInstance);
  const sol = bitgo.coin('tsol');

  const wallet = await sol.wallets().get({ id: WALLET_ID });
  if (wallet.type() !== 'hot') {
    fail('init', `this example requires a hot wallet, got: ${wallet.type()}`);
  }
  console.log(`wallet type=${wallet.type()} multisig=${wallet.multisigType()}`);

  try {
    await bitgo.lock();
  } catch {
    // session was not locked — not an error
  }
  await bitgo.unlock({ otp: OTP, duration: 3600 });

  // ---- stage 1: PREBUILD -------------------------------------------------
  console.log('\n[1/4] PREBUILD — asking the server for a v1 wire');
  const prebuild = await wallet.prebuildTransaction({
    type: 'transfer',
    recipients: [{ address: RECIPIENT, amount: AMOUNT_LAMPORTS }],
    version: 1,
    walletPassphrase: WALLET_PASSPHRASE,
  });

  const prebuildFields = asObject(prebuild) ?? {};
  const txPrebuildFields = asObject(prebuildFields.txPrebuild) ?? prebuildFields;
  const prebuildHex = asString(txPrebuildFields.txHex) ?? '';
  const v1Wire = decodeV1Wire(prebuildHex);
  if (!v1Wire) {
    fail(
      'prebuild',
      'server returned a non-v1 wire — the SDK dropped the version marker (SOL intent version forwarding) or the platform rejected it',
      { txHexPrefix: prebuildHex.slice(0, 12), fields: Object.keys(prebuildFields) }
    );
  }
  console.log(
    `  ok: v1 wire (${v1Wire.wire.length} bytes, ${v1Wire.encoding}), txid=${
      asString(txPrebuildFields.txid) ?? '(unsigned)'
    }`
  );

  const prebuildRequestId = asString(prebuildFields.txRequestId) ?? asString(txPrebuildFields.txRequestId) ?? '';
  if (!prebuildRequestId) {
    fail('prebuild', 'no txRequestId on the prebuild response');
  }

  // Intent-bearing prebuilds return the txRequest from POST /wallet/{id}/txrequests.
  // There is no GET-by-id route, so read it back the way the SDK does: list with a filter.
  const txRequestList = asObject(
    await bitgo
      .get(bitgo.url(`/wallet/${WALLET_ID}/txrequests`, 2))
      .query({ txRequestIds: prebuildRequestId, latest: 'true' })
      .result()
  );
  const txRequests = Array.isArray(txRequestList?.txRequests) ? txRequestList.txRequests : [];
  const txRequest = asObject(txRequests[0]);
  const intentVersion = asObject(txRequest?.intent)?.version ?? asObject(prebuildFields.intent)?.version;
  if (intentVersion !== 1) {
    fail('prebuild', `txRequest intent.version=${JSON.stringify(intentVersion)} — expected 1`, {
      state: txRequest?.state,
    });
  }
  console.log(`  ok: txRequest ${prebuildRequestId} state=${String(txRequest?.state)} intent.version=1`);

  // ---- stage 2: SIGN ----------------------------------------------------
  console.log('\n[2/4] SIGN — signing the txRequest');
  const keychains = await sol.keychains().getKeysForSigning({ wallet });
  const signed = await wallet.signTransaction({
    txPrebuild: prebuild,
    keychain: keychains[0],
    walletPassphrase: WALLET_PASSPHRASE,
    pubs: keychains.map((keychain) => keychain.pub).filter((pub): pub is string => typeof pub === 'string'),
  });

  const signedFields = asObject(signed) ?? {};
  const signedRequestId =
    asString(signedFields.txRequestId) ?? asString(signedFields.latestTxRequestId) ?? prebuildRequestId;
  const signedWire = decodeV1Wire(wireFromTxRequest(signedFields));
  if (signedWire) {
    console.log(`  ok: signed wire is v1 (${signedWire.wire.length} bytes) requestId=${signedRequestId}`);
  } else {
    console.log(
      `  note: signed wire not echoed in the response — v1 shape is enforced at PREBUILD and SEND (requestId=${signedRequestId})`
    );
  }

  // ---- stage 3: SEND ----------------------------------------------------
  console.log('\n[3/4] SEND — POST /tx/send');
  let submitted: unknown;
  try {
    submitted = await bitgo
      .post(sol.url(`/wallet/${WALLET_ID}/tx/send`))
      .send({ txRequestId: signedRequestId })
      .result();
  } catch (err) {
    const error = asObject(err) ?? {};
    const body = typeof error.result === 'string' ? error.result : JSON.stringify(error.result ?? {});
    if (body.includes('Failed to deserialize transaction')) {
      fail(
        'send',
        'server could not deserialize the v1 wire — the send-time re-parse took the v0 branch for a structured v1 record (the CHALO-1940 regression)',
        { statusCode: error.statusCode, body: body.slice(0, 500) }
      );
    }
    fail('send', 'POST /tx/send failed', { statusCode: error.statusCode, body: body.slice(0, 500) });
  }

  const submittedFields = asObject(submitted) ?? {};
  const txid = asString(submittedFields.txid) ?? asString(submittedFields.txHash);
  if (!txid) {
    fail('send', 'no txid in the send response', submitted);
  }
  console.log(`  ok: accepted by /tx/send — txid=${txid}`);

  // ---- stage 4: CONFIRM (optional) --------------------------------------
  if (!RPC_URL) {
    console.log('\n[4/4] CONFIRM — skipped (set SOL_DEVNET_RPC to probe the cluster)');
    console.log(`\nRESULT: v1 wire built, signed and accepted by /tx/send (txid ${txid})`);
    return;
  }

  console.log('\n[4/4] CONFIRM — reading the on-chain version');
  let onChainVersion: unknown;
  for (let attempt = 0; attempt < 30; attempt++) {
    const result = asObject(
      await rpc(RPC_URL, 'getTransaction', [txid, { encoding: 'json', maxSupportedTransactionVersion: 1 }])
    );
    if (result) {
      const meta = asObject(result.meta);
      if (meta?.err) {
        fail('confirm', `transaction landed with an error: ${JSON.stringify(meta.err)}`, { txid });
      }
      onChainVersion = result.version;
      console.log(`  ok: slot=${String(result.slot)} version=${String(onChainVersion)}`);
      break;
    }
    await delay(2000);
  }
  if (onChainVersion === undefined) {
    fail('confirm', 'transaction not visible within 60s', { txid });
  }
  if (onChainVersion !== 1) {
    fail('confirm', `cluster reports version=${String(onChainVersion)} — expected 1`, { txid });
  }

  console.log(`\nRESULT: v1 payment CONFIRMED (txid ${txid}, version 1)`);
}

main().catch((e) => {
  console.error('FATAL:', e);
  process.exit(1);
});
