/**
 * Pearl cross-validation against live-node vectors.
 *
 * Every constant below was produced by a real `pearld` 1.0.2 regtest node during
 * sandboxing (BitGo/coins-sandbox#898) and is quoted from
 * `prl/wasm-utxo-fixtures.json`, `prl/indexer-utxo-check.json` and
 * `prl/prl_multisig_report.md`.
 *
 * The point of this file is to check our library against *external* output rather
 * than against itself. `transactionFlow.ts` proves the PSBT lifecycle is
 * internally consistent; it cannot prove a pearld node would accept the bytes,
 * because the transactions it builds reference txids that never existed. These
 * vectors close part of that gap.
 *
 * What is genuinely node-verified here:
 *
 *   - deserializing a real pearld transaction and computing the node's own txid
 *   - encoding a real node scriptPubKey to an address, and restoring it exactly
 *   - the witness shape the node accepted for a 2-of-3 taproot script-path spend
 *
 * What is NOT covered, and why: see `KNOWN DIVERGENCE` below. The sandbox spends
 * used a hand-rolled taptree with a NUMS internal key, which is *not* the taptree
 * BitGo's `p2tr` chain builds. Their signatures and leaf scripts therefore cannot
 * be compared against ours.
 */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

import { address, BIP32, fixedScriptWallet, Transaction } from '@bitgo/wasm-utxo';

/* ------------------------------------------------------------------------- *
 * Vectors captured from the live pearld regtest node (coins-sandbox#898)
 * ------------------------------------------------------------------------- */

/** Coinbase transaction, verbatim from `indexer-utxo-check.json` -> rpcMethodChecks[15].sample */
const NODE_COINBASE_HEX =
  '010000000001010000000000000000000000000000000000000000000000000000000000000000ffffffff1051000d2f' +
  '503253482f706561726c642fffffffff02af9829324b000000225120ca4c6e0c33e27b9897807a300e023b85d5e1ddbd' +
  'e2872bc4fb4966dfdd3fb1650000000000000000266a24aa21a9ede2f61c3f71d1defd3fa999dfa36953755c69068979' +
  '9962b48bebd836974e8cf901200000000000000000000000000000000000000000000000000000000000000000000000' +
  '00';

/** The txid the node itself reported for the above (prl_multisig_report.md:100). */
const NODE_COINBASE_TXID = '272e5b8aee44eb4e65ab98979647f8e0e2f9a441521f3b4fad4aba91f675d295';

/**
 * Real p2tr outputs from the node, as `[scriptType, scriptPubKey, address]`
 * (`wasm-utxo-fixtures.json` -> addressFixtures). Addresses use the regtest `rprl`
 * HRP; wasm-utxo has no Pearl regtest CoinName, so the comparison below is on the
 * bech32m *data part*, which is HRP-independent.
 */
const NODE_P2TR_OUTPUTS = [
  {
    scriptPubKey: '5120ca4c6e0c33e27b9897807a300e023b85d5e1ddbde2872bc4fb4966dfdd3fb165',
    regtestAddress: 'rprl1pefxxurpnufae39uq0gcquq3msh27rhdau2rjh38mf9ndlhflk9jsk5zncq',
  },
  {
    scriptPubKey: '51208e972a76a884de6a67fe7d6c97cd8dca6074fc17f2a64a5b8592f9376dda07b4',
    regtestAddress: 'rprl1p36tj5a4gsn0x5el704kf0nvdefs8flqh72ny5ku9jtunwmw6q76qhq6549',
  },
] as const;

/**
 * Witness shape the node accepted for a 2-of-3 taproot script-path spend
 * (`wasm-utxo-fixtures.json` -> psbtSample, corroborated by prl_multisig_report.md).
 */
const NODE_WITNESS = {
  stackSize: 4,
  sigLength: 64, // BIP-340 Schnorr, no trailing sighash byte
  controlBlockLength: 65, // 1 byte version|parity + 32 byte internal key + 32 byte merkle proof
  leafVersion: 0xc0,
} as const;

/* ------------------------------------------------------------------------- *
 * Test wallet - our side of the comparison
 * ------------------------------------------------------------------------- */

