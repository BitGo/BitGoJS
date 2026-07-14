const nacl = require('tweetnacl');

// Demonstrate: BIP32-Ed25519 derived scalar stored as keyPair.prv causes HBAR sign failure
const seed = nacl.randomBytes(32);
const realKey = nacl.sign.keyPair.fromSeed(seed);
const realPub = realKey.publicKey;

const msg = Buffer.from('hello world');

// Correct case: prv = seed (32 bytes)
const secretKeyCorrect = new Uint8Array([...seed, ...realPub]);
const sigCorrect = nacl.sign.detached(msg, secretKeyCorrect);
const verifyCorrect = nacl.sign.detached.verify(msg, sigCorrect, realPub);
console.log('Correct seed-as-prv sign+verify:', verifyCorrect);  // true

// Broken case: prv = raw scalar (not a seed), using a different 32 bytes
const fakeScalar = nacl.randomBytes(32);  // random 32 bytes simulating derived scalar
const secretKeyBroken = new Uint8Array([...fakeScalar, ...realPub]);  // scalar + real pub
const sigBroken = nacl.sign.detached(msg, secretKeyBroken);
const verifyBroken = nacl.sign.detached.verify(msg, sigBroken, realPub);
console.log('Broken scalar-as-prv sign+verify against correct pub:', verifyBroken);  // false!

console.log('\nReason: nacl.sign.detached(msg, secret64) treats secret64[0..32] as SEED');
console.log('and derives the signing scalar from it via SHA-512+clamping.');
console.log('The derived scalar does NOT match real pub => signature invalid.');
console.log('\nCONCRETE FAILURE: HBAR transaction.sign() would produce unverifiable signatures');
console.log('if BIP32-Ed25519 scalar bundle is stored as keyPair.prv without adaptation.');
