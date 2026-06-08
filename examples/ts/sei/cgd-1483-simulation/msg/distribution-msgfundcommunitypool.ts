/**
 * CGD-1483 needs-investigation — /cosmos.distribution.v1beta1.MsgFundCommunityPool.
 *
 * Report verdict: predicted OK but no mainnet sample existed. Also exposes
 * the fee-collector gap (community-pool module receive may not be stripped
 * for sei). Tests that:
 *   - attacker's coin_spent is captured (decreases indexer balance)
 *   - the distribution module account receive is correctly stripped (or
 *     surfaces the fee-collector bug if not).
 */

import { MsgFundCommunityPool } from 'cosmjs-types/cosmos/distribution/v1beta1/tx';
import {
  buildAttacker,
  broadcastAndCapture,
  assertSufficientBalance,
  requireEnv,
  DEFAULTS,
} from '../lib/sei-client';

const MSG_KEY = 'distribution-msgfundcommunitypool';
const TYPE_URL = '/cosmos.distribution.v1beta1.MsgFundCommunityPool';

async function main() {
  const mnemonic = requireEnv('ATTACKER_MNEMONIC');
  const amount = process.env.AMOUNT ?? '1000';

  console.log(`=== CGD-1483 ${TYPE_URL} simulation ===`);
  const { client, address: attacker } = await buildAttacker(mnemonic);
  console.log(`attacker  : ${attacker}`);
  console.log(`amount    : ${amount} ${DEFAULTS.denom}`);
  await assertSufficientBalance(attacker, BigInt(amount) + 30_000n);

  const msg = {
    typeUrl: TYPE_URL,
    value: MsgFundCommunityPool.fromPartial({
      depositor: attacker,
      amount: [{ denom: DEFAULTS.denom, amount }],
    }),
  };

  await broadcastAndCapture(
    client,
    attacker,
    [msg],
    { amount: [{ denom: DEFAULTS.denom, amount: '25000' }], gas: '250000' },
    MSG_KEY,
    'investigate-fund-community-pool',
    attacker,
    {
      notes:
        'Watch distribution module account in indexer — phantom receive if fee-collector gap applies.',
    }
  );
}

main().catch((e) => {
  console.error('Fatal:', e.message ?? e);
  process.exit(1);
});
