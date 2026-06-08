/**
 * CGD-1483 broken — /seiprotocol.seichain.tokenfactory.MsgMint.
 *
 * The bug: `CosmosSupportedDenomination` only registers `usei` for sei. Any
 * `factory/...` denom emitted by tokenfactory mint produces a silent
 * UNSUPPORTED_TOKEN — the parser sees the bank event but drops the entry
 * because the denom isn't recognized.
 *
 * Flow:
 *   1. Mint AMOUNT of the tokenfactory denom into the attacker's account.
 *   2. (Optionally) MsgSend that amount to the victim — gives the bank
 *      event a recipient on the BitGo wallet. Set FORWARD_TO_VICTIM=1 to
 *      include the follow-up MsgSend in the same tx (covers same-address-
 *      twice if attacker is BitGo).
 *
 * Pre-req: msg/tokenfactory-msgcreatedenom.ts has been run and
 * tokenfactory-state.json exists.
 */

import fs from 'fs';
import path from 'path';
import { MsgSend } from 'cosmjs-types/cosmos/bank/v1beta1/tx';
import {
  buildAttacker,
  broadcastAndCapture,
  assertSufficientBalance,
  requireEnv,
  resolveVictim,
  DEFAULTS,
} from '../lib/sei-client';
import { TYPE_URLS, tokenfactoryRegistryTypes } from '../lib/sei-tokenfactory-proto';

const MSG_KEY = 'tokenfactory-msgmint';
const TYPE_URL = TYPE_URLS.MsgMint;
const STATE_FILE = path.resolve(__dirname, '..', 'tokenfactory-state.json');

async function main() {
  const mnemonic = requireEnv('ATTACKER_MNEMONIC');
  const amount = process.env.AMOUNT ?? '1000000';
  const forwardToVictim = process.env.FORWARD_TO_VICTIM === '1';
  const victim = resolveVictim(MSG_KEY);

  if (!fs.existsSync(STATE_FILE)) {
    throw new Error(
      `${STATE_FILE} missing. Run msg/tokenfactory-msgcreatedenom.ts first to create the denom.`
    );
  }
  const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
  const denom = state.denom;

  console.log(`=== CGD-1483 ${TYPE_URL} simulation ===`);
  console.log(`denom     : ${denom}`);
  console.log(`amount    : ${amount}`);
  console.log(`victim    : ${victim} (forward=${forwardToVictim})`);

  const { client, address: attacker } = await buildAttacker(mnemonic, tokenfactoryRegistryTypes());
  console.log(`attacker  : ${attacker}`);
  await assertSufficientBalance(attacker, 50_000n);

  const mintMsg = {
    typeUrl: TYPE_URL,
    value: { sender: attacker, amount: { denom, amount } },
  };
  const msgs: any[] = [mintMsg];
  if (forwardToVictim) {
    msgs.push({
      typeUrl: '/cosmos.bank.v1beta1.MsgSend',
      value: MsgSend.fromPartial({
        fromAddress: attacker,
        toAddress: victim,
        amount: [{ denom, amount }],
      }),
    });
  }

  await broadcastAndCapture(
    client,
    attacker,
    msgs,
    { amount: [{ denom: DEFAULTS.denom, amount: '40000' }], gas: '400000' },
    MSG_KEY,
    forwardToVictim ? 'broken-mint-and-forward' : 'broken-mint-only',
    forwardToVictim ? victim : attacker,
    {
      notes:
        `Mint creates factory denom on attacker. UNSUPPORTED_TOKEN expected at indexer (CosmosSupportedDenomination missing ${denom}).`,
    }
  );
}

main().catch((e) => {
  console.error('Fatal:', e.message ?? e);
  process.exit(1);
});
