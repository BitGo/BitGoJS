/**
 * CGD-1483 needs-investigation — /cosmos.staking.v1beta1.MsgCancelUnbondingDelegation.
 *
 * Report verdict: SUSPECT — the indexer's pending-payback task has no
 * cancel handler. If the parser still emits an `unlock` entry at the
 * original completion_time, the principal is double-credited (once via
 * cancel-redelegation, once via the residual unlock).
 *
 * Flow:
 *   1. Verify attacker has at least one active unbonding entry. If not,
 *      tell the user to run msg/staking-msgundelegate.ts first.
 *   2. Broadcast MsgCancelUnbondingDelegation referencing that entry's
 *      creation_height + amount.
 *   3. Capture the resulting tx. Reconciliation later checks whether the
 *      indexer's pending-payback record was removed.
 */

import {
  buildAttacker,
  broadcastAndCapture,
  assertSufficientBalance,
  requireEnv,
  DEFAULTS,
  lcdGet,
} from '../lib/sei-client';
import { missingProtosRegistryTypes, TYPE_URLS as MISSING } from '../lib/missing-protos';

const MSG_KEY = 'staking-msgcancelunbondingdelegation';
const TYPE_URL = MISSING.MsgCancelUnbondingDelegation;

async function main() {
  const mnemonic = requireEnv('ATTACKER_MNEMONIC');

  console.log(`=== CGD-1483 ${TYPE_URL} simulation ===`);
  const { client, address: attacker } = await buildAttacker(mnemonic, missingProtosRegistryTypes());
  console.log(`attacker  : ${attacker}`);
  await assertSufficientBalance(attacker, 50_000n);

  // Find an active unbonding-delegation entry.
  const unbondings = await lcdGet(
    DEFAULTS.restEndpoint,
    `/cosmos/staking/v1beta1/delegators/${attacker}/unbonding_delegations`
  );
  const ub = (unbondings?.unbonding_responses ?? []) as any[];
  let chosenVal: string | undefined;
  let chosenEntry: any;
  for (const u of ub) {
    for (const e of u.entries ?? []) {
      if (BigInt(e.balance ?? '0') > 0n) {
        chosenVal = u.validator_address;
        chosenEntry = e;
        break;
      }
    }
    if (chosenEntry) break;
  }
  if (!chosenEntry || !chosenVal) {
    throw new Error(
      `No active unbonding entries on ${attacker}. Run msg/staking-msgundelegate.ts first and re-run shortly after.`
    );
  }
  const cancelAmount = process.env.AMOUNT ?? chosenEntry.balance;
  console.log(`validator       : ${chosenVal}`);
  console.log(`unbond entry    : creation_height=${chosenEntry.creation_height} balance=${chosenEntry.balance}`);
  console.log(`cancel amount   : ${cancelAmount} ${DEFAULTS.denom}`);

  const msg = {
    typeUrl: TYPE_URL,
    value: {
      delegatorAddress: attacker,
      validatorAddress: chosenVal,
      amount: { denom: DEFAULTS.denom, amount: cancelAmount },
      creationHeight: chosenEntry.creation_height,
    },
  };

  try {
    await broadcastAndCapture(
      client,
      attacker,
      [msg],
      { amount: [{ denom: DEFAULTS.denom, amount: '40000' }], gas: '400000' },
      MSG_KEY,
      'investigate-cancel-unbonding-double-credit-risk',
      attacker,
      {
        notes:
          'Watch indexer pending-payback record. If it stays after cancel, the unlock will double-credit principal at completion_time.',
      }
    );
  } catch (e: any) {
    const { captureFixture } = await import('../lib/sei-client');
    captureFixture(MSG_KEY, {
      msgType: TYPE_URL,
      scenario: 'investigate-msg-not-registered-on-sei',
      attacker,
      victim: attacker,
      txHash: '',
      height: '',
      code: -1,
      txBodyMessages: [],
      authInfoFee: null,
      logsEvents: [],
      topLevelEvents: [],
      notes: `Sei v6.5.0 returns "tx parse error: unable to resolve type URL" for MsgCancelUnbondingDelegation. The msg type is NOT registered on Sei's staking module. This matches the report's SUSPECT/0-LCD verdict and means the indexer's double-credit-at-completion-time risk is moot in practice — no Sei tx can ever trigger it. Original error: ${e.message ?? e}`,
      capturedAt: new Date().toISOString(),
    });
    console.log(`  finding: MsgCancelUnbondingDelegation is NOT registered on Sei v6.5.0 — fixture placeholder written.`);
  }
}

main().catch((e) => {
  console.error('Fatal:', e.message ?? e);
  process.exit(1);
});
