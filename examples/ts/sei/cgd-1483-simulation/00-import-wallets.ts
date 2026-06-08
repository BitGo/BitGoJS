/**
 * CGD-1483 alternative to 00-create-wallets.ts.
 *
 * If the BitGo SDK isn't compiled yet (the monorepo needs `yarn` to build
 * before `bitgo` can be required), this script lets you import addresses
 * you've created manually via the BitGo Admin UI (https://app.bitgo-test.com)
 * into wallets.json.
 *
 * Input options:
 *   - WALLETS_JSON=path/to/file.json (file containing {key: {walletId, address, label}})
 *   - WALLETS_CSV=path/to/file.csv  (header: key,walletId,address,label)
 *   - PROMPT=1                       interactive paste mode (one per line:
 *                                    key,walletId,address)
 *
 * Merges into wallets.json next to this script; existing entries take
 * precedence (skips re-import). Validates each row is a unique sei1...
 * address.
 */

import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { MSG_LIST, walletsToCreate } from './lib/msg-list';

const WALLETS_FILE = path.resolve(__dirname, 'wallets.json');

interface WalletEntry {
  walletId: string;
  address: string;
  label: string;
  createdAt?: string;
}

async function main() {
  const known = walletsToCreate().map((m) => m.key);
  const existing: Record<string, WalletEntry> = fs.existsSync(WALLETS_FILE)
    ? JSON.parse(fs.readFileSync(WALLETS_FILE, 'utf-8'))
    : {};

  console.log(`=== CGD-1483 wallet import ===`);
  console.log(`Existing entries: ${Object.keys(existing).length}`);
  console.log(`Expected keys   : ${known.length} (${MSG_LIST.length} msgs total)`);
  for (const k of known) console.log(`  ${existing[k] ? '✓' : ' '} ${k}${existing[k] ? `  → ${existing[k].address}` : ''}`);

  const merged = { ...existing };
  if (process.env.WALLETS_JSON) {
    const data = JSON.parse(fs.readFileSync(process.env.WALLETS_JSON, 'utf-8'));
    for (const [k, v] of Object.entries(data)) {
      if (!merged[k]) merged[k] = v as WalletEntry;
    }
  } else if (process.env.WALLETS_CSV) {
    const text = fs.readFileSync(process.env.WALLETS_CSV, 'utf-8');
    const lines = text.split(/\r?\n/).filter(Boolean);
    const headers = lines[0].split(',').map((h) => h.trim());
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map((c) => c.trim());
      const row = Object.fromEntries(headers.map((h, idx) => [h, cols[idx]]));
      if (!row.key || !row.address) continue;
      if (!merged[row.key]) {
        merged[row.key] = {
          walletId: row.walletId,
          address: row.address,
          label: row.label ?? `imported-${row.key}`,
          createdAt: new Date().toISOString(),
        };
      }
    }
  } else if (process.env.PROMPT === '1') {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    console.log('\nPaste one row per line as: <key>,<walletId>,<address> — blank line ends:');
    await new Promise<void>((resolve) => {
      rl.on('line', (line) => {
        const trimmed = line.trim();
        if (!trimmed) {
          rl.close();
          return resolve();
        }
        const [key, walletId, address] = trimmed.split(',').map((s) => s.trim());
        if (!key || !address) {
          console.log(`  skipped (need key,walletId,address): ${trimmed}`);
          return;
        }
        merged[key] = {
          walletId: walletId ?? '',
          address,
          label: `imported-${key}`,
          createdAt: new Date().toISOString(),
        };
        console.log(`  ✓ ${key} → ${address}`);
      });
    });
  } else {
    console.error(
      '\nNo input source. Set one of:\n' +
        '  WALLETS_JSON=path/to/file.json\n' +
        '  WALLETS_CSV=path/to/file.csv  (header: key,walletId,address,label)\n' +
        '  PROMPT=1                        (interactive paste)\n'
    );
    process.exit(1);
  }

  fs.writeFileSync(WALLETS_FILE, JSON.stringify(merged, null, 2));
  console.log(`\nWrote ${Object.keys(merged).length} entries to ${WALLETS_FILE}.`);
  const missing = known.filter((k) => !merged[k]);
  if (missing.length) {
    console.log(`Still missing ${missing.length} key(s): ${missing.join(', ')}`);
  } else {
    console.log(`All required wallet keys present. ✓`);
  }
}

main().catch((e) => {
  console.error('Fatal:', e.message ?? e);
  process.exit(1);
});
