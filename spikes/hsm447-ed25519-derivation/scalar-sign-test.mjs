// Test: scalar-based child key vs seed-based signing incompatibility (D5-C11 attack vector)
// Demonstrate that BIP32-Ed25519 child scalar != nacl seed signing path

import { createHmac } from 'crypto';
import sodium from 'libsodium-wrappers-sumo';

await sodium.ready;

// BIP32-Ed25519 root from a 96-byte extended private key (sk || prefix || chaincode)
// Simulate: root seed = 32 bytes, generate root extended key per BIP32-Ed25519 spec
// Root extended key: H = HMAC-SHA512(Key="ed25519 seed", Data=master_seed)
// kl = H[0:32] (clamped), kr = H[32:64], chaincode = H[64:96] (but for BIP32-Ed25519, chaincode separate)

// Instead, use known-good test vectors by manual derivation
// Root scalar (kl_parent): let's use a simple value
const rootSeed = Buffer.alloc(32, 0x7a);

// Standard nacl signing from seed
const nacl_kp = sodium.crypto_sign_seed_keypair(rootSeed);
const rootPub_seed = Buffer.from(nacl_kp.publicKey).toString('hex');
const rootScalar = Buffer.from(nacl_kp.privateKey.slice(0, 32)); // This is NOT the scalar, it's the seed's SK
// Actually nacl_kp.privateKey = (64 bytes) = {SK bytes derived from seed, then pub}
// After crypto_sign_seed_keypair: privateKey = H(seed) clamped => effectively the scalar+prefix

// Let's look at what nacl actually does:
// crypto_sign_seed_keypair(seed): 
//   h = SHA-512(seed)
//   h[0] &= 248, h[31] &= 127, h[31] |= 64  (clamping)
//   kl = h[0:32] (clamped scalar), kr = h[32:64] (prefix)
//   pub = [kl]B

const h = Buffer.from(sodium.crypto_hash(rootSeed));
const kl_from_seed = Buffer.from(h.slice(0, 32));
kl_from_seed[0] &= 248;
kl_from_seed[31] &= 127;
kl_from_seed[31] |= 64;
const kr_from_seed = h.slice(32, 64);
console.log('kl from seed (clamped scalar):', kl_from_seed.toString('hex').slice(0,20) + '...');
console.log('kr from seed (prefix):', kr_from_seed.toString('hex').slice(0,20) + '...');

// BIP32-Ed25519 non-hardened derivation: compute child scalar
// Z = HMAC-SHA512(Key=chaincode, Data=0x02 || serP(pk) || ser32(0))
// child_kl = kl_parent + 8 * trunc28(Z[0:32])
// child_kr = (kr_parent + Z[32:64]) mod chaincodeBase

// Use a fake chaincode
const chaincode = Buffer.alloc(32, 0x11);
const parentPub = nacl_kp.publicKey; // 32 bytes pub

const zmac = createHmac('sha512', chaincode);
zmac.update(Buffer.from([0x02]));
zmac.update(Buffer.from(parentPub));
zmac.update(Buffer.from([0, 0, 0, 0])); // ser32(0)
const Z = zmac.digest();
const zl = Z.slice(0, 28); // trunc28(Z[0:32])
const zr = Z.slice(32);

// child_kl = kl_parent (as LE bigint) + 8 * trunc28(zl)
function fromLE(buf) {
  let r = 0n;
  for (let i = buf.length - 1; i >= 0; i--) r = (r << 8n) | BigInt(buf[i]);
  return r;
}

const kl_parent_int = fromLE(kl_from_seed);
const t = 8n * fromLE(zl);
const child_kl_int = kl_parent_int + t;

// The child public key via point addition: child_pk = parent_pk + [t]B
const t_buf = Buffer.alloc(32);
let t_tmp = t;
for (let i = 0; i < 32; i++) { t_buf[i] = Number(t_tmp & 0xFFn); t_tmp >>= 8n; }
const t_point = sodium.crypto_scalarmult_ed25519_base_noclamp(t_buf); // noclamp!
const child_pk_bip32 = sodium.crypto_core_ed25519_add(parentPub, t_point);
console.log('child pub (BIP32-Ed25519 non-hardened):', Buffer.from(child_pk_bip32).toString('hex').slice(0,20) + '...');

// Now: if we try to use child_kl as a "seed" in nacl...
const child_kl_buf = Buffer.alloc(32);
let tmp = child_kl_int;
for (let i = 0; i < 32; i++) { child_kl_buf[i] = Number(tmp & 0xFFn); tmp >>= 8n; }
const nacl_kp_from_child_scalar = sodium.crypto_sign_seed_keypair(child_kl_buf);
const child_pub_from_seed_path = Buffer.from(nacl_kp_from_child_scalar.publicKey).toString('hex');
const child_pub_bip32 = Buffer.from(child_pk_bip32).toString('hex');

console.log('');
console.log('INCOMPATIBILITY DEMO:');
console.log('BIP32-Ed25519 child pub:', child_pub_bip32.slice(0, 40) + '...');
console.log('nacl.fromSeed(child_scalar) pub:', child_pub_from_seed_path.slice(0, 40) + '...');
console.log('MATCH:', child_pub_bip32 === child_pub_from_seed_path);
console.log('');
console.log('Conclusion: feeding BIP32-Ed25519 child scalar into nacl.sign.keyPair.fromSeed');
console.log('produces a DIFFERENT public key and DIFFERENT signature => incompatible.');
