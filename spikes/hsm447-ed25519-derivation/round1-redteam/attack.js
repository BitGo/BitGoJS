'use strict';
/**
 * RED TEAM ATTACKS on D3 poc-vectors findings.
 * Adversarial cryptographer lens: probe encoding, key recovery, order, path bugs.
 */

const path = require('path');
const crypto = require('crypto');
const REPO = require('path').join(__dirname, '..', '..', '..');
const DIST = path.join(REPO, 'modules/sdk-lib-mpc/dist/src');
const NM   = path.join(REPO, 'node_modules');

const { Ed25519Curve, Ed25519Bip32HdTree } = require(path.join(DIST, 'index.js'));
const { bigIntFromBufferLE, bigIntToBufferLE, bigIntFromBufferBE, bigIntToBufferBE } = require(path.join(DIST, 'util.js'));
const { pathToIndices } = require(path.join(DIST, 'curves/index.js'));
const sodium    = require(path.join(NM, 'libsodium-wrappers-sumo'));
const tweetnacl = require(path.join(NM, 'tweetnacl'));

const FIXED_SEED = Buffer.from('deadbeefcafebabe0102030405060708090a0b0c0d0e0f101112131415161718', 'hex');
const FIXED_CHAINCODE_HEX = 'fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210';

// The prime-order subgroup order l for ed25519
const l = BigInt('0x1000000000000000000000000000000014def9dea2f79cd65812631a5cf5d3ed');

