/**
 * CGD-1483 sanity sample — /cosmos.bank.v1beta1.MsgMultiSend.
 *
 * Attacker fans out a single MsgMultiSend with two outputs:
 *   - victim address (the BitGo wallet under test)
 *   - a second sei1 address (attacker's own, just to force the fan-out path)
 *
 * Verifies that the parser's attribute-pair loop produces a coin_received
 * entry for EACH output independently.
 */

import { MsgMultiSend } from 'cosmjs-types/cosmos/bank/v1beta1/tx';
import {
  buildAttacker,
  broadcastAndCapture,
  assertSufficientBalance,
  requireEnv,
  resolveVictim,
  DEFAULTS,
} from '../lib/sei-client';

const MSG_KEY = 'bank-msgmultisend';
const TYPE_URL = '/cosmos.bank.v1beta1.MsgMultiSend';

async function main() {
  const mnemonic = requireEnv('ATTACKER_MNEMONIC');
  const amount = process.env.AMOUNT ?? '500';
  const victim = resolveVictim(MSG_KEY);

  console.log(`=== CGD-1483 ${TYPE_URL} simulation ===`);
  console.log(`victim   : ${victim}`);
  console.log(`amount   : ${amount} ${DEFAULTS.denom} per output (2 outputs)`);

  const { client, address: attacker } = await buildAttacker(mnemonic);
  console.log(`attacker : ${attacker}`);
  await assertSufficientBalance(attacker, 40_000n);

  // Two outputs: victim + a sentinel sei1 address. Inputs must equal outputs.
  // Using attacker as the second output address is fine — it lets the indexer
  // see a self-receive and a victim-receive in one tx (covers same-address-twice
  // partially).
  const total = (BigInt(amount) * 2n).toString();
  const msg = {
    typeUrl: TYPE_URL,
    value: MsgMultiSend.fromPartial({
      inputs: [{ address: attacker, coins: [{ denom: DEFAULTS.denom, amount: total }] }],
      outputs: [
        { address: victim, coins: [{ denom: DEFAULTS.denom, amount }] },
        { address: attacker, coins: [{ denom: DEFAULTS.denom, amount }] },
      ],
    }),
  };

  await broadcastAndCapture(
    client,
    attacker,
    [msg],
    { amount: [{ denom: DEFAULTS.denom, amount: '25000' }], gas: '250000' },
    MSG_KEY,
    'sanity-multisend-fanout',
    victim
  );
}

main().catch((e) => {
  console.error('Fatal:', e.message ?? e);
  process.exit(1);
});
