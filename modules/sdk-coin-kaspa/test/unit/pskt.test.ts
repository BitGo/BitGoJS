/**
 * PSKT (Partially Signed Kaspa Transaction) — Unit Tests
 *
 * Covers:
 *   - Full role flow: CREATOR → UPDATER → SIGNER → FINALIZER → EXTRACTOR
 *   - HSM / external signing path via addSignature()
 *   - Multi-party COMBINER role
 *   - serialize() / deserialize() round-trip
 *   - Extractor output matches Transaction.toBroadcastFormat()
 *   - Transaction.toPskt() and Transaction.fromPskt() bridge methods
 *   - TransactionBuilder.toPskt() unsigned PSKT construction
 *   - Role guard errors
 */

import assert from 'assert';
import { coins } from '@bitgo/statics';
import { ecc } from '@bitgo/secp256k1';
import { Pskt, PsktInput, PsktOutput } from '../../src/lib/pskt';
import { Transaction } from '../../src/lib/transaction';
import { TransactionBuilder } from '../../src/lib/transactionBuilder';
import { computeKaspaSigningHash } from '../../src/lib/sighash';
import { SIGHASH_ALL } from '../../src/lib/constants';
import { KEYS, ADDRESSES, UTXOS, TRANSACTIONS, SCRIPT_PUBLIC_KEY } from '../fixtures/kaspa.fixtures';

const PRV_KEY_BUF = Buffer.from(KEYS.prv, 'hex');
const PUB_KEY_BUF = Buffer.from(KEYS.pub, 'hex');
const X_ONLY_PUB = PUB_KEY_BUF.slice(1); // 32-byte x-only key for Schnorr verify

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makePsktInput(utxo: (typeof UTXOS)['simple']): PsktInput {
  return {
    previousOutpoint: { transactionId: utxo.transactionId, index: utxo.transactionIndex },
    utxoEntry: { amount: utxo.amount, scriptPublicKey: utxo.scriptPublicKey },
    sequence: utxo.sequence,
    sigOpCount: utxo.sigOpCount ?? 1,
    partialSigs: {},
    sighashType: SIGHASH_ALL,
    bip32Derivations: {},
    proprietaries: {},
  };
}

