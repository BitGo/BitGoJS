/**
 * Shared SEI testnet (atlantic-2) helper used by every CGD-1483 msg-type
 * simulation script.
 *
 * Why a shared lib:
 *   - cosmjs SigningStargateClient doesn't ship every Sei-specific Msg, and
 *     RPC broadcast on Sei testnet hits the same "Invalid base64" CometBFT
 *     0.38 / Tendermint 0.34 mismatch that CGD-774 / CGD-1093 already
 *     worked around. We sign locally and broadcast via REST.
 *   - Every simulation needs the same fixture-capture flow: broadcast →
 *     wait for inclusion → fetch `tx_response` → write JSON to
 *     `fixtures/<msg>.json`.
 *
 * Public surface:
 *   - buildAttacker(mnemonic, extraRegistryTypes?) → { wallet, address, client, registry }
 *   - signAndBroadcast(client, address, msgs, fee, memo?) → tx_response
 *   - waitForTx(restEndpoint, txHash) → tx_response (polled, up to 60s)
 *   - lcdGet(restEndpoint, path, headers?) → JSON
 *   - lcdPost(restEndpoint, path, body) → JSON
 *   - captureFixture(name, payload) → writes fixtures/<name>.json
 *
 * Defaults match the existing CGD-774/CGD-1093 SEI scripts (atlantic-2).
 *
 * Funded attacker mnemonic (kept out of source — pass via ATTACKER_MNEMONIC env):
 *   `prosper pledge defense friend energy gorilla height arrest prosper december ...`
 *   address: sei1j4duheg4uy7en9vcp0xm7hndccc3euwpx7utx2
 */

import fs from 'fs';
import path from 'path';
import https from 'https';
import { DirectSecp256k1HdWallet, Registry } from '@cosmjs/proto-signing';
import { SigningStargateClient, defaultRegistryTypes } from '@cosmjs/stargate';
import { TxRaw } from 'cosmjs-types/cosmos/tx/v1beta1/tx';

export const DEFAULTS = {
  rpcEndpoint: process.env.RPC_ENDPOINT ?? 'https://rpc-testnet.sei-apis.com',
  restEndpoint: process.env.REST_ENDPOINT ?? 'https://rest-testnet.sei-apis.com',
  fallbackRest: process.env.REST_ENDPOINT_FALLBACK ?? 'https://rest.atlantic-2.seinetwork.io',
  denom: 'usei',
  addressPrefix: 'sei',
  chainId: 'atlantic-2',
  explorer: 'https://www.seiscan.app/atlantic-2',
};

export const FIXTURE_DIR = path.resolve(__dirname, '..', 'fixtures');

export interface Attacker {
  wallet: DirectSecp256k1HdWallet;
  address: string;
  client: SigningStargateClient;
  registry: Registry;
}

export type TypeUrlPair = [string, any];

/** Build a cosmjs signer + Stargate client for the attacker mnemonic. */
export async function buildAttacker(
  mnemonic: string,
  extraRegistryTypes: TypeUrlPair[] = []
): Promise<Attacker> {
  const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {
    prefix: DEFAULTS.addressPrefix,
  });
  const [account] = await wallet.getAccounts();
  const registry = new Registry([...defaultRegistryTypes, ...(extraRegistryTypes as any)]);
  const client = await SigningStargateClient.connectWithSigner(DEFAULTS.rpcEndpoint, wallet, {
    registry,
  });
  return { wallet, address: account.address, client, registry };
}

/**
 * Sign locally, broadcast via REST. Returns the `tx_response` block from the
 * sync broadcast — note: `code !== 0` means the tx was rejected at CheckTx,
 * `code === 0` means it was accepted to the mempool (you still need to wait
 * for inclusion to confirm DeliverTx success).
 */
export async function signAndBroadcast(
  client: SigningStargateClient,
  sender: string,
  msgs: { typeUrl: string; value: any }[],
  fee: { amount: { denom: string; amount: string }[]; gas: string },
  memo = '',
  opts: { allowFailure?: boolean } = {}
): Promise<any> {
  const signed = await client.sign(sender, msgs, fee, memo);
  const txBytes = TxRaw.encode(signed).finish();
  const txBase64 = Buffer.from(txBytes).toString('base64');
  const res = await lcdPost(DEFAULTS.restEndpoint, '/cosmos/tx/v1beta1/txs', {
    tx_bytes: txBase64,
    mode: 'BROADCAST_MODE_SYNC',
  });
  const txResponse = res?.tx_response;
  if (!txResponse) {
    throw new Error(`Unexpected broadcast response: ${JSON.stringify(res)}`);
  }
  if (txResponse.code !== 0 && !opts.allowFailure) {
    throw new Error(`Broadcast FAILED (code ${txResponse.code}): ${txResponse.raw_log}`);
  }
  return txResponse;
}

