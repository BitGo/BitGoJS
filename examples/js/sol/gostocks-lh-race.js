/**
 * goStocks race harness (MUL-02/05/06): hold a signed guarded mint WITHOUT broadcasting,
 * change the multiplier on-chain, then release — the guard must fail the tx on-chain.
 *
 * Subcommands:
 *   hold [mode]        mode: guard | guard-scheduled — signs and holds; prints txRequestId
 *   release <txRequestId>   posts the transfer (broadcast) and reports the outcome
 *
 * Run from the BitGoJS repo root. Env as in gostocks-lh-mint.js.
 */
const path = require('path');
const fs = require('fs');
const os = require('os');
const { PublicKey, TransactionInstruction } = require('@solana/web3.js');
const {
  createMintToCheckedInstruction,
  createAssociatedTokenAccountIdempotentInstruction,
  getAssociatedTokenAddressSync,
  TOKEN_2022_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} = require('@solana/spl-token');
const spl015 = require('/Users/zeeshanamjad/repos/usd-tokenization-service/node_modules/@solana/spl-token');
const BitGoJS = require('bitgo');

const env = {};
try {
  for (const line of fs.readFileSync(path.join(os.homedir(), '.bitgo-test-creds'), 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z_]+)=(.*)\s*$/);
    if (m) env[m[1]] = m[2].trim();
  }
} catch (_) { /* none */ }
const getEnv = (k) => process.env[k] || env[k];

const RPC = process.env.RPC || 'https://api.devnet.solana.com';
const scratchMint = '/Users/zeeshanamjad/repos/sol-scratch/gostocks-lh/mint-address.txt';
const MINT = new PublicKey(process.env.MINT || fs.readFileSync(scratchMint, 'utf8').trim());
const DECIMALS = 9;
const AMOUNT = BigInt(process.env.AMOUNT || '1000000000');

// guard encoder (same as gostocks-lh-mint.js)
const LIGHTHOUSE = 'L2TExMFKdjpN9kozasaurPirfHy9P8sbXoAN1qA3S95';
const TOKEN_2022 = 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb';
const U32 = 5, U64 = 7, I64 = 8, EQ = 0, LT = 3, GTE = 4;

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
function assertAccountDataMulti(asserts) {
  const parts = [Buffer.from([3, 4]), leb(asserts.length)];
  for (const a of asserts) {
    parts.push(leb(a.offset), Buffer.from([a.kind]));
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
  return Buffer.concat([Buffer.from([15, 4, 4]), b, Buffer.from([op])]);
}
function parseScaledUi(raw) {
  const buf = Buffer.from(raw);
  let off = 166;
  for (;;) {
    const t = buf.readUInt16LE(off);
    const l = buf.readUInt16LE(off + 2);
    if (t === 0) throw new Error('no ScaledUi');
    if (t === 25) {
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
  const r = await fetch(RPC, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'getAccountInfo', params: [mint, { encoding: 'base64' }] }) });
  const j = await r.json();
  if (j.error) throw new Error(JSON.stringify(j.error));
  return parseScaledUi(Buffer.from(j.result.value.data[0], 'base64'));
}
function buildGuardInstructions(snapshot, mint) {
  const nowSeconds = BigInt(Math.floor(Date.now() / 1000));
  const T = snapshot.newMultiplierEffectiveTimestamp;
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
      data: assertSysvarClock(LT, T),
    }));
  }
  return ixs;
}
function toSolInstruction(ix) {
  return {
    programId: ix.programId.toBase58(),
    keys: ix.keys.map((k) => ({ pubkey: typeof k.pubkey === 'string' ? k.pubkey : new PublicKey(k.pubkey).toBase58(), isSigner: k.isSigner, isWritable: k.isWritable })),
    data: ix.data.toString('base64'),
  };
}

async function main() {
  const [cmd, arg] = process.argv.slice(2);
  const bitgo = new BitGoJS.BitGo({ env: getEnv('BITGO_ENV') });
  bitgo.authenticateWithAccessToken({ accessToken: getEnv('BITGO_API_TOKEN') });
  const wallet = await bitgo.coin('tsol').wallets().get({ id: getEnv('BITGO_TSOL_WALLET_ID') });
  const walletRootAddress = wallet.coinSpecific().rootAddress;
  const destination = new PublicKey(process.env.DEST || walletRootAddress);
  const ata = getAssociatedTokenAddressSync(MINT, destination, true, TOKEN_2022_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID);

  let instructions = [
    new TransactionInstruction({
      programId: new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'),
      keys: [{ pubkey: new PublicKey(walletRootAddress), isSigner: true, isWritable: false }],
      data: Buffer.from([0]),
    }),
    createAssociatedTokenAccountIdempotentInstruction(walletRootAddress, ata, destination, MINT, TOKEN_2022_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID),
    createMintToCheckedInstruction(MINT, ata, new PublicKey(walletRootAddress), AMOUNT, DECIMALS, [], TOKEN_2022_PROGRAM_ID),
  ];
  const isBurn = process.env.BURN === '1';
  if (isBurn) {
    const owner = new PublicKey(walletRootAddress);
    const burnIx = spl015.createPermissionedBurnCheckedInstruction(ata, MINT, owner, owner, AMOUNT, DECIMALS, undefined, TOKEN_2022_PROGRAM_ID);
    instructions = [instructions[0], burnIx];
  }

  const snap = await readScaledUiSnapshot(MINT.toBase58());
  console.log('snapshot: multiplier=%s T=%s new=%s', snap.multiplier, snap.newMultiplierEffectiveTimestamp, snap.newMultiplier);
  instructions.push(...buildGuardInstructions(snap, MINT.toBase58()));
  console.log('guard instructions:', instructions.length - 3);


  const params = {
    type: 'customTx',
    solInstructions: instructions.map(toSolInstruction),
    walletPassphrase: getEnv('BITGO_WALLET_PASSPHRASE'),
    memo: 'gostocks-lh race' + (isBurn ? ' burn' : ''),
  };

  if (cmd === 'hold') {
    const signed = await wallet.prebuildAndSignTransaction(params);
    console.log('HOLD txRequestId:', signed.txRequestId);
    fs.writeFileSync(path.join(os.tmpdir(), 'gostocks-lh-hold.json'), JSON.stringify({ txRequestId: signed.txRequestId, snapshot: { multiplier: snap.multiplier, T: String(snap.newMultiplierEffectiveTimestamp), newMultiplier: snap.newMultiplier }, at: new Date().toISOString() }));
    return;
  }
  if (cmd === 'release') {
    const txRequestId = arg || JSON.parse(fs.readFileSync(path.join(os.tmpdir(), 'gostocks-lh-hold.json'), 'utf8')).txRequestId;
    console.log('releasing', txRequestId);
    try {
      const r = await bitgo.post(bitgo.url(`/wallet/${wallet.id()}/txrequests/${txRequestId}/transfers`, 2)).send().result();
      console.log('release result:', JSON.stringify(r).slice(0, 500));
    } catch (e) {
      console.log('release error:', e.message);
      if (e.result) console.log('result:', JSON.stringify(e.result).slice(0, 500));
    }
    return;
  }
  throw new Error('usage: hold | release <txRequestId>');
}

main().catch((e) => {
  console.error('❌', e.message || e);
  process.exit(1);
});
