/**
 * HSM-447 — Does hardened vs non-hardened (soft) derivation at the SAME index
 * produce the SAME address for ECDSA / secp256k1 (e.g. Ethereum MPC)?
 *
 * Answered with the exact Secp256k1Bip32HdTree BitGo uses; ECDSA MPC derives
 * addresses via Ecdsa.deriveUnhardened -> publicDerive (same tree). So this result
 * holds for ETH MPC too. Conclusion mirrors ed25519: hardened != soft => different
 * address. It is a curve-INDEPENDENT BIP32 property (different HMAC domain input:
 * 0x00||privkey for hardened vs the compressed pubkey for soft).
 *
 * Run: node hard-vs-soft-eth-address.cjs
 */
const { Secp256k1Bip32HdTree } = require('../../modules/sdk-lib-mpc/dist/src/curves/secp256k1Bip32HdTree');
const { bigIntFromBufferBE, bigIntToBufferBE } = require('../../modules/sdk-lib-mpc/dist/src/util');
const { secp256k1 } = require('../../node_modules/@noble/curves/secp256k1');
const { keccak_256 } = require('../../node_modules/@noble/hashes/sha3');
const { randomBytes } = require('crypto');

const HARDENED = 0x80000000;

// ETH address = last 20 bytes of keccak256(uncompressed_pubkey[1:65]), 0x-prefixed hex.
function ethAddr(pkCompressedBigInt) {
  const compressed = bigIntToBufferBE(pkCompressedBigInt, 33);
  const point = secp256k1.ProjectivePoint.fromHex(compressed.toString('hex'));
  const uncompressed = point.toRawBytes(false); // 65 bytes: 0x04 || X || Y
  const hash = keccak_256(uncompressed.slice(1)); // hash X||Y
  return '0x' + Buffer.from(hash.slice(-20)).toString('hex');
}

const tree = new Secp256k1Bip32HdTree();

// Root secp256k1 keychain (fixed seed for determinism)
const sk = bigIntFromBufferBE(Buffer.from('1122334455667788990011223344556677889900112233445566778899001122', 'hex'));
const compressedRootPub = secp256k1.getPublicKey(bigIntToBufferBE(sk, 32), true);
const rootPub = bigIntFromBufferBE(Buffer.from(compressedRootPub));
const chaincode = bigIntFromBufferBE(Buffer.from('fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210', 'hex'));

console.log('Root ECDSA key (the safe user root)');
console.log('  eth addr:', ethAddr(rootPub));
console.log();

const priv = { pk: rootPub, sk, chaincode };
const softChild = tree.privateDerive(priv, 'm/0');
const hardChild = tree.privateDerive(priv, `m/${HARDENED + 0}`);
const softPublicOnly = tree.publicDerive({ pk: rootPub, chaincode }, 'm/0');

console.log('SOFT (non-hardened) derive at index 0  — used for MINTING / address gen');
console.log('  eth addr:', ethAddr(softChild.pk));
console.log('  reachable by PUBLIC derive (no secret)?', softPublicOnly.pk === softChild.pk ? 'YES' : 'NO');
console.log();
console.log("HARD (hardened) derive at index 0'    — would be used for SHARING");
console.log('  eth addr:', ethAddr(hardChild.pk));
let hardPublicFails = false;
try { tree.publicDerive({ pk: rootPub, chaincode }, `m/${HARDENED + 0}`); } catch (e) { hardPublicFails = true; }
console.log('  reachable by PUBLIC derive (no secret)?', hardPublicFails ? 'NO (needs the private key)' : 'YES');
console.log();

console.log('=== RESULT ===');
console.log('SOFT eth address == HARD eth address at the same index?',
  ethAddr(softChild.pk) === ethAddr(hardChild.pk) ? 'YES' : 'NO');
console.log('(Curve-independent BIP32 property. ECDSA MPC address derivation calls the');
console.log(' SAME publicDerive, so this holds for ETH MPC exactly as for ed25519.)');
