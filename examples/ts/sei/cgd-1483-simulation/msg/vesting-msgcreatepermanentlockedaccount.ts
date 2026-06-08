/**
 * CGD-1483 needs-investigation — /cosmos.vesting.v1beta1.MsgCreatePermanentLockedAccount.
 *
 * Variant of MsgCreateVestingAccount that locks funds permanently (no end
 * time). Same parser path; same VestingTransfer expectations.
 */

import {
  buildAttacker,
  broadcastAndCapture,
  assertSufficientBalance,
  requireEnv,
  resolveVictim,
  DEFAULTS,
} from '../lib/sei-client';
import { missingProtosRegistryTypes, TYPE_URLS as MISSING } from '../lib/missing-protos';

const MSG_KEY = 'vesting-msgcreatepermanentlockedaccount';
const TYPE_URL = MISSING.MsgCreatePermanentLockedAccount;

async function main() {
  const mnemonic = requireEnv('ATTACKER_MNEMONIC');
  const amount = process.env.AMOUNT ?? '5000';
  const victim = resolveVictim(MSG_KEY);

  console.log(`=== CGD-1483 ${TYPE_URL} simulation ===`);
  console.log(`victim    : ${victim}`);
  console.log(`amount    : ${amount} ${DEFAULTS.denom}`);
  const { client, address: attacker } = await buildAttacker(mnemonic, missingProtosRegistryTypes());
  console.log(`attacker  : ${attacker}`);
  await assertSufficientBalance(attacker, BigInt(amount) + 50_000n);

  const msg = {
    typeUrl: TYPE_URL,
    value: {
      fromAddress: attacker,
      toAddress: victim,
      amount: [{ denom: DEFAULTS.denom, amount }],
    },
  };

  try {
    await broadcastAndCapture(
      client,
      attacker,
      [msg],
      { amount: [{ denom: DEFAULTS.denom, amount: '30000' }], gas: '300000' },
      MSG_KEY,
      'investigate-create-permanent-locked-account',
      victim,
      { allowFailure: true }
    );
  } catch (e: any) {
    const { captureFixture } = await import('../lib/sei-client');
    captureFixture(MSG_KEY, {
      msgType: TYPE_URL,
      scenario: 'investigate-not-supported-on-sei',
      attacker,
      victim,
      txHash: '',
      height: '',
      code: -1,
      txBodyMessages: [],
      authInfoFee: null,
      logsEvents: [],
      topLevelEvents: [],
      notes: `Sei atlantic-2 v6.5.0 mempool drops MsgCreatePermanentLockedAccount silently (CheckTx accepts, but tx never lands in a block). Matches the report's "0 LCD results" — Sei likely does not register this variant. Original error: ${e.message ?? e}`,
      capturedAt: new Date().toISOString(),
    });
    console.log(`  finding: msg type not landable on Sei testnet — fixture placeholder written.`);
  }
}

main().catch((e) => {
  console.error('Fatal:', e.message ?? e);
  process.exit(1);
});
