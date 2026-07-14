// Consecutive-hardened (m/H/H) vector: proves reduced-vs-unreduced kL conventions
// diverge in PUBKEYS here, so the normative spec must pick one. BitGo normative = reduced mod L.
const { Ed25519Bip32HdTree } = require('../../modules/sdk-lib-mpc/dist/src/curves/ed25519Bip32HdTree');
const { createHash, createHmac } = require('crypto');
const { ed25519 } = require('../../node_modules/@noble/curves/ed25519');

const seed = Buffer.from('deadbeefcafebabe0102030405060708090a0b0c0d0e0f101112131415161718', 'hex');
const L = 2n ** 252n + 27742317777372353535851937790883648493n;
const leInt = (b) => BigInt('0x' + Buffer.from(b).reverse().toString('hex'));
const beInt = (b) => BigInt('0x' + Buffer.from(b).toString('hex'));
const leBuf = (n, len) => { const h = n.toString(16).padStart(len * 2, '0'); return Buffer.from(h, 'hex').reverse(); };

// Root per P1: SHA512(seed) -> kL clamped, kR; chaincode = SHA256(0x01 || SHA512(seed))
const ek = createHash('sha512').update(seed).digest();
const kL = Buffer.from(ek.subarray(0, 32)); const kR = Buffer.from(ek.subarray(32));
kL[0] &= 0xf8; kL[31] &= 0x1f; kL[31] |= 0x40;
const cc = createHash('sha256').update(Buffer.concat([Buffer.from([1]), ek])).digest();

// Independent paper-style derivation (kL as raw bytes, integer arithmetic), parameterized by reduce
function derive(kLb, kRb, ccb, index, reduce) {
  const ser = Buffer.alloc(4); ser.writeUInt32LE(index >>> 0, 0);
  const hardened = ((index >>> 0) & 0x80000000) !== 0;
  const pkBytes = Buffer.from(ed25519.ExtendedPoint.BASE.multiply(leInt(kLb) % L).toRawBytes());
  const zData = hardened ? Buffer.concat([Buffer.from([0]), kLb, ser]) : Buffer.concat([Buffer.from([2]), pkBytes, ser]);
  const iData = hardened ? Buffer.concat([Buffer.from([1]), kLb, ser]) : Buffer.concat([Buffer.from([3]), pkBytes, ser]);
  const z = createHmac('sha512', ccb).update(zData).digest();
  const i = createHmac('sha512', ccb).update(iData).digest();
  const t = 8n * leInt(z.subarray(0, 28));
  let skNew = leInt(kLb) + t; if (reduce) skNew = skNew % L;
  const kRnew = (beInt(kRb) + beInt(z.subarray(32))) % (2n ** 256n);
  return { kL: leBuf(skNew, skNew > 2n ** 256n ? 33 : 32).subarray(0, 32), kLint: skNew,
           kR: Buffer.from(kRnew.toString(16).padStart(64, '0'), 'hex'), cc: i.subarray(32) };
}
const H = 0x80000000;
for (const reduce of [true, false]) {
  let s = { kL, kR, cc };
  s = derive(s.kL, s.kR, s.cc, H + 0, reduce);
  s = derive(s.kL, s.kR, s.cc, H + 1, reduce);
  const pub = Buffer.from(ed25519.ExtendedPoint.BASE.multiply(s.kLint % L).toRawBytes()).toString('hex');
  console.log(`paper-impl reduce=${reduce}  m/0H/1H pub: ${pub}  (kL ${reduce ? '' : 'un'}reduced feeds 2nd HMAC)`);
}
(async () => {
  const tree = await Ed25519Bip32HdTree.initialize();
  const root = { pk: leInt(Buffer.from(ed25519.ExtendedPoint.BASE.multiply(leInt(kL) % L).toRawBytes())),
                 sk: leInt(kL), prefix: beInt(kR), chaincode: beInt(cc) };
  const child = tree.privateDerive(root, `m/${H}/${H + 1}`);
  console.log(`SDK Ed25519Bip32HdTree  m/0H/1H pub: ${leBuf(child.pk, 32).toString('hex')}`);
})();