function makePsktOutput(): PsktOutput {
  return {
    amount: '99998000',
    scriptPublicKey: { version: 0, scriptPublicKey: SCRIPT_PUBLIC_KEY },
    bip32Derivations: {},
    proprietaries: {},
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('PSKT — role state machine', function () {
  it('enforces role transitions: CREATOR → UPDATER → SIGNER → FINALIZER → EXTRACTOR', function () {
    const pskt = Pskt.creator();
    assert.equal(pskt.role, 'CREATOR');

    const updater = pskt.toUpdater();
    assert.equal(updater.role, 'UPDATER');

    const signer = updater.input(makePsktInput(UTXOS.simple)).output(makePsktOutput()).toSigner();
    assert.equal(signer.role, 'SIGNER');

    const finalizer = signer.sign(PRV_KEY_BUF).toFinalizer();
    assert.equal(finalizer.role, 'FINALIZER');

    const extractor = finalizer.finalize().toExtractor();
    assert.equal(extractor.role, 'EXTRACTOR');
  });

  it('enforces role transitions: SIGNER → COMBINER → FINALIZER → EXTRACTOR', function () {
    const signer = Pskt.creator()
      .toUpdater()
      .input(makePsktInput(UTXOS.simple))
      .output(makePsktOutput())
      .toSigner()
      .sign(PRV_KEY_BUF);

    const combiner = signer.toCombiner();
    assert.equal(combiner.role, 'COMBINER');

    const finalizer = combiner.toFinalizer();
    assert.equal(finalizer.role, 'FINALIZER');

    const extractor = finalizer.finalize().toExtractor();
    assert.equal(extractor.role, 'EXTRACTOR');
  });

  it('throws when calling toUpdater() from SIGNER role', function () {
    const signer = Pskt.creator().toUpdater().input(makePsktInput(UTXOS.simple)).output(makePsktOutput()).toSigner();
    assert.throws(() => signer.toUpdater(), /role/i);
  });

  it('throws when calling sign() from FINALIZER role', function () {
    const finalizer = Pskt.creator()
      .toUpdater()
      .input(makePsktInput(UTXOS.simple))
      .output(makePsktOutput())
      .toSigner()
      .sign(PRV_KEY_BUF)
      .toFinalizer();
    assert.throws(() => finalizer.sign(PRV_KEY_BUF), /role/i);
  });

  it('throws toExtractor() when inputs are not finalized', function () {
    const finalizer = Pskt.creator()
      .toUpdater()
      .input(makePsktInput(UTXOS.simple))
      .output(makePsktOutput())
      .toSigner()
      .toFinalizer(); // skip signing
    assert.throws(() => finalizer.toExtractor(), /finalised|finalScriptSig/i);
  });

  it('throws finalize() when input has no partial signatures', function () {
    const finalizer = Pskt.creator()
      .toUpdater()
      .input(makePsktInput(UTXOS.simple))
      .output(makePsktOutput())
      .toSigner()
      .toFinalizer();
    assert.throws(() => finalizer.finalize(), /no partial signatures/i);
  });
});

describe('PSKT — sign() produces valid Schnorr signatures', function () {
  it('sign() writes partialSigs for each input', function () {
    const signer = Pskt.creator()
      .toUpdater()
      .input(makePsktInput(UTXOS.simple))
      .output(makePsktOutput())
      .toSigner()
      .sign(PRV_KEY_BUF);

    assert.equal(signer.inputs.length, 1);
    const sigs = Object.entries(signer.inputs[0].partialSigs);
    assert.equal(sigs.length, 1, 'should have exactly one partial sig');
    const [pubKeyHex, sigHex] = sigs[0];
    assert.equal(pubKeyHex, KEYS.pub, 'pubKey key should match');
    assert.equal(Buffer.from(sigHex, 'hex').length, 64, 'sig should be 64 bytes');
  });

  it('sign() Schnorr signatures verify against the correct per-input sighash', function () {
    const pskt = Pskt.creator()
      .toUpdater()
      .input(makePsktInput(UTXOS.simple))
      .input(makePsktInput(UTXOS.second))
      .output({
        amount: '299998000',
        scriptPublicKey: { version: 0, scriptPublicKey: SCRIPT_PUBLIC_KEY },
        bip32Derivations: {},
        proprietaries: {},
      })
      .toSigner()
      .sign(PRV_KEY_BUF);

    // Build matching KaspaTransactionData for sighash reference
    const txData = TRANSACTIONS.multiInput;

    for (let i = 0; i < pskt.inputs.length; i++) {
      const sigs = Object.values(pskt.inputs[i].partialSigs);
      assert.equal(sigs.length, 1);
      const sig = Buffer.from(sigs[0], 'hex');
      const expectedHash = computeKaspaSigningHash(txData, i, SIGHASH_ALL);
      assert.ok(ecc.verifySchnorr(expectedHash, X_ONLY_PUB, sig), `Input[${i}] Schnorr sig should verify`);
    }
  });
});

describe('PSKT — addSignature() (HSM / external signing path)', function () {
  it('addSignature() writes the provided sig into partialSigs', function () {
    const signer = Pskt.creator().toUpdater().input(makePsktInput(UTXOS.simple)).output(makePsktOutput()).toSigner();

    // Produce sig externally
    const txData = TRANSACTIONS.simple;
    const sigHash = computeKaspaSigningHash(txData, 0, SIGHASH_ALL);
    const sig = Buffer.from(ecc.signSchnorr(sigHash, PRV_KEY_BUF));
    signer.addSignature(0, KEYS.pub, sig.toString('hex'));

    const sigs = Object.entries(signer.inputs[0].partialSigs);
    assert.equal(sigs.length, 1);
    assert.equal(sigs[0][0], KEYS.pub);
    assert.equal(sigs[0][1], sig.toString('hex'));
  });

  it('addSignature() → finalize() produces a valid finalScriptSig', function () {
    const txData = TRANSACTIONS.simple;
    const sigHash = computeKaspaSigningHash(txData, 0, SIGHASH_ALL);
    const sig = Buffer.from(ecc.signSchnorr(sigHash, PRV_KEY_BUF));

    const pskt = Pskt.creator()
      .toUpdater()
      .input(makePsktInput(UTXOS.simple))
      .output(makePsktOutput())
      .toSigner()
      .addSignature(0, KEYS.pub, sig.toString('hex'))
      .toFinalizer()
      .finalize();

    const finalSig = pskt.inputs[0].finalScriptSig;
    assert.ok(finalSig, 'finalScriptSig should be set');
    const finalBuf = Buffer.from(finalSig, 'hex');
    assert.equal(finalBuf.length, 66, 'finalScriptSig should be 66 bytes (0x41 + 64-byte sig + 1-byte sighash)');
    assert.equal(finalBuf[0], 0x41, 'first byte should be OP_DATA_65');
    assert.equal(finalBuf[65], SIGHASH_ALL, 'last byte should be sighash type');
  });

  it('throws on addSignature() with wrong-sized signature', function () {
    const signer = Pskt.creator().toUpdater().input(makePsktInput(UTXOS.simple)).output(makePsktOutput()).toSigner();
    assert.throws(() => signer.addSignature(0, KEYS.pub, 'deadbeef'), /64-byte/i);
  });

  it('throws on addSignature() with out-of-range input index', function () {
    const signer = Pskt.creator().toUpdater().input(makePsktInput(UTXOS.simple)).output(makePsktOutput()).toSigner();
    assert.throws(() => signer.addSignature(99, KEYS.pub, 'aa'.repeat(64)), /out of range/i);
  });
});

describe('PSKT — combine() merges partialSigs', function () {
  it('combine() merges partial signatures from two signers', function () {
    const buildSigned = () =>
      Pskt.creator()
        .toUpdater()
        .input(makePsktInput(UTXOS.simple))
        .output(makePsktOutput())
        .toSigner()
        .sign(PRV_KEY_BUF);

    const pskt1 = buildSigned();
    const pskt2 = buildSigned();

    // Both have the same sig; combining should succeed (idempotent)
    const combined = pskt1.toCombiner().combine(pskt2);
    const sigs = Object.entries(combined.inputs[0].partialSigs);
    assert.equal(sigs.length, 1);
  });

  it('combine() throws on conflicting signatures for the same pubKey', function () {
    // Simulate two different signers by manually injecting different sigs
    const signer1 = Pskt.creator()
      .toUpdater()
      .input(makePsktInput(UTXOS.simple))
      .output(makePsktOutput())
      .toSigner()
      .addSignature(0, KEYS.pub, 'aa'.repeat(64));

    const signer2 = Pskt.creator()
      .toUpdater()
      .input(makePsktInput(UTXOS.simple))
      .output(makePsktOutput())
      .toSigner()
      .addSignature(0, KEYS.pub, 'bb'.repeat(64));

    assert.throws(() => signer1.toCombiner().combine(signer2), /conflicting signature/i);
  });

  it('combine() throws on input count mismatch', function () {
    const a = Pskt.creator()
      .toUpdater()
      .input(makePsktInput(UTXOS.simple))
      .output(makePsktOutput())
      .toSigner()
      .toCombiner();

    const b = Pskt.creator()
      .toUpdater()
      .input(makePsktInput(UTXOS.simple))
      .input(makePsktInput(UTXOS.second))
      .output(makePsktOutput())
      .toSigner()
      .toCombiner();

    assert.throws(() => a.combine(b), /input count mismatch/i);
  });
});

describe('PSKT — serialize() / deserialize() round-trip', function () {
  it('round-trips a PSKT in SIGNER role before signing', function () {
    const original = Pskt.creator().toUpdater().input(makePsktInput(UTXOS.simple)).output(makePsktOutput()).toSigner();

    const json = original.serialize();
    assert.doesNotThrow(() => JSON.parse(json), 'serialized form should be valid JSON');

    const restored = Pskt.deserialize(json);
    assert.equal(restored.role, 'SIGNER');
    assert.equal(restored.inputs.length, 1);
    assert.equal(restored.outputs.length, 1);
    assert.equal(restored.inputs[0].previousOutpoint.transactionId, UTXOS.simple.transactionId);
    assert.equal(restored.outputs[0].amount, '99998000');
  });

  it('round-trips a signed PSKT preserving partialSigs', function () {
    const signed = Pskt.creator()
      .toUpdater()
      .input(makePsktInput(UTXOS.simple))
      .output(makePsktOutput())
      .toSigner()
      .sign(PRV_KEY_BUF);

    const restored = Pskt.deserialize(signed.serialize());
    assert.equal(restored.role, 'SIGNER');
    const sigs = Object.entries(restored.inputs[0].partialSigs);
    assert.equal(sigs.length, 1, 'partialSigs should survive round-trip');
    assert.equal(sigs[0][0], KEYS.pub);
  });

  it('throws on invalid PSKT JSON', function () {
    assert.throws(() => Pskt.deserialize('not json'), /JSON/i);
    assert.throws(() => Pskt.deserialize('{}'), /missing required fields/i);
  });
});

describe('PSKT — extract() matches Transaction.toBroadcastFormat()', function () {
  it('single-input: extract() === toBroadcastFormat()', function () {
    const tx = Transaction.fromJson('kaspa', TRANSACTIONS.simple);
    tx.sign(PRV_KEY_BUF);

    // PSKT path
    const broadcastViaPskt = tx
      .toPskt() // SIGNER role, finalScriptSig already set from tx.sign()
      .toFinalizer()
      .finalize()
      .toExtractor()
      .extract();

    // Direct path
    const broadcastDirect = tx.toBroadcastFormat();

    assert.deepStrictEqual(JSON.parse(broadcastViaPskt), JSON.parse(broadcastDirect));
  });

  it('multi-input: extract() === toBroadcastFormat()', function () {
    const tx = Transaction.fromJson('kaspa', TRANSACTIONS.multiInput);
    tx.sign(PRV_KEY_BUF);

    const broadcastViaPskt = tx.toPskt().toFinalizer().finalize().toExtractor().extract();
    const broadcastDirect = tx.toBroadcastFormat();

    assert.deepStrictEqual(JSON.parse(broadcastViaPskt), JSON.parse(broadcastDirect));
  });

  it('PSKT-signed extract() === direct sign + toBroadcastFormat()', function () {
    // Build via PSKT from scratch
    const broadcastViaPskt = Pskt.creator()
      .toUpdater()
      .input(makePsktInput(UTXOS.simple))
      .output(makePsktOutput())
      .toSigner()
      .sign(PRV_KEY_BUF)
      .toFinalizer()
      .finalize()
      .toExtractor()
      .extract();

    // Build via Transaction directly
    const tx = Transaction.fromJson('kaspa', TRANSACTIONS.simple);
    tx.sign(PRV_KEY_BUF);
    const broadcastDirect = tx.toBroadcastFormat();

    assert.deepStrictEqual(JSON.parse(broadcastViaPskt), JSON.parse(broadcastDirect));
  });
});

describe('PSKT — Transaction.toPskt() and Transaction.fromPskt()', function () {
  it('toPskt() returns a SIGNER-role PSKT with UTXO data populated', function () {
    const tx = Transaction.fromJson('kaspa', TRANSACTIONS.simple);
    const pskt = tx.toPskt();
    assert.equal(pskt.role, 'SIGNER');
    assert.equal(pskt.inputs.length, 1);
    assert.equal(pskt.inputs[0].utxoEntry?.amount, UTXOS.simple.amount);
    assert.equal(pskt.inputs[0].utxoEntry?.scriptPublicKey, UTXOS.simple.scriptPublicKey);
  });

  it('fromPskt() reconstructs a Transaction from a finalised PSKT', function () {
    const original = Transaction.fromJson('kaspa', TRANSACTIONS.simple);
    original.sign(PRV_KEY_BUF);

    const pskt = original.toPskt().toFinalizer().finalize();
    const restored = Transaction.fromPskt('kaspa', pskt);

    assert.deepStrictEqual(JSON.parse(restored.toBroadcastFormat()), JSON.parse(original.toBroadcastFormat()));
  });

  it('fromPskt() → verifySignature() succeeds', function () {
    const original = Transaction.fromJson('kaspa', TRANSACTIONS.simple);
    original.sign(PRV_KEY_BUF);

    const pskt = original.toPskt().toFinalizer().finalize();
    const restored = Transaction.fromPskt('kaspa', pskt);

    assert.ok(restored.verifySignature(PUB_KEY_BUF, 0), 'signature should verify after fromPskt()');
  });
});

describe('PSKT — TransactionBuilder.toPskt()', function () {
  it('returns an UPDATER-role PSKT with all inputs and outputs', async function () {
    const coinConfig = coins.get('kaspa');
    const builder = new TransactionBuilder(coinConfig);
    builder.addInput(UTXOS.simple).to(ADDRESSES.recipient, '99998000').fee('2000');

    const pskt = await builder.toPskt();
    assert.equal(pskt.role, 'UPDATER');
    assert.equal(pskt.inputs.length, 1);
    assert.equal(pskt.outputs.length, 1);
    assert.equal(pskt.inputs[0].previousOutpoint.transactionId, UTXOS.simple.transactionId);
    assert.equal(pskt.outputs[0].amount, '99998000');
  });

  it('UPDATER PSKT can be signed and extracted to produce a valid broadcast payload', async function () {
    const coinConfig = coins.get('kaspa');
    const builder = new TransactionBuilder(coinConfig);
    builder.addInput(UTXOS.simple).to(ADDRESSES.recipient, '99998000').fee('2000');

    const broadcast = (await builder.toPskt())
      .toSigner()
      .sign(PRV_KEY_BUF)
      .toFinalizer()
      .finalize()
      .toExtractor()
      .extract();

    assert.doesNotThrow(() => JSON.parse(broadcast), 'extract() should produce valid JSON');
    const parsed = JSON.parse(broadcast);
    assert.ok(parsed.inputs[0].signatureScript, 'signatureScript should be set');
    assert.equal(Buffer.from(parsed.inputs[0].signatureScript, 'hex').length, 66);
  });

  it('PSKT from builder matches broadcast from Transaction.sign()', async function () {
    const coinConfig = coins.get('kaspa');
    const builder = new TransactionBuilder(coinConfig);
    builder.addInput(UTXOS.simple).to(ADDRESSES.recipient, '99998000').fee('2000');

    const broadcastViaPskt = (await builder.toPskt())
      .toSigner()
      .sign(PRV_KEY_BUF)
      .toFinalizer()
      .finalize()
      .toExtractor()
      .extract();

    // Rebuild via standard path
    const builder2 = new TransactionBuilder(coinConfig);
    builder2.addInput(UTXOS.simple).to(ADDRESSES.recipient, '99998000').fee('2000');
    const tx = (await builder2.build()) as Transaction;
    tx.sign(PRV_KEY_BUF);

    assert.deepStrictEqual(JSON.parse(broadcastViaPskt), JSON.parse(tx.toBroadcastFormat()));
  });
});
