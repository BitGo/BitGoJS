import { getBuilderFactory } from '../getBuilderFactory';
import * as testData from '../../resources/atom';
import should from 'should';
import { TransactionType } from '@bitgo/sdk-core';
import { AtomTransactionType } from '../../../src/lib/constants';
import { Transaction as AtomTransaction } from '../../../src/lib/transaction';

describe('Atom Transfer Builder', () => {
  const factory = getBuilderFactory('tatom');
  const testTx = testData.TEST_TX;
  describe('Succeed', () => {
    it('should build a transfer pay tx', async function () {
      const txBuilder = factory.getTransferBuilder();
      txBuilder.type(AtomTransactionType.Pay);
      txBuilder.sequence(testTx.sequence);
      txBuilder.signerAddress(testTx.sender);
      txBuilder.gasBudget(testTx.gasBudget);
      txBuilder.sendMessages([testTx.sendMessage]);
      txBuilder.publicKey(testTx.pubKey);
      txBuilder.addSignature({ pub: testTx.pubKey }, Buffer.from(testTx.signature, 'hex'));

      const tx = await txBuilder.build();
      should.equal(tx.type, TransactionType.Send);
      (tx as AtomTransaction).atomTransaction.gasBudget.should.deepEqual(testTx.gasBudget);
      const rawTx = tx.toBroadcastFormat();
      should.equal(rawTx, testTx.signedTxBase64);
    });
  });
});
