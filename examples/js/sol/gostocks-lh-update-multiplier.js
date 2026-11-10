/**
 * HND-02: update the ScaledUiAmount multiplier THROUGH the BitGo wallet (customTx),
 * proving BitGo can hold the corporate-action authority.
 *   node examples/js/sol/gostocks-lh-update-multiplier.js <newMultiplier> [unixTs]
 */
const path = require('path');
const fs = require('fs');
const os = require('os');
const { PublicKey, TransactionInstruction } = require('@solana/web3.js');
const spl015 = require('/Users/zeeshanamjad/repos/usd-tokenization-service/node_modules/@solana/spl-token');
const BitGoJS = require('bitgo');

const env = {};
try {
  for (const line of fs.readFileSync(path.join(os.homedir(), '.bitgo-test-creds'), 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z_]+)=(.*)\s*$/);
    if (m) env[m[1]] = m[2].trim();
  }
} catch (_) { /* none */ }

const MINT = new PublicKey(process.env.MINT || fs.readFileSync('/Users/zeeshanamjad/repos/sol-scratch/gostocks-lh/mint-address.txt', 'utf8').trim());
const newMultiplier = Number(process.argv[2]);
const effectiveTs = process.argv[3] ? Math.floor(Number(process.argv[3])) : Math.floor(Date.now() / 1000);
if (!Number.isFinite(newMultiplier)) throw new Error('usage: <newMultiplier> [unixTs]');

async function main() {
  const bitgo = new BitGoJS.BitGo({ env: env.BITGO_ENV });
  bitgo.authenticateWithAccessToken({ accessToken: env.BITGO_API_TOKEN });
  const wallet = await bitgo.coin('tsol').wallets().get({ id: env.BITGO_TSOL_WALLET_ID });
  const root = wallet.coinSpecific().rootAddress;

  // UpdateMultiplier via the service's spl-token 0.4.15 copy (disc 0x2b01 + f64 multiplier + i64 ts)
  const ix = spl015.createUpdateMultiplierDataInstruction(
    MINT,
    new PublicKey(root),
    newMultiplier,
    BigInt(effectiveTs),
    [],
    new PublicKey('TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb'),
  );
  const result = await wallet.sendMany({
    type: 'customTx',
    solInstructions: [{
      programId: ix.programId.toBase58(),
      keys: ix.keys.map((k) => ({ pubkey: k.pubkey.toBase58(), isSigner: k.isSigner, isWritable: k.isWritable })),
      data: ix.data.toString('base64'),
    }],
    walletPassphrase: env.BITGO_WALLET_PASSPHRASE,
    memo: 'gostocks-lh update-multiplier',
  });
  console.log('✅', JSON.stringify({ txid: result.txid, txRequestId: result.txRequestId }, null, 2));
}
main().catch((e) => { console.error('❌', e.message); process.exit(1); });
