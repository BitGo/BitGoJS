import { createHmac } from 'crypto';

// Simulate: given non-hardened child private key + public derivation info => parent private key
// child_sk = (parent_sk + t) mod l  where t = 8 * trunc28(zl)
// t is computable from PUBLIC info: HMAC(chaincode, 0x02 || pk_LE || index)
// So: parent_sk = (child_sk - t) mod l
// BUT parent_sk is in [2^254, 2^255) (after clamping), not in [0, l)
// We need: parent_sk = (child_sk - t + k*l) for smallest k s.t. result in [2^254, 2^255)

const l = BigInt('0x1000000000000000000000000000000014def9dea2f79cd65812631a5cf5d3ed');

// Simulate: if parent_sk_original = 2^254 + 12345 (a clamped key in range)
const parent_sk_original = (1n << 254n) | 12345n;
const t = 8n * (1n << 100n);  // some derivation addend

// what scalarAdd does: (parent_sk + t) mod l
const child_sk_reduced = (parent_sk_original + t) % l;

// Attacker knows: child_sk_reduced, t (from public info)
// Reconstruct: candidate = (child_sk_reduced - t + k*l) for k=0,1,2,...
// Check which k puts candidate in [2^254, 2^255)
for (let k = 0n; k <= 8n; k++) {
  const candidate = ((child_sk_reduced - t) % l + l + k * l) % (1n << 255n);
  if (candidate === parent_sk_original) {
    console.log(`PARENT PRIVATE KEY RECOVERED at k=${k}: 0x${candidate.toString(16).slice(0,16)}...`);
    console.log(`Attack: non-hardened child_sk + public t => parent_sk`);
    console.log(`This is expected BIP32 behavior - non-hardened child prv LEAKS parent prv`);
    break;
  }
}

// For FR-13: is this attack relevant?
// Non-hardened wallets minted from user root: the USER already has the root prv.
// An INVITEE receiving non-hardened child prv + knowing the chaincode/pubkey/index
// can recover the user's root private key.
// But in FR-13, the invitee receives the child prv via ECDH re-encryption,
// AND knows the public derivation info (chaincode and index are on the Key doc).
console.log('\nFR-13 key leak scenario:');
console.log('If invitee gets non-hardened child prv + has access to Key.derivedFromParentWithSeed');
console.log('+ knows parent chaincode + knows parent pub => RECOVERS USER ROOT PRIVATE KEY');
console.log('This is the standard BIP32 non-hardened child-prv leak property.');
console.log('The design must ensure invitees only get HARDENED children (FR-13 constraint).');
