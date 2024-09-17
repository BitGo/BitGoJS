import should from 'should';

import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';
import { Sui, TokenTransferTransaction, TransferTransaction, Tsui } from '../../src';
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
        outputAmount: `${testData.AMOUNT * 2}`,
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
      res.should.hasOwnProperty('transactions');
      const tx = res.transactions[0];
      tx.scanIndex.should.equal(0);
      tx.recoveryAmount.should.equal('1897802332');
      tx.serializedTx.should.equal(
        'AAACAAhcKh5xAAAAAAAgAOTqpqKR/gKRhFLmRbVlPNJgpfwPs19hk9WAkWqp44kCAgABAQAAAQECAAABAQCR8l4je4OgCmJyT9xKgeQ/SU3GtBoSQUkoJtNuTRMdowHAXHZeJuauhMePokXziiP7IEBqXPP2G1e9MjoN+dmAA8MAAAAAAAAAIFvJiJBdEAhi14cxcSr/HUIhBZMbLMd4rczUTCMIb3UmkfJeI3uDoApick/cSoHkP0lNxrQaEkFJKCbTbk0THaPoAwAAAAAAAKSIIQAAAAAAAA=='
      );

      const NonBitGoTxnDeserialize = new TransferTransaction(basecoin);
      NonBitGoTxnDeserialize.fromRawTransaction(tx.serializedTx);
      const NonBitGoTxnJson = NonBitGoTxnDeserialize.toJson();

      should.equal(NonBitGoTxnJson.id, 'FDCBUNqLUAW4qBTnFjTCPZazL8VnRBP2gS3GmEnwtEcg');
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
                    '00000200085c2a1e7100000000002000e4eaa6a291fe02918452e645b5653cd260a5fc0fb35f6193d580916aa9e38902020001010000010102000001010091f25e237b83a00a62724fdc4a81e43f494dc6b41a1241492826d36e4d131da301c05c765e26e6ae84c78fa245f38a23fb20406a5cf3f61b57bd323a0df9d98003c300000000000000205bc988905d100862d78731712aff1d422105931b2cc778adccd44c23086f752691f25e237b83a00a62724fdc4a81e43f494dc6b41a1241492826d36e4d131da3e803000000000000a48821000000000000',
                  scanIndex: 0,
                  coin: 'tsui',
                  signableHex: '873748a31e766f5f8f0077d8d0003548fae4f4c1344067a7c3799cfa73808fb7',
                  derivationPath: 'm/0',
                  parsedTx: {
                    inputs: [
                      {
                        address: '0x91f25e237b83a00a62724fdc4a81e43f494dc6b41a1241492826d36e4d131da3',
                        valueString: '1897802332',
                        value: new BigNumber(1897802332),
                      },
                    ],
                    outputs: [
                      {
                        address: '0x00e4eaa6a291fe02918452e645b5653cd260a5fc0fb35f6193d580916aa9e389',
                        valueString: '1897802332',
                        coinName: 'tsui',
                      },
                    ],
                    spendAmount: '1897802332',
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
      should.equal(unsignedSweepTxnJson.id, 'FDCBUNqLUAW4qBTnFjTCPZazL8VnRBP2gS3GmEnwtEcg');
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
                    '000002000824cd096b00000000002032d8e57ee6d91e5558da0677154c2f085795348e317f95acc9efade1b4112fcc02020001010000010102000001010000e4eaa6a291fe02918452e645b5653cd260a5fc0fb35f6193d580916aa9e389029a363c91d29b50832ab98094b6c1933941280fc298a2ec232739f14ce31e2582c50000000000000020c63985f505cee315698dfe2f09994efca945200944b357a1c45847dc8a6a55f260aefaffa35daa32a1e561f2ba9c18753057d2feb502f32804e573ea2875a39cc300000000000000200ad793ed3ba83048dc746c792c54939c37de8063273edd856927369830c8476d00e4eaa6a291fe02918452e645b5653cd260a5fc0fb35f6193d580916aa9e389e803000000000000a48821000000000000',
                  scanIndex: 0,
                  coin: 'tsui',
                  signableHex: '3eec395ccaee7d6a0b9fa5488dd00bfeb89dc4bd37e3139ebebb62c2e60bc00d',
                  derivationPath: 'm/0',
                  parsedTx: {
                    inputs: [
                      {
                        address: '0x00e4eaa6a291fe02918452e645b5653cd260a5fc0fb35f6193d580916aa9e389',
                        valueString: '1795804452',
                        value: new BigNumber(1795804452),
                      },
                    ],
                    outputs: [
                      {
                        address: '0x32d8e57ee6d91e5558da0677154c2f085795348e317f95acc9efade1b4112fcc',
                        valueString: '1795804452',
                        coinName: 'tsui',
                      },
                    ],
                    spendAmount: '1795804452',
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
      should.equal(unsignedSweepTxnJson.id, '7Jyx3KUVXxs1Q2i1RqXtj4hFgUgBon6PUQAovL84Y3eP');
      should.equal(unsignedSweepTxnJson.sender, senderAddress);

      sandBox.assert.callCount(basecoin.getBalance, 1);
      sandBox.assert.callCount(basecoin.getInputCoins, 1);
      sandBox.assert.callCount(basecoin.getFeeEstimate, 1);
    });
  });

  describe('Recover Token Transactions:', () => {
    const sandBox = sinon.createSandbox();
    const coinType = '0x36dbef866a1d62bf7328989a10fb2f07d769f4ee587c0de4a0a256e57e0a58a8::deep::DEEP';
    const senderAddress0 = '0x91f25e237b83a00a62724fdc4a81e43f494dc6b41a1241492826d36e4d131da3';
    const senderAddressColdWallet = '0x016495ddda748c116a218242835d364709d6c5ee5c8a1ed684c4ef433d314421';
    const recoveryDestination = '0x00e4eaa6a291fe02918452e645b5653cd260a5fc0fb35f6193d580916aa9e389';
    const walletPassphrase = 'p$Sw<RjvAgf{nYAYI2xM';
    const tokenContractAddress = '0x36dbef866a1d62bf7328989a10fb2f07d769f4ee587c0de4a0a256e57e0a58a8';
    let getBalanceStub: sinon.SinonStub;
    let getInputCoinsStub: sinon.SinonStub;
    let getFeeEstimateStub: sinon.SinonStub;

    beforeEach(() => {
      getBalanceStub = sandBox.stub(Sui.prototype, 'getBalance' as keyof Sui);
      getInputCoinsStub = sandBox.stub(Sui.prototype, 'getInputCoins' as keyof Sui);
      getFeeEstimateStub = sandBox.stub(Sui.prototype, 'getFeeEstimate' as keyof Sui);
    });

    afterEach(() => {
      sandBox.restore();
    });

    it('should recover a token txn for non-bitgo recovery', async function () {
      getBalanceStub.withArgs(senderAddress0, coinType).resolves('1000');
      getInputCoinsStub.withArgs(senderAddress0, coinType).resolves([
        {
          coinType: '0x36dbef866a1d62bf7328989a10fb2f07d769f4ee587c0de4a0a256e57e0a58a8::deep::DEEP',
          objectId: '0x924ab69ebba304f2975a588372b41e4e1f5db7fa824868f84199eeb1e0a15a2d',
          version: '34696807',
          digest: '7XRbWQTiwAUCjLLsZVpJMrABCheJBkzKVfCr7aTZZVkd',
          balance: new BigNumber(1000),
        },
      ]);
      getInputCoinsStub.withArgs(senderAddress0).resolves([
        {
          coinType: '0x2::sui::SUI',
          objectId: '0x9146928f557cb8ab1915a5886c1362435a05b4709b586bb01d4c70e85bb53161',
          version: '239',
          digest: 'GLSzR6HJ319nPKAFm5x3TWHcaHZzCFSBCqhvZ1qwT5wr',
          balance: new BigNumber('1230261076'),
        },
        {
          coinType: '0x2::sui::SUI',
          objectId: '0x93f700dc82e229f699f47b167859c5108288b78f54068800cc290900d0de8429',
          version: '149',
          digest: '2wXDxt2ZxekBxN6oW3BqVDXZcX49C87n1AN26Nyu7kPR',
          balance: new BigNumber('169611024'),
        },
        {
          coinType: '0x2::sui::SUI',
          objectId: '0xb869b45744ca2c4a663c6e8679db5a632bead0364273842d3990d7ff65d57b1e',
          version: '237',
          digest: 'F1xWKPVHV5WL72ErjgQxrjn3RNH2GHjyN9jTgwW7Qphk',
          balance: new BigNumber('101976'),
        },
      ]);
      getFeeEstimateStub
        .withArgs(
          'AAADAQCSSraeu6ME8pdaWINytB5OH123+oJIaPhBme6x4KFaLWduEQIAAAAAIGDxWv07uqv0hEZiOG0FC/xG830WBmRDZLOLmMp61gdSAAjoAwAAAAAAAAAgAOTqpqKR/gKRhFLmRbVlPNJgpfwPs19hk9WAkWqp44kCAgEAAAEBAQABAQIAAAECAJHyXiN7g6AKYnJP3EqB5D9JTca0GhJBSSgm025NEx2jAZFGko9VfLirGRWliGwTYkNaBbRwm1hrsB1McOhbtTFh7wAAAAAAAAAg49q55eJGGM5xtoJzY233UnL2dj1Kb5N90YxZ70QopW2R8l4je4OgCmJyT9xKgeQ/SU3GtBoSQUkoJtNuTRMdo+gDAAAAAAAAAOH1BQAAAAAA'
        )
        .resolves(new BigNumber(2345504));

      const res = await basecoin.recover({
        userKey: keys.userKey,
        backupKey: keys.backupKey,
        bitgoKey: keys.bitgoKey,
        recoveryDestination,
        walletPassphrase,
        tokenContractAddress,
      });
      res.should.not.be.empty();
      res.should.hasOwnProperty('transactions');
      const tx = res.transactions[0];
      tx.scanIndex.should.equal(0);
      tx.recoveryAmount.should.equal('1000');
      tx.serializedTx.should.equal(
        'AAADAQCSSraeu6ME8pdaWINytB5OH123+oJIaPhBme6x4KFaLWduEQIAAAAAIGDxWv07uqv0hEZiOG0FC/xG830WBmRDZLOLmMp61gdSAAjoAwAAAAAAAAAgAOTqpqKR/gKRhFLmRbVlPNJgpfwPs19hk9WAkWqp44kCAgEAAAEBAQABAQIAAAECAJHyXiN7g6AKYnJP3EqB5D9JTca0GhJBSSgm025NEx2jAZFGko9VfLirGRWliGwTYkNaBbRwm1hrsB1McOhbtTFh7wAAAAAAAAAg49q55eJGGM5xtoJzY233UnL2dj1Kb5N90YxZ70QopW2R8l4je4OgCmJyT9xKgeQ/SU3GtBoSQUkoJtNuTRMdo+gDAAAAAAAAVl4nAAAAAAAA'
      );

      const NonBitGoTxnDeserialize = new TokenTransferTransaction(basecoin);
      NonBitGoTxnDeserialize.fromRawTransaction(tx.serializedTx);
      const NonBitGoTxnJson = NonBitGoTxnDeserialize.toJson();

      should.equal(NonBitGoTxnJson.id, 'DYW9mA8AZGQntk7HGQUEoEdy8BaH8Hh9Ts294EnqGTEr');
      should.equal(NonBitGoTxnJson.sender, senderAddress0);
      sandBox.assert.callCount(basecoin.getBalance, 2);
      sandBox.assert.callCount(basecoin.getInputCoins, 2);
      sandBox.assert.callCount(basecoin.getFeeEstimate, 1);
    });

    it('should recover a token txn for unsigned sweep recovery', async function () {
      getBalanceStub.withArgs(senderAddressColdWallet).resolves('298980240');
      getBalanceStub.withArgs(senderAddressColdWallet, coinType).resolves('1000');

      getInputCoinsStub.withArgs(senderAddressColdWallet, coinType).resolves([
        {
          coinType: '0x36dbef866a1d62bf7328989a10fb2f07d769f4ee587c0de4a0a256e57e0a58a8::deep::DEEP',
          objectId: '0x4c1cccc6d03510bd74a95f81b2b7da08119cb18e2c565435e7ad715e6aadc5a7',
          version: '34696809',
          digest: 'Afy4LW46tuczj341TbCLeeynxrupj9Lw2qBQUpndHc1c',
          balance: new BigNumber(1000),
        },
      ]);
      getInputCoinsStub.withArgs(senderAddressColdWallet).resolves([
        {
          coinType: '0x2::sui::SUI',
          objectId: '0x98114f2ddefe3f16d9d2e016194b52c4c3af430c1601bdb3539cbd237cbca068',
          version: '34696809',
          digest: 'DBtoqvWtrcYHE1HjQUo4igTkHYxY7D83iHSoKXi9A85W',
          balance: new BigNumber(200000000),
        },
        {
          coinType: '0x2::sui::SUI',
          objectId: '0x9ec13440647b0bee74f45409589ad2ff5a18c9615f99d5d914f988b834da493e',
          version: '239',
          digest: '9d3uVsQ4p37TGnzTpnXXw2pFoggbVfVp9CdC4jpZq664',
          balance: new BigNumber(98980240),
        },
      ]);
      getFeeEstimateStub
        .withArgs(
          'AAADAQBMHMzG0DUQvXSpX4Gyt9oIEZyxjixWVDXnrXFeaq3Fp2luEQIAAAAAII+0ozS4Kazey/oqMoZCr6JNb5U3QPdoMIDuDks9OpYvAAjoAwAAAAAAAAAgAOTqpqKR/gKRhFLmRbVlPNJgpfwPs19hk9WAkWqp44kCAgEAAAEBAQABAQIAAAECAAFkld3adIwRaiGCQoNdNkcJ1sXuXIoe1oTE70M9MUQhAZgRTy3e/j8W2dLgFhlLUsTDr0MMFgG9s1OcvSN8vKBoaW4RAgAAAAAgtRahW1A0vNQkJUQMVkzzb0OVQviGce95nd4GYeeJoAkBZJXd2nSMEWohgkKDXTZHCdbF7lyKHtaExO9DPTFEIegDAAAAAAAAAOH1BQAAAAAA'
        )
        .resolves(new BigNumber(2345504));

      const res = await basecoin.recover({
        bitgoKey: keys.bitgoKeyColdWallet,
        recoveryDestination,
        tokenContractAddress,
      });

      res.should.deepEqual({
        txRequests: [
          {
            transactions: [
              {
                unsignedTx: {
                  serializedTx:
                    '00000301004c1cccc6d03510bd74a95f81b2b7da08119cb18e2c565435e7ad715e6aadc5a7696e110200000000208fb4a334b829acdecbfa2a328642afa24d6f953740f7683080ee0e4b3d3a962f0008e803000000000000002000e4eaa6a291fe02918452e645b5653cd260a5fc0fb35f6193d580916aa9e3890202010000010101000101020000010200016495ddda748c116a218242835d364709d6c5ee5c8a1ed684c4ef433d3144210198114f2ddefe3f16d9d2e016194b52c4c3af430c1601bdb3539cbd237cbca068696e11020000000020b516a15b5034bcd42425440c564cf36f439542f88671ef799dde0661e789a009016495ddda748c116a218242835d364709d6c5ee5c8a1ed684c4ef433d314421e803000000000000565e27000000000000',
                  scanIndex: 0,
                  coin: 'tsui:deep',
                  signableHex: 'e3547a58b9c48840a2774aeb71b8652a70b67ee59c3fa5b1f743738d8b295199',
                  derivationPath: 'm/0',
                  parsedTx: {
                    inputs: [
                      {
                        address: '0x016495ddda748c116a218242835d364709d6c5ee5c8a1ed684c4ef433d314421',
                        valueString: '1000',
                        value: new BigNumber(1000),
                      },
                    ],
                    outputs: [
                      {
                        address: '0x00e4eaa6a291fe02918452e645b5653cd260a5fc0fb35f6193d580916aa9e389',
                        valueString: '1000',
                        coinName: 'tsui:deep',
                      },
                    ],
                    spendAmount: '1000',
                    type: 'TokenTransfer',
                  },
                  feeInfo: {
                    fee: 2580054,
                    feeString: '2580054',
                  },
                  coinSpecific: {
                    commonKeychain:
                      '79d4b9b594df028fee3725a6af51ae3ab6a3519e9d2c322f2c8fd815b96496323c5aba7ea874c102f966f1a61d3c9a42b5f3177c6a85712cf313715afddf83d8',
                  },
                },
                signatureShares: [],
              },
            ],
            walletCoin: 'tsui:deep',
          },
        ],
      });

      const unsignedSweepTxnDeserialize = new TransferTransaction(basecoin);
      const serializedTxHex = res.txRequests[0].transactions[0].unsignedTx.serializedTx;
      const serializedTxBase64 = Buffer.from(serializedTxHex, 'hex').toString('base64');
      unsignedSweepTxnDeserialize.fromRawTransaction(serializedTxBase64);
      const unsignedSweepTxnJson = unsignedSweepTxnDeserialize.toJson();
      should.equal(unsignedSweepTxnJson.id, 'F8wrUjZYf6xvDW2LzW9DohAKyJFcWgGEvjMoKLxCajmV');
      should.equal(unsignedSweepTxnJson.sender, senderAddressColdWallet);

      sandBox.assert.callCount(basecoin.getBalance, 2);
      sandBox.assert.callCount(basecoin.getInputCoins, 2);
      sandBox.assert.callCount(basecoin.getFeeEstimate, 1);
    });

    it('should recover a token txn for unsigned sweep recovery with multiple input coins', async function () {
      getBalanceStub.withArgs(senderAddressColdWallet).resolves('298980240');
      getBalanceStub.withArgs(senderAddressColdWallet, coinType).resolves('11000');
      getInputCoinsStub.withArgs(senderAddressColdWallet, coinType).resolves([
        {
          coinType: '0x36dbef866a1d62bf7328989a10fb2f07d769f4ee587c0de4a0a256e57e0a58a8::deep::DEEP',
          objectId: '0x4c1cccc6d03510bd74a95f81b2b7da08119cb18e2c565435e7ad715e6aadc5a7',
          version: '34696809',
          digest: 'Afy4LW46tuczj341TbCLeeynxrupj9Lw2qBQUpndHc1c',
          balance: new BigNumber('1000'),
        },
        {
          coinType: '0x36dbef866a1d62bf7328989a10fb2f07d769f4ee587c0de4a0a256e57e0a58a8::deep::DEEP',
          objectId: '0x72ad99130abd3790db7bac8908d50d3412a800a8fcd10c1cfbd64b8215537558',
          version: '34696865',
          digest: 'X8uaNDkSfYKa6PBzJJUe9StP4nRWR9RZoa2nJHqv5mn',
          balance: new BigNumber('10000'),
        },
      ]);
      getInputCoinsStub.withArgs(senderAddressColdWallet).resolves([
        {
          coinType: '0x2::sui::SUI',
          objectId: '0x98114f2ddefe3f16d9d2e016194b52c4c3af430c1601bdb3539cbd237cbca068',
          version: '34696809',
          digest: 'DBtoqvWtrcYHE1HjQUo4igTkHYxY7D83iHSoKXi9A85W',
          balance: new BigNumber('200000000'),
        },
        {
          coinType: '0x2::sui::SUI',
          objectId: '0x9ec13440647b0bee74f45409589ad2ff5a18c9615f99d5d914f988b834da493e',
          version: '239',
          digest: '9d3uVsQ4p37TGnzTpnXXw2pFoggbVfVp9CdC4jpZq664',
          balance: new BigNumber('98980240'),
        },
      ]);
      getFeeEstimateStub
        .withArgs(
          'AAAEAQByrZkTCr03kNt7rIkI1Q00EqgAqPzRDBz71kuCFVN1WKFuEQIAAAAAIAe4XTi24bSF8UVZMNJylhCAgcqs12ZMSNfV9IVy7iu9AQBMHMzG0DUQvXSpX4Gyt9oIEZyxjixWVDXnrXFeaq3Fp2luEQIAAAAAII+0ozS4Kazey/oqMoZCr6JNb5U3QPdoMIDuDks9OpYvAAj4KgAAAAAAAAAgAOTqpqKR/gKRhFLmRbVlPNJgpfwPs19hk9WAkWqp44kDAwEAAAEBAQACAQAAAQECAAEBAgEAAQMAAWSV3dp0jBFqIYJCg102RwnWxe5cih7WhMTvQz0xRCEBmBFPLd7+PxbZ0uAWGUtSxMOvQwwWAb2zU5y9I3y8oGhpbhECAAAAACC1FqFbUDS81CQlRAxWTPNvQ5VC+IZx73md3gZh54mgCQFkld3adIwRaiGCQoNdNkcJ1sXuXIoe1oTE70M9MUQh6AMAAAAAAAAA4fUFAAAAAAA='
        )
        .resolves(new BigNumber(1036328));
      const res = await basecoin.recover({
        bitgoKey: keys.bitgoKeyColdWallet,
        recoveryDestination,
        tokenContractAddress,
      });

      res.should.deepEqual({
        txRequests: [
          {
            transactions: [
              {
                unsignedTx: {
                  serializedTx:
                    '000004010072ad99130abd3790db7bac8908d50d3412a800a8fcd10c1cfbd64b8215537558a16e1102000000002007b85d38b6e1b485f1455930d27296108081caacd7664c48d7d5f48572ee2bbd01004c1cccc6d03510bd74a95f81b2b7da08119cb18e2c565435e7ad715e6aadc5a7696e110200000000208fb4a334b829acdecbfa2a328642afa24d6f953740f7683080ee0e4b3d3a962f0008f82a000000000000002000e4eaa6a291fe02918452e645b5653cd260a5fc0fb35f6193d580916aa9e38903030100000101010002010000010102000101020100010300016495ddda748c116a218242835d364709d6c5ee5c8a1ed684c4ef433d3144210198114f2ddefe3f16d9d2e016194b52c4c3af430c1601bdb3539cbd237cbca068696e11020000000020b516a15b5034bcd42425440c564cf36f439542f88671ef799dde0661e789a009016495ddda748c116a218242835d364709d6c5ee5c8a1ed684c4ef433d314421e803000000000000f86411000000000000',
                  scanIndex: 0,
                  coin: 'tsui:deep',
                  signableHex: 'cd028c401f815dab7f6c5e8a33976879c5c799ae7c9fde01cafd0aee0075a174',
                  derivationPath: 'm/0',
                  parsedTx: {
                    inputs: [
                      {
                        address: '0x016495ddda748c116a218242835d364709d6c5ee5c8a1ed684c4ef433d314421',
                        valueString: '11000',
                        value: new BigNumber('11000'),
                      },
                    ],
                    outputs: [
                      {
                        address: '0x00e4eaa6a291fe02918452e645b5653cd260a5fc0fb35f6193d580916aa9e389',
                        valueString: '11000',
                        coinName: 'tsui:deep',
                      },
                    ],
                    spendAmount: '11000',
                    type: 'TokenTransfer',
                  },
                  feeInfo: {
                    fee: 1139960,
                    feeString: '1139960',
                  },
                  coinSpecific: {
                    commonKeychain:
                      '79d4b9b594df028fee3725a6af51ae3ab6a3519e9d2c322f2c8fd815b96496323c5aba7ea874c102f966f1a61d3c9a42b5f3177c6a85712cf313715afddf83d8',
                  },
                },
                signatureShares: [],
              },
            ],
            walletCoin: 'tsui:deep',
          },
        ],
      });

      const unsignedSweepTxnDeserialize = new TransferTransaction(basecoin);
      const serializedTxHex = res.txRequests[0].transactions[0].unsignedTx.serializedTx;
      const serializedTxBase64 = Buffer.from(serializedTxHex, 'hex').toString('base64');
      unsignedSweepTxnDeserialize.fromRawTransaction(serializedTxBase64);
      const unsignedSweepTxnJson = unsignedSweepTxnDeserialize.toJson();
      should.equal(unsignedSweepTxnJson.id, '4qeXJP7pTa6pmyAKuJZG9AkGsKM53SDqHVcPjRMFHjc5');
      should.equal(unsignedSweepTxnJson.sender, senderAddressColdWallet);

      sandBox.assert.callCount(basecoin.getBalance, 2);
      sandBox.assert.callCount(basecoin.getInputCoins, 2);
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
      res.should.hasOwnProperty('transactions');
      const tx = res.transactions[0];
      tx.scanIndex.should.equal(1);
      tx.recoveryAmount.should.equal('1797802332');
      tx.serializedTx.should.equal(
        'AAACAAhcSShrAAAAAAAgAOTqpqKR/gKRhFLmRbVlPNJgpfwPs19hk9WAkWqp44kCAgABAQAAAQECAAABAQAy2OV+5tkeVVjaBncVTC8IV5U0jjF/lazJ763htBEvzAH/k63C9Rb8qgxgQOAfUAJ6I/mxdn9QQOsignkKaQDOf8QAAAAAAAAAIAfnp90gMsdBGGz1tW/sFQlArhkRmYjdiXTXx+CvxHjVMtjlfubZHlVY2gZ3FUwvCFeVNI4xf5Wsye+t4bQRL8zoAwAAAAAAAKSIIQAAAAAAAA=='
      );

      const UnsignedSweepTxnDeserialize = new TransferTransaction(basecoin);
      UnsignedSweepTxnDeserialize.fromRawTransaction(tx.serializedTx);
      const UnsignedSweepTxnJson = UnsignedSweepTxnDeserialize.toJson();

      should.equal(UnsignedSweepTxnJson.id, 'BqHcCR51mqUyi5GJYEED3cw9AgpJ3SraTrt5aE9nLkLj');
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
      res.should.hasOwnProperty('transactions');
      const tx = res.transactions[0];
      tx.scanIndex.should.equal(1);
      tx.recoveryAmount.should.equal('1797802332');
      tx.serializedTx.should.equal(
        'AAACAAhcSShrAAAAAAAgAOTqpqKR/gKRhFLmRbVlPNJgpfwPs19hk9WAkWqp44kCAgABAQAAAQECAAABAQAy2OV+5tkeVVjaBncVTC8IV5U0jjF/lazJ763htBEvzAH/k63C9Rb8qgxgQOAfUAJ6I/mxdn9QQOsignkKaQDOf8QAAAAAAAAAIAfnp90gMsdBGGz1tW/sFQlArhkRmYjdiXTXx+CvxHjVMtjlfubZHlVY2gZ3FUwvCFeVNI4xf5Wsye+t4bQRL8zoAwAAAAAAAKSIIQAAAAAAAA=='
      );

      const UnsignedSweepTxnDeserialize = new TransferTransaction(basecoin);
      UnsignedSweepTxnDeserialize.fromRawTransaction(tx.serializedTx);
      const UnsignedSweepTxnJson = UnsignedSweepTxnDeserialize.toJson();

      should.equal(UnsignedSweepTxnJson.id, 'BqHcCR51mqUyi5GJYEED3cw9AgpJ3SraTrt5aE9nLkLj');
      should.equal(UnsignedSweepTxnJson.sender, senderAddress1);
      sandBox.assert.callCount(basecoin.getBalance, 1);
      sandBox.assert.callCount(basecoin.getInputCoins, 1);
      sandBox.assert.callCount(basecoin.getFeeEstimate, 1);
    });
  });

  describe('Recover Token Transactions for wallet with multiple addresses:', () => {
    const sandBox = sinon.createSandbox();
    const senderAddress0 = '0x91f25e237b83a00a62724fdc4a81e43f494dc6b41a1241492826d36e4d131da3';
    const senderAddress1 = '0x32d8e57ee6d91e5558da0677154c2f085795348e317f95acc9efade1b4112fcc';
    const recoveryDestination = '0x00e4eaa6a291fe02918452e645b5653cd260a5fc0fb35f6193d580916aa9e389';
    const walletPassphrase = 'p$Sw<RjvAgf{nYAYI2xM';
    const packageId = '0x36dbef866a1d62bf7328989a10fb2f07d769f4ee587c0de4a0a256e57e0a58a8';
    const coinType = `${packageId}::deep::DEEP`;
    let getBalanceStub: sinon.SinonStub;
    let getInputCoinsStub: sinon.SinonStub;
    let getFeeEstimateStub: sinon.SinonStub;

    beforeEach(function () {
      getBalanceStub = sandBox.stub(Sui.prototype, 'getBalance' as keyof Sui);
      getBalanceStub
        .withArgs(senderAddress0)
        .resolves('706875692')
        .withArgs(senderAddress0, coinType)
        .resolves('0')
        .withArgs(senderAddress1)
        .resolves('120101976')
        .withArgs(senderAddress1, coinType)
        .resolves('1000');

      getInputCoinsStub = sandBox.stub(Sui.prototype, 'getInputCoins' as keyof Sui);
      getInputCoinsStub.withArgs(senderAddress1, coinType).resolves([
        {
          coinType: '0x36dbef866a1d62bf7328989a10fb2f07d769f4ee587c0de4a0a256e57e0a58a8::deep::DEEP',
          objectId: '0xcdba76bdc3f460ed0d6af834fc17b082eb9eabd0b886f9af17cd4291f2f862fa',
          version: '34696866',
          digest: '7vbSgaGytATtnQ2fLRQo3VtCwYr9KjxsuxLLMj2dfCsU',
          balance: new BigNumber('1000'),
        },
      ]);
      getInputCoinsStub.withArgs(senderAddress1).resolves([
        {
          coinType: '0x2::sui::SUI',
          objectId: '0x0eca78901e342b2515fbf99be243b3f00ade0a7a50675b37307f44cc195c9046',
          version: '34696875',
          digest: 'APE3nj4zYm4hY2Xn9C2n3ynyPiYqxgTRejYT7ParhpU7',
          balance: new BigNumber('120000000'),
        },
        {
          coinType: '0x2::sui::SUI',
          objectId: '0x761222340db80dd9da144d55098870bc81a788205e0bbdd34c2f8df12cf45aeb',
          version: '227',
          digest: '9bwyjaSH3X8anrjGUpD1NqMrLFUtGSCK9LFuLbhjX69E',
          balance: new BigNumber('101976'),
        },
      ]);

      getFeeEstimateStub = sandBox.stub(Sui.prototype, 'getFeeEstimate' as keyof Sui);
      getFeeEstimateStub
        .withArgs(
          'AAADAQDNuna9w/Rg7Q1q+DT8F7CC656r0LiG+a8XzUKR8vhi+qJuEQIAAAAAIGbg2VphuEezzTVLyBTrQGC+GJWMRSV5YJWka7fwmD9LAAjoAwAAAAAAAAAgAOTqpqKR/gKRhFLmRbVlPNJgpfwPs19hk9WAkWqp44kCAgEAAAEBAQABAQIAAAECADLY5X7m2R5VWNoGdxVMLwhXlTSOMX+VrMnvreG0ES/MAQ7KeJAeNCslFfv5m+JDs/AK3gp6UGdbNzB/RMwZXJBGq24RAgAAAAAgi2q2sUgd0frgxWZVkgajJAb1V5f1VzaTrXEYIxkLqDAy2OV+5tkeVVjaBncVTC8IV5U0jjF/lazJ763htBEvzOgDAAAAAAAAAOH1BQAAAAAA'
        )
        .resolves(new BigNumber(2345504));
    });

    afterEach(function () {
      sandBox.restore();
    });

    it('should recover a token txn for non-bitgo recoveries at address 1 but search from address 0', async function () {
      const res = await basecoin.recover({
        userKey: keys.userKey,
        backupKey: keys.backupKey,
        bitgoKey: keys.bitgoKey,
        recoveryDestination,
        walletPassphrase,
        tokenContractAddress: packageId,
      });
      res.should.not.be.empty();
      res.should.hasOwnProperty('transactions');
      const tx = res.transactions[0];
      tx.scanIndex.should.equal(1);
      tx.recoveryAmount.should.equal('1000');
      tx.serializedTx.should.equal(
        'AAADAQDNuna9w/Rg7Q1q+DT8F7CC656r0LiG+a8XzUKR8vhi+qJuEQIAAAAAIGbg2VphuEezzTVLyBTrQGC+GJWMRSV5YJWka7fwmD9LAAjoAwAAAAAAAAAgAOTqpqKR/gKRhFLmRbVlPNJgpfwPs19hk9WAkWqp44kCAgEAAAEBAQABAQIAAAECADLY5X7m2R5VWNoGdxVMLwhXlTSOMX+VrMnvreG0ES/MAQ7KeJAeNCslFfv5m+JDs/AK3gp6UGdbNzB/RMwZXJBGq24RAgAAAAAgi2q2sUgd0frgxWZVkgajJAb1V5f1VzaTrXEYIxkLqDAy2OV+5tkeVVjaBncVTC8IV5U0jjF/lazJ763htBEvzOgDAAAAAAAAVl4nAAAAAAAA'
      );

      const UnsignedSweepTxnDeserialize = new TransferTransaction(basecoin);
      UnsignedSweepTxnDeserialize.fromRawTransaction(tx.serializedTx);
      const UnsignedSweepTxnJson = UnsignedSweepTxnDeserialize.toJson();

      should.equal(UnsignedSweepTxnJson.id, 'GFuk1VKy3wzTFeAUtrmUe6sxRhtezzrGDfKdpQTxv9so');
      should.equal(UnsignedSweepTxnJson.sender, senderAddress1);
      sandBox.assert.callCount(basecoin.getBalance, 4);
      sandBox.assert.callCount(basecoin.getInputCoins, 2);
      sandBox.assert.callCount(basecoin.getFeeEstimate, 1);
    });

    it('should recover a token txn for non-bitgo recoveries at address 1 but search from address 1', async function () {
      const res = await basecoin.recover({
        userKey: keys.userKey,
        backupKey: keys.backupKey,
        bitgoKey: keys.bitgoKey,
        recoveryDestination,
        walletPassphrase,
        tokenContractAddress: packageId,
        startingScanIndex: 1,
      });
      res.should.not.be.empty();
      res.should.hasOwnProperty('transactions');
      const tx = res.transactions[0];
      tx.scanIndex.should.equal(1);
      tx.recoveryAmount.should.equal('1000');
      tx.serializedTx.should.equal(
        'AAADAQDNuna9w/Rg7Q1q+DT8F7CC656r0LiG+a8XzUKR8vhi+qJuEQIAAAAAIGbg2VphuEezzTVLyBTrQGC+GJWMRSV5YJWka7fwmD9LAAjoAwAAAAAAAAAgAOTqpqKR/gKRhFLmRbVlPNJgpfwPs19hk9WAkWqp44kCAgEAAAEBAQABAQIAAAECADLY5X7m2R5VWNoGdxVMLwhXlTSOMX+VrMnvreG0ES/MAQ7KeJAeNCslFfv5m+JDs/AK3gp6UGdbNzB/RMwZXJBGq24RAgAAAAAgi2q2sUgd0frgxWZVkgajJAb1V5f1VzaTrXEYIxkLqDAy2OV+5tkeVVjaBncVTC8IV5U0jjF/lazJ763htBEvzOgDAAAAAAAAVl4nAAAAAAAA'
      );

      const UnsignedSweepTxnDeserialize = new TransferTransaction(basecoin);
      UnsignedSweepTxnDeserialize.fromRawTransaction(tx.serializedTx);
      const UnsignedSweepTxnJson = UnsignedSweepTxnDeserialize.toJson();

      should.equal(UnsignedSweepTxnJson.id, 'GFuk1VKy3wzTFeAUtrmUe6sxRhtezzrGDfKdpQTxv9so');
      should.equal(UnsignedSweepTxnJson.sender, senderAddress1);
      sandBox.assert.callCount(basecoin.getBalance, 2);
      sandBox.assert.callCount(basecoin.getInputCoins, 2);
      sandBox.assert.callCount(basecoin.getFeeEstimate, 1);
    });
  });

  describe('Recover Consolidation Transactions', () => {
    const sandBox = sinon.createSandbox();
    const receiveAddress1 = '0x32d8e57ee6d91e5558da0677154c2f085795348e317f95acc9efade1b4112fcc';
    const receiveAddress2 = '0xdf407e3e25e9400f9779ac7571537c2361684194f1aa5db126a8f574b5ed851c';
    const walletPassphrase = 'p$Sw<RjvAgf{nYAYI2xM';

    const seedReceiveAddress1 = '0xd201566e6a0bc020fd2e6f72e9bde2223f550d64daa61398cd917c2f7501324a';
    const seedReceiveAddress2 = '0x2fa5d8394bd6bec5525b9550bf43be075b83422d0107c05c700944e3eaec26f9';

    beforeEach(function () {
      let callBack = sandBox.stub(Sui.prototype, 'getBalance' as keyof Sui);
      callBack
        .withArgs(receiveAddress1)
        .resolves('200101976')
        .withArgs(receiveAddress2)
        .resolves('200000000')
        .withArgs(seedReceiveAddress1)
        .resolves('500000000')
        .withArgs(seedReceiveAddress2)
        .resolves('200000000');

      callBack = sandBox.stub(Sui.prototype, 'getInputCoins' as keyof Sui);
      callBack
        .withArgs(receiveAddress1)
        .resolves([
          {
            coinType: '0x2::sui::SUI',
            objectId: '0x996aab365d4551b6d1274f520bbfa7b0a566d548b2d590b5565c623812e7e76d',
            version: '201',
            digest: 'HXpNTfx9TBdxFcXHi4RziZsQuDAHavRasK6Ri15rVwuA',
            balance: new BigNumber('200000000'),
          },
          {
            coinType: '0x2::sui::SUI',
            objectId: '0xb39c5f380208cce7fe1ba1258c8d19befb02a80f14952617ed37098dbd4d2df0',
            version: '199',
            digest: 'mqk37hXLkiUYgkYxk2MyqNykCkCXwe97uMus7bDPhe2',
            balance: new BigNumber('101976'),
          },
        ])
        .withArgs(receiveAddress2)
        .resolves([
          {
            coinType: '0x2::sui::SUI',
            objectId: '0xfa04105eedebdabf729dccecf01d0cf5f1b770892fac2ed8f1e69d71a32a2d24',
            version: '202',
            digest: 'DeApRVSrTa9ttXvNyLexT4PJcAkyyxSpi3JQeUg4ua8Q',
            balance: new BigNumber('200000000'),
          },
        ])
        .withArgs(seedReceiveAddress1)
        .resolves([
          {
            coinType: '0x2::sui::SUI',
            objectId: '0x86e728fd7242b3be60e9c1941add2c47fb655779108c3500a216310218748e2d',
            version: '147',
            digest: '6PJeyEX4L8RkjsNaF5GSMCwRjmFGYrQB7fbmJPFMMPHL',
            balance: '500000000',
          },
        ])
        .withArgs(seedReceiveAddress2)
        .resolves([
          {
            coinType: '0x2::sui::SUI',
            objectId: '0xfd66dbfe7a1497f210747b0532f62e6926cb144c75e519f2dfff17a4f6e515fc',
            version: '148',
            digest: 'PJ3jfS1ERShSMtFWZgma4h6duWX8nm5Bei1z3BszyBk',
            balance: '200000000',
          },
        ]);

      callBack = sandBox.stub(Sui.prototype, 'getFeeEstimate' as keyof Sui);
      callBack
        .withArgs(
          'AAACAAhYb/cFAAAAAAAgkfJeI3uDoApick/cSoHkP0lNxrQaEkFJKCbTbk0THaMCAgABAQAAAQECAAABAQAy2OV+5tkeVVjaBncVTC8IV5U0jjF/lazJ763htBEvzAKZaqs2XUVRttEnT1ILv6ewpWbVSLLVkLVWXGI4EufnbckAAAAAAAAAIPWf+f1EklW1ggi3rwo5Jw3Lftu9W/UsyrZrI0FYsBTZs5xfOAIIzOf+G6EljI0ZvvsCqA8UlSYX7TcJjb1NLfDHAAAAAAAAACALfKsZ4T9Y2y1rrlBxQQ2BouS9VFjBgVfvbbFf9U+f8zLY5X7m2R5VWNoGdxVMLwhXlTSOMX+VrMnvreG0ES/M6AMAAAAAAAAA4fUFAAAAAAA='
        )
        .resolves(new BigNumber('1019760'))
        .withArgs(
          'AAACAAgA4fUFAAAAAAAgkfJeI3uDoApick/cSoHkP0lNxrQaEkFJKCbTbk0THaMCAgABAQAAAQECAAABAQDfQH4+JelAD5d5rHVxU3wjYWhBlPGqXbEmqPV0te2FHAH6BBBe7evav3KdzOzwHQz18bdwiS+sLtjx5p1xoyotJMoAAAAAAAAAILvR1XjlKKylRGh9pX4UpBFBsCv5At6RBn+XXDAbnfRB30B+PiXpQA+Xeax1cVN8I2FoQZTxql2xJqj1dLXthRzoAwAAAAAAAADh9QUAAAAAAA=='
        )
        .resolves(new BigNumber('1997880'))
        .withArgs(
          'AAACAAgAhNcXAAAAAAAgiMmeDbicuh25fLrdfzeypLKitAIllKDASyvMg35LJAQCAgABAQAAAQECAAABAQDSAVZuagvAIP0ub3LpveIiP1UNZNqmE5jNkXwvdQEySgGG5yj9ckKzvmDpwZQa3SxH+2VXeRCMNQCiFjECGHSOLZMAAAAAAAAAIFABLLLjMJc51R0P8DHy0PbXwsYUD0b5gvVmiZsupafr0gFWbmoLwCD9Lm9y6b3iIj9VDWTaphOYzZF8L3UBMkroAwAAAAAAAADh9QUAAAAAAA=='
        )
        .resolves(new BigNumber('1997880'))
        .withArgs(
          'AAACAAgA4fUFAAAAAAAgiMmeDbicuh25fLrdfzeypLKitAIllKDASyvMg35LJAQCAgABAQAAAQECAAABAQAvpdg5S9a+xVJblVC/Q74HW4NCLQEHwFxwCUTj6uwm+QH9Ztv+ehSX8hB0ewUy9i5pJssUTHXlGfLf/xek9uUV/JQAAAAAAAAAIAW2DZdVWJ9ENnvL4Z2POOHfK2Z74DgSgDQci60MdQuXL6XYOUvWvsVSW5VQv0O+B1uDQi0BB8BccAlE4+rsJvnoAwAAAAAAAADh9QUAAAAAAA=='
        )
        .resolves(new BigNumber('1997880'));
    });

    afterEach(function () {
      sandBox.restore();
    });

    it('should build signed consolidation transactions for hot wallet', async function () {
      const res = await basecoin.recoverConsolidations({
        userKey: keys.userKey,
        backupKey: keys.backupKey,
        bitgoKey: keys.bitgoKey,
        walletPassphrase,
        startingScanIndex: 1,
        endingScanIndex: 3,
      });

      const transactions = res.transactions;
      transactions.length.should.equal(2);
      const txn1 = transactions[0];
      txn1.scanIndex.should.equal(1);
      txn1.recoveryAmount.should.equal('198980240');
      txn1.serializedTx.should.equal(
        'AAACAAiQMtwLAAAAAAAgkfJeI3uDoApick/cSoHkP0lNxrQaEkFJKCbTbk0THaMCAgABAQAAAQECAAABAQAy2OV+5tkeVVjaBncVTC8IV5U0jjF/lazJ763htBEvzAKZaqs2XUVRttEnT1ILv6ewpWbVSLLVkLVWXGI4EufnbckAAAAAAAAAIPWf+f1EklW1ggi3rwo5Jw3Lftu9W/UsyrZrI0FYsBTZs5xfOAIIzOf+G6EljI0ZvvsCqA8UlSYX7TcJjb1NLfDHAAAAAAAAACALfKsZ4T9Y2y1rrlBxQQ2BouS9VFjBgVfvbbFf9U+f8zLY5X7m2R5VWNoGdxVMLwhXlTSOMX+VrMnvreG0ES/M6AMAAAAAAADIHREAAAAAAAA='
      );

      const txn2 = transactions[1];
      txn2.scanIndex.should.equal(2);
      txn2.recoveryAmount.should.equal('197802332');
      txn2.serializedTx.should.equal(
        'AAACAAhcOcoLAAAAAAAgkfJeI3uDoApick/cSoHkP0lNxrQaEkFJKCbTbk0THaMCAgABAQAAAQECAAABAQDfQH4+JelAD5d5rHVxU3wjYWhBlPGqXbEmqPV0te2FHAH6BBBe7evav3KdzOzwHQz18bdwiS+sLtjx5p1xoyotJMoAAAAAAAAAILvR1XjlKKylRGh9pX4UpBFBsCv5At6RBn+XXDAbnfRB30B+PiXpQA+Xeax1cVN8I2FoQZTxql2xJqj1dLXthRzoAwAAAAAAAKSIIQAAAAAAAA=='
      );

      res.lastScanIndex.should.equal(2);

      sandBox.assert.callCount(basecoin.getBalance, 2);
      sandBox.assert.callCount(basecoin.getInputCoins, 2);
      sandBox.assert.callCount(basecoin.getFeeEstimate, 2);
    });

    it('should build unsigned consolidation transactions for cold wallet', async function () {
      const res = await basecoin.recoverConsolidations({
        bitgoKey: keys.bitgoKey,
        startingScanIndex: 1,
        endingScanIndex: 3,
      });
      res.should.deepEqual({
        txRequests: [
          {
            transactions: [
              {
                unsignedTx: {
                  serializedTx:
                    '00000200089032dc0b00000000002091f25e237b83a00a62724fdc4a81e43f494dc6b41a1241492826d36e4d131da302020001010000010102000001010032d8e57ee6d91e5558da0677154c2f085795348e317f95acc9efade1b4112fcc02996aab365d4551b6d1274f520bbfa7b0a566d548b2d590b5565c623812e7e76dc90000000000000020f59ff9fd449255b58208b7af0a39270dcb7edbbd5bf52ccab66b234158b014d9b39c5f380208cce7fe1ba1258c8d19befb02a80f14952617ed37098dbd4d2df0c700000000000000200b7cab19e13f58db2d6bae5071410d81a2e4bd5458c18157ef6db15ff54f9ff332d8e57ee6d91e5558da0677154c2f085795348e317f95acc9efade1b4112fcce803000000000000c81d11000000000000',
                  scanIndex: 1,
                  coin: 'tsui',
                  signableHex: 'ab84c9d09c678c038439f63fcd40d26535cc1485151257f4f175b6e8a0e94316',
                  derivationPath: 'm/1',
                  parsedTx: {
                    inputs: [
                      {
                        address: '0x32d8e57ee6d91e5558da0677154c2f085795348e317f95acc9efade1b4112fcc',
                        valueString: '198980240',
                        value: new BigNumber('198980240'),
                      },
                    ],
                    outputs: [
                      {
                        address: '0x91f25e237b83a00a62724fdc4a81e43f494dc6b41a1241492826d36e4d131da3',
                        valueString: '198980240',
                        coinName: 'tsui',
                      },
                    ],
                    spendAmount: '198980240',
                    type: 'Transfer',
                  },
                  feeInfo: {
                    fee: 1121736,
                    feeString: '1121736',
                  },
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
          {
            transactions: [
              {
                unsignedTx: {
                  serializedTx:
                    '00000200085c39ca0b00000000002091f25e237b83a00a62724fdc4a81e43f494dc6b41a1241492826d36e4d131da3020200010100000101020000010100df407e3e25e9400f9779ac7571537c2361684194f1aa5db126a8f574b5ed851c01fa04105eedebdabf729dccecf01d0cf5f1b770892fac2ed8f1e69d71a32a2d24ca0000000000000020bbd1d578e528aca544687da57e14a41141b02bf902de91067f975c301b9df441df407e3e25e9400f9779ac7571537c2361684194f1aa5db126a8f574b5ed851ce803000000000000a48821000000000000',
                  scanIndex: 2,
                  coin: 'tsui',
                  signableHex: '66d650b4c4dedf5ab33c9381ee46140b30bb896cf2c66b7b241cae70d1414f16',
                  derivationPath: 'm/2',
                  parsedTx: {
                    inputs: [
                      {
                        address: '0xdf407e3e25e9400f9779ac7571537c2361684194f1aa5db126a8f574b5ed851c',
                        valueString: '197802332',
                        value: new BigNumber('197802332'),
                      },
                    ],
                    outputs: [
                      {
                        address: '0x91f25e237b83a00a62724fdc4a81e43f494dc6b41a1241492826d36e4d131da3',
                        valueString: '197802332',
                        coinName: 'tsui',
                      },
                    ],
                    spendAmount: '197802332',
                    type: 'Transfer',
                  },
                  feeInfo: {
                    fee: 2197668,
                    feeString: '2197668',
                  },
                  coinSpecific: {
                    commonKeychain:
                      '3b89eec9d2d2f3b049ecda2e7b5f47827f7927fe6618d6e8b13f64e7c95f4b00b9577ab01395ecf8eeb804b590cedae14ff5fd3947bf3b7a95b9327c49e27c54',
                    lastScanIndex: 2,
                  },
                },
                signatureShares: [],
              },
            ],
            walletCoin: 'tsui',
          },
        ],
      });

      sandBox.assert.callCount(basecoin.getBalance, 2);
      sandBox.assert.callCount(basecoin.getInputCoins, 2);
      sandBox.assert.callCount(basecoin.getFeeEstimate, 2);
    });

    it('should build unsigned consolidation transactions for cold wallet with seed', async function () {
      const res = await basecoin.recoverConsolidations({
        bitgoKey: keys.bitgoKeyWithSeed,
        startingScanIndex: 1,
        endingScanIndex: 3,
        seed: '123',
      });
      res.should.deepEqual({
        txRequests: [
          {
            transactions: [
              {
                unsignedTx: {
                  serializedTx:
                    '00000200085cdcab1d00000000002088c99e0db89cba1db97cbadd7f37b2a4b2a2b4022594a0c04b2bcc837e4b2404020200010100000101020000010100d201566e6a0bc020fd2e6f72e9bde2223f550d64daa61398cd917c2f7501324a0186e728fd7242b3be60e9c1941add2c47fb655779108c3500a216310218748e2d93000000000000002050012cb2e3309739d51d0ff031f2d0f6d7c2c6140f46f982f566899b2ea5a7ebd201566e6a0bc020fd2e6f72e9bde2223f550d64daa61398cd917c2f7501324ae803000000000000a48821000000000000',
                  scanIndex: 1,
                  coin: 'tsui',
                  signableHex: '6d7a4c4882745707c2cd40b0c57566601a2a4d269f5cb0a692828551212cf452',
                  derivationPath: 'm/999999/94862622/157363509/1',
                  parsedTx: {
                    inputs: [
                      {
                        address: '0xd201566e6a0bc020fd2e6f72e9bde2223f550d64daa61398cd917c2f7501324a',
                        valueString: '497802332',
                        value: new BigNumber(497802332),
                      },
                    ],
                    outputs: [
                      {
                        address: '0x88c99e0db89cba1db97cbadd7f37b2a4b2a2b4022594a0c04b2bcc837e4b2404',
                        valueString: '497802332',
                        coinName: 'tsui',
                      },
                    ],
                    spendAmount: '497802332',
                    type: 'Transfer',
                  },
                  feeInfo: {
                    fee: 2197668,
                    feeString: '2197668',
                  },
                  coinSpecific: {
                    commonKeychain:
                      'ca0a014ba6f11106a155ef8e2cab2f76d277e4f01cffa591a9b40848343823b3d910752a49c96bf5813985206e23c9f9cd3a78f1cccf5cf88def52b573cedc93',
                  },
                },
                signatureShares: [],
              },
            ],
            walletCoin: 'tsui',
          },
          {
            transactions: [
              {
                unsignedTx: {
                  serializedTx:
                    '00000200085c39ca0b00000000002088c99e0db89cba1db97cbadd7f37b2a4b2a2b4022594a0c04b2bcc837e4b24040202000101000001010200000101002fa5d8394bd6bec5525b9550bf43be075b83422d0107c05c700944e3eaec26f901fd66dbfe7a1497f210747b0532f62e6926cb144c75e519f2dfff17a4f6e515fc94000000000000002005b60d9755589f44367bcbe19d8f38e1df2b667be0381280341c8bad0c750b972fa5d8394bd6bec5525b9550bf43be075b83422d0107c05c700944e3eaec26f9e803000000000000a48821000000000000',
                  scanIndex: 2,
                  coin: 'tsui',
                  signableHex: '32a00a6d892630467c7d0666390d3b27caaf4aefee3dda9e0c97c3f8bc06bcea',
                  derivationPath: 'm/999999/94862622/157363509/2',
                  parsedTx: {
                    inputs: [
                      {
                        address: '0x2fa5d8394bd6bec5525b9550bf43be075b83422d0107c05c700944e3eaec26f9',
                        valueString: '197802332',
                        value: new BigNumber(197802332),
                      },
                    ],
                    outputs: [
                      {
                        address: '0x88c99e0db89cba1db97cbadd7f37b2a4b2a2b4022594a0c04b2bcc837e4b2404',
                        valueString: '197802332',
                        coinName: 'tsui',
                      },
                    ],
                    spendAmount: '197802332',
                    type: 'Transfer',
                  },
                  feeInfo: {
                    fee: 2197668,
                    feeString: '2197668',
                  },
                  coinSpecific: {
                    commonKeychain:
                      'ca0a014ba6f11106a155ef8e2cab2f76d277e4f01cffa591a9b40848343823b3d910752a49c96bf5813985206e23c9f9cd3a78f1cccf5cf88def52b573cedc93',
                    lastScanIndex: 2,
                  },
                },
                signatureShares: [],
              },
            ],
            walletCoin: 'tsui',
          },
        ],
      });

      sandBox.assert.callCount(basecoin.getBalance, 2);
      sandBox.assert.callCount(basecoin.getInputCoins, 2);
      sandBox.assert.callCount(basecoin.getFeeEstimate, 2);
    });
  });

  describe('Recover Token Consolidation Transactions', () => {
    const sandBox = sinon.createSandbox();
    const walletPassphrase = 'p$Sw<RjvAgf{nYAYI2xM';

    const seedReceiveAddress1 = '0xd201566e6a0bc020fd2e6f72e9bde2223f550d64daa61398cd917c2f7501324a';
    const seedReceiveAddress2 = '0x2fa5d8394bd6bec5525b9550bf43be075b83422d0107c05c700944e3eaec26f9';

    const packageId = '0x36dbef866a1d62bf7328989a10fb2f07d769f4ee587c0de4a0a256e57e0a58a8';
    const coinType = `${packageId}::deep::DEEP`;
    const hotWalletReceiveAddress1 = '0x32d8e57ee6d91e5558da0677154c2f085795348e317f95acc9efade1b4112fcc';
    const hotWalletReceiveAddress2 = '0xdf407e3e25e9400f9779ac7571537c2361684194f1aa5db126a8f574b5ed851c';
    const coldWalletReceiveAddress1 = '0xa992709591deb7471fb30dda0f339db7ab548d3391a89d3f1fa0c72d2092675f';
    const coldWalletReceiveAddress2 = '0xc3ac2a86e35b62bfada83f6388ff27c7dda7092cf0b829d2d1f4c2813e28ae39';

    let getBalanceStub: sinon.SinonStub;
    let getInputCoinsStub: sinon.SinonStub;
    let getFeeEstimateStub: sinon.SinonStub;

    beforeEach(function () {
      getBalanceStub = sandBox.stub(Sui.prototype, 'getBalance' as keyof Sui);
      getInputCoinsStub = sandBox.stub(Sui.prototype, 'getInputCoins' as keyof Sui);
      getFeeEstimateStub = sandBox.stub(Sui.prototype, 'getFeeEstimate' as keyof Sui);
    });

    afterEach(function () {
      sandBox.restore();
    });

    it('should build signed token consolidation transactions for hot wallet', async function () {
      getBalanceStub
        .withArgs(hotWalletReceiveAddress1)
        .resolves('116720144')
        .withArgs(hotWalletReceiveAddress1, coinType)
        .resolves('1500')
        .withArgs(hotWalletReceiveAddress2)
        .resolves('120101976')
        .withArgs(hotWalletReceiveAddress2, coinType)
        .resolves('2000');
      getInputCoinsStub
        .withArgs(hotWalletReceiveAddress1, coinType)
        .resolves([
          {
            coinType: '0x36dbef866a1d62bf7328989a10fb2f07d769f4ee587c0de4a0a256e57e0a58a8::deep::DEEP',
            objectId: '0x8d2da577227e9b7166dbb9b3cce480968cf549b448c662771d1124d6420bf792',
            version: '34696878',
            digest: 'BniWiG3v71ozzRirb3hNKEP16pTu3CpNt3voy1uzgMi9',
            balance: new BigNumber('1500'),
          },
        ])
        .withArgs(hotWalletReceiveAddress1)
        .resolves([
          {
            coinType: '0x2::sui::SUI',
            objectId: '0x0eca78901e342b2515fbf99be243b3f00ade0a7a50675b37307f44cc195c9046',
            version: '34696877',
            digest: 'D8XqJXrkVGoer952GvHBdBDXpof8H4F4pRJJ1wSnESNW',
            balance: new BigNumber('116618168'),
          },
          {
            coinType: '0x2::sui::SUI',
            objectId: '0x761222340db80dd9da144d55098870bc81a788205e0bbdd34c2f8df12cf45aeb',
            version: '227',
            digest: '9bwyjaSH3X8anrjGUpD1NqMrLFUtGSCK9LFuLbhjX69E',
            balance: new BigNumber('101976'),
          },
        ])
        .withArgs(hotWalletReceiveAddress2, coinType)
        .resolves([
          {
            coinType: '0x36dbef866a1d62bf7328989a10fb2f07d769f4ee587c0de4a0a256e57e0a58a8::deep::DEEP',
            objectId: '0x8e18bd14c34e33f81c494f4d6c18d07c686c7f3619682d2066b3f55ecfe707a2',
            version: '34696868',
            digest: '6jZFu8PRWLJYPewW7K3o4GLVPYnRyNo3kP6454eLuHZm',
            balance: new BigNumber('2000'),
          },
        ])
        .withArgs(hotWalletReceiveAddress2)
        .resolves([
          {
            coinType: '0x2::sui::SUI',
            objectId: '0x811a75066134945e3b033f4ac54ec885ec0384f42a80994d88a48d7d18c4260a',
            version: '236',
            digest: '32N9ZyferGDEV7PY3ykijVVKhLjEFSL6itqcfRPCy4oW',
            balance: new BigNumber('101976'),
          },
          {
            coinType: '0x2::sui::SUI',
            objectId: '0xf85a738a30566d558800228f2d5c193a5ca3ddbbddca2a65a48a9332306715cc',
            version: '34696876',
            digest: '7gJgCMDEPdQaMeuXZ5CFNonFKMPQyw6k5sT1RpaHEXpe',
            balance: new BigNumber('120000000'),
          },
        ]);
      getFeeEstimateStub
        .withArgs(
          'AAADAQCNLaV3In6bcWbbubPM5ICWjPVJtEjGYncdESTWQgv3kq5uEQIAAAAAIKBK8Zjq4yz/PTFZLg6jf6gDTsogig63pduXeiKgzMVKAAjcBQAAAAAAAAAgkfJeI3uDoApick/cSoHkP0lNxrQaEkFJKCbTbk0THaMCAgEAAAEBAQABAQIAAAECADLY5X7m2R5VWNoGdxVMLwhXlTSOMX+VrMnvreG0ES/MAQ7KeJAeNCslFfv5m+JDs/AK3gp6UGdbNzB/RMwZXJBGrW4RAgAAAAAgtDor6b9EJHOSWdJZCQdLkKpS2cPoBc5b28KpX1rg7lsy2OV+5tkeVVjaBncVTC8IV5U0jjF/lazJ763htBEvzOgDAAAAAAAAAOH1BQAAAAAA'
        )
        .resolves(new BigNumber('2345504'))
        .withArgs(
          'AAADAQCOGL0Uw04z+BxJT01sGNB8aGx/NhloLSBms/Vez+cHoqRuEQIAAAAAIFUxTTQyTKM6bVjeFHHT8KVrV2fgTOCX7Uoevk2r5JPcAAjQBwAAAAAAAAAgkfJeI3uDoApick/cSoHkP0lNxrQaEkFJKCbTbk0THaMCAgEAAAEBAQABAQIAAAECAN9Afj4l6UAPl3msdXFTfCNhaEGU8apdsSao9XS17YUcAfhac4owVm1ViAAijy1cGTpco9273coqZaSKkzIwZxXMrG4RAgAAAAAgYzfCWiypCmme8IJZhqn5nT8+zoP3S7sfQKfezW99YWvfQH4+JelAD5d5rHVxU3wjYWhBlPGqXbEmqPV0te2FHOgDAAAAAAAAAOH1BQAAAAAA'
        )
        .resolves(new BigNumber('2345504'));

      const res = await basecoin.recoverConsolidations({
        userKey: keys.userKey,
        backupKey: keys.backupKey,
        bitgoKey: keys.bitgoKey,
        walletPassphrase,
        tokenContractAddress: packageId,
        startingScanIndex: 1,
        endingScanIndex: 3,
      });

      const transactions = res.transactions;
      transactions.length.should.equal(2);
      const txn1 = transactions[0];
      txn1.scanIndex.should.equal(1);
      txn1.recoveryAmount.should.equal('1500');
      txn1.serializedTx.should.equal(
        'AAADAQCNLaV3In6bcWbbubPM5ICWjPVJtEjGYncdESTWQgv3kq5uEQIAAAAAIKBK8Zjq4yz/PTFZLg6jf6gDTsogig63pduXeiKgzMVKAAjcBQAAAAAAAAAgkfJeI3uDoApick/cSoHkP0lNxrQaEkFJKCbTbk0THaMCAgEAAAEBAQABAQIAAAECADLY5X7m2R5VWNoGdxVMLwhXlTSOMX+VrMnvreG0ES/MAQ7KeJAeNCslFfv5m+JDs/AK3gp6UGdbNzB/RMwZXJBGrW4RAgAAAAAgtDor6b9EJHOSWdJZCQdLkKpS2cPoBc5b28KpX1rg7lsy2OV+5tkeVVjaBncVTC8IV5U0jjF/lazJ763htBEvzOgDAAAAAAAAVl4nAAAAAAAA'
      );

      const txn2 = transactions[1];
      txn2.scanIndex.should.equal(2);
      txn2.recoveryAmount.should.equal('2000');
      txn2.serializedTx.should.equal(
        'AAADAQCOGL0Uw04z+BxJT01sGNB8aGx/NhloLSBms/Vez+cHoqRuEQIAAAAAIFUxTTQyTKM6bVjeFHHT8KVrV2fgTOCX7Uoevk2r5JPcAAjQBwAAAAAAAAAgkfJeI3uDoApick/cSoHkP0lNxrQaEkFJKCbTbk0THaMCAgEAAAEBAQABAQIAAAECAN9Afj4l6UAPl3msdXFTfCNhaEGU8apdsSao9XS17YUcAfhac4owVm1ViAAijy1cGTpco9273coqZaSKkzIwZxXMrG4RAgAAAAAgYzfCWiypCmme8IJZhqn5nT8+zoP3S7sfQKfezW99YWvfQH4+JelAD5d5rHVxU3wjYWhBlPGqXbEmqPV0te2FHOgDAAAAAAAAVl4nAAAAAAAA'
      );

      res.lastScanIndex.should.equal(2);

      sandBox.assert.callCount(basecoin.getBalance, 4);
      sandBox.assert.callCount(basecoin.getInputCoins, 4);
      sandBox.assert.callCount(basecoin.getFeeEstimate, 2);
    });

    it('should build unsigned token consolidation transactions for cold wallet', async function () {
      getBalanceStub
        .withArgs(coldWalletReceiveAddress1)
        .resolves('116720144')
        .withArgs(coldWalletReceiveAddress1, coinType)
        .resolves('4000')
        .withArgs(coldWalletReceiveAddress2)
        .resolves('120101976')
        .withArgs(coldWalletReceiveAddress2, coinType)
        .resolves('6000');
      getInputCoinsStub
        .withArgs(coldWalletReceiveAddress1, coinType)
        .resolves([
          {
            coinType: '0x36dbef866a1d62bf7328989a10fb2f07d769f4ee587c0de4a0a256e57e0a58a8::deep::DEEP',
            objectId: '0x9e2618685fff38b999355e93a4693c4bd18f68dd6b654ff6555f1f4ad229dcdb',
            version: '34696876',
            digest: 'F5iGjs95CnScCtXHFuTJhdZkfLyagWR1Qm1zDH6SngMG',
            balance: new BigNumber('4000'),
          },
        ])
        .withArgs(coldWalletReceiveAddress1)
        .resolves([
          {
            coinType: '0x2::sui::SUI',
            objectId: '0x8f3f7c8961997327166b1571117ff67232ccd1267ec52a7e973677ba0431ffad',
            version: '226',
            digest: 'AWh7tPmS9xmH4a2zYLCG73YDiskCf8uizbLjpCStHhNV',
            balance: new BigNumber('98980240'),
          },
          {
            coinType: '0x2::sui::SUI',
            objectId: '0x916e35a0ac6b525b7d38a44b667394aaee7cde41dffc876980cfbc8845590cdd',
            version: '34696878',
            digest: '14PfNwUvfcR3mNAS1bcNXToaooVLnXQHDdGxPFRJQtY',
            balance: new BigNumber('120000000'),
          },
        ])
        .withArgs(coldWalletReceiveAddress2, coinType)
        .resolves([
          {
            coinType: '0x36dbef866a1d62bf7328989a10fb2f07d769f4ee587c0de4a0a256e57e0a58a8::deep::DEEP',
            objectId: '0xc548c220454d20e0712bd2858b07260c829a1c847f3818b47805961b574813ab',
            version: '34696877',
            digest: '8mANdoskG8eLLy7zVU5rmHRAXVHUyJPABfS1mYHSmAYt',
            balance: new BigNumber('6000'),
          },
        ])
        .withArgs(coldWalletReceiveAddress2)
        .resolves([
          {
            coinType: '0x2::sui::SUI',
            objectId: '0x396ab09ee58fb2c9fbcca887c00ef01a33d5bfe55a5d50514e32a59f948e9a05',
            version: '234',
            digest: 'HWKW56dt8BNxSTvXiW7dtDVmM2gxEexFyNVzGj8HPVp4',
            balance: new BigNumber('101976'),
          },
          {
            coinType: '0x2::sui::SUI',
            objectId: '0xd4bfefa532827d7619a58279a87db81632e267cc48e6b94ab81a4367f02cbefa',
            version: '34696879',
            digest: 'GJnp1oXNjVXLcYY6hqRV8Rm7G7obmk3s8Nhj1bFsfkUo',
            balance: new BigNumber('120000000'),
          },
        ]);
      getFeeEstimateStub
        .withArgs(
          'AAADAQCeJhhoX/84uZk1XpOkaTxL0Y9o3WtlT/ZVXx9K0inc26xuEQIAAAAAINE4mxs1hGMmovTU5dfnFoouWOPdVn0nRDPbuXymALPLAAigDwAAAAAAAAAgAWSV3dp0jBFqIYJCg102RwnWxe5cih7WhMTvQz0xRCECAgEAAAEBAQABAQIAAAECAKmScJWR3rdHH7MN2g8znberVI0zkaidPx+gxy0gkmdfAZFuNaCsa1JbfTikS2ZzlKrufN5B3/yHaYDPvIhFWQzdrm4RAgAAAAAgAAPVeleb8pMu7o/cp9MwtGsUMwKA28CviO+5N79foNGpknCVkd63Rx+zDdoPM523q1SNM5GonT8foMctIJJnX+gDAAAAAAAAAOH1BQAAAAAA'
        )
        .resolves(new BigNumber('2345504'))
        .withArgs(
          'AAADAQDFSMIgRU0g4HEr0oWLByYMgpochH84GLR4BZYbV0gTq61uEQIAAAAAIHNR9lF7b7NdhWgutklx5vwLmihijROI6T24ctzx9g6tAAhwFwAAAAAAAAAgAWSV3dp0jBFqIYJCg102RwnWxe5cih7WhMTvQz0xRCECAgEAAAEBAQABAQIAAAECAMOsKobjW2K/rag/Y4j/J8fdpwks8Lgp0tH0woE+KK45AdS/76Uygn12GaWCeah9uBYy4mfMSOa5SrgaQ2fwLL76r24RAgAAAAAg42350Lqqaanub5TpjJnYlKiupjF2Xc+qgDIoiPOkU6jDrCqG41tiv62oP2OI/yfH3acJLPC4KdLR9MKBPiiuOegDAAAAAAAAAOH1BQAAAAAA'
        )
        .resolves(new BigNumber('2345504'));

      const res = await basecoin.recoverConsolidations({
        bitgoKey: keys.bitgoKeyColdWallet,
        tokenContractAddress: packageId,
        startingScanIndex: 1,
        endingScanIndex: 3,
      });
      res.should.deepEqual({
        txRequests: [
          {
            transactions: [
              {
                unsignedTx: {
                  serializedTx:
                    '00000301009e2618685fff38b999355e93a4693c4bd18f68dd6b654ff6555f1f4ad229dcdbac6e11020000000020d1389b1b35846326a2f4d4e5d7e7168a2e58e3dd567d274433dbb97ca600b3cb0008a00f0000000000000020016495ddda748c116a218242835d364709d6c5ee5c8a1ed684c4ef433d3144210202010000010101000101020000010200a992709591deb7471fb30dda0f339db7ab548d3391a89d3f1fa0c72d2092675f01916e35a0ac6b525b7d38a44b667394aaee7cde41dffc876980cfbc8845590cddae6e110200000000200003d57a579bf2932eee8fdca7d330b46b14330280dbc0af88efb937bf5fa0d1a992709591deb7471fb30dda0f339db7ab548d3391a89d3f1fa0c72d2092675fe803000000000000565e27000000000000',
                  scanIndex: 1,
                  coin: 'tsui:deep',
                  signableHex: 'cedade6c1c99e3531c90536fa228f0fb148f35605d1a4edfbe8eb739bdc99a48',
                  derivationPath: 'm/1',
                  parsedTx: {
                    inputs: [
                      {
                        address: '0xa992709591deb7471fb30dda0f339db7ab548d3391a89d3f1fa0c72d2092675f',
                        valueString: '4000',
                        value: new BigNumber('4000'),
                      },
                    ],
                    outputs: [
                      {
                        address: '0x016495ddda748c116a218242835d364709d6c5ee5c8a1ed684c4ef433d314421',
                        valueString: '4000',
                        coinName: 'tsui:deep',
                      },
                    ],
                    spendAmount: '4000',
                    type: 'TokenTransfer',
                  },
                  feeInfo: {
                    fee: 2580054,
                    feeString: '2580054',
                  },
                  coinSpecific: {
                    commonKeychain:
                      '79d4b9b594df028fee3725a6af51ae3ab6a3519e9d2c322f2c8fd815b96496323c5aba7ea874c102f966f1a61d3c9a42b5f3177c6a85712cf313715afddf83d8',
                  },
                },
                signatureShares: [],
              },
            ],
            walletCoin: 'tsui:deep',
          },
          {
            transactions: [
              {
                unsignedTx: {
                  serializedTx:
                    '0000030100c548c220454d20e0712bd2858b07260c829a1c847f3818b47805961b574813abad6e110200000000207351f6517b6fb35d85682eb64971e6fc0b9a28628d1388e93db872dcf1f60ead000870170000000000000020016495ddda748c116a218242835d364709d6c5ee5c8a1ed684c4ef433d3144210202010000010101000101020000010200c3ac2a86e35b62bfada83f6388ff27c7dda7092cf0b829d2d1f4c2813e28ae3901d4bfefa532827d7619a58279a87db81632e267cc48e6b94ab81a4367f02cbefaaf6e11020000000020e36df9d0baaa69a9ee6f94e98c99d894a8aea631765dcfaa80322888f3a453a8c3ac2a86e35b62bfada83f6388ff27c7dda7092cf0b829d2d1f4c2813e28ae39e803000000000000565e27000000000000',
                  scanIndex: 2,
                  coin: 'tsui:deep',
                  signableHex: 'd0551409d248accdd894713a4c03a6d8f240349a5e85b90aef019b5f426062c8',
                  derivationPath: 'm/2',
                  parsedTx: {
                    inputs: [
                      {
                        address: '0xc3ac2a86e35b62bfada83f6388ff27c7dda7092cf0b829d2d1f4c2813e28ae39',
                        valueString: '6000',
                        value: new BigNumber('6000'),
                      },
                    ],
                    outputs: [
                      {
                        address: '0x016495ddda748c116a218242835d364709d6c5ee5c8a1ed684c4ef433d314421',
                        valueString: '6000',
                        coinName: 'tsui:deep',
                      },
                    ],
                    spendAmount: '6000',
                    type: 'TokenTransfer',
                  },
                  feeInfo: {
                    fee: 2580054,
                    feeString: '2580054',
                  },
                  coinSpecific: {
                    commonKeychain:
                      '79d4b9b594df028fee3725a6af51ae3ab6a3519e9d2c322f2c8fd815b96496323c5aba7ea874c102f966f1a61d3c9a42b5f3177c6a85712cf313715afddf83d8',
                    lastScanIndex: 2,
                  },
                },
                signatureShares: [],
              },
            ],
            walletCoin: 'tsui:deep',
          },
        ],
      });

      sandBox.assert.callCount(basecoin.getBalance, 4);
      sandBox.assert.callCount(basecoin.getInputCoins, 4);
      sandBox.assert.callCount(basecoin.getFeeEstimate, 2);
    });

    it('should build unsigned token consolidation transactions for cold wallet with seed', async function () {
      getBalanceStub
        .withArgs(seedReceiveAddress1)
        .resolves('120199788')
        .withArgs(seedReceiveAddress1, coinType)
        .resolves('1500')
        .withArgs(seedReceiveAddress2)
        .resolves('120199788')
        .withArgs(seedReceiveAddress2, coinType)
        .resolves('2000');

      getInputCoinsStub
        .withArgs(seedReceiveAddress1, coinType)
        .resolves([
          {
            coinType: '0x36dbef866a1d62bf7328989a10fb2f07d769f4ee587c0de4a0a256e57e0a58a8::deep::DEEP',
            objectId: '0xa7a8c91028035ab49977e72b084e145eb1c1ddcfe2e06925f0f833cef2d1f69f',
            version: '34696878',
            digest: 'CKiuXkFMaVkn12iKinZCr9aDHfGpCQiPdyZUQzNDJ9Qx',
            balance: new BigNumber('1500'),
          },
        ])
        .withArgs(seedReceiveAddress1)
        .resolves([
          {
            coinType: '0x2::sui::SUI',
            objectId: '0x5eea0353f078016b71a84cb494e6f791e97cb8de5344def3baedffc89c27a4b5',
            version: '34696879',
            digest: '6KqrwjKHhJCe4DXfdH2yMLG8bXGcSQoTeJy4shghDbTZ',
            balance: new BigNumber('120000000'),
          },
          {
            coinType: '0x2::sui::SUI',
            objectId: '0x86e728fd7242b3be60e9c1941add2c47fb655779108c3500a216310218748e2d',
            version: '148',
            digest: 'B9zJfEYkiXnAuLE6q3XFJeLbPc3K7qmjgDrHVvJnT5wa',
            balance: new BigNumber('199788'),
          },
        ])
        .withArgs(seedReceiveAddress2, coinType)
        .resolves([
          {
            coinType: '0x36dbef866a1d62bf7328989a10fb2f07d769f4ee587c0de4a0a256e57e0a58a8::deep::DEEP',
            objectId: '0xe191f166e71b1ef20ffda0c91b24da95ecc93b657c464d8a06f561d4692722f0',
            version: '34696880',
            digest: '4KyhzfPQcTUrnp4UBvR3GsPE3DLccVDEPgBjDxaWVRcr',
            balance: new BigNumber('2000'),
          },
        ])
        .withArgs(seedReceiveAddress2)
        .resolves([
          {
            coinType: '0x2::sui::SUI',
            objectId: '0xd32f94889d0bfc05c24ed6c023d5d3d3654294a837d850d3738b0e352e1f4867',
            version: '34696880',
            digest: '5Po12YiuL3NkNTAvyWvRwtR55JviyPVbcDfTvCwQrTkr',
            balance: new BigNumber('120000000'),
          },
          {
            coinType: '0x2::sui::SUI',
            objectId: '0xfd66dbfe7a1497f210747b0532f62e6926cb144c75e519f2dfff17a4f6e515fc',
            version: '149',
            digest: '5eVcbbm3NTF6jqadTb4GjZMzn75KDZBqcspRz3sVrpbR',
            balance: new BigNumber('199788'),
          },
        ]);

      getFeeEstimateStub
        .withArgs(
          'AAADAQCnqMkQKANatJl35ysIThRescHdz+LgaSXw+DPO8tH2n65uEQIAAAAAIKg8ZMeF2XLLbBdPQyPmfu8bYqCB2z/uaR5sG7Fobl7VAAjcBQAAAAAAAAAgiMmeDbicuh25fLrdfzeypLKitAIllKDASyvMg35LJAQCAgEAAAEBAQABAQIAAAECANIBVm5qC8Ag/S5vcum94iI/VQ1k2qYTmM2RfC91ATJKAV7qA1PweAFrcahMtJTm95HpfLjeU0Te87rt/8icJ6S1r24RAgAAAAAgTx4i+RgcLdA5q+vymM+WETpvCnqEqR4oY7RqQdNj2ozSAVZuagvAIP0ub3LpveIiP1UNZNqmE5jNkXwvdQEySugDAAAAAAAAAOH1BQAAAAAA'
        )
        .resolves(new BigNumber('2345504'))
        .withArgs(
          'AAADAQDhkfFm5xse8g/9oMkbJNqV7Mk7ZXxGTYoG9WHUaSci8LBuEQIAAAAAIDFvokinBxoWyeL64lPM9mJVOpB0UOjZjDu+J1skPcQPAAjQBwAAAAAAAAAgiMmeDbicuh25fLrdfzeypLKitAIllKDASyvMg35LJAQCAgEAAAEBAQABAQIAAAECAC+l2DlL1r7FUluVUL9Dvgdbg0ItAQfAXHAJROPq7Cb5AdMvlIidC/wFwk7WwCPV09NlQpSoN9hQ03OLDjUuH0hnsG4RAgAAAAAgQUWJ0/tPZt++q7KnLYmAPWRRonn/W/XGYxzxY689zK8vpdg5S9a+xVJblVC/Q74HW4NCLQEHwFxwCUTj6uwm+egDAAAAAAAAAOH1BQAAAAAA'
        )
        .resolves(new BigNumber('2345504'));

      const res = await basecoin.recoverConsolidations({
        bitgoKey: keys.bitgoKeyWithSeed,
        tokenContractAddress: packageId,
        startingScanIndex: 1,
        endingScanIndex: 3,
        seed: '123',
      });
      res.should.deepEqual({
        txRequests: [
          {
            transactions: [
              {
                unsignedTx: {
                  serializedTx:
                    '0000030100a7a8c91028035ab49977e72b084e145eb1c1ddcfe2e06925f0f833cef2d1f69fae6e11020000000020a83c64c785d972cb6c174f4323e67eef1b62a081db3fee691e6c1bb1686e5ed50008dc05000000000000002088c99e0db89cba1db97cbadd7f37b2a4b2a2b4022594a0c04b2bcc837e4b24040202010000010101000101020000010200d201566e6a0bc020fd2e6f72e9bde2223f550d64daa61398cd917c2f7501324a015eea0353f078016b71a84cb494e6f791e97cb8de5344def3baedffc89c27a4b5af6e110200000000204f1e22f9181c2dd039abebf298cf96113a6f0a7a84a91e2863b46a41d363da8cd201566e6a0bc020fd2e6f72e9bde2223f550d64daa61398cd917c2f7501324ae803000000000000565e27000000000000',
                  scanIndex: 1,
                  coin: 'tsui:deep',
                  signableHex: '22defa9101ea3a3839c3c0026b27a9837165c07fcecff8e94353bcf3d5a01328',
                  derivationPath: 'm/999999/94862622/157363509/1',
                  parsedTx: {
                    inputs: [
                      {
                        address: '0xd201566e6a0bc020fd2e6f72e9bde2223f550d64daa61398cd917c2f7501324a',
                        valueString: '1500',
                        value: new BigNumber('1500'),
                      },
                    ],
                    outputs: [
                      {
                        address: '0x88c99e0db89cba1db97cbadd7f37b2a4b2a2b4022594a0c04b2bcc837e4b2404',
                        valueString: '1500',
                        coinName: 'tsui:deep',
                      },
                    ],
                    spendAmount: '1500',
                    type: 'TokenTransfer',
                  },
                  feeInfo: {
                    fee: 2580054,
                    feeString: '2580054',
                  },
                  coinSpecific: {
                    commonKeychain:
                      'ca0a014ba6f11106a155ef8e2cab2f76d277e4f01cffa591a9b40848343823b3d910752a49c96bf5813985206e23c9f9cd3a78f1cccf5cf88def52b573cedc93',
                  },
                },
                signatureShares: [],
              },
            ],
            walletCoin: 'tsui:deep',
          },
          {
            transactions: [
              {
                unsignedTx: {
                  serializedTx:
                    '0000030100e191f166e71b1ef20ffda0c91b24da95ecc93b657c464d8a06f561d4692722f0b06e11020000000020316fa248a7071a16c9e2fae253ccf662553a907450e8d98c3bbe275b243dc40f0008d007000000000000002088c99e0db89cba1db97cbadd7f37b2a4b2a2b4022594a0c04b2bcc837e4b240402020100000101010001010200000102002fa5d8394bd6bec5525b9550bf43be075b83422d0107c05c700944e3eaec26f901d32f94889d0bfc05c24ed6c023d5d3d3654294a837d850d3738b0e352e1f4867b06e11020000000020414589d3fb4f66dfbeabb2a72d89803d6451a279ff5bf5c6631cf163af3dccaf2fa5d8394bd6bec5525b9550bf43be075b83422d0107c05c700944e3eaec26f9e803000000000000565e27000000000000',
                  scanIndex: 2,
                  coin: 'tsui:deep',
                  signableHex: '2e6bb17166ee197102729bda47b06b7c0b5962bf431bbb0562b91e267b75129d',
                  derivationPath: 'm/999999/94862622/157363509/2',
                  parsedTx: {
                    inputs: [
                      {
                        address: '0x2fa5d8394bd6bec5525b9550bf43be075b83422d0107c05c700944e3eaec26f9',
                        valueString: '2000',
                        value: new BigNumber('2000'),
                      },
                    ],
                    outputs: [
                      {
                        address: '0x88c99e0db89cba1db97cbadd7f37b2a4b2a2b4022594a0c04b2bcc837e4b2404',
                        valueString: '2000',
                        coinName: 'tsui:deep',
                      },
                    ],
                    spendAmount: '2000',
                    type: 'TokenTransfer',
                  },
                  feeInfo: {
                    fee: 2580054,
                    feeString: '2580054',
                  },
                  coinSpecific: {
                    commonKeychain:
                      'ca0a014ba6f11106a155ef8e2cab2f76d277e4f01cffa591a9b40848343823b3d910752a49c96bf5813985206e23c9f9cd3a78f1cccf5cf88def52b573cedc93',
                    lastScanIndex: 2,
                  },
                },
                signatureShares: [],
              },
            ],
            walletCoin: 'tsui:deep',
          },
        ],
      });

      sandBox.assert.callCount(basecoin.getBalance, 4);
      sandBox.assert.callCount(basecoin.getInputCoins, 4);
      sandBox.assert.callCount(basecoin.getFeeEstimate, 2);
    });
  });

  describe('Create Broadcastable MPC Transaction', () => {
    it('create broadcastable MPC transaction for OVC signed sweep transaction', async function () {
      const signatureShares = {
        signatureShares: [
          {
            txRequest: {
              transactions: [
                {
                  unsignedTx: {
                    serializedTx:
                      '0000020008c88b902f000000000020df407e3e25e9400f9779ac7571537c2361684194f1aa5db126a8f574b5ed851c020200010100000101020000010100016495ddda748c116a218242835d364709d6c5ee5c8a1ed684c4ef433d314421014553b0f6f79ed95942141835de3ab086bf38d1f1d96272981e1390b84fb86b36c900000000000000200b1de8fdfbbb8a6fa2c65ec79a55703c9a9f0c2685a768f2b81a0426bc932ec3016495ddda748c116a218242835d364709d6c5ee5c8a1ed684c4ef433d314421e803000000000000a48821000000000000',
                    scanIndex: 0,
                    coin: 'tsui',
                    signableHex: 'a4ce8eb11362cd45c09936e745044dc78b2689e5d8147b9ea9a7de43ee43923a',
                    derivationPath: 'm/0',
                    parsedTx: {
                      inputs: [
                        {
                          address: '0x016495ddda748c116a218242835d364709d6c5ee5c8a1ed684c4ef433d314421',
                          valueString: '798002120',
                          value: {
                            s: 1,
                            e: 8,
                            c: [798002120],
                          },
                        },
                      ],
                      outputs: [
                        {
                          address: '0xdf407e3e25e9400f9779ac7571537c2361684194f1aa5db126a8f574b5ed851c',
                          valueString: '798002120',
                          coinName: 'tsui',
                        },
                      ],
                      spendAmount: '798002120',
                      type: 'Transfer',
                    },
                    feeInfo: {
                      fee: 2197668,
                      feeString: '2197668',
                    },
                    coinSpecific: {
                      commonKeychain:
                        '79d4b9b594df028fee3725a6af51ae3ab6a3519e9d2c322f2c8fd815b96496323c5aba7ea874c102f966f1a61d3c9a42b5f3177c6a85712cf313715afddf83d8',
                    },
                  },
                  signatureShares: [],
                  signatureShare: {
                    from: 'backup',
                    to: 'user',
                    share:
                      '6f470906df88c33b27c8d113ed944ed0a4fc499ba6cc76f00b8924942812d7835792ee455cbc8941faba7bcc93b15a9cd198a20dc3f0b629f5fdceab34e66100',
                    publicShare: '284496ca04cc603823f7993aef13f72f331d97085b2184d7a6a463a90aa927d0',
                  },
                },
              ],
              walletCoin: 'tsui',
            },
            tssVersion: '0.0.1',
            ovc: [
              {
                eddsaSignature: {
                  y: '284496ca04cc603823f7993aef13f72f331d97085b2184d7a6a463a90aa927d0',
                  R: '6f470906df88c33b27c8d113ed944ed0a4fc499ba6cc76f00b8924942812d783',
                  sigma: '5c23a8c72ce192731e702da460aea79ed66334b4a783dcf6dd2758347d6c9f0d',
                },
              },
            ],
          },
        ],
      };

      const res = await basecoin.createBroadcastableSweepTransaction(signatureShares);

      res.should.deepEqual({
        transactions: [
          {
            serializedTx:
              'AAACAAjIi5AvAAAAAAAg30B+PiXpQA+Xeax1cVN8I2FoQZTxql2xJqj1dLXthRwCAgABAQAAAQECAAABAQABZJXd2nSMEWohgkKDXTZHCdbF7lyKHtaExO9DPTFEIQFFU7D2957ZWUIUGDXeOrCGvzjR8dlicpgeE5C4T7hrNskAAAAAAAAAIAsd6P37u4pvosZex5pVcDyanwwmhado8rgaBCa8ky7DAWSV3dp0jBFqIYJCg102RwnWxe5cih7WhMTvQz0xRCHoAwAAAAAAAKSIIQAAAAAAAA==',
            scanIndex: 0,
            signature:
              'AG9HCQbfiMM7J8jRE+2UTtCk/Embpsx28AuJJJQoEteDXCOoxyzhknMecC2kYK6nntZjNLSng9z23SdYNH1snw0oRJbKBMxgOCP3mTrvE/cvMx2XCFshhNempGOpCqkn0A==',
            recoveryAmount: '798002120',
          },
        ],
        lastScanIndex: 0,
      });
    });

    it('create broadcastable MPC token transaction for OVC signed sweep transaction', async function () {
      const signatureShares = {
        signatureShares: [
          {
            txRequest: {
              transactions: [
                {
                  unsignedTx: {
                    serializedTx:
                      '000004010072ad99130abd3790db7bac8908d50d3412a800a8fcd10c1cfbd64b8215537558a16e1102000000002007b85d38b6e1b485f1455930d27296108081caacd7664c48d7d5f48572ee2bbd01004c1cccc6d03510bd74a95f81b2b7da08119cb18e2c565435e7ad715e6aadc5a7696e110200000000208fb4a334b829acdecbfa2a328642afa24d6f953740f7683080ee0e4b3d3a962f0008f82a000000000000002091f25e237b83a00a62724fdc4a81e43f494dc6b41a1241492826d36e4d131da303030100000101010002010000010102000101020100010300016495ddda748c116a218242835d364709d6c5ee5c8a1ed684c4ef433d3144210198114f2ddefe3f16d9d2e016194b52c4c3af430c1601bdb3539cbd237cbca068696e11020000000020b516a15b5034bcd42425440c564cf36f439542f88671ef799dde0661e789a009016495ddda748c116a218242835d364709d6c5ee5c8a1ed684c4ef433d314421e803000000000000f86411000000000000',
                    scanIndex: 0,
                    coin: 'tsui:deep',
                    signableHex: '449ade19590685b1eb0cefcb2ec41f4c68e37d8eaf75687c45965e288e71caa4',
                    derivationPath: 'm/0',
                    parsedTx: {
                      inputs: [
                        {
                          address: '0x016495ddda748c116a218242835d364709d6c5ee5c8a1ed684c4ef433d314421',
                          valueString: '11000',
                          value: {
                            s: 1,
                            e: 4,
                            c: [11000],
                          },
                        },
                      ],
                      outputs: [
                        {
                          address: '0x91f25e237b83a00a62724fdc4a81e43f494dc6b41a1241492826d36e4d131da3',
                          valueString: '11000',
                          coinName: 'tsui:deep',
                        },
                      ],
                      spendAmount: '11000',
                      type: 'TokenTransfer',
                    },
                    feeInfo: {
                      fee: 1139960,
                      feeString: '1139960',
                    },
                    coinSpecific: {
                      commonKeychain:
                        '79d4b9b594df028fee3725a6af51ae3ab6a3519e9d2c322f2c8fd815b96496323c5aba7ea874c102f966f1a61d3c9a42b5f3177c6a85712cf313715afddf83d8',
                    },
                  },
                  signatureShares: [],
                  signatureShare: {
                    from: 'backup',
                    to: 'user',
                    share:
                      '23c53e54f271386578d99a6932ff708960900188ab3e5bce1aec1f019e53a85d3197f8b64a9feadbedbbd37aa42e4444609f000743adc0a94ffcc721c7057d04',
                    publicShare: '284496ca04cc603823f7993aef13f72f331d97085b2184d7a6a463a90aa927d0',
                  },
                },
              ],
              walletCoin: 'tsui:deep',
            },
            tssVersion: '0.0.1',
            ovc: [
              {
                eddsaSignature: {
                  y: '284496ca04cc603823f7993aef13f72f331d97085b2184d7a6a463a90aa927d0',
                  R: '23c53e54f271386578d99a6932ff708960900188ab3e5bce1aec1f019e53a85d',
                  sigma: '9b52b45c4d539fad906805f9fcbab6fb5e4152243caee252855c36c34048cc09',
                },
              },
            ],
          },
        ],
      };

      const res = await basecoin.createBroadcastableSweepTransaction(signatureShares);

      res.should.deepEqual({
        transactions: [
          {
            serializedTx:
              'AAAEAQByrZkTCr03kNt7rIkI1Q00EqgAqPzRDBz71kuCFVN1WKFuEQIAAAAAIAe4XTi24bSF8UVZMNJylhCAgcqs12ZMSNfV9IVy7iu9AQBMHMzG0DUQvXSpX4Gyt9oIEZyxjixWVDXnrXFeaq3Fp2luEQIAAAAAII+0ozS4Kazey/oqMoZCr6JNb5U3QPdoMIDuDks9OpYvAAj4KgAAAAAAAAAgkfJeI3uDoApick/cSoHkP0lNxrQaEkFJKCbTbk0THaMDAwEAAAEBAQACAQAAAQECAAEBAgEAAQMAAWSV3dp0jBFqIYJCg102RwnWxe5cih7WhMTvQz0xRCEBmBFPLd7+PxbZ0uAWGUtSxMOvQwwWAb2zU5y9I3y8oGhpbhECAAAAACC1FqFbUDS81CQlRAxWTPNvQ5VC+IZx73md3gZh54mgCQFkld3adIwRaiGCQoNdNkcJ1sXuXIoe1oTE70M9MUQh6AMAAAAAAAD4ZBEAAAAAAAA=',
            scanIndex: 0,
            signature:
              'ACPFPlTycThleNmaaTL/cIlgkAGIqz5bzhrsHwGeU6hdm1K0XE1Tn62QaAX5/Lq2+15BUiQ8ruJShVw2w0BIzAkoRJbKBMxgOCP3mTrvE/cvMx2XCFshhNempGOpCqkn0A==',
            recoveryAmount: '11000',
          },
        ],
        lastScanIndex: 0,
      });
    });

    it('create broadcastable MPC transaction for OVC signed consolidation transactions', async function () {
      const signatureShares = {
        signatureShares: [
          {
            txRequest: {
              transactions: [
                {
                  unsignedTx: {
                    serializedTx:
                      '000002000820c2d605000000000020016495ddda748c116a218242835d364709d6c5ee5c8a1ed684c4ef433d314421020200010100000101020000010100a992709591deb7471fb30dda0f339db7ab548d3391a89d3f1fa0c72d2092675f01568beffe7651033a081a7375a3bb43d4d2a8e290a396e826236e73d0973b49b5d000000000000000208bc0764a454de7538b5ecea6fd0bd221c9c85207af297612944a967d43e8dd3ba992709591deb7471fb30dda0f339db7ab548d3391a89d3f1fa0c72d2092675fe803000000000000a48821000000000000',
                    scanIndex: 1,
                    coin: 'tsui',
                    signableHex: '857a2f26687c011a61a060a41d4c80c10b2fd31e98fe6704d6bcda26f57b03bb',
                    derivationPath: 'm/1',
                    parsedTx: {
                      inputs: [
                        {
                          address: '0xa992709591deb7471fb30dda0f339db7ab548d3391a89d3f1fa0c72d2092675f',
                          valueString: '97960480',
                          value: {
                            s: 1,
                            e: 7,
                            c: [97960480],
                          },
                        },
                      ],
                      outputs: [
                        {
                          address: '0x016495ddda748c116a218242835d364709d6c5ee5c8a1ed684c4ef433d314421',
                          valueString: '97960480',
                          coinName: 'tsui',
                        },
                      ],
                      spendAmount: '97960480',
                      type: 'Transfer',
                    },
                    feeInfo: {
                      fee: 2197668,
                      feeString: '2197668',
                    },
                    coinSpecific: {
                      commonKeychain:
                        '79d4b9b594df028fee3725a6af51ae3ab6a3519e9d2c322f2c8fd815b96496323c5aba7ea874c102f966f1a61d3c9a42b5f3177c6a85712cf313715afddf83d8',
                    },
                  },
                  signatureShares: [],
                  signatureShare: {
                    from: 'backup',
                    to: 'user',
                    share:
                      'cdfe15d7c0f80f8aad89d878706673ce242947b126852c00ee309ef05f7a8301b2e902b90d37ea7dfe86ce79c7a99b2b27a175c3f714c310fd9e10ea877cc60f',
                    publicShare: 'e445bd092a467df577001cfbd6081b1445ca0f75147233561ed2f53f6a30e45a',
                  },
                },
              ],
              walletCoin: 'tsui',
            },
            tssVersion: '0.0.1',
            ovc: [
              {
                eddsaSignature: {
                  y: 'e445bd092a467df577001cfbd6081b1445ca0f75147233561ed2f53f6a30e45a',
                  R: 'cdfe15d7c0f80f8aad89d878706673ce242947b126852c00ee309ef05f7a8301',
                  sigma: '2a31329b2e5ef8c3f222eb91cd9d70e716f229ee19d3ca9417c8acc16b1da100',
                },
              },
            ],
          },
          {
            txRequest: {
              transactions: [
                {
                  unsignedTx: {
                    serializedTx:
                      '000002000800c2eb0b000000000020016495ddda748c116a218242835d364709d6c5ee5c8a1ed684c4ef433d314421020200010100000101020000010100c3ac2a86e35b62bfada83f6388ff27c7dda7092cf0b829d2d1f4c2813e28ae3901d68feb4780886ccfa81a37036958ec9c8bfabfe75a0bb7c4d1a4587992343f5bcf00000000000000205ad4f631a378f8b09542d4df66942b6dabb2f65cb20cf8f628c91c64f9352e4ec3ac2a86e35b62bfada83f6388ff27c7dda7092cf0b829d2d1f4c2813e28ae39e803000000000000a48821000000000000',
                    scanIndex: 2,
                    coin: 'tsui',
                    signableHex: 'f2b56a74e787b2a98decf189e71b1e0c5d4ccee88697b3991a48de2910676020',
                    derivationPath: 'm/2',
                    parsedTx: {
                      inputs: [
                        {
                          address: '0xc3ac2a86e35b62bfada83f6388ff27c7dda7092cf0b829d2d1f4c2813e28ae39',
                          valueString: '200000000',
                          value: {
                            s: 1,
                            e: 8,
                            c: [200000000],
                          },
                        },
                      ],
                      outputs: [
                        {
                          address: '0x016495ddda748c116a218242835d364709d6c5ee5c8a1ed684c4ef433d314421',
                          valueString: '200000000',
                          coinName: 'tsui',
                        },
                      ],
                      spendAmount: '200000000',
                      type: 'Transfer',
                    },
                    feeInfo: {
                      fee: 2197668,
                      feeString: '2197668',
                    },
                    coinSpecific: {
                      commonKeychain:
                        '79d4b9b594df028fee3725a6af51ae3ab6a3519e9d2c322f2c8fd815b96496323c5aba7ea874c102f966f1a61d3c9a42b5f3177c6a85712cf313715afddf83d8',
                      lastScanIndex: 20,
                    },
                  },
                  signatureShares: [],
                  signatureShare: {
                    from: 'backup',
                    to: 'user',
                    share:
                      '3518613ea5cefa36cd22e1b092742d8d052744188518040397f1a65a754f9e95324889312d70146811dbdc2a96245c518e16fc61bd1a5a2b53b53ebcec5d4a03',
                    publicShare: '4b143a12835bdda04831a9ed851f9eadd7ba5b46e9c07fd087b751f46a3f364d',
                  },
                },
              ],
              walletCoin: 'tsui',
            },
            tssVersion: '0.0.1',
            ovc: [
              {
                eddsaSignature: {
                  y: '4b143a12835bdda04831a9ed851f9eadd7ba5b46e9c07fd087b751f46a3f364d',
                  R: '3518613ea5cefa36cd22e1b092742d8d052744188518040397f1a65a754f9e95',
                  sigma: '2df48ed60ff62b0e8689c5ebe57318f3dad76288647524b420acf7b1a84cc000',
                },
              },
            ],
          },
        ],
      };

      const res = await basecoin.createBroadcastableSweepTransaction(signatureShares);

      res.should.deepEqual({
        transactions: [
          {
            serializedTx:
              'AAACAAggwtYFAAAAAAAgAWSV3dp0jBFqIYJCg102RwnWxe5cih7WhMTvQz0xRCECAgABAQAAAQECAAABAQCpknCVkd63Rx+zDdoPM523q1SNM5GonT8foMctIJJnXwFWi+/+dlEDOggac3Wju0PU0qjikKOW6CYjbnPQlztJtdAAAAAAAAAAIIvAdkpFTedTi17Opv0L0iHJyFIHryl2EpRKln1D6N07qZJwlZHet0cfsw3aDzOdt6tUjTORqJ0/H6DHLSCSZ1/oAwAAAAAAAKSIIQAAAAAAAA==',
            scanIndex: 1,
            signature:
              'AM3+FdfA+A+KrYnYeHBmc84kKUexJoUsAO4wnvBfeoMBKjEymy5e+MPyIuuRzZ1w5xbyKe4Z08qUF8iswWsdoQDkRb0JKkZ99XcAHPvWCBsURcoPdRRyM1Ye0vU/ajDkWg==',
            recoveryAmount: '97960480',
          },
          {
            serializedTx:
              'AAACAAgAwusLAAAAAAAgAWSV3dp0jBFqIYJCg102RwnWxe5cih7WhMTvQz0xRCECAgABAQAAAQECAAABAQDDrCqG41tiv62oP2OI/yfH3acJLPC4KdLR9MKBPiiuOQHWj+tHgIhsz6gaNwNpWOyci/q/51oLt8TRpFh5kjQ/W88AAAAAAAAAIFrU9jGjePiwlULU32aUK22rsvZcsgz49ijJHGT5NS5Ow6wqhuNbYr+tqD9jiP8nx92nCSzwuCnS0fTCgT4orjnoAwAAAAAAAKSIIQAAAAAAAA==',
            scanIndex: 2,
            signature:
              'ADUYYT6lzvo2zSLhsJJ0LY0FJ0QYhRgEA5fxplp1T56VLfSO1g/2Kw6GicXr5XMY89rXYohkdSS0IKz3sahMwABLFDoSg1vdoEgxqe2FH56t17pbRunAf9CHt1H0aj82TQ==',
            recoveryAmount: '200000000',
          },
        ],
        lastScanIndex: 20,
      });
    });

    it('create broadcastable MPC transaction for OVC signed token consolidation transactions', async function () {
      const signatureShares = {
        signatureShares: [
          {
            txRequest: {
              transactions: [
                {
                  unsignedTx: {
                    serializedTx:
                      '0000030100a7a8c91028035ab49977e72b084e145eb1c1ddcfe2e06925f0f833cef2d1f69fae6e11020000000020a83c64c785d972cb6c174f4323e67eef1b62a081db3fee691e6c1bb1686e5ed50008dc05000000000000002088c99e0db89cba1db97cbadd7f37b2a4b2a2b4022594a0c04b2bcc837e4b24040202010000010101000101020000010200d201566e6a0bc020fd2e6f72e9bde2223f550d64daa61398cd917c2f7501324a015eea0353f078016b71a84cb494e6f791e97cb8de5344def3baedffc89c27a4b5af6e110200000000204f1e22f9181c2dd039abebf298cf96113a6f0a7a84a91e2863b46a41d363da8cd201566e6a0bc020fd2e6f72e9bde2223f550d64daa61398cd917c2f7501324ae803000000000000565e27000000000000',
                    scanIndex: 1,
                    coin: 'tsui:deep',
                    signableHex: '22defa9101ea3a3839c3c0026b27a9837165c07fcecff8e94353bcf3d5a01328',
                    derivationPath: 'm/999999/94862622/157363509/1',
                    parsedTx: {
                      inputs: [
                        {
                          address: '0xd201566e6a0bc020fd2e6f72e9bde2223f550d64daa61398cd917c2f7501324a',
                          valueString: '1500',
                          value: {
                            s: 1,
                            e: 3,
                            c: [1500],
                          },
                        },
                      ],
                      outputs: [
                        {
                          address: '0x88c99e0db89cba1db97cbadd7f37b2a4b2a2b4022594a0c04b2bcc837e4b2404',
                          valueString: '1500',
                          coinName: 'tsui:deep',
                        },
                      ],
                      spendAmount: '1500',
                      type: 'TokenTransfer',
                    },
                    feeInfo: {
                      fee: 2580054,
                      feeString: '2580054',
                    },
                    coinSpecific: {
                      commonKeychain:
                        'ca0a014ba6f11106a155ef8e2cab2f76d277e4f01cffa591a9b40848343823b3d910752a49c96bf5813985206e23c9f9cd3a78f1cccf5cf88def52b573cedc93',
                    },
                  },
                  signatureShares: [],
                  signatureShare: {
                    from: 'backup',
                    to: 'user',
                    share:
                      '1989420ce800e35e1c590907f2017b5529945484b3ff884f8e88390da88936e6a5844e4860df0f489e2a0975519c1d6f5f0255dd091edbf859c74063a7f1e20e',
                    publicShare: '408c7a11967152efee953f3eb16191004946685fdc4dd8087b91e3afcb77c916',
                  },
                },
              ],
              walletCoin: 'tsui:deep',
            },
            tssVersion: '0.0.1',
            ovc: [
              {
                eddsaSignature: {
                  y: '408c7a11967152efee953f3eb16191004946685fdc4dd8087b91e3afcb77c916',
                  R: '1989420ce800e35e1c590907f2017b5529945484b3ff884f8e88390da88936e6',
                  sigma: 'c2ce528f1f323fe9af256abb57428973b2e97e4fa54fa6f50c3943036815860e',
                },
              },
            ],
          },
          {
            txRequest: {
              transactions: [
                {
                  unsignedTx: {
                    serializedTx:
                      '0000030100e191f166e71b1ef20ffda0c91b24da95ecc93b657c464d8a06f561d4692722f0b06e11020000000020316fa248a7071a16c9e2fae253ccf662553a907450e8d98c3bbe275b243dc40f0008d007000000000000002088c99e0db89cba1db97cbadd7f37b2a4b2a2b4022594a0c04b2bcc837e4b240402020100000101010001010200000102002fa5d8394bd6bec5525b9550bf43be075b83422d0107c05c700944e3eaec26f901d32f94889d0bfc05c24ed6c023d5d3d3654294a837d850d3738b0e352e1f4867b06e11020000000020414589d3fb4f66dfbeabb2a72d89803d6451a279ff5bf5c6631cf163af3dccaf2fa5d8394bd6bec5525b9550bf43be075b83422d0107c05c700944e3eaec26f9e803000000000000565e27000000000000',
                    scanIndex: 2,
                    coin: 'tsui:deep',
                    signableHex: '2e6bb17166ee197102729bda47b06b7c0b5962bf431bbb0562b91e267b75129d',
                    derivationPath: 'm/999999/94862622/157363509/2',
                    parsedTx: {
                      inputs: [
                        {
                          address: '0x2fa5d8394bd6bec5525b9550bf43be075b83422d0107c05c700944e3eaec26f9',
                          valueString: '2000',
                          value: {
                            s: 1,
                            e: 3,
                            c: [2000],
                          },
                        },
                      ],
                      outputs: [
                        {
                          address: '0x88c99e0db89cba1db97cbadd7f37b2a4b2a2b4022594a0c04b2bcc837e4b2404',
                          valueString: '2000',
                          coinName: 'tsui:deep',
                        },
                      ],
                      spendAmount: '2000',
                      type: 'TokenTransfer',
                    },
                    feeInfo: {
                      fee: 2580054,
                      feeString: '2580054',
                    },
                    coinSpecific: {
                      commonKeychain:
                        'ca0a014ba6f11106a155ef8e2cab2f76d277e4f01cffa591a9b40848343823b3d910752a49c96bf5813985206e23c9f9cd3a78f1cccf5cf88def52b573cedc93',
                      lastScanIndex: 20,
                    },
                  },
                  signatureShares: [],
                  signatureShare: {
                    from: 'backup',
                    to: 'user',
                    share:
                      '9e1d0fd6640780cf4dc209fa6ed8957d6958e0d0272d8a2fd48438c011f67a2200de1a78e23bc2a7d261d0d02a422145301aa9ce97d3d306b3501b1f44d95606',
                    publicShare: '362d716a5a230d683b60d29ece941197e09627c234c71449facab514c3a7abaf',
                  },
                },
              ],
              walletCoin: 'tsui:deep',
            },
            tssVersion: '0.0.1',
            ovc: [
              {
                eddsaSignature: {
                  y: '362d716a5a230d683b60d29ece941197e09627c234c71449facab514c3a7abaf',
                  R: '9e1d0fd6640780cf4dc209fa6ed8957d6958e0d0272d8a2fd48438c011f67a22',
                  sigma: '15a82f7c4aedb9ebd4ab481b4281d6fcadb2a8422635f16e4e31967097001806',
                },
              },
            ],
          },
        ],
      };

      const res = await basecoin.createBroadcastableSweepTransaction(signatureShares);

      res.should.deepEqual({
        transactions: [
          {
            serializedTx:
              'AAADAQCnqMkQKANatJl35ysIThRescHdz+LgaSXw+DPO8tH2n65uEQIAAAAAIKg8ZMeF2XLLbBdPQyPmfu8bYqCB2z/uaR5sG7Fobl7VAAjcBQAAAAAAAAAgiMmeDbicuh25fLrdfzeypLKitAIllKDASyvMg35LJAQCAgEAAAEBAQABAQIAAAECANIBVm5qC8Ag/S5vcum94iI/VQ1k2qYTmM2RfC91ATJKAV7qA1PweAFrcahMtJTm95HpfLjeU0Te87rt/8icJ6S1r24RAgAAAAAgTx4i+RgcLdA5q+vymM+WETpvCnqEqR4oY7RqQdNj2ozSAVZuagvAIP0ub3LpveIiP1UNZNqmE5jNkXwvdQEySugDAAAAAAAAVl4nAAAAAAAA',
            scanIndex: 1,
            signature:
              'ABmJQgzoAONeHFkJB/IBe1UplFSEs/+IT46IOQ2oiTbmws5Sjx8yP+mvJWq7V0KJc7Lpfk+lT6b1DDlDA2gVhg5AjHoRlnFS7+6VPz6xYZEASUZoX9xN2Ah7keOvy3fJFg==',
            recoveryAmount: '1500',
          },
          {
            serializedTx:
              'AAADAQDhkfFm5xse8g/9oMkbJNqV7Mk7ZXxGTYoG9WHUaSci8LBuEQIAAAAAIDFvokinBxoWyeL64lPM9mJVOpB0UOjZjDu+J1skPcQPAAjQBwAAAAAAAAAgiMmeDbicuh25fLrdfzeypLKitAIllKDASyvMg35LJAQCAgEAAAEBAQABAQIAAAECAC+l2DlL1r7FUluVUL9Dvgdbg0ItAQfAXHAJROPq7Cb5AdMvlIidC/wFwk7WwCPV09NlQpSoN9hQ03OLDjUuH0hnsG4RAgAAAAAgQUWJ0/tPZt++q7KnLYmAPWRRonn/W/XGYxzxY689zK8vpdg5S9a+xVJblVC/Q74HW4NCLQEHwFxwCUTj6uwm+egDAAAAAAAAVl4nAAAAAAAA',
            scanIndex: 2,
            signature:
              'AJ4dD9ZkB4DPTcIJ+m7YlX1pWODQJy2KL9SEOMAR9noiFagvfErtuevUq0gbQoHW/K2yqEImNfFuTjGWcJcAGAY2LXFqWiMNaDtg0p7OlBGX4JYnwjTHFEn6yrUUw6errw==',
            recoveryAmount: '2000',
          },
        ],
        lastScanIndex: 20,
      });
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
          startingScanIndex: '0',
          scan: 1,
        })
        .should.rejectedWith(
          'Did not find an address with sufficient funds to recover. Please start the next scan at address index 1. If it is token transaction, please keep sufficient Sui balance in the address for the transaction fee.'
        );

      sandBox.assert.callCount(basecoin.getBalance, 1);
    });

    it('should fail to recover due to not finding an address with funds', async function () {
      const callBack = sandBox.stub(Sui.prototype, 'getBalance' as keyof Sui);
      callBack.resolves('0');

      await basecoin
        .recover({
          userKey: keys.userKey,
          backupKey: keys.backupKey,
          bitgoKey: keys.bitgoKey,
          recoveryDestination,
          walletPassphrase,
          scan: '10',
        })
        .should.rejectedWith(
          'Did not find an address with sufficient funds to recover. Please start the next scan at address index 10. If it is token transaction, please keep sufficient Sui balance in the address for the transaction fee.'
        );

      sandBox.assert.callCount(basecoin.getBalance, 10);
    });
  });

  describe('Consolidation Transaction Failures:', () => {
    it('should fail due to insufficient funds in receive address', async function () {
      const sandBox = sinon.createSandbox();
      const receiveAddress1 = '0x32d8e57ee6d91e5558da0677154c2f085795348e317f95acc9efade1b4112fcc';
      const walletPassphrase = 'p$Sw<RjvAgf{nYAYI2xM';

      const callBack = sandBox.stub(Sui.prototype, 'getBalance' as keyof Sui);
      callBack.withArgs(receiveAddress1).resolves('1');

      await basecoin
        .recoverConsolidations({
          userKey: keys.userKey,
          backupKey: keys.backupKey,
          bitgoKey: keys.bitgoKey,
          walletPassphrase,
          startingScanIndex: '1',
          endingScanIndex: '2',
        })
        .should.rejectedWith(
          'Did not find an address with sufficient funds to recover. Please start the next scan at address index 2.'
        );

      sandBox.assert.callCount(basecoin.getBalance, 1);
    });
  });
});
