import assert from 'node:assert/strict';

import * as sinon from 'sinon';
import * as utxolib from '@bitgo/utxo-lib';
import { Wallet, VerificationOptions, ITransactionRecipient } from '@bitgo/sdk-core';

import { parseTransaction } from '../../../../src/transaction/fixedScript/parseTransaction';
import { ParsedTransaction } from '../../../../src/abstractUtxoCoin';
import { UtxoWallet } from '../../../../src/wallet';
import { getUtxoCoin } from '../../util';
import { explainPsbt } from '../../../../src/transaction/fixedScript';
import type { TransactionExplanation } from '../../../../src/transaction/fixedScript/explainTransaction';
import { getChainFromNetwork } from '../../../../src/names';

function getTxParamsFromExplanation(explanation: TransactionExplanation): {
  recipients: ITransactionRecipient[];
  changeAddress?: string;
} {
  // The external outputs are the ones that are in outputs but not in changeOutputs
  const changeAddresses = new Set(explanation.changeOutputs.map((o) => o.address));
  const externalOutputs = explanation.outputs.filter((o) => o.address && !changeAddresses.has(o.address));

  return {
    recipients: externalOutputs.map((output) => ({
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      address: output.address!,
      amount: output.amount,
    })),
    changeAddress: undefined,
  };
}

function describeParseTransactionWith(
  acidTest: utxolib.testutil.AcidTest,
  explanation: TransactionExplanation,
  {
    label = 'default',
    txParams,
    expectedExplicitExternalSpendAmount,
    expectedImplicitExternalSpendAmount,
  }: {
    label?: string;
    txParams: {
      recipients: ITransactionRecipient[];
      changeAddress?: string;
    };
    expectedExplicitExternalSpendAmount: bigint;
    expectedImplicitExternalSpendAmount: bigint;
  }
) {
  describe(`${acidTest.name}/${label}`, function () {
    let refParsedTransaction: ParsedTransaction<bigint>;
    let coin: ReturnType<typeof getUtxoCoin>;
    let mockWallet: sinon.SinonStubbedInstance<Wallet>;
    let stubExplainTransaction: sinon.SinonStub;

    before('prepare', async function () {
      const coinName = getChainFromNetwork(acidTest.network);
      coin = getUtxoCoin(coinName);

      // Create mock wallet
      mockWallet = sinon.createStubInstance(Wallet);
      mockWallet.id.returns('test-wallet-id');
      mockWallet.coin.returns(coin.getChain());
      mockWallet.coinSpecific.returns(undefined);

      // Mock verification options with keychains to disable networking
      // Use the same keychains that were used to create the PSBT
      const pubs = acidTest.rootWalletKeys.triple.map((k) => k.neutered().toBase58());
      const verification: VerificationOptions = {
        disableNetworking: true,
        keychains: {
          user: { id: '0', pub: pubs[0], type: 'independent' },
          backup: { id: '1', pub: pubs[1], type: 'independent' },
          bitgo: { id: '2', pub: pubs[2], type: 'independent' },
        },
      };

      // Stub explainTransaction to return the explanation without making network calls
      stubExplainTransaction = sinon.stub(coin, 'explainTransaction').resolves(explanation);

      refParsedTransaction = await parseTransaction(coin, {
        wallet: mockWallet as unknown as UtxoWallet,
        txParams,
        txPrebuild: {
          txHex: acidTest.createPsbt().toHex(),
        },
        verification,
      });
    });

    after('cleanup', function () {
      if (stubExplainTransaction) {
        stubExplainTransaction.restore();
      }
    });

    it('should parse transaction without network calls', function () {
      assert.ok(refParsedTransaction);
      assert.ok(refParsedTransaction.keychains);
      assert.ok(refParsedTransaction.outputs);
    });

    it('should have valid keychains', function () {
      assert.ok(refParsedTransaction.keychains.user);
      assert.ok(refParsedTransaction.keychains.backup);
      assert.ok(refParsedTransaction.keychains.bitgo);
      const pubs = acidTest.rootWalletKeys.triple.map((k) => k.neutered().toBase58());
      assert.strictEqual(refParsedTransaction.keychains.user.pub, pubs[0]);
      assert.strictEqual(refParsedTransaction.keychains.backup.pub, pubs[1]);
      assert.strictEqual(refParsedTransaction.keychains.bitgo.pub, pubs[2]);
    });

    it('should have outputs classified as internal or external', function () {
      // Since we didn't specify any recipients, outputs will be classified based on whether they can be
      // verified as wallet addresses. Some may be external if address verification fails without a proper wallet setup.
      const totalOutputs = refParsedTransaction.outputs.length;
      const changeOutputs = refParsedTransaction.changeOutputs.length;
      const externalOutputs = refParsedTransaction.outputs.filter((o) => o.external === true).length;
      assert.strictEqual(externalOutputs, 3);

      assert.ok(totalOutputs > 0, 'should have at least one output');
      assert.strictEqual(changeOutputs + externalOutputs, totalOutputs, 'all outputs should be classified');
    });

    it('should have expected explicit and implicit external spend amounts', function () {
      assert.strictEqual(BigInt(refParsedTransaction.explicitExternalSpendAmount), expectedExplicitExternalSpendAmount);
      assert.strictEqual(BigInt(refParsedTransaction.implicitExternalSpendAmount), expectedImplicitExternalSpendAmount);
    });
  });
}

describe('parsePsbt', function () {
  utxolib.testutil.AcidTest.suite().forEach((test) => {
    const psbt = test.createPsbt();
    const explanation: TransactionExplanation = explainPsbt(psbt, { pubs: test.rootWalletKeys }, test.network, {
      strict: true,
    });

    // Default case: infer recipients from explanation
    describeParseTransactionWith(test, explanation, {
      txParams: getTxParamsFromExplanation(explanation),
      expectedExplicitExternalSpendAmount: 2700n,
      expectedImplicitExternalSpendAmount: 0n,
    });

    if (test.network === utxolib.networks.bitcoin) {
      // extended test suite for bitcoin
      describeParseTransactionWith(test, explanation, {
        label: 'empty recipients',
        txParams: {
          recipients: [],
          changeAddress: undefined,
        },
        expectedExplicitExternalSpendAmount: 0n,
        expectedImplicitExternalSpendAmount: 2700n,
      });
    }
  });
});
