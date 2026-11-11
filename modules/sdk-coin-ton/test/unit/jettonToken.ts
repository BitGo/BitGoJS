import Tonweb from 'tonweb';
import should from 'should';
import * as sinon from 'sinon';
import { TransactionExplanation } from '@bitgo/sdk-core';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';
import { JettonToken, Ton, TonParseTransactionOptions } from '../../src';
import * as testData from '../resources/ton';

describe('Jetton Tokens', function () {
  let bitgo: TestBitGoAPI;
  let testnetJettonToken;
  let mainnetJettonToken;
  const testnetTokenName = 'tton:ukwny-us';
  const mainnetTokenName = 'ton:usdt';

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

  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'test' });
    JettonToken.createTokenConstructors().forEach(({ name, coinConstructor }) => {
      bitgo.safeRegister(name, coinConstructor);
    });
    bitgo.initializeTestVars();
    testnetJettonToken = bitgo.coin(testnetTokenName);
    mainnetJettonToken = bitgo.coin(mainnetTokenName);
  });

  it('should return constants for Testnet Ton token', function () {
    testnetJettonToken.getChain().should.equal(testnetTokenName);
    testnetJettonToken.getBaseChain().should.equal('tton');
    testnetJettonToken.getFullName().should.equal('Ton Token');
    testnetJettonToken.getBaseFactor().should.equal(1e9);
    testnetJettonToken.type.should.equal(testnetTokenName);
    testnetJettonToken.name.should.equal('Test Unknown TokenY-US');
    testnetJettonToken.coin.should.equal('tton');
    testnetJettonToken.network.should.equal('Testnet');
    testnetJettonToken.contractAddress.should.equal('kQD8EQMavE1w6gvgMXUhN8hi7pSk4bKYM-W2dgkNqV54Y16Y');
    testnetJettonToken.decimalPlaces.should.equal(9);
  });

  it('should return constants for Mainnet Ton token', function () {
    mainnetJettonToken.getChain().should.equal(mainnetTokenName);
    mainnetJettonToken.getBaseChain().should.equal('ton');
    mainnetJettonToken.getFullName().should.equal('Ton Token');
    mainnetJettonToken.getBaseFactor().should.equal(1e6);
    mainnetJettonToken.type.should.equal(mainnetTokenName);
    mainnetJettonToken.name.should.equal('Tether USD');
    mainnetJettonToken.coin.should.equal('ton');
    mainnetJettonToken.network.should.equal('Mainnet');
    mainnetJettonToken.contractAddress.should.equal('EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs');
    mainnetJettonToken.decimalPlaces.should.equal(6);
  });

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

    it('should succeed to verify transaction with recipient having memo', async function () {
      const txParams = {
        recipients: [testData.signedTokenSendTransactionForMemoId.recipient],
      };
      const txPrebuild = {
        txHex: Buffer.from(testData.signedTokenSendTransactionForMemoId.tx, 'base64').toString('hex'),
        txInfo: {},
      };
      const verification = {};
      const isTransactionVerified = await testnetJettonToken.verifyTransaction({
        txParams,
        txPrebuild,
        verification,
      } as any);
      isTransactionVerified.should.equal(true);
    });
    it('should fail to verify transaction when the prebuild is missing the memo comment', async function () {
      const txParams = {
        recipients: [
          {
            address: `${testData.signedTokenSendTransaction.recipientBounceable.address}?memoId=1234`,
            amount: testData.signedTokenSendTransaction.recipientBounceable.amount,
          },
        ],
      };
      const txPrebuild = {
        txHex: Buffer.from(testData.signedTokenSendTransaction.tx, 'base64').toString('hex'),
        txInfo: {},
      };
      await testnetJettonToken
        .verifyTransaction({ txParams, txPrebuild, verification: {} } as any)
        .should.rejectedWith('Tx outputs does not match with expected txParams recipients');
    });

    it('should fail to verify transaction when the memo comment differs from the memoId', async function () {
      const txParams = {
        recipients: [
          {
            address: 'UQB-CM6DF-jpq9XVdiSdefAMU5KC1gpZuYBFp-Q65aUhn0OP?memoId=9999',
            amount: testData.signedTokenSendTransactionForMemoId.recipient.amount,
          },
        ],
      };
      const txPrebuild = {
        txHex: Buffer.from(testData.signedTokenSendTransactionForMemoId.tx, 'base64').toString('hex'),
        txInfo: {},
      };
      await testnetJettonToken
        .verifyTransaction({ txParams, txPrebuild, verification: {} } as any)
        .should.rejectedWith('Tx outputs does not match with expected txParams recipients');
    });

    it('should fail to verify transaction when the prebuild carries an undeclared comment', async function () {
      const txParams = {
        recipients: [testData.signedTokenSendTransactionWithComment.recipient],
      };
      const txPrebuild = {
        txHex: Buffer.from(testData.signedTokenSendTransactionWithComment.tx, 'base64').toString('hex'),
        txInfo: {},
      };
      await testnetJettonToken
        .verifyTransaction({ txParams, txPrebuild, verification: {} } as any)
        .should.rejectedWith('Tx outputs does not match with expected txParams recipients');
    });

    it('should expose the full snake-format forward comment as the memo (mainnet)', async function () {
      const explainedTransaction = (await mainnetJettonToken.explainTransaction({
        txHex: Buffer.from(testData.signedTokenSendTransactionWithSnakeComment.tx, 'base64').toString('hex'),
      })) as TransactionExplanation;
      explainedTransaction.outputs[0]!.memo!.should.equal('12345678');
    });

    it('should fail to verify a memoId recipient when the forward comment carries a snake-format continuation (mainnet)', async function () {
      await mainnetJettonToken
        .verifyTransaction({
          txParams: { recipients: [testData.signedTokenSendTransactionWithSnakeComment.recipient] },
          txPrebuild: {
            txHex: Buffer.from(testData.signedTokenSendTransactionWithSnakeComment.tx, 'base64').toString('hex'),
            txInfo: {},
          },
          verification: {},
        } as any)
        .should.rejectedWith('Tx outputs does not match with expected txParams recipients');
    });

    it('should fail to verify an undeclared snake-format forward comment when the recipient declares no memo (mainnet)', async function () {
      await mainnetJettonToken
        .verifyTransaction({
          txParams: {
            recipients: [
              {
                address: 'UQB-CM6DF-jpq9XVdiSdefAMU5KC1gpZuYBFp-Q65aUhn0OP',
                amount: '1000000000',
              },
            ],
          },
          txPrebuild: {
            txHex: Buffer.from(testData.signedTokenSendTransactionWithSnakeComment.tx, 'base64').toString('hex'),
            txInfo: {},
          },
          verification: {},
        } as any)
        .should.rejectedWith('Tx outputs does not match with expected txParams recipients');
    });

    it('should read the forward payload comment, not the custom_payload, when both are present (mainnet)', async function () {
      const explainedTransaction = (await mainnetJettonToken.explainTransaction({
        txHex: Buffer.from(testData.signedTokenSendTransactionWithCustomPayload.tx, 'base64').toString('hex'),
      })) as TransactionExplanation;
      explainedTransaction.outputs[0]!.memo!.should.equal('5678');
    });

    it('should verify a custom_payload transfer against the forward payload memoId (mainnet)', async function () {
      await mainnetJettonToken.verifyTransaction({
        txParams: { recipients: [testData.signedTokenSendTransactionWithCustomPayload.recipient] },
        txPrebuild: {
          txHex: Buffer.from(testData.signedTokenSendTransactionWithCustomPayload.tx, 'base64').toString('hex'),
          txInfo: {},
        },
        verification: {},
      } as any);
    });

    it('should fail to verify a custom_payload transfer against the decoy custom_payload memoId (mainnet)', async function () {
      await mainnetJettonToken
        .verifyTransaction({
          txParams: {
            recipients: [
              {
                address: 'UQB-CM6DF-jpq9XVdiSdefAMU5KC1gpZuYBFp-Q65aUhn0OP?memoId=1234',
                amount: '1000000000',
              },
            ],
          },
          txPrebuild: {
            txHex: Buffer.from(testData.signedTokenSendTransactionWithCustomPayload.tx, 'base64').toString('hex'),
            txInfo: {},
          },
          verification: {},
        } as any)
        .should.rejectedWith('Tx outputs does not match with expected txParams recipients');
    });

    it('should expose an inline forward payload comment as the memo (mainnet)', async function () {
      const explainedTransaction = (await mainnetJettonToken.explainTransaction({
        txHex: Buffer.from(testData.signedTokenSendTransactionWithInlinePayload.tx, 'base64').toString('hex'),
      })) as TransactionExplanation;
      explainedTransaction.outputs[0]!.memo!.should.equal('5678');
    });

    it('should verify an inline forward payload transfer against its memoId (mainnet)', async function () {
      await mainnetJettonToken.verifyTransaction({
        txParams: { recipients: [testData.signedTokenSendTransactionWithInlinePayload.recipient] },
        txPrebuild: {
          txHex: Buffer.from(testData.signedTokenSendTransactionWithInlinePayload.tx, 'base64').toString('hex'),
          txInfo: {},
        },
        verification: {},
      } as any);
    });
  });

  describe('Explain Jetton Transaction: ', () => {
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

    it('should explain the jetton forward comment as the output memo', async function () {
      const explainedTransaction = (await testnetJettonToken.explainTransaction({
        txHex: Buffer.from(testData.signedTokenSendTransactionWithComment.tx, 'base64').toString('hex'),
      })) as TransactionExplanation;
      explainedTransaction.outputs[0]!.memo!.should.equal('jetton testing');
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
