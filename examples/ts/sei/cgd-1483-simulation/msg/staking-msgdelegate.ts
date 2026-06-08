/**
 * CGD-1483 needs-investigation — /cosmos.staking.v1beta1.MsgDelegate.
 *
 * Report verdict: SUSPECT — delegator's coin_spent is correctly captured
 * but the `bonded_tokens_pool` module-account receive isn't stripped
 * because CosmosFeeCollector has no sei/tsei entry. Reconciliation must
 * confirm whether the indexer ends up with a phantom receive for the
 * module account.
 *
 * No victim address used — the attacker IS the delegator. We still write
 * a fixture so reconciliation can compare attacker indexer balance vs
 * LCD before/after.
 */

import { MsgDelegate } from 'cosmjs-types/cosmos/staking/v1beta1/tx';
import {
  buildAttacker,
  broadcastAndCapture,
  assertSufficientBalance,
  requireEnv,
  DEFAULTS,
} from '../lib/sei-client';
import { pickValidator } from '../lib/validators';

const MSG_KEY = 'staking-msgdelegate';
const TYPE_URL = '/cosmos.staking.v1beta1.MsgDelegate';

async function main() {
  const mnemonic = requireEnv('ATTACKER_MNEMONIC');
  const amount = process.env.AMOUNT ?? '10000';

  console.log(`=== CGD-1483 ${TYPE_URL} simulation ===`);
  const validatorAddress = process.env.VALIDATOR ?? (await pickValidator(0));
  console.log(`validator : ${validatorAddress}`);
  console.log(`amount    : ${amount} ${DEFAULTS.denom}`);

  const { client, address: attacker } = await buildAttacker(mnemonic);
  console.log(`attacker  : ${attacker}`);
  await assertSufficientBalance(attacker, BigInt(amount) + 50_000n);

  const msg = {
    typeUrl: TYPE_URL,
    value: MsgDelegate.fromPartial({
      delegatorAddress: attacker,
      validatorAddress,
      amount: { denom: DEFAULTS.denom, amount },
    }),
  };

  await broadcastAndCapture(
    client,
    attacker,
    [msg],
    { amount: [{ denom: DEFAULTS.denom, amount: '30000' }], gas: '300000' },
    MSG_KEY,
    'investigate-delegate-fee-collector-gap',
    attacker,
    {
      notes:
        'Watch for phantom bonded_tokens_pool entry in indexer (sei missing from CosmosFeeCollector.feeCollectorAddressMap).',
    }
  );
}

main().catch((e) => {
  console.error('Fatal:', e.message ?? e);
  process.exit(1);
});
