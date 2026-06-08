/**
 * CGD-1483 edge case — MsgMultiSend with attacker on BOTH sides.
 *
 * Inputs: [attacker → 2000 usei]
 * Outputs: [attacker → 2000 usei]
 *
 * Verifies that the attribute-pair iterator doesn't double-credit when input
 * and output addresses are identical (chain emits matching coin_spent +
 * coin_received).
 */

import { MsgMultiSend } from 'cosmjs-types/cosmos/bank/v1beta1/tx';
import {
  buildAttacker,
  broadcastAndCapture,
  assertSufficientBalance,
  requireEnv,
  DEFAULTS,
} from '../lib/sei-client';

const MSG_KEY = 'edge-msgmultisend-selfloop';
const TYPE_URL = '/cosmos.bank.v1beta1.MsgMultiSend';

async function main() {
  const mnemonic = requireEnv('ATTACKER_MNEMONIC');
  const amount = process.env.AMOUNT ?? '2000';

  console.log(`=== CGD-1483 ${TYPE_URL} self-loop edge case ===`);
  console.log(`amount   : ${amount} ${DEFAULTS.denom}`);

  const { client, address: attacker } = await buildAttacker(mnemonic);
  console.log(`attacker : ${attacker}`);
  await assertSufficientBalance(attacker, 30_000n);

  const msg = {
    typeUrl: TYPE_URL,
    value: MsgMultiSend.fromPartial({
      inputs: [{ address: attacker, coins: [{ denom: DEFAULTS.denom, amount }] }],
      outputs: [{ address: attacker, coins: [{ denom: DEFAULTS.denom, amount }] }],
    }),
  };

  await broadcastAndCapture(
    client,
    attacker,
    [msg],
    { amount: [{ denom: DEFAULTS.denom, amount: '20000' }], gas: '200000' },
    MSG_KEY,
    'edge-multisend-self-loop',
    attacker,
    {
      notes:
        'attacker on both sides — expect net zero indexer delta. Bug if indexer either credits or debits.',
    }
  );
}

main().catch((e) => {
  console.error('Fatal:', e.message ?? e);
  process.exit(1);
});
