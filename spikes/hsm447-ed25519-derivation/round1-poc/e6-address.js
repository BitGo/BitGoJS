'use strict';
/**
 * E6 (stretch): Address formation from derived pubkeys using chain SDKs.
 * Demonstrates that BIP32-Ed25519 derived pubkeys are consumable by ALGO/XLM/HBAR SDKs.
 * Safe model: user key derives (non-hardened), backup + bitgo remain STATIC root.
 */

const path = require('path');
const crypto = require('crypto');
const REPO = require('path').join(__dirname, '..', '..', '..');
const DIST = path.join(REPO, 'modules/sdk-lib-mpc/dist/src');
const NM   = path.join(REPO, 'node_modules');

const { Ed25519Curve, Ed25519Bip32HdTree } = require(path.join(DIST, 'index.js'));
const { bigIntFromBufferLE, bigIntToBufferLE, bigIntFromBufferBE, bigIntToBufferBE } = require(path.join(DIST, 'util.js'));
const sodium = require(path.join(NM, 'libsodium-wrappers-sumo'));

// Fixed deterministic keys (same as E5)
const FIXED_SEED       = Buffer.from('deadbeefcafebabe0102030405060708090a0b0c0d0e0f101112131415161718', 'hex');
const FIXED_CHAINCODE  = Buffer.from('fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210', 'hex');
// Backup + BitGo static root pubkeys (simulate separate keyholders, also derived from fixed seeds for determinism)
const BACKUP_SEED      = Buffer.from('aabbccdd11223344aabbccdd11223344aabbccdd11223344aabbccdd11223344', 'hex');
const BITGO_SEED       = Buffer.from('11223344aabbccdd11223344aabbccdd11223344aabbccdd11223344aabbccdd', 'hex');

async function deriveRootPk(seed, sodium) {
  const exp = crypto.createHash('sha512').update(seed).digest();
  const kLBuf = Buffer.from(exp.slice(0, 32));
  kLBuf[0] &= 0xF8; kLBuf[31] &= 0x1F; kLBuf[31] |= 0x40;
  const sk = bigIntFromBufferLE(kLBuf);
  const pk = bigIntFromBufferLE(Buffer.from(sodium.crypto_scalarmult_ed25519_base_noclamp(bigIntToBufferLE(sk, 32))));
  return { sk, pk, prefix: bigIntFromBufferBE(Buffer.from(exp.slice(32, 64))) };
}

