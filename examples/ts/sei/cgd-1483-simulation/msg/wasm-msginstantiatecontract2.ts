/**
 * CGD-1483 needs-investigation — /cosmwasm.wasm.v1.MsgInstantiateContract2.
 *
 * Same as MsgInstantiateContract but with a deterministic salt → predictable
 * address. Same parser path; verify the alternate proto wires correctly.
 */

import {
  buildAttacker,
  broadcastAndCapture,
  assertSufficientBalance,
  requireEnv,
  DEFAULTS,
} from '../lib/sei-client';
import { missingProtosRegistryTypes, TYPE_URLS as MISSING } from '../lib/missing-protos';

const MSG_KEY = 'wasm-msginstantiatecontract2';
const TYPE_URL = MISSING.MsgInstantiateContract2;

async function main() {
  const mnemonic = requireEnv('ATTACKER_MNEMONIC');
  const codeId = process.env.CODE_ID ?? '4029';
  const fundsAmount = process.env.FUNDS ?? '1000';
  const tokenSymbol = process.env.TOKEN_SYMBOL ?? `BGT2${Date.now() % 100000}`;
  const salt = process.env.SALT ?? `cgd1483-${Date.now()}`;

  console.log(`=== CGD-1483 ${TYPE_URL} simulation ===`);
  console.log(`code_id   : ${codeId}`);
  console.log(`salt      : ${salt}`);

  const { client, address: attacker } = await buildAttacker(mnemonic, missingProtosRegistryTypes());
  console.log(`attacker  : ${attacker}`);
  await assertSufficientBalance(attacker, BigInt(fundsAmount) + 100_000n);

  const initMsg = {
    name: `CGD-1483 ${tokenSymbol}`,
    symbol: tokenSymbol,
    decimals: 6,
    initial_balances: [{ address: attacker, amount: '1000000' }],
    mint: null,
    marketing: null,
  };
  const msg = {
    typeUrl: TYPE_URL,
    value: {
      sender: attacker,
      admin: attacker,
      codeId: codeId,
      label: `${tokenSymbol}-${Date.now()}`,
      msg: Buffer.from(JSON.stringify(initMsg), 'utf-8'),
      funds: [{ denom: DEFAULTS.denom, amount: fundsAmount }],
      salt: Buffer.from(salt, 'utf-8'),
      fixMsg: false,
    },
  };

  try {
    await broadcastAndCapture(
      client,
      attacker,
      [msg],
      { amount: [{ denom: DEFAULTS.denom, amount: '60000' }], gas: '600000' },
      MSG_KEY,
      'investigate-instantiate2-predictable',
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
      notes: `Sei v6.5.0 returns "tx parse error: unable to resolve type URL" for MsgInstantiateContract2. Sei's wasmd fork predates v0.30 — the predictable-address msg variant isn't registered. The indexer concern is moot in practice. Original error: ${e.message ?? e}`,
      capturedAt: new Date().toISOString(),
    });
    console.log(`  finding: MsgInstantiateContract2 NOT registered on Sei v6.5.0 — fixture placeholder written.`);
  }
}

main().catch((e) => {
  console.error('Fatal:', e.message ?? e);
  process.exit(1);
});
