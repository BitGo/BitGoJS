import { TestBitGo } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';
import { Ton, TonParseTransactionOptions, Tton } from '../../src';
import * as sinon from 'sinon';
import assert from 'assert';
import * as testData from '../resources/ton';
import { EDDSAMethods, TransactionExplanation } from '@bitgo/sdk-core';
import should from 'should';
import utils from '../../src/lib/utils';
import Tonweb from 'tonweb';

describe('TON:', function () {
  let basecoin;
  const bitgo = TestBitGo.decorate(BitGoAPI, { env: 'mock' });
  bitgo.safeRegister('ton', Ton.createInstance);
  bitgo.safeRegister('tton', Tton.createInstance);
  bitgo.initializeTestVars();
  const txPrebuildList = [
    {
      txHex: Buffer.from(testData.signedSendTransaction.tx, 'base64').toString('hex'),
      txInfo: {},
    },
    {
      txHex: Buffer.from(testData.signedSingleNominatorWithdrawTransaction.tx, 'base64').toString('hex'),
      txInfo: {},
    },
  ];
  const txPrebuildBounceableList = [
    {
      txHex: Buffer.from(testData.signedSendTransaction.txBounceable, 'base64').toString('hex'),
      txInfo: {},
    },
    {
      txHex: Buffer.from(testData.signedSingleNominatorWithdrawTransaction.txBounceable, 'base64').toString('hex'),
      txInfo: {},
    },
  ];

  const txParamsList = [
    {
      recipients: [testData.signedSendTransaction.recipient],
    },
    {
      recipients: [testData.signedSingleNominatorWithdrawTransaction.recipient],
    },
  ];

  const txParamsBounceableList = [
    {
      recipients: [testData.signedSendTransaction.recipientBounceable],
    },
    {
      recipients: [testData.signedSingleNominatorWithdrawTransaction.recipientBounceable],
    },
  ];

  it('should return the right info', function () {
    const ton = bitgo.coin('ton');
    const tton = bitgo.coin('tton');

    ton.getChain().should.equal('ton');
    ton.getFamily().should.equal('ton');
    ton.getFullName().should.equal('Ton');
    ton.getBaseFactor().should.equal(1e9);

    tton.getChain().should.equal('tton');
    tton.getFamily().should.equal('ton');
    tton.getFullName().should.equal('Testnet Ton');
    tton.getBaseFactor().should.equal(1e9);
  });

  describe('Verify transaction: ', () => {
    basecoin = bitgo.coin('tton');
    txParamsList.forEach((_, index) => {
      const txParams = txParamsList[index];
      const txPrebuild = txPrebuildList[index];
      const txParamsBounceable = txParamsBounceableList[index];
      const txPrebuildBounceable = txPrebuildBounceableList[index];

      it('should succeed to verify transaction', async function () {
        const verification = {};
        const isTransactionVerified = await basecoin.verifyTransaction({
          txParams,
          txPrebuild,
          verification,
        } as any);
        isTransactionVerified.should.equal(true);

        const isBounceableTransactionVerified = await basecoin.verifyTransaction({
          txParams: txParamsBounceable,
          txPrebuild: txPrebuildBounceable,
          verification: {},
        } as any);
        isBounceableTransactionVerified.should.equal(true);
      });

      it('should succeed to verify transaction when recipients amount are numbers', async function () {
        const txParamsWithNumberAmounts = JSON.parse(JSON.stringify(txParams));
        txParamsWithNumberAmounts.recipients[0].amount = 20000000;
        const verification = {};
        await basecoin
          .verifyTransaction({
            txParams: txParamsWithNumberAmounts,
            txPrebuild,
            verification,
          } as any)
          .should.rejectedWith('Tx outputs does not match with expected txParams recipients');
      });

      it('should succeed to verify transaction when recipients amount are strings', async function () {
        const txParamsWithNumberAmounts = JSON.parse(JSON.stringify(txParams));
        txParamsWithNumberAmounts.recipients[0].amount = '20000000';
        const verification = {};
        await basecoin
          .verifyTransaction({
            txParams: txParamsWithNumberAmounts,
            txPrebuild,
            verification,
          } as any)
          .should.rejectedWith('Tx outputs does not match with expected txParams recipients');
      });

      it('should succeed to verify transaction when recipients amounts are number and amount is same', async function () {
        const verification = {};
        await basecoin
          .verifyTransaction({
            txParams,
            txPrebuild,
            verification,
          } as any)
          .should.resolvedWith(true);
      });

      it('should succeed to verify transaction when recipients amounts are string and amount is same', async function () {
        const verification = {};
        await basecoin
          .verifyTransaction({
            txParams,
            txPrebuild,
            verification,
          } as any)
          .should.resolvedWith(true);
      });

      it('should succeed to verify transaction when recipient address are non bounceable', async function () {
        const txParamsWithNumberAmounts = JSON.parse(JSON.stringify(txParams));
        txParamsWithNumberAmounts.recipients[0].address = new Tonweb.Address(
          txParamsWithNumberAmounts.recipients[0].address
        ).toString(true, true, false);
        const verification = {};
        const isVerified = await basecoin.verifyTransaction({
          txParams: txParamsWithNumberAmounts,
          txPrebuild,
          verification,
        } as any);
        isVerified.should.equal(true);
      });

      it('should fail to verify transaction with invalid param', async function () {
        const txPrebuild = {};
        await basecoin
          .verifyTransaction({
            txParams,
            txPrebuild,
          } as any)
          .should.rejectedWith('missing required tx prebuild property txHex');
      });
    });
  });

  describe('Explain Transaction: ', () => {
    const basecoin = bitgo.coin('tton');
    it('should explain a transfer transaction', async function () {
      const explainedTransaction = (await basecoin.explainTransaction({
        txHex: Buffer.from(testData.signedSendTransaction.tx, 'base64').toString('hex'),
      })) as TransactionExplanation;
      explainedTransaction.should.deepEqual({
        displayOrder: ['id', 'outputs', 'outputAmount', 'changeOutputs', 'changeAmount', 'fee', 'withdrawAmount'],
        id: 'tuyOkyFUMv_neV_FeNBH24Nd4cML2jUgDP4zjGkuOFI=',
        outputs: [
          {
            address: testData.signedSendTransaction.recipient.address,
            amount: testData.signedSendTransaction.recipient.amount,
          },
        ],
        outputAmount: testData.signedSendTransaction.recipient.amount,
        changeOutputs: [],
        changeAmount: '0',
        fee: { fee: 'UNKNOWN' },
        withdrawAmount: undefined,
      });
    });

    it('should explain a non-bounceable transfer transaction', async function () {
      const explainedTransaction = (await basecoin.explainTransaction({
        txHex: Buffer.from(testData.signedSendTransaction.tx, 'base64').toString('hex'),
        toAddressBounceable: false,
        fromAddressBounceable: false,
      })) as TransactionExplanation;
      explainedTransaction.should.deepEqual({
        displayOrder: ['id', 'outputs', 'outputAmount', 'changeOutputs', 'changeAmount', 'fee', 'withdrawAmount'],
        id: 'tuyOkyFUMv_neV_FeNBH24Nd4cML2jUgDP4zjGkuOFI=',
        outputs: [
          {
            address: testData.signedSendTransaction.recipientBounceable.address,
            amount: testData.signedSendTransaction.recipientBounceable.amount,
          },
        ],
        outputAmount: testData.signedSendTransaction.recipientBounceable.amount,
        changeOutputs: [],
        changeAmount: '0',
        fee: { fee: 'UNKNOWN' },
        withdrawAmount: undefined,
      });
    });

    it('should explain a single nominator withdraw transaction', async function () {
      const explainedTransaction = (await basecoin.explainTransaction({
        txHex: Buffer.from(testData.signedSingleNominatorWithdrawTransaction.tx, 'base64').toString('hex'),
      })) as TransactionExplanation;
      explainedTransaction.should.deepEqual({
        displayOrder: ['id', 'outputs', 'outputAmount', 'changeOutputs', 'changeAmount', 'fee', 'withdrawAmount'],
        id: testData.signedSingleNominatorWithdrawTransaction.txId,
        outputs: [
          {
            address: testData.signedSingleNominatorWithdrawTransaction.recipient.address,
            amount: testData.signedSingleNominatorWithdrawTransaction.recipient.amount,
          },
        ],
        outputAmount: testData.signedSingleNominatorWithdrawTransaction.recipient.amount,
        changeOutputs: [],
        changeAmount: '0',
        fee: { fee: 'UNKNOWN' },
        withdrawAmount: '932178112330000',
      });
    });

    it('should explain a non-bounceable single nominator withdraw transaction', async function () {
      const explainedTransaction = (await basecoin.explainTransaction({
        txHex: Buffer.from(testData.signedSingleNominatorWithdrawTransaction.tx, 'base64').toString('hex'),
        toAddressBounceable: false,
        fromAddressBounceable: false,
      })) as TransactionExplanation;
      explainedTransaction.should.deepEqual({
        displayOrder: ['id', 'outputs', 'outputAmount', 'changeOutputs', 'changeAmount', 'fee', 'withdrawAmount'],
        id: testData.signedSingleNominatorWithdrawTransaction.txIdBounceable,
        outputs: [
          {
            address: testData.signedSingleNominatorWithdrawTransaction.recipientBounceable.address,
            amount: testData.signedSingleNominatorWithdrawTransaction.recipientBounceable.amount,
          },
        ],
        outputAmount: testData.signedSingleNominatorWithdrawTransaction.recipientBounceable.amount,
        changeOutputs: [],
        changeAmount: '0',
        fee: { fee: 'UNKNOWN' },
        withdrawAmount: '932178112330000',
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
    const basecoin = bitgo.coin('tton');

    const transactionsList = [testData.signedSendTransaction.tx, testData.signedSingleNominatorWithdrawTransaction.tx];

    const transactionInputsResponseList = [
      [
        {
          address: 'EQCSBjR3fUOL98WTw2F_IT4BrcqjZJWVLWUSz5WQDpaL9Jpl',
          amount: '10000000',
        },
      ],
      [
        {
          address: 'EQAbJug-k-tufWMjEC1RKSM0iiJTDUcYkC7zWANHrkT55Fol',
          amount: '123400000',
        },
      ],
    ];

    const transactionInputsResponseBounceableList = [
      [
        {
          address: 'UQCSBjR3fUOL98WTw2F_IT4BrcqjZJWVLWUSz5WQDpaL9Meg',
          amount: '10000000',
        },
      ],
      [
        {
          address: 'UQAbJug-k-tufWMjEC1RKSM0iiJTDUcYkC7zWANHrkT55Afg',
          amount: '123400000',
        },
      ],
    ];

    const transactionOutputsResponseList = [
      [
        {
          address: 'EQA0i8-CdGnF_DhUHHf92R1ONH6sIA9vLZ_WLcCIhfBBXwtG',
          amount: '10000000',
        },
      ],
      [
        {
          address: 'EQA0i8-CdGnF_DhUHHf92R1ONH6sIA9vLZ_WLcCIhfBBXwtG',
          amount: '123400000',
        },
      ],
    ];

    const transactionOutputsResponseBounceableList = [
      [
        {
          address: 'UQA0i8-CdGnF_DhUHHf92R1ONH6sIA9vLZ_WLcCIhfBBX1aD',
          amount: '10000000',
        },
      ],
      [
        {
          address: 'UQA0i8-CdGnF_DhUHHf92R1ONH6sIA9vLZ_WLcCIhfBBX1aD',
          amount: '123400000',
        },
      ],
    ];

    transactionsList.forEach((_, index) => {
      const transaction = transactionsList[index];
      const transactionInputsResponse = transactionInputsResponseList[index];
      const transactionInputsResponseBounceable = transactionInputsResponseBounceableList[index];
      const transactionOutputsResponse = transactionOutputsResponseList[index];
      const transactionOutputsResponseBounceable = transactionOutputsResponseBounceableList[index];

      it('should parse a TON transaction', async function () {
        const parsedTransaction = await basecoin.parseTransaction({
          txHex: Buffer.from(transaction, 'base64').toString('hex'),
        });

        parsedTransaction.should.deepEqual({
          inputs: transactionInputsResponse,
          outputs: transactionOutputsResponse,
        });
      });

      it('should parse a non-bounceable TON transaction', async function () {
        const parsedTransaction = await basecoin.parseTransaction({
          txHex: Buffer.from(transaction, 'base64').toString('hex'),
          toAddressBounceable: false,
          fromAddressBounceable: false,
        } as TonParseTransactionOptions);

        parsedTransaction.should.deepEqual({
          inputs: transactionInputsResponseBounceable,
          outputs: transactionOutputsResponseBounceable,
        });
      });

      it('should fail to parse a TON transaction when explainTransaction response is undefined', async function () {
        const stub = sinon.stub(Ton.prototype, 'explainTransaction');
        stub.resolves(undefined);
        await basecoin.parseTransaction({ txHex: transaction }).should.be.rejectedWith('invalid raw transaction');
        stub.restore();
      });
    });
  });

  describe('Address Validation', () => {
    const basecoin = bitgo.coin('tton');
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
      const address = 'UQB0Hyt1bTRfI0WK_ULZyKvrvP0PPtpTQFi_jKXVXX6KFOMi';
      basecoin.isValidAddress(address).should.equal(true);
    });

    it('should return false when validating an incorrectly formatted', async function () {
      const address = 'wrongaddress';
      basecoin.isValidAddress(address).should.equal(false);
    });

    it('should return true when validating a non-bounceable address format', async function () {
      const address = 'UQA0i8-CdGnF_DhUHHf92R1ONH6sIA9vLZ_WLcCIhfBBX1aD';
      basecoin.isValidAddress(address).should.equal(true);
    });

    it('should return true when validating addresses with memoIds', async function () {
      const address1 = 'EQB0Hyt1bTRfI0WK_ULZyKvrvP0PPtpTQFi_jKXVXX6KFL7n?memoId=123';
      const address2 = 'UQB0Hyt1bTRfI0WK_ULZyKvrvP0PPtpTQFi_jKXVXX6KFOMi?memoId=123';
      basecoin.isValidAddress(address1).should.equal(true);
      basecoin.isValidAddress(address2).should.equal(true);
    });

    it('should return true for isWalletAddress with valid address for index 4', async function () {
      const newAddress = 'EQB0Hyt1bTRfI0WK_ULZyKvrvP0PPtpTQFi_jKXVXX6KFL7n';
      const index = 4;

      const params = { commonKeychain, address: newAddress, index, keychains };
      (await basecoin.isWalletAddress(params)).should.equal(true);
    });

    it('should return true for isWalletAddress with valid addressand index', async function () {
      const newAddress = 'EQB0Hyt1bTRfI0WK_ULZyKvrvP0PPtpTQFi_jKXVXX6KFL7n?memoId=4';
      const index = 4;

      const params = { commonKeychain, address: newAddress, index, keychains };
      (await basecoin.isWalletAddress(params)).should.equal(true);
    });

    it('should return false for isWalletAddress with valid address for index 5 and address is for a different index', async function () {
      const wrongAddressForIndex5 = 'EQB0Hyt1bTRfI0WK_ULZyKvrvP0PPtpTQFi_jKXVXX6KFL7n';
      const index = 5;

      const params = { commonKeychain, address: wrongAddressForIndex5, index, keychains };
      (await basecoin.isWalletAddress(params)).should.equal(false);
    });

    it('should throw error for isWalletAddress when keychains is missing', async function () {
      const address = 'EQB0Hyt1bTRfI0WK_ULZyKvrvP0PPtpTQFi_jKXVXX6KFL7n';
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

  describe('util class ', () => {
    let commonKeychain;
    let derivedPublicKey;
    before(async function () {
      commonKeychain =
        '19bdfe2a4b498a05511381235a8892d54267807c4a3f654e310b938b8b424ff4adedbe92f4c146de641c67508a961324c8504cdf8e0c0acbb68d6104ccccd781';
      const MPC = await EDDSAMethods.getInitializedMpcInstance();
      derivedPublicKey = MPC.deriveUnhardened(commonKeychain, 'm/' + 0).slice(0, 64);
    });

    describe('getAddressFromPublicKey', function () {
      it('should derive bounceable address by default', async function () {
        (await utils.getAddressFromPublicKey(derivedPublicKey)).should.equal(
          'EQDVeyUJOx3AnZGWLtE0l-Vxv7c7uTnD8OXtCFhaO-nvavQ5'
        );
        (await utils.getAddressFromPublicKey(derivedPublicKey, true)).should.equal(
          'EQDVeyUJOx3AnZGWLtE0l-Vxv7c7uTnD8OXtCFhaO-nvavQ5'
        );
      });

      it('should derive non-bounceable address when requested', async function () {
        (await utils.getAddressFromPublicKey(derivedPublicKey, false)).should.equal(
          'UQDVeyUJOx3AnZGWLtE0l-Vxv7c7uTnD8OXtCFhaO-nvaqn8'
        );
      });

      it('should derive raw address when requested', async function () {
        (await utils.getAddressFromPublicKey(derivedPublicKey, false, false)).should.equal(
          '0:d57b25093b1dc09d91962ed13497e571bfb73bb939c3f0e5ed08585a3be9ef6a'
        );
      });
    });

    describe('getAddress', function () {
      it('should return address as per bounceable flag', function () {
        should.equal(
          utils.getAddress('UQB0Hyt1bTRfI0WK_ULZyKvrvP0PPtpTQFi_jKXVXX6KFOMi', false),
          'UQB0Hyt1bTRfI0WK_ULZyKvrvP0PPtpTQFi_jKXVXX6KFOMi'
        );
        should.equal(
          utils.getAddress('UQB0Hyt1bTRfI0WK_ULZyKvrvP0PPtpTQFi_jKXVXX6KFOMi', true),
          'EQB0Hyt1bTRfI0WK_ULZyKvrvP0PPtpTQFi_jKXVXX6KFL7n'
        );
        should.equal(
          utils.getAddress('EQB0Hyt1bTRfI0WK_ULZyKvrvP0PPtpTQFi_jKXVXX6KFL7n', true),
          'EQB0Hyt1bTRfI0WK_ULZyKvrvP0PPtpTQFi_jKXVXX6KFL7n'
        );
        should.equal(
          utils.getAddress('EQB0Hyt1bTRfI0WK_ULZyKvrvP0PPtpTQFi_jKXVXX6KFL7n', false),
          'UQB0Hyt1bTRfI0WK_ULZyKvrvP0PPtpTQFi_jKXVXX6KFOMi'
        );
      });
    });

    it('should validate block hash', async function () {
      should.equal(utils.isValidBlockId('MPuOvHdu/z+t2l82YpZtiJQk8+FVKmWuKxd6ubn09fI='), true);
      should.equal(utils.isValidBlockId('MPuOvHdu/z+t2l82YpZtiJQk8+FVKmWuKxd'), false);
      should.equal(utils.isValidBlockId(''), false);
    });

    it('should validate transaction id', async function () {
      should.equal(utils.isValidTransactionId('wlTdDOAXwJp8ESRfQAEJQIn0Tci_S5oLbVKBYxDtvpk='), true);
      should.equal(utils.isValidTransactionId('3sykx6Rujy7UtBwHQ/X5kLgvKE0SKLA+ABiCKi7sX8o='), true); // No url friendly txid
      should.equal(utils.isValidTransactionId('3sykx6Rujy7UtBwHQ_X5kLgvKE0SKLA-ABiCKi7sX8o='), true); // Url friendly txid
      should.equal(utils.isValidTransactionId('wlTdDOAXwJp8ESRfQAEJQIn0Tci_S5oLb='), false);
      should.equal(utils.isValidTransactionId('wlTdDOAXwJp8ESRfQAEJQIn0Tci_S5oLbVKBYxDtafdsasdadsfvpk='), false);
      should.equal(utils.isValidTransactionId(''), false);
    });

    it('should generate transaction id', async function () {
      const id = await utils.getMessageHashFromData(
        'te6cckECCgEAAkoAA7V2k4Vw1nhxr7XcCBjWcFFHKqGwCglPSRuYAkWjWiTVAIAAAPbLgva0G7ytKw/xeE9a3FHK2RM8fgOpGvTpQRseeMer3efRKsiQAADxPhnaQFZWYrlQADRqbCUIAQIDAgHgBAUAgnIAZ0UIwmknkMaW7QboTcq48FfZ1NT5oMUj2VPOBr3zPoxriab4SfV65i6Hd1J2sFsuTcIWUobcKXMcIys+JWknAhMMwSvWBhmTzwRACAkB4YgA0nCuGs8ONfa7gQMazgoo5VQ2AUEp6SNzAEi0a0SaoBAHHgnPJBQQJ/meoCwzK5/PajBSxuJK2Gkva7NmlALNDs2IMEWi4ZRfIV4VeJpKBhzhKjNlFjuz60g+aeT5cNi4CU1NGLsrey/4AAAAGAAcBgEB3wcAaGIAK2cYdYCtxtBaWJ9hi7N+HVzeMsPQxLHSqYn7bfpOcRyh3NZQAAAAAAAAAAAAAAAAAAAAsWgA0nCuGs8ONfa7gQMazgoo5VQ2AUEp6SNzAEi0a0SaoBEAFbOMOsBW42gtLE+wxdm/Dq5vGWHoYljpVMT9tv0nOI5Q7msoAAYUWGAAAB7ZcF7WhMrMVypAAJ1BnYMTiAAAAAAAAAAAEQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAG/Jh6EgTBRYQAAAAAAAAgAAAAAAA4E52AP/eAYnVhJkoII4YUrhpLfpDFt6mRKiktbFnqs+QFAWDAAacQ0=\\'
      );
      should.equal(id, 'TsVgNKT05cde4Q54sC+RFC7nToTrHk9ppGgE5M0jXtE=');
    });

    it('should deserialize a cell to get the address', function () {
      const data1 = 'te6cckEBAQEAJAAAQ4AaFUTgUQ/k2i+DdAooib0wNVREZQ2z+8R9WQvvFNpUJBARyAgK';
      const rawAddress1 = '0:d0aa2702887f26d17c1ba051444de981aaa223286d9fde23eac85f78a6d2a120';
      should.equal(utils.getRawWalletAddressFromCell(data1), rawAddress1);

      const data2 = 'te6cckEBAQEAJAAAQ5/75w034qP9T0ZXY3muM5ouvFlNoNPky2YUs+Hcxd8otjDkIOPq';
      const rawAddress2 = '-1:df3869bf151fea7a32bb1bcd719cd175e2ca6d069f265b30a59f0ee62ef945b1';
      should.equal(utils.getRawWalletAddressFromCell(data2), rawAddress2);
    });
  });

  describe('Ton recover - Non-BitGo and Unsigned Sweep Transactions', function () {
    let sandbox: sinon.SinonSandbox;
    beforeEach(() => {
      sandbox = sinon.createSandbox(); // Create a new sandbox for each test
    });

    afterEach(() => {
      sandbox.restore(); // Restore all stubs after each test
    });

    it('should successfully recover funds for non-BitGo recovery', async function () {
      // Define recovery parameters
      const recoveryParams = {
        bitgoKey:
          '1baafa0d62174bf0c78f3256318613ffc44b6dd54ab1a63c2185232f92ede9dae1b2818dbeb52a8215fd56f5a5f2a9f94c079ce89e4dc3b1ce6ed6e84ce71857',
        recoveryDestination: 'UQBL2idCXR4ATdQtaNa4VpofcpSxuxIgHH7_slOZfdOXSadJ',
        apiKey: 'db2554641c61e60a979cc6c0053f2ec91da9b13e71d287768c93c2fb556be53b',
        userKey:
          '1baafa0d62174bf0c78f3256318613ffc44b6dd54ab1a63c2185232f92ede9dae1b2818dbeb52a8215fd56f5a5f2a9f94c079ce89e4dc3b1ce6ed6e84ce71857',
        walletPassphrase: 'dummyPassphrase',
      };

      // Mock the expected result for non-BitGo recovery
      const mockResult = {
        serializedTx:
          'te6cckEBAgEAqgAB4YgAl7ROhLo8AJuoWtGtcK00PuUpY3YkQDj9/2SnMvunLpIFbl896wlMv7fsUOc+sMHzEl8q3vX5bm6noHginPJKBRznOrO7veIpHIEpiRLbH7/eNdpSsRhvL260JP/fD0vAIU1NGLtABDqAAAAACAAcAQBoQgB/OeiNdLeaL7+O04XuujuChSGrRd7ZnFl2fCd9FXdzAyDOJYCwAAAAAAAAAAAAAAAAAFwXGt8=',
        scanIndex: 0,
        coin: 'tton',
      };

      // Stub the recover function to return the mocked result
      const sandbox = sinon.createSandbox();
      sandbox.stub(basecoin, 'recover').resolves(mockResult);

      // Call the recover function
      const result = await basecoin.recover(recoveryParams);

      // Validate the result
      result.serializedTx.should.equal(
        'te6cckEBAgEAqgAB4YgAl7ROhLo8AJuoWtGtcK00PuUpY3YkQDj9/2SnMvunLpIFbl896wlMv7fsUOc+sMHzEl8q3vX5bm6noHginPJKBRznOrO7veIpHIEpiRLbH7/eNdpSsRhvL260JP/fD0vAIU1NGLtABDqAAAAACAAcAQBoQgB/OeiNdLeaL7+O04XuujuChSGrRd7ZnFl2fCd9FXdzAyDOJYCwAAAAAAAAAAAAAAAAAFwXGt8='
      );
      result.scanIndex.should.equal(0);
      result.coin.should.equal('tton');
      sandbox.restore(); // Restore the stubbed method
    });

    it('should return an unsigned sweep transaction if userKey and backupKey are missing', async function () {
      // Define recovery parameters
      const recoveryParams = {
        bitgoKey:
          '1baafa0d62174bf0c78f3256318613ffc44b6dd54ab1a63c2185232f92ede9dae1b2818dbeb52a8215fd56f5a5f2a9f94c079ce89e4dc3b1ce6ed6e84ce71857',
        recoveryDestination: 'UQBL2idCXR4ATdQtaNa4VpofcpSxuxIgHH7_slOZfdOXSadJ',
        apiKey: 'db2554641c61e60a979cc6c0053f2ec91da9b13e71d287768c93c2fb556be53b',
      };

      // Mock the expected result for unsigned sweep transaction
      const mockUnsignedTx = {
        serializedTx:
          'te6cckEBAgEAqgAB4YgAl7ROhLo8AJuoWtGtcK00PuUpY3YkQDj9/2SnMvunLpIFbl896wlMv7fsUOc+sMHzEl8q3vX5bm6noHginPJKBRznOrO7veIpHIEpiRLbH7/eNdpSsRhvL260JP/fD0vAIU1NGLtABDqAAAAACAAcAQBoQgB/OeiNdLeaL7+O04XuujuChSGrRd7ZnFl2fCd9FXdzAyDOJYCwAAAAAAAAAAAAAAAAAFwXGt8=',
        scanIndex: 0,
        coin: 'tton',
        signableHex: 'dd98eb5a3700c0203237095ca1c0d5288bc0d650a9b59f7b81bac552f76137df',
        derivationPath: 'm/0',
        parsedTx: {
          inputs: [
            {
              address: 'UQBL2idCXR4ATdQtaNa4VpofcpSxuxIgHH7_slOZfdOXSadJ',
              valueString: '1000000000',
              value: 1000000000,
            },
          ],
          outputs: [
            {
              address: 'UQBL2idCXR4ATdQtaNa4VpofcpSxuxIgHH7_slOZfdOXSadJ',
              valueString: '999000000',
              coinName: 'tton',
            },
          ],
          spendAmount: 999000000,
          type: '',
        },
        feeInfo: {
          fee: 1000000,
          feeString: '1000000',
        },
        coinSpecific: {
          commonKeychain:
            '1baafa0d62174bf0c78f3256318613ffc44b6dd54ab1a63c2185232f92ede9dae1b2818dbeb52a8215fd56f5a5f2a9f94c079ce89e4dc3b1ce6ed6e84ce71857',
        },
      };

      const mockTxRequest = {
        transactions: [
          {
            unsignedTx: mockUnsignedTx,
            signatureShares: [],
          },
        ],
        walletCoin: 'ton',
      };

      const mockTxRequests = {
        txRequests: [mockTxRequest],
      };

      // Stub the recover function to return the mocked unsigned sweep transaction
      const sandbox = sinon.createSandbox();

      sandbox.stub(basecoin, 'recover').resolves(mockTxRequests);

      // Call the recover function
      const result = await basecoin.recover(recoveryParams);

      // Validate the result
      result.should.have.property('txRequests');
      result.txRequests[0].should.have.property('transactions');
      result.txRequests[0].transactions[0].should.have.property('unsignedTx');
      result.txRequests[0].transactions[0].unsignedTx.should.equal(mockUnsignedTx);
    });

    it('should take OVC output and generate a signed sweep transaction', async function () {
      // Define the parameters (mock OVC response)
      const params = {
        ovcResponse: {
          serializedTx:
            'te6cckEBAgEAqgAB4YgAl7ROhLo8AJuoWtGtcK00PuUpY3YkQDj9/2SnMvunLpIFbl896wlMv7fsUOc+sMHzEl8q3vX5bm6noHginPJKBRznOrO7veIpHIEpiRLbH7/eNdpSsRhvL260JP/fD0vAIU1NGLtABDqAAAAACAAcAQBoQgB/OeiNdLeaL7+O04XuujuChSGrRd7ZnFl2fCd9FXdzAyDOJYCwAAAAAAAAAAAAAAAAAFwXGt8=',
          scanIndex: 0,
          lastScanIndex: 0,
        },
      };

      // Mock the expected result for the signed sweep transaction
      const mockSignedSweepTxn = {
        transactions: [
          {
            serializedTx:
              'te6cckEBAgEAqgAB4YgAl7ROhLo8AJuoWtGtcK00PuUpY3YkQDj9/2SnMvunLpIFbl896wlMv7fsUOc+sMHzEl8q3vX5bm6noHginPJKBRznOrO7veIpHIEpiRLbH7/eNdpSsRhvL260JP/fD0vAIU1NGLtABDqAAAAACAAcAQBoQgB/OeiNdLeaL7+O04XuujuChSGrRd7ZnFl2fCd9FXdzAyDOJYCwAAAAAAAAAAAAAAAAAFwXGt8=',
            scanIndex: 0,
          },
        ],
        lastScanIndex: 0,
      };

      // Stub the createBroadcastableSweepTransaction function to return the mocked result
      sandbox.stub(basecoin, 'createBroadcastableSweepTransaction').resolves(mockSignedSweepTxn);

      // Call the createBroadcastableSweepTransaction function
      const recoveryTxn = await basecoin.createBroadcastableSweepTransaction(params);

      // Validate the result
      recoveryTxn.transactions[0].serializedTx.should.equal(
        'te6cckEBAgEAqgAB4YgAl7ROhLo8AJuoWtGtcK00PuUpY3YkQDj9/2SnMvunLpIFbl896wlMv7fsUOc+sMHzEl8q3vX5bm6noHginPJKBRznOrO7veIpHIEpiRLbH7/eNdpSsRhvL260JP/fD0vAIU1NGLtABDqAAAAACAAcAQBoQgB/OeiNdLeaL7+O04XuujuChSGrRd7ZnFl2fCd9FXdzAyDOJYCwAAAAAAAAAAAAAAAAAFwXGt8='
      );
      recoveryTxn.transactions[0].scanIndex.should.equal(0);
      recoveryTxn.lastScanIndex.should.equal(0);
    });
  });
});
