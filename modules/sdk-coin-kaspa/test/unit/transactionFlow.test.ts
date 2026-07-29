/**
 * Kaspa End-to-End Transaction Flow
 *
 * Covers: build → sign → serialize → deserialize → verify
 * All operations are offline (no live RPC calls).
 */

import assert from 'assert';
import { coins } from '@bitgo/statics';
import { ecc } from '@bitgo/secp256k1';
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

  it('HSM flow — build unsigned → serialize → extract sighashes → apply external signatures → verify', async function () {
    const prv = Buffer.from(KEYS.prv, 'hex');
    const pub = Buffer.from(KEYS.pub, 'hex');

    // Step 1: Build an unsigned 2-input transaction
    const builder = new TransactionBuilder(coinConfig);
    builder.addInputs([UTXOS.simple, UTXOS.second]).to(ADDRESSES.recipient, '299996000').fee('4000');
    const unsignedTx = (await builder.build()) as Transaction;

    // Step 2: Serialize to hex — this is what gets sent to the HSM
    const unsignedHex = unsignedTx.toHex();
    assert.ok(
      unsignedTx.signature.every((s) => s === ''),
      'must be unsigned before leaving SDK'
    );

    // Step 3: HSM receives the hex, deserializes it, reads per-input sighashes
    const txForHsm = Transaction.fromHex(coinConfig.name, unsignedHex);
    const sighashes = txForHsm.signablePayloads; // Buffer[2] — one message per input
    assert.equal(sighashes.length, 2);
    assert.ok(!sighashes[0].equals(sighashes[1]), 'each input has a distinct sighash');

    // Step 4: HSM signs each sighash independently (Schnorr)
    // In production this is a DKLS / HSM operation; here we use the raw key directly
    const externalSig0 = Buffer.from(ecc.signSchnorr(sighashes[0], prv)); // 64 bytes
    const externalSig1 = Buffer.from(ecc.signSchnorr(sighashes[1], prv)); // 64 bytes
    assert.equal(externalSig0.length, 64);
    assert.equal(externalSig1.length, 64);
    assert.ok(!externalSig0.equals(externalSig1), 'signatures over distinct hashes must differ');

    // Step 5: Apply the external signatures to a fresh deserialized tx
    const txToSign = Transaction.fromHex(coinConfig.name, unsignedHex);
    txToSign.addSignatureForInput(0, KEYS.pub, externalSig0);
    txToSign.addSignatureForInput(1, KEYS.pub, externalSig1);

    // Step 6: Cryptographically verify each input's Schnorr signature
    assert.ok(txToSign.verifySignature(pub, 0), 'input[0] Schnorr signature must be valid');
    assert.ok(txToSign.verifySignature(pub, 1), 'input[1] Schnorr signature must be valid');

    // Step 7: Serialize the fully-signed tx for broadcast
    const signedHex = txToSign.toHex();
    const broadcast = txToSign.toBroadcastFormat();
    const rpc = JSON.parse(broadcast);
    assert.equal(
      rpc.inputs[0].signatureScript.length,
      132,
      '66-byte script = 132 hex chars (push opcode + sig + sighash)'
    );
    assert.equal(rpc.inputs[1].signatureScript.length, 132);

    // Step 8: Round-trip — reload from hex and confirm signatures are intact
    const reloaded = Transaction.fromHex(coinConfig.name, signedHex);
    assert.ok(reloaded.verifySignature(pub, 0), 'input[0] must still verify after round-trip');
    assert.ok(reloaded.verifySignature(pub, 1), 'input[1] must still verify after round-trip');
  });

  it('should build and sign a transaction with multiple outputs (send + change)', async function () {
    // Simulate a common real-world pattern: one recipient output + one change output
    const builder = new TransactionBuilder(coinConfig);
    builder
      .addInput(UTXOS.simple) // 1 KASPA input
      .to(ADDRESSES.recipient, '50000000') // send 0.5 KASPA
      .to(ADDRESSES.sender, '49998000') // change back 0.49998 KASPA
      .fee('2000');

    const tx = (await builder.build()) as Transaction;
    assert.equal(tx.txData.inputs.length, 1);
    assert.equal(tx.txData.outputs.length, 2);
    assert.equal(tx.txData.outputs[0].amount, '50000000');
    assert.equal(tx.txData.outputs[1].amount, '49998000');

    // Sign and verify both outputs survive serialization
    tx.sign(PRV_KEY_BUF);
    const explanation = tx.explainTransaction();
    assert.equal(explanation.outputs.length, 2);
    assert.equal(explanation.outputAmount, '99998000'); // sum of both outputs

    // Round-trip
    const reloaded = Transaction.fromHex(coinConfig.name, tx.toHex());
    assert.equal(reloaded.txData.outputs.length, 2);
    assert.equal(reloaded.txData.outputs[0].amount, '50000000');
    assert.equal(reloaded.txData.outputs[1].amount, '49998000');
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
      assert.equal(input.signatureScript.length, 132, '66-byte script = 132 hex chars (push opcode + sig + sighash)');
    }
  });
});
