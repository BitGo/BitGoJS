/**
 * Simulate a CW-20 deposit to a BitGo SEI custody address (CGD-1093).
 *
 * The audit claim: SEI's Cosmos-layer indexer (CosmosLikeTransaction.java
 * parseEventsToCreateEntries) only handles `coin_received`, `coin_spent`, and
 * `withdraw_rewards` events. CW-20 transfers go through MsgExecuteContract and
 * emit `wasm` module events, not `coin_received`. The indexer never sees them,
 * so the deposit is silently missed.
 *
 * This script reproduces that path end-to-end: it sends a CW-20 `transfer`
 * to a victim BitGo SEI address and prints the resulting tx hash. The
 * on-chain CW-20 balance of the victim increases, but BitGo's indexer /
 * wallet-platform should not create a transfer entry for it — proving the
 * gap.
 *
 * NOTE: Same CometBFT 0.38 / Tendermint 0.34 RPC adapter mismatch as the
 * CGD-774 atom script. We sign locally with SigningStargateClient.sign()
 * and broadcast via the REST /cosmos/tx/v1beta1/txs endpoint to avoid
 * "Invalid base64 string format" decode errors.
 *
 * Usage:
 *   ATTACKER_MNEMONIC="word1 word2 ..." \
 *   VICTIM_ADDRESS="sei1..." \
 *   CW20_CONTRACT="sei1..." \
 *   npx ts-node examples/ts/sei/simulate-cw20-deposit.ts
 *
 * Optional env vars:
 *   TRANSFER_AMOUNT  CW-20 sub-unit amount to send (default: 1000)
 *   RPC_ENDPOINT     (default: SEI atlantic-2 testnet)
 *   REST_ENDPOINT    (default: SEI atlantic-2 testnet)
 */

// ─── Test credentials used in CGD-1093 simulation ───────────────────────────
// Attacker mnemonic : prosper pledge defense friend energy gorilla height arrest prosper december whisper prosper junior rhythm young coconut patient actress creek battle coral dismiss cloth cigar
// Attacker address  : sei1j4duheg4uy7en9vcp0xm7hndccc3euwpx7utx2
// CW-20 contract    : sei1zwugu0vce6fq7ccfg9u5j8tcf6cs2u5u7ydu9eknyt45puj8kt3qkwznf6  (BGTEST, 6 decimals)
// Victim address    : sei194qplcsmltpm53zwf6mzqsau4ua6as6e3zg2e0  (BitGo tsei test wallet)
//                     → received 100 BGTEST (100,000,000 sub-units)
//                     → tx: 9D9B0512D4938AD41A48381B5141B2C4CE744D6CB9F377ACFEA28868DB0E3D1C
//                     → block was processed by indexer, no transfer entry created (gap reproduced)
// ────────────────────────────────────────────────────────────────────────────

import https from 'https';
import { DirectSecp256k1HdWallet, Registry } from '@cosmjs/proto-signing';
import { SigningStargateClient, defaultRegistryTypes } from '@cosmjs/stargate';
import { MsgExecuteContract } from 'cosmjs-types/cosmwasm/wasm/v1/tx';
import { TxRaw } from 'cosmjs-types/cosmos/tx/v1beta1/tx';

// ─── SEI atlantic-2 testnet defaults ─────────────────────────────────────────
const DEFAULT_RPC = 'https://rpc-testnet.sei-apis.com';
const DEFAULT_REST = 'https://rest-testnet.sei-apis.com';
const DENOM = 'usei';
const ADDRESS_PREFIX = 'sei';

const EXECUTE_CONTRACT_TYPE_URL = '/cosmwasm.wasm.v1.MsgExecuteContract';

