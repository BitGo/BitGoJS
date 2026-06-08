/**
 * CGD-1483 needs-investigation — /cosmos.gov.v1beta1.MsgSubmitProposal.
 *
 * Submits a text proposal with the minimum deposit. Verifies that the
 * proposer's coin_spent is captured (deposit goes to gov module). Same
 * fee-collector concern as MsgFundCommunityPool.
 */

import { MsgSubmitProposal } from 'cosmjs-types/cosmos/gov/v1beta1/tx';
import { TextProposal } from 'cosmjs-types/cosmos/gov/v1beta1/gov';
import { Any } from 'cosmjs-types/google/protobuf/any';
import {
  buildAttacker,
  broadcastAndCapture,
  assertSufficientBalance,
  requireEnv,
  DEFAULTS,
  lcdGet,
} from '../lib/sei-client';

const MSG_KEY = 'gov-msgsubmitproposal-v1beta1';
const TYPE_URL = '/cosmos.gov.v1beta1.MsgSubmitProposal';

async function main() {
  const mnemonic = requireEnv('ATTACKER_MNEMONIC');

  console.log(`=== CGD-1483 ${TYPE_URL} simulation ===`);
  const { client, address: attacker } = await buildAttacker(mnemonic);
  console.log(`attacker  : ${attacker}`);

  // Atlantic-2 min_deposit is 10_000_000 usei to enter voting, but the
  // proposal accepts any positive initial_deposit and just stays in
  // deposit-phase until the full amount is reached. We use the smallest
  // valid number for the sim — the parser path is identical regardless.
  const depositAmount = process.env.DEPOSIT ?? '1000';
  console.log(`deposit   : ${depositAmount} ${DEFAULTS.denom}`);
  await assertSufficientBalance(attacker, BigInt(depositAmount) + 50_000n);

  const proposal = TextProposal.fromPartial({
    title: 'CGD-1483 SEI testnet sim (no-op)',
    description: 'Test proposal for indexer message-type whitelisting verification. Vote NO.',
  });
  const content = Any.fromPartial({
    typeUrl: '/cosmos.gov.v1beta1.TextProposal',
    value: TextProposal.encode(proposal).finish(),
  });

  const msg = {
    typeUrl: TYPE_URL,
    value: MsgSubmitProposal.fromPartial({
      content,
      initialDeposit: [{ denom: DEFAULTS.denom, amount: depositAmount }],
      proposer: attacker,
    }),
  };

  await broadcastAndCapture(
    client,
    attacker,
    [msg],
    { amount: [{ denom: DEFAULTS.denom, amount: '50000' }], gas: '500000' },
    MSG_KEY,
    'investigate-submit-proposal-v1beta1',
    attacker,
    { notes: 'Deposit goes to gov module — watch for fee-collector gap on receive.' }
  );
}

main().catch((e) => {
  console.error('Fatal:', e.message ?? e);
  process.exit(1);
});
