import { describe, it } from 'node:test';
import assert from 'assert';
import { coins } from '@bitgo/statics';
import { Interface, Transaction } from '../../src';
import { UnsignedBuildTransaction } from '../resources';

describe('Tron transactions', function () {
  describe('should parse', () => {
    it('inputs and outputs from an unsigned transaction', () => {
      const tx = new Transaction(coins.get('ttrx'), UnsignedBuildTransaction as Interface.TransactionReceipt);
      assert.equal(tx.inputs.length, 1);
      assert.equal(tx.inputs[0].address, 'TTsGwnTLQ4eryFJpDvJSfuGQxPXRCjXvZz');
      assert.equal(tx.inputs[0].value, '1718');
      assert.equal(tx.outputs.length, 1);
      assert.equal(tx.outputs[0].address, 'TNYssiPgaf9XYz3urBUqr861Tfqxvko47B');
      assert.equal(tx.outputs[0].value, '1718');
    });
  });

  describe('should throw when', () => {
    it('transaction is empty and toJson is called', () => {
      const tx = new Transaction(coins.get('ttrx'));
      assert.throws(() => tx.toJson());
    });

    it('transaction is empty and extendExpiration is called', () => {
      const tx = new Transaction(coins.get('ttrx'));
      assert.throws(() => tx.extendExpiration(1));
    });

    it('the extension time is negative', () => {
      const tx = new Transaction(coins.get('ttrx'));
      assert.throws(() => tx.extendExpiration(-1));
    });
  });
});
