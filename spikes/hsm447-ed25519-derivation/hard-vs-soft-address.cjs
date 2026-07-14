/**
 * HSM-447 — Does hardened vs non-hardened (soft) derivation at the SAME index
 * produce the SAME address? Answered for the exact derivation tree BitGo uses.
 *
 * This is model-INDEPENDENT: BitGo's EdDSA MPC coins derive addresses via
 * Eddsa.deriveUnhardened -> Ed25519Bip32HdTree.publicDerive (the same tree used
 * here). So switching ALGO/XLM/HBAR to MPC does NOT change this result — MPC uses
 * the identical BIP32-Ed25519 derivation. Hardened and soft are different functions
 * by construction (HMAC domain byte 0x00|scalar vs 0x02|pubkey), so they yield
 * different child keys => different addresses, in BOTH the multisig and MPC models.
 *
 * Run: node hard-vs-soft-address.cjs
 */
const { Ed25519Bip32HdTree } = require('../../modules/sdk-lib-mpc/dist/src/curves/ed25519Bip32HdTree');
const { bigIntFromBufferLE, bigIntFromBufferBE, bigIntToBufferLE } = require('../../modules/sdk-lib-mpc/dist/src/util');
const { createHash } = require('crypto');

// Optional: encode ALGO addresses to make "different address" concrete.
let algosdk = null;
try { algosdk = require('../../node_modules/algosdk'); } catch (_) {
  try { algosdk = require('../../modules/sdk-coin-algo/node_modules/algosdk'); } catch (_) {}
}

const L = 2n ** 252n + 27742317777372353535851937790883648493n;
const HARDENED = 0x80000000;

function rootFromSeed(seedHex) {
  const ek = createHash('sha512').update(Buffer.from(seedHex, 'hex')).digest();
  const kL = Buffer.from(ek.subarray(0, 32));
  kL[0] &= 0xf8; kL[31] &= 0x1f; kL[31] |= 0x40; // clamp
  const kR = Buffer.from(ek.subarray(32));
  const cc = createHash('sha256').update(Buffer.concat([Buffer.from([1]), ek])).digest();
  const sk = bigIntFromBufferLE(kL) % L;
  return { sk, prefix: bigIntFromBufferBE(kR), chaincode: bigIntFromBufferBE(cc) };
}

function algoAddr(pkBigInt) {
  if (!algosdk) return '(algosdk not available — compare pubkeys)';
  const pub = bigIntToBufferLE(pkBigInt, 32);
  return algosdk.encodeAddress(new Uint8Array(pub));
}

(async () => {
  const tree = await Ed25519Bip32HdTree.initialize();
  const root = rootFromSeed('deadbeefcafebabe0102030405060708090a0b0c0d0e0f101112131415161718');
  const rootPub = Ed25519Bip32HdTree.curve.basePointMult(root.sk); // derive root public key
  const rootPubHex = bigIntToBufferLE(rootPub, 32).toString('hex');

  console.log('Root user key (the safe user root)');
  console.log('  pub:', rootPubHex);
  console.log('  algo addr:', algoAddr(rootPub));
  console.log();

  // Compare hardened vs soft at the SAME numeric index (index 0).
  const softChild = tree.privateDerive(
    { pk: rootPub, sk: root.sk, prefix: root.prefix, chaincode: root.chaincode }, 'm/0'
  );
  const hardChild = tree.privateDerive(
    { pk: rootPub, sk: root.sk, prefix: root.prefix, chaincode: root.chaincode }, `m/${HARDENED + 0}`
  );

  // And confirm the soft child is reachable by PUBLIC derivation (server-side mint),
  // while the hardened child is NOT.
  const softPublicOnly = tree.publicDerive({ pk: rootPub, chaincode: root.chaincode }, 'm/0');

  const softPubHex = bigIntToBufferLE(softChild.pk, 32).toString('hex');
  const hardPubHex = bigIntToBufferLE(hardChild.pk, 32).toString('hex');
  const softPubOnlyHex = bigIntToBufferLE(softPublicOnly.pk, 32).toString('hex');

  console.log('SOFT (non-hardened) derive at index 0  — used for MINTING');
  console.log('  child pub:', softPubHex);
  console.log('  algo addr:', algoAddr(softChild.pk));
  console.log('  reachable by PUBLIC derive (server, no secret)?', softPubOnlyHex === softPubHex ? 'YES' : 'NO');
  console.log();
  console.log("HARD (hardened) derive at index 0'    — used for SHARING");
  console.log('  child pub:', hardPubHex);
  console.log('  algo addr:', algoAddr(hardChild.pk));
  let hardPublicFails = false;
  try { tree.publicDerive({ pk: rootPub, chaincode: root.chaincode }, `m/${HARDENED + 0}`); }
  catch (e) { hardPublicFails = true; }
  console.log('  reachable by PUBLIC derive (server, no secret)?', hardPublicFails ? 'NO (needs the private key)' : softPubOnlyHex === hardPubHex ? 'YES' : 'NO');
  console.log();

  console.log('=== RESULT ===');
  console.log('SOFT address == HARD address at the same index?', softPubHex === hardPubHex ? 'YES' : 'NO');
  console.log('(This holds identically whether the key is a plain multisig key or an');
  console.log(' MPC-aggregated key: MPC address derivation calls this SAME publicDerive.)');
})();