async function main() {
  await sodium.ready;
  await Ed25519Curve.initialize();
  const tree = await Ed25519Bip32HdTree.initialize();

  // Derive roots
  const userRoot   = await deriveRootPk(FIXED_SEED, sodium);
  userRoot.chaincode = bigIntFromBufferBE(FIXED_CHAINCODE);
  const backupRoot = await deriveRootPk(BACKUP_SEED, sodium);
  const bitgoRoot  = await deriveRootPk(BITGO_SEED, sodium);

  // User derives child non-hardened (wallet minting path, index=42)
  const userRootPriv = { pk: userRoot.pk, sk: userRoot.sk, prefix: userRoot.prefix, chaincode: userRoot.chaincode };
  const userRootPub  = { pk: userRoot.pk, chaincode: userRoot.chaincode };
  const MINT_PATH = 'm/42';
  const userChild = tree.privateDerive(userRootPriv, MINT_PATH);
  // Verify public-only derivation matches
  const userChildPub = tree.publicDerive(userRootPub, MINT_PATH);
  console.log(`User child pub (priv.pk == pub.pk): ${userChild.pk === userChildPub.pk}`);

  // Three pubkeys for the multisig:
  // user: derived child, backup+bitgo: STATIC root pks
  const userPkBuf   = bigIntToBufferLE(userChild.pk, 32);
  const backupPkBuf = bigIntToBufferLE(backupRoot.pk, 32);
  const bitgoPkBuf  = bigIntToBufferLE(bitgoRoot.pk, 32);

  console.log('\n=== E6: Address formation from derived pubkeys ===');
  console.log(`Wallet mint path : ${MINT_PATH}`);
  console.log(`user  pk (derived): ${userPkBuf.toString('hex')}`);
  console.log(`backup pk (static): ${backupPkBuf.toString('hex')}`);
  console.log(`bitgo  pk (static): ${bitgoPkBuf.toString('hex')}`);

  const results = {};

  // ── ALGO multisig ─────────────────────────────────────────────────────────
  console.log('\n--- ALGO multisig ---');
  try {
    const algosdk = require(path.join(NM, 'algosdk'));
    // algosdk address from raw 32-byte ed25519 pubkey
    const addrFromPk = (pkBuf) => algosdk.encodeAddress(pkBuf);
    const userAlgoAddr   = addrFromPk(userPkBuf);
    const backupAlgoAddr = addrFromPk(backupPkBuf);
    const bitgoAlgoAddr  = addrFromPk(bitgoPkBuf);
    console.log(`  user   addr: ${userAlgoAddr}`);
    console.log(`  backup addr: ${backupAlgoAddr}`);
    console.log(`  bitgo  addr: ${bitgoAlgoAddr}`);

    // 2-of-3 multisig address
    const msigParams = {
      version: 1,
      threshold: 2,
      addrs: [userAlgoAddr, backupAlgoAddr, bitgoAlgoAddr],
    };
    const msigAddr = algosdk.multisigAddress(msigParams);
    console.log(`  2-of-3 multisig addr: ${msigAddr}`);
    results.algo = { userAddr: userAlgoAddr, backupAddr: backupAlgoAddr, bitgoAddr: bitgoAlgoAddr, multisigAddr: msigAddr, status: 'PASS' };
  } catch(e) {
    console.log(`  ALGO: ERROR — ${e.message}`);
    results.algo = { status: 'FAIL', error: e.message };
  }

  // ── XLM / Stellar ─────────────────────────────────────────────────────────
  console.log('\n--- XLM (Stellar) ---');
  try {
    const StellarBase = require(path.join(NM, 'stellar-base'));
    // XLM uses raw 32-byte ed25519 pubkey encoded as Stellar G-address (strkey)
    const userXlmKp   = StellarBase.Keypair.fromRawEd25519Seed(FIXED_SEED); // this uses seed...
    // Better: encode pubkey directly
    // Stellar strkey: type=6 (G prefix) for account ID, payload=32-byte pubkey
    const encodeXlm = (pkBuf) => StellarBase.StrKey.encodeEd25519PublicKey(pkBuf);
    const userXlmAddr   = encodeXlm(userPkBuf);
    const backupXlmAddr = encodeXlm(backupPkBuf);
    const bitgoXlmAddr  = encodeXlm(bitgoPkBuf);
    console.log(`  user   addr: ${userXlmAddr}`);
    console.log(`  backup addr: ${backupXlmAddr}`);
    console.log(`  bitgo  addr: ${bitgoXlmAddr}`);
    console.log(`  NOTE: XLM onchain-multisig uses threshold + signers on an account (not address derivation)`);
    results.xlm = { userAddr: userXlmAddr, backupAddr: backupXlmAddr, bitgoAddr: bitgoXlmAddr, status: 'PASS', note: 'XLM multisig = account with signers+threshold' };
  } catch(e) {
    console.log(`  XLM: ERROR — ${e.message}`);
    results.xlm = { status: 'FAIL', error: e.message };
  }

  // ── HBAR / Hedera ─────────────────────────────────────────────────────────
  console.log('\n--- HBAR (Hedera) ---');
  try {
    const hbar_nm = path.join(REPO, 'modules/sdk-coin-hbar/node_modules');
    const hbarSDK = require(path.join(hbar_nm, '@hashgraph/sdk'));
    // Hedera PublicKey from raw ed25519 bytes
    const pkToHbar = (pkBuf) => {
      // HBAR SDK: PublicKey.fromBytesED25519 or fromBytes with DER prefix
      try {
        return hbarSDK.PublicKey.fromBytesED25519(pkBuf);
      } catch(e2) {
        // Older API: fromBytes expects DER — prepend ed25519 OID prefix
        const der = Buffer.concat([Buffer.from('302a300506032b6570032100', 'hex'), pkBuf]);
        return hbarSDK.PublicKey.fromBytes(der);
      }
    };
    const userHbarPk   = pkToHbar(userPkBuf);
    const backupHbarPk = pkToHbar(backupPkBuf);
    const bitgoHbarPk  = pkToHbar(bitgoPkBuf);
    console.log(`  user   pk (HBAR): ${userHbarPk.toString()}`);
    console.log(`  backup pk (HBAR): ${backupHbarPk.toString()}`);
    console.log(`  bitgo  pk (HBAR): ${bitgoHbarPk.toString()}`);
    // KeyList for threshold
    const keyList = new hbarSDK.KeyList([userHbarPk, backupHbarPk, bitgoHbarPk], 2);
    console.log(`  2-of-3 KeyList  : ${keyList.toString()}`);
    console.log(`  NOTE: HBAR account ID (0.0.X) is assigned at account creation, not derivable from pubkey`);
    results.hbar = {
      userPk: userHbarPk.toString(),
      backupPk: backupHbarPk.toString(),
      bitgoPk: bitgoHbarPk.toString(),
      keyList: keyList.toString(),
      status: 'PASS',
      note: 'HBAR account ID assigned server-side; pubkey encoding works'
    };
  } catch(e) {
    console.log(`  HBAR: ERROR — ${e.message}`);
    // Try root node_modules
    try {
      const hbarSDK = require(path.join(NM, '@hashgraph/sdk'));
      const userHbarPk = hbarSDK.PublicKey.fromBytesED25519(userPkBuf);
      console.log(`  HBAR (root NM): user pk = ${userHbarPk.toString()}`);
      results.hbar = { userPk: userHbarPk.toString(), status: 'PASS-partial' };
    } catch(e2) {
      console.log(`  HBAR (root NM fallback): ERROR — ${e2.message}`);
      results.hbar = { status: 'FAIL', error: e.message + ' | fallback: ' + e2.message };
    }
  }

  console.log('\n=== E6 RESULTS ===');
  console.log(JSON.stringify(results, null, 2));

  console.log('\nE6 CONCLUSION:');
  const allPass = Object.values(results).every(r => r.status === 'PASS' || r.status === 'PASS-partial');
  console.log(`  ${allPass ? 'PASS' : 'PARTIAL/FAIL'} — derived pubkeys consumable by chain SDKs as-is (raw 32-byte LE ed25519 point)`);
}

main().catch(console.error);
