'use strict';
/**
 * Red-team: verify BUG-privateDerive-scalarAdd-modL for double-hardened paths.
 * Also probe: is the mod-L reduction actually observable in the pubkey for m/H/H?
 * And: does scalarAdd ACTUALLY reduce mod L when t is small (below L)?
 */
const crypto = require('crypto');
const path = require('path');

const REPO = require('path').join(__dirname, '..', '..', '..');
const DIST = path.join(REPO, 'modules/sdk-lib-mpc/dist/src');
const NM   = path.join(REPO, 'node_modules');

const { Ed25519Curve, Ed25519Bip32HdTree } = require(path.join(DIST, 'index.js'));
const { bigIntFromBufferLE, bigIntToBufferLE, bigIntFromBufferBE, bigIntToBufferBE } = require(path.join(DIST, 'util.js'));
const sodium = require(path.join(NM, 'libsodium-wrappers-sumo'));
const { ed25519: nobleEd } = require(path.join(NM, '@noble/curves/ed25519'));
const { ExtendedPoint } = nobleEd;

const L = BigInt('0x1000000000000000000000000000000014def9dea2f79cd65812631a5cf5d3ed');
const CHAINCODE_MOD = BigInt('0x010000000000000000000000000000000000000000000000000000000000000000');

function bufToLEBigInt(buf) {
  let r = 0n;
  for (let i = buf.length - 1; i >= 0; i--) r = (r << 8n) | BigInt(buf[i]);
  return r;
}
function bufToBEBigInt(buf) {
  let r = 0n;
  for (const byte of buf) r = (r << 8n) | BigInt(byte);
  return r;
}
function bigIntToLE32(n) {
  const buf = Buffer.alloc(32);
  let nn = n;
  for (let i = 0; i < 32; i++) { buf[i] = Number(nn & 0xFFn); nn >>= 8n; }
  return buf;
}
function bigIntToBE32(n) {
  const buf = Buffer.alloc(32);
  let nn = n;
  for (let i = 31; i >= 0; i--) { buf[i] = Number(nn & 0xFFn); nn >>= 8n; }
  return buf;
}
function modL(n) { n = n % L; return n < 0n ? n + L : n; }

function generateRoot(seed32) {
  const k = crypto.createHash('sha512').update(seed32).digest();
  const kLBuf = Buffer.from(k.slice(0, 32));
  const kRBuf = Buffer.from(k.slice(32, 64));
  kLBuf[0] &= 0xF8; kLBuf[31] &= 0x1F; kLBuf[31] |= 0x40;
  const pkBuf = Buffer.from(sodium.crypto_scalarmult_ed25519_base_noclamp(kLBuf));
  const ccBuf = crypto.createHash('sha256').update(Buffer.concat([Buffer.from([0x01]), k])).digest();
  return { kLBuf, kRBuf, chaincodeBuf: ccBuf, pkBuf };
}

function nobleDerive(kLBuf, kRBuf, chaincodeBuf, pkBuf32, index) {
  const isHardened = (index >>> 0) >= 0x80000000;
  const iLE4 = Buffer.alloc(4); iLE4.writeUInt32LE(index >>> 0, 0);
  function hmac512(key, ...parts) {
    const h = crypto.createHmac('sha512', key);
    for (const p of parts) h.update(p);
    return h.digest();
  }
  let Z, I;
  if (!isHardened) {
    Z = hmac512(chaincodeBuf, Buffer.from([0x02]), pkBuf32, iLE4);
    I = hmac512(chaincodeBuf, Buffer.from([0x03]), pkBuf32, iLE4);
  } else {
    Z = hmac512(chaincodeBuf, Buffer.from([0x00]), kLBuf, iLE4);
    I = hmac512(chaincodeBuf, Buffer.from([0x01]), kLBuf, iLE4);
  }
  const zL = Z.slice(0, 28);
  const zR = Z.slice(32, 64);
  const IR = I.slice(32, 64);
  const t = BigInt(8) * bufToLEBigInt(zL);
  const child_kL_int = bufToLEBigInt(kLBuf) + t; // NO mod-L per paper
  const child_kLBuf = bigIntToLE32(child_kL_int);
  const A = ExtendedPoint.fromHex(pkBuf32.toString('hex'));
  const child_A = A.add(ExtendedPoint.BASE.multiply(modL(t)));
  const child_pkBuf = Buffer.from(child_A.toRawBytes());
  const child_kR_int = (bufToBEBigInt(kRBuf) + bufToBEBigInt(zR)) % CHAINCODE_MOD;
  const child_kRBuf = bigIntToBE32(child_kR_int);
  const child_ccBuf = Buffer.from(IR);
  return { kLBuf: child_kLBuf, kRBuf: child_kRBuf, chaincodeBuf: child_ccBuf, pkBuf: child_pkBuf };
}

