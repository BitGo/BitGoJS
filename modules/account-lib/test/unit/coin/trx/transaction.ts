import should from 'should';
import { coins } from '@bitgo/statics';
import { UnsignedBuildTransaction } from '../../../resources/trx';
import { Transaction } from '../../../../src/coin/trx';
import { TransactionReceipt } from '../../../../src/coin/trx/iface';

describe('Tron transactions', function() {
  describe('should parse', () => {
    it('inputs and outputs from an unsigned transaction', () => {
      const tx = new Transaction(coins.get('ttrx'), UnsignedBuildTransaction as TransactionReceipt);
      tx.inputs.length.should.equal(1);
      tx.inputs[0].address.should.equal('TTsGwnTLQ4eryFJpDvJSfuGQxPXRCjXvZz');
      tx.inputs[0].value.should.equal('1718');
      tx.outputs.length.should.equal(1);
      tx.outputs[0].address.should.equal('TNYssiPgaf9XYz3urBUqr861Tfqxvko47B');
      tx.outputs[0].value.should.equal('1718');
    });
  });

  describe('should throw when', () => {
    it('transaction is empty and toJson is called', () => {
      const tx = new Transaction(coins.get('ttrx'));
      should.throws(() => tx.toJson());
    });

    it('transaction is empty and extendExpiration is called', () => {
      const tx = new Transaction(coins.get('ttrx'));
      should.throws(() => tx.extendExpiration(1));
    });

    it('the extension time is negative', () => {
      const tx = new Transaction(coins.get('ttrx'));
      should.throws(() => tx.extendExpiration(-1));
    });
  });
});