async function main() {
  const attackerMnemonic = process.env.ATTACKER_MNEMONIC;
  const victimAddress = process.env.VICTIM_ADDRESS;
  const cw20Contract = process.env.CW20_CONTRACT;
  const transferAmount = process.env.TRANSFER_AMOUNT ?? '1000';
  const rpcEndpoint = process.env.RPC_ENDPOINT ?? DEFAULT_RPC;
  const restEndpoint = process.env.REST_ENDPOINT ?? DEFAULT_REST;

  if (!attackerMnemonic || !victimAddress || !cw20Contract) {
    console.error('');
    console.error('Usage:');
    console.error('  ATTACKER_MNEMONIC="word1 word2 ..." \\');
    console.error('  VICTIM_ADDRESS="sei1..." \\');
    console.error('  CW20_CONTRACT="sei1..." \\');
    console.error('  npx ts-node examples/ts/sei/simulate-cw20-deposit.ts');
    console.error('');
    process.exit(1);
  }

  console.log('=== SEI CW-20 Deposit Simulation (CGD-1093) ===\n');
  console.log(`RPC  endpoint   : ${rpcEndpoint}`);
  console.log(`REST endpoint   : ${restEndpoint}`);
  console.log(`CW-20 contract  : ${cw20Contract}`);
  console.log(`Victim address  : ${victimAddress}`);
  console.log(`Transfer amount : ${transferAmount} (CW-20 sub-units)\n`);

  // ─── Attacker wallet ─────────────────────────────────────────────────────
  const attackerWallet = await DirectSecp256k1HdWallet.fromMnemonic(attackerMnemonic, {
    prefix: ADDRESS_PREFIX,
  });
  const [attackerAccount] = await attackerWallet.getAccounts();
  console.log(`Attacker address: ${attackerAccount.address}`);

  // ─── Step 1: Pre-transfer native balances ────────────────────────────────
  // NOTE: SEI atlantic-2 nodes return "Not Implemented" for the wasm gRPC-gateway
  // REST routes (/cosmwasm/wasm/v1/*), so we can't query CW-20 balances over REST.
  // We rely on the wasm event in the broadcast tx response (Step 3) as proof of
  // the on-chain transfer instead.
  console.log('\n─── Step 1: Pre-transfer native balances ────────────────────');
  await queryNativeBalance(restEndpoint, attackerAccount.address, 'attacker');
  await queryNativeBalance(restEndpoint, victimAddress, 'victim  ');

  // ─── Step 2: Build MsgExecuteContract { transfer } ───────────────────────
  // CW-20 transfer payload — encoded inline as JSON, then UTF-8 bytes.
  const cw20TransferMsg = {
    transfer: {
      recipient: victimAddress,
      amount: transferAmount,
    },
  };
  const msgBytes = Buffer.from(JSON.stringify(cw20TransferMsg), 'utf-8');

  const msg = {
    typeUrl: EXECUTE_CONTRACT_TYPE_URL,
    value: MsgExecuteContract.fromPartial({
      sender: attackerAccount.address,
      contract: cw20Contract,
      msg: msgBytes,
      funds: [],
    }),
  };

  const registry = new Registry([...defaultRegistryTypes, [EXECUTE_CONTRACT_TYPE_URL, MsgExecuteContract]]);

  const signingClient = await SigningStargateClient.connectWithSigner(rpcEndpoint, attackerWallet, {
    registry,
  });

  const fee = {
    amount: [{ denom: DENOM, amount: '20000' }],
    gas: '300000',
  };

  console.log('\n─── Step 2: Broadcasting MsgExecuteContract { transfer } ────');
  console.log(`  sender    : ${attackerAccount.address}`);
  console.log(`  contract  : ${cw20Contract}`);
  console.log(`  payload   : ${JSON.stringify(cw20TransferMsg)}`);

  // Sign locally — same workaround as CGD-774 atom script.
  const signedTx = await signingClient.sign(attackerAccount.address, [msg], fee, '');
  const txBytes = TxRaw.encode(signedTx).finish();
  const txBase64 = Buffer.from(txBytes).toString('base64');

  const broadcastRes = await restPost(`${restEndpoint}/cosmos/tx/v1beta1/txs`, {
    tx_bytes: txBase64,
    mode: 'BROADCAST_MODE_SYNC',
  });

  const txResponse = broadcastRes?.tx_response;
  if (!txResponse) {
    console.error('\nUnexpected broadcast response:', JSON.stringify(broadcastRes));
    process.exit(1);
  }

  if (txResponse.code !== 0) {
    console.error(`\nTransaction FAILED (code ${txResponse.code})`);
    console.error(`Raw log: ${txResponse.raw_log}`);
    process.exit(1);
  }

  console.log(`\nTransaction SUBMITTED ✓`);
  console.log(`  Hash    : ${txResponse.txhash}`);
  console.log(`  Explorer: https://www.seiscan.app/atlantic-2/txs/${txResponse.txhash}`);

  // Wait briefly for the tx to land in a block before re-querying.
  console.log('\nWaiting 6s for inclusion...');
  await new Promise((r) => setTimeout(r, 6000));

  // ─── Step 3: Confirm on-chain via wasm event (the gap evidence) ──────────
  console.log('\n─── Step 3: On-chain wasm event (what indexer should catch) ──');
  const finalTx = await restGet(`${restEndpoint}/cosmos/tx/v1beta1/txs/${txResponse.txhash}`);
  // SEI emits top-level events with base64-encoded keys/values; logs[0].events
  // has the same data already decoded. Prefer logs.
  const events = finalTx?.tx_response?.logs?.[0]?.events ?? finalTx?.tx_response?.events ?? [];
  const wasmEvents = events.filter((e: any) => e.type === 'wasm');
  if (wasmEvents.length === 0) {
    console.log('  (no wasm event found — tx may not be indexed yet)');
  } else {
    for (const ev of wasmEvents) {
      console.log('  type: wasm');
      for (const a of ev.attributes) {
        const key = looksBase64(a.key) ? Buffer.from(a.key, 'base64').toString('utf-8') : a.key;
        const value = looksBase64(a.value) ? Buffer.from(a.value, 'base64').toString('utf-8') : a.value;
        console.log(`    ${key}: ${value}`);
      }
    }
  }
  await queryNativeBalance(restEndpoint, victimAddress, 'victim native after');

  // ─── Step 4: Verification checklist ──────────────────────────────────────
  console.log('\n─── Step 4: BitGo indexer verification ──────────────────────');
  console.log('The CW-20 balance of the victim should have increased on-chain.');
  console.log('Now verify that BitGo did NOT see the deposit:\n');
  console.log('  1. Indexer DB (Mongo):');
  console.log(`     db.transactions.find({ _id: "${txResponse.txhash.toLowerCase()}" })`);
  console.log('     → entries[] should be empty / no TYPE_TRANSFER for the victim');
  console.log('  2. Wallet-platform transfers:');
  console.log(`     GET /api/v2/tsei/wallet/<id>/transfer?txid=${txResponse.txhash.toLowerCase()}`);
  console.log('     → expected: 404 / no transfer document created');
  console.log('');
  console.log('If both checks confirm the deposit is missing, the CGD-1093 claim is');
  console.log('reproduced: SEI Cosmos-layer indexer silently drops CW-20 deposits.');
}

