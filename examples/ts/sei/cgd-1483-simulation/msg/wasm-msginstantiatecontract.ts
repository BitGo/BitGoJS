/**
 * CGD-1483 needs-investigation — /cosmwasm.wasm.v1.MsgInstantiateContract.
 *
 * Reuses code_id 4029 (cw20_base v1.1.2, sha256 b292370...e4e — already
 * uploaded on atlantic-2 with instantiate-permission=EVERYBODY per the
 * CGD-1093 deploy-cw20 script). Attaches `funds` so the parser path with
 * a bank event is exercised.
 *
 * Verifies that:
 *   - attacker's coin_spent matches the attached funds amount
 *   - the instantiated contract address receives those funds in indexer
 */

import { MsgInstantiateContract } from 'cosmjs-types/cosmwasm/wasm/v1/tx';
import {
  buildAttacker,
  broadcastAndCapture,
  assertSufficientBalance,
  requireEnv,
  DEFAULTS,
} from '../lib/sei-client';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Long = require('long');

const MSG_KEY = 'wasm-msginstantiatecontract';
const TYPE_URL = '/cosmwasm.wasm.v1.MsgInstantiateContract';

async function main() {
  const mnemonic = requireEnv('ATTACKER_MNEMONIC');
  const codeId = process.env.CODE_ID ?? '4029';
  const fundsAmount = process.env.FUNDS ?? '1000';
  // cw20_base validates symbol against /^[a-zA-Z\-]{3,12}$/ — no digits.
  // Build a letter-only suffix from Date.now() (mod 26) twice.
  const n = Date.now();
  const suffix = String.fromCharCode(97 + ((n >> 8) % 26), 97 + ((n >> 16) % 26), 97 + ((n >> 24) % 26));
  const tokenSymbol = process.env.TOKEN_SYMBOL ?? `BGTEST${suffix}`;
  const initialSupply = process.env.INITIAL_SUPPLY ?? '1000000';

  console.log(`=== CGD-1483 ${TYPE_URL} simulation ===`);
  console.log(`code_id   : ${codeId}`);
  console.log(`funds     : ${fundsAmount} ${DEFAULTS.denom}`);
  console.log(`tokenSym  : ${tokenSymbol}`);

  const { client, address: attacker } = await buildAttacker(mnemonic, [
    [TYPE_URL, MsgInstantiateContract as any],
  ]);
  console.log(`attacker  : ${attacker}`);
  await assertSufficientBalance(attacker, BigInt(fundsAmount) + 100_000n);

  const initMsg = {
    name: `CGD-1483 ${tokenSymbol}`,
    symbol: tokenSymbol,
    decimals: 6,
    initial_balances: [{ address: attacker, amount: initialSupply }],
    mint: null,
    marketing: null,
  };
  const msg = {
    typeUrl: TYPE_URL,
    value: MsgInstantiateContract.fromPartial({
      sender: attacker,
      admin: attacker,
      codeId: Long.fromString(codeId),
      label: `${tokenSymbol}-${Date.now()}`,
      msg: Buffer.from(JSON.stringify(initMsg), 'utf-8'),
      funds: [{ denom: DEFAULTS.denom, amount: fundsAmount }],
    }),
  };

  await broadcastAndCapture(
    client,
    attacker,
    [msg],
    { amount: [{ denom: DEFAULTS.denom, amount: '60000' }], gas: '600000' },
    MSG_KEY,
    'investigate-instantiate-with-funds',
    attacker,
    {
      notes:
        'With attached funds, bank events fire; without, no balance impact. We test the with-funds path.',
    }
  );
}

main().catch((e) => {
  console.error('Fatal:', e.message ?? e);
  process.exit(1);
});
