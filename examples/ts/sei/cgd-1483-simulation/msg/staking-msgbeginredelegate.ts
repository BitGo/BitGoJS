/**
 * CGD-1483 broken — /cosmos.staking.v1beta1.MsgBeginRedelegate.
 *
 * Report verdict: WRONG_EVENT_HANDLING — `redelegate` event type isn't in
 * the parser's switch statement, so no informational entry is created for
 * the share move. There's no liquid balance error (the move has no bank
 * events), but auto-claimed rewards ARE captured. We reconcile to confirm
 * (a) no spurious balance delta and (b) rewards entry is correct.
 *
 * Requires attacker to be delegated to src validator. If not, calls out the
 * pre-req.
 */

import { MsgBeginRedelegate } from 'cosmjs-types/cosmos/staking/v1beta1/tx';
import {
  buildAttacker,
  broadcastAndCapture,
  assertSufficientBalance,
  requireEnv,
  DEFAULTS,
  lcdGet,
} from '../lib/sei-client';
import { listBondedValidators } from '../lib/validators';

const MSG_KEY = 'staking-msgbeginredelegate';
const TYPE_URL = '/cosmos.staking.v1beta1.MsgBeginRedelegate';

async function main() {
  const mnemonic = requireEnv('ATTACKER_MNEMONIC');
  const amount = process.env.AMOUNT ?? '1000';

  console.log(`=== CGD-1483 ${TYPE_URL} simulation ===`);
  const { client, address: attacker } = await buildAttacker(mnemonic);
  console.log(`attacker  : ${attacker}`);
  await assertSufficientBalance(attacker, 50_000n);

  const delegations = await lcdGet(
    DEFAULTS.restEndpoint,
    `/cosmos/staking/v1beta1/delegations/${attacker}`
  );
  const entries = delegations?.delegation_responses ?? [];
  if (entries.length === 0) {
    throw new Error('Attacker has no delegations. Run msg/staking-msgdelegate.ts first.');
  }
  const src = entries[0].delegation.validator_address;
  const bonded = await listBondedValidators();
  const dst =
    process.env.VALIDATOR_DST ??
    bonded.find((v) => v.operator_address !== src)?.operator_address;
  if (!dst) throw new Error('Could not find a second bonded validator to redelegate into.');
  console.log(`src val   : ${src}`);
  console.log(`dst val   : ${dst}`);
  console.log(`amount    : ${amount} ${DEFAULTS.denom}`);

  const msg = {
    typeUrl: TYPE_URL,
    value: MsgBeginRedelegate.fromPartial({
      delegatorAddress: attacker,
      validatorSrcAddress: src,
      validatorDstAddress: dst,
      amount: { denom: DEFAULTS.denom, amount },
    }),
  };

  await broadcastAndCapture(
    client,
    attacker,
    [msg],
    { amount: [{ denom: DEFAULTS.denom, amount: '40000' }], gas: '400000' },
    MSG_KEY,
    'broken-redelegate-wrong-event-handling',
    attacker,
    {
      notes:
        'Expected: redelegate event not in indexer switch, but no balance delta. Auto-claimed rewards (if any) should appear.',
    }
  );
}

main().catch((e) => {
  console.error('Fatal:', e.message ?? e);
  process.exit(1);
});