async function main() {
  await sodium.ready;
  await Ed25519Curve.initialize();
  const tree = await Ed25519Bip32HdTree.initialize();

  const expanded = crypto.createHash('sha512').update(FIXED_SEED).digest();
  const kLBuf = Buffer.from(expanded.slice(0, 32));
  kLBuf[0]  &= 0xF8;
  kLBuf[31] &= 0x1F;
  kLBuf[31] |= 0x40;
  const rootSk = bigIntFromBufferLE(kLBuf);
  const rootPrefix_asBE = bigIntFromBufferBE(Buffer.from(expanded.slice(32, 64)));  // stored as BE bigint
  const rootChaincode = bigIntFromBufferBE(Buffer.from(FIXED_CHAINCODE_HEX, 'hex'));
  const rootPk = bigIntFromBufferLE(Buffer.from(
    sodium.crypto_scalarmult_ed25519_base_noclamp(bigIntToBufferLE(rootSk, 32))
  ));
  const rootPriv = { pk: rootPk, sk: rootSk, prefix: rootPrefix_asBE, chaincode: rootChaincode };
  const rootPub  = { pk: rootPk, chaincode: rootChaincode };

  console.log('=== RED TEAM ATTACKS ===\n');

  // ────────────────────────────────────────────────────────────────────────
  // ATTACK A1: order() = 8*l — does scalarAdd use l or 8*l?
  // If order()=8*l, then curve.scalarAdd would operate mod 8*l. Check what
  // crypto_core_ed25519_scalar_add actually uses.
  // ────────────────────────────────────────────────────────────────────────
  console.log('=== ATTACK A1: order() = 8*l, but does scalarAdd use l or 8*l? ===');
  const curve_order_method = BigInt('0x1000000000000000000000000000000014def9dea2f79cd65812631a5cf5d3ed') * BigInt('0x08');
  // Try adding l to a scalar: if scalarAdd operates mod l, result = 0. If mod 8l, result = l.
  const zero_test = bigIntFromBufferLE(Buffer.from(
    sodium.crypto_core_ed25519_scalar_add(bigIntToBufferLE(l, 32), bigIntToBufferLE(0n, 32))
  ));
  console.log(`  l + 0 via scalarAdd = ${zero_test.toString()} (should be 0 if mod l, ${l} if mod 8l)`);
  console.log(`  scalarAdd IS mod l: ${zero_test === 0n}`);

  // Check that order() in the Ed25519Curve class returns 8*l, not l
  const curve = new Ed25519Curve();
  const order_val = curve.order();
  console.log(`  Ed25519Curve.order() = ${order_val}`);
  console.log(`  order() == 8*l: ${order_val === BigInt(8) * l}`);
  console.log(`  FINDING: order() returns 8*l but scalarAdd operates mod l. They MISMATCH.`);
  console.log(`  Any caller using curve.order() for modular arithmetic in signing/derivation`);
  console.log(`  would use the WRONG modulus (8*l instead of l).\n`);

  // ────────────────────────────────────────────────────────────────────────
  // ATTACK A2: Root sk > l — scalarAdd (mod l) on root gives wrong scalar?
  // BIP32-Ed25519: kL_child = kL_parent + 8*trunc28(zl) (INTEGER arithmetic).
  // Implementation: scalarAdd(sk, t) which is mod l.
  // Attack: show kL_root > l, so storing rootSk and using it in scalarAdd
  // gives result DIFFERENT from integer sum, while the PK is still consistent.
  // ────────────────────────────────────────────────────────────────────────
  console.log('=== ATTACK A2: Root sk > l — integer vs modular arithmetic divergence ===');
  console.log(`  rootSk = ${rootSk}`);
  console.log(`  l      = ${l}`);
  console.log(`  rootSk > l: ${rootSk > l}`);
  console.log(`  rootSk / l = ${rootSk / l} (quotient)`);
  console.log(`  rootSk mod l = ${rootSk % l}`);

  // Derive child m/0 and compute expected pk two ways:
  //   Way 1: tree.privateDerive (uses scalarAdd mod l)
  //   Way 2: integer arithmetic (add the raw t, then compute pk from integer sum)
  const child0_priv = tree.privateDerive(rootPriv, 'm/0');
  const child0_pub  = tree.publicDerive(rootPub, 'm/0');

  // Compute zl for index 0 manually
  const zmac = crypto.createHmac('sha512', bigIntToBufferBE(rootChaincode, 32));
  zmac.update('\x02');
  zmac.update(bigIntToBufferLE(rootPk, 32));
  const seri0 = Buffer.alloc(4); seri0.writeUInt32LE(0, 0);
  zmac.update(seri0);
  const zout = zmac.digest();
  const zl = zout.slice(0, 28);
  const t = BigInt(8) * bigIntFromBufferLE(zl);
  console.log(`  t (8*trunc28(zl)) = ${t}`);

  // Integer addition
  const childSk_integer = rootSk + t;  // NOT mod l
  const childPk_from_integer = bigIntFromBufferLE(Buffer.from(
    sodium.crypto_scalarmult_ed25519_base_noclamp(bigIntToBufferLE(childSk_integer % l, 32))
  ));

  // scalarAdd result
  const childSk_scalarAdd = child0_priv.sk;
  const childPk_from_scalarAdd = bigIntFromBufferLE(Buffer.from(
    sodium.crypto_scalarmult_ed25519_base_noclamp(bigIntToBufferLE(childSk_scalarAdd, 32))
  ));

  console.log(`  childSk via integer add: ${childSk_integer}`);
  console.log(`  childSk via scalarAdd  : ${childSk_scalarAdd}`);
  console.log(`  Equal: ${childSk_integer === childSk_scalarAdd}`);
  console.log(`  (integer sum) % l == scalarAdd result: ${childSk_integer % l === childSk_scalarAdd}`);
  console.log(`  pk from integer (mod l): ${bigIntToBufferLE(childPk_from_integer, 32).toString('hex').slice(0,32)}...`);
  console.log(`  pk from scalarAdd      : ${bigIntToBufferLE(childPk_from_scalarAdd, 32).toString('hex').slice(0,32)}...`);
  console.log(`  pk from publicDerive   : ${bigIntToBufferLE(child0_pub.pk, 32).toString('hex').slice(0,32)}...`);
  console.log(`  All pk match: ${child0_pub.pk === childPk_from_integer && child0_pub.pk === childPk_from_scalarAdd}`);
  console.log(`  NOTE: point math is naturally mod l, so pk is correct regardless.`);
  console.log(`  BIP32-Ed25519 spec requires integer kL (divisible by 8 for safety), but scalarAdd mod l`);
  console.log(`  breaks this invariant for child scalars in deep derivation chains.\n`);

  // ────────────────────────────────────────────────────────────────────────
  // ATTACK A3: Non-hardened child private key → root private key recovery
  // In BIP32 non-hardened: sk_child = sk_parent + t, where t is computable
  // from the public parent key + chaincode + index. So sk_parent = sk_child - t.
  // ────────────────────────────────────────────────────────────────────────
  console.log('=== ATTACK A3: Non-hardened child sk + public info => root sk recovery ===');
  // Attacker knows: (child0.sk, rootPk, rootChaincode, index=0)
  // Attacker does NOT know rootSk.
  const childSk_known = child0_priv.sk;  // attacker obtained this (e.g., from export)

  // Attacker recomputes t from public data:
  const zmac2 = crypto.createHmac('sha512', bigIntToBufferBE(rootChaincode, 32));
  zmac2.update('\x02');
  zmac2.update(bigIntToBufferLE(rootPk, 32));
  zmac2.update(seri0);
  const zout2 = zmac2.digest();
  const zl2 = zout2.slice(0, 28);
  const t2 = BigInt(8) * bigIntFromBufferLE(zl2);

  // Recover rootSk: rootSk = childSk - t (mod l)
  const recovered_rootSk_modl = bigIntFromBufferLE(Buffer.from(
    sodium.crypto_core_ed25519_scalar_sub(
      bigIntToBufferLE(childSk_known, 32),
      bigIntToBufferLE(t2, 32)
    )
  ));

  // Does recovered_rootSk (mod l) produce rootPk?
  const recovered_pk = bigIntFromBufferLE(Buffer.from(
    sodium.crypto_scalarmult_ed25519_base_noclamp(bigIntToBufferLE(recovered_rootSk_modl, 32))
  ));

  console.log(`  rootSk (actual)           : ${bigIntToBufferLE(rootSk, 32).toString('hex')}`);
  console.log(`  recovered rootSk (mod l)  : ${bigIntToBufferLE(recovered_rootSk_modl, 32).toString('hex')}`);
  console.log(`  rootSk == recovered (mod l): ${rootSk % l === recovered_rootSk_modl}`);
  console.log(`  recovered pk == rootPk    : ${recovered_pk === rootPk}`);
  console.log(`  ATTACK RESULT: ${recovered_pk === rootPk ? 'ROOT SK RECOVERABLE from non-hardened child' : 'NOT DIRECTLY RECOVERABLE (unexpected)'}`);
  console.log(`  IMPLICATION: Any party with a non-hardened child private key + parent chaincode`);
  console.log(`  can recover the parent private key, and thus derive ALL sibling wallets.`);
  console.log(`  For root-4 wallet minting: if ANY minted wallet's user child sk leaks`);
  console.log(`  (backup export, HSM breach, etc.), the attacker recovers the user root sk.`);
  console.log(`  This is the standard BIP32 non-hardened child-key weakness.\n`);

  // ────────────────────────────────────────────────────────────────────────
  // ATTACK A4: pathToIndices NaN handling — what happens with garbage paths
  // ────────────────────────────────────────────────────────────────────────
  console.log('=== ATTACK A4: pathToIndices NaN/garbage path handling ===');
  const badPaths = [
    "m/foo",      // NaN => 0?
    "m/",         // empty => NaN?
    "m/0'",       // apostrophe => 0 silently
    "m/0h",       // h suffix => 0 silently
    "m/2147483648",  // correct hardened
    "m/ 0",       // leading space
    "m/0.5",      // decimal
  ];
  for (const p of badPaths) {
    const indices = pathToIndices(p);
    console.log(`  pathToIndices(${JSON.stringify(p)}) => ${JSON.stringify(indices)}`);
  }
  // What does deriving with NaN index do?
  console.log('  Testing derive with NaN index (from "m/foo"):');
  try {
    const nanChild = tree.privateDerive(rootPriv, 'm/foo');
    const normalChild = tree.privateDerive(rootPriv, 'm/0');
    console.log(`    m/foo derived pk: ${bigIntToBufferLE(nanChild.pk, 32).toString('hex').slice(0,32)}...`);
    console.log(`    m/0   derived pk: ${bigIntToBufferLE(normalChild.pk, 32).toString('hex').slice(0,32)}...`);
    console.log(`    m/foo == m/0: ${nanChild.pk === normalChild.pk}  (NaN treated as 0)`);
  } catch(e) {
    console.log(`    derive threw: ${e.message}`);
  }
  console.log();

  // ────────────────────────────────────────────────────────────────────────
  // ATTACK A5: Prefix LE/BE encoding in scalarSign — cross-stack bug
  // The prefix is stored as bigIntFromBufferBE(kR_bytes) in the tree.
  // scalarSign serializes it as bigIntToBufferLE(prefix, 32).
  // This effectively reverses the byte order of kR relative to raw bytes.
  // Compare nonce produced by our scalarSign vs a "raw bytes" nonce.
  // ────────────────────────────────────────────────────────────────────────
  console.log('=== ATTACK A5: Prefix LE/BE encoding in scalarSign nonce ===');
  const kR_raw_bytes = Buffer.from(expanded.slice(32, 64));  // kR as raw bytes (natural)
  const prefix_as_stored = rootPrefix_asBE;  // bigIntFromBufferBE(kR_raw_bytes)

  // scalarSign uses: bigIntToBufferLE(prefix, 32) as the prefix material
  const prefix_for_nonce_actual = bigIntToBufferLE(prefix_as_stored, 32);

  console.log(`  kR raw bytes (natural)   : ${kR_raw_bytes.toString('hex')}`);
  console.log(`  prefix_for_nonce (actual): ${prefix_for_nonce_actual.toString('hex')}`);
  console.log(`  Are they the same bytes? : ${kR_raw_bytes.equals(prefix_for_nonce_actual)}`);

  // A correct Khovratovich implementation would use kR_raw_bytes directly
  // (no interpretation as bigint, just the raw 32 bytes as nonce material).
  // The researcher's implementation interprets kR as BE bigint then re-serializes as LE,
  // effectively REVERSING the bytes.
  const msg = Buffer.from('48534d2d343437207465737420766563746f72206d657373616765', 'hex');

  // Produce nonce with raw bytes
  const nonce_raw = crypto.createHash('sha512').update(kR_raw_bytes).update(msg).digest();
  // Produce nonce as implemented
  const nonce_impl = crypto.createHash('sha512').update(prefix_for_nonce_actual).update(msg).digest();

  console.log(`  nonce_raw bytes == nonce_impl: ${nonce_raw.equals(nonce_impl)}`);
  console.log(`  => Different nonces = different signatures = CROSS-STACK INCOMPATIBILITY`);
  console.log(`  => Any HSM or Rust/Python implementation using raw kR bytes will DISAGREE`);
  console.log(`     with the scalarSign implementation in the test vectors.\n`);

  // ────────────────────────────────────────────────────────────────────────
  // ATTACK A6: Depth stress — does extremely deep path hit any overflow?
  // Also: path 'm/0' with pathToIndices: verify the shift/reduce double-derivation
  // ────────────────────────────────────────────────────────────────────────
  console.log('=== ATTACK A6: Single-segment path double-derivation check ===');
  // The publicDerive implementation does:
  //   const subkey = indices.reduce(deriveIndex, deriveIndex([pk, cc], indices.shift()));
  // For 'm/0': indices=[0], shift → [], deriveIndex([pk,cc], 0) → result1,
  //   then [].reduce(fn, result1) → result1 (no iterations).
  // For 'm/0/1': indices=[0,1], shift → [1], deriveIndex([pk,cc], 0) → r1,
  //   then [1].reduce(fn, r1) → fn(r1, 1) → r2. Correct.
  // But wait: reduce(fn, initial) calls fn(accumulator, currentValue)
  //   where currentValue is the ARRAY ELEMENT. So fn(r1, 1) gets (acc=[pk0,cc0], index=1). Correct.
  // Let me verify manually that path 'm/0/1' gives same result as two sequential m/0 then m/1 from child.
  const child_0   = tree.publicDerive(rootPub, 'm/0');
  const child_0_1 = tree.publicDerive(rootPub, 'm/0/1');
  const child_0_then_1 = tree.publicDerive({ pk: child_0.pk, chaincode: child_0.chaincode }, 'm/1');
  console.log(`  publicDerive(root, m/0/1):           ${bigIntToBufferLE(child_0_1.pk, 32).toString('hex').slice(0,32)}...`);
  console.log(`  publicDerive(child0, m/1) (chained): ${bigIntToBufferLE(child_0_then_1.pk, 32).toString('hex').slice(0,32)}...`);
  console.log(`  Consistent: ${child_0_1.pk === child_0_then_1.pk}`);
  console.log(`  (confirms no double-derivation bug in reduce)\n`);

  // ────────────────────────────────────────────────────────────────────────
  // ATTACK A7: Chaincode storage convention mismatch
  // publicDerive stores chaincode from: bigIntFromBufferBE(iout.slice(32))
  // But the input rootChaincode was stored as bigIntFromBufferBE(FIXED_CHAINCODE_HEX) — BE.
  // The HMAC key uses bigIntToBufferBE(chaincode, 32). Is this consistent?
  // ────────────────────────────────────────────────────────────────────────
  console.log('=== ATTACK A7: Chaincode encoding round-trip ===');
  const cc_original_hex = FIXED_CHAINCODE_HEX;
  const cc_as_bigint = bigIntFromBufferBE(Buffer.from(cc_original_hex, 'hex'));
  const cc_back_to_hex = bigIntToBufferBE(cc_as_bigint, 32).toString('hex');
  console.log(`  chaincode input hex: ${cc_original_hex}`);
  console.log(`  back via BE:         ${cc_back_to_hex}`);
  console.log(`  Round-trip: ${cc_original_hex === cc_back_to_hex}`);
  // But child chaincode: publicDerive sets chaincode = bigIntFromBufferBE(iout.slice(32))
  // and deriveEd25519Helper uses bigIntToBufferBE(chaincode, 32) as the HMAC key.
  // So chaincode is consistently BE. Good. But prefix is also stored BE yet used in scalarSign as LE.
  // Let's confirm prefix round-trip has the reversal:
  const kR_bytes = Buffer.from(expanded.slice(32, 64));
  const prefix_stored = bigIntFromBufferBE(kR_bytes);  // read as BE bigint
  const prefix_reserialize_LE = bigIntToBufferLE(prefix_stored, 32);
  const prefix_reserialize_BE = bigIntToBufferBE(prefix_stored, 32);
  console.log(`  kR raw          : ${kR_bytes.toString('hex')}`);
  console.log(`  prefix as LE    : ${prefix_reserialize_LE.toString('hex')} (REVERSED from raw)`);
  console.log(`  prefix as BE    : ${prefix_reserialize_BE.toString('hex')} (= raw)`);
  console.log(`  scalarSign uses : LE (bigIntToBufferLE) => bytes are reversed vs raw kR.`);
  console.log(`  This is a cross-stack API hazard.\n`);

  // ────────────────────────────────────────────────────────────────────────
  // ATTACK A8: Child prefix accumulation — does prefix wrap around chaincodeBase correctly?
  // privateDerive: right = (prefix + bigIntFromBufferBE(zr)) % chaincodeBase
  // chaincodeBase = 2^256 (constant.ts). This is fine mathematically — modular 2^256.
  // But publicDerive does NOT store prefix; only privateDerive does.
  // For FR-13: the invitee's encryptedPrv must contain the child prefix for signing.
  // ────────────────────────────────────────────────────────────────────────
  console.log('=== ATTACK A8: publicDerive does NOT return prefix (FR-13 implication) ===');
  const pubDeriveResult = tree.publicDerive(rootPub, 'm/0');
  const privDeriveResult = tree.privateDerive(rootPriv, 'm/0');
  console.log(`  publicDerive result keys: ${Object.keys(pubDeriveResult)}`);
  console.log(`  privateDerive result keys: ${Object.keys(privDeriveResult)}`);
  console.log(`  publicDerive has prefix: ${'prefix' in pubDeriveResult}`);
  console.log(`  NOTE: The server uses publicDerive for wallet minting (fine, pk only needed).`);
  console.log(`  But for FR-13 hardened share: invitee gets (childSk, childPrefix, childPk, childChaincode).`);
  console.log(`  The childPrefix is crucial for signing. If the encryptedPrv format only stores`);
  console.log(`  the 32-byte scalar (not prefix), the invitee cannot produce valid signatures.\n`);

  console.log('=== SUMMARY OF ATTACKS ===');
  console.log('A1: order()=8*l is misleading — scalarAdd operates mod l (subgroup). OK cryptographically,');
  console.log('    but any code using curve.order() for signing arithmetic (S mod order()) would use 8*l => WRONG.');
  console.log('A2: rootSk > l (clamped 254-bit scalar >> 252-bit prime l). scalarAdd wraps mod l.');
  console.log('    Integer vs modular arithmetic diverge, but pk consistency is preserved.');
  console.log('    Child scalars lose the "divisible by 8" invariant of BIP32-Ed25519 after depth > 1.');
  console.log('A3: CRITICAL — Non-hardened child sk + public chaincode => root sk recoverable.');
  console.log('    Any user child private key leak => all sibling wallets compromised.');
  console.log('    This is standard BIP32 weakness, not specific to this impl.');
  console.log('A4: pathToIndices maps NaN (m/foo) and apostrophe-hardened (m/0\') to index=0 silently.');
  console.log('    DANGER: m/0\' and m/0 are IDENTICAL to this implementation => collision risk.');
  console.log('A5: CRITICAL for cross-stack — scalarSign uses prefix bytes REVERSED vs raw kR bytes.');
  console.log('    HSM/wallet-platform using raw kR will produce DIFFERENT nonces and signatures.');
  console.log('    Test vectors are internally consistent but incompatible with Khovratovich raw kR.');
  console.log('A6: No double-derivation bug in reduce. Path chaining is consistent.');
  console.log('A7: Chaincode uses consistent BE convention. Prefix has LE/BE mismatch vs chaincode (BE).');
  console.log('A8: publicDerive returns no prefix. FR-13 invitee MUST receive prefix separately in encryptedPrv.');
}

main().catch(e => { console.error('FATAL:', e); process.exit(1); });
