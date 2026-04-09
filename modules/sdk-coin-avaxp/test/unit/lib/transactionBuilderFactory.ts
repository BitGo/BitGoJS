import assert from 'assert';
import * as testData from '../../resources/avaxp';
import * as errorMessage from '../../resources/errors';
import { TransactionBuilderFactory, TxData } from '../../../src/lib';
import { coins } from '@bitgo/statics';
import { BaseTransaction, TransactionType } from '@bitgo/sdk-core';
import { IMPORT_P } from '../../resources/tx/importP';
import { IMPORT_C } from '../../resources/tx/importC';
import { EXPORT_C } from '../../resources/tx/exportC';
import { ADDVALIDATOR_SAMPLES } from '../../resources/avaxp';

describe('AvaxP Transaction Builder Factory', () => {
  const factory = new TransactionBuilderFactory(coins.get('tavaxp'));

  describe('should validate', () => {
    it('an empty raw transaction', () => {
      assert.throws(
        () => {
          factory.from('');
        },
        (e: any) => e.message === errorMessage.ERROR_EMPTY_RAW_TRANSACTION
      );
    });

    it('an invalid raw transfer transaction', () => {
      assert.throws(
        () => {
          factory.from(testData.INVALID_RAW_TRANSACTION);
        },
        (e: any) => e.message === errorMessage.ERROR_RAW_PARSING
      );
    });

    it('Should validate a correct raw tx', () => {
      factory.from(testData.ADDVALIDATOR_SAMPLES.unsignedTxHex);
      // should not throw a error!
    });

    it("Shouldn't get a wallet initialization builder", () => {
      assert.throws(
        () => {
          factory.getWalletInitializationBuilder();
        },
        (e: any) => e.message === errorMessage.ERROR_WALLET_INITIALIZATION
      );
    });
  });

  describe('Transaction readable', () => {
    const rawTxs = [
      testData.ADD_VALIDATOR_ID_SAMPLE.fullsigntxHex,
      testData.EXPORT_P_2_C.fullsigntxHex,
      testData.EXPORT_P_2_C.halfsigntxHex,
      testData.EXPORT_P_2_C.unsignedTxHex,
      IMPORT_P.fullsigntxHex,
      IMPORT_P.halfsigntxHex,
      IMPORT_P.unsignedTxHex,
    ];
    let tx: BaseTransaction;
    before(async () => {
      const txBuilder = new TransactionBuilderFactory(coins.get('tavaxp')).from(
        testData.ADD_VALIDATOR_ID_SAMPLE.fullsigntxHex
      );
      tx = await txBuilder.build();
    });

    it('Should json stringifiy any transaction object', async () => {
      for (const rawTx of rawTxs) {
        const txBuilder = new TransactionBuilderFactory(coins.get('tavaxp')).from(rawTx);
        const tx = await txBuilder.build();
        const txJson = tx.toJson();
        assert(typeof JSON.stringify(txJson), 'string');
      }
    });

    it('Should json stringifiy addValidator transaction', async () => {
      const txJson = tx.toJson();
      assert(typeof JSON.stringify(tx.toJson()), 'string');
      txJson.id.should.equal(testData.ADD_VALIDATOR_ID_SAMPLE.txid);
    });

    it('Should get a txid', async () => {
      tx.id.should.equal(testData.ADD_VALIDATOR_ID_SAMPLE.txid);
    });
  });

  describe('should explains transaction', () => {
    it('should explains a Signed AddValidatorTx', async () => {
      const txBuilder = new TransactionBuilderFactory(coins.get('tavaxp')).from(
        testData.ADDVALIDATOR_SAMPLES.fullsigntxHex
      );
      const tx = await txBuilder.build();
      const txExplain = tx.explainTransaction();
      txExplain.outputAmount.should.equal(testData.ADDVALIDATOR_SAMPLES.minValidatorStake);
      txExplain.type.should.equal(TransactionType.AddValidator);
      txExplain.outputs[0].address.should.equal(testData.ADDVALIDATOR_SAMPLES.nodeID);
    });

    it('should explains a Half Signed AddValidatorTx', async () => {
      const txBuilder = new TransactionBuilderFactory(coins.get('tavaxp')).from(
        testData.ADDVALIDATOR_SAMPLES.halfsigntxHex
      );
      const tx = await txBuilder.build();
      const txExplain = tx.explainTransaction();
      txExplain.outputAmount.should.equal(testData.ADDVALIDATOR_SAMPLES.minValidatorStake);
      txExplain.type.should.equal(TransactionType.AddValidator);
      txExplain.outputs[0].address.should.equal(testData.ADDVALIDATOR_SAMPLES.nodeID);
    });

    it('should explains a unsigned AddValidatorTx', async () => {
      const txBuilder = new TransactionBuilderFactory(coins.get('tavaxp')).from(
        testData.ADDVALIDATOR_SAMPLES.unsignedTxHex
      );
      const tx = await txBuilder.build();
      const txExplain = tx.explainTransaction();
      txExplain.outputAmount.should.equal(testData.ADDVALIDATOR_SAMPLES.minValidatorStake);
      txExplain.type.should.equal(TransactionType.AddValidator);
      txExplain.outputs[0].address.should.equal(testData.ADDVALIDATOR_SAMPLES.nodeID);
    });
  });

  describe('Cross chain transfer has source and destination chains', () => {
    const p2cTxs = [
      IMPORT_P.fullsigntxHex,
      IMPORT_P.halfsigntxHex,
      IMPORT_P.unsignedTxHex,
      EXPORT_C.fullsigntxHex,
      EXPORT_C.unsignedTxHex,
    ];

    const c2pTxs = [
      IMPORT_C.fullsigntxHex,
      IMPORT_C.halfsigntxHex,
      IMPORT_C.unsignedTxHex,
      testData.EXPORT_P_2_C.fullsigntxHex,
      testData.EXPORT_P_2_C.halfsigntxHex,
      testData.EXPORT_P_2_C.unsignedTxHex,
    ];

    const noCrossChainTxs = [
      ADDVALIDATOR_SAMPLES.fullsigntxHex,
      ADDVALIDATOR_SAMPLES.halfsigntxHex,
      ADDVALIDATOR_SAMPLES.unsignedTxHex,
    ];

    async function toJson(txHex: string): Promise<TxData> {
      const txBuilder = new TransactionBuilderFactory(coins.get('tavaxp')).from(txHex);
      const tx = await txBuilder.build();
      return tx.toJson();
    }

    it('Should json have sourceChain C and destinationChain P', async () => {
      for (const rawTx of p2cTxs) {
        const txJson = await toJson(rawTx);
        txJson.sourceChain!.should.equal('C');
        txJson.destinationChain!.should.equal('P');
      }
    });

    it('Should json have sourceChain P and destinationChain C', async () => {
      for (const rawTx of c2pTxs) {
        const txJson = await toJson(rawTx);
        txJson.sourceChain!.should.equal('P');
        txJson.destinationChain!.should.equal('C');
      }
    });

    it('Should json have not sourceChain either destinationChain ', async () => {
      for (const rawTx of noCrossChainTxs) {
        const txJson = await toJson(rawTx);
        txJson.should.property('sourceChain').be.undefined();
        txJson.should.property('destinationChain').be.undefined();
      }
    });
  });
});
