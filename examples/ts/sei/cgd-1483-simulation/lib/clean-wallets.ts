/**
 * Post-process wallets.json — strip the `?memoId=N` URL suffix from each
 * address. BitGo's tsei `receiveAddress()` returns sei1...?memoId=0, but the
 * indexer + LCD only know the bech32. Run once after 00-create-wallets.ts
 * to normalize the file in place.
 */

import fs from 'fs';
import path from 'path';

const WALLETS_FILE = path.resolve(__dirname, '..', 'wallets.json');
const data = JSON.parse(fs.readFileSync(WALLETS_FILE, 'utf-8'));
let cleaned = 0;
for (const k of Object.keys(data)) {
  const before = data[k].address;
  const after = before.split('?')[0];
  if (after !== before) {
    data[k].address = after;
    cleaned++;
    console.log(`  ${k}: ${before} → ${after}`);
  }
}
fs.writeFileSync(WALLETS_FILE, JSON.stringify(data, null, 2));
console.log(`Cleaned ${cleaned} entries.`);
