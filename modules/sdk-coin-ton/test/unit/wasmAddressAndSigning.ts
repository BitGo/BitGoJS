import assert from 'assert';
import { Transaction as WasmTonTransaction, encodeAddress, validateAddress, parseTransaction } from '@bitgo/wasm-ton';
import utils from '../../src/lib/utils';
import * as testData from '../resources/ton';

describe('WASM address operations', function () {
  it('should derive address from public key matching legacy derivation', async function () {
    const pubKeyHex = testData.sender.publicKey;
    const wasmAddress = encodeAddress(Buffer.from(pubKeyHex, 'hex'), true);
    const legacyAddress = await utils.getAddressFromPublicKey(pubKeyHex, true);
    assert.strictEqual(wasmAddress, legacyAddress);
  });

  it('should derive non-bounceable address from public key', async function () {
    const pubKeyHex = testData.sender.publicKey;
    const wasmAddress = encodeAddress(Buffer.from(pubKeyHex, 'hex'), false);
    assert.ok(wasmAddress);
    assert.strictEqual(wasmAddress.length, 48);
  });

  it('should validate valid addresses', function () {
    for (const addr of testData.addresses.validAddresses) {
      assert.strictEqual(validateAddress(addr), true, `Expected ${addr} to be valid`);
    }
  });

  it('should reject invalid addresses', function () {
    for (const addr of testData.addresses.invalidAddresses) {
      assert.strictEqual(validateAddress(addr), false, `Expected ${addr} to be invalid`);
    }
  });

  it('should validate address with memoId via Utils', function () {
    const addr = testData.addresses.validAddresses[0] + '?memoId=1234';
    assert.strictEqual(utils.isValidAddress(addr), true);
  });
});

describe('WASM signing flow', function () {
  it('should extract signable payload from a transaction', function () {
    const txBase64 = testData.signedSendTransaction.tx;
    const tx = WasmTonTransaction.fromBase64(txBase64);
    const payload = tx.signablePayload();
    assert.ok(payload instanceof Uint8Array);
    assert.strictEqual(payload.length, 32);

    // Compare with known signable from fixtures
    const expectedSignable = Buffer.from(testData.signedSendTransaction.signable, 'base64');
    assert.deepStrictEqual(Buffer.from(payload), expectedSignable);
  });

  it('should round-trip a transaction through fromBase64 and toBroadcastFormat', function () {
    const txBase64 = testData.signedSendTransaction.tx;
    const tx = WasmTonTransaction.fromBase64(txBase64);
    const roundTripped = tx.toBroadcastFormat();
    assert.strictEqual(roundTripped, txBase64);
  });

  it('should parse a transaction and return expected fields', function () {
    const txBase64 = testData.signedSendTransaction.tx;
    const tx = WasmTonTransaction.fromBase64(txBase64);
    const parsed = parseTransaction(tx);

    assert.ok(parsed.sender);
    assert.ok(parsed.destination);
    assert.strictEqual(typeof parsed.amount, 'bigint');
    assert.strictEqual(parsed.amount, BigInt(testData.signedSendTransaction.recipient.amount));
    assert.strictEqual(typeof parsed.seqno, 'number');
    assert.strictEqual(typeof parsed.bounceable, 'boolean');
  });

  it('should get transaction ID from signed transaction', function () {
    const txBase64 = testData.signedSendTransaction.tx;
    const tx = WasmTonTransaction.fromBase64(txBase64);
    assert.ok(tx.id);
    assert.strictEqual(tx.id, testData.signedSendTransaction.txId);
  });
});
