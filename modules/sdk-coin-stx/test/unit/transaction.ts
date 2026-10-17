import assert from 'assert';
import should from 'should';
import { coins } from '@bitgo/statics';
import { createCoinbasePayload, deserializeTransaction } from '@stacks/transactions';
import { StxLib } from '../../src';
import * as testData from './resources';

const { Transaction, KeyPair } = StxLib;

describe('Stx Transaction', () => {
  const coin = coins.get('tstx');

  it('should throw empty transaction', () => {
    const tx = new Transaction(coin);
    assert.throws(() => tx.toJson(), /Empty transaction/);
    assert.throws(() => tx.toBroadcastFormat(), /Empty transaction/);
  });

  describe('should sign if transaction is', () => {
    it('invalid', function () {
      const tx = new Transaction(coin);
      return tx.sign(testData.INVALID_KEYPAIR_PRV).should.be.rejected();
    });

    it('valid', async () => {
      const tx = new Transaction(coin);
      tx.fromRawTransaction(testData.RAW_TX_UNSIGNED);
      const keypair = new KeyPair({ prv: testData.TX_SENDER.prv });
      await tx.sign(keypair).should.be.fulfilled();
      should.equal(tx.inputs[0].address, testData.TX_SENDER.address);
      should.equal(tx.outputs[0].address, testData.TX_RECIEVER.address);
    });
  });

  describe('should return encoded tx', function () {
    it('valid sign', async function () {
      const tx = new Transaction(coin);
      tx.fromRawTransaction(testData.RAW_TX_UNSIGNED);
      const keypair = new KeyPair({ prv: testData.TX_SENDER.prv });
      await tx.sign(keypair);
      should.equal(tx.toBroadcastFormat(), testData.SIGNED_TRANSACTION);
    });
  });

  describe('calculate transaction size', function () {
    it('expected size', async function () {
      const tx = new Transaction(coin);
      tx.fromRawTransaction(testData.RAW_TX_UNSIGNED);
      should.equal(tx.transactionSize(), testData.RAW_TX_UNSIGNED.length / 2);
    });
  });

  describe('error branches', function () {
    it('rejects signing with a public-only key pair', async function () {
      const tx = new Transaction(coin);
      const publicOnly = new KeyPair({ pub: testData.xpub1 });
      await tx.sign([publicOnly], 'sighash').should.be.rejectedWith(/Missing private key/);
    });

    it('rejects signing with missing signatures', async function () {
      const tx = new Transaction(coin);
      await tx.signWithSignatures(undefined as never, false).should.be.rejectedWith(/Missing signatures/);
    });

    it('rejects an unsupported payload type on toJson', function () {
      const tx = new Transaction(coin);
      const wire = deserializeTransaction(testData.RAW_TX_UNSIGNED);
      (wire as unknown as { payload: unknown }).payload = createCoinbasePayload(new Uint8Array(32));
      tx.stxTransaction = wire;
      assert.throws(() => tx.toJson(), /payload type not supported/);
    });

    it('wraps a malformed raw transaction on fromRawTransaction', function () {
      const tx = new Transaction(coin);
      assert.throws(() => tx.fromRawTransaction('deadbeef'), /Error parsing the raw transaction/);
    });
  });
});
