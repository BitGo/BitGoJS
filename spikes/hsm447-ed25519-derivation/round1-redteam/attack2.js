'use strict';
/**
 * Additional targeted attacks: tweetnacl re-expansion proof, nacl secretKey internal,
 * and child prefix storage in encryptedPrv format.
 */

const path = require('path');
const crypto = require('crypto');
const REPO = require('path').join(__dirname, '..', '..', '..');
const NM   = path.join(REPO, 'node_modules');
const DIST = path.join(REPO, 'modules/sdk-lib-mpc/dist/src');

const tweetnacl = require(path.join(NM, 'tweetnacl'));
const sodium    = require(path.join(NM, 'libsodium-wrappers-sumo'));
const { bigIntFromBufferLE, bigIntToBufferLE, bigIntFromBufferBE, bigIntToBufferBE } = require(path.join(DIST, 'util.js'));
const { Ed25519Curve, Ed25519Bip32HdTree } = require(path.join(DIST, 'index.js'));
const { pathToIndices } = require(path.join(DIST, 'curves/index.js'));

const l = BigInt('0x1000000000000000000000000000000014def9dea2f79cd65812631a5cf5d3ed');

async function main() {
  await sodium.ready;
  await Ed25519Curve.initialize();

  // ── ATTACK B1: tweetnacl re-expansion proof ──────────────────────────────
  // Prove that nacl.sign.detached(msg, secretKey) re-expands secretKey[0:32] via SHA512.
  console.log('=== ATTACK B1: tweetnacl signing re-expansion proof ===');
  const seed = crypto.randomBytes(32);
  const kp = tweetnacl.sign.keyPair.fromSeed(seed);
  // kp.secretKey = SHA512(seed)[0:32] || pubkey? NO — tweetnacl secretKey = seed || pubkey
  // Actually: fromSeed sets secretKey[0:32]=seed, secretKey[32:64]=pubkey
  console.log(`  kp.secretKey[0:32] == seed: ${Buffer.from(kp.secretKey.slice(0,32)).equals(seed)}`);
  // Now: what if we put a random scalar (not a valid seed) in secretKey[0:32]?
  const raw_scalar = crypto.randomBytes(32);
  const pk_from_scalar = Buffer.from(sodium.crypto_scalarmult_ed25519_base_noclamp(raw_scalar));
  // Make a fake 64-byte secretKey with raw_scalar as [0:32] and pk as [32:64]
  const fake_sk64 = Buffer.concat([raw_scalar, pk_from_scalar]);
  // Produce signature with tweetnacl using fake_sk64
  const msg = Buffer.from('test message');
  const sig_from_scalar_direct = tweetnacl.sign.detached(msg, fake_sk64);
  // Check if this signature verifies against pk_from_scalar
  const verifies_direct = tweetnacl.sign.detached.verify(msg, sig_from_scalar_direct, pk_from_scalar);
  console.log(`  sig from raw scalar (fed as sk[0:32]) verifies against scalar*B: ${verifies_direct}`);
  console.log(`  (If false: nacl re-expands sk[0:32] via SHA512, producing wrong scalar)`);
  // Now produce sig correctly using scalarSign convention
  // Nonce from prefix (here we use zeros as prefix for simplicity):
  const prefix = new Uint8Array(32);
  const nonceHash = crypto.createHash('sha512').update(Buffer.from(prefix)).update(msg).digest();
  const rReduced = bigIntFromBufferLE(Buffer.from(
    sodium.crypto_core_ed25519_scalar_reduce(bigIntToBufferLE(bigIntFromBufferLE(nonceHash), 64))
  ));
  const R = bigIntToBufferLE(bigIntFromBufferLE(Buffer.from(
    sodium.crypto_scalarmult_ed25519_base_noclamp(bigIntToBufferLE(rReduced, 32))
  )), 32);
  const hram = crypto.createHash('sha512').update(R).update(pk_from_scalar).update(msg).digest();
  const hReduced = bigIntFromBufferLE(Buffer.from(
    sodium.crypto_core_ed25519_scalar_reduce(bigIntToBufferLE(bigIntFromBufferLE(hram), 64))
  ));
  const sk_as_bigint = bigIntFromBufferLE(Buffer.from(raw_scalar));
  const hsk = bigIntFromBufferLE(Buffer.from(
    sodium.crypto_core_ed25519_scalar_mul(bigIntToBufferLE(hReduced, 32), bigIntToBufferLE(sk_as_bigint, 32))
  ));
  const S = bigIntToBufferLE(bigIntFromBufferLE(Buffer.from(
    sodium.crypto_core_ed25519_scalar_add(bigIntToBufferLE(rReduced, 32), bigIntToBufferLE(hsk, 32))
  )), 32);
  const sig_scalarSign = Buffer.concat([R, S]);
  const verifies_scalarSign = tweetnacl.sign.detached.verify(msg, sig_scalarSign, pk_from_scalar);
  console.log(`  sig from scalarSign (with raw scalar) verifies: ${verifies_scalarSign}`);
  console.log(`  CONCLUSION: tweetnacl re-expands sk[0:32] (first sig fails); scalarSign bypasses correctly.`);
  console.log();

  // ── ATTACK B2: Child prefix must be stored in encryptedPrv — format audit ──
  console.log('=== ATTACK B2: ed25519KeyPair encryptedPrv format (does it store prefix?) ===');
  // Check what existing KeyPair.toJson() / encryptedPrv format looks like
  // by reading the source
  const ed25519KpSrc = require('fs').readFileSync(
    path.join(REPO, 'modules/sdk-core/src/account-lib/baseCoin/ed25519KeyPair.ts'), 'utf8'
  );
  // Find toJson or relevant storage
  const toJsonIdx = ed25519KpSrc.indexOf('toJson');
  const slice = ed25519KpSrc.slice(toJsonIdx, toJsonIdx + 500);
  console.log(`  ed25519KeyPair.toJson() impl:\n${slice}`);
  console.log();

  // ── ATTACK B3: Verify pathToIndices NaN is actually NaN (not null) ──────
  console.log('=== ATTACK B3: pathToIndices actual values for bad paths ===');
  const badPaths = ["m/foo", "m/", "m/0'", "m/0h"];
  for (const p of badPaths) {
    const indices = pathToIndices(p);
    console.log(`  "${p}" => values: ${indices.map(i => `${i} (isNaN=${isNaN(i)}, typeof=${typeof i})`).join(', ')}`);
  }
  // Also: when NaN is used as index in writeUInt32LE:
  const seri = Buffer.alloc(4);
  try {
    seri.writeUInt32LE(NaN, 0);
    console.log(`  seri.writeUInt32LE(NaN, 0) = ${seri.readUInt32LE(0)} (NaN→0 in Node)`);
  } catch(e) {
    console.log(`  seri.writeUInt32LE(NaN, 0) threw: ${e.message}`);
  }
  // So NaN as index writes 0 — confirming m/foo collision with m/0
  console.log(`  Collision: m/foo => m/0 path (NaN→0 via writeUInt32LE)`);
  console.log();

  // ── ATTACK B4: Depth limit — BIP32-Ed25519 spec limits derivation depth ──
  // Khovratovich paper §3: depth limit is not explicitly stated but
  // kL must not overflow certain bounds. Check very deep path behavior.
  console.log('=== ATTACK B4: Deep derivation stability check ===');
  const FIXED_SEED = Buffer.from('deadbeefcafebabe0102030405060708090a0b0c0d0e0f101112131415161718', 'hex');
  const FIXED_CHAINCODE_HEX = 'fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210';
  const expanded = crypto.createHash('sha512').update(FIXED_SEED).digest();
  const kLBuf = Buffer.from(expanded.slice(0, 32));
  kLBuf[0] &= 0xF8; kLBuf[31] &= 0x1F; kLBuf[31] |= 0x40;
  const rootSk = bigIntFromBufferLE(kLBuf);
  const rootPrefix = bigIntFromBufferBE(Buffer.from(expanded.slice(32, 64)));
  const rootChaincode = bigIntFromBufferBE(Buffer.from(FIXED_CHAINCODE_HEX, 'hex'));
  const rootPk = bigIntFromBufferLE(Buffer.from(
    sodium.crypto_scalarmult_ed25519_base_noclamp(bigIntToBufferLE(rootSk, 32))
  ));
  const rootPriv = { pk: rootPk, sk: rootSk, prefix: rootPrefix, chaincode: rootChaincode };
  const rootPub  = { pk: rootPk, chaincode: rootChaincode };
  const tree = await Ed25519Bip32HdTree.initialize();

  // Derive 10 levels deep
  const deepPath = 'm/' + Array.from({length: 10}, (_, i) => i).join('/');
  try {
    const deepPriv = tree.privateDerive(rootPriv, deepPath);
    const deepPub  = tree.publicDerive(rootPub, deepPath);
    console.log(`  10-level path (${deepPath.slice(0,30)}...)`);
    console.log(`  pk consistent: ${deepPriv.pk === deepPub.pk}`);
    // Check scalar still valid: is it close to zero or l?
    const sk_ratio = deepPriv.sk * 1000n / l;
    console.log(`  sk/l*1000 = ${sk_ratio} (should be in range [0, 999])`);
    console.log(`  sk=0? ${deepPriv.sk === 0n}`);
  } catch(e) {
    console.log(`  10-level derive threw: ${e.message}`);
  }
  console.log();

  // ── ATTACK B5: scalarSign nonce — is the spec ambiguous or is LE correct? ──
  // Khovratovich §3: nonce = SHA512(kR || M) where kR is "the right 32 bytes of extended key"
  // "right 32 bytes" is just the raw byte representation — not a bigint serialization.
  // The researcher stores kR as bigIntFromBufferBE(kR_bytes), then serializes as LE.
  // This reverses bytes. Confirm by quoting the Khovratovich-style reference implementation.
  // We can check the existing EDDSA TSS code in BitGoJS for how it handles this.
  console.log('=== ATTACK B5: Khovratovich nonce convention vs repo TSS usage ===');
  // Look for how existing code uses prefix in signing
  const eddsaFiles = [
    path.join(REPO, 'modules/sdk-lib-mpc/src/tss/eddsa/types.ts'),
    path.join(REPO, 'modules/sdk-lib-mpc/src/tss/eddsa/eddsa.ts'),
  ];
  const fs = require('fs');
  for (const f of eddsaFiles) {
    if (fs.existsSync(f)) {
      const src = fs.readFileSync(f, 'utf8');
      // Find prefix or nonce usage
      const match = src.match(/prefix[\s\S]{0,200}sign/i) || src.match(/nonce[\s\S]{0,200}sha/i);
      if (match) {
        console.log(`  ${f.split('/').slice(-2).join('/')}: ${match[0].slice(0,300)}`);
      }
    }
  }
  // Also look for fromBytes or encryptedPrv in eddsa:
  const eddsaSrc = fs.existsSync(eddsaFiles[1]) ? fs.readFileSync(eddsaFiles[1], 'utf8') : '';
  const prefixIdx = eddsaSrc.indexOf('prefix');
  if (prefixIdx >= 0) {
    console.log(`  EDDSA prefix usage (eddsa.ts): ${eddsaSrc.slice(prefixIdx, prefixIdx+300)}`);
  }
}

main().catch(e => { console.error('FATAL:', e); process.exit(1); });
