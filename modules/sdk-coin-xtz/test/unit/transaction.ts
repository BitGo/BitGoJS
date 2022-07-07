import assert from 'assert';
import should from 'should';
import { coins } from '@bitgo/statics';
import {
  unsignedSerializedOriginationTransaction,
  signedSerializedOriginationTransaction,
  parsedTransaction,
} from '../resources';
import { XtzLib } from '../../src';

describe('Tezos transaction', function () {
  describe('should parse', () => {
    it('unsigned transaction', async () => {
      const tx = new XtzLib.Transaction(coins.get('txtz'));
      await tx.initFromSerializedTransaction(unsignedSerializedOriginationTransaction);

      should.equal(tx.inputs.length, 1);
      tx.inputs.length.should.equal(1);
      tx.inputs[0].address.should.equal('tz1VRjRpVKnv16AVprFH1tkDn4TDfVqA893A');
      tx.inputs[0].value.should.equal('1004764');
      tx.outputs.length.should.equal(1);
      tx.outputs[0].address.should.equal('');
      tx.outputs[0].value.should.equal('1000000');
      should.not.exist(tx.delegate);
      JSON.stringify(tx.toJson()).should.equal(JSON.stringify(parsedTransaction));
      tx.toBroadcastFormat().should.equal(unsignedSerializedOriginationTransaction);
    });

    it('signed transaction', async () => {
      const tx = new XtzLib.Transaction(coins.get('txtz'));
      await tx.initFromSerializedTransaction(signedSerializedOriginationTransaction);

      should.equal(tx.inputs.length, 1);
      tx.inputs.length.should.equal(1);
      tx.inputs[0].address.should.equal('tz1VRjRpVKnv16AVprFH1tkDn4TDfVqA893A');
      tx.inputs[0].value.should.equal('1004764');
      tx.outputs.length.should.equal(1);
      tx.outputs[0].address.should.equal('KT1LJvp55fbdNwbisJFign9wA4cPgq9T9oc4');
      tx.outputs[0].value.should.equal('1000000');
      should.not.exist(tx.delegate);
      JSON.stringify(tx.toJson()).should.equal(JSON.stringify(parsedTransaction));
      tx.toBroadcastFormat().should.equal(signedSerializedOriginationTransaction);
    });
  });

  describe('should sign', () => {
    it('an unsigned origination transaction', async () => {
      const tx = new XtzLib.Transaction(coins.get('txtz'));
      await tx.initFromSerializedTransaction(unsignedSerializedOriginationTransaction);

      const signer = new XtzLib.KeyPair({ prv: 'spsk2cbiVsAvpGKmau9XcMscL3NRwjkyT575N5AyAofcoj41x6g6TL' });
      await tx.sign(signer);
      should.equal(tx.inputs.length, 1);
      tx.inputs.length.should.equal(1);
      tx.inputs[0].address.should.equal('tz1VRjRpVKnv16AVprFH1tkDn4TDfVqA893A');
      tx.inputs[0].value.should.equal('1004764');
      tx.outputs.length.should.equal(1);
      tx.outputs[0].address.should.equal('KT1Dh62qPZhJvMMtL4rAnDS2uASptT6GNLMy');
      tx.outputs[0].value.should.equal('1000000');
      should.not.exist(tx.delegate);
      tx.signature.length.should.equal(1);
      tx.signature[0].should.equal(
        'sigu3cjQh8rf79aXG555fRxKzuTa2byZnvMJqkJENpdKjEwCri6SUM9fLywDC3w8e6dHRT8RRaJVQiijC9yzwqL6FSm2Jj9a'
      );
    });

    it('a signed origination transaction', async () => {
      const tx = new XtzLib.Transaction(coins.get('txtz'));
      await tx.initFromSerializedTransaction(signedSerializedOriginationTransaction);

      const signer = new XtzLib.KeyPair({ prv: 'spsk2cbiVsAvpGKmau9XcMscL3NRwjkyT575N5AyAofcoj41x6g6TL' });
      await tx.sign(signer);
      should.equal(tx.inputs.length, 1);
      tx.inputs.length.should.equal(1);
      tx.inputs[0].address.should.equal('tz1VRjRpVKnv16AVprFH1tkDn4TDfVqA893A');
      tx.inputs[0].value.should.equal('1004764');
      tx.outputs.length.should.equal(1);
      tx.outputs[0].address.should.equal('KT1Dh62qPZhJvMMtL4rAnDS2uASptT6GNLMy');
      tx.outputs[0].value.should.equal('1000000');
      should.not.exist(tx.delegate);
      tx.signature.length.should.equal(1);
      tx.signature[0].should.equal(
        'sigu3cjQh8rf79aXG555fRxKzuTa2byZnvMJqkJENpdKjEwCri6SUM9fLywDC3w8e6dHRT8RRaJVQiijC9yzwqL6FSm2Jj9a'
      );
    });
  });

  describe('should fail', () => {
    it('to parse and invalid parsed transaction', async () => {
      const tx = new XtzLib.Transaction(coins.get('txtz'));
      await tx.initFromParsedTransaction({} as XtzLib.Interface.ParsedTransaction).should.be.rejected();
    });

    it('to get the transaction JSON if it is empty', async () => {
      const tx = new XtzLib.Transaction(coins.get('txtz'));
      assert.throws(() => tx.toJson());
    });

    it('to sign if the transaction is empty', async () => {
      const tx = new XtzLib.Transaction(coins.get('txtz'));
      const signer = new XtzLib.KeyPair({ prv: 'spsk2cbiVsAvpGKmau9XcMscL3NRwjkyT575N5AyAofcoj41x6g6TL' });
      await tx.sign(signer).should.be.rejectedWith('Empty transaction');
    });

    it('to sign the transaction if the keys are invalid', async () => {
      const tx = new XtzLib.Transaction(coins.get('txtz'));
      await tx.initFromParsedTransaction(parsedTransaction);
      const signer = new XtzLib.KeyPair({ pub: 'sppk7ZWB8diU2TWehxdkWCV2DTFvn1hPz4qLjiD3nJQozKnoSEnSC8b' });
      await tx.sign(signer).should.be.rejectedWith('Missing private key');
    });
  });
});
