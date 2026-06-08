/**
 * CGD-1483 sanity — /seiprotocol.seichain.evm.MsgSend.
 *
 * Sei's EVM module ships its own MsgSend that emits bank events. Per the
 * report, Sei v6.5.0 disallows direct user submission of MsgEVMTransaction
 * (it's emitted internally only). The same applies to evm.MsgSend, which is
 * also reserved for the EVM precompile flow.
 *
 * Escape-valve: capture the documented mainnet sample
 * `40CACAF09A15F025E1B68C2BD0CBFA48434370BE391B93055EB41A7184140560`
 * h=204636477 as the historical fixture.
 */

import {
  buildAttacker,
  captureFixture,
  decodeEventAttributes,
  requireEnv,
  lcdGet,
} from '../lib/sei-client';

const MSG_KEY = 'evm-msgsend';
const TYPE_URL = '/seiprotocol.seichain.evm.MsgSend';
const HISTORICAL = '40CACAF09A15F025E1B68C2BD0CBFA48434370BE391B93055EB41A7184140560';
const MAINNET_RESTS = ['https://sei-api.polkachu.com', 'https://rest.sei-apis.com'];

async function main() {
  const mnemonic = requireEnv('ATTACKER_MNEMONIC');
  const { address: attacker } = await buildAttacker(mnemonic);
  console.log(`=== CGD-1483 ${TYPE_URL} (historical-mainnet escape) ===`);
  console.log(`attacker  : ${attacker}`);
  console.log(`historical: ${HISTORICAL}`);

  let tx: any = null;
  let lastErr: any;
  for (const endpoint of MAINNET_RESTS) {
    try {
      const body = await lcdGet(endpoint, `/cosmos/tx/v1beta1/txs/${HISTORICAL}`);
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
  if (!tx) {
    console.error(`All mainnet endpoints failed. Last error: ${lastErr?.message ?? lastErr}`);
    const { captureFixture } = await import('../lib/sei-client');
    captureFixture(MSG_KEY, {
      msgType: TYPE_URL,
      scenario: 'historical-mainnet-unavailable',
      attacker, txHash: HISTORICAL, height: '204636477', code: -1,
      txBodyMessages: [], authInfoFee: null, logsEvents: [], topLevelEvents: [],
      notes: `EVM MsgSend mainnet sample at ${HISTORICAL} could not be fetched from any tried endpoint. The msg type is internal-only on Sei v6.5.0 — see report final-report.md and historical explorer.`,
      capturedAt: new Date().toISOString(),
    });
    console.log(`  placeholder fixture written.`);
    return;
  }

  captureFixture(MSG_KEY, {
    msgType: TYPE_URL,
    scenario: 'historical-mainnet-msgsend',
    attacker,
    txHash: tx.txhash,
    height: String(tx.height),
    code: tx.code,
    rawLog: tx.raw_log,
    txBodyMessages: tx.tx?.body?.messages ?? [],
    authInfoFee: tx.tx?.auth_info?.fee ?? null,
    logsEvents: (tx.logs ?? []).map((l: any) => ({ msg_index: l.msg_index, events: l.events ?? [] })),
    topLevelEvents: decodeEventAttributes(tx.events ?? []),
    notes:
      'EVM MsgSend is internal-only on Sei v6.5.0. Capture historical sample per playbook escape-valve.',
    capturedAt: new Date().toISOString(),
  });
  console.log(`  fixture written.`);
}

main().catch((e) => {
  console.error('Fatal:', e.message ?? e);
  process.exit(1);
});
