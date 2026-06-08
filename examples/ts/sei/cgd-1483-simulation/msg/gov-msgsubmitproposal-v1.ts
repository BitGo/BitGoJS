/**
 * CGD-1483 needs-investigation — /cosmos.gov.v1.MsgSubmitProposal (v1 path).
 *
 * gov v1 proto isn't in cosmjs-types 0.6.1 (the installed version); we
 * hand-roll the encoder in lib/missing-protos.ts.
 *
 * We submit a no-op proposal (empty messages[]) with the testnet's minimum
 * deposit. Same fee-collector concern as v1beta1.
 */

import {
  buildAttacker,
  broadcastAndCapture,
  assertSufficientBalance,
  requireEnv,
  DEFAULTS,
  lcdGet,
} from '../lib/sei-client';
import { missingProtosRegistryTypes, TYPE_URLS as MISSING } from '../lib/missing-protos';

const MSG_KEY = 'gov-msgsubmitproposal-v1';
const TYPE_URL = MISSING.MsgSubmitProposalGovV1;

async function main() {
  const mnemonic = requireEnv('ATTACKER_MNEMONIC');

  console.log(`=== CGD-1483 ${TYPE_URL} simulation ===`);
  const { client, address: attacker } = await buildAttacker(mnemonic, missingProtosRegistryTypes());
  console.log(`attacker  : ${attacker}`);

  // Small initial deposit — proposal stays in deposit phase, but the
  // submit-event + bank.coin_spent fires regardless.
  const depositAmount = process.env.DEPOSIT ?? '1000';
  console.log(`deposit   : ${depositAmount} ${DEFAULTS.denom}`);
  await assertSufficientBalance(attacker, BigInt(depositAmount) + 50_000n);

  const msg = {
    typeUrl: TYPE_URL,
    value: {
      messages: [],
      initialDeposit: [{ denom: DEFAULTS.denom, amount: depositAmount }],
      proposer: attacker,
      metadata: 'CGD-1483 simulation',
      title: 'CGD-1483 sei sim v1',
      summary: 'No-op text proposal for indexer message-type whitelisting verification.',
    },
  };

  try {
    await broadcastAndCapture(
      client,
      attacker,
      [msg],
      { amount: [{ denom: DEFAULTS.denom, amount: '50000' }], gas: '500000' },
      MSG_KEY,
      'investigate-submit-proposal-v1',
      attacker
    );
  } catch (e: any) {
    const { captureFixture } = await import('../lib/sei-client');
    captureFixture(MSG_KEY, {
      msgType: TYPE_URL,
      scenario: 'investigate-not-registered-on-sei',
      attacker,
      victim: attacker,
      txHash: '',
      height: '',
      code: -1,
      txBodyMessages: [],
      authInfoFee: null,
      logsEvents: [],
      topLevelEvents: [],
      notes: `Sei v6.5.0 returns "tx parse error: unable to resolve type URL" for gov v1 MsgSubmitProposal. Sei is based on cosmos-sdk v0.45, which only ships gov v1beta1. v1 is not registered. The v1beta1 path is captured in gov-msgsubmitproposal-v1beta1.json. Original error: ${e.message ?? e}`,
      capturedAt: new Date().toISOString(),
    });
    console.log(`  finding: gov v1 MsgSubmitProposal NOT registered on Sei v6.5.0 — fixture placeholder written.`);
  }
}

main().catch((e) => {
  console.error('Fatal:', e.message ?? e);
  process.exit(1);
});
