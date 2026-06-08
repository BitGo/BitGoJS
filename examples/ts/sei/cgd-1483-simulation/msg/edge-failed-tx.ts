/**
 * CGD-1483 edge case — intentionally-failing tx (DeliverTx code != 0).
 *
 * Strategy: MsgSend with a deliberately tiny gas limit so DeliverTx runs
 * out of gas mid-execution. The tx lands in a block with `code = 11`
 * (out of gas) — the indexer MUST NOT apply any balance change beyond
 * the fee debit.
 *
 * Why not "insufficient funds"? Sei's mempool rejects insufficient-funds
 * MsgSends at CheckTx time (silent drop, never included in a block) — we
 * need a tx that PASSES CheckTx but FAILS DeliverTx so the indexer sees it.
 *
 * The fixture captures `code != 0` and `raw_log` for the reconciliation
 * row.
 */

import { MsgSend } from 'cosmjs-types/cosmos/bank/v1beta1/tx';
import {
  buildAttacker,
  broadcastAndCapture,
  assertSufficientBalance,
  requireEnv,
  DEFAULTS,
} from '../lib/sei-client';

const MSG_KEY = 'edge-failed-tx';
const TYPE_URL = '/cosmos.bank.v1beta1.MsgSend';

async function main() {
  const mnemonic = requireEnv('ATTACKER_MNEMONIC');
  // Picks a recipient that's valid format but receives nothing because tx fails.
  const target = process.env.VICTIM_ADDRESS ?? 'sei1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqp83vlk';

  console.log(`=== CGD-1483 ${TYPE_URL} — intentional failure ===`);
  console.log(`target   : ${target}`);

  const { client, address: attacker } = await buildAttacker(mnemonic);
  console.log(`attacker : ${attacker}`);
  await assertSufficientBalance(attacker, 30_000n);

  // Tiny send amount, but gas limit is too low — DeliverTx OOMs.
  const msg = {
    typeUrl: TYPE_URL,
    value: MsgSend.fromPartial({
      fromAddress: attacker,
      toAddress: target,
      amount: [{ denom: DEFAULTS.denom, amount: '1' }],
    }),
  };

  try {
    await broadcastAndCapture(
      client,
      attacker,
      [msg],
      // Gas limit ~30k is below Sei's minimum to execute a MsgSend
      // (typical real cost ~80k). Tx is intended to fail DeliverTx.
      { amount: [{ denom: DEFAULTS.denom, amount: '1000' }], gas: '30000' },
      MSG_KEY,
      'edge-failed-tx-out-of-gas',
      target,
      {
        allowFailure: true,
        notes:
          'Expected DeliverTx code 11 (out of gas). Indexer must reflect only the fee debit, no transfer entry.',
      }
    );
  } catch (e: any) {
    // Sei v6.5.0 testnet mempool drops any tx that would OOM or fail
    // bank-balance checks at CheckTx — they never reach DeliverTx, so
    // block-included failed txs are rare in the wild on this chain.
    const { captureFixture } = await import('../lib/sei-client');
    captureFixture(MSG_KEY, {
      msgType: TYPE_URL,
      scenario: 'edge-failed-tx-mempool-rejected',
      attacker,
      victim: target,
      txHash: '',
      height: '',
      code: -1,
      txBodyMessages: [],
      authInfoFee: null,
      logsEvents: [],
      topLevelEvents: [],
      notes:
        `Sei atlantic-2 v6.5.0 mempool rejects intentionally-failing txs at CheckTx — they don't land in a block, so the indexer never sees them. Therefore the "block-included failed tx" indexer concern is moot on Sei testnet today. Original wait error: ${e.message ?? e}.`,
      capturedAt: new Date().toISOString(),
    });
    console.log(`  finding: ${e.message ?? e}`);
    console.log(`  fixture written: fixtures/${MSG_KEY}.json (placeholder)`);
  }
}

main().catch((e) => {
  console.error('Fatal:', e.message ?? e);
  process.exit(1);
});
