/**
 * CGD-1483 sanity — /cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward.
 *
 * Attacker withdraws accumulated rewards from one of their delegations.
 * Verifies the `withdraw_rewards` event path: the parser marks the
 * coin_received entry with `isReward=true` so it's classified as reward,
 * not principal.
 */

import { MsgWithdrawDelegatorReward } from 'cosmjs-types/cosmos/distribution/v1beta1/tx';
import {
  buildAttacker,
  broadcastAndCapture,
  assertSufficientBalance,
  requireEnv,
  DEFAULTS,
  lcdGet,
} from '../lib/sei-client';

const MSG_KEY = 'distribution-msgwithdrawdelegatorreward';
const TYPE_URL = '/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward';

async function main() {
  const mnemonic = requireEnv('ATTACKER_MNEMONIC');

  console.log(`=== CGD-1483 ${TYPE_URL} simulation ===`);
  const { client, address: attacker } = await buildAttacker(mnemonic);
  console.log(`attacker  : ${attacker}`);
  await assertSufficientBalance(attacker, 30_000n);

  const delegations = await lcdGet(
    DEFAULTS.restEndpoint,
    `/cosmos/staking/v1beta1/delegations/${attacker}`
  );
  const entries = delegations?.delegation_responses ?? [];
  if (entries.length === 0) {
    throw new Error(
      `Attacker has no delegations. Run staking-msgdelegate first and wait a few blocks for rewards to accrue.`
    );
  }
  const validatorAddress = process.env.VALIDATOR ?? entries[0].delegation.validator_address;
  console.log(`validator : ${validatorAddress}`);

  const msg = {
    typeUrl: TYPE_URL,
    value: MsgWithdrawDelegatorReward.fromPartial({
      delegatorAddress: attacker,
      validatorAddress,
    }),
  };

  await broadcastAndCapture(
    client,
    attacker,
    [msg],
    { amount: [{ denom: DEFAULTS.denom, amount: '25000' }], gas: '250000' },
    MSG_KEY,
    'sanity-withdraw-rewards',
    attacker,
    {
      notes:
        'Expected: coin_received tagged isReward=true. If indexer credits as principal, classification bug.',
    }
  );
}

main().catch((e) => {
  console.error('Fatal:', e.message ?? e);
  process.exit(1);
});
