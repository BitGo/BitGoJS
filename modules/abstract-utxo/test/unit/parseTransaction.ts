import assert from 'assert';

import * as sinon from 'sinon';
import { Wallet, UnexpectedAddressError, VerificationOptions } from '@bitgo/sdk-core';

import { UtxoWallet, Output, TransactionParams } from '../../src';
import type { TransactionExplanation } from '../../src/transaction/fixedScript/explainTransaction';

import { getUtxoCoin, getUtxoWallet } from './util';

describe('Parse Transaction', function () {
  const coin = getUtxoCoin('tbtc');

  /*
   * mock objects which get passed into parse transaction.
   * These objects are structured to force parse transaction into a
   * particular execution path for these tests.
   */
  const verification: VerificationOptions = {
    disableNetworking: true,
    keychains: {
      user: { id: '0', pub: 'aaa', type: 'independent' },
      backup: { id: '1', pub: 'bbb', type: 'independent' },
      bitgo: { id: '2', pub: 'ccc', type: 'independent' },
    },
  };

  const wallet = sinon.createStubInstance(Wallet, {
    migratedFrom: '2MzJxAENaesCFu3orrCdj22c69tLEsKXQoR',
  });

  const outputAmount = (0.01 * 1e8).toString();

  let stubExplainTransaction: sinon.SinonStub;
  let stubVerifyAddress: sinon.SinonStub | undefined;

  afterEach(() => {
    if (stubExplainTransaction) {
      stubExplainTransaction.restore();
    }
    if (stubVerifyAddress) {
      stubVerifyAddress.restore();
    }
  });

  async function runClassifyOutputsTest(
    outputAddress: string | undefined,
    verification: VerificationOptions,
    expectExternal: boolean,
    txParams: TransactionParams = {}
  ) {
    stubExplainTransaction = sinon.stub(coin, 'explainTransaction').resolves({
      outputs: [] as Output[],
      changeOutputs: [
        {
          address: outputAddress,
          amount: outputAmount,
        },
      ],
    } as TransactionExplanation);

    if (!txParams.changeAddress) {
      stubVerifyAddress = sinon.stub(coin, 'verifyAddress').throws(new UnexpectedAddressError('test error'));
    }

    const parsedTransaction = await coin.parseTransaction({
      txParams,
      txPrebuild: { txHex: '' },
      wallet: wallet as unknown as UtxoWallet,
      verification,
    });

    assert.ok(parsedTransaction.outputs[0]);
    assert.deepStrictEqual(parsedTransaction.outputs[0], {
      address: outputAddress,
      amount: outputAmount,
      external: expectExternal,
    });

    const isExplicit =
      txParams.recipients !== undefined && txParams.recipients.some((recipient) => recipient.address === outputAddress);
    assert.strictEqual(
      parsedTransaction.explicitExternalSpendAmount,
      Number(isExplicit && expectExternal ? outputAmount : 0)
    );
    assert.strictEqual(
      parsedTransaction.implicitExternalSpendAmount,
      Number(!isExplicit && expectExternal ? outputAmount : 0)
    );
  }

  it('should classify outputs which spend change back to a v1 wallet base address as internal', async function () {
    return runClassifyOutputsTest(wallet.migratedFrom(), verification, false);
  });

  it(
    'should classify outputs which spend change back to a v1 wallet base address as external ' +
      'if considerMigratedFromAddressInternal is set and false',
    async function () {
      return runClassifyOutputsTest(
        wallet.migratedFrom(),
        { ...verification, considerMigratedFromAddressInternal: false },
        true
      );
    }
  );

  it('should classify outputs which spend to addresses not on the wallet as external', async function () {
    return runClassifyOutputsTest('2Mxjx4E2EEe4yJuLvdEuAdMUd4id1emPCZs', verification, true);
  });

  it('should accept a custom change address', async function () {
    const changeAddress = '2NAuziD75WnPPHJVwnd4ckgY4SuJaDVVbMD';
    return runClassifyOutputsTest(changeAddress, verification, false, {
      changeAddress,
      recipients: [],
    });
  });

  it('should classify outputs with external address in recipients as explicit', async function () {
    const externalAddress = '2NAuziD75WnPPHJVwnd4ckgY4SuJaDVVbMD';
    return runClassifyOutputsTest(externalAddress, verification, true, {
      recipients: [{ address: externalAddress, amount: outputAmount }],
    });
  });

  describe('RBF Transaction ID Validation', function () {
    let rbfWallet: Wallet;
    let stubExplain: sinon.SinonStub;

    beforeEach(function () {
      rbfWallet = getUtxoWallet(coin, {
        id: '5b34252f1bf349930e34020a',
        coin: 'tbtc',
        keys: ['5b3424f91bf349930e340175', '5b3424f91bf349930e340176', '5b3424f91bf349930e340177'],
      });
    });

    afterEach(function () {
      if (stubExplain) {
        stubExplain.restore();
      }
      sinon.restore();
    });

    it('should throw error when decoded transaction ID does not match rbfTxId', async function () {
      const providedRbfTxId = 'tx-to-be-replaced';
      const decodedTxId = 'actual-decoded-tx-id';

      // Stub wallet.getTransaction
      sinon.stub(rbfWallet, 'getTransaction').resolves({
        id: providedRbfTxId,
        txHex: '0100000001',
        outputs: [
          {
            address: '2MzQwSSnBHWHqSAqtTVQ6v47XtaisrJa1Vc',
            value: 1000000,
            valueString: '1000000',
            wallet: 'some-other-wallet-id',
          },
        ],
      });

      stubExplain = sinon.stub(coin, 'explainTransaction');
      stubExplain.onCall(0).resolves({
        id: 'new-tx-id',
        outputs: [] as Output[],
        changeOutputs: [] as Output[],
      } as TransactionExplanation);

      // Second call: decoding the old RBF transaction with mismatched ID
      stubExplain.onCall(1).resolves({
        id: decodedTxId, // Different from providedRbfTxId
        outputs: [] as Output[],
        changeOutputs: [] as Output[],
      } as TransactionExplanation);

      try {
        await coin.parseTransaction({
          txParams: {
            rbfTxIds: [providedRbfTxId],
          },
          txPrebuild: { txHex: '0100000001' },
          wallet: rbfWallet as unknown as UtxoWallet,
          verification: {
            disableNetworking: true,
            keychains: {
              user: { id: '0', pub: 'aaa', type: 'independent' },
              backup: { id: '1', pub: 'bbb', type: 'independent' },
              bitgo: { id: '2', pub: 'ccc', type: 'independent' },
            },
          },
        });
        assert.fail('Should have thrown an error');
      } catch (error) {
        assert.ok(error instanceof Error);
        // Verify the error message matches the expected validation error
        const expectedMessage = `The provided rbfTxId ${providedRbfTxId} does not match the decoded transaction id ${decodedTxId}`;
        assert.strictEqual(error.message, expectedMessage);
      }
    });
  });
});
