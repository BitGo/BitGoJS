import should from 'should';
import { TransactionType } from '@bitgo-beta/sdk-core';

import { getAvailableTestCoins, getBuilderFactory, getTestData } from '../../testUtils';

describe('Cosmos Transaction Builder', function () {
  const availableCoins = getAvailableTestCoins();
  // TODO: COIN-5039 -  Running tests for each coin in parallel to improve test performance
  // Loop through each available coin and run tests
  availableCoins.forEach((coinName) => {
    describe(`${coinName.toUpperCase()} Transaction Builder`, function () {
      const testData = getTestData(coinName);
      const factory = getBuilderFactory(testData.testnetCoin);
      const testTx = testData.testSendTx as Required<typeof testData.testSendTx>;

      it('should build a signed tx from signed tx data', async function () {
        const txBuilder = factory.from(testTx.signedTxBase64);
        const tx = await txBuilder.build();
        should.equal(tx.type, TransactionType.Send);
        // Should recreate the same raw tx data when re-build and turned to broadcast format
        const rawTx = tx.toBroadcastFormat();
        should.equal(rawTx, testTx.signedTxBase64);
      });

      describe('gasBudget tests', async () => {
        it('should succeed for valid gasBudget', function () {
          const builder = factory.getTransferBuilder();
          should.doesNotThrow(() => builder.gasBudget(testTx.gasBudget!));
        });

        it('should throw for invalid gasBudget', function () {
          const builder = factory.getTransferBuilder();
          const invalidGasBudget = { amount: testTx.gasBudget!.amount, gasLimit: 0 };
          should(() => builder.gasBudget(invalidGasBudget)).throw('Invalid gas limit 0');
        });
      });

      it('validateAddress', function () {
        const builder = factory.getTransferBuilder();
        const invalidAddress = { address: 'randomString' };
        should.doesNotThrow(() => builder.validateAddress({ address: testTx.sender }));
        should(() => builder.validateAddress(invalidAddress)).throwError(
          'transactionBuilder: address isValidAddress check failed: ' + invalidAddress.address
        );
      });
    });
  });
});
