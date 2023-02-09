import { getBuilderFactory } from '../getBuilderFactory';
import * as testData from '../../resources/atom';
import should from 'should';
import { TransactionType } from '@bitgo/sdk-core';

describe('Atom Transaction Builder', async () => {
  let builders;
  const factory = getBuilderFactory('tatom');
  const testTxData = testData.TEST_TX;

  beforeEach(function (done) {
    builders = [factory.getTransferBuilder()];
    done();
  });

  it('should build a signed tx from signed tx data', async function () {
    const txBuilder = factory.from(testTxData.signedTxBase64);
    const tx = await txBuilder.build();
    should.equal(tx.type, TransactionType.Send);
    // Should recreate the same raw tx data when re-build and turned to broadcast format
    const rawTx = tx.toBroadcastFormat();
    should.equal(rawTx, testTxData.signedTxBase64);
  });

  describe('sender tests', async () => {
    it('should succeed for valid signerAddress', function () {
      for (const txBuilder of builders) {
        should.doesNotThrow(() => txBuilder.signerAddress(testTxData.sender));
      }
    });

    it('should throw for invalid sender', function () {
      const invalidSender = 'randomString';
      for (const txBuilder of builders) {
        should(() => txBuilder.signerAddress(invalidSender)).throw(
          'transactionBuilder: sender isValidAddress check failed :' + invalidSender
        );
      }
    });
  });

  describe('gasBudget tests', async () => {
    it('should succeed for valid gasBudget', function () {
      for (const txBuilder of builders) {
        should.doesNotThrow(() => txBuilder.gasBudget(testTxData.gasBudget));
      }
    });

    it('should throw for invalid gasBudget', function () {
      const invalidGasBudget = 0;
      for (const txBuilder of builders) {
        should(() => txBuilder.gasBudget({ gas: invalidGasBudget })).throw('Invalid gas limit ' + invalidGasBudget);
      }
    });
  });

  it('validateAddress', function () {
    const invalidAddress = { address: 'randomString' };
    for (const builder of builders) {
      should.doesNotThrow(() => builder.validateAddress({ address: testTxData.sender }));
      should(() => builder.validateAddress(invalidAddress)).throwError(
        'transactionBuilder: address isValidAddress check failed : ' + invalidAddress.address
      );
    }
  });
});
