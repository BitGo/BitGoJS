/**
 * Kaspa End-to-End Transaction Flow
 *
 * Covers: build → sign → serialize → deserialize → verify
 * All operations are offline (no live RPC calls).
 */

import assert from 'assert';
import { coins } from '@bitgo/statics';
import { TransactionBuilder } from '../../src/lib/transactionBuilder';
import { Transaction } from '../../src/lib/transaction';
import { KEYS, ADDRESSES, UTXOS } from '../fixtures/kaspa.fixtures';

const coinConfig = coins.get('kaspa');
const PRV_KEY_BUF = Buffer.from(KEYS.prv, 'hex');

describe('Kaspa — End-to-End Transaction Flow', function () {
  it('should build, sign, serialize, deserialize, and verify a simple transaction', async function () {
    // Step 1: Build
    const builder = new TransactionBuilder(coinConfig);
    builder.addInput(UTXOS.simple).to(ADDRESSES.recipient, '99998000').fee('2000');

    const tx = (await builder.build()) as Transaction;
    assert.ok(tx instanceof Transaction, 'build() should return a Transaction');
    assert.equal(tx.txData.inputs.length, 1, 'should have 1 input');
    assert.equal(tx.txData.outputs.length, 1, 'should have 1 output');
    assert.equal(tx.txData.outputs[0].amount, '99998000');

    // Step 2: Sign
    tx.sign(PRV_KEY_BUF);
    const sigs = tx.signature;
    assert.ok(sigs.length > 0, 'should have signatures after signing');
    assert.ok(sigs[0].length > 0, 'signature should be non-empty');

    // Step 3: Verify signature with public key
    const pubKey = Buffer.from(KEYS.pub, 'hex');
    assert.ok(tx.verifySignature(pubKey, 0), 'signature should verify against correct pubkey');

    // Step 4: Serialize to broadcast format
    const broadcastPayload = tx.toBroadcastFormat();
    assert.ok(broadcastPayload, 'toBroadcastFormat should return a non-empty string');
    assert.doesNotThrow(() => JSON.parse(broadcastPayload), 'broadcast format should be valid JSON');

    // Step 5: Serialize to hex
    const hex = tx.toHex();
    assert.ok(/^[0-9a-fA-F]+$/.test(hex), 'toHex should return valid hex');

    // Step 6: Deserialize and verify round-trip
    const reloaded = Transaction.fromHex(coinConfig.name, hex);
    assert.deepEqual(reloaded.txData.inputs, tx.txData.inputs);
    assert.deepEqual(reloaded.txData.outputs, tx.txData.outputs);
    assert.equal(reloaded.txData.fee, tx.txData.fee);

    // Step 7: Explain the transaction
    const explanation = tx.explainTransaction();
    assert.ok(explanation.outputs.length > 0, 'explanation should have outputs');
    assert.equal(explanation.outputs[0].amount, '99998000');
    assert.ok(explanation.fee, 'explanation should have fee');
  });

  it('should NOT be considered fully signed when unsigned', async function () {
    const builder = new TransactionBuilder(coinConfig);
    builder.addInput(UTXOS.simple).to(ADDRESSES.recipient, '99998000').fee('2000');

    const tx = (await builder.build()) as Transaction;
    const sigs = tx.signature;

    assert.ok(
      sigs.every((s) => s === ''),
      'unsigned transaction should have empty signature scripts'
    );

    const payload = tx.toBroadcastFormat();
    const parsed = JSON.parse(payload);
    assert.ok(!parsed.inputs[0].signatureScript, 'inputs should not have signatureScript when unsigned');
  });

  it('should sign multiple inputs independently', async function () {
    const builder = new TransactionBuilder(coinConfig);
    builder.addInputs([UTXOS.simple, UTXOS.second]).to(ADDRESSES.recipient, '299998000').fee('2000');

    const tx = (await builder.build()) as Transaction;
    tx.sign(PRV_KEY_BUF);

    const pubKey = Buffer.from(KEYS.pub, 'hex');
    assert.equal(tx.txData.inputs.length, 2);
    assert.ok(tx.verifySignature(pubKey, 0), 'first input signature should verify');
    assert.ok(tx.verifySignature(pubKey, 1), 'second input signature should verify');
  });

  it('should rebuild from serialized hex and produce identical broadcast format', async function () {
    const builder = new TransactionBuilder(coinConfig);
    builder.addInput(UTXOS.simple).to(ADDRESSES.recipient, '99998000').fee('2000');
    const tx = (await builder.build()) as Transaction;
    tx.sign(PRV_KEY_BUF);

    const originalHex = tx.toHex();
    const originalPayload = tx.toBroadcastFormat();

    const rebuilt = Transaction.fromHex(coinConfig.name, originalHex);
    const rebuiltPayload = rebuilt.toBroadcastFormat();

    assert.equal(rebuiltPayload, originalPayload, 'serialization should be deterministic');
  });

  it('should produce a valid RPC-submittable JSON broadcast payload', async function () {
    const builder = new TransactionBuilder(coinConfig);
    builder.addInput(UTXOS.simple).to(ADDRESSES.recipient, '99998000').fee('2000');
    const tx = (await builder.build()) as Transaction;
    tx.sign(PRV_KEY_BUF);

    const payload = tx.toBroadcastFormat();

    assert.ok(payload.length > 0, 'payload must be non-empty');
    const parsed = JSON.parse(payload);

    assert.ok(parsed.version !== undefined, 'must have version');
    assert.ok(Array.isArray(parsed.inputs), 'must have inputs array');
    assert.ok(Array.isArray(parsed.outputs), 'must have outputs array');
    assert.ok(parsed.inputs.length > 0, 'must have at least one input');
    assert.ok(parsed.outputs.length > 0, 'must have at least one output');

    for (const input of parsed.inputs) {
      assert.ok(input.signatureScript, 'signed input must have signatureScript');
      assert.equal(input.signatureScript.length, 130, 'Schnorr sig should be 65 bytes = 130 hex chars');
    }
  });
});
