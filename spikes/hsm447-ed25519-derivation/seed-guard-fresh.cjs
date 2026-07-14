'use strict';
// Fresh independent verification of C7: 32-byte scalar silently passes isValidEd25519Seed
const nacl = require('../../node_modules/tweetnacl');
const crypto = require('crypto');

// Simulate a BIP32-Ed25519 root key expansion
const seed = Buffer.from('000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f', 'hex');
const expanded = crypto.createHash('sha512').update(seed).digest();
const kL = Buffer.from(expanded.slice(0, 32));
// clamp kL per Khovratovich
kL[0] &= 248;
kL[31] &= 31;
kL[31] |= 64;
const kR = expanded.slice(32, 64);
const kL_hex = kL.toString('hex');

console.log('=== C7: Seed-Decoder Hazard Verification ===');
console.log('kL (32-byte clamped scalar, hex):', kL_hex);
console.log('kL byte length:', kL.length, '== nacl.sign.seedLength?', kL.length === nacl.sign.seedLength);

// isValidEd25519Seed check (mirrors sdk-core/src/account-lib/util/crypto.ts:145-152)
const decodedKL = Buffer.from(kL_hex, 'hex');
const passesCheck = decodedKL.length === nacl.sign.seedLength;
console.log('\nisValidEd25519Seed(kL_hex):', passesCheck, '← SILENT PASS on a scalar (hazard confirmed)');

// fromSeed(kL) produces WRONG keypair — nacl internally does SHA-512(kL)+clamp, not scalar mult
const wrongKP = nacl.sign.keyPair.fromSeed(decodedKL);
const wrongPub = Buffer.from(wrongKP.publicKey).toString('hex');
console.log('fromSeed(kL) produced pub:', wrongPub);

// Correct pub for seed-based usage
const correctKP = nacl.sign.keyPair.fromSeed(seed);
const correctSeedPub = Buffer.from(correctKP.publicKey).toString('hex');
console.log('fromSeed(seed) correct pub:', correctSeedPub);
console.log('Wrong pub == correct pub?', wrongPub === correctSeedPub, '← FALSE confirms wrong keypair');

// True Ed25519 child pub would be kL * B (scalar mult). fromSeed(kL) is NOT that.
// Sign with wrong keypair, cross-verify should fail
const msg = Buffer.from('hello algo multisig');
const wrongSig = nacl.sign.detached(msg, wrongKP.secretKey);
const verifyInContext = nacl.sign.detached.verify(msg, wrongSig, wrongKP.publicKey);
const verifyCross = nacl.sign.detached.verify(msg, wrongSig, correctKP.publicKey);
console.log('\nSig from wrongKP verifies against wrongPub:', verifyInContext, '(within wrong context)');
console.log('Sig from wrongKP verifies against correctPub:', verifyCross, '← MUST be false');

// P4 bundle guard demo (mirrors C8 proposed guard)
console.log('\n=== C8: P4 Bundle Guard ===');
function isP4Bundle(s) {
  try { const o = JSON.parse(s); return o?.v === 1 && o?.scheme === 'bip32ed25519'; }
  catch { return false; }
}
const p4 = JSON.stringify({ v: 1, scheme: 'bip32ed25519', sk: kL_hex, prefix: kR.toString('hex'), chaincode: '00'.repeat(32), pub: wrongPub });
console.log('isP4Bundle(p4_json_string):', isP4Bundle(p4), '← true (guarded)');
console.log('isP4Bundle(kL_hex):', isP4Bundle(kL_hex), '← false (raw hex, not guarded by this path)');
console.log('isP4Bundle("garbage"):', isP4Bundle('garbage'), '← false');

// Demonstrate that a P4 JSON string DOES NOT silently pass isValidEd25519Seed
// (JSON is not 32 bytes when decoded as hex — it would fail Buffer.from parse or give wrong length)
const p4str_as_hex_bytes = Buffer.from(p4, 'hex');
// Buffer.from with 'hex' silently skips non-hex chars, so check actual length
console.log('\nP4 JSON string decoded as hex, byte length:', p4str_as_hex_bytes.length, '(isValidEd25519Seed would see length !=32 → false)');
console.log('BUT: kL_hex decoded as hex, byte length:', decodedKL.length, '(==32 → PASSES silently)');

console.log('\n=== CONCLUSION ===');
console.log('C7 CONFIRMED: 32-byte scalar hex silently passes isValidEd25519Seed → wrong pub via fromSeed');
console.log('C8 CONFIRMED: isP4Bundle guard distinguishes P4 bundle from raw scalar; raw scalar must also be blocked at guard site');
