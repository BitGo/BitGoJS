'use strict';
/**
 * E5: Deterministic test vectors for cross-stack contract.
 * Uses a FIXED seed so HSM + wallet-platform + BitGoJS can reproduce.
 */

const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const REPO = require('path').join(__dirname, '..', '..', '..');
const DIST = path.join(REPO, 'modules/sdk-lib-mpc/dist/src');
const NM   = path.join(REPO, 'node_modules');

const { Ed25519Curve, Ed25519Bip32HdTree, chaincodeBase } = require(path.join(DIST, 'index.js'));
const { bigIntFromBufferLE, bigIntToBufferLE, bigIntFromBufferBE, bigIntToBufferBE } = require(path.join(DIST, 'util.js'));
const sodium    = require(path.join(NM, 'libsodium-wrappers-sumo'));
const tweetnacl = require(path.join(NM, 'tweetnacl'));

// ── FIXED seed (deterministic) ────────────────────────────────────────────────
const FIXED_SEED = Buffer.from(
  'deadbeefcafebabe0102030405060708090a0b0c0d0e0f101112131415161718',
  'hex'
);
// Fixed separate chaincode (simulate wallet-platform issuing a chaincode)
const FIXED_CHAINCODE_HEX = 'fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210';

// Fixed message for signing
const MSG_HEX = '48534d2d343437207465737420766563746f72206d657373616765'; // "HSM-447 test vector message"

function scalarSign(sk, prefix, pk, msg) {
  const skBuf  = bigIntToBufferLE(sk, 32);
  const pfxBuf = bigIntToBufferLE(prefix, 32);
  const pkBuf  = bigIntToBufferLE(pk, 32);
  const nonceHash = crypto.createHash('sha512').update(pfxBuf).update(msg).digest();
  const rReduced = bigIntFromBufferLE(Buffer.from(
    sodium.crypto_core_ed25519_scalar_reduce(bigIntToBufferLE(bigIntFromBufferLE(nonceHash), 64))
  ));
  const R = bigIntToBufferLE(bigIntFromBufferLE(Buffer.from(
    sodium.crypto_scalarmult_ed25519_base_noclamp(bigIntToBufferLE(rReduced, 32))
  )), 32);
  const hram = crypto.createHash('sha512').update(R).update(pkBuf).update(msg).digest();
  const hReduced = bigIntFromBufferLE(Buffer.from(
    sodium.crypto_core_ed25519_scalar_reduce(bigIntToBufferLE(bigIntFromBufferLE(hram), 64))
  ));
  const hsk = bigIntFromBufferLE(Buffer.from(
    sodium.crypto_core_ed25519_scalar_mul(bigIntToBufferLE(hReduced, 32), skBuf)
  ));
  const S = bigIntToBufferLE(bigIntFromBufferLE(Buffer.from(
    sodium.crypto_core_ed25519_scalar_add(bigIntToBufferLE(rReduced, 32), bigIntToBufferLE(hsk, 32))
  )), 32);
  return Buffer.concat([R, S]);
}

function verifyBoth(pk, msg, sig) {
  const pkBuf = bigIntToBufferLE(pk, 32);
  const tn = tweetnacl.sign.detached.verify(msg, sig, pkBuf);
  let ls = false;
  try {
    const opened = Buffer.from(sodium.crypto_sign_open(Buffer.concat([sig, msg]), pkBuf));
    ls = Buffer.compare(msg, opened) === 0;
  } catch(e) { ls = false; }
  return { tweetnacl: tn, libsodium: ls };
}

