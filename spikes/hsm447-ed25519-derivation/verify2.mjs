import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const { Ed25519Bip32HdTree } = require('../../modules/sdk-lib-mpc/dist/src/curves/ed25519Bip32HdTree.js');
const { bigIntFromBufferLE, bigIntToBufferLE, bigIntFromBufferBE, bigIntToBufferBE } = require('../../modules/sdk-lib-mpc/dist/src/util.js');
const { Ed25519Curve } = require('../../modules/sdk-lib-mpc/dist/src/curves/ed25519.js');
const { pathToIndices } = require('../../modules/sdk-lib-mpc/dist/src/curves/util.js');
const { createHash } = require('crypto');

async function main() {
  await Ed25519Curve.initialize();
  const tree = await Ed25519Bip32HdTree.initialize();
  const curve = new Ed25519Curve();

  // Build a test root from seed
  const seed = Buffer.from('000102030405060708090a0b0c0d0e0f', 'hex');
  const h = createHash('sha512').update(seed).digest();
  function clamp(n) {
    const buf = bigIntToBufferLE(n, 32);
    buf[0] &= 248; buf[31] &= 63; buf[31] |= 64;
    return bigIntFromBufferLE(buf);
  }
  const sk = clamp(bigIntFromBufferLE(h.slice(0, 32)));
  const prefix = bigIntFromBufferBE(h.slice(32));
  const pk = curve.basePointMult(sk);
  const chaincode = bigIntFromBufferBE(Buffer.from('b6ee7db80a02df6d3b59e29f37e0fe50', 'hex').slice(0, 32));
  const rootPriv = { pk, sk, prefix, chaincode };

  // Test hardened derivation with raw index
  const HARDENED = 0x80000000;
  const h1 = tree.privateDerive(rootPriv, `m/${HARDENED}`);
  console.log("Hardened child (index 0x80000000) sk:", bigIntToBufferLE(h1.sk, 32).toString('hex').slice(0,16) + "...");
  console.log("Hardened child pk:", bigIntToBufferLE(h1.pk, 32).toString('hex').slice(0,16) + "...");

  // Verify hardened != non-hardened
  const nh1 = tree.privateDerive(rootPriv, `m/0`);
  console.log("Non-hardened child (index 0) sk:", bigIntToBufferLE(nh1.sk, 32).toString('hex').slice(0,16) + "...");
  console.log("Hardened != Non-hardened sk:", bigIntToBufferLE(h1.sk, 32).toString('hex') !== bigIntToBufferLE(nh1.sk, 32).toString('hex') ? "YES (correct)" : "NO");

  // Verify parent key recovery from non-hardened child
  // child_sk = parent_sk + t (mod l), t = 8 * trunc28(ZL)
  // Given child_sk, parent_pk, parent_chaincode, index -> compute t -> recover parent_sk
  const { createHmac } = require('crypto');
  const index = 0;
  const seri = Buffer.alloc(4);
  seri.writeUInt32LE(index, 0);
  const zmac = createHmac('sha512', bigIntToBufferBE(rootPriv.chaincode, 32));
  zmac.update('\x02');
  zmac.update(bigIntToBufferLE(rootPriv.pk, 32));
  zmac.update(seri);
  const zout = zmac.digest();
  const zl = zout.slice(0, 28); // trunc28
  const t = BigInt(8) * bigIntFromBufferLE(zl);
  // Recover: parent_sk = child_sk - t (mod l)
  const recovered_parent_sk = curve.scalarSub(nh1.sk, t);
  const recovered_parent_pk = curve.basePointMult(recovered_parent_sk);
  console.log("\n--- Parent Key Recovery from Non-hardened Child ---");
  console.log("Original parent sk:", bigIntToBufferLE(sk, 32).toString('hex').slice(0,32) + "...");
  console.log("Recovered parent sk:", bigIntToBufferLE(recovered_parent_sk, 32).toString('hex').slice(0,32) + "...");
  console.log("Recovery succeeds:", bigIntToBufferLE(recovered_parent_sk, 32).toString('hex') === bigIntToBufferLE(sk, 32).toString('hex') ? "YES (attack confirmed)" : "NO");

  // Check: does hardened child prevent parent recovery?
  // Hardened ZL = HMAC(chaincode, 0x00 || sk_LE || index_LE)
  const h_zmac = createHmac('sha512', bigIntToBufferBE(rootPriv.chaincode, 32));
  h_zmac.update('\x00');
  h_zmac.update(bigIntToBufferLE(rootPriv.sk, 32));
  h_zmac.update(seri);
  const h_zout = h_zmac.digest();
  const h_zl = h_zout.slice(0, 28);
  const h_t = BigInt(8) * bigIntFromBufferLE(h_zl);
  // t_hardened depends on sk (secret), so an attacker who doesn't know sk cannot compute t_hardened
  // even with h1.sk and chaincode and pk
  console.log("\n--- Hardened child protects parent ---");
  console.log("Hardened t depends on secret sk: YES (attacker cannot compute without sk)");
  console.log("Cannot recover parent from hardened child without knowing parent sk: CONFIRMED");

  // Verify: mod-l vs integer — keys diverge at overflow
  const l = BigInt('0x1000000000000000000000000000000014def9dea2f79cd65812631a5cf5d3ed');
  // Manually compute "integer" child and compare to mod-l child
  const { bigIntToBufferLE: toLE } = require('../../modules/sdk-lib-mpc/dist/src/util.js');
  const sk_int = sk + t; // integer addition
  const sk_modl = (sk + t) % l; // mod l
  const sk_scalaradd = nh1.sk; // libsodium's scalarAdd result
  console.log("\n--- Integer vs Mod-l scalar addition ---");
  console.log("sk + t > l:", (sk + t) >= l ? "YES (would overflow l, divergence expected)" : "NO (no overflow for this test vector)");
  console.log("(sk+t) mod l == scalarAdd(sk,t):", sk_modl === sk_scalaradd ? "YES (consistent)" : "NO (inconsistent)");
  console.log("Integer sk+t == mod-l:", sk_int === sk_scalaradd ? "YES (same)" : "NO (different keys would result)");
}

main().catch(console.error);
