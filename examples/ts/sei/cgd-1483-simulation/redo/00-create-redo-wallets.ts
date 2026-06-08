/**
 * Bulk-create the 6 redo tsei wallets. Same TSS-via-SDK pattern as the
 * original 00-create-wallets.ts, but writes to redo/redo-wallets.json
 * keyed by RedoSpec.key.
 *
 * Inputs (env):
 *   BITGO_ACCESS_TOKEN, BITGO_ENTERPRISE, BITGO_PASSPHRASE
 */

import fs from 'fs';
import path from 'path';
import { BitGo } from 'bitgo';
import { GenerateWalletOptions } from '@bitgo/sdk-core';
import { REDO_LIST } from './redo-list';

const OUT = path.resolve(__dirname, 'redo-wallets.json');
const COIN = 'tsei';
const LABEL_PREFIX = 'CGD-1483 sei sim REDO';

interface WalletEntry {
  walletId: string;
  address: string;
  label: string;
  createdAt: string;
}

async function main() {
  const accessToken = process.env.BITGO_ACCESS_TOKEN;
  const enterprise = process.env.BITGO_ENTERPRISE;
  const passphrase = process.env.BITGO_PASSPHRASE ?? 'cgd1483_sim_pw_2026_05_26';
  if (!accessToken || !enterprise) {
    console.error('Set BITGO_ACCESS_TOKEN and BITGO_ENTERPRISE');
    process.exit(1);
  }

  const existing: Record<string, WalletEntry> = fs.existsSync(OUT)
    ? JSON.parse(fs.readFileSync(OUT, 'utf-8'))
    : {};

  const todo = REDO_LIST.filter((s) => !existing[s.key]);
  console.log(`=== Redo wallet bulk-create — ${todo.length} new of ${REDO_LIST.length} ===`);
  for (const m of todo) console.log(`  - ${m.key}  (${m.bitgoIntent})`);
  if (todo.length === 0) {
    console.log('Nothing to do — all redo wallets already exist.');
    return;
  }

  const bitgo = new BitGo({ env: 'test' });
  bitgo.authenticateWithAccessToken({ accessToken });

  const updated = { ...existing };
  let succeeded = 0;
  let failed = 0;
  for (const spec of todo) {
    const label = `${LABEL_PREFIX} | ${spec.key} | ${new Date().toISOString().slice(0, 10)}`;
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
      const rawAddress: string =
        walletInstance.receiveAddress() ?? walletInstance.coinSpecific()?.rootAddress;
      const address = rawAddress.split('?')[0]; // strip ?memoId=0
      const walletId: string = walletInstance.id();
      updated[spec.key] = {
        walletId,
        address,
        label,
        createdAt: new Date().toISOString(),
      };
      fs.writeFileSync(OUT, JSON.stringify(updated, null, 2));
      console.log(`  ✓ id      : ${walletId}`);
      console.log(`  ✓ address : ${address}`);
      succeeded++;
    } catch (e: any) {
      console.error(`  ✗ FAILED  : ${e.message ?? e}`);
      failed++;
    }
  }
  console.log(`\n=== Done — ${succeeded} created, ${failed} failed ===`);
}

main().catch((e) => {
  console.error('Fatal error:', e.message ?? e);
  process.exit(1);
});
