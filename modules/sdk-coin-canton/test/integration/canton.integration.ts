import assert from 'assert';

import { TransactionType } from '@bitgo/sdk-core';

import { getCantonBuilderFactory } from '../helper';
import {
  GenerateTopologyResponse,
  TransferAcceptRawTransaction,
  TransferRejectRawTransaction,
  WalletInitRawTransaction,
} from '../resources';

describe('Canton integration tests', function () {
  describe('Explain raw transaction', function () {
    const factory = getCantonBuilderFactory('tcanton');
    it('should explain raw wallet init transaction', function () {
      const builder = factory.from(WalletInitRawTransaction);
      const txn = builder.transaction;
      const explainTxData = txn.explainTransaction();
      assert(explainTxData);
      assert.equal(explainTxData.id, GenerateTopologyResponse.multiHash);
      assert.equal(explainTxData.type, TransactionType.WalletInitialization);
    });

    it('should explain raw transfer acceptance transaction', function () {
      const builder = factory.from(TransferAcceptRawTransaction);
      const txn = builder.transaction;
      const explainTxData = txn.explainTransaction();
      assert(explainTxData);
      assert(explainTxData.id);
      assert.equal(explainTxData.type, TransactionType.TransferAccept);
      assert.equal(explainTxData.inputAmount, '5.0000000000');
    });

    it('should explain raw transfer rejection transaction', function () {
      const builder = factory.from(TransferRejectRawTransaction);
      const txn = builder.transaction;
      const explainTxData = txn.explainTransaction();
      assert(explainTxData);
      assert.equal(explainTxData.type, TransactionType.TransferReject);
      assert.equal(explainTxData.inputAmount, '5.0000000000');
    });
  });
});
