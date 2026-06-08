/**
 * Deploy a CW-20 token contract on SEI atlantic-2 testnet (CGD-1093).
 *
 * SEI atlantic-2 has permissioned wasm upload (random addresses get
 * `unauthorized` on MsgStoreCode), but existing cw20_base codes are uploaded
 * with instantiate-permission=EVERYBODY. We reuse code_id=4029 (cw20_base
 * v1.1.2, sha256 b292370...e4e — verified against the local wasm release).
 *
 * Same CometBFT 0.38 / Tendermint 0.34 RPC adapter workaround as the atom
 * vesting script: sign locally with SigningStargateClient.sign(), broadcast
 * via REST.
 *
 * Usage:
 *   ATTACKER_MNEMONIC="word1 word2 ..." \
 *   npx ts-node examples/ts/sei/deploy-cw20.ts
 *
 * Optional env vars:
 *   EXISTING_CODE_ID code_id of an existing cw20_base on-chain (default: 4029)
 *   TOKEN_NAME       (default: BitGo Test Token)
 *   TOKEN_SYMBOL     (default: BGTEST)
 *   INITIAL_SUPPLY   (default: 1000000000)   // 1,000 tokens at 6 decimals
 *   RPC_ENDPOINT     (default: SEI atlantic-2)
 *   REST_ENDPOINT    (default: SEI atlantic-2)
 */

// ─── Test credentials used in CGD-1093 simulation ───────────────────────────
// Attacker mnemonic : prosper pledge defense friend energy gorilla height arrest prosper december whisper prosper junior rhythm young coconut patient actress creek battle coral dismiss cloth cigar
// Attacker address  : sei1j4duheg4uy7en9vcp0xm7hndccc3euwpx7utx2
// CW-20 contract    : sei1zwugu0vce6fq7ccfg9u5j8tcf6cs2u5u7ydu9eknyt45puj8kt3qkwznf6
//                     → BGTEST ("BitGo Test Token"), 6 decimals, total supply 1,000
//                     → instantiated from code_id=4029 (cw20_base v1.1.2)
//                     → tx: E87A70640BC74C968D4D66D9A4EB2B4D85F4C7E0B068E6C061CA034E333EDADE
// ────────────────────────────────────────────────────────────────────────────

import https from 'https';
import { DirectSecp256k1HdWallet, Registry } from '@cosmjs/proto-signing';
import { SigningStargateClient, defaultRegistryTypes } from '@cosmjs/stargate';
import { MsgInstantiateContract } from 'cosmjs-types/cosmwasm/wasm/v1/tx';
import { TxRaw } from 'cosmjs-types/cosmos/tx/v1beta1/tx';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Long = require('long');

const DEFAULT_RPC = 'https://rpc-testnet.sei-apis.com';
const DEFAULT_REST = 'https://rest-testnet.sei-apis.com';
const DENOM = 'usei';
const ADDRESS_PREFIX = 'sei';

const INSTANTIATE_TYPE_URL = '/cosmwasm.wasm.v1.MsgInstantiateContract';
const DEFAULT_CODE_ID = '4029';

