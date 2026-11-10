/**
 * goStocks devnet Lighthouse-guarded mint via BitGo customTx.
 *
 * Modes:
 *   baseline              memo + ATA + mintToChecked (no guard)            [MNT-01]
 *   guard                 + Lighthouse snapshot + clock assertions         [MNT-02]
 *   guard-wrong <m>       guard expects a wrong multiplier (must FAIL)     [MNT-05]
 *   simulate              print the payload only
 *
 * Env (or ~/.bitgo-test-creds): BITGO_ENV, BITGO_ACCESS_TOKEN, WALLET_ID, WALLET_PASSPHRASE
 * Optional: MINT=<mint>, DEST=<address>, AMOUNT=<raw base units>, RPC=<url>
 *
 * Run from the BitGoJS repo root:
 *   node examples/js/sol/gostocks-lh-mint.js baseline
 */
const path = require('path');
const fs = require('fs');
const os = require('os');
const { PublicKey, TransactionInstruction } = require('@solana/web3.js');
const {
  createMintToCheckedInstruction,
  createAssociatedTokenAccountIdempotentInstruction,
  createBurnCheckedInstruction,
  createPermissionedBurnCheckedInstruction,
  getAssociatedTokenAddressSync,
  TOKEN_2022_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} = require('@solana/spl-token');
const BitGoJS = require('bitgo');

// ─── env ────────────────────────────────────────────────────────────────────
const env = {};
try {
  for (const line of fs.readFileSync(path.join(os.homedir(), '.bitgo-test-creds'), 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z_]+)=(.*)\s*$/);
    if (m) env[m[1]] = m[2].trim();
  }
} catch (_) { /* no creds file */ }
const getEnv = (k) => process.env[k] || env[k];

const bitgoEnv = getEnv('BITGO_ENV') || 'staging';
const accessToken = getEnv('BITGO_API_TOKEN');
const walletId = getEnv('BITGO_TSOL_WALLET_ID');
const walletPassphrase = getEnv('BITGO_WALLET_PASSPHRASE');
if (!accessToken || !walletId || !walletPassphrase) {
  throw new Error('Set BITGO_API_TOKEN, BITGO_TSOL_WALLET_ID, BITGO_WALLET_PASSPHRASE (env or ~/.bitgo-test-creds)');
}

const RPC = process.env.RPC || 'https://api.devnet.solana.com';
const scratchMint = '/Users/zeeshanamjad/repos/sol-scratch/gostocks-lh/mint-address.txt';
const MINT = new PublicKey(process.env.MINT || fs.readFileSync(scratchMint, 'utf8').trim());
const DECIMALS = 9;
const AMOUNT = BigInt(process.env.AMOUNT || '1000000000'); // 1 token

const mode = process.argv[2] || 'guard';
const wrongMultiplier = process.argv[3] ? Number(process.argv[3]) : undefined;

// ─── Lighthouse guard encoder (ported from sol-scratch/gostocks-lh/guard.mts) ───
const LIGHTHOUSE = 'L2TExMFKdjpN9kozasaurPirfHy9P8sbXoAN1qA3S95';
const TOKEN_2022 = 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb';
const U32 = 5, U64 = 7, I64 = 8; // DataValueAssertion kinds
const EQ = 0, LT = 3, GTE = 4;   // IntegerOperator

function leb(n) {
  const out = [];
  let v = n;
  for (;;) {
    const b = v & 0x7f;
    v >>>= 7;
    if (v) out.push(b | 0x80);
    else { out.push(b); return Buffer.from(out); }
  }
}

function f64bits(m) {
  const b = Buffer.alloc(8);
  b.writeDoubleLE(m);
  return b.readBigUInt64LE(0);
}

function bitsF64(bits) {
  const b = Buffer.alloc(8);
  b.writeBigUInt64LE(bits);
  return b.readDoubleLE(0);
}

