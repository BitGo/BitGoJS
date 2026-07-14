// Test whether scalarAdd reduces mod l (destroying BIP32-Ed25519 range invariant)
// and whether derived child pubkey still matches derived child scalar's pubkey

// Ed25519 group order l
const l = BigInt('0x1000000000000000000000000000000014def9dea2f79cd65812631a5cf5d3ed');
// A typical BIP32-Ed25519 scalar is in [2^254, 2^255-2^21)
// e.g., kl = 2^254 (just above the minimum)
const kl_example = (1n << 254n);

// t is the derivation addend: 8 * trunc28(zl), max is 8 * (2^224 - 1)
// For worst case, use a moderate t
const t = 8n * ((1n << 200n)); // a realistic t

// scalarAdd does (kl + t) mod l
const kl_reduced = (kl_example + t) % l;

// Is kl_reduced in [2^254, 2^255)?
const in_range = kl_reduced >= (1n << 254n) && kl_reduced < (1n << 255n);
console.log(`kl (before): 0x${kl_example.toString(16).slice(0,16)}...`);
console.log(`t: 8 * 2^200 = 0x${t.toString(16).slice(0,16)}...`);
console.log(`kl + t: 0x${(kl_example+t).toString(16).slice(0,16)}...`);
console.log(`kl mod l: 0x${kl_reduced.toString(16).slice(0,16)}...`);
console.log(`l ≈ 2^252.5: 2^252 = 0x${(1n<<252n).toString(16).slice(0,16)}...`);
console.log(`child scalar in [2^254, 2^255)? ${in_range}`);
console.log(`child scalar bit length: ${kl_reduced.toString(2).length}`);

// When kl ≈ 2^254 >> l ≈ 2^252, the reduction wraps:
// (2^254 + t) mod l = 2^254 + t - k*l for smallest k s.t. result in [0, l)
// l ≈ 2^252 so kl mod l ≈ 2^254 - 4*l ≈ 2^254 - 4*2^252 = 0 (approximately)
// More precisely: 2^254 = 4 * l - rem for some rem

const rem = (1n << 254n) % l;
console.log(`\n2^254 mod l = ${rem} (= ${rem.toString(16)})`);
console.log(`This means: child scalar from scalarAdd is in [0, l), NOT [2^254, 2^255)`);
console.log(`\nSECURITY: a scalar in [0,l) IS a valid ed25519 scalar for signing.`);
console.log(`SECURITY: BIP32-Ed25519 range constraint VIOLATED (would allow parent recovery from child).`);
console.log(`\nPublic key consistency: still holds because l*G = identity,`);
console.log(`so (sk+t)*G = (sk+t mod l)*G = child_pk. Public keys match regardless.`);
