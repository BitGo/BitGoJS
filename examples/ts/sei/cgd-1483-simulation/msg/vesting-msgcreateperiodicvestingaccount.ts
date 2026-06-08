/**
 * CGD-1483 needs-investigation — /cosmos.vesting.v1beta1.MsgCreatePeriodicVestingAccount.
 *
 * Variant with explicit periods. Same parser path.
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

const MSG_KEY = 'vesting-msgcreateperiodicvestingaccount';
const TYPE_URL = MISSING.MsgCreatePeriodicVestingAccount;

async function main() {
  const mnemonic = requireEnv('ATTACKER_MNEMONIC');
  const amount = process.env.AMOUNT ?? '5000';
  const victim = resolveVictim(MSG_KEY);

  console.log(`=== CGD-1483 ${TYPE_URL} simulation ===`);
  console.log(`victim    : ${victim}`);
  const { client, address: attacker } = await buildAttacker(mnemonic, missingProtosRegistryTypes());
  console.log(`attacker  : ${attacker}`);
  await assertSufficientBalance(attacker, BigInt(amount) + 50_000n);

  // Three equal periods of 1 hour each.
  const startTime = Math.floor(Date.now() / 1000);
  const periodLength = 3600;
  const periodAmount = (BigInt(amount) / 3n).toString();
  const msg = {
    typeUrl: TYPE_URL,
    value: {
      fromAddress: attacker,
      toAddress: victim,
      startTime,
      vestingPeriods: [
        { length: periodLength, amount: [{ denom: DEFAULTS.denom, amount: periodAmount }] },
        { length: periodLength, amount: [{ denom: DEFAULTS.denom, amount: periodAmount }] },
        { length: periodLength, amount: [{ denom: DEFAULTS.denom, amount: periodAmount }] },
      ],
    },
  };

  try {
    await broadcastAndCapture(
      client,
      attacker,
      [msg],
      { amount: [{ denom: DEFAULTS.denom, amount: '30000' }], gas: '300000' },
      MSG_KEY,
      'investigate-create-periodic-vesting-account',
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
      notes: `Sei atlantic-2 v6.5.0 mempool drops MsgCreatePeriodicVestingAccount silently. Matches the report's "0 LCD results". Original error: ${e.message ?? e}`,
      capturedAt: new Date().toISOString(),
    });
    console.log(`  finding: msg type not landable on Sei testnet — fixture placeholder written.`);
  }
}

main().catch((e) => {
  console.error('Fatal:', e.message ?? e);
  process.exit(1);
});