/** Heuristic: keys/values in SEI top-level events are base64-encoded ASCII. */
function looksBase64(s: string): boolean {
  return /^[A-Za-z0-9+/]+={0,2}$/.test(s) && s.length % 4 === 0 && s.length >= 4;
}

/** Native usei balance via bank module. */
async function queryNativeBalance(restEndpoint: string, address: string, label: string): Promise<void> {
  try {
    const body = await restGet(`${restEndpoint}/cosmos/bank/v1beta1/balances/${address}`);
    console.log(`${label.padEnd(18)}: ${JSON.stringify(body?.balances ?? [])}`);
  } catch (e: any) {
    console.log(`${label.padEnd(18)}: (query error: ${e.message})`);
  }
}

/** HTTP GET — returns parsed JSON body, throws on Cosmos REST error code. */
function restGet(url: string): Promise<any> {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let raw = '';
        res.on('data', (chunk) => (raw += chunk));
        res.on('end', () => {
          try {
            const body = JSON.parse(raw);
            if (body.code && body.code !== 0) {
              const err: any = new Error(body.message ?? `REST error code ${body.code}`);
              err.code = body.code;
              return reject(err);
            }
            resolve(body);
          } catch {
            reject(new Error(`Failed to parse response from ${url}`));
          }
        });
      })
      .on('error', reject);
  });
}

/** HTTP POST JSON — returns parsed JSON body. */
function restPost(url: string, payload: unknown): Promise<any> {
  const data = JSON.stringify(payload);
  const parsed = new URL(url);
  const options = {
    hostname: parsed.hostname,
    path: parsed.pathname + parsed.search,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data),
    },
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let raw = '';
      res.on('data', (chunk) => (raw += chunk));
      res.on('end', () => {
        try {
          resolve(JSON.parse(raw));
        } catch {
          reject(new Error(`Failed to parse broadcast response`));
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

main().catch((e) => {
  console.error('\nFatal error:', e.message ?? e);
  process.exit(1);
});