const roots = ['pearl-e2e-user', 'pearl-e2e-backup', 'pearl-e2e-bitgo'].map((seed) => BIP32.fromSeedSha256(seed));
const xprvs = roots.map((k) => k.toBase58()) as [string, string, string];
const xpubs = roots.map((k) => k.neutered().toBase58()) as [string, string, string];
const walletKeys = fixedScriptWallet.RootWalletKeys.fromXpubs(xpubs);

/* ------------------------------------------------------------------------- *
 * Minimal segwit witness reader
 * ------------------------------------------------------------------------- */

function readVarInt(buf: Buffer, offset: number): [number, number] {
  const n = buf[offset];
  if (n < 0xfd) return [n, offset + 1];
  if (n === 0xfd) return [buf.readUInt16LE(offset + 1), offset + 3];
  if (n === 0xfe) return [buf.readUInt32LE(offset + 1), offset + 5];
  return [Number(buf.readBigUInt64LE(offset + 1)), offset + 9];
}

/** Witness stack of the first input of a segwit transaction. */
function witnessOf(raw: Buffer): Buffer[] {
  let o = 4; // version
  assert.strictEqual(raw[o], 0x00, 'expected segwit marker');
  assert.strictEqual(raw[o + 1], 0x01, 'expected segwit flag');
  o += 2;

  const [inputCount, afterInputCount] = readVarInt(raw, o);
  o = afterInputCount;
  for (let i = 0; i < inputCount; i++) {
    o += 36; // txid + vout
    const [scriptLen, afterScript] = readVarInt(raw, o);
    o = afterScript + scriptLen + 4; // scriptSig + sequence
  }

  const [outputCount, afterOutputCount] = readVarInt(raw, o);
  o = afterOutputCount;
  for (let i = 0; i < outputCount; i++) {
    o += 8; // value
    const [scriptLen, afterScript] = readVarInt(raw, o);
    o = afterScript + scriptLen;
  }

  const [itemCount, afterItemCount] = readVarInt(raw, o);
  o = afterItemCount;
  const items: Buffer[] = [];
  for (let i = 0; i < itemCount; i++) {
    const [len, afterLen] = readVarInt(raw, o);
    items.push(raw.subarray(afterLen, afterLen + len));
    o = afterLen + len;
  }
  return items;
}

/** A fully-signed 1-in/1-out Pearl p2tr script-path spend. */
function signedSpend(signer: 'user' | 'backup', cosigner: 'user' | 'backup' | 'bitgo') {
  const keyFor = { user: xprvs[0], backup: xprvs[1], bitgo: xprvs[2] };
  const psbt = fixedScriptWallet.BitGoPsbt.createEmpty('pearl', walletKeys);
  psbt.addWalletInput(
    { txid: createHash('sha256').update(`${signer}-${cosigner}`).digest('hex'), vout: 0, value: 100_000n },
    walletKeys,
    { scriptId: { chain: 30, index: 0 }, signPath: { signer, cosigner } }
  );
  psbt.addWalletOutput(walletKeys, { chain: 31, index: 0, value: 90_000n });
  psbt.sign(keyFor[signer]);
  psbt.sign(keyFor[cosigner]);
  psbt.finalizeAllInputs();
  return Buffer.from(psbt.extractTransaction().toBytes());
}