function assertAccountDataMulti(asserts) {
  const parts = [Buffer.from([3, 4]), leb(asserts.length)]; // disc 3, logLevel 4 (FailedPlaintextMessage)
  for (const a of asserts) {
    parts.push(leb(a.offset));
    parts.push(Buffer.from([a.kind]));
    const b = Buffer.alloc(a.kind === U32 ? 4 : 8);
    if (a.kind === U32) b.writeUInt32LE(Number(a.value));
    else if (a.kind === I64) b.writeBigInt64LE(BigInt(a.value));
    else b.writeBigUInt64LE(BigInt(a.value));
    parts.push(b, Buffer.from([a.op]));
  }
  return Buffer.concat(parts);
}

function assertSysvarClock(op, ts) {
  const b = Buffer.alloc(8);
  b.writeBigInt64LE(ts);
  return Buffer.concat([Buffer.from([15, 4, 4]), b, Buffer.from([op])]); // disc 15, logLevel 4, kind 4 = UnixTimestamp
}

function parseScaledUi(raw) {
  const buf = Buffer.from(raw);
  if (buf.length < 166 || buf[165] !== 1) throw new Error(`not a Token-2022 mint (len ${buf.length})`);
  let off = 166;
  for (;;) {
    if (off + 4 > buf.length) throw new Error('ScaledUiAmount extension not found');
    const t = buf.readUInt16LE(off);
    const l = buf.readUInt16LE(off + 2);
    if (t === 0) throw new Error('ScaledUiAmount extension not found');
    if (t === 25) {
      if (l !== 56) throw new Error(`ScaledUiAmount unexpected length ${l}`);
      const v = off + 4;
      return {
        scaledHeaderOffset: off,
        multiplierOffset: v + 32,
        timestampOffset: v + 40,
        newMultiplierOffset: v + 48,
        multiplier: buf.readDoubleLE(v + 32),
        newMultiplierEffectiveTimestamp: buf.readBigInt64LE(v + 40),
        newMultiplier: buf.readDoubleLE(v + 48),
      };
    }
    off += 4 + l;
  }
}

async function readScaledUiSnapshot(mint) {
  for (let i = 0; i < 6; i++) {
    // eslint-disable-next-line no-await-in-loop
    const r = await fetch(RPC, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'getAccountInfo', params: [mint, { encoding: 'base64' }] }) });
    if (r.status === 429) {
      // eslint-disable-next-line no-await-in-loop
      await new Promise((r2) => setTimeout(r2, 3000 + 2000 * i));
      continue;
    }
    const j = await r.json();
    if (j.error) throw new Error(JSON.stringify(j.error));
    if (!j.result.value) throw new Error(`mint ${mint} has no account`);
    if (j.result.value.owner !== TOKEN_2022) throw new Error(`owner ${j.result.value.owner} is not Token-2022`);
    return parseScaledUi(Buffer.from(j.result.value.data[0], 'base64'));
  }
  throw new Error('devnet RPC unavailable');
}

function buildGuardInstructions(snapshot, expectedMultiplier, mint, allowMismatch = false) {
  const nowSeconds = BigInt(Math.floor(Date.now() / 1000));
  const T = snapshot.newMultiplierEffectiveTimestamp;
  const effectiveAtBuild = T !== 0n && nowSeconds >= T ? snapshot.newMultiplier : snapshot.multiplier;
  if (effectiveAtBuild !== expectedMultiplier && !allowMismatch) {
    throw new Error(`snapshot effective multiplier ${effectiveAtBuild} != expected ${expectedMultiplier}`);
  }
  const headerU32 = 25 | (56 << 16);
  const lighthouse = new PublicKey(LIGHTHOUSE);
  const ixs = [new TransactionInstruction({
    programId: lighthouse,
    keys: [{ pubkey: new PublicKey(mint), isSigner: false, isWritable: false }],
    data: assertAccountDataMulti([
      { offset: snapshot.scaledHeaderOffset, kind: U32, value: headerU32, op: EQ },
      { offset: snapshot.multiplierOffset, kind: U64, value: f64bits(snapshot.multiplier), op: EQ },
      { offset: snapshot.timestampOffset, kind: I64, value: T, op: EQ },
      { offset: snapshot.newMultiplierOffset, kind: U64, value: f64bits(snapshot.newMultiplier), op: EQ },
    ]),
  })];
  if (T !== 0n && T > nowSeconds) {
    ixs.push(new TransactionInstruction({
      programId: lighthouse,
      keys: [],
      data: assertSysvarClock(T > nowSeconds ? LT : GTE, T),
    }));
  }
  return ixs;
}

