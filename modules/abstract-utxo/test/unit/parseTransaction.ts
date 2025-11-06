import should = require('should');
import * as sinon from 'sinon';
import { Wallet, UnexpectedAddressError, VerificationOptions } from '@bitgo/sdk-core';

import { UtxoWallet, Output, TransactionExplanation, TransactionParams } from '../../src';

import { getUtxoCoin } from './util';

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

  async function runClassifyOutputsTest(outputAddress, verification, expectExternal, txParams: TransactionParams = {}) {
    sinon.stub(coin, 'explainTransaction').resolves({
      outputs: [] as Output[],
      changeOutputs: [
        {
          address: outputAddress,
          amount: outputAmount,
        },
      ],
    } as TransactionExplanation);

    if (!txParams.changeAddress) {
      sinon.stub(coin, 'verifyAddress').throws(new UnexpectedAddressError('test error'));
    }

    const parsedTransaction = await coin.parseTransaction({
      txParams,
      txPrebuild: { txHex: '' },
      wallet: wallet as unknown as UtxoWallet,
      verification,
    });

    should.exist(parsedTransaction.outputs[0]);
    parsedTransaction.outputs[0].should.deepEqual({
      address: outputAddress,
      amount: outputAmount,
      external: expectExternal,
    });

    const isExplicit =
      txParams.recipients !== undefined && txParams.recipients.some((recipient) => recipient.address === outputAddress);
    should.equal(parsedTransaction.explicitExternalSpendAmount, isExplicit && expectExternal ? outputAmount : '0');
    should.equal(parsedTransaction.implicitExternalSpendAmount, !isExplicit && expectExternal ? outputAmount : '0');

    (coin.explainTransaction as any).restore();

    if (!txParams.changeAddress) {
      (coin.verifyAddress as any).restore();
    }
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
});
