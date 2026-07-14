// Test: verify pub/priv consistency and hardened notation in Ed25519Bip32HdTree

import { createRequire } from 'module';
import { pathToFileURL } from 'url';

const require = createRequire(import.meta.url);

// Use built dist
const { Ed25519Bip32HdTree } = require('../../modules/sdk-lib-mpc/dist/src/curves/ed25519Bip32HdTree.js');
const { bigIntFromBufferLE, bigIntToBufferLE, bigIntFromBufferBE } = require('../../modules/sdk-lib-mpc/dist/src/util.js');
const { pathToIndices } = require('../../modules/sdk-lib-mpc/dist/src/curves/util.js');
const { Ed25519Curve } = require('../../modules/sdk-lib-mpc/dist/src/curves/ed25519.js');
const { chaincodeBase } = require('../../modules/sdk-lib-mpc/dist/src/curves/constant.js');

async function main() {
  await Ed25519Curve.initialize();
  const tree = await Ed25519Bip32HdTree.initialize();
  const curve = new Ed25519Curve();

  // Test 1: pathToIndices hardened notation
  const p1 = pathToIndices("m/0'");
  const p2 = pathToIndices("m/2147483648");
  console.log("pathToIndices(\"m/0'\"):", p1, "=> apostrophe gives:", p1[0], "(expected 0, NOT 2147483648)");
  console.log("pathToIndices(\"m/2147483648\"):", p2[0], "(hardened bit set manually)");
  console.log("Hardened notation supported via apostrophe:", p1[0] === 0x80000000 ? "YES" : "NO (BROKEN)");

  // Test 2: Build a test root key
  // Use a well-known seed
  const { createHash, createHmac } = require('crypto');
  const seed = Buffer.from('000102030405060708090a0b0c0d0e0f', 'hex');
  const hmac = createHmac('sha512', 'ed25519 seed');
  hmac.update(seed);
  const masterKey = hmac.digest();
  const kL = masterKey.slice(0, 32);
  const kR = masterKey.slice(32);
  // For BIP32-Ed25519 root, we clamp kL and use it as sk
  // Actually for Khovratovich, master key is derived differently
  // Let's use the hash approach from TSS eddsa
  const h = createHash('sha512').update(kL).digest();
  const sk_raw = bigIntFromBufferLE(h.slice(0, 32));
  const prefix = bigIntFromBufferBE(h.slice(32));
  // Clamp sk
  function clamp(n) {
    const buf = bigIntToBufferLE(n, 32);
    buf[0] &= 248;
    buf[31] &= 63;
    buf[31] |= 64;
    return bigIntFromBufferLE(buf);
  }
  const sk = clamp(sk_raw);
  const pk = curve.basePointMult(sk);
  const chaincode = bigIntFromBufferBE(kR);

  const rootPriv = { pk, sk, prefix, chaincode };
  const rootPub = { pk, chaincode };

  console.log("\nRoot sk (hex):", bigIntToBufferLE(sk, 32).toString('hex').slice(0, 32) + "...");
  console.log("Root pk (hex):", bigIntToBufferLE(pk, 32).toString('hex'));

  // Test 3: Non-hardened derivation - pub == priv?
  const privChild = tree.privateDerive(rootPriv, "m/0");
  const pubChild = tree.publicDerive(rootPub, "m/0");

  const privChildPk_hex = bigIntToBufferLE(privChild.pk, 32).toString('hex');
  const pubChildPk_hex = bigIntToBufferLE(pubChild.pk, 32).toString('hex');
  const pubDerivePk_fromPriv = bigIntToBufferLE(curve.basePointMult(privChild.sk), 32).toString('hex');

  console.log("\n--- Non-hardened derivation consistency ---");
  console.log("privDerive child pk:", privChildPk_hex);
  console.log("pubDerive child pk: ", pubChildPk_hex);
  console.log("sk*G from privChild:", pubDerivePk_fromPriv);
  console.log("pub == priv pk:", privChildPk_hex === pubChildPk_hex ? "YES (consistent)" : "NO (INCONSISTENT)");
  console.log("sk*G == priv pk:", pubDerivePk_fromPriv === privChildPk_hex ? "YES (consistent)" : "NO (INCONSISTENT)");

  // Test 4: Hardened derivation
  const hardIndex = 0x80000000;
  const privHardChild = tree.privateDerive(rootPriv, `m/${hardIndex}`);
  try {
    const pubHardChild = tree.publicDerive(rootPub, `m/${hardIndex}`);
    console.log("\n--- Hardened pub derive (should fail) ---");
    console.log("pubDerive succeeded (unexpected):", bigIntToBufferLE(pubHardChild.pk, 32).toString('hex'));
  } catch(e) {
    console.log("\n--- Hardened pub derive throws (expected) ---");
    console.log("Error:", e.message);
  }

  // Test 5: scalarAdd - does it reduce mod l?
  // l = 2^252 + 27742317777372353535851937790883648493
  const l = BigInt('0x1000000000000000000000000000000014def9dea2f79cd65812631a5cf5d3ed');
  const almostL = l - 1n;
  const one = 1n;
  const sum = curve.scalarAdd(almostL, one);
  console.log("\n--- scalarAdd modular reduction ---");
  console.log("scalarAdd(l-1, 1) =", sum.toString(), "(should be 0 if reduced mod l)");
  console.log("Is 0:", sum === 0n ? "YES (reduces mod l)" : "NO");

  // Test 6: order() value
  const order = curve.order();
  console.log("\n--- order() value ---");
  console.log("order() =", order.toString());
  console.log("l =", l.toString());
  console.log("8*l =", (8n * l).toString());
  console.log("order() == l:", order === l ? "YES" : "NO");
  console.log("order() == 8*l:", order === 8n * l ? "YES (WRONG - returns 8l)" : "NO");

  // Test 7: verify pub/priv consistency at depth 2
  const privChild2 = tree.privateDerive(rootPriv, "m/0/1");
  const pubChild2 = tree.publicDerive(rootPub, "m/0/1");
  const c2_priv_pk = bigIntToBufferLE(privChild2.pk, 32).toString('hex');
  const c2_pub_pk = bigIntToBufferLE(pubChild2.pk, 32).toString('hex');
  const c2_sk_G = bigIntToBufferLE(curve.basePointMult(privChild2.sk), 32).toString('hex');
  console.log("\n--- Depth 2 non-hardened consistency ---");
  console.log("priv pk ==pub pk:", c2_priv_pk === c2_pub_pk ? "YES" : "NO");
  console.log("sk*G == priv pk:", c2_sk_G === c2_priv_pk ? "YES" : "NO");
}

main().catch(console.error);
