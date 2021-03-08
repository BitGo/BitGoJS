import should from 'should';
import { coins } from '@bitgo/statics';
import { Transaction } from '../../../../src/coin/stacks/transaction'
import * as testData from '../../../resources/stacks/stacks';
import { KeyPair } from '../../../../src/coin/stacks/keyPair';

describe('Stacks Transaction', () => {
  const coin = coins.get('stacks');

  function getTransaction(): Transaction {
    return new Transaction(coin);
  }

  it('should throw empty transaction', () => {
    const tx = getTransaction();
    should.throws(() => {
      tx.toJson();
    });
    should.throws(() => {
      tx.toBroadcastFormat();
    });
  });

  describe('should sign if transaction is', () => {
    it('invalid', function () {
      const tx = getTransaction();
      return tx.sign(testData.INVALID_KEYPAIR_PRV).should.be.rejected();
    });

    it('valid', async () => {
      const tx = getTransaction();
      tx.fromRawTransaction(testData.RAW_TX_UNSIGNED)
      const keypair = new KeyPair({ prv: testData.TX_SENDER.prv });
      await tx.sign(keypair).should.be.fulfilled();
      should.equal(
        tx.inputs[0].address,
        testData.TX_SENDER.address
      );
      should.equal(
        tx.outputs[0].address,
        testData.TX_RECIEVER.address
      );
    });
  });

  describe('should return encoded tx', function () {
    it('valid sign', async function () {
      const tx = getTransaction();
      tx.fromRawTransaction(testData.RAW_TX_UNSIGNED)
      const keypair = new KeyPair({ prv: testData.TX_SENDER.prv });
      await tx.sign(keypair);
      should.equal(tx.toBroadcastFormat(), testData.SIGNED_TRANSACTION);
    });
  });
});
