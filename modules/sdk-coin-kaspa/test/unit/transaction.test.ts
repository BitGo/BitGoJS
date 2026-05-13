import assert from 'assert';
import { Transaction } from '../../src/lib/transaction';
import { TransactionType } from '@bitgo/sdk-core';
import { SIGHASH_ALL } from '../../src/lib/sighash';
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
        assert.ok(input.signatureScript!.length > 0);
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
      const sigHex = tx.txData.inputs[0].signatureScript!;
      // 65 bytes = 130 hex chars
      assert.equal(sigHex.length, 130);
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

  describe('getFee', function () {
    it('should return explicit fee when set in txData', function () {
      const tx = new Transaction(COIN, TRANSACTIONS.simple);
      assert.equal(tx.getFee, '2000');
    });

    it('should compute fee from inputs - outputs when fee is not set', function () {
      const txData = { ...TRANSACTIONS.simple };
      delete txData.fee;
      const tx = new Transaction(COIN, txData);
      // input: 100000000, output: 99998000, fee = 2000
      assert.equal(tx.getFee, '2000');
    });
  });

  describe('signablePayload', function () {
    it('should return a 32-byte Buffer (Blake2b hash)', function () {
      const tx = new Transaction(COIN, TRANSACTIONS.simple);
      const payload = tx.signablePayload;
      assert.ok(Buffer.isBuffer(payload));
      assert.equal(payload.length, 32);
    });

    it('should throw when transaction has no inputs', function () {
      const tx = new Transaction(COIN);
      assert.throws(() => {
        tx.signablePayload;
      }, /no inputs/);
    });

    it('should return deterministic hash for same transaction data', function () {
      const tx1 = new Transaction(COIN, TRANSACTIONS.simple);
      const tx2 = new Transaction(COIN, TRANSACTIONS.simple);
      assert.ok(tx1.signablePayload.equals(tx2.signablePayload));
    });

    it('should return different hashes for different transactions', function () {
      const tx1 = new Transaction(COIN, TRANSACTIONS.simple);
      const tx2 = new Transaction(COIN, TRANSACTIONS.multiInput);
      assert.ok(!tx1.signablePayload.equals(tx2.signablePayload));
    });
  });

  describe('addSignature', function () {
    it('should apply a 64-byte Schnorr signature to all inputs', function () {
      const tx = new Transaction(COIN, TRANSACTIONS.simple);
      const fakeSig = Buffer.alloc(64, 0xab);
      tx.addSignature(KEYS.pub, fakeSig);

      assert.equal(tx.txData.inputs.length, 1);
      assert.ok(tx.txData.inputs[0].signatureScript);
      // 65 bytes = 130 hex chars (64 sig + 1 sighash type)
      assert.equal(tx.txData.inputs[0].signatureScript!.length, 130);
    });

    it('should apply signature to all inputs of a multi-input tx', function () {
      const tx = new Transaction(COIN, TRANSACTIONS.multiInput);
      const fakeSig = Buffer.alloc(64, 0xcd);
      tx.addSignature(KEYS.pub, fakeSig);

      assert.equal(tx.txData.inputs.length, 2);
      for (const input of tx.txData.inputs) {
        assert.ok(input.signatureScript);
        assert.equal(input.signatureScript!.length, 130);
      }
    });

    it('should throw for non-64-byte signature', function () {
      const tx = new Transaction(COIN, TRANSACTIONS.simple);
      assert.throws(() => {
        tx.addSignature(KEYS.pub, Buffer.alloc(32));
      }, /64-byte/);
    });

    it('should append SIGHASH_ALL byte at the end', function () {
      const tx = new Transaction(COIN, TRANSACTIONS.simple);
      const fakeSig = Buffer.alloc(64, 0xab);
      tx.addSignature(KEYS.pub, fakeSig);
      const sigHex = tx.txData.inputs[0].signatureScript!;
      const lastByte = parseInt(sigHex.slice(-2), 16);
      assert.equal(lastByte, SIGHASH_ALL);
    });

    it('should produce a signature that verifies when signed with the correct private key', function () {
      const tx = new Transaction(COIN, TRANSACTIONS.simple);
      // Sign properly with private key to get a real signature
      const privKey = Buffer.from(KEYS.prv, 'hex');
      tx.sign(privKey);
      const realSigHex = tx.txData.inputs[0].signatureScript!;
      const realSig = Buffer.from(realSigHex.slice(0, 128), 'hex'); // 64-byte Schnorr sig

      // Now create a fresh tx and use addSignature instead
      const tx2 = new Transaction(COIN, TRANSACTIONS.simple);
      tx2.addSignature(KEYS.pub, realSig);

      // The signature scripts should match (same sig bytes + same sighash type)
      assert.equal(tx2.txData.inputs[0].signatureScript, tx.txData.inputs[0].signatureScript);
    });
  });

  describe('Serialization', function () {
    it('toJson should return a copy of txData', function () {
      const tx = new Transaction(COIN, TRANSACTIONS.simple);
      const json = tx.toJson();
      assert.deepEqual(json, TRANSACTIONS.simple);
      assert.notEqual(json, tx.txData);
    });

    it('toBroadcastFormat should return a JSON string', function () {
      const tx = new Transaction(COIN, TRANSACTIONS.simple);
      const broadcast = tx.toBroadcastFormat();
      assert.equal(typeof broadcast, 'string');
      const parsed = JSON.parse(broadcast);
      assert.equal(parsed.version, 0);
      assert.equal(parsed.inputs.length, 1);
    });

    it('toHex should return hex-encoded JSON', function () {
      const tx = new Transaction(COIN, TRANSACTIONS.simple);
      const hex = tx.toHex();
      assert.ok(/^[0-9a-fA-F]+$/.test(hex));
      const decoded = Buffer.from(hex, 'hex').toString();
      const parsed = JSON.parse(decoded);
      assert.equal(parsed.version, 0);
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
});
