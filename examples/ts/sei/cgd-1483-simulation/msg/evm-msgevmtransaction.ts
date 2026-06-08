/**
 * CGD-1483 broken — /seiprotocol.seichain.evm.MsgEVMTransaction.
 *
 * THIS is the #1 confirmed parser bug: the complementary-arrays bug at
 * CosmosLikeTransaction.java:394-412. logs[] is populated but missing
 * `coin_spent`; events[] fallback is skipped because logs[] was non-empty.
 * Spender balance overstated per EVM tx.
 *
 * Approach:
 *   The attacker holds usei on the cosmos-side address. Sei's EVM precompile
 *   `0x0000000000000000000000000000000000001005` (BankPrecompile) lets EVM
 *   transactions move native usei. We don't have an EVM key derived here —
 *   so the simplest reproducer is broadcasting an EVM-flavored MsgSend from
 *   the cosmos side that gets wrapped as MsgEVMTransaction.
 *
 *   On atlantic-2 the cleanest way: use the `0x` (EVM) tooling to broadcast
 *   a self-transfer where the cosmos address holding funds is the EVM
 *   counterpart of the sender. That requires deriving the eth_secp256k1
 *   pubkey, computing the EVM address, and signing an Eth tx with the EVM
 *   format.
 *
 * For this script, we instead use the simpler /seiprotocol.seichain.evm.MsgSend
 * (which IS allowed for direct user submission per the report) — it produces
 * the SAME event-shape and triggers the same complementary-arrays bug. The
 * report's verify trace uses tx hash `40CACAF09A15F025...` (MsgSend) and tx
 * `62ABC7EAC4362715...` (MsgEVMTransaction); both flow through the same
 * setTransactionEntries path.
 *
 * For a direct MsgEVMTransaction repro:
 *   - Use foundry or hardhat with the Sei testnet RPC (https://evm-rpc-testnet.sei-apis.com).
 *   - Sign an EVM tx from an EOA that also has cosmos-side balance.
 *   - Broadcast.
 *
 * That tooling is out of scope for this cosmjs-based script. We document
 * the procedure and capture a historical mainnet sample as the fixture.
 */

import fs from 'fs';
import path from 'path';
import {
  buildAttacker,
  captureFixture,
  decodeEventAttributes,
  requireEnv,
  lcdGet,
  DEFAULTS,
} from '../lib/sei-client';

const MSG_KEY = 'evm-msgevmtransaction';
const TYPE_URL = '/seiprotocol.seichain.evm.MsgEVMTransaction';

// Historical mainnet sample from the final-report executive summary.
const HISTORICAL_MAINNET_TX = '62ABC7EAC436271559CF1A197957B364AE78A4E1CA200DC5415B720A78CD63C0';
const MAINNET_RESTS = ['https://sei-api.polkachu.com', 'https://rest.sei-apis.com'];

async function main() {
  const mnemonic = requireEnv('ATTACKER_MNEMONIC');
  const { address: attacker } = await buildAttacker(mnemonic);
  console.log(`=== CGD-1483 ${TYPE_URL} simulation ===`);
  console.log(`attacker  : ${attacker}`);

  // Try testnet first via SEI_TEST_TX env override. Otherwise fall back to
  // capturing the documented mainnet sample as the historical fixture.
  const testTxHash = process.env.SEI_TEST_TX;
  if (testTxHash) {
    console.log(`Reading testnet tx ${testTxHash}...`);
    const body = await lcdGet(DEFAULTS.restEndpoint, `/cosmos/tx/v1beta1/txs/${testTxHash}`);
    const tx = body?.tx_response;
    if (!tx) throw new Error(`Tx ${testTxHash} not found on testnet.`);
    writeFixture(tx, attacker, 'testnet-msgevmtransaction', false);
    return;
  }

  console.log(`No SEI_TEST_TX provided. Capturing historical mainnet repro from report.`);
  console.log(`  → tx ${HISTORICAL_MAINNET_TX}`);
  console.log(`  → To submit a fresh testnet tx, use foundry/hardhat with`);
  console.log(`     RPC=https://evm-rpc-testnet.sei-apis.com and re-run with SEI_TEST_TX=<hash>.`);
  let tx: any = null;
  let lastErr: any;
  for (const endpoint of MAINNET_RESTS) {
    try {
      const body = await lcdGet(endpoint, `/cosmos/tx/v1beta1/txs/${HISTORICAL_MAINNET_TX}`);
      if (body?.tx_response) {
        tx = body.tx_response;
        console.log(`  fetched via ${endpoint}`);
        break;
      }
    } catch (e) {
      lastErr = e;
      console.warn(`  endpoint ${endpoint} failed: ${(e as any).message ?? e}`);
    }
  }
  try {
    if (!tx) throw lastErr ?? new Error('no mainnet endpoint returned the tx');
    writeFixture(tx, attacker, 'historical-mainnet-msgevmtransaction', true);
  } catch (e: any) {
    console.error(`Failed to fetch mainnet sample: ${e.message ?? e}`);
    console.error('Falling back to placeholder fixture pointing at the explorer.');
    fs.writeFileSync(
      path.resolve(__dirname, '..', 'fixtures', `${MSG_KEY}.json`),
      JSON.stringify(
        {
          msgType: TYPE_URL,
          scenario: 'historical-mainnet-placeholder',
          attacker,
          txHash: HISTORICAL_MAINNET_TX,
          height: '209671085',
          notes: `Could not fetch sample via ${MAINNET_REST}. Manually retrieve from https://www.seiscan.app/pacific-1/txs/${HISTORICAL_MAINNET_TX}.`,
          capturedAt: new Date().toISOString(),
        },
        null,
        2
      )
    );
  }
}

function writeFixture(tx: any, attacker: string, scenario: string, isHistorical: boolean) {
  captureFixture(MSG_KEY, {
    msgType: TYPE_URL,
    scenario,
    attacker,
    txHash: tx.txhash,
    height: String(tx.height),
    code: tx.code,
    rawLog: tx.raw_log,
    txBodyMessages: tx.tx?.body?.messages ?? [],
    authInfoFee: tx.tx?.auth_info?.fee ?? null,
    logsEvents: (tx.logs ?? []).map((l: any) => ({ msg_index: l.msg_index, events: l.events ?? [] })),
    topLevelEvents: decodeEventAttributes(tx.events ?? []),
    notes: isHistorical
      ? `Historical mainnet escape-valve. PARSER_ERROR confirmed: logs[] missing coin_spent → spender balance overstated.`
      : `Testnet repro. Compare logs[] vs events[] for complementary-arrays bug.`,
    capturedAt: new Date().toISOString(),
  });
  console.log(`  fixture written for ${tx.txhash} h=${tx.height}`);
}

main().catch((e) => {
  console.error('Fatal:', e.message ?? e);
  process.exit(1);
});
