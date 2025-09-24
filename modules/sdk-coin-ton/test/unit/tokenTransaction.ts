import * as sinon from 'sinon';
import should from 'should';
import Tonweb from 'tonweb';
import { TransactionExplanation } from '@bitgo/sdk-core';
import { TestBitGo } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';
import { JettonToken, Ton, TonParseTransactionOptions } from '../../src';
import * as testData from '../resources/ton';

describe('Jetton Transactions:', function () {
  const testnetTokenName = 'tton:ukwny-us';
  const bitgo = TestBitGo.decorate(BitGoAPI, { env: 'mock' });
  JettonToken.createTokenConstructors().forEach(({ name, coinConstructor }) => {
    bitgo.safeRegister(name, coinConstructor);
  });
  const testnetJettonToken = bitgo.coin(testnetTokenName);
  bitgo.initializeTestVars();
  const txPrebuildList = [
    {
      txHex: Buffer.from(testData.signedTokenSendTransaction.tx, 'base64').toString('hex'),
      txInfo: {},
    },
  ];
  const txPrebuildBounceableList = [
    {
      txHex: Buffer.from(testData.signedTokenSendTransaction.txBounceable, 'base64').toString('hex'),
      txInfo: {},
    },
  ];

  const txParamsList = [
    {
      recipients: [testData.signedTokenSendTransaction.recipient],
    },
  ];

  const txParamsBounceableList = [
    {
      recipients: [testData.signedTokenSendTransaction.recipientBounceable],
    },
  ];

  describe('Verify Jetton transaction: ', () => {
    txParamsList.forEach((_, index) => {
      const txParams = txParamsList[index];
      const txPrebuild = txPrebuildList[index];
      const txParamsBounceable = txParamsBounceableList[index];
      const txPrebuildBounceable = txPrebuildBounceableList[index];

      it('should succeed to verify transaction', async function () {
        const verification = {};
        const isTransactionVerified = await testnetJettonToken.verifyTransaction({
          txParams,
          txPrebuild,
          verification,
        } as any);
        isTransactionVerified.should.equal(true);

        const isBounceableTransactionVerified = await testnetJettonToken.verifyTransaction({
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
        await testnetJettonToken
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
        await testnetJettonToken
          .verifyTransaction({
            txParams: txParamsWithNumberAmounts,
            txPrebuild,
            verification,
          } as any)
          .should.rejectedWith('Tx outputs does not match with expected txParams recipients');
      });

      it('should succeed to verify transaction when recipients amounts are number and amount is same', async function () {
        const verification = {};
        await testnetJettonToken
          .verifyTransaction({
            txParams,
            txPrebuild,
            verification,
          } as any)
          .should.resolvedWith(true);
      });

      it('should succeed to verify transaction when recipients amounts are string and amount is same', async function () {
        const verification = {};
        await testnetJettonToken
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
        const isVerified = await testnetJettonToken.verifyTransaction({
          txParams: txParamsWithNumberAmounts,
          txPrebuild,
          verification,
        } as any);
        isVerified.should.equal(true);
      });

      it('should fail to verify transaction with invalid param', async function () {
        const txPrebuild = {};
        await testnetJettonToken
          .verifyTransaction({
            txParams,
            txPrebuild,
          } as any)
          .should.rejectedWith('missing required tx prebuild property txHex');
      });
    });
  });

  describe('Explain Jetton Transaction: ', () => {
    const testnetJettonToken = bitgo.coin(testnetTokenName);
    it('should explain a jetton transfer transaction', async function () {
      const explainedTransaction = (await testnetJettonToken.explainTransaction({
        txHex: Buffer.from(testData.signedTokenSendTransaction.tx, 'base64').toString('hex'),
      })) as TransactionExplanation;
      explainedTransaction.should.deepEqual({
        displayOrder: ['id', 'outputs', 'outputAmount', 'changeOutputs', 'changeAmount', 'fee', 'withdrawAmount'],
        id: testData.signedTokenSendTransaction.txId,
        outputs: [
          {
            address: testData.signedTokenSendTransaction.recipient.address,
            amount: testData.signedTokenSendTransaction.recipient.amount,
          },
        ],
        outputAmount: testData.signedTokenSendTransaction.recipient.amount,
        changeOutputs: [],
        changeAmount: '0',
        fee: { fee: 'UNKNOWN' },
        withdrawAmount: undefined,
      });
    });

    it('should explain a non-bounceable jetton transfer transaction', async function () {
      const explainedTransaction = (await testnetJettonToken.explainTransaction({
        txHex: Buffer.from(testData.signedTokenSendTransaction.txBounceable, 'base64').toString('hex'),
        toAddressBounceable: false,
        fromAddressBounceable: false,
      })) as TransactionExplanation;
      explainedTransaction.should.deepEqual({
        displayOrder: ['id', 'outputs', 'outputAmount', 'changeOutputs', 'changeAmount', 'fee', 'withdrawAmount'],
        id: testData.signedTokenSendTransaction.txIdBounceable,
        outputs: [
          {
            address: testData.signedTokenSendTransaction.recipientBounceable.address,
            amount: testData.signedTokenSendTransaction.recipientBounceable.amount,
          },
        ],
        outputAmount: testData.signedTokenSendTransaction.recipientBounceable.amount,
        changeOutputs: [],
        changeAmount: '0',
        fee: { fee: 'UNKNOWN' },
        withdrawAmount: undefined,
      });
    });

    it('should fail to explain transaction with missing params', async function () {
      try {
        await testnetJettonToken.explainTransaction({});
      } catch (error) {
        should.equal(error.message, 'Invalid transaction');
      }
    });

    it('should fail to explain transaction with invalid params', async function () {
      try {
        await testnetJettonToken.explainTransaction({ txHex: 'randomString' });
      } catch (error) {
        should.equal(error.message, 'Invalid transaction');
      }
    });
  });

  describe('Parse Jetton Transactions: ', () => {
    const testnetJettonToken = bitgo.coin(testnetTokenName);

    const transactionsList = [testData.signedTokenSendTransaction.tx];

    const transactionInputsResponseList = [
      [
        {
          address: 'EQCqQzfyg0cZ-8t9v2YoHmFFxG5jgjvQRTZ2yeDjO5z5ZRy9',
          amount: testData.tokenRecipients[0].amount,
        },
      ],
    ];

    const transactionInputsResponseBounceableList = [
      [
        {
          address: testData.tokenSender.address,
          amount: testData.tokenRecipients[0].amount,
        },
      ],
    ];

    const transactionOutputsResponseList = [
      [
        {
          address: 'EQB-CM6DF-jpq9XVdiSdefAMU5KC1gpZuYBFp-Q65aUhnx5K',
          amount: testData.tokenRecipients[0].amount,
        },
      ],
    ];

    const transactionOutputsResponseBounceableList = [
      [
        {
          address: testData.tokenRecipients[0].address,
          amount: testData.tokenRecipients[0].amount,
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
        const parsedTransaction = await testnetJettonToken.parseTransaction({
          txHex: Buffer.from(transaction, 'base64').toString('hex'),
        });

        parsedTransaction.should.deepEqual({
          inputs: transactionInputsResponse,
          outputs: transactionOutputsResponse,
        });
      });

      it('should parse a non-bounceable TON transaction', async function () {
        const parsedTransaction = await testnetJettonToken.parseTransaction({
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
        await testnetJettonToken
          .parseTransaction({ txHex: transaction })
          .should.be.rejectedWith('invalid raw transaction');
        stub.restore();
      });
    });
  });
});