describe('Pearl - cross-validation against live-node vectors', function () {
  describe('transaction deserialization', function () {
    it("computes the node's own txid for a real pearld transaction", function () {
      // The strongest check available offline: the node published both the raw
      // bytes and the txid, so agreement is genuinely external.
      const tx = Transaction.fromBytes(Buffer.from(NODE_COINBASE_HEX, 'hex'), 'pearl');
      assert.strictEqual(tx.getId(), NODE_COINBASE_TXID);
    });

    it('round-trips the node transaction byte-for-byte', function () {
      const raw = Buffer.from(NODE_COINBASE_HEX, 'hex');
      const tx = Transaction.fromBytes(raw, 'pearl');
      assert.deepStrictEqual(Buffer.from(tx.toBytes()), raw);
    });

    it('reads the taproot output the node created', function () {
      const raw = Buffer.from(NODE_COINBASE_HEX, 'hex');
      // The coinbase pays to the first fixture scriptPubKey.
      assert.ok(
        raw.toString('hex').includes(NODE_P2TR_OUTPUTS[0].scriptPubKey),
        'coinbase should contain the known p2tr output script'
      );
    });
  });

  describe('address encoding', function () {
    for (const { scriptPubKey, regtestAddress } of NODE_P2TR_OUTPUTS) {
      it(`matches the node's bech32m data part for ${scriptPubKey.slice(0, 16)}...`, function () {
        // bech32m is `hrp` + `1` + data + checksum. The HRP and checksum differ
        // between regtest and mainnet by construction, but the data part encodes
        // the witness program alone, so it must match the node exactly.
        const nodeDataPart = regtestAddress.split('1').slice(1).join('1').slice(0, -6);

        for (const coinName of ['pearl', 'tpearl'] as const) {
          const ours = address.fromOutputScriptWithCoin(Buffer.from(scriptPubKey, 'hex'), coinName);
          const ourDataPart = ours.split('1').slice(1).join('1').slice(0, -6);
          assert.strictEqual(ourDataPart, nodeDataPart, `${coinName}: bech32m data part must match the node`);
        }
      });

      it(`restores the node's exact scriptPubKey for ${scriptPubKey.slice(0, 16)}...`, function () {
        for (const coinName of ['pearl', 'tpearl'] as const) {
          const ours = address.fromOutputScriptWithCoin(Buffer.from(scriptPubKey, 'hex'), coinName);
          const restored = Buffer.from(address.toOutputScriptWithCoin(ours, coinName)).toString('hex');
          assert.strictEqual(restored, scriptPubKey, `${coinName}: round-trip must restore the node scriptPubKey`);
        }
      });
    }

    it('uses the HRPs the node uses, per network', function () {
      const spk = Buffer.from(NODE_P2TR_OUTPUTS[0].scriptPubKey, 'hex');
      assert.ok(address.fromOutputScriptWithCoin(spk, 'pearl').startsWith('prl1p'));
      assert.ok(address.fromOutputScriptWithCoin(spk, 'tpearl').startsWith('tprl1p'));
      // The node's regtest HRP, for the record - wasm-utxo has no Pearl regtest coin.
      assert.ok(NODE_P2TR_OUTPUTS[0].regtestAddress.startsWith('rprl1p'));
    });
  });

  describe('witness shape accepted by the node', function () {
    it('produces the stack size and signature lengths the node accepted', function () {
      const witness = witnessOf(signedSpend('user', 'bitgo'));

      assert.strictEqual(witness.length, NODE_WITNESS.stackSize, 'witness stack size must match the node');
      // [sig, sig, leafScript, controlBlock]
      assert.strictEqual(witness[0].length, NODE_WITNESS.sigLength, 'BIP-340 signatures carry no sighash byte');
      assert.strictEqual(witness[1].length, NODE_WITNESS.sigLength);
      // The node's sample was a user+bitgo spend, i.e. the shallow leaf.
      assert.strictEqual(witness[3].length, NODE_WITNESS.controlBlockLength);
    });

    it('tags the control block with the leaf version the node saw', function () {
      const witness = witnessOf(signedSpend('user', 'bitgo'));
      const controlBlock = witness[3];
      // Low bit is the output key parity and varies per output; the rest is the
      // tapscript leaf version.
      assert.strictEqual(controlBlock[0] & 0xfe, NODE_WITNESS.leafVersion);
    });

    it('holds the stack size and signature lengths for every taptree leaf', function () {
      for (const [signer, cosigner] of [
        ['user', 'bitgo'],
        ['user', 'backup'],
        ['backup', 'bitgo'],
      ] as const) {
        const witness = witnessOf(signedSpend(signer, cosigner));
        assert.strictEqual(witness.length, NODE_WITNESS.stackSize, `${signer}+${cosigner}`);
        assert.strictEqual(witness[0].length, NODE_WITNESS.sigLength, `${signer}+${cosigner}`);
        assert.strictEqual(witness[1].length, NODE_WITNESS.sigLength, `${signer}+${cosigner}`);
      }
    });

    /**
     * Control block size is `1 + 32 + 32 * merkleDepth`, so it reveals where each
     * leaf sits in the tree. The depths below match the taptree the TDD specifies,
     *
     *   branch(leaf0[user+bitgo], branch(leaf1[user+backup], leaf2[backup+bitgo]))
     *
     * with user+bitgo shallow and the other two a level deeper. The node's own
     * 65-byte sample was a user+bitgo spend, which is why it saw depth 1.
     */
    it('places each leaf at the depth the taptree implies', function () {
      const expectedDepth: Record<string, number> = {
        'user+bitgo': 1,
        'user+backup': 2,
        'backup+bitgo': 2,
      };

      for (const [signer, cosigner] of [
        ['user', 'bitgo'],
        ['user', 'backup'],
        ['backup', 'bitgo'],
      ] as const) {
        const controlBlock = witnessOf(signedSpend(signer, cosigner))[3];
        const depth = (controlBlock.length - 33) / 32;
        assert.strictEqual(depth, expectedDepth[`${signer}+${cosigner}`], `${signer}+${cosigner} merkle depth`);
        assert.strictEqual(controlBlock.length, 33 + 32 * depth, 'control block must be 1 + 32 + 32*depth bytes');
      }
    });
  });

  /**
   * KNOWN DIVERGENCE - the sandbox taptree is not BitGo's taptree.
   *
   * The sandbox spends set the BIP-341 NUMS point
   * `50929b74c1a04954b78b4b6035e97a5e078a5a0f28ec96d547bfee9ace803ac0` as the
   * internal key and produced 70-byte leaf scripts. BitGo's `p2tr` chain instead
   * derives an internal key from the wallet keys and produces 68-byte leaves.
   *
   * This is BitGo's house construction rather than anything Pearl-specific -
   * building the same input for `btc` yields a byte-identical witness - but it
   * does mean the sandbox's on-chain-verified addresses and signatures describe a
   * different script than the SDK generates. So they cannot be asserted against
   * our output, and BitGo's actual Pearl taptree has not yet been accepted by a
   * pearld node.
   *
   * The assertions below pin the divergence so it is visible and cannot drift
   * unnoticed. Closing it needs a regtest broadcast of an SDK-built transaction.
   */
  describe('known divergence from the sandbox taptree', function () {
    const NUMS_INTERNAL_KEY = '50929b74c1a04954b78b4b6035e97a5e078a5a0f28ec96d547bfee9ace803ac0';

    it('does not use the NUMS internal key the sandbox used', function () {
      const controlBlock = witnessOf(signedSpend('user', 'bitgo'))[3];
      const internalKey = controlBlock.subarray(1, 33).toString('hex');
      assert.notStrictEqual(
        internalKey,
        NUMS_INTERNAL_KEY,
        'if this now matches, BitGo has moved to a NUMS internal key and the sandbox vectors became comparable'
      );
    });

    it('derives the same internal key for btc and pearl, showing it is not chain-specific', function () {
      const internalKeys = (['btc', 'pearl'] as const).map((coinName) => {
        const psbt = fixedScriptWallet.BitGoPsbt.createEmpty(coinName, walletKeys);
        psbt.addWalletInput(
          { txid: createHash('sha256').update('divergence').digest('hex'), vout: 0, value: 100_000n },
          walletKeys,
          { scriptId: { chain: 30, index: 0 }, signPath: { signer: 'user', cosigner: 'bitgo' } }
        );
        psbt.addWalletOutput(walletKeys, { chain: 31, index: 0, value: 90_000n });
        psbt.sign(xprvs[0]);
        psbt.sign(xprvs[2]);
        psbt.finalizeAllInputs();
        return witnessOf(Buffer.from(psbt.extractTransaction().toBytes()))[3].subarray(1, 33).toString('hex');
      });
      assert.strictEqual(internalKeys[0], internalKeys[1], 'internal key is derived from wallet keys, not the chain');
    });

    it('produces 68-byte leaf scripts where the sandbox produced 70', function () {
      const witness = witnessOf(signedSpend('user', 'bitgo'));
      assert.strictEqual(witness[2].length, 68, 'BitGo 2-of-2 tapleaf');
      assert.notStrictEqual(witness[2].length, 70, 'sandbox hand-rolled tapleaf');
    });
  });
});
