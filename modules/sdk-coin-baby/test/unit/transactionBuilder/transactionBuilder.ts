import { TransactionType } from '@bitgo/sdk-core';
import should from 'should';

import * as testData from '../../resources/baby';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';
import { Baby, Tbaby } from '../../../src';

describe('Babylon Transaction Builder', async () => {
  let bitgo: TestBitGoAPI;
  let basecoin;
  let factory;
  let data;

  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'mock' });
    bitgo.safeRegister('baby', Baby.createInstance);
    bitgo.safeRegister('tbaby', Tbaby.createInstance);
    bitgo.initializeTestVars();
    basecoin = bitgo.coin('tbaby');
    factory = basecoin.getBuilder();
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
        type: TransactionType.StakingRedelegate,
        testTx: testData.TEST_REDELEGATE_TX,
        builder: factory.getStakingRedelegateBuilder(),
      },
      {
        type: TransactionType.StakingWithdraw,
        testTx: testData.TEST_WITHDRAW_REWARDS_TX,
        builder: factory.getStakingWithdrawRewardsBuilder(),
      },
      {
        type: TransactionType.CustomTx,
        testTx: testData.TEST_CUSTOM_MsgCreateBTCDelegation_TX,
        builder: factory.getCustomTransactionBuilder(),
      },
      {
        type: TransactionType.CustomTx,
        testTx: testData.TEST_CUSTOM_MsgWithdrawReward_TX,
        builder: factory.getCustomTransactionBuilder(),
      },
    ];
  });

  it('should build a signed tx from signed tx data', async function () {
    for (const { type, testTx } of data) {
      const txBuilder = factory.from(testTx.signedTxBase64);
      const tx = await txBuilder.build();
      should.equal(tx.type, type);
      const rawTx = tx.toBroadcastFormat();
      should.equal(rawTx, testTx.signedTxBase64);
    }
  });

  it('should succeed for valid gasBudget', function () {
    for (const { testTx, builder } of data) {
      should.doesNotThrow(() => builder.gasBudget(testTx.gasBudget));
    }
  });

  it('should throw for invalid gasBudget', function () {
    const invalidGasBudget = 0;
    for (const { builder } of data) {
      should(() => builder.gasBudget({ gasLimit: invalidGasBudget })).throw('Invalid gas limit ' + invalidGasBudget);
    }
  });

  it('validateAddress', function () {
    const invalidAddress = { address: 'randomString' };
    for (const { testTx, builder } of data) {
      should.doesNotThrow(() => builder.validateAddress({ address: testTx.from ?? testTx.delegator ?? testTx.sender }));
      should.doesNotThrow(() =>
        builder.validateAddress({ address: testTx.to ?? testTx.validator ?? testTx.recipient })
      );
      should(() => builder.validateAddress(invalidAddress)).throwError(
        'transactionBuilder: address isValidAddress check failed: ' + invalidAddress.address
      );
    }
  });
});
