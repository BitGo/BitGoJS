/**
 * Send the funding usei from the attacker mnemonic to each redo wallet
 * (one MsgSend per wallet). Each redo wallet needs enough to cover its
 * action amount + gas (~30K usei).
 *
 * Skips wallets that already have a balance >= the spec's fundingUsei.
 */

import fs from 'fs';
import path from 'path';
import {
  buildAttacker,
  assertSufficientBalance,
  signAndBroadcast,
  waitForTx,
  lcdGet,
  DEFAULTS,
  sleep,
} from '../lib/sei-client';
import { MsgSend } from 'cosmjs-types/cosmos/bank/v1beta1/tx';
import { REDO_LIST } from './redo-list';

const WALLETS_FILE = path.resolve(__dirname, 'redo-wallets.json');

async function main() {
  const mnemonic = process.env.ATTACKER_MNEMONIC;
  if (!mnemonic) {
    console.error('Set ATTACKER_MNEMONIC');
    process.exit(1);
  }
  if (!fs.existsSync(WALLETS_FILE)) {
    console.error(`Run 00-create-redo-wallets.ts first.`);
    process.exit(1);
  }
  const wallets = JSON.parse(fs.readFileSync(WALLETS_FILE, 'utf-8'));

  console.log(`=== Funding ${REDO_LIST.length} redo wallets from attacker ===`);
  const { client, address: attacker } = await buildAttacker(mnemonic);
  console.log(`attacker: ${attacker}`);

  // Compute total funding need so we can sanity-check upfront.
  const total = REDO_LIST.map((s) => BigInt(s.fundingUsei)).reduce((a, b) => a + b, 0n);
  console.log(`total funding amount: ${total} usei (+~30K usei gas/fund)`);
  await assertSufficientBalance(attacker, total + 200_000n);

  let funded = 0;
  let skipped = 0;
  for (const spec of REDO_LIST) {
    const entry = wallets[spec.key];
    if (!entry) {
      console.warn(`  ✗ no wallet entry for ${spec.key}, skipping`);
      continue;
    }
    const before = await lcdGet(
      DEFAULTS.restEndpoint,
      `/cosmos/bank/v1beta1/balances/${entry.address}`
    );
    const have = BigInt((before?.balances ?? []).find((b: any) => b.denom === DEFAULTS.denom)?.amount ?? '0');
    if (have >= BigInt(spec.fundingUsei)) {
      console.log(`  ↻ ${spec.key}: already has ${have} usei (>= ${spec.fundingUsei}), skipping fund`);
      skipped++;
      continue;
    }
    const need = (BigInt(spec.fundingUsei) - have).toString();
    console.log(`  → ${spec.key} (${entry.address}): sending ${need} usei (need ${spec.fundingUsei}, has ${have})`);
    const msg = {
      typeUrl: '/cosmos.bank.v1beta1.MsgSend',
      value: MsgSend.fromPartial({
        fromAddress: attacker,
        toAddress: entry.address,
        amount: [{ denom: DEFAULTS.denom, amount: need }],
      }),
    };
    const broadcast = await signAndBroadcast(
      client,
      attacker,
      [msg],
      { amount: [{ denom: DEFAULTS.denom, amount: '20000' }], gas: '200000' }
    );
    await waitForTx(DEFAULTS.restEndpoint, broadcast.txhash);
    console.log(`    funded tx: ${broadcast.txhash}`);
    funded++;
    await sleep(2000); // small spacing
  }
  console.log(`\n=== Done — ${funded} funded, ${skipped} already-funded ===`);
}

main().catch((e) => {
  console.error('Fatal:', e.message ?? e);
  process.exit(1);
});
