import should from 'should';

import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';
import { Sui, TransferTransaction, Tsui } from '../../src';
import * as testData from '../resources/sui';
import _ from 'lodash';
import sinon from 'sinon';
import BigNumber from 'bignumber.js';
import assert from 'assert';
import { SuiTransactionType } from '../../src/lib/iface';
import { getBuilderFactory } from './getBuilderFactory';
import { keys } from '../resources/sui';
import { Buffer } from 'buffer';

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

  it('should return the right info', function () {
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

    it('should explain a split transfer transaction', async function () {
      const explainedTransaction = await basecoin.explainTransaction({
        txHex:
          '000065000800ca9a3b000000000020574895fe83b409b009e2e0433ad1823ec0d538af7fea52390a198bdfe7676f13000800ca9a3b00000000000800ca9a3b00000000000800ca9a3b00000000000800ca9a3b00000000000800ca9a3b00000000000800ca9a3b00000000000800ca9a3b00000000000800ca9a3b00000000000800ca9a3b00000000000800ca9a3b00000000000800ca9a3b00000000000800ca9a3b00000000000800ca9a3b00000000000800ca9a3b00000000000800ca9a3b00000000000800ca9a3b00000000000800ca9a3b00000000000800ca9a3b00000000000800ca9a3b00000000000800ca9a3b00000000000800ca9a3b00000000000800ca9a3b00000000000800ca9a3b00000000000800ca9a3b00000000000800ca9a3b00000000000800ca9a3b00000000000800ca9a3b00000000000800ca9a3b00000000000800ca9a3b00000000000800ca9a3b00000000000800ca9a3b00000000000800ca9a3b00000000000800ca9a3b00000000000800ca9a3b00000000000800ca9a3b00000000000800ca9a3b00000000000800ca9a3b00000000000800ca9a3b00000000000800ca9a3b00000000000800ca9a3b00000000000800ca9a3b00000000000800ca9a3b00000000000800ca9a3b00000000000800ca9a3b00000000000800ca9a3b00000000000800ca9a3b00000000000800ca9a3b00000000000800ca9a3b00000000000800ca9a3b00000000000800ca9a3b00000000000800ca9a3b00000000000800ca9a3b00000000000800ca9a3b00000000000800ca9a3b00000000000800ca9a3b00000000000800ca9a3b00000000000800ca9a3b00000000000800ca9a3b00000000000800ca9a3b00000000000800ca9a3b00000000000800ca9a3b00000000000800ca9a3b00000000000800ca9a3b00000000000800ca9a3b00000000000800ca9a3b00000000000800ca9a3b00000000000800ca9a3b00000000000800ca9a3b00000000000800ca9a3b00000000000800ca9a3b00000000000800ca9a3b00000000000800ca9a3b00000000000800ca9a3b00000000000800ca9a3b00000000000800ca9a3b00000000000800ca9a3b00000000000800ca9a3b00000000000800ca9a3b00000000000800ca9a3b00000000000800ca9a3b00000000000800ca9a3b00000000000800ca9a3b00000000000800ca9a3b00000000000800ca9a3b00000000000800ca9a3b00000000000800ca9a3b00000000000800ca9a3b00000000000800ca9a3b00000000000800ca9a3b00000000000800ca9a3b00000000000800ca9a3b00000000000800ca9a3b00000000000800ca9a3b00000000000800ca9a3b00000000000800ca9a3b00000000000800ca9a3b00000000000800ca9a3b00000000000800ca9a3b00000000000800ca9a3b00000000c801020001010000010102000001010002000101020001010202000101000200010103000101020400010100020001010400010102060001010002000101050001010208000101000200010106000101020a000101000200010107000101020c000101000200010108000101020e000101000200010109000101021000010100020001010a000101021200010100020001010b000101021400010100020001010c000101021600010100020001010d000101021800010100020001010e000101021a00010100020001010f000101021c000101000200010110000101021e00010100020001011100010102200001010002000101120001010222000101000200010113000101022400010100020001011400010102260001010002000101150001010228000101000200010116000101022a000101000200010117000101022c000101000200010118000101022e000101000200010119000101023000010100020001011a000101023200010100020001011b000101023400010100020001011c000101023600010100020001011d000101023800010100020001011e000101023a00010100020001011f000101023c000101000200010120000101023e00010100020001012100010102400001010002000101220001010242000101000200010123000101024400010100020001012400010102460001010002000101250001010248000101000200010126000101024a000101000200010127000101024c000101000200010128000101024e000101000200010129000101025000010100020001012a000101025200010100020001012b000101025400010100020001012c000101025600010100020001012d000101025800010100020001012e000101025a00010100020001012f000101025c000101000200010130000101025e00010100020001013100010102600001010002000101320001010262000101000200010133000101026400010100020001013400010102660001010002000101350001010268000101000200010136000101026a000101000200010137000101026c000101000200010138000101026e000101000200010139000101027000010100020001013a000101027200010100020001013b000101027400010100020001013c000101027600010100020001013d000101027800010100020001013e000101027a00010100020001013f000101027c000101000200010140000101027e00010100020001014100010102800001010002000101420001010282000101000200010143000101028400010100020001014400010102860001010002000101450001010288000101000200010146000101028a000101000200010147000101028c000101000200010148000101028e000101000200010149000101029000010100020001014a000101029200010100020001014b000101029400010100020001014c000101029600010100020001014d000101029800010100020001014e000101029a00010100020001014f000101029c000101000200010150000101029e00010100020001015100010102a000010100020001015200010102a200010100020001015300010102a400010100020001015400010102a600010100020001015500010102a800010100020001015600010102aa00010100020001015700010102ac00010100020001015800010102ae00010100020001015900010102b000010100020001015a00010102b200010100020001015b00010102b400010100020001015c00010102b600010100020001015d00010102b800010100020001015e00010102ba00010100020001015f00010102bc00010100020001016000010102be00010100020001016100010102c000010100020001016200010102c200010100020001016300010102c400010100020001016400010102c600010100574895fe83b409b009e2e0433ad1823ec0d538af7fea52390a198bdfe7676f1303034f403ff9b73b5794b79a89ebbcd810331fea52878db0b4dc1a1c88f4c0dc5616000000000000002003caf7e677c72b241d61d00e600b6df25639c582987d0aa78ceea0b9953eac52a60b0e51f9ffa398f6ee1d3101d6c9efa13d1800e412d7e0832e2616f1793fd79ce91700000000002050435a49f0635bc2f2c3bbdce05a16b24faf0368edaa25c8fbce16ef62602da5cda44ae47f380f45d3cd4911880f4e9a24b52fe424683c66cf3c7769dd3ca22c1000000000000000200c78fa20236bb86871eacfe2b4f2158eaa68f4f4565d8cf9865ee9f279e4bd40574895fe83b409b009e2e0433ad1823ec0d538af7fea52390a198bdfe7676f13e80300000000000000e1f5050000000000',
      });
      explainedTransaction.outputs.length.should.equal(100);
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
        fee: new BigNumber(20000000),
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

  describe('Recover Transactions:', () => {
    const sandBox = sinon.createSandbox();
    const senderAddress0 = '0x91f25e237b83a00a62724fdc4a81e43f494dc6b41a1241492826d36e4d131da3';
    const recoveryDestination = '0x00e4eaa6a291fe02918452e645b5653cd260a5fc0fb35f6193d580916aa9e389';
    const walletPassphrase = 'p$Sw<RjvAgf{nYAYI2xM';
    let getBalanceStub: sinon.SinonStub;
    let getInputCoinsStub: sinon.SinonStub;
    let getFeeEstimateStub: sinon.SinonStub;

    beforeEach(() => {
      getBalanceStub = sandBox.stub(Sui.prototype, 'getBalance' as keyof Sui);
      getBalanceStub.withArgs(senderAddress0).resolves('1900000000');

      getInputCoinsStub = sandBox.stub(Sui.prototype, 'getInputCoins' as keyof Sui);
      getInputCoinsStub.withArgs(senderAddress0).resolves([
        {
          coinType: '0x2::sui::SUI',
          objectId: '0xc05c765e26e6ae84c78fa245f38a23fb20406a5cf3f61b57bd323a0df9d98003',
          version: '195',
          digest: '7BJLb32LKN7wt5uv4xgXW4AbFKoMNcPE76o41TQEvUZb',
          balance: new BigNumber('1900000000'),
        },
      ]);

      getFeeEstimateStub = sandBox.stub(Sui.prototype, 'getFeeEstimate' as keyof Sui);
      getFeeEstimateStub
        .withArgs(
          'AAACAAgA0klrAAAAAAAgAOTqpqKR/gKRhFLmRbVlPNJgpfwPs19hk9WAkWqp44kCAgABAQAAAQECAAABAQCR8l4je4OgCmJyT9xKgeQ/SU3GtBoSQUkoJtNuTRMdowHAXHZeJuauhMePokXziiP7IEBqXPP2G1e9MjoN+dmAA8MAAAAAAAAAIFvJiJBdEAhi14cxcSr/HUIhBZMbLMd4rczUTCMIb3UmkfJeI3uDoApick/cSoHkP0lNxrQaEkFJKCbTbk0THaPoAwAAAAAAAADh9QUAAAAAAA=='
        )
        .resolves(new BigNumber(1997880));
    });

    afterEach(() => {
      sandBox.restore();
    });

    it('should recover a txn for non-bitgo recovery', async function () {
      const res = await basecoin.recover({
        userKey: keys.userKey,
        backupKey: keys.backupKey,
        bitgoKey: keys.bitgoKey,
        recoveryDestination,
        walletPassphrase,
      });
      res.should.not.be.empty();
      res.should.hasOwnProperty('serializedTx');
      res.should.hasOwnProperty('scanIndex');
      res.should.hasOwnProperty('recoveryAmount');
      res.should.hasOwnProperty('signature');

      res.serializedTx.should.equal(
        'AAACAAgA0klrAAAAAAAgAOTqpqKR/gKRhFLmRbVlPNJgpfwPs19hk9WAkWqp44kCAgABAQAAAQECAAABAQCR8l4je4OgCmJyT9xKgeQ/SU3GtBoSQUkoJtNuTRMdowHAXHZeJuauhMePokXziiP7IEBqXPP2G1e9MjoN+dmAA8MAAAAAAAAAIFvJiJBdEAhi14cxcSr/HUIhBZMbLMd4rczUTCMIb3UmkfJeI3uDoApick/cSoHkP0lNxrQaEkFJKCbTbk0THaPoAwAAAAAAAKSIIQAAAAAAAA=='
      );
      res.scanIndex.should.equal(0);
      res.recoveryAmount.should.equal('1800000000');

      const NonBitGoTxnDeserialize = new TransferTransaction(basecoin);
      NonBitGoTxnDeserialize.fromRawTransaction(res.serializedTx);
      const NonBitGoTxnJson = NonBitGoTxnDeserialize.toJson();

      should.equal(NonBitGoTxnJson.id, '3xexf67vjACcvsd3XCR5XWNm1cDeGCbcnJ5NhAHBmdBc');
      should.equal(NonBitGoTxnJson.sender, senderAddress0);
      sandBox.assert.callCount(basecoin.getBalance, 1);
      sandBox.assert.callCount(basecoin.getInputCoins, 1);
      sandBox.assert.callCount(basecoin.getFeeEstimate, 1);
    });

    it('should recover a txn for unsigned sweep recovery', async function () {
      const res = await basecoin.recover({
        bitgoKey: keys.bitgoKey,
        recoveryDestination,
      });

      res.should.deepEqual({
        txRequests: [
          {
            transactions: [
              {
                unsignedTx: {
                  serializedTx:
                    '000002000800d2496b00000000002000e4eaa6a291fe02918452e645b5653cd260a5fc0fb35f6193d580916aa9e38902020001010000010102000001010091f25e237b83a00a62724fdc4a81e43f494dc6b41a1241492826d36e4d131da301c05c765e26e6ae84c78fa245f38a23fb20406a5cf3f61b57bd323a0df9d98003c300000000000000205bc988905d100862d78731712aff1d422105931b2cc778adccd44c23086f752691f25e237b83a00a62724fdc4a81e43f494dc6b41a1241492826d36e4d131da3e803000000000000a48821000000000000',
                  scanIndex: 0,
                  coin: 'tsui',
                  signableHex: 'dce2d3c053e4801d54bfa38baae74fe0b78d0647dd9cdf203ebe48d84be66e16',
                  derivationPath: 'm/0',
                  parsedTx: {
                    inputs: [
                      {
                        address: '0x91f25e237b83a00a62724fdc4a81e43f494dc6b41a1241492826d36e4d131da3',
                        valueString: '1800000000',
                        value: new BigNumber(1800000000),
                      },
                    ],
                    outputs: [
                      {
                        address: '0x00e4eaa6a291fe02918452e645b5653cd260a5fc0fb35f6193d580916aa9e389',
                        valueString: '1800000000',
                        coinName: 'tsui',
                      },
                    ],
                    spendAmount: '1800000000',
                    type: 'Transfer',
                  },
                  feeInfo: { fee: 2197668, feeString: '2197668' },
                  coinSpecific: {
                    commonKeychain:
                      '3b89eec9d2d2f3b049ecda2e7b5f47827f7927fe6618d6e8b13f64e7c95f4b00b9577ab01395ecf8eeb804b590cedae14ff5fd3947bf3b7a95b9327c49e27c54',
                  },
                },
                signatureShares: [],
              },
            ],
            walletCoin: 'tsui',
          },
        ],
      });

      const unsignedSweepTxnDeserialize = new TransferTransaction(basecoin);
      const serializedTxHex = res.txRequests[0].transactions[0].unsignedTx.serializedTx;
      const serializedTxBase64 = Buffer.from(serializedTxHex, 'hex').toString('base64');
      unsignedSweepTxnDeserialize.fromRawTransaction(serializedTxBase64);
      const unsignedSweepTxnJson = unsignedSweepTxnDeserialize.toJson();
      should.equal(unsignedSweepTxnJson.id, '3xexf67vjACcvsd3XCR5XWNm1cDeGCbcnJ5NhAHBmdBc');
      should.equal(unsignedSweepTxnJson.sender, senderAddress0);

      sandBox.assert.callCount(basecoin.getBalance, 1);
      sandBox.assert.callCount(basecoin.getInputCoins, 1);
      sandBox.assert.callCount(basecoin.getFeeEstimate, 1);
    });

    it('should recover a txn for unsigned sweep recovery with multiple input coins', async function () {
      const senderAddress = '0x00e4eaa6a291fe02918452e645b5653cd260a5fc0fb35f6193d580916aa9e389';
      getBalanceStub.withArgs(senderAddress).resolves('1798002120');
      getInputCoinsStub.withArgs(senderAddress).resolves([
        {
          coinType: '0x2::sui::SUI',
          objectId: '0x60aefaffa35daa32a1e561f2ba9c18753057d2feb502f32804e573ea2875a39c',
          version: '195',
          digest: 'jKjduy8gHDE244ZJWcP3JXfXPKjqY67avMqhzHw98CL',
          balance: new BigNumber('98002120'),
        },
        {
          coinType: '0x2::sui::SUI',
          objectId: '0x9a363c91d29b50832ab98094b6c1933941280fc298a2ec232739f14ce31e2582',
          version: '197',
          digest: 'ELnbgmW7crPYr3B9pWVqfg9uLeJt43KPofkfdR6LWftu',
          balance: new BigNumber('1700000000'),
        },
      ]);
      getFeeEstimateStub
        .withArgs(
          'AAACAAjIdDVlAAAAAAAgMtjlfubZHlVY2gZ3FUwvCFeVNI4xf5Wsye+t4bQRL8wCAgABAQAAAQECAAABAQAA5OqmopH+ApGEUuZFtWU80mCl/A+zX2GT1YCRaqnjiQKaNjyR0ptQgyq5gJS2wZM5QSgPwpii7CMnOfFM4x4lgsUAAAAAAAAAIMY5hfUFzuMVaY3+LwmZTvypRSAJRLNXocRYR9yKalXyYK76/6NdqjKh5WHyupwYdTBX0v61AvMoBOVz6ih1o5zDAAAAAAAAACAK15PtO6gwSNx0bHksVJOcN96AYyc+3YVpJzaYMMhHbQDk6qaikf4CkYRS5kW1ZTzSYKX8D7NfYZPVgJFqqeOJ6AMAAAAAAAAA4fUFAAAAAAA='
        )
        .resolves(new BigNumber(1997880));
      const res = await basecoin.recover({
        bitgoKey:
          '7d91f69c285c0b3b0a0d6371020f194d45956ee556289e7854f6d114e07805720eec673c6a2\n72b7da4137db7b1289f38af4f4b824ef0de65c5f53e3e66617617',
        recoveryDestination: '0x32d8e57ee6d91e5558da0677154c2f085795348e317f95acc9efade1b4112fcc',
      });

      res.should.deepEqual({
        txRequests: [
          {
            transactions: [
              {
                unsignedTx: {
                  serializedTx:
                    '0000020008c874356500000000002032d8e57ee6d91e5558da0677154c2f085795348e317f95acc9efade1b4112fcc02020001010000010102000001010000e4eaa6a291fe02918452e645b5653cd260a5fc0fb35f6193d580916aa9e389029a363c91d29b50832ab98094b6c1933941280fc298a2ec232739f14ce31e2582c50000000000000020c63985f505cee315698dfe2f09994efca945200944b357a1c45847dc8a6a55f260aefaffa35daa32a1e561f2ba9c18753057d2feb502f32804e573ea2875a39cc300000000000000200ad793ed3ba83048dc746c792c54939c37de8063273edd856927369830c8476d00e4eaa6a291fe02918452e645b5653cd260a5fc0fb35f6193d580916aa9e389e803000000000000a48821000000000000',
                  scanIndex: 0,
                  coin: 'tsui',
                  signableHex: '6a662a1f8e3bcb7015ccbd6fb422c1b6b358d6da4231f2e6e8a0d1c8124be8fd',
                  derivationPath: 'm/0',
                  parsedTx: {
                    inputs: [
                      {
                        address: '0x00e4eaa6a291fe02918452e645b5653cd260a5fc0fb35f6193d580916aa9e389',
                        valueString: '1698002120',
                        value: new BigNumber(1698002120),
                      },
                    ],
                    outputs: [
                      {
                        address: '0x32d8e57ee6d91e5558da0677154c2f085795348e317f95acc9efade1b4112fcc',
                        valueString: '1698002120',
                        coinName: 'tsui',
                      },
                    ],
                    spendAmount: '1698002120',
                    type: 'Transfer',
                  },
                  feeInfo: { fee: 2197668, feeString: '2197668' },
                  coinSpecific: {
                    commonKeychain:
                      '7d91f69c285c0b3b0a0d6371020f194d45956ee556289e7854f6d114e07805720eec673c6a272b7da4137db7b1289f38af4f4b824ef0de65c5f53e3e66617617',
                  },
                },
                signatureShares: [],
              },
            ],
            walletCoin: 'tsui',
          },
        ],
      });

      const unsignedSweepTxnDeserialize = new TransferTransaction(basecoin);
      const serializedTxHex = res.txRequests[0].transactions[0].unsignedTx.serializedTx;
      const serializedTxBase64 = Buffer.from(serializedTxHex, 'hex').toString('base64');
      unsignedSweepTxnDeserialize.fromRawTransaction(serializedTxBase64);
      const unsignedSweepTxnJson = unsignedSweepTxnDeserialize.toJson();
      should.equal(unsignedSweepTxnJson.id, '8sgAijM73Qu11V7kjqJwFEshtbVustTKJDhFHUgoVdkz');
      should.equal(unsignedSweepTxnJson.sender, senderAddress);

      sandBox.assert.callCount(basecoin.getBalance, 1);
      sandBox.assert.callCount(basecoin.getInputCoins, 1);
      sandBox.assert.callCount(basecoin.getFeeEstimate, 1);
    });
  });

  describe('Recover Transactions for wallet with multiple addresses:', () => {
    const sandBox = sinon.createSandbox();
    const senderAddress0 = '0x91f25e237b83a00a62724fdc4a81e43f494dc6b41a1241492826d36e4d131da3';
    const senderAddress1 = '0x32d8e57ee6d91e5558da0677154c2f085795348e317f95acc9efade1b4112fcc';
    const recoveryDestination = '0x00e4eaa6a291fe02918452e645b5653cd260a5fc0fb35f6193d580916aa9e389';
    const walletPassphrase = 'p$Sw<RjvAgf{nYAYI2xM';

    beforeEach(function () {
      let callBack = sandBox.stub(Sui.prototype, 'getBalance' as keyof Sui);
      callBack.withArgs(senderAddress0).resolves('0').withArgs(senderAddress1).resolves('1800000000');

      callBack = sandBox.stub(Sui.prototype, 'getInputCoins' as keyof Sui);
      callBack.withArgs(senderAddress1).resolves([
        {
          coinType: '0x2::sui::SUI',
          objectId: '0xff93adc2f516fcaa0c6040e01f50027a23f9b1767f5040eb2282790a6900ce7f',
          version: '196',
          digest: 'XrjRM9ZM98xdNWigHYQjCpGoWt6aZLpqXdSEixnhb4p',
          balance: new BigNumber('1800000000'),
        },
      ]);

      callBack = sandBox.stub(Sui.prototype, 'getFeeEstimate' as keyof Sui);
      callBack
        .withArgs(
          'AAACAAgA8VNlAAAAAAAgAOTqpqKR/gKRhFLmRbVlPNJgpfwPs19hk9WAkWqp44kCAgABAQAAAQECAAABAQAy2OV+5tkeVVjaBncVTC8IV5U0jjF/lazJ763htBEvzAH/k63C9Rb8qgxgQOAfUAJ6I/mxdn9QQOsignkKaQDOf8QAAAAAAAAAIAfnp90gMsdBGGz1tW/sFQlArhkRmYjdiXTXx+CvxHjVMtjlfubZHlVY2gZ3FUwvCFeVNI4xf5Wsye+t4bQRL8zoAwAAAAAAAADh9QUAAAAAAA=='
        )
        .resolves(new BigNumber(1997880));
    });

    afterEach(function () {
      sandBox.restore();
    });

    it('should recover a txn for non-bitgo recoveries at address 1 but search from address 0', async function () {
      const res = await basecoin.recover({
        userKey: keys.userKey,
        backupKey: keys.backupKey,
        bitgoKey: keys.bitgoKey,
        recoveryDestination,
        walletPassphrase,
      });
      res.should.not.be.empty();
      res.should.hasOwnProperty('serializedTx');
      res.should.hasOwnProperty('scanIndex');
      res.should.hasOwnProperty('recoveryAmount');
      res.should.hasOwnProperty('signature');

      res.serializedTx.should.equal(
        'AAACAAgA8VNlAAAAAAAgAOTqpqKR/gKRhFLmRbVlPNJgpfwPs19hk9WAkWqp44kCAgABAQAAAQECAAABAQAy2OV+5tkeVVjaBncVTC8IV5U0jjF/lazJ763htBEvzAH/k63C9Rb8qgxgQOAfUAJ6I/mxdn9QQOsignkKaQDOf8QAAAAAAAAAIAfnp90gMsdBGGz1tW/sFQlArhkRmYjdiXTXx+CvxHjVMtjlfubZHlVY2gZ3FUwvCFeVNI4xf5Wsye+t4bQRL8zoAwAAAAAAAKSIIQAAAAAAAA=='
      );
      res.scanIndex.should.equal(1);
      res.recoveryAmount.should.equal('1700000000');

      const UnsignedSweepTxnDeserialize = new TransferTransaction(basecoin);
      UnsignedSweepTxnDeserialize.fromRawTransaction(res.serializedTx);
      const UnsignedSweepTxnJson = UnsignedSweepTxnDeserialize.toJson();

      should.equal(UnsignedSweepTxnJson.id, '4XxsV2ktbcG3gF3Zj46EL9irJd9KgKoKPQYEDtPiQs21');
      should.equal(UnsignedSweepTxnJson.sender, senderAddress1);
      sandBox.assert.callCount(basecoin.getBalance, 2);
      sandBox.assert.callCount(basecoin.getInputCoins, 1);
      sandBox.assert.callCount(basecoin.getFeeEstimate, 1);
    });

    it('should recover a txn for non-bitgo recoveries at address 1 but search from address 1', async function () {
      const res = await basecoin.recover({
        userKey: keys.userKey,
        backupKey: keys.backupKey,
        bitgoKey: keys.bitgoKey,
        recoveryDestination,
        walletPassphrase,
        startingScanIndex: 1,
      });
      res.should.not.be.empty();
      res.should.hasOwnProperty('serializedTx');
      res.should.hasOwnProperty('scanIndex');
      res.should.hasOwnProperty('recoveryAmount');
      res.should.hasOwnProperty('signature');

      res.serializedTx.should.equal(
        'AAACAAgA8VNlAAAAAAAgAOTqpqKR/gKRhFLmRbVlPNJgpfwPs19hk9WAkWqp44kCAgABAQAAAQECAAABAQAy2OV+5tkeVVjaBncVTC8IV5U0jjF/lazJ763htBEvzAH/k63C9Rb8qgxgQOAfUAJ6I/mxdn9QQOsignkKaQDOf8QAAAAAAAAAIAfnp90gMsdBGGz1tW/sFQlArhkRmYjdiXTXx+CvxHjVMtjlfubZHlVY2gZ3FUwvCFeVNI4xf5Wsye+t4bQRL8zoAwAAAAAAAKSIIQAAAAAAAA=='
      );
      res.scanIndex.should.equal(1);
      res.recoveryAmount.should.equal('1700000000');

      const UnsignedSweepTxnDeserialize = new TransferTransaction(basecoin);
      UnsignedSweepTxnDeserialize.fromRawTransaction(res.serializedTx);
      const UnsignedSweepTxnJson = UnsignedSweepTxnDeserialize.toJson();

      should.equal(UnsignedSweepTxnJson.id, '4XxsV2ktbcG3gF3Zj46EL9irJd9KgKoKPQYEDtPiQs21');
      should.equal(UnsignedSweepTxnJson.sender, senderAddress1);
      sandBox.assert.callCount(basecoin.getBalance, 1);
      sandBox.assert.callCount(basecoin.getInputCoins, 1);
      sandBox.assert.callCount(basecoin.getFeeEstimate, 1);
    });
  });

  describe('Recover Transaction Failures:', () => {
    const sandBox = sinon.createSandbox();
    const senderAddress0 = '0x91f25e237b83a00a62724fdc4a81e43f494dc6b41a1241492826d36e4d131da3';
    const recoveryDestination = '0x00e4eaa6a291fe02918452e645b5653cd260a5fc0fb35f6193d580916aa9e389';
    const walletPassphrase = 'p$Sw<RjvAgf{nYAYI2xM';

    afterEach(function () {
      sandBox.restore();
    });

    it('should fail to recover due to non-zero fund but insufficient funds address', async function () {
      const callBack = sandBox.stub(Sui.prototype, 'getBalance' as keyof Sui);
      callBack.withArgs(senderAddress0).resolves('9800212');

      await basecoin
        .recover({
          userKey: keys.userKey,
          backupKey: keys.backupKey,
          bitgoKey: keys.bitgoKey,
          recoveryDestination,
          walletPassphrase,
        })
        .should.rejectedWith(
          `Found address ${senderAddress0} with non-zero fund but fund is insufficient to support a recovery ` +
            `transaction. Please start the next scan at address index 1.`
        );

      sandBox.assert.callCount(basecoin.getBalance, 1);
    });

    it('should fail to recover due to not finding an address with funds', async function () {
      const callBack = sandBox.stub(Sui.prototype, 'getBalance' as keyof Sui);
      callBack.resolves('0');

      const numIterations = 10;
      await basecoin
        .recover({
          userKey: keys.userKey,
          backupKey: keys.backupKey,
          bitgoKey: keys.bitgoKey,
          recoveryDestination,
          walletPassphrase,
          scan: numIterations,
        })
        .should.rejectedWith('Did not find an address with funds to recover');

      sandBox.assert.callCount(basecoin.getBalance, numIterations);
    });
  });
});
