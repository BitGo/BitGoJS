import should = require('should');

import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';
import { Sui, Tsui } from '../../src';
import * as testData from '../resources/sui';
import * as _ from 'lodash';
import * as sinon from 'sinon';
import BigNumber from 'bignumber.js';
import assert from 'assert';
import { SuiTransactionType } from '../../src/lib/iface';
import { getBuilderFactory } from './getBuilderFactory';

describe('SUI:', function () {
  let bitgo: TestBitGoAPI;
  let basecoin;
  let newTxPrebuild;
  let newTxParams;

  const txPrebuild = {
    txHex: Buffer.from(testData.TRANSFER, 'base64').toString('hex'),
    txInfo: {},
  };

  const txParams = {
    recipients: testData.recipients,
  };

  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'mock' });
    bitgo.safeRegister('sui', Sui.createInstance);
    bitgo.safeRegister('tsui', Tsui.createInstance);
    bitgo.initializeTestVars();
    basecoin = bitgo.coin('tsui');
    newTxPrebuild = () => {
      return _.cloneDeep(txPrebuild);
    };
    newTxParams = () => {
      return _.cloneDeep(txParams);
    };
  });

  it('should retun the right info', function () {
    const sui = bitgo.coin('sui');
    const tsui = bitgo.coin('tsui');

    sui.getChain().should.equal('sui');
    sui.getFamily().should.equal('sui');
    sui.getFullName().should.equal('Sui');
    sui.getBaseFactor().should.equal(1e9);

    tsui.getChain().should.equal('tsui');
    tsui.getFamily().should.equal('sui');
    tsui.getFullName().should.equal('Testnet Sui');
    tsui.getBaseFactor().should.equal(1e9);
  });

  describe('Verify transaction: ', () => {
    it('should succeed to verify transaction', async function () {
      const txPrebuild = newTxPrebuild();
      const txParams = newTxParams();
      const verification = {};
      const isTransactionVerified = await basecoin.verifyTransaction({ txParams, txPrebuild, verification });
      isTransactionVerified.should.equal(true);
    });

    it('should succeed to verify transaction when recipients amount are numbers', async function () {
      const txPrebuild = newTxPrebuild();
      const txParamsWithNumberAmounts = newTxParams();
      txParamsWithNumberAmounts.recipients = txParamsWithNumberAmounts.recipients.map(({ address, amount }) => {
        return { address, amount: Number(amount) };
      });
      const verification = {};
      const isTransactionVerified = await basecoin.verifyTransaction({
        txParams: txParamsWithNumberAmounts,
        txPrebuild,
        verification,
      });
      isTransactionVerified.should.equal(true);
    });

    it('should fail to verify transaction with invalid param', async function () {
      const txPrebuild = {};
      const txParams = newTxParams();
      txParams.recipients = undefined;
      await basecoin
        .verifyTransaction({
          txParams,
          txPrebuild,
        })
        .should.rejectedWith('missing required tx prebuild property txHex');
    });

    it('should verify a split transaction', async function () {
      const factory = getBuilderFactory('tsui');
      const txBuilder = factory.getTransferBuilder();
      txBuilder.type(SuiTransactionType.Transfer);
      txBuilder.sender(testData.sender.address);
      const amount = 1000000000;
      const recipients = new Array(100).fill({ address: testData.sender.address, amount: amount.toString() });
      txBuilder.send(recipients);
      txBuilder.gasData(testData.gasData);
      const tx = await txBuilder.build();

      const txPrebuild = {
        txHex: Buffer.from(tx.toBroadcastFormat(), 'base64').toString('hex'),
        txInfo: {},
      };
      const txParams = {
        recipients,
      };
      const verify = await basecoin.verifyTransaction({
        txParams,
        txPrebuild,
      });
      verify.should.equal(true);
    });
  });

  describe('Explain Transaction: ', () => {
    it('should explain a transfer transaction', async function () {
      const explainedTransaction = await basecoin.explainTransaction({
        txHex: Buffer.from(testData.TRANSFER, 'base64').toString('hex'),
      });
      explainedTransaction.should.deepEqual({
        displayOrder: ['id', 'outputs', 'outputAmount', 'changeOutputs', 'changeAmount', 'fee', 'type'],
        id: 'BxoeGXbBCuw6VFEcgwHHUAKrCoAsGanPB39kdVVKZZcR',
        outputs: [
          {
            address: testData.recipients[0].address,
            amount: testData.recipients[0].amount,
          },
          {
            address: testData.recipients[1].address,
            amount: testData.recipients[1].amount,
          },
        ],
        outputAmount: testData.AMOUNT * 2,
        changeOutputs: [],
        changeAmount: '0',
        fee: { fee: testData.gasData.budget.toString() },
        type: 0,
      });
    });
    it('should explain a staking transaction', async function () {
      const explainedTransaction = await basecoin.explainTransaction({
        txHex: Buffer.from(testData.ADD_STAKE, 'base64').toString('hex'),
      });
      explainedTransaction.should.deepEqual({
        displayOrder: [
          'id',
          'outputs',
          'outputAmount',
          'changeOutputs',
          'changeAmount',
          'fee',
          'type',
          'module',
          'function',
          'validatorAddress',
        ],
        id: 'bP78boZ48sDdJsg2V1tJahpGyBwaC9GSTL2rvyADnsh',
        outputs: [
          {
            address: testData.requestAddStake.validatorAddress,
            amount: testData.requestAddStake.amount.toString(),
          },
        ],
        outputAmount: testData.STAKING_AMOUNT.toString(),
        changeOutputs: [],
        changeAmount: '0',
        fee: { fee: testData.gasData.budget.toString() },
        type: 25,
      });
    });

    it('should fail to explain transaction with missing params', async function () {
      try {
        await basecoin.explainTransaction({});
      } catch (error) {
        should.equal(error.message, 'Invalid transaction');
      }
    });

    it('should fail to explain transaction with invalid params', async function () {
      try {
        await basecoin.explainTransaction({ txHex: 'randomString' });
      } catch (error) {
        should.equal(error.message, 'Invalid transaction');
      }
    });
  });

  describe('Parse Transactions: ', () => {
    const transferInputsResponse = [
      {
        address: testData.recipients[0].address,
        amount: new BigNumber(testData.AMOUNT).plus(testData.AMOUNT).plus(testData.gasData.budget).toFixed(),
      },
    ];

    const transferOutputsResponse = [
      {
        address: testData.recipients[0].address,
        amount: testData.recipients[0].amount,
      },
      {
        address: testData.recipients[1].address,
        amount: testData.recipients[1].amount,
      },
    ];

    it('should parse a transfer transaction', async function () {
      const parsedTransaction = await basecoin.parseTransaction({
        txHex: Buffer.from(testData.TRANSFER, 'base64').toString('hex'),
      });

      parsedTransaction.should.deepEqual({
        inputs: transferInputsResponse,
        outputs: transferOutputsResponse,
      });
    });

    it('should fail to parse a transfer transaction when explainTransaction response is undefined', async function () {
      const stub = sinon.stub(Sui.prototype, 'explainTransaction');
      stub.resolves(undefined);
      await basecoin.parseTransaction({ txHex: testData.TRANSFER }).should.be.rejectedWith('Invalid transaction');
      stub.restore();
    });
  });

  describe('Address Validation', () => {
    let keychains;
    let commonKeychain;

    before(function () {
      commonKeychain =
        '19bdfe2a4b498a05511381235a8892d54267807c4a3f654e310b938b8b424ff4adedbe92f4c146de641c67508a961324c8504cdf8e0c0acbb68d6104ccccd781';
      keychains = [
        {
          id: '6424c353eaf78d000766e95949868468',
          source: 'user',
          type: 'tss',
          commonKeychain:
            '19bdfe2a4b498a05511381235a8892d54267807c4a3f654e310b938b8b424ff4adedbe92f4c146de641c67508a961324c8504cdf8e0c0acbb68d6104ccccd781',
          encryptedPrv:
            '{"iv":"cZd5i7L4RxtwrALW2rK7UA==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"5zgoH1Bd3Fw=","ct":"9vVlnXFRtrM9FVEo+d2chbGHlM9lFZemueBuAs3BIkPo33Fo7jzwwNK/kIWkEyg+NmEBd5IaqAS157nvvvwzzsmMWlQdUz9qbmXNv3pg987cXFR08exS+4uhwP1YNOjJTRvRNcO9ZqHb46d4fmyJ/yC9/susCge7r/EsbaN5C3afv1dzybuq912FwaQElZLYYp5BICudFOMZ9k0UDMfKM/PMDkH7WexoGHr9GKq/bgCH2B39TZZyHKU6Uy47lXep2s6h0DrMwHOrnmiL3DZjOj88Ynvphlzxuo4eOlD2UHia2+nvIaISYs29Pr0DAvREutchvcBpExj1kWWPv7hQYrv8F0NAdatsbWl3w+xKyfiMKo1USlrwyJviypGtQtXOJyw0XPN0rv2+L5lW8BbjpzHfYYN13fJTedlGTFhhkzVtbbPAKE02kx7zCJcjYaiexdSTsrDLScYNT9/Jhdt27KpsooehwVohLfSKz4vbFfRu2MPZw3/+c/hfiJNgtz6esWbnxGrcE8U2IwPYCaK+Ghk4DcqWNIni59RI5B5kAsQOToII40qPN510uTgxBSPO7q7MHgkxdd4CqBq+ojr9j0P7oao8E5Y+CBDJrojDoCh1oCCDW9vo2dXlVcD8SIbw7U/9AfvEbA4xyE/5md1M7CIwLnWs2Ynv0YtaKoqhdS9x6FmHlMDhN/DKHinrwmowtrTT82fOkpO5g9saSmgU7Qy3gLt8t+VwdEyeFeQUKRSyci8qgqXQaZIg4+aXgaSOnlCFMtmB8ekYxEhTY5uzRfrNgS4s1QeqFBpNtUF+Ydi297pbVXnJoXAN+SVWd80GCx+yI2dpVC89k3rOWK9WeyqlnzuLJWp2RIOB9cdW8GFv/fN+QAJpYeVxOE4+nZDsKnsj8nKcg9t4Dlx1G6gLM1/Vq9YxNLbuzuRC0asUYvdMnoMvszmpm++TxndYisgNYscpZSoz7wvcazJNEPfhPVjEkd6tUUuN4GM35H0DmKCUQNT+a6B6hmHlTZvjxiyGAg5bY59hdjvJ+22QduazlEEC6LI3HrA7uK0TpplWzS1tCIFvTMUhj65DEZmNJ2+ZY9bQ4vsMf+DRR3OOG4t+DMlNfjOd3zNv3QoY95BjfWpryFwPzDq7bCP67JDsoj7j2TY5FRSrRkD77H0Ewlux2cWfjRTwcMHcdQxxuV0OP0aNjGDjybFN"}',
        },
        {
          id: '6424c353eaf78d000766e96137d4404b',
          source: 'backup',
          type: 'tss',
          commonKeychain:
            '19bdfe2a4b498a05511381235a8892d54267807c4a3f654e310b938b8b424ff4adedbe92f4c146de641c67508a961324c8504cdf8e0c0acbb68d6104ccccd781',
          encryptedPrv:
            '{"iv":"vi0dPef/Rx7kG/pRySQi6Q==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"9efhQsiEvVs=","ct":"Gw6atvf6gxKzsjtl3xseipO3rAxp1mAz7Yu1ihFsi5/lf2vMZegApgZx+pyILFS9KKLHbNF3U6WgSYdrr2t4vzdLsXkH1WIxfHS+cd2C5N59yADZDnPJBT6pv/IRvaYelP0Ck3nIYQ2hSMm8op+VOWC/SzHeh7slYDqwEHTGan0Wigfvk1yRd7CCJTaEAomnc/4eFi2NY3X3gt/3opy9IAgknnwUFohn96EWpEQ0F6pbzH/Z8VF6gF+DUcrrByAxExUPnHQZiFk3YHU/vVV4FxBU/mVAE8xBsBn5ul5e5SUMPfc7TBuJWv4BByTNg9xDShF/91Yx2nbfUm5d9QmM8lpKgzzQvcK8POAPk87gRCuKnsGh5vNS0UppkHc+ocfzRQlGA6jze7QyyQO0rMj5Ly8kWjwk2vISvKYHYS1NR7VU549UIXo7NXjatunKSc3+IreoRUHIshiaLg6hl+pxCCuc0qQ43V0mdIfCjTN8gkGWLNk8R7tAGPz9jyapQPcPEGHgEz0ATIi6yMNWCsibS2eLiE1uVEJONoM4lk6FPl3Q2CHbW2MeEbqjY8hbaw18mNb2xSBH/Fwpiial+Tvi2imqgnCO4ZpO9bllKftZPcQy0stN+eGBlb5ufyflKkDSiChHYroGjEpmiFicdde48cJszF52uKNnf1q67fA9/S2FAHQab3EXojxH2Gbk+kkV2h/TYKFFZSWC3vi4e8mO+vjMUcR0AdsgPFyEIz0SCGuba3CnTLNdEuZwsauAeHkx2vUTnRgJPVgNeeuXmsVG76Sy2ggJHuals0Hj8U2Xda0qO1RuFfoCWfss9wn6HGRwPPkhSB/8oNguAqmRVGKkd8Zwt3IvrTd9fk0/rFFDJKGz7WyNHkYgUmNiGcItD12v0jx7FZ52EJzl3Av1RyJUQK18+8EYPh3SGiU9dt7VX0aF0uo6JouKhOeldUvMP+AugQz8fUclwTQsbboVg27Yxo0DyATVwThW5a56R6Qf5ZiQJluFuzs5y98rq0S5q046lE6o3vVmJpEdwjeSCJoET5CL4nTgkXyWvhm4eB8u/e66l3o0qbaSx8q9YYmT9EpRcl5TP4ThLBKETYdzVvg4exjQfektMatk5EyUpEIhZPXh5vXpJZesdfO9LJ8zTaHBsBjDPU7cdNgQMbebpataRi8A0el2/IJXl+E+olgAz5zC4i2O1Q=="}',
        },
        {
          id: '6424c353eaf78d000766e9510b125fba',
          source: 'bitgo',
          type: 'tss',
          commonKeychain:
            '19bdfe2a4b498a05511381235a8892d54267807c4a3f654e310b938b8b424ff4adedbe92f4c146de641c67508a961324c8504cdf8e0c0acbb68d6104ccccd781',
          verifiedVssProof: true,
          isBitGo: true,
        },
      ];
    });

    it('should return true when validating a well formatted address', async function () {
      const address = 'f941ae3cbe5645dccc15da8346b533f7f91f202089a5521653c062b2ff10b304';
      basecoin.isValidAddress(address).should.equal(true);
    });

    it('should return true when validating a well formatted address prefixed with 0x', async function () {
      const address = '0xf941ae3cbe5645dccc15da8346b533f7f91f202089a5521653c062b2ff10b304';
      basecoin.isValidAddress(address).should.equal(true);
    });

    it('should return false when validating an old address', async function () {
      const address = '0x2959bfc3fdb7dc23fed8deba2fafb70f3e606a59';
      basecoin.isValidAddress(address).should.equal(false);
    });

    it('should return false when validating an incorrectly formatted', async function () {
      const address = 'wrongaddress';
      basecoin.isValidAddress(address).should.equal(false);
    });

    it('should return true for isWalletAddress with valid address for index 4', async function () {
      const newAddress = '0x8b3c7807730d75792dd6c49732cf9f014d6984a9c77d386bdb1072a9e537d8d8';
      const index = 4;

      const params = { commonKeychain, address: newAddress, index, keychains };
      (await basecoin.isWalletAddress(params)).should.equal(true);
    });

    it('should return false for isWalletAddress with valid address for index 5 and address is for a different index', async function () {
      const wrongAddressForIndex5 = '0xc392383b676f4008bbf7c290c3712aa04d0cb3fe10a5f2db14cf5019c26fe0bb';
      const index = 5;

      const params = { commonKeychain, address: wrongAddressForIndex5, index, keychains };
      (await basecoin.isWalletAddress(params)).should.equal(false);
    });

    it('should throw error for isWalletAddress when keychains is missing', async function () {
      const address = '0x2959bfc3fdb7dc23fed8deba2fafb70f3e606a59';
      const index = 0;

      const params = { commonKeychain, address, index };
      await assert.rejects(async () => basecoin.isWalletAddress(params));
    });

    it('should throw error for isWalletAddress when new address is invalid', async function () {
      const wrongAddress = 'badAddress';
      const index = 0;

      const params = { commonKeychain, address: wrongAddress, index };
      await assert.rejects(async () => basecoin.isWalletAddress(params), {
        message: `invalid address: ${wrongAddress}`,
      });
    });
  });
});
