/**
 * CGD-1483 needs-investigation — /cosmos.vesting.v1beta1.MsgCreateVestingAccount.
 *
 * Attacker creates a delayed-vesting account for the victim. The parser
 * MUST detect vesting type URLs in tx.body.messages[] (findVestingMessageIndices
 * at CosmosLikeTransaction.java:336-346) and emit a `VestingTransfer` entry
 * with the VESTING tag (zero value for the receiver, principal locked).
 *
 * Note: the destination address (victim) cannot already exist as a vesting
 * account or this will fail. The simulation wallets are freshly-created
 * BitGo addresses, which haven't received any funds yet — but cosmos-sdk
 * v0.47+ MAY allow this if no account exists yet. If the account already
 * received funds (e.g. attacker funded it), the create will fail; the
 * fixture will then capture the failure.
 */

import { MsgCreateVestingAccount } from 'cosmjs-types/cosmos/vesting/v1beta1/tx';
import {
  buildAttacker,
  broadcastAndCapture,
  assertSufficientBalance,
  requireEnv,
  resolveVictim,
  DEFAULTS,
} from '../lib/sei-client';

const MSG_KEY = 'vesting-msgcreatevestingaccount';
const TYPE_URL = '/cosmos.vesting.v1beta1.MsgCreateVestingAccount';

async function main() {
  const mnemonic = requireEnv('ATTACKER_MNEMONIC');
  const amount = process.env.AMOUNT ?? '10000';
  const victim = resolveVictim(MSG_KEY);
  // End time = now + 1 day (in seconds).
  const endTimeSeconds = Math.floor(Date.now() / 1000) + 86400;

  console.log(`=== CGD-1483 ${TYPE_URL} simulation ===`);
  console.log(`victim    : ${victim}`);
  console.log(`amount    : ${amount} ${DEFAULTS.denom}`);
  console.log(`endTime   : ${endTimeSeconds} (1 day from now)`);

  const { client, address: attacker } = await buildAttacker(mnemonic);
  console.log(`attacker  : ${attacker}`);
  await assertSufficientBalance(attacker, BigInt(amount) + 50_000n);

  const msg = {
    typeUrl: TYPE_URL,
    value: MsgCreateVestingAccount.fromPartial({
      fromAddress: attacker,
      toAddress: victim,
      amount: [{ denom: DEFAULTS.denom, amount }],
      endTime: endTimeSeconds as any,
      delayed: true,
    }),
  };

  await broadcastAndCapture(
    client,
    attacker,
    [msg],
    { amount: [{ denom: DEFAULTS.denom, amount: '30000' }], gas: '300000' },
    MSG_KEY,
    'investigate-create-vesting-account-delayed',
    victim,
    {
      notes:
        'Parser must emit VestingTransfer with zero value for receiver. Sender coin_spent must be captured.',
      allowFailure: true,
    }
  );
}

main().catch((e) => {
  console.error('Fatal:', e.message ?? e);
  process.exit(1);
});
