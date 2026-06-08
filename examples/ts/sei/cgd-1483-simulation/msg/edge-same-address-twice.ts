/**
 * CGD-1483 edge — same address appears twice in the tx.
 *
 * Scenario: attacker == granter == BitGo wallet inside MsgExec.msgs[].
 *   - Outer signer (tx auth_info): the granter.
 *   - Inner msg sender: the granter (self-grant via MsgGrant earlier in
 *     the same tx — but simpler, we just use a self-loop MsgSend).
 *
 * We achieve "same address twice" by sending a single MsgSend where
 * fromAddress == toAddress == attacker (self-loop). The indexer should
 * see matching coin_spent + coin_received and net to zero. Bug class: if
 * it credits twice OR doesn't strip the matched pair.
 */

import { MsgSend } from 'cosmjs-types/cosmos/bank/v1beta1/tx';
import {
  buildAttacker,
  broadcastAndCapture,
  assertSufficientBalance,
  requireEnv,
  DEFAULTS,
} from '../lib/sei-client';

const MSG_KEY = 'edge-same-address-twice';
const TYPE_URL = '/cosmos.bank.v1beta1.MsgSend';

async function main() {
  const mnemonic = requireEnv('ATTACKER_MNEMONIC');
  const amount = process.env.AMOUNT ?? '500';

  console.log(`=== CGD-1483 same-address-twice edge ===`);
  const { client, address: attacker } = await buildAttacker(mnemonic);
  console.log(`attacker  : ${attacker} (sender AND receiver)`);
  await assertSufficientBalance(attacker, 40_000n);

  const msg = {
    typeUrl: TYPE_URL,
    value: MsgSend.fromPartial({
      fromAddress: attacker,
      toAddress: attacker,
      amount: [{ denom: DEFAULTS.denom, amount }],
    }),
  };

  await broadcastAndCapture(
    client,
    attacker,
    [msg],
    { amount: [{ denom: DEFAULTS.denom, amount: '20000' }], gas: '200000' },
    MSG_KEY,
    'edge-self-loop-bank-send',
    attacker,
    {
      notes:
        'fromAddress == toAddress. Expect net zero indexer delta for attacker. Bug if non-zero.',
    }
  );
}

main().catch((e) => {
  console.error('Fatal:', e.message ?? e);
  process.exit(1);
});
