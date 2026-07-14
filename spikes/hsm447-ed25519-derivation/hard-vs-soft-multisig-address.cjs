/**
 * HSM-447 — ECDSA on-chain MULTISIG case (BTC, ETH-classic, XRP, TRX, ...).
 * Does hardened vs non-hardened (soft) derivation at the same path produce the
 * same address? Uses the standard BIP32 library that BitGo multisig derivation
 * uses (bip32.derivePath / deriveKeyWithSeedBip32) — NOT the MPC tree.
 *
 * Unlike ed25519, secp256k1 multisig is the canonical BIP32 case: both hardened
 * and non-hardened derivation are supported natively and in production. This test
 * only demonstrates the same-address question; the answer matches every other
 * curve/scheme: hard != soft.
 *
 * Run: node hard-vs-soft-multisig-address.cjs
 */
const { bip32 } = require('../../node_modules/@bitgo/utxo-lib');
const utxolib = require('../../node_modules/@bitgo/utxo-lib');
const { keccak_256 } = require('../../node_modules/@noble/hashes/sha3');

function ethAddr(node) {
  // ETH address = last 20 bytes of keccak256(uncompressed_pubkey[1:65])
  const uncompressed = node.publicKey.length === 65
    ? node.publicKey
    : Buffer.from(require('../../node_modules/@noble/curves/secp256k1').secp256k1.ProjectivePoint.fromHex(node.publicKey.toString('hex')).toRawBytes(false));
  return '0x' + Buffer.from(keccak_256(uncompressed.slice(1))).slice(-20).toString('hex');
}
function btcAddr(node) {
  try {
    return utxolib.payments.p2pkh({ pubkey: node.publicKey, network: utxolib.networks.bitcoin }).address;
  } catch (e) { return '(p2pkh: ' + e.message + ')'; }
}

// A single multisig HD key (each of the 3 wallet keys is a standalone key like this).
const seed = Buffer.from('00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff', 'hex');
const root = bip32.fromSeed(seed, utxolib.networks.bitcoin);

const soft = root.derivePath("m/0");   // non-hardened — how receive addresses derive
const hard = root.derivePath("m/0'");  // hardened — needs the private key

console.log('Root multisig key xpub:', root.neutered().toBase58().slice(0, 24) + '...');
console.log();
console.log('SOFT (non-hardened) m/0');
console.log('  pubkey:', soft.publicKey.toString('hex'));
console.log('  btc   :', btcAddr(soft));
console.log('  eth   :', ethAddr(soft));
console.log('  reachable from the xpub alone (no secret)?',
  (() => { try { return root.neutered().derivePath('m/0').publicKey.equals(soft.publicKey) ? 'YES' : 'NO'; } catch { return 'NO'; } })());
console.log();
console.log("HARD (hardened) m/0'");
console.log('  pubkey:', hard.publicKey.toString('hex'));
console.log('  btc   :', btcAddr(hard));
console.log('  eth   :', ethAddr(hard));
console.log('  reachable from the xpub alone (no secret)?',
  (() => { try { root.neutered().derivePath("m/0'"); return 'YES'; } catch { return 'NO (throws — needs the private key)'; } })());
console.log();
console.log('=== RESULT ===');
console.log('SOFT btc == HARD btc?', btcAddr(soft) === btcAddr(hard) ? 'YES' : 'NO');
console.log('SOFT eth == HARD eth?', ethAddr(soft) === ethAddr(hard) ? 'YES' : 'NO');
console.log('(Canonical BIP32: hardened uses 0x00||privkey, soft uses the pubkey in the');
console.log(' HMAC -> different child -> different address. Both modes are natively');
console.log(' supported for secp256k1 multisig; there was never a blocker here.)');