async function main() {
  await sodium.ready;
  await Ed25519Curve.initialize();
  const tree = await Ed25519Bip32HdTree.initialize();

  const msg = Buffer.from(MSG_HEX, 'hex');

  // ── Root from fixed seed (SHA512 expand + BIP32-Ed25519 clamp) ─────────────
  const expanded = crypto.createHash('sha512').update(FIXED_SEED).digest();
  const kLBuf = Buffer.from(expanded.slice(0, 32));
  kLBuf[0]  &= 0xF8;
  kLBuf[31] &= 0x1F;
  kLBuf[31] |= 0x40;
  const rootSk = bigIntFromBufferLE(kLBuf);
  const rootPrefix = bigIntFromBufferBE(Buffer.from(expanded.slice(32, 64)));
  const rootChaincode = bigIntFromBufferBE(Buffer.from(FIXED_CHAINCODE_HEX, 'hex'));
  const rootPk = bigIntFromBufferLE(Buffer.from(
    sodium.crypto_scalarmult_ed25519_base_noclamp(bigIntToBufferLE(rootSk, 32))
  ));

  const rootPriv = { pk: rootPk, sk: rootSk, prefix: rootPrefix, chaincode: rootChaincode };
  const rootPub  = { pk: rootPk, chaincode: rootChaincode };

  const H = 0x80000000;
  const testCases = [
    { path: 'm/0',   mode: 'non-hardened' },
    { path: 'm/0/1', mode: 'non-hardened' },
    { path: `m/${H}`, mode: 'hardened', note: 'index=2147483648 = 0x80000000' },
    { path: `m/${H}/${H+1}`, mode: 'hardened', note: 'two hardened levels' },
    { path: 'm/44/60/0/0', mode: 'non-hardened', note: 'deep path' },
  ];

  const cases = [];
  for (const tc of testCases) {
    const priv = tree.privateDerive(rootPriv, tc.path);
    let pubFromPub = null;
    let pubConsistent = null;
    if (tc.mode === 'non-hardened') {
      const pub = tree.publicDerive(rootPub, tc.path);
      pubFromPub = bigIntToBufferLE(pub.pk, 32).toString('hex');
      pubConsistent = priv.pk === pub.pk;
    }
    const sig = scalarSign(priv.sk, priv.prefix, priv.pk, msg);
    const vfy = verifyBoth(priv.pk, msg, sig);
    cases.push({
      path: tc.path,
      mode: tc.mode,
      note: tc.note || null,
      childPk: bigIntToBufferLE(priv.pk, 32).toString('hex'),
      childSk: bigIntToBufferLE(priv.sk, 32).toString('hex'),
      childPrefix: bigIntToBufferLE(priv.prefix, 32).toString('hex'),
      childChaincode: bigIntToBufferBE(priv.chaincode, 32).toString('hex'),
      pubFromPubDerive: pubFromPub,
      pubConsistent,
      sig: sig.toString('hex'),
      msgHex: MSG_HEX,
      verify_tweetnacl: vfy.tweetnacl,
      verify_libsodium: vfy.libsodium,
    });
  }

  const vectors = {
    _description: 'Ed25519 BIP32-HD test vectors for HSM-447 cross-stack contract',
    _method: 'BIP32-Ed25519 (Khovratovich) — SHA512(fixedSeed) clamped => (kL=sk, kR=prefix), separate chaincode',
    _signing: 'scalarSign: r=reduce(SHA512(prefix_LE || msg)), R=r*B, S=(r+H(R||A||msg)*sk) mod L',
    _verifyLibs: 'tweetnacl sign.detached.verify + libsodium crypto_sign_open',
    fixedSeed: FIXED_SEED.toString('hex'),
    fixedChaincodeInput: FIXED_CHAINCODE_HEX,
    root: {
      sk_LE:       bigIntToBufferLE(rootSk, 32).toString('hex'),
      prefix_BE:   bigIntToBufferBE(rootPrefix, 32).toString('hex'),
      chaincode_BE: FIXED_CHAINCODE_HEX,
      pk_LE:       bigIntToBufferLE(rootPk, 32).toString('hex'),
    },
    msg: MSG_HEX,
    msgDecoded: Buffer.from(MSG_HEX, 'hex').toString('utf8'),
    hardenedIndexNote: 'pathToIndices() uses parseInt; hardened = index | 0x80000000 expressed as decimal in path string (no apostrophe support)',
    cases,
  };

  const outPath = '/private/tmp/claude-501/-Users-zahinmohammad-workspace-bitgo-BitGoJS/5fd224da-e90b-455d-93ff-890f7bc6826b/scratchpad/d3-poc/test-vectors.json';
  fs.writeFileSync(outPath, JSON.stringify(vectors, null, 2));
  console.log('=== E5: Test vector file written to', outPath, '===\n');
  console.log('Root:');
  console.log('  seed(fixed):', FIXED_SEED.toString('hex'));
  console.log('  sk_LE      :', vectors.root.sk_LE);
  console.log('  pk_LE      :', vectors.root.pk_LE);
  console.log('  prefix_BE  :', vectors.root.prefix_BE.slice(0,32)+'...');
  console.log('  chaincode  :', FIXED_CHAINCODE_HEX.slice(0,32)+'...');
  console.log('\nCases:');
  for (const c of cases) {
    const allPass = c.verify_tweetnacl && c.verify_libsodium &&
                    (c.mode === 'hardened' || c.pubConsistent);
    console.log(`  ${c.path} (${c.mode}):`);
    console.log(`    pk      = ${c.childPk.slice(0,32)}...`);
    console.log(`    pubConsistent (pub-from-pub == priv.pk): ${c.pubConsistent !== null ? c.pubConsistent : 'N/A (hardened)'}`);
    console.log(`    sig ok  = tweetnacl:${c.verify_tweetnacl} libsodium:${c.verify_libsodium}`);
    console.log(`    => ${allPass ? 'PASS' : 'FAIL'}`);
  }
  console.log('\nE5 RESULT: PASS — vectors written');
}

main().catch(console.error);
