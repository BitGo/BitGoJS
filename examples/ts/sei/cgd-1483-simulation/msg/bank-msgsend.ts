/**
 * CGD-1483 sanity sample — /cosmos.bank.v1beta1.MsgSend.
 *
 * Attacker sends 1000 usei to the victim. This is the simplest indexed-balance
 * change on Cosmos; failure to track this would be a parser-wide regression.
 *
 * Verifies:
 *   - bank coin_spent + coin_received events fire
 *   - victim's indexer balance at txHeight+1 increases by AMOUNT
 *   - LCD bank balance matches indexer
 *
 * Usage:
 *   ATTACKER_MNEMONIC="..." npx ts-node examples/ts/sei/cgd-1483-simulation/msg/bank-msgsend.ts
 *
 * Picks the victim wallet from wallets.json by msgKey="bank-msgsend" unless
 * VICTIM_ADDRESS overrides.
 */

import { MsgSend } from 'cosmjs-types/cosmos/bank/v1beta1/tx';
import {
  buildAttacker,
  broadcastAndCapture,
  assertSufficientBalance,
  requireEnv,
  resolveVictim,
  DEFAULTS,
} from '../lib/sei-client';

const MSG_KEY = 'bank-msgsend';
const TYPE_URL = '/cosmos.bank.v1beta1.MsgSend';

async function main() {
  const mnemonic = requireEnv('ATTACKER_MNEMONIC');
  const amount = process.env.AMOUNT ?? '1000';
  const victim = resolveVictim(MSG_KEY);

  console.log(`=== CGD-1483 ${TYPE_URL} simulation ===`);
  console.log(`victim   : ${victim}`);
  console.log(`amount   : ${amount} ${DEFAULTS.denom}`);

  const { client, address: attacker } = await buildAttacker(mnemonic);
  console.log(`attacker : ${attacker}`);
  await assertSufficientBalance(attacker, 30_000n);

  const msg = {
    typeUrl: TYPE_URL,
    value: MsgSend.fromPartial({
      fromAddress: attacker,
      toAddress: victim,
      amount: [{ denom: DEFAULTS.denom, amount }],
    }),
  };

  await broadcastAndCapture(
    client,
    attacker,
    [msg],
    { amount: [{ denom: DEFAULTS.denom, amount: '20000' }], gas: '200000' },
    MSG_KEY,
    'sanity-bank-send',
    victim
  );
}

main().catch((e) => {
  console.error('Fatal:', e.message ?? e);
  process.exit(1);
});
