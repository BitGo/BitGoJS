/**
 * CGD-1483 broken — /seiprotocol.seichain.tokenfactory.MsgBurn.
 *
 * Burn AMOUNT of the tokenfactory denom held by the attacker. Same
 * UNSUPPORTED_TOKEN concern as MsgMint — but in reverse (coin_spent
 * without coin_received that the indexer might silently drop).
 *
 * Pre-req: attacker must hold the denom (run tokenfactory-msgmint.ts first).
 */

import fs from 'fs';
import path from 'path';
import {
  buildAttacker,
  broadcastAndCapture,
  assertSufficientBalance,
  requireEnv,
  DEFAULTS,
} from '../lib/sei-client';
import { TYPE_URLS, tokenfactoryRegistryTypes } from '../lib/sei-tokenfactory-proto';

const MSG_KEY = 'tokenfactory-msgburn';
const TYPE_URL = TYPE_URLS.MsgBurn;
const STATE_FILE = path.resolve(__dirname, '..', 'tokenfactory-state.json');

async function main() {
  const mnemonic = requireEnv('ATTACKER_MNEMONIC');
  const amount = process.env.AMOUNT ?? '1000';

  if (!fs.existsSync(STATE_FILE)) {
    throw new Error(`${STATE_FILE} missing. Run tokenfactory-msgcreatedenom.ts + msgmint.ts first.`);
  }
  const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
  const denom = state.denom;

  console.log(`=== CGD-1483 ${TYPE_URL} simulation ===`);
  console.log(`denom     : ${denom}`);
  console.log(`amount    : ${amount}`);
  const { client, address: attacker } = await buildAttacker(mnemonic, tokenfactoryRegistryTypes());
  console.log(`attacker  : ${attacker}`);
  await assertSufficientBalance(attacker, 50_000n);

  const msg = {
    typeUrl: TYPE_URL,
    value: { sender: attacker, amount: { denom, amount } },
  };

  await broadcastAndCapture(
    client,
    attacker,
    [msg],
    { amount: [{ denom: DEFAULTS.denom, amount: '40000' }], gas: '400000' },
    MSG_KEY,
    'broken-burn-factory-denom',
    attacker,
    {
      notes: `Burn factory denom. UNSUPPORTED_TOKEN expected — indexer silently drops the spend.`,
    }
  );
}

main().catch((e) => {
  console.error('Fatal:', e.message ?? e);
  process.exit(1);
});
