/**
 * CGD-1483 broken — /cosmwasm.wasm.v1.MsgExecuteContract (CW-20 transfer path).
 *
 * Reproduces CGD-1093. Attacker calls `transfer { recipient: victim, amount }`
 * on the CGD-1093 CW-20 contract. The contract emits `wasm` events; no bank
 * events fire; the indexer never creates a transfer entry for the victim.
 *
 * The contract address is pre-recorded in
 * /Users/venkateshv/BitGo/BitGoJS/examples/ts/sei/deploy-cw20.ts (deployed
 * during CGD-1093). Override via CW20_CONTRACT env if you deploy a new one.
 */

import { MsgExecuteContract } from 'cosmjs-types/cosmwasm/wasm/v1/tx';
import {
  buildAttacker,
  broadcastAndCapture,
  assertSufficientBalance,
  requireEnv,
  resolveVictim,
  DEFAULTS,
} from '../lib/sei-client';

const MSG_KEY = 'wasm-msgexecutecontract-cw20';
const TYPE_URL = '/cosmwasm.wasm.v1.MsgExecuteContract';
const DEFAULT_CW20 = 'sei1zwugu0vce6fq7ccfg9u5j8tcf6cs2u5u7ydu9eknyt45puj8kt3qkwznf6';

async function main() {
  const mnemonic = requireEnv('ATTACKER_MNEMONIC');
  const cw20Contract = process.env.CW20_CONTRACT ?? DEFAULT_CW20;
  const amount = process.env.AMOUNT ?? '1000';
  const victim = resolveVictim(MSG_KEY);

  console.log(`=== CGD-1483 ${TYPE_URL} (CW-20 transfer) ===`);
  console.log(`contract  : ${cw20Contract}`);
  console.log(`victim    : ${victim}`);
  console.log(`amount    : ${amount} CW-20 sub-units`);

  const { client, address: attacker } = await buildAttacker(mnemonic, [
    [TYPE_URL, MsgExecuteContract as any],
  ]);
  console.log(`attacker  : ${attacker}`);
  await assertSufficientBalance(attacker, 30_000n);

  const cw20Transfer = { transfer: { recipient: victim, amount } };
  const msg = {
    typeUrl: TYPE_URL,
    value: MsgExecuteContract.fromPartial({
      sender: attacker,
      contract: cw20Contract,
      msg: Buffer.from(JSON.stringify(cw20Transfer), 'utf-8'),
      funds: [],
    }),
  };

  await broadcastAndCapture(
    client,
    attacker,
    [msg],
    { amount: [{ denom: DEFAULTS.denom, amount: '25000' }], gas: '300000' },
    MSG_KEY,
    'broken-cw20-transfer-silent-drop',
    victim,
    {
      notes:
        'CGD-1093 repro. wasm events fire but no bank events → indexer never creates a transfer entry for victim.',
    }
  );
}

main().catch((e) => {
  console.error('Fatal:', e.message ?? e);
  process.exit(1);
});
