/**
 * CGD-1483 REDO round 2 — fund the 4 staking redo wallets + edge-same-address-twice
 * wallet so they can be used in 04-run-staking-and-edge-redos.ts.
 *
 * Each wallet gets 1,000,000 usei from the attacker (plain bank.MsgSend).
 * The original round-1 staking wallets only had 60-80K — insufficient for
 * BitGo's wallet-platform spendable check + staking gas (~350K fee).
 *
 * Run with:
 *   ATTACKER_MNEMONIC=<mnemonic> npx ts-node redo/03-fund-extra-wallets.ts
 */

import {
  buildAttacker,
  signAndBroadcast,
  waitForTx,
  assertSufficientBalance,
  requireEnv,
  DEFAULTS,
  sleep,
} from '../lib/sei-client';
import { MsgSend } from 'cosmjs-types/cosmos/bank/v1beta1/tx';
import path from 'path';
import fs from 'fs';

const FUND_AMOUNT = '1000000'; // 1 SEI per wallet

const TARGETS: { key: string; address: string }[] = [
  {
    key: 'redo-staking-msgdelegate',
    address: 'sei19urvgvahwsu8nr2fpzvfdkgd30ykkhvwaczfc3',
  },
  {
    key: 'redo-staking-msgundelegate',
    address: 'sei13wk6r363yuh8uk4s0xenxzgry0pfseccrnmrhf',
  },
  {
    key: 'redo-staking-msgbeginredelegate',
    address: 'sei1hdf3ld43r4nv2t0a6hq3sgva6vfyg4jp557s7t',
  },
  {
    key: 'redo-staking-msgwithdrawdelegatorreward',
    address: 'sei1ntn9qzys409q8a22ya0z800knv873k8tl3m3gf',
  },
  {
    key: 'edge-same-address-twice',
    address: 'sei1pxf40xut3vfwt27lce0usq8ee8xdmkhxjjfxze',
  },
];

const RESULTS_FILE = path.resolve(__dirname, 'fund-results.json');

async function main() {
  const mnemonic = requireEnv('ATTACKER_MNEMONIC');
  const { client, address: attacker } = await buildAttacker(mnemonic);
  console.log(`attacker : ${attacker}`);

  const totalNeeded = BigInt(FUND_AMOUNT) * BigInt(TARGETS.length) + 200_000n; // + gas buffer
  await assertSufficientBalance(attacker, totalNeeded);

  const results: Record<string, any> = {};

  for (const target of TARGETS) {
    console.log(`\n--- funding ${target.key} (${target.address}) with ${FUND_AMOUNT} usei ---`);
    try {
      const msg = {
        typeUrl: '/cosmos.bank.v1beta1.MsgSend',
        value: MsgSend.fromPartial({
          fromAddress: attacker,
          toAddress: target.address,
          amount: [{ denom: DEFAULTS.denom, amount: FUND_AMOUNT }],
        }),
      };
      const res = await signAndBroadcast(
        client,
        attacker,
        [msg],
        { amount: [{ denom: DEFAULTS.denom, amount: '20000' }], gas: '200000' }
      );
      console.log(`  broadcast txhash: ${res.txhash}`);
      const tx = await waitForTx(DEFAULTS.restEndpoint, res.txhash);
      console.log(`  ✓ included at height ${tx.height}`);
      results[target.key] = { status: 'funded', txHash: tx.txhash, height: tx.height };
    } catch (e: any) {
      console.error(`  ✗ FAILED: ${e.message ?? e}`);
      results[target.key] = { status: 'failed', error: e.message ?? String(e) };
    }
    await sleep(2000);
  }

  fs.writeFileSync(RESULTS_FILE, JSON.stringify(results, null, 2));
  console.log(`\nResults written to ${RESULTS_FILE}`);
  console.log('\nSummary:');
  for (const [key, r] of Object.entries(results)) {
    console.log(`  ${r.status === 'funded' ? '✓' : '✗'} ${key}: ${r.status} ${r.txHash ?? r.error ?? ''}`);
  }
  console.log('\nNow run: npx ts-node redo/04-run-staking-and-edge-redos.ts');
}

main().catch((e) => {
  console.error('Fatal:', e.message ?? e);
  process.exit(1);
});