/**
 * Poll the REST endpoint until the tx is found (DeliverTx executed). On a
 * fresh tx, the LCD returns 5/NOT_FOUND for ~3-10s before the tx is queryable
 * — we treat that as "still waiting".
 */
export async function waitForTx(
  restEndpoint: string,
  txHash: string,
  opts: { maxAttempts?: number; intervalMs?: number; allowFailure?: boolean } = {}
): Promise<any> {
  const maxAttempts = opts.maxAttempts ?? 30;
  const intervalMs = opts.intervalMs ?? 2000;
  for (let i = 0; i < maxAttempts; i++) {
    await sleep(intervalMs);
    try {
      const body = await lcdGet(restEndpoint, `/cosmos/tx/v1beta1/txs/${txHash}`);
      if (body?.tx_response) {
        const tr = body.tx_response;
        if (tr.code !== 0 && !opts.allowFailure) {
          throw new Error(`Tx FAILED on-chain (code ${tr.code}): ${tr.raw_log}`);
        }
        return tr;
      }
    } catch (e: any) {
      if (e.code === 5 || e.code === 3 || /not found/i.test(e.message ?? '')) continue;
      throw e;
    }
  }
  throw new Error(`Tx ${txHash} not found after ${(maxAttempts * intervalMs) / 1000}s`);
}

/**
 * HTTP GET against a Cosmos REST endpoint. Supports the x-cosmos-block-height
 * header (per the Cosmos LCD spec) so callers can pin a height for
 * reconciliation queries.
 */
export function lcdGet(
  endpoint: string,
  pathAndQuery: string,
  headers: Record<string, string> = {}
): Promise<any> {
  const url = endpoint.replace(/\/$/, '') + pathAndQuery;
  const parsed = new URL(url);
  const options = {
    hostname: parsed.hostname,
    path: parsed.pathname + parsed.search,
    method: 'GET',
    headers,
  };
  return new Promise((resolve, reject) => {
    https
      .request(options, (res) => {
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
            reject(new Error(`Failed to parse response from ${url}: ${raw.slice(0, 200)}`));
          }
        });
      })
      .on('error', reject)
      .end();
  });
}

