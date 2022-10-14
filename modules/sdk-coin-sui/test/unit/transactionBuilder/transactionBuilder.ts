import { getBuilderFactory } from '../getBuilderFactory';
import * as testData from '../../resources/sui';
import { GAS_BUDGET } from '../../resources/sui';
import should from 'should';
import { TransactionType } from '@bitgo/sdk-core';

describe('Sui Transaction Builder', async () => {
  const factory = getBuilderFactory('tsui');

  it('should start and build an empty transfer tx', async function () {
    const txBuilder = factory.getTransferBuilder();
    txBuilder.sender(testData.sender.address);
    txBuilder.payTx({
      coins: testData.inputCoins,
      recipients: [testData.recipients.recipient1],
      amounts: [testData.AMOUNT],
    });
    txBuilder.gasBudget(GAS_BUDGET);
    txBuilder.gasPayment(testData.gasPayment);
    const tx = await txBuilder.build();
    should.equal(tx.type, TransactionType.Send);

    const rawTx = tx.toBroadcastFormat();
    should.equal(rawTx, testData.TRANSFER_TX);
    const reserialized = await factory.from(rawTx).build();
    reserialized.should.be.deepEqual(tx);
    reserialized.toBroadcastFormat().should.equal(rawTx);
  });
});
