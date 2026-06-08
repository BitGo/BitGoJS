/**
 * CGD-1483 sanity / paired edge — /ibc.applications.transfer.v1.MsgTransfer.
 *
 * Two scenarios in one script (pick via SCENARIO env):
 *   - "live"    (default): transfer to a known-up counterparty channel; tx
 *                          will be relayed and acked; pairs with the
 *                          MsgAcknowledgement success-ack path.
 *   - "timeout"           : transfer with timeout_timestamp = now+30s and a
 *                          known-down recipient on the destination chain.
 *                          The packet should never be ack'd, and the
 *                          MsgTimeout refund tx will fire later (captured
 *                          as edge-ibc-timeout fixture).
 *
 * Without an active connected counterparty, edge=timeout still produces a
 * valid MsgTransfer fixture; the corresponding MsgTimeout is observed by
 * the script polling for the refund (see msg/edge-ibc-timeout.ts).
 */

import { MsgTransfer } from 'cosmjs-types/ibc/applications/transfer/v1/tx';
import {
  buildAttacker,
  broadcastAndCapture,
  assertSufficientBalance,
  requireEnv,
  DEFAULTS,
  lcdGet,
} from '../lib/sei-client';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Long = require('long');

const MSG_KEY = 'ibc-msgtransfer';
const TYPE_URL = '/ibc.applications.transfer.v1.MsgTransfer';

async function main() {
  const mnemonic = requireEnv('ATTACKER_MNEMONIC');
  const amount = process.env.AMOUNT ?? '1000';
  const sourceChannel = process.env.SOURCE_CHANNEL ?? 'channel-0';
  const sourcePort = process.env.SOURCE_PORT ?? 'transfer';
  const scenario = (process.env.SCENARIO ?? 'live') as 'live' | 'timeout';
  // Default destination addresses for each scenario. Cosmos hub testnet is the
  // most commonly active counterparty; the "timeout" recipient is a noxious
  // bech32 that will fail recv on the destination side.
  const recipient =
    process.env.RECIPIENT ??
    (scenario === 'timeout'
      ? 'cosmos1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqkufamn'
      : 'cosmos1j4duheg4uy7en9vcp0xm7hndccc3euwpr3lnvf');

  console.log(`=== CGD-1483 ${TYPE_URL} (${scenario}) ===`);
  const { client, address: attacker } = await buildAttacker(mnemonic);
  console.log(`attacker        : ${attacker}`);
  console.log(`source channel  : ${sourcePort}/${sourceChannel}`);
  console.log(`recipient       : ${recipient}`);
  console.log(`amount          : ${amount} ${DEFAULTS.denom}`);

  await assertSufficientBalance(attacker, BigInt(amount) + 40_000n);

  // Pick a near-future timeout for the "timeout" scenario; for "live" use 30
  // minutes so a relayer has time to deliver.
  const nowNs = BigInt(Date.now()) * 1_000_000n;
  const timeoutNs = scenario === 'timeout' ? nowNs + 30n * 1_000_000_000n : nowNs + 1800n * 1_000_000_000n;

  // Cosmjs MsgTransfer expects revisionHeight + revisionNumber OR timeoutTimestamp;
  // setting only timeoutTimestamp is the common pattern. cosmjs-types 0.6.1
  // uses Long for timeoutTimestamp + revision numbers — convert from bigint.
  const msg = {
    typeUrl: TYPE_URL,
    value: MsgTransfer.fromPartial({
      sourcePort,
      sourceChannel,
      token: { denom: DEFAULTS.denom, amount },
      sender: attacker,
      receiver: recipient,
      timeoutTimestamp: Long.fromString(timeoutNs.toString(), true),
      timeoutHeight: {
        revisionNumber: Long.fromNumber(0, true),
        revisionHeight: Long.fromNumber(0, true),
      },
    }),
  };

  // Confirm the channel exists before broadcasting (avoid wasted gas).
  try {
    await lcdGet(
      DEFAULTS.restEndpoint,
      `/ibc/core/channel/v1/channels/${sourceChannel}/ports/${sourcePort}`
    );
  } catch (e: any) {
    console.warn(`Channel ${sourcePort}/${sourceChannel} lookup failed: ${e.message ?? e}`);
    console.warn(`Continuing — broadcast will fail-fast if the channel is invalid.`);
  }

  await broadcastAndCapture(
    client,
    attacker,
    [msg],
    { amount: [{ denom: DEFAULTS.denom, amount: '30000' }], gas: '300000' },
    scenario === 'timeout' ? 'edge-ibc-timeout-source' : MSG_KEY,
    scenario === 'timeout' ? 'edge-ibc-timeout-source-tx' : 'sanity-ibc-transfer-outbound',
    attacker,
    {
      // Sei atlantic-2 IBC clients are all expired in 2026-05; allow the
      // DeliverTx failure so we still capture the fixture (failed-tx case
      // is itself a useful reconciliation row: only fee debit, no transfer).
      allowFailure: true,
      notes:
        scenario === 'timeout'
          ? 'Source-side of the IBC timeout edge. Pair with edge-ibc-timeout.ts to observe the refund. If atlantic-2 IBC clients are expired, tx lands with code=29 — still a valid failed-tx reconciliation row.'
          : 'Outbound IBC transfer; coin_spent on attacker (escrow). atlantic-2 clients may be expired — fixture captures the code=29 outcome in that case.',
    }
  );
}

main().catch((e) => {
  console.error('Fatal:', e.message ?? e);
  process.exit(1);
});
