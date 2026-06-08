/**
 * CGD-1483 sanity — /seiprotocol.seichain.tokenfactory.MsgCreateDenom.
 *
 * Attacker creates a new tokenfactory denom `factory/<attacker>/<subdenom>`.
 * No balance impact (just the creation fee). This denom is consumed by the
 * MsgMint and MsgBurn scripts.
 *
 * The created denom is written to a sidecar JSON file
 * (tokenfactory-state.json) so downstream mint/burn scripts can pick it up.
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

const MSG_KEY = 'tokenfactory-msgcreatedenom';
const TYPE_URL = TYPE_URLS.MsgCreateDenom;
const STATE_FILE = path.resolve(__dirname, '..', 'tokenfactory-state.json');

async function main() {
  const mnemonic = requireEnv('ATTACKER_MNEMONIC');
  const subdenom = process.env.SUBDENOM ?? `cgd1483-${Date.now()}`;

  console.log(`=== CGD-1483 ${TYPE_URL} simulation ===`);
  console.log(`subdenom  : ${subdenom}`);

  const { client, address: attacker } = await buildAttacker(mnemonic, tokenfactoryRegistryTypes());
  console.log(`attacker  : ${attacker}`);
  // tokenfactory create fee on Sei is typically ~10_000_000 usei. Allow a small
  // buffer for gas, but keep below the user's 19.38 SEI funding ceiling.
  await assertSufficientBalance(attacker, 10_500_000n);

  const msg = {
    typeUrl: TYPE_URL,
    value: { sender: attacker, subdenom },
  };

  const { tx } = await broadcastAndCapture(
    client,
    attacker,
    [msg],
    { amount: [{ denom: DEFAULTS.denom, amount: '40000' }], gas: '400000' },
    MSG_KEY,
    'sanity-create-denom',
    attacker,
    {
      notes: 'No bank balance impact; creation fee burned. Records denom to tokenfactory-state.json for downstream mint/burn.',
    }
  );

  const fullDenom = `factory/${attacker}/${subdenom}`;
  fs.writeFileSync(
    STATE_FILE,
    JSON.stringify(
      {
        denom: fullDenom,
        subdenom,
        admin: attacker,
        createTxHash: tx.txhash,
        createHeight: tx.height,
        createdAt: new Date().toISOString(),
      },
      null,
      2
    )
  );
  console.log(`\n  new denom: ${fullDenom}`);
  console.log(`  state    : ${path.relative(process.cwd(), STATE_FILE)}`);
}

main().catch((e) => {
  console.error('Fatal:', e.message ?? e);
  process.exit(1);
});
