/**
 * CGD-1483 sanity — /cosmos.distribution.v1beta1.MsgSetWithdrawAddress.
 *
 * Attacker changes their reward withdraw address. No balance impact, but
 * the parser must not produce a phantom entry. Pairs with WithdrawReward
 * to verify rewards still flow correctly after redirect.
 */

import { MsgSetWithdrawAddress } from 'cosmjs-types/cosmos/distribution/v1beta1/tx';
import {
  buildAttacker,
  broadcastAndCapture,
  assertSufficientBalance,
  requireEnv,
  DEFAULTS,
} from '../lib/sei-client';

const MSG_KEY = 'distribution-msgsetwithdrawaddress';
const TYPE_URL = '/cosmos.distribution.v1beta1.MsgSetWithdrawAddress';

async function main() {
  const mnemonic = requireEnv('ATTACKER_MNEMONIC');
  // Redirect to attacker itself (no actual change) to avoid affecting later runs.
  const withdrawAddress = process.env.WITHDRAW_ADDRESS;

  console.log(`=== CGD-1483 ${TYPE_URL} simulation ===`);
  const { client, address: attacker } = await buildAttacker(mnemonic);
  console.log(`attacker        : ${attacker}`);
  console.log(`withdraw addr   : ${withdrawAddress ?? attacker} (default attacker)`);
  await assertSufficientBalance(attacker, 30_000n);

  const msg = {
    typeUrl: TYPE_URL,
    value: MsgSetWithdrawAddress.fromPartial({
      delegatorAddress: attacker,
      withdrawAddress: withdrawAddress ?? attacker,
    }),
  };

  await broadcastAndCapture(
    client,
    attacker,
    [msg],
    { amount: [{ denom: DEFAULTS.denom, amount: '20000' }], gas: '200000' },
    MSG_KEY,
    'sanity-set-withdraw-address',
    attacker,
    { notes: 'No balance impact expected. Parser must not emit a transfer entry.' }
  );
}

main().catch((e) => {
  console.error('Fatal:', e.message ?? e);
  process.exit(1);
});
