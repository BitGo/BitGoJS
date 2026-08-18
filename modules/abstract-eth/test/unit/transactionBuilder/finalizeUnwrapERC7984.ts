/**
 * TransactionBuilder tests for FinalizeUnwrapERC7984 transaction type.
 */
import { TransactionType } from '@bitgo/sdk-core';
import should from 'should';
import { ETHTransactionType, TransactionBuilder } from '../../../src';
import {
  buildFinalizeUnwrapCalldata,
  decodeFinalizeUnwrapCalldata,
  finalizeUnwrapMethodId,
} from '../../../src/lib/zamaUtils';
import { classifyTransaction } from '../../../src/lib/utils';

const WRAPPER_ADDRESS = '0x2debbe0487ef921df4457f9e36ed05be2df1ac75'; // hteth:cusdt
const REQUEST_ID = '0x' + '11'.repeat(32);
const CLEARTEXT_AMOUNT = '1000000';
const DECRYPTION_PROOF = '0x' + 'ee'.repeat(64);
const TEST_PRV_KEY = 'FAC4D04AA0025ECF200D74BC9B5E4616E4B8338B69B61362AAAD49F76E68EF28';

export function runFinalizeUnwrapERC7984Tests(
  coinName: string,
  getBuilder: (coin: string) => TransactionBuilder
): void {
  describe(`${coinName} transaction builder — FinalizeUnwrapERC7984`, () => {
    let txBuilder: TransactionBuilder;

    beforeEach(() => {
      txBuilder = getBuilder(coinName);
      txBuilder.fee({ fee: '1000000000', gasLimit: '200000' });
      txBuilder.counter(1);
    });

    describe('classifyTransaction', () => {
      it('should classify finalizeUnwrap(...) as FinalizeUnwrapERC7984', () => {
        const calldata = buildFinalizeUnwrapCalldata(REQUEST_ID, CLEARTEXT_AMOUNT, DECRYPTION_PROOF);
        should.equal(classifyTransaction(calldata), TransactionType.FinalizeUnwrapERC7984);
      });

      it('should NOT classify approve as FinalizeUnwrapERC7984', () => {
        should.equal(classifyTransaction('0x095ea7b3' + '00'.repeat(64)), TransactionType.ContractCall);
      });
    });

    describe('build from scratch', () => {
      it('should build a FinalizeUnwrapERC7984 transaction', async () => {
        txBuilder.type(TransactionType.FinalizeUnwrapERC7984);
        txBuilder.contract(WRAPPER_ADDRESS);
        txBuilder.finalizeUnwrapRequestId(REQUEST_ID);
        txBuilder.finalizeUnwrapCleartextAmount(CLEARTEXT_AMOUNT);
        txBuilder.finalizeUnwrapDecryptionProof(DECRYPTION_PROOF);

        const tx = await txBuilder.build();
        const json = tx.toJson();

        should.equal(tx.type, TransactionType.FinalizeUnwrapERC7984);
        json.to.toLowerCase().should.equal(WRAPPER_ADDRESS.toLowerCase());
        json.data.should.startWith(finalizeUnwrapMethodId);
        json.value.should.equal('0');

        const decoded = decodeFinalizeUnwrapCalldata(json.data);
        decoded.requestId.should.equal(REQUEST_ID);
        decoded.cleartextAmount.should.equal(CLEARTEXT_AMOUNT);
        decoded.decryptionProof.should.equal(DECRYPTION_PROOF);
      });

      it('should build with EIP-1559 fee model', async () => {
        const builder = getBuilder(coinName);
        builder.fee({
          fee: '30000000000',
          eip1559: {
            maxFeePerGas: '30000000000',
            maxPriorityFeePerGas: '1000000000',
          },
          gasLimit: '200000',
        });
        builder.counter(1);
        builder.type(TransactionType.FinalizeUnwrapERC7984);
        builder.contract(WRAPPER_ADDRESS);
        builder.finalizeUnwrapRequestId(REQUEST_ID);
        builder.finalizeUnwrapCleartextAmount(CLEARTEXT_AMOUNT);
        builder.finalizeUnwrapDecryptionProof(DECRYPTION_PROOF);

        const tx = await builder.build();
        const json = tx.toJson();

        should.equal(tx.type, TransactionType.FinalizeUnwrapERC7984);
        json._type.should.equal(ETHTransactionType.EIP1559);
        json.data.should.startWith(finalizeUnwrapMethodId);
      });
    });

    describe('signing and round-trip', () => {
      it('should produce a signed transaction with v, r, s and from fields', async () => {
        txBuilder.type(TransactionType.FinalizeUnwrapERC7984);
        txBuilder.contract(WRAPPER_ADDRESS);
        txBuilder.finalizeUnwrapRequestId(REQUEST_ID);
        txBuilder.finalizeUnwrapCleartextAmount(CLEARTEXT_AMOUNT);
        txBuilder.finalizeUnwrapDecryptionProof(DECRYPTION_PROOF);
        txBuilder.sign({ key: TEST_PRV_KEY });

        const tx = await txBuilder.build();
        const json = tx.toJson();

        should.exist(json.v);
        should.exist(json.r);
        should.exist(json.s);
        should.exist(json.from);
        should.equal(tx.type, TransactionType.FinalizeUnwrapERC7984);
      });

      it('should serialize and deserialize to the same transaction', async () => {
        txBuilder.type(TransactionType.FinalizeUnwrapERC7984);
        txBuilder.contract(WRAPPER_ADDRESS);
        txBuilder.finalizeUnwrapRequestId(REQUEST_ID);
        txBuilder.finalizeUnwrapCleartextAmount(CLEARTEXT_AMOUNT);
        txBuilder.finalizeUnwrapDecryptionProof(DECRYPTION_PROOF);

        const originalTx = await txBuilder.build();
        const rawHex = originalTx.toBroadcastFormat();

        const rebuiltBuilder = getBuilder(coinName);
        rebuiltBuilder.from(rawHex);
        const rebuiltTx = await rebuiltBuilder.build();

        rebuiltTx.toBroadcastFormat().should.equal(rawHex);
        should.equal(rebuiltTx.type, TransactionType.FinalizeUnwrapERC7984);
      });
    });

    describe('validation', () => {
      it('should reject missing finalizeUnwrapRequestId', async () => {
        txBuilder.type(TransactionType.FinalizeUnwrapERC7984);
        txBuilder.contract(WRAPPER_ADDRESS);
        txBuilder.finalizeUnwrapCleartextAmount(CLEARTEXT_AMOUNT);
        txBuilder.finalizeUnwrapDecryptionProof(DECRYPTION_PROOF);
        await txBuilder.build().should.be.rejectedWith(/missing finalizeUnwrapRequestId/);
      });

      it('should reject missing finalizeUnwrapCleartextAmount', async () => {
        txBuilder.type(TransactionType.FinalizeUnwrapERC7984);
        txBuilder.contract(WRAPPER_ADDRESS);
        txBuilder.finalizeUnwrapRequestId(REQUEST_ID);
        txBuilder.finalizeUnwrapDecryptionProof(DECRYPTION_PROOF);
        await txBuilder.build().should.be.rejectedWith(/missing finalizeUnwrapCleartextAmount/);
      });
    });
  });
}