async function main() {
  const attackerMnemonic = process.env.ATTACKER_MNEMONIC;
  if (!attackerMnemonic) {
    console.error('Usage: ATTACKER_MNEMONIC="..." npx ts-node examples/ts/sei/deploy-cw20.ts');
    process.exit(1);
  }
  const rpcEndpoint = process.env.RPC_ENDPOINT ?? DEFAULT_RPC;
  const restEndpoint = process.env.REST_ENDPOINT ?? DEFAULT_REST;
  const tokenName = process.env.TOKEN_NAME ?? 'BitGo Test Token';
  const tokenSymbol = process.env.TOKEN_SYMBOL ?? 'BGTEST';
  const initialSupply = process.env.INITIAL_SUPPLY ?? '1000000000';
  const codeId = process.env.EXISTING_CODE_ID ?? DEFAULT_CODE_ID;

  console.log('=== SEI CW-20 Contract Deploy (CGD-1093) ===\n');
  console.log(`RPC  endpoint : ${rpcEndpoint}`);
  console.log(`REST endpoint : ${restEndpoint}`);
  console.log(`code_id       : ${codeId} (cw20_base v1.1.2 — already on-chain)`);
  console.log(`Token         : ${tokenName} (${tokenSymbol})`);
  console.log(`Initial supply: ${initialSupply}\n`);

  const attackerWallet = await DirectSecp256k1HdWallet.fromMnemonic(attackerMnemonic, {
    prefix: ADDRESS_PREFIX,
  });
  const [attackerAccount] = await attackerWallet.getAccounts();
  console.log(`Attacker      : ${attackerAccount.address}`);

  const balanceBody = await restGet(`${restEndpoint}/cosmos/bank/v1beta1/balances/${attackerAccount.address}`);
  const balances = balanceBody?.balances ?? [];
  console.log(`Balance       : ${JSON.stringify(balances)}`);
  const usei = balances.find((b: any) => b.denom === DENOM)?.amount ?? '0';
  if (BigInt(usei) < 50000n) {
    console.error(`\nAttacker has only ${usei} ${DENOM} — need at least 50,000 for instantiate gas.`);
    console.error('Fund the address from the SEI atlantic-2 faucet and retry.');
    process.exit(1);
  }

  const registry = new Registry([...defaultRegistryTypes, [INSTANTIATE_TYPE_URL, MsgInstantiateContract]]);
  const signingClient = await SigningStargateClient.connectWithSigner(rpcEndpoint, attackerWallet, {
    registry,
  });

  console.log('\n─── MsgInstantiateContract ─────────────────────────────────');
  const initMsg = {
    name: tokenName,
    symbol: tokenSymbol,
    decimals: 6,
    initial_balances: [{ address: attackerAccount.address, amount: initialSupply }],
    mint: null,
    marketing: null,
  };
  const initMsgBytes = Buffer.from(JSON.stringify(initMsg), 'utf-8');
  const instantiateMsg = {
    typeUrl: INSTANTIATE_TYPE_URL,
    value: MsgInstantiateContract.fromPartial({
      sender: attackerAccount.address,
      admin: attackerAccount.address,
      codeId: Long.fromString(codeId),
      label: `${tokenSymbol}-${Date.now()}`,
      msg: initMsgBytes,
      funds: [],
    }),
  };
  const instantiateFee = {
    amount: [{ denom: DENOM, amount: '40000' }],
    gas: '500000',
  };
  const instantiateTxHash = await signAndBroadcast(
    signingClient,
    attackerAccount.address,
    [instantiateMsg],
    instantiateFee,
    restEndpoint
  );
  console.log(`  Instantiate tx: ${instantiateTxHash}`);

  const contractAddress = await waitForContractAddress(restEndpoint, instantiateTxHash);
  console.log(`  → contract  : ${contractAddress}`);

  console.log('\n=== Deploy complete ===');
  console.log('\nNow run the deposit simulation:\n');
  console.log(`  ATTACKER_MNEMONIC="${attackerMnemonic}" \\`);
  console.log(`  VICTIM_ADDRESS="<bitgo sei1 address>" \\`);
  console.log(`  CW20_CONTRACT="${contractAddress}" \\`);
  console.log(`  npx ts-node examples/ts/sei/simulate-cw20-deposit.ts`);
}

async function signAndBroadcast(
  client: SigningStargateClient,
  sender: string,
  msgs: any[],
  fee: any,
  restEndpoint: string
): Promise<string> {
  const signed = await client.sign(sender, msgs, fee, '');
  const txBytes = TxRaw.encode(signed).finish();
  const txBase64 = Buffer.from(txBytes).toString('base64');
  const res = await restPost(`${restEndpoint}/cosmos/tx/v1beta1/txs`, {
    tx_bytes: txBase64,
    mode: 'BROADCAST_MODE_SYNC',
  });
  const txResponse = res?.tx_response;
  if (!txResponse) {
    throw new Error(`Unexpected broadcast response: ${JSON.stringify(res)}`);
  }
  if (txResponse.code !== 0) {
    throw new Error(`Tx FAILED (code ${txResponse.code}): ${txResponse.raw_log}`);
  }
  return txResponse.txhash;
}

async function waitForContractAddress(restEndpoint: string, txHash: string): Promise<string> {
  const tx = await waitForTx(restEndpoint, txHash);
  const events = tx.events ?? tx.logs?.[0]?.events ?? [];
  for (const ev of events) {
    if (ev.type === 'instantiate') {
      const attr = ev.attributes.find((a: any) => a.key === '_contract_address' || a.key === 'contract_address');
      if (attr) return attr.value;
    }
  }
  throw new Error('instantiate event with _contract_address not found in tx events');
}

async function waitForTx(restEndpoint: string, txHash: string): Promise<any> {
  for (let i = 0; i < 15; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    try {
      const body = await restGet(`${restEndpoint}/cosmos/tx/v1beta1/txs/${txHash}`);
      if (body?.tx_response) {
        if (body.tx_response.code !== 0) {
          throw new Error(`Tx FAILED on-chain (code ${body.tx_response.code}): ${body.tx_response.raw_log}`);
        }
        return body.tx_response;
      }
    } catch (e: any) {
      if (e.code === 5 || e.message?.includes('not found')) continue;
      throw e;
    }
  }
  throw new Error(`Tx ${txHash} not found after 30s`);
}

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
          reject(new Error('Failed to parse broadcast response'));
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