// ─── main ───────────────────────────────────────────────────────────────────
function toSolInstruction(ix) {
  return {
    programId: ix.programId.toBase58(),
    keys: ix.keys.map((k) => ({ pubkey: typeof k.pubkey === 'string' ? k.pubkey : new PublicKey(k.pubkey).toBase58(), isSigner: k.isSigner, isWritable: k.isWritable })),
    data: ix.data.toString('base64'),
  };
}

async function main() {
  const bitgo = new BitGoJS.BitGo({ env: bitgoEnv });
  bitgo.authenticateWithAccessToken({ accessToken });
  const wallet = await bitgo.coin('tsol').wallets().get({ id: walletId });
  const walletRootAddress = wallet.coinSpecific().rootAddress;
  console.log('wallet root:', walletRootAddress);

  const destination = new PublicKey(process.env.DEST || walletRootAddress);
  const ata = getAssociatedTokenAddressSync(MINT, destination, true, TOKEN_2022_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID);
  console.log('mint:', MINT.toBase58(), 'destination:', destination.toBase58(), 'ata:', ata.toBase58());

  let instructions = [
    // memo signed by the wallet root (service: createMemoInstruction(mintAuthority))
    new TransactionInstruction({
      programId: new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'),
      keys: [{ pubkey: new PublicKey(walletRootAddress), isSigner: true, isWritable: false }],
      data: Buffer.from([0]),
    }),
    // idempotent ATA creation
    createAssociatedTokenAccountIdempotentInstruction(walletRootAddress, ata, destination, MINT, TOKEN_2022_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID),
    // mintToChecked — wallet root is mint authority
    createMintToCheckedInstruction(MINT, ata, new PublicKey(walletRootAddress), AMOUNT, DECIMALS, [], TOKEN_2022_PROGRAM_ID),
  ];
  if (mode === 'burn' || mode === 'burn-guard') {
    // permissioned burn of the wallet's own balance. BitGoJS bundles spl-token 0.4.9 which
    // has no PermissionedBurn; use the usd-tokenization-service copy (0.4.15) — the exact
    // builder the production service uses.
    const spl = require('/Users/zeeshanamjad/repos/usd-tokenization-service/node_modules/@solana/spl-token');
    const owner = new PublicKey(walletRootAddress);
    const burnIx = spl.createPermissionedBurnCheckedInstruction(ata, MINT, owner, owner, AMOUNT, DECIMALS, undefined, TOKEN_2022_PROGRAM_ID);
    instructions = [instructions[0], burnIx]; // memo + burn (no ATA creation)
  }

  if (mode !== 'baseline') {
    const snap = await readScaledUiSnapshot(MINT.toBase58());
    const nowSeconds = BigInt(Math.floor(Date.now() / 1000));
    const effective = snap.newMultiplierEffectiveTimestamp !== 0n && nowSeconds >= snap.newMultiplierEffectiveTimestamp
      ? snap.newMultiplier
      : snap.multiplier;
    const expected = wrongMultiplier !== undefined ? wrongMultiplier : effective;
    instructions.push(...buildGuardInstructions(snap, expected, MINT.toBase58(), wrongMultiplier !== undefined));
  }

  console.log(`instructions (${instructions.length}):`);
  instructions.forEach((ix, i) => console.log(`  [${i}] ${ix.programId.toBase58().slice(0, 8)}… data ${ix.data.length}B keys ${ix.keys.length}`));

  if (mode === 'simulate') {
    console.log(JSON.stringify({ type: 'customTx', solInstructions: instructions.map(toSolInstruction) }, null, 2).slice(0, 1200));
    return;
  }

  const result = await wallet.sendMany({
    type: 'customTx',
    solInstructions: instructions.map(toSolInstruction),
    walletPassphrase,
    memo: `gostocks-lh ${mode}`,
  });
  console.log('✅ sendMany:', JSON.stringify(result, null, 2).slice(0, 600));
}

main().catch((e) => {
  console.error('❌', e.message || e);
  if (e.result) console.error('result:', JSON.stringify(e.result).slice(0, 600));
  process.exit(1);
});
