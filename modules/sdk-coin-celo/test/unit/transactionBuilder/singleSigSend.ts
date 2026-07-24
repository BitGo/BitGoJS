import assert from 'assert';
import { TransactionType } from '@bitgo/sdk-core';
import { getBuilder } from '../getBuilder';
import { TransactionBuilder } from '../../../src';
import * as testData from '../../resources/celo';

describe('Single sig building tests', function () {
  describe('value precision', () => {
    let txBuilder: TransactionBuilder;
    const initTxBuilder = (): void => {
      txBuilder = getBuilder('tcelo') as TransactionBuilder;
      txBuilder.fee({
        fee: '1000000000',
        gasLimit: '12100000',
      });
      txBuilder.counter(2);
      txBuilder.contract('0xab100912e133aa06ceb921459aaddbd62381f5a3');
      txBuilder.type(TransactionType.SingleSigSend);
    };

    it('should fail to set value with NaN value', async () => {
      initTxBuilder();
      try {
        txBuilder.value('193409,we3r,f2');
        assert(false, 'We should have thrown');
      } catch (e) {
        e.message.should.equal('Value 193409,we3r,f2 is not a valid number');
      }
    });

    it('should fail to set value with overprecise value', async () => {
      initTxBuilder();
      try {
        txBuilder.value('25595000000000020002');
        assert(false, 'We should have thrown');
      } catch (e) {
        e.message.should.equal(
          'Value 25595000000000020002 cannot be represented by a JS number, please try using fewer significant digits. We are working to support all values in the future.'
        );
      }
    });

    it('should successfully set value with a valid value and sign', async () => {
      initTxBuilder();
      const validValue = '25595000000000000000';
      txBuilder.value(validValue);
      txBuilder.sign({ key: testData.KEYPAIR_PRV.getKeys().prv });
      const signedTx = await txBuilder.build();
      signedTx.toJson().value.should.equal(validValue);
    });
  });
});