export function lcdPost(endpoint: string, pathAndQuery: string, payload: unknown): Promise<any> {
  const data = JSON.stringify(payload);
  const url = endpoint.replace(/\/$/, '') + pathAndQuery;
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
          reject(new Error(`Failed to parse POST response from ${url}: ${raw.slice(0, 200)}`));
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

export function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/** Decode base64-encoded event attributes if Sei returned them encoded. */
export function decodeEventAttributes(events: any[]): any[] {
  return (events ?? []).map((ev) => ({
    type: ev.type,
    attributes: (ev.attributes ?? []).map((a: any) => ({
      key: looksBase64(a.key) ? Buffer.from(a.key, 'base64').toString('utf-8') : a.key,
      value: looksBase64(a.value) ? Buffer.from(a.value, 'base64').toString('utf-8') : a.value,
      index: a.index,
    })),
  }));
}

function looksBase64(s: string): boolean {
  return typeof s === 'string' && /^[A-Za-z0-9+/]+={0,2}$/.test(s) && s.length % 4 === 0 && s.length >= 4;
}

export interface FixturePayload {
  msgType: string;
  scenario: string;
  victim?: string;
  attacker: string;
  txHash: string;
  height: string;
  code: number;
  rawLog?: string;
  txBodyMessages: any[];
  authInfoFee: any;
  logsEvents: any[];
  topLevelEvents: any[];
  notes?: string;
  capturedAt: string;
}

/**
 * Write a per-msg fixture under `fixtures/`. The schema matches CGD-1483
 * Step 4's "capture per simulated tx" requirement: both event-log formats
 * (logs[] and events[]), raw body.messages[], auth_info.fee.
 */
export function captureFixture(filename: string, payload: FixturePayload): string {
  if (!fs.existsSync(FIXTURE_DIR)) fs.mkdirSync(FIXTURE_DIR, { recursive: true });
  const fullPath = path.join(FIXTURE_DIR, filename.endsWith('.json') ? filename : `${filename}.json`);
  fs.writeFileSync(fullPath, JSON.stringify(payload, null, 2));
  return fullPath;
}

/**
 * Convenience for msg scripts: broadcast, wait, build fixture payload from the
 * resulting tx_response, write the fixture file, return both the tx_response
 * and the fixture path.
 */
export async function broadcastAndCapture(
  client: SigningStargateClient,
  attackerAddress: string,
  msgs: { typeUrl: string; value: any }[],
  fee: { amount: { denom: string; amount: string }[]; gas: string },
  fixtureName: string,
  scenario: string,
  victim?: string,
  opts: { memo?: string; allowFailure?: boolean; notes?: string } = {}
): Promise<{ tx: any; fixturePath: string }> {
  const broadcast = await signAndBroadcast(client, attackerAddress, msgs, fee, opts.memo ?? '', {
    allowFailure: opts.allowFailure,
  });
  console.log(`  broadcast txhash: ${broadcast.txhash}`);
  console.log(`  waiting for inclusion...`);

  const tx = await waitForTx(DEFAULTS.restEndpoint, broadcast.txhash, {
    allowFailure: opts.allowFailure,
  });
  console.log(`  included at height ${tx.height} (code=${tx.code})`);

  const fixturePath = captureFixture(fixtureName, {
    msgType: msgs[0]?.typeUrl ?? 'unknown',
    scenario,
    victim,
    attacker: attackerAddress,
    txHash: tx.txhash,
    height: String(tx.height),
    code: tx.code,
    rawLog: tx.raw_log,
    txBodyMessages: tx.tx?.body?.messages ?? [],
    authInfoFee: tx.tx?.auth_info?.fee ?? null,
    logsEvents: (tx.logs ?? []).map((l: any) => ({
      msg_index: l.msg_index,
      events: l.events ?? [],
    })),
    topLevelEvents: decodeEventAttributes(tx.events ?? []),
    notes: opts.notes,
    capturedAt: new Date().toISOString(),
  });
  console.log(`  fixture written: ${path.relative(process.cwd(), fixturePath)}`);
  console.log(`  explorer: ${DEFAULTS.explorer}/txs/${tx.txhash}`);
  return { tx, fixturePath };
}

/**
 * Sei testnet faucet doesn't give large amounts; this is a sanity check
 * (most scripts need ~50,000 usei for gas + transfer).
 */
export async function assertSufficientBalance(
  address: string,
  minUsei: bigint,
  label = 'attacker'
): Promise<void> {
  const body = await lcdGet(DEFAULTS.restEndpoint, `/cosmos/bank/v1beta1/balances/${address}`);
  const usei = (body?.balances ?? []).find((b: any) => b.denom === DEFAULTS.denom)?.amount ?? '0';
  console.log(`  ${label} ${address}: ${usei} usei`);
  if (BigInt(usei) < minUsei) {
    throw new Error(
      `${label} ${address} has only ${usei} usei, need >= ${minUsei}. Fund from https://www.docs.sei.io/learn/faucet`
    );
  }
}

export function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) {
    console.error(`Missing required env var: ${name}`);
    process.exit(1);
  }
  return v;
}

export function optionalEnv(name: string, fallback: string): string {
  return process.env[name] ?? fallback;
}

/**
 * Load wallets.json (written by 00-create-wallets.ts). Map of msgKey →
 * { walletId, address, label }. Used by each script to pick its dedicated
 * victim wallet.
 */
export interface WalletEntry {
  walletId: string;
  address: string;
  label: string;
}

export function loadWallets(): Record<string, WalletEntry> {
  const p = path.resolve(__dirname, '..', 'wallets.json');
  if (!fs.existsSync(p)) {
    throw new Error(
      `wallets.json not found at ${p}. Run 00-create-wallets.ts first or pass VICTIM_ADDRESS explicitly.`
    );
  }
  return JSON.parse(fs.readFileSync(p, 'utf-8'));
}

export function resolveVictim(msgKey: string): string {
  if (process.env.VICTIM_ADDRESS) return process.env.VICTIM_ADDRESS;
  const wallets = loadWallets();
  const entry = wallets[msgKey];
  if (!entry) {
    throw new Error(
      `No wallets.json entry for msgKey="${msgKey}". Pass VICTIM_ADDRESS explicitly or add to 00-create-wallets.ts`
    );
  }
  return entry.address;
}
