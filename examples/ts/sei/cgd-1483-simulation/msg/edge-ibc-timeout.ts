/**
 * CGD-1483 edge case — observe the MsgTimeout refund that's paired with a
 * MsgTransfer that we've forced to time out.
 *
 * Flow:
 *   1. Broadcast a MsgTransfer with timeout_timestamp = now+30s to a
 *      known-down counterparty receiver (via ibc-msgtransfer.ts SCENARIO=timeout).
 *   2. Poll the LCD for tx-search results filtered on `timeout_packet.
 *      packet_src_channel` until the relayer (or the sender themselves)
 *      submits MsgTimeout.
 *   3. Capture both txs to the fixture file (logsEvents + topLevelEvents).
 *
 * If no relayer submits MsgTimeout within MAX_WAIT_SECONDS, the fixture is
 * written with `notes: timeout not yet observed` and the user is told to
 * re-run this script later.
 *
 * Optionally, set FORCE_REFUND_BY_SELF=1 to submit MsgTimeout from the
 * attacker themselves (advanced — requires proof construction; we don't
 * implement that here, just document the option).
 */

import fs from 'fs';
import path from 'path';
import {
  buildAttacker,
  requireEnv,
  optionalEnv,
  captureFixture,
  decodeEventAttributes,
  lcdGet,
  DEFAULTS,
  sleep,
} from '../lib/sei-client';

const MSG_KEY_SRC = 'edge-ibc-timeout-source';
const MSG_KEY_REFUND = 'edge-ibc-timeout';

async function main() {
  const mnemonic = requireEnv('ATTACKER_MNEMONIC');
  const maxWaitSeconds = parseInt(optionalEnv('MAX_WAIT_SECONDS', '300'), 10);

  console.log(`=== CGD-1483 IBC timeout pair observation ===`);
  const { address: attacker } = await buildAttacker(mnemonic);
  console.log(`attacker  : ${attacker}`);

  // Look up the source MsgTransfer fixture. Without it, we don't know which
  // packet to wait on.
  const srcFixture = path.resolve(__dirname, '..', 'fixtures', `${MSG_KEY_SRC}.json`);
  if (!fs.existsSync(srcFixture)) {
    throw new Error(
      `Missing ${srcFixture}. Run msg/ibc-msgtransfer.ts SCENARIO=timeout first to broadcast the source tx.`
    );
  }
  const src = JSON.parse(fs.readFileSync(srcFixture, 'utf-8'));
  console.log(`source tx : ${src.txHash} h=${src.height}`);

  const srcMsg = src.txBodyMessages?.[0] ?? {};
  const sourceChannel = srcMsg.source_channel ?? srcMsg.sourceChannel;
  const sourcePort = srcMsg.source_port ?? srcMsg.sourcePort;
  if (!sourceChannel) {
    throw new Error(`Could not extract source_channel from ${srcFixture}.`);
  }
  console.log(`channel   : ${sourcePort}/${sourceChannel}`);

  // Tx-search for timeout_packet events on this channel & sender.
  const start = Date.now();
  let refundTx: any = null;
  while ((Date.now() - start) / 1000 < maxWaitSeconds) {
    const elapsed = Math.round((Date.now() - start) / 1000);
    process.stdout.write(`  [${elapsed}s] searching for MsgTimeout... `);
    try {
      const q =
        `?events=timeout_packet.packet_src_channel='${sourceChannel}'` +
        `&events=message.sender='${attacker}'` +
        `&pagination.limit=10`;
      const body = await lcdGet(DEFAULTS.restEndpoint, `/cosmos/tx/v1beta1/txs${q}`);
      const txs = (body?.tx_responses ?? []) as any[];
      // Find the one whose creation time is AFTER the source tx height.
      const candidate = txs.find((t) => BigInt(t.height) > BigInt(src.height));
      if (candidate) {
        refundTx = candidate;
        process.stdout.write(`found tx ${candidate.txhash} h=${candidate.height}\n`);
        break;
      }
      process.stdout.write(`(none yet)\n`);
    } catch (e: any) {
      process.stdout.write(`(query error: ${e.message ?? e})\n`);
    }
    await sleep(15_000);
  }

  if (!refundTx) {
    captureFixture(MSG_KEY_REFUND, {
      msgType: '/ibc.core.channel.v1.MsgTimeout',
      scenario: 'edge-ibc-timeout-not-observed',
      attacker,
      txHash: '',
      height: '',
      code: -1,
      txBodyMessages: [],
      authInfoFee: null,
      logsEvents: [],
      topLevelEvents: [],
      notes: `Source MsgTransfer ${src.txHash}; no relayer submitted MsgTimeout within ${maxWaitSeconds}s. Rerun this script later.`,
      capturedAt: new Date().toISOString(),
    });
    console.log(
      `\n  MsgTimeout not observed within ${maxWaitSeconds}s. Wrote placeholder fixture; re-run to capture refund.`
    );
    return;
  }

  captureFixture(MSG_KEY_REFUND, {
    msgType: '/ibc.core.channel.v1.MsgTimeout',
    scenario: 'edge-ibc-timeout-refund',
    attacker,
    txHash: refundTx.txhash,
    height: String(refundTx.height),
    code: refundTx.code,
    rawLog: refundTx.raw_log,
    txBodyMessages: refundTx.tx?.body?.messages ?? [],
    authInfoFee: refundTx.tx?.auth_info?.fee ?? null,
    logsEvents: (refundTx.logs ?? []).map((l: any) => ({ msg_index: l.msg_index, events: l.events ?? [] })),
    topLevelEvents: decodeEventAttributes(refundTx.events ?? []),
    notes: `Paired with source MsgTransfer ${src.txHash}. Refund coin_received expected on ${attacker}.`,
    capturedAt: new Date().toISOString(),
  });
  console.log(`  refund fixture written: fixtures/${MSG_KEY_REFUND}.json`);
  console.log(`  explorer: ${DEFAULTS.explorer}/txs/${refundTx.txhash}`);
}

main().catch((e) => {
  console.error('Fatal:', e.message ?? e);
  process.exit(1);
});
