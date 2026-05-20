import assert from 'assert';
import { Transaction } from '../../src/lib/transaction';
import { TransactionType } from '@bitgo/sdk-core';
import { SIGHASH_ALL } from '../../src/lib/constants';
import { KEYS, TRANSACTIONS } from '../fixtures/kaspa.fixtures';

const COIN = 'kaspa';

describe('Kaspa Transaction', function () {
  describe('Constructor', function () {
    it('should create an empty transaction', function () {
      const tx = new Transaction(COIN);
      assert.ok(tx);
      assert.deepEqual(tx.txData.inputs, []);
      assert.deepEqual(tx.txData.outputs, []);
    });

    it('should create a transaction from txData', function () {
      const tx = new Transaction(COIN, TRANSACTIONS.simple);
      assert.equal(tx.txData.inputs.length, 1);
      assert.equal(tx.txData.outputs.length, 1);
      assert.equal(tx.txData.fee, '2000');
    });
  });

  describe('id getter', function () {
    it('should return empty string when no id is set', function () {
      const tx = new Transaction(COIN);
      assert.equal(tx.id, '');
    });

    it('should return the transaction id if set', function () {
      const txData = { ...TRANSACTIONS.simple, id: 'deadbeef' + '00'.repeat(30) };
      const tx = new Transaction(COIN, txData);
      assert.equal(tx.id, txData.id);
    });
  });

  describe('signature getter', function () {
    it('should return empty signatures for unsigned tx', function () {
      const tx = new Transaction(COIN, TRANSACTIONS.simple);
      const sigs = tx.signature;
      assert.equal(sigs.length, TRANSACTIONS.simple.inputs.length);
      assert.ok(sigs.every((s) => s === ''));
    });

    it('should return signature scripts after signing', function () {
      const tx = new Transaction(COIN, TRANSACTIONS.simple);
      const privKey = Buffer.from(KEYS.prv, 'hex');
      tx.sign(privKey);
      const sigs = tx.signature;
      assert.equal(sigs.length, 1);
      assert.ok(sigs[0].length > 0);
    });
  });

  describe('canSign', function () {
    it('should always return true', function () {
      const tx = new Transaction(COIN, TRANSACTIONS.simple);
      assert.ok(tx.canSign({ key: KEYS.prv }));
    });
  });

  describe('sign', function () {
    it('should throw on non-32-byte private key', function () {
      const tx = new Transaction(COIN, TRANSACTIONS.simple);
      assert.throws(() => {
        tx.sign(Buffer.from('0102', 'hex'));
      }, /32-byte/);
    });

    it('should sign all inputs with a valid private key', function () {
      const tx = new Transaction(COIN, { ...TRANSACTIONS.simple });
      const privKey = Buffer.from(KEYS.prv, 'hex');
      tx.sign(privKey);
      for (const input of tx.txData.inputs) {
        assert.ok(input.signatureScript, 'Each input should have a signatureScript');
        assert.ok((input.signatureScript as string).length > 0);
      }
    });

    it('should sign multiple inputs', function () {
      const tx = new Transaction(COIN, TRANSACTIONS.multiInput);
      const privKey = Buffer.from(KEYS.prv, 'hex');
      tx.sign(privKey);
      assert.equal(tx.txData.inputs.length, 2);
      for (const input of tx.txData.inputs) {
        assert.ok(input.signatureScript && input.signatureScript.length > 0);
      }
    });

    it('should produce 65-byte signatures (64 Schnorr + 1 sighash type)', function () {
      const tx = new Transaction(COIN, TRANSACTIONS.simple);
      const privKey = Buffer.from(KEYS.prv, 'hex');
      tx.sign(privKey);
      const sigHex = tx.txData.inputs[0].signatureScript ?? '';
      // 66 bytes = 132 hex chars: 0x41 push opcode (1) + 64-byte sig + 1-byte sighash type
      assert.equal(sigHex.length, 132);
      // Last byte is sighash type (0x01 = SIGHASH_ALL)
      const lastByte = parseInt(sigHex.slice(-2), 16);
      assert.equal(lastByte, SIGHASH_ALL);
    });
  });

  describe('verifySignature', function () {
    it('should return false for unsigned input', function () {
      const tx = new Transaction(COIN, TRANSACTIONS.simple);
      const pubKey = Buffer.from(KEYS.pub, 'hex');
      assert.equal(tx.verifySignature(pubKey, 0), false);
    });

    it('should return true after signing with matching key', function () {
      const tx = new Transaction(COIN, TRANSACTIONS.simple);
      const privKey = Buffer.from(KEYS.prv, 'hex');
      tx.sign(privKey);
      const pubKey = Buffer.from(KEYS.pub, 'hex');
      assert.ok(tx.verifySignature(pubKey, 0));
    });

    it('should accept x-only (32-byte) public key', function () {
      const tx = new Transaction(COIN, TRANSACTIONS.simple);
      const privKey = Buffer.from(KEYS.prv, 'hex');
      tx.sign(privKey);
      const xOnlyPub = Buffer.from(KEYS.pub, 'hex').slice(1);
      assert.ok(tx.verifySignature(xOnlyPub, 0));
    });

    it('should return false for wrong public key', function () {
      const tx = new Transaction(COIN, TRANSACTIONS.simple);
      const privKey = Buffer.from(KEYS.prv, 'hex');
      tx.sign(privKey);
      const wrongPub = Buffer.from('02' + 'ab'.repeat(32), 'hex');
      assert.equal(tx.verifySignature(wrongPub, 0), false);
    });

    it('should return false for out-of-range input index', function () {
      const tx = new Transaction(COIN, TRANSACTIONS.simple);
      const privKey = Buffer.from(KEYS.prv, 'hex');
      tx.sign(privKey);
      const pubKey = Buffer.from(KEYS.pub, 'hex');
      assert.equal(tx.verifySignature(pubKey, 99), false);
    });
  });

  // ── ECDSA (v1 address) signing ────────────────────────────────────────────
  //
  // These tests cover the auto-detection path in sign() / verifySignature() /
  // signablePayloads when the input's scriptPublicKey ends with 0xAB (ECDSA).

  describe('sign (ECDSA inputs)', function () {
    it('should sign a single ECDSA input', function () {
      const tx = new Transaction(COIN, TRANSACTIONS.simpleEcdsa);
      const privKey = Buffer.from(KEYS.prv, 'hex');
      tx.sign(privKey);
      const sigScript = tx.txData.inputs[0].signatureScript ?? '';
      assert.ok(sigScript.length > 0, 'ECDSA input should have a signatureScript');
      // 66 bytes = 132 hex chars: 0x41 + 64-byte sig + 1-byte sighash type
      assert.equal(sigScript.length, 132);
      assert.equal(parseInt(sigScript.slice(-2), 16), SIGHASH_ALL);
    });

    it('should sign multiple ECDSA inputs', function () {
      const tx = new Transaction(COIN, TRANSACTIONS.multiInputEcdsa);
      const privKey = Buffer.from(KEYS.prv, 'hex');
      tx.sign(privKey);
      assert.equal(tx.txData.inputs.length, 2);
      for (const input of tx.txData.inputs) {
        assert.ok(input.signatureScript && input.signatureScript.length > 0);
      }
    });

    it('should produce distinct sighashes for ECDSA vs Schnorr inputs on the same key', function () {
      const schnorrTx = new Transaction(COIN, TRANSACTIONS.simple);
      const ecdsaTx = new Transaction(COIN, TRANSACTIONS.simpleEcdsa);
      const [schnorrHash] = schnorrTx.signablePayloads;
      const [ecdsaHash] = ecdsaTx.signablePayloads;
      assert.ok(!schnorrHash.equals(ecdsaHash), 'ECDSA and Schnorr hashes must differ');
    });
  });

  describe('verifySignature (ECDSA inputs)', function () {
    it('should verify a valid ECDSA signature with compressed pubkey', function () {
      const tx = new Transaction(COIN, TRANSACTIONS.simpleEcdsa);
      tx.sign(Buffer.from(KEYS.prv, 'hex'));
      const pubKey = Buffer.from(KEYS.pub, 'hex');
      assert.ok(tx.verifySignature(pubKey, 0), 'ECDSA signature should verify');
    });

    it('should return false for wrong public key on ECDSA input', function () {
      const tx = new Transaction(COIN, TRANSACTIONS.simpleEcdsa);
      tx.sign(Buffer.from(KEYS.prv, 'hex'));
      const wrongPub = Buffer.from('02' + 'ab'.repeat(32), 'hex');
      assert.equal(tx.verifySignature(wrongPub, 0), false);
    });

    it('should verify all inputs in a multi-input ECDSA transaction', function () {
      const tx = new Transaction(COIN, TRANSACTIONS.multiInputEcdsa);
      tx.sign(Buffer.from(KEYS.prv, 'hex'));
      const pubKey = Buffer.from(KEYS.pub, 'hex');
      assert.ok(tx.verifySignature(pubKey, 0));
      assert.ok(tx.verifySignature(pubKey, 1));
    });
  });

  describe('sign + verifySignature (mixed Schnorr + ECDSA inputs)', function () {
    it('should sign and verify each input with the correct algorithm', function () {
      const tx = new Transaction(COIN, TRANSACTIONS.mixedSchnorrEcdsa);
      const privKey = Buffer.from(KEYS.prv, 'hex');
      tx.sign(privKey);

      assert.equal(tx.txData.inputs.length, 2, 'should have 2 inputs');

      const pubKey = Buffer.from(KEYS.pub, 'hex');
      // input[0] is Schnorr (scriptPublicKey ends 0xAC)
      assert.ok(tx.verifySignature(pubKey, 0), 'Schnorr input[0] should verify');
      // input[1] is ECDSA (scriptPublicKey ends 0xAB)
      assert.ok(tx.verifySignature(pubKey, 1), 'ECDSA input[1] should verify');
    });

    it('should produce different script types for Schnorr and ECDSA inputs', function () {
      const tx = new Transaction(COIN, TRANSACTIONS.mixedSchnorrEcdsa);
      tx.sign(Buffer.from(KEYS.prv, 'hex'));
      // Both produce 66-byte (132 hex char) scriptSigs but via different algorithms —
      // the last opcode of their scriptPublicKey is the differentiator.
      assert.equal((tx.txData.inputs[0].signatureScript ?? '').length, 132);
      assert.equal((tx.txData.inputs[1].signatureScript ?? '').length, 132);
      // The signatures themselves should differ (different sighash algorithm)
      assert.notEqual(tx.txData.inputs[0].signatureScript, tx.txData.inputs[1].signatureScript);
    });
  });

  describe('signablePayloads (ECDSA inputs)', function () {
    it('should return a 32-byte hash for a single ECDSA input', function () {
      const tx = new Transaction(COIN, TRANSACTIONS.simpleEcdsa);
      const [hash] = tx.signablePayloads;
      assert.ok(Buffer.isBuffer(hash));
      assert.equal(hash.length, 32);
    });

    it('should return distinct hashes for each ECDSA input', function () {
      const tx = new Transaction(COIN, TRANSACTIONS.multiInputEcdsa);
      const [h0, h1] = tx.signablePayloads;
      assert.ok(!h0.equals(h1));
    });

    it('should return different hashes for Schnorr and ECDSA inputs on the same index', function () {
      const schnorrTx = new Transaction(COIN, TRANSACTIONS.simple);
      const ecdsaTx = new Transaction(COIN, TRANSACTIONS.simpleEcdsa);
      // Both transactions have the same structure except scriptPublicKey type.
      // The ECDSA hash applies an additional SHA256 step so the result must differ.
      assert.ok(!schnorrTx.signablePayloads[0].equals(ecdsaTx.signablePayloads[0]));
    });

    it('mixed tx: Schnorr hash at index 0, ECDSA hash at index 1 — both 32 bytes', function () {
      const tx = new Transaction(COIN, TRANSACTIONS.mixedSchnorrEcdsa);
      const [h0, h1] = tx.signablePayloads;
      assert.equal(h0.length, 32);
      assert.equal(h1.length, 32);
      assert.ok(!h0.equals(h1));
    });
  });

  describe('explainTransaction', function () {
    it('should return a TransactionExplanation with correct fields', function () {
      const tx = new Transaction(COIN, TRANSACTIONS.simple);
      const explanation = tx.explainTransaction();

      assert.equal(explanation.id, '');
      assert.equal(explanation.type, TransactionType.Send);
      assert.equal(explanation.outputs.length, 1);
      assert.equal(explanation.outputs[0].amount, '99998000');
      assert.equal(explanation.inputs.length, 1);
      assert.equal(explanation.inputs[0].amount, '100000000');
    });

    it('should calculate the fee as totalIn - totalOut', function () {
      const tx = new Transaction(COIN, TRANSACTIONS.simple);
      const explanation = tx.explainTransaction();
      // fee = 100000000 - 99998000 = 2000
      assert.equal(explanation.fee.fee, '2000');
    });

    it('should sum all outputs in outputAmount', function () {
      const tx = new Transaction(COIN, TRANSACTIONS.multiInput);
      const explanation = tx.explainTransaction();
      assert.equal(explanation.outputAmount, '299998000');
    });
  });

  describe('fee', function () {
    it('should return explicit fee when set in txData', function () {
      const tx = new Transaction(COIN, TRANSACTIONS.simple);
      assert.equal(tx.fee, '2000');
    });

    it('should compute fee from inputs - outputs when fee is not set', function () {
      const txData = { ...TRANSACTIONS.simple };
      delete txData.fee;
      const tx = new Transaction(COIN, txData);
      // input: 100000000, output: 99998000, fee = 2000
      assert.equal(tx.fee, '2000');
    });
  });

  describe('signablePayloads', function () {
    it('should return one Buffer per input', function () {
      const tx = new Transaction(COIN, TRANSACTIONS.simple);
      const payloads = tx.signablePayloads;
      assert.equal(payloads.length, 1);
      assert.ok(Buffer.isBuffer(payloads[0]));
      assert.equal(payloads[0].length, 32);
    });

    it('should return two Buffers for a two-input transaction', function () {
      const tx = new Transaction(COIN, TRANSACTIONS.multiInput);
      const payloads = tx.signablePayloads;
      assert.equal(payloads.length, 2);
      for (const p of payloads) {
        assert.ok(Buffer.isBuffer(p));
        assert.equal(p.length, 32);
      }
    });

    it('should return distinct hashes for each input in a multi-input tx', function () {
      const tx = new Transaction(COIN, TRANSACTIONS.multiInput);
      const [p0, p1] = tx.signablePayloads;
      assert.ok(!p0.equals(p1), 'per-input sighashes must differ (each commits to its own index)');
    });

    it('should throw when transaction has no inputs', function () {
      const tx = new Transaction(COIN);
      assert.throws(() => {
        tx.signablePayloads;
      }, /no inputs/);
    });

    it('should be deterministic for the same transaction data', function () {
      const tx1 = new Transaction(COIN, TRANSACTIONS.multiInput);
      const tx2 = new Transaction(COIN, TRANSACTIONS.multiInput);
      const [a0, a1] = tx1.signablePayloads;
      const [b0, b1] = tx2.signablePayloads;
      assert.ok(a0.equals(b0));
      assert.ok(a1.equals(b1));
    });
  });

  describe('addSignatureForInput', function () {
    it('should write the signature only to the specified input', function () {
      const tx = new Transaction(COIN, TRANSACTIONS.multiInput);
      const fakeSig = Buffer.alloc(64, 0xaa);
      tx.addSignatureForInput(0, KEYS.pub, fakeSig);

      assert.ok(tx.txData.inputs[0].signatureScript, 'input[0] should be signed');
      assert.equal(tx.txData.inputs[1].signatureScript, undefined, 'input[1] should remain unsigned');
    });

    it('should write different signatures to different inputs independently', function () {
      const tx = new Transaction(COIN, TRANSACTIONS.multiInput);
      const sig0 = Buffer.alloc(64, 0xaa);
      const sig1 = Buffer.alloc(64, 0xbb);

      tx.addSignatureForInput(0, KEYS.pub, sig0);
      tx.addSignatureForInput(1, KEYS.pub, sig1);

      assert.notEqual(
        tx.txData.inputs[0].signatureScript,
        tx.txData.inputs[1].signatureScript,
        'each input should carry its own signature script'
      );
    });

    it('should produce a 66-byte script (push opcode + 64 sig + 1 sighash type) for the target input', function () {
      const tx = new Transaction(COIN, TRANSACTIONS.multiInput);
      tx.addSignatureForInput(1, KEYS.pub, Buffer.alloc(64, 0xcc));
      // 66 bytes = 132 hex chars: 0x41 push opcode + 64-byte sig + 1-byte sighash type
      assert.equal((tx.txData.inputs[1].signatureScript ?? '').length, 132);
    });

    it('should append SIGHASH_ALL byte by default', function () {
      const tx = new Transaction(COIN, TRANSACTIONS.simple);
      tx.addSignatureForInput(0, KEYS.pub, Buffer.alloc(64, 0xdd));
      const lastByte = parseInt((tx.txData.inputs[0].signatureScript ?? '').slice(-2), 16);
      assert.equal(lastByte, SIGHASH_ALL);
    });

    it('should produce a verifiable signature when given the correct Schnorr sig for that input', function () {
      const tx = new Transaction(COIN, TRANSACTIONS.multiInput);
      const privKey = Buffer.from(KEYS.prv, 'hex');

      // sign() computes the correct per-input sighash internally
      tx.sign(privKey);
      // Skip the leading 0x41 push opcode (2 hex chars), read the next 64 bytes (128 hex chars)
      const sig0 = Buffer.from((tx.txData.inputs[0].signatureScript ?? '').slice(2, 130), 'hex');
      const sig1 = Buffer.from((tx.txData.inputs[1].signatureScript ?? '').slice(2, 130), 'hex');

      // Rebuild unsigned and apply via addSignatureForInput
      const tx2 = new Transaction(COIN, TRANSACTIONS.multiInput);
      tx2.addSignatureForInput(0, KEYS.pub, sig0);
      tx2.addSignatureForInput(1, KEYS.pub, sig1);

      const pubKey = Buffer.from(KEYS.pub, 'hex');
      assert.ok(tx2.verifySignature(pubKey, 0), 'input[0] signature should verify');
      assert.ok(tx2.verifySignature(pubKey, 1), 'input[1] signature should verify');
    });

    it('should throw for an out-of-range index', function () {
      const tx = new Transaction(COIN, TRANSACTIONS.simple);
      assert.throws(() => {
        tx.addSignatureForInput(5, KEYS.pub, Buffer.alloc(64));
      }, /out of range/);
    });

    it('should throw for a negative index', function () {
      const tx = new Transaction(COIN, TRANSACTIONS.simple);
      assert.throws(() => {
        tx.addSignatureForInput(-1, KEYS.pub, Buffer.alloc(64));
      }, /out of range/);
    });

    it('should throw for a non-64-byte signature', function () {
      const tx = new Transaction(COIN, TRANSACTIONS.simple);
      assert.throws(() => {
        tx.addSignatureForInput(0, KEYS.pub, Buffer.alloc(32));
      }, /64-byte/);
    });
  });

  describe('Serialization', function () {
    it('toJson should return a copy of txData', function () {
      const tx = new Transaction(COIN, TRANSACTIONS.simple);
      const json = tx.toJson();
      assert.deepEqual(json, TRANSACTIONS.simple);
      assert.notEqual(json, tx.txData);
    });

    it('toBroadcastFormat should return a REST API JSON string', function () {
      const tx = new Transaction(COIN, TRANSACTIONS.simple);
      const broadcast = tx.toBroadcastFormat();
      assert.equal(typeof broadcast, 'string');
      const parsed = JSON.parse(broadcast);
      assert.equal(parsed.version, 0);
      assert.equal(parsed.inputs.length, 1);
      // REST API shape: inputs use previousOutpoint
      assert.ok(parsed.inputs[0].previousOutpoint, 'inputs should use previousOutpoint');
      assert.equal(parsed.inputs[0].transactionId, undefined, 'transactionId should not be at root of input');
      // REST API shape: outputs use scriptPublicKey object
      assert.equal(typeof parsed.outputs[0].scriptPublicKey, 'object');
      assert.equal(parsed.outputs[0].scriptPublicKey.version, 0);
    });

    it('toBroadcastFormat should include required wire fields', function () {
      const tx = new Transaction(COIN, TRANSACTIONS.simple);
      const parsed = JSON.parse(tx.toBroadcastFormat());
      assert.equal(parsed.lockTime, 0);
      assert.equal(parsed.subnetworkId, '0000000000000000000000000000000000000000');
      assert.equal(parsed.gas, 0);
      assert.equal(parsed.payload, '');
    });

    it('toBroadcastFormat should include signatureScript after signing', function () {
      const tx = new Transaction(COIN, TRANSACTIONS.simple);
      tx.sign(Buffer.from(KEYS.prv, 'hex'));
      const parsed = JSON.parse(tx.toBroadcastFormat());
      assert.ok(parsed.inputs[0].signatureScript.length > 0);
    });

    it('toHex should return hex-encoded internal JSON (for round-trips)', function () {
      const tx = new Transaction(COIN, TRANSACTIONS.simple);
      const hex = tx.toHex();
      assert.ok(/^[0-9a-fA-F]+$/.test(hex));
      const decoded = JSON.parse(Buffer.from(hex, 'hex').toString());
      // Internal format: transactionId at root of input (not previousOutpoint)
      assert.equal(decoded.inputs[0].transactionId, TRANSACTIONS.simple.inputs[0].transactionId);
      assert.equal(decoded.inputs[0].amount, TRANSACTIONS.simple.inputs[0].amount);
    });

    it('toHex and toBroadcastFormat produce different formats', function () {
      const tx = new Transaction(COIN, TRANSACTIONS.simple);
      const internalHex = tx.toHex();
      const broadcastHex = Buffer.from(tx.toBroadcastFormat()).toString('hex');
      assert.notEqual(internalHex, broadcastHex);
    });

    it('fromHex should reconstruct the transaction', function () {
      const original = new Transaction(COIN, TRANSACTIONS.simple);
      const hex = original.toHex();
      const restored = Transaction.fromHex(COIN, hex);
      assert.deepEqual(restored.toJson(), original.toJson());
    });

    it('fromJson should reconstruct from object', function () {
      const original = new Transaction(COIN, TRANSACTIONS.simple);
      const json = original.toJson();
      const restored = Transaction.fromJson(COIN, json);
      assert.deepEqual(restored.toJson(), json);
    });

    it('fromJson should reconstruct from string', function () {
      const original = new Transaction(COIN, TRANSACTIONS.simple);
      const jsonStr = JSON.stringify(original.toJson());
      const restored = Transaction.fromJson(COIN, jsonStr);
      assert.deepEqual(restored.toJson(), original.toJson());
    });

    it('round-trip through toHex/fromHex should preserve signatures', function () {
      const tx = new Transaction(COIN, TRANSACTIONS.simple);
      const privKey = Buffer.from(KEYS.prv, 'hex');
      tx.sign(privKey);

      const hex = tx.toHex();
      const restored = Transaction.fromHex(COIN, hex);

      assert.deepEqual(restored.signature, tx.signature);
    });
  });

  describe('toBroadcastFormat (REST API shape)', function () {
    it('should map inputs to previousOutpoint shape', function () {
      const tx = new Transaction(COIN, TRANSACTIONS.simple);
      const api = JSON.parse(tx.toBroadcastFormat());

      assert.equal(api.inputs.length, 1);
      assert.ok(api.inputs[0].previousOutpoint, 'input should have previousOutpoint');
      assert.equal(api.inputs[0].previousOutpoint.transactionId, TRANSACTIONS.simple.inputs[0].transactionId);
      assert.equal(api.inputs[0].previousOutpoint.index, TRANSACTIONS.simple.inputs[0].transactionIndex);
    });

    it('should not include amount or scriptPublicKey on inputs', function () {
      const tx = new Transaction(COIN, TRANSACTIONS.simple);
      const api = JSON.parse(tx.toBroadcastFormat());

      assert.equal(api.inputs[0].amount, undefined);
      assert.equal(api.inputs[0].scriptPublicKey, undefined);
    });

    it('should map outputs to scriptPublicKey object shape', function () {
      const tx = new Transaction(COIN, TRANSACTIONS.simple);
      const api = JSON.parse(tx.toBroadcastFormat());

      assert.equal(api.outputs.length, 1);
      assert.equal(typeof api.outputs[0].scriptPublicKey, 'object');
      assert.equal(api.outputs[0].scriptPublicKey.version, 0);
      assert.ok(typeof api.outputs[0].scriptPublicKey.scriptPublicKey === 'string');
      assert.equal(api.outputs[0].amount, Number(TRANSACTIONS.simple.outputs[0].amount));
    });

    it('should include signatureScript as empty string for unsigned inputs', function () {
      const tx = new Transaction(COIN, TRANSACTIONS.simple);
      const api = JSON.parse(tx.toBroadcastFormat());

      assert.equal(api.inputs[0].signatureScript, '');
    });

    it('should handle multi-input transactions', function () {
      const tx = new Transaction(COIN, TRANSACTIONS.multiInput);
      const api = JSON.parse(tx.toBroadcastFormat());

      assert.equal(api.inputs.length, 2);
      assert.equal(api.inputs[0].previousOutpoint.transactionId, TRANSACTIONS.multiInput.inputs[0].transactionId);
      assert.equal(api.inputs[1].previousOutpoint.transactionId, TRANSACTIONS.multiInput.inputs[1].transactionId);
    });
  });
});