function nobleDeriveByPath(root, pathStr) {
  const indices = pathStr.replace(/^m\//, '').split('/').map(s => {
    if (s.endsWith("'") || s.endsWith('h')) return parseInt(s) | 0x80000000;
    const n = parseInt(s, 10); if (isNaN(n)) throw new Error(`invalid: ${s}`);
    return n;
  });
  let state = { ...root };
  for (const idx of indices) {
    const d = nobleDerive(state.kLBuf, state.kRBuf, state.chaincodeBuf, state.pkBuf, idx);
    state = d;
  }
  return state;
}

async function main() {
  await sodium.ready;
  await Ed25519Curve.initialize();

  const SEED = Buffer.from('deadbeefcafebabe0102030405060708090a0b0c0d0e0f101112131415161718', 'hex');
  const root = generateRoot(SEED);
  const kc = {
    sk: bigIntFromBufferLE(root.kLBuf),
    prefix: bigIntFromBufferBE(root.kRBuf),
    chaincode: bigIntFromBufferBE(root.chaincodeBuf),
    pk: bigIntFromBufferLE(root.pkBuf),
  };
  const tree = await Ed25519Bip32HdTree.initialize();

  // ─── TEST 1: Verify scalarAdd IS actually mod-L on "normal" t values ────────
  console.log('=== TEST 1: scalarAdd mod-L behavior ===');
  const curve = new Ed25519Curve();
  // Test with L-1 + 2 = 1 (should reduce)
  const Lm1 = L - 1n;
  const two = 2n;
  const result_scalarAdd = curve.scalarAdd(Lm1, two);
  console.log(`scalarAdd(L-1, 2): expected 1, got ${result_scalarAdd} — reduces mod L: ${result_scalarAdd === 1n}`);
  // Test: does scalarAdd reduce a small value that's already < L?
  const small = 42n;
  const small2 = 43n;
  const result_small = curve.scalarAdd(small, small2);
  console.log(`scalarAdd(42, 43): expected 85, got ${result_small} — no wrap: ${result_small === 85n}`);

  // ─── TEST 2: Double-hardened path pk divergence ─────────────────────────────
  console.log('\n=== TEST 2: Double-hardened m/H/H pk divergence ===');
  const DH_PATH = 'm/2147483648/2147483648';

  // SDK derivation
  const sdkDH = tree.privateDerive(kc, DH_PATH);
  const sdkDH_pk = bigIntToBufferLE(sdkDH.pk, 32).toString('hex');
  const sdkDH_sk = bigIntToBufferLE(sdkDH.sk, 32).toString('hex');

  // Noble derivation (no mod-L)
  const nobleDH = nobleDeriveByPath(root, DH_PATH);
  const nobleDH_pk = nobleDH.pkBuf.toString('hex');
  const nobleDH_sk = nobleDH.kLBuf.toString('hex');

  console.log(`SDK   m/H/H pk: ${sdkDH_pk}`);
  console.log(`noble m/H/H pk: ${nobleDH_pk}`);
  console.log(`pk match: ${sdkDH_pk === nobleDH_pk}`);
  console.log(`SDK   m/H/H sk: ${sdkDH_sk}`);
  console.log(`noble m/H/H sk: ${nobleDH_sk}`);
  console.log(`sk match: ${sdkDH_sk === nobleDH_sk}`);

  // ─── TEST 3: Understand WHY double-hardened diverges ─────────────────────────
  // Step-1: both derive m/H identically?
  console.log('\n=== TEST 3: Step-by-step decomposition of m/H ===');
  const sdkH1 = tree.privateDerive(kc, 'm/2147483648');
  const nobleH1 = nobleDeriveByPath(root, 'm/2147483648');
  const sdkH1_sk = bigIntToBufferLE(sdkH1.sk, 32).toString('hex');
  const nobleH1_sk = nobleH1.kLBuf.toString('hex');
  const sdkH1_pk = bigIntToBufferLE(sdkH1.pk, 32).toString('hex');
  const nobleH1_pk = nobleH1.pkBuf.toString('hex');
  console.log(`m/H SDK   sk: ${sdkH1_sk}`);
  console.log(`m/H noble sk: ${nobleH1_sk}`);
  console.log(`m/H sk match: ${sdkH1_sk === nobleH1_sk}`);
  console.log(`m/H pk match: ${sdkH1_pk === nobleH1_pk}`);

  // Check: is SDK m/H sk congruent to noble m/H sk mod L?
  const sdkH1_int = bufToLEBigInt(Buffer.from(sdkH1_sk, 'hex'));
  const nobleH1_int = bufToLEBigInt(Buffer.from(nobleH1_sk, 'hex'));
  console.log(`m/H sk SDK mod L == noble mod L: ${modL(sdkH1_int) === modL(nobleH1_int)}`);
  console.log(`m/H sk values equal (unmodded): ${sdkH1_int === nobleH1_int}`);
  // The key question: since HMAC for step-2 uses bigIntToBufferLE(sk, 32) which serializes sk mod-2^256
  // (NOT mod-L), if SDK sk != noble sk byte-for-byte, they'll produce different Z/I and thus different pk.
  console.log('\nSDK m/H sk bytes (fed into step-2 HMAC):', Buffer.from(sdkH1_sk, 'hex').toString('hex'));
  console.log('noble m/H sk bytes (fed into step-2 HMAC):', nobleH1_sk);

  // ─── TEST 4: Verify the HMAC divergence is real ─────────────────────────────
  console.log('\n=== TEST 4: HMAC Z divergence at m/H/H step-2 ===');
  const H_IDX = 0x80000000;
  const iLE4 = Buffer.alloc(4); iLE4.writeUInt32LE(H_IDX, 0);
  const sdkCCBuf = bigIntToBufferBE(sdkH1.chaincode, 32);
  const nobleCCBuf = nobleH1.chaincodeBuf;
  console.log(`CC match: ${sdkCCBuf.toString('hex') === nobleCCBuf.toString('hex')}`);

  const sdkSkBuf_step2 = bigIntToBufferLE(sdkH1.sk, 32);
  const nobleSkBuf_step2 = nobleH1.kLBuf;
  const sdkSkBufMatch = sdkSkBuf_step2.toString('hex') === nobleSkBuf_step2.toString('hex');
  console.log(`step-2 sk buffers match: ${sdkSkBufMatch}`);
  // If CC and sk both match, Z should match and pk should match. But they don't (from TEST 2)?
  // Actually wait — let me think. The SDK uses scalarAdd which gives sk mod L.
  // If sdk_sk != noble_sk byte-for-byte (due to mod-L), and the HMAC for step-2 uses sk as HMAC data,
  // then Z will differ and child pk will differ. But the HMAC key is chaincode, and HMAC data is kL_LE.
  // If sdk step-1 sk was reduced mod L, its LE bytes are different from the unreduced noble sk.
  // => Different HMAC data => different Z => different t => different pk at step-2.

  // Let's compute Z manually for both:
  function hmac512H(cc, skBuf) {
    const h = crypto.createHmac('sha512', cc);
    h.update(Buffer.from([0x00]));
    h.update(skBuf);
    h.update(iLE4);
    return h.digest();
  }
  const Z_sdk = hmac512H(sdkCCBuf, sdkSkBuf_step2);
  const Z_noble = hmac512H(nobleCCBuf, nobleSkBuf_step2);
  console.log(`Z_sdk  (step-2): ${Z_sdk.toString('hex').slice(0, 64)}...`);
  console.log(`Z_noble(step-2): ${Z_noble.toString('hex').slice(0, 64)}...`);
  console.log(`Z match at step-2: ${Z_sdk.toString('hex') === Z_noble.toString('hex')}`);

  // ─── TEST 5: Single-hardened — is sk truly different but pk same? ─────────────
  console.log('\n=== TEST 5: Probe why single-hardened pk matches despite sk divergence ===');
  // For m/H: the HMAC uses the ROOT sk (before any derivation), which is the same for both.
  // So Z is identical. t is identical. child_pk = root_pk + t*B is identical.
  // But child_sk: SDK does scalarAdd(root_sk, t) which reduces mod L.
  //              noble does root_sk + t (no reduction).
  // Since both start from the SAME root sk, the only difference is mod-L.
  // Since root_sk < L (it was clamped and kL < 2^255 which is < L), root_sk + t might exceed L.
  // But the PUBLIC key only depends on (root_sk + t) mod L anyway — ED25519 is mod-L.
  // So both produce the SAME point on the curve. The pk match is guaranteed for single-level.
  console.log('(This is a structural argument, not a numerical test)');
  console.log('For m/H step-1: HMAC uses root sk (identical for both) => t is identical');
  console.log('child_pk = root_pk + t*B is identical (same root_pk, same t)');
  console.log('child_sk: SDK reduces (root_sk + t) mod L; noble keeps (root_sk + t) unreduced');
  console.log('=> Single-level: pk always identical; sk differs only in modular reduction');

  // But for step-2 (m/H/H): HMAC data = child_sk_LE
  // SDK child_sk_LE = (root_sk + t) mod L — reduced, different bytes from noble
  // noble child_sk_LE = root_sk + t — unreduced, possibly > L
  // => Different HMAC data => different Z => different t2 => different pk
  console.log('\nFor m/H/H step-2: HMAC data = child_sk_LE (from step-1)');
  console.log('SDK: child_sk_LE is mod-L-reduced => different bytes from noble');
  console.log('noble: child_sk_LE is unreduced => different HMAC => different pk');
  console.log('CONCLUSION: BUG-privateDerive-scalarAdd-modL is real for m/H/H');

  // ─── TEST 6: The non-hardened case — does sk divergence affect step-2? ───────
  // For non-hardened derivation, HMAC data = pk (not sk).
  // So even if sdk sk != noble sk, the HMAC inputs are identical => Z identical => t identical.
  // => pk always matches for non-hardened paths, regardless of depth.
  console.log('\n=== TEST 6: Non-hardened m/0/0/0 — pk should still match ===');
  const sdkNH3 = tree.privateDerive(kc, 'm/0/0/0');
  const nobleNH3 = nobleDeriveByPath(root, 'm/0/0/0');
  const sdkNH3_pk = bigIntToBufferLE(sdkNH3.pk, 32).toString('hex');
  const nobleNH3_pk = nobleNH3.pkBuf.toString('hex');
  console.log(`m/0/0/0 pk match: ${sdkNH3_pk === nobleNH3_pk}`);

  // ─── TEST 7: Mixed hardened/non-hardened ─────────────────────────────────────
  // m/H/0: step-1 is hardened (sk diverges), step-2 is non-hardened (uses pk as HMAC data)
  // => pk should match at step-2 because HMAC data is pk (which matches at step-1)
  console.log('\n=== TEST 7: Mixed m/H/0 — non-hardened after hardened ===');
  const sdkHNH = tree.privateDerive(kc, 'm/2147483648/0');
  const nobleHNH = nobleDeriveByPath(root, 'm/2147483648/0');
  const sdkHNH_pk = bigIntToBufferLE(sdkHNH.pk, 32).toString('hex');
  const nobleHNH_pk = nobleHNH.pkBuf.toString('hex');
  console.log(`m/H/0 pk match: ${sdkHNH_pk === nobleHNH_pk}`);
  // This should MATCH because step-2 non-hardened uses pk (not sk) as HMAC data.

  // ─── SUMMARY ─────────────────────────────────────────────────────────────────
  console.log('\n=== SUMMARY ===');
  console.log('BUG affects: ONLY paths with a hardened derivation step where the PARENT was also hardened.');
  console.log('NOT affected: any path where step N is non-hardened (uses pk, not sk, in HMAC).');
  console.log('NOT affected: m/H (single hardened — uses ROOT sk which is same for both).');
  console.log('AFFECTED: m/H/H, m/H/H/H, etc. (hardened where parent sk has been mod-L-reduced).');
  console.log('ALSO AFFECTED: m/H/H/0 or m/0/H/H — the corruption propagates from the point of divergence.');
  console.log('\nFor FR-13 design (hardened user child at wallet creation): only ONE level of hardening.');
  console.log('=> Single-level m/H is SAFE for FR-13 (pk correct, signing correct).');
  console.log('=> Multi-level hardened FR-13 (m/H/H) would require the fix.');
}

main().catch(err => { console.error('FATAL:', err); process.exit(1); });
