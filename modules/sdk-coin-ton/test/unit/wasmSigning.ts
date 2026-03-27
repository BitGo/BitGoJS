import should from 'should';
import * as nacl from 'tweetnacl';
import { Transaction as WasmTonTransaction } from '@bitgo/wasm-ton';
import * as testData from '../resources/ton';

describe('TON WASM Signing Flow', () => {
  it('should get signable payload from a transaction', () => {
    const txBytes = Buffer.from(testData.signedSendTransaction.tx, 'base64');
    const tx = WasmTonTransaction.fromBytes(txBytes);
    const payload = tx.signablePayload();
    payload.should.be.instanceOf(Uint8Array);
    payload.length.should.equal(32);
  });

  it('should produce consistent signable payload', () => {
    const txBytes = Buffer.from(testData.signedSendTransaction.tx, 'base64');
    const tx1 = WasmTonTransaction.fromBytes(txBytes);
    const tx2 = WasmTonTransaction.fromBytes(txBytes);
    const payload1 = tx1.signablePayload();
    const payload2 = tx2.signablePayload();
    Buffer.from(payload1).toString('hex').should.equal(Buffer.from(payload2).toString('hex'));
  });

  it('should perform fromBytes -> signablePayload -> addSignature -> toBytes roundtrip', () => {
    const txBytes = Buffer.from(testData.signedSendTransaction.tx, 'base64');
    const tx = WasmTonTransaction.fromBytes(txBytes);
    const payload = tx.signablePayload();
    payload.length.should.equal(32);

    // Sign with a test key
    const keyPair = nacl.sign.keyPair.fromSeed(Buffer.from(testData.privateKeys.prvKey1, 'hex'));
    const signature = nacl.sign.detached(payload, keyPair.secretKey);
    signature.length.should.equal(64);

    tx.addSignature(signature);

    const outputBytes = tx.toBytes();
    outputBytes.should.be.instanceOf(Uint8Array);
    outputBytes.length.should.be.greaterThan(0);

    const broadcastFormat = tx.toBroadcastFormat();
    broadcastFormat.should.be.a.String();
    broadcastFormat.length.should.be.greaterThan(0);
  });

  it('should roundtrip a token transaction', () => {
    const txBytes = Buffer.from(testData.signedTokenSendTransaction.tx, 'base64');
    const tx = WasmTonTransaction.fromBytes(txBytes);
    const payload = tx.signablePayload();
    payload.length.should.equal(32);

    const keyPair = nacl.sign.keyPair.fromSeed(Buffer.from(testData.privateKeys.prvKey1, 'hex'));
    const signature = nacl.sign.detached(payload, keyPair.secretKey);
    tx.addSignature(signature);

    const broadcastFormat = tx.toBroadcastFormat();
    broadcastFormat.should.be.a.String();
    broadcastFormat.length.should.be.greaterThan(0);
  });

  it('should read transaction properties', () => {
    const txBytes = Buffer.from(testData.signedSendTransaction.tx, 'base64');
    const tx = WasmTonTransaction.fromBytes(txBytes);
    tx.seqno.should.be.a.Number();
    tx.walletId.should.be.a.Number();
    tx.expireTime.should.be.a.Number();
    (typeof tx.hasStateInit).should.equal('boolean');
  });
});
