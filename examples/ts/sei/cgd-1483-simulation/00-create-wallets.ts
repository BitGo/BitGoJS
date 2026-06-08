/**
 * CGD-1483 step 0: bulk-create BitGo tsei testnet wallets, one per Msg type
 * that needs a dedicated victim address.
 *
 * Why one wallet per msg type:
 *   - Each simulation has its own (tx, address, denom) row in the
 *     reconciliation CSV; isolating victim wallets keeps deltas
 *     unambiguous (no cross-contamination from other msg simulations).
 *   - Lets us reset / re-run a single msg without polluting the indexer's
 *     view of every other test wallet.
 *
 * Inputs (env or command line):
 *   - BITGO_ACCESS_TOKEN  user access token with wallet-create permission
 *   - BITGO_ENTERPRISE    enterprise id to scope the wallets under
 *   - BITGO_PASSPHRASE    passphrase to encrypt all generated keychains
 *   - BITGO_ENV           defaults to 'test' (BitGo testnet)
 *   - DRY_RUN=1           list what would be created, exit
 *   - ONLY=<keyA,keyB>    only create wallets for these keys
 *
 * Output:
 *   wallets.json next to this file — `{ <key>: { walletId, address, label } }`.
 *
 * Each wallet uses TSS multisig (cosmos chain → TSS). The script tolerates
 * partial failures and resumes on rerun by reading existing wallets.json.
 */

import fs from 'fs';
import path from 'path';
import { BitGo } from 'bitgo';
import { GenerateWalletOptions } from '@bitgo/sdk-core';
import { walletsToCreate, MSG_LIST } from './lib/msg-list';

const WALLETS_FILE = path.resolve(__dirname, 'wallets.json');
const COIN = 'tsei';
const DEFAULT_LABEL_PREFIX = 'CGD-1483 sei sim';

interface WalletEntry {
  walletId: string;
  address: string;
  label: string;
  createdAt: string;
}

async function main() {
  const accessToken = process.env.BITGO_ACCESS_TOKEN;
  const enterprise = process.env.BITGO_ENTERPRISE;
  const passphrase = process.env.BITGO_PASSPHRASE;
  const env = (process.env.BITGO_ENV ?? 'test') as 'test' | 'prod';
  const only = (process.env.ONLY ?? '').split(',').map((s) => s.trim()).filter(Boolean);
  const dryRun = process.env.DRY_RUN === '1';

  if (!accessToken || !enterprise || !passphrase) {
    console.error(
      'Usage: BITGO_ACCESS_TOKEN=... BITGO_ENTERPRISE=... BITGO_PASSPHRASE=... \\'
    );
    console.error('       npx ts-node examples/ts/sei/cgd-1483-simulation/00-create-wallets.ts');
    process.exit(1);
  }

  const all = walletsToCreate();
  const targets = only.length ? all.filter((m) => only.includes(m.key)) : all;
  if (only.length && targets.length === 0) {
    console.error(`ONLY filter ${JSON.stringify(only)} matched no msg keys.`);
    console.error(`Known keys (needsVictim only): ${all.map((m) => m.key).join(', ')}`);
    process.exit(1);
  }

  const existing: Record<string, WalletEntry> = fs.existsSync(WALLETS_FILE)
    ? JSON.parse(fs.readFileSync(WALLETS_FILE, 'utf-8'))
    : {};

  const todo = targets.filter((m) => !existing[m.key]);
  console.log(`=== CGD-1483 SEI wallet bulk-create ===`);
  console.log(`Env          : ${env}`);
  console.log(`Coin         : ${COIN}`);
  console.log(`Enterprise   : ${enterprise}`);
  console.log(`Total target : ${targets.length} (${MSG_LIST.length} msgs in catalog)`);
  console.log(`Already done : ${targets.length - todo.length}`);
  console.log(`To create    : ${todo.length}`);
  console.log('');
  for (const m of todo) console.log(`  - ${m.key}  (${m.protoTypeUrl})`);

  if (dryRun) {
    console.log('\nDRY_RUN=1 — exiting without creating wallets.');
    return;
  }
  if (todo.length === 0) {
    console.log('\nNothing to do — all wallets already exist.');
    return;
  }

  const bitgo = new BitGo({ env });
  bitgo.authenticateWithAccessToken({ accessToken });

  const updated: Record<string, WalletEntry> = { ...existing };
  let succeeded = 0;
  let failed = 0;
  for (const spec of todo) {
    const label = `${DEFAULT_LABEL_PREFIX} | ${spec.key} | ${new Date().toISOString().slice(0, 10)}`;
    console.log(`\n→ Creating ${spec.key} — label: ${label}`);
    try {
      const walletOptions: GenerateWalletOptions = {
        label,
        passphrase,
        passcodeEncryptionCode: passphrase,
        multisigType: 'tss',
        enterprise,
      };
      const wallet = await bitgo.coin(COIN).wallets().generateWallet(walletOptions);
      const walletInstance: any = (wallet as any).wallet ?? wallet;
      // BitGo's tsei receiveAddress() returns "sei1...?memoId=N" — the
      // bech32 part is the on-chain address. Each wallet gets a unique
      // root address (memoId only matters for shared-root coins, which
      // doesn't apply here). Strip the URL-style memoId suffix before
      // persisting so downstream scripts use a valid bech32 recipient.
      const rawAddress: string =
        walletInstance.receiveAddress() ?? walletInstance.coinSpecific()?.rootAddress;
      const address = rawAddress.split('?')[0];
      const walletId: string = walletInstance.id();
      updated[spec.key] = {
        walletId,
        address,
        label,
        createdAt: new Date().toISOString(),
      };
      fs.writeFileSync(WALLETS_FILE, JSON.stringify(updated, null, 2));
      console.log(`  ✓ id      : ${walletId}`);
      console.log(`  ✓ address : ${address}`);
      succeeded++;
    } catch (e: any) {
      console.error(`  ✗ FAILED  : ${e.message ?? e}`);
      failed++;
    }
  }

  console.log(`\n=== Done — ${succeeded} created, ${failed} failed ===`);
  console.log(`wallets.json: ${WALLETS_FILE}`);
}

main().catch((e) => {
  console.error('Fatal error:', e.message ?? e);
  process.exit(1);
});
