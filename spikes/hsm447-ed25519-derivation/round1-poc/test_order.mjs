// Ed25519 actual prime subgroup order l
const l = BigInt('0x1000000000000000000000000000000014def9dea2f79cd65812631a5cf5d3ed');
// What Ed25519Curve.order() returns: l * 8
const returned_order = l * 8n;
const expected_l = l;

console.log('Ed25519Curve.order() returns:', returned_order.toString(16));
console.log('Actual subgroup order l:      ', l.toString(16));
console.log('Are they equal?', returned_order === expected_l);
console.log('Ratio:', returned_order / l);

// This order() value is ONLY used in rangeproof.ts for ECDSA (secp256k1), not Ed25519 arithmetic.
// So the "wrong" value doesn't affect Ed25519 derivation. But it WOULD be wrong if used
// for ed25519 scalar operations.

// For BIP32-Ed25519: the scalar after derivation is (parent_sk + t) reduced by libsodium mod l
// libsodium uses l, not 8*l, as the modulus. So no issue in practice for derivation.

// BUT: the deep-path scalar overflow concern is real
// After many derivations, the accumulated scalar could be in [0, l) (mod-l reduced)
// The BIP32-Ed25519 paper's validity condition (kl != 0 mod l) must hold
// With scalarAdd mod l, if kl + t = 0 (mod l), the child key is the identity point (insecure)
// Probability: ~1/l ≈ 2^-252 per derivation step - negligible for practical depths
console.log('\nZero-scalar probability per depth: ~1/l ≈ 2^-252 (negligible)');

// The real LE/BE encoding concern in serialization:
// sk is stored as bigint, bigIntToBufferLE(sk, 32) = LE encoding
// prefix is stored as bigint, bigIntToBufferBE(prefix, 32) = BE? 
// Wait - let's check the actual code
// In privateDerive:
//   const right = (prefix + bigIntFromBufferBE(zr)) % chaincodeBase;
// zr = zout.slice(32) where zout = HMAC-SHA512 output (bytes in standard BE order)
// So zr is bytes; bigIntFromBufferBE(zr) treats them as big-endian
// The prefix (right half of private key) is accumulated mod 2^256
// But how is it originally initialized from the seed?
// That's in the parent-key creation path, not derivation
console.log('\nPrefix (right half): accumulated mod 2^256, treated as BE bigint');
console.log('sk (left half): accumulated mod l via scalarAdd, treated as LE bigint');
console.log('Encoding asymmetry: sk uses LE, prefix uses BE - must be consistent in serialization');
