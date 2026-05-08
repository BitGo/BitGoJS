import { TransactionType } from '@bitgo/sdk-core';
import should from 'should';

import * as testData from '../../resources/tia';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';
import { Tia, Ttia } from '../../../src';

describe('Tia Transaction Builder', async () => {
  let bitgo: TestBitGoAPI;
  let basecoin;
  let factory;
  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'mock' });
    bitgo.safeRegister('tia', Tia.createInstance);
    bitgo.safeRegister('ttia', Ttia.createInstance);
    bitgo.initializeTestVars();
    basecoin = bitgo.coin('ttia');
    factory = basecoin.getBuilder();
  });

  const testTxData = testData.TEST_SEND_TX;
  let data;

  beforeEach(() => {
    data = [
      {
        type: TransactionType.Send,
        testTx: testData.TEST_SEND_TX,
        builder: factory.getTransferBuilder(),
      },
      {
        type: TransactionType.StakingActivate,
        testTx: testData.TEST_DELEGATE_TX,
        builder: factory.getStakingActivateBuilder(),
      },
      {
        type: TransactionType.StakingDeactivate,
        testTx: testData.TEST_UNDELEGATE_TX,
        builder: factory.getStakingDeactivateBuilder(),
      },
      {
        type: TransactionType.StakingWithdraw,
        testTx: testData.TEST_WITHDRAW_REWARDS_TX,
        builder: factory.getStakingWithdrawRewardsBuilder(),
      },
    ];
  });

  it('should build a signed tx from signed tx data', async function () {
    const txBuilder = factory.from(testTxData.signedTxBase64);
    const tx = await txBuilder.build();
    should.equal(tx.type, TransactionType.Send);
    // Should recreate the same raw tx data when re-build and turned to broadcast format
    const rawTx = tx.toBroadcastFormat();
    should.equal(rawTx, testTxData.signedTxBase64);
  });

  describe('gasBudget tests', async () => {
    it('should succeed for valid gasBudget', function () {
      for (const { builder } of data) {
        should.doesNotThrow(() => builder.gasBudget(testTxData.gasBudget));
      }
    });

    it('should throw for invalid gasBudget', function () {
      const invalidGasBudget = 0;
      for (const { builder } of data) {
        should(() => builder.gasBudget({ gasLimit: invalidGasBudget })).throw('Invalid gas limit ' + invalidGasBudget);
      }
    });
  });

  it('validateAddress', function () {
    const invalidAddress = { address: 'randomString' };
    for (const { builder } of data) {
      should.doesNotThrow(() => builder.validateAddress({ address: testTxData.sender }));
      should(() => builder.validateAddress(invalidAddress)).throwError(
        'transactionBuilder: address isValidAddress check failed: ' + invalidAddress.address
      );
    }
  });
});
