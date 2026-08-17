/**
 * TransactionBuilder tests for UnwrapERC7984 transaction type.
 */
import { TransactionType } from '@bitgo/sdk-core';
import should from 'should';
import { ETHTransactionType, TransactionBuilder } from '../../../src';
import { buildUnwrapCalldata, decodeUnwrapCalldata, unwrapMethodId } from '../../../src/lib/zamaUtils';
import { classifyTransaction } from '../../../src/lib/utils';

const WRAPPER_ADDRESS = '0x2debbe0487ef921df4457f9e36ed05be2df1ac75'; // hteth:cusdt
const BASE_ADDRESS = '0x1111111111111111111111111111111111111111';
const ENCRYPTED_AMOUNT = '0x' + 'ab'.repeat(32);
const INPUT_PROOF = '0x' + 'cd'.repeat(64);
const TEST_PRV_KEY = 'FAC4D04AA0025ECF200D74BC9B5E4616E4B8338B69B61362AAAD49F76E68EF28';

export function runUnwrapERC7984Tests(coinName: string, getBuilder: (coin: string) => TransactionBuilder): void {
  describe(`${coinName} transaction builder — UnwrapERC7984`, () => {
    let txBuilder: TransactionBuilder;

    beforeEach(() => {
      txBuilder = getBuilder(coinName);
      txBuilder.fee({ fee: '1000000000', gasLimit: '200000' });
      txBuilder.counter(1);
    });

    describe('classifyTransaction', () => {
      it('should classify unwrap(...) as UnwrapERC7984', () => {
        const calldata = buildUnwrapCalldata(BASE_ADDRESS, BASE_ADDRESS, ENCRYPTED_AMOUNT, INPUT_PROOF);
        should.equal(classifyTransaction(calldata), TransactionType.UnwrapERC7984);
      });

      it('should NOT classify approve as UnwrapERC7984', () => {
        should.equal(classifyTransaction('0x095ea7b3' + '00'.repeat(64)), TransactionType.ContractCall);
      });
    });

    describe('build from scratch', () => {
      it('should build an UnwrapERC7984 transaction', async () => {
        txBuilder.type(TransactionType.UnwrapERC7984);
        txBuilder.contract(WRAPPER_ADDRESS);
        txBuilder.unwrapFrom(BASE_ADDRESS);
        txBuilder.unwrapTo(BASE_ADDRESS);
        txBuilder.unwrapEncryptedAmount(ENCRYPTED_AMOUNT);
        txBuilder.unwrapInputProof(INPUT_PROOF);

        const tx = await txBuilder.build();
        const json = tx.toJson();

        should.equal(tx.type, TransactionType.UnwrapERC7984);
        json.to.toLowerCase().should.equal(WRAPPER_ADDRESS.toLowerCase());
        json.data.should.startWith(unwrapMethodId);
        json.value.should.equal('0');

        const decoded = decodeUnwrapCalldata(json.data);
        decoded.from.toLowerCase().should.equal(BASE_ADDRESS.toLowerCase());
        decoded.to.toLowerCase().should.equal(BASE_ADDRESS.toLowerCase());
        decoded.encryptedAmount.should.equal(ENCRYPTED_AMOUNT);
        decoded.inputProof.should.equal(INPUT_PROOF);
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
        builder.type(TransactionType.UnwrapERC7984);
        builder.contract(WRAPPER_ADDRESS);
        builder.unwrapFrom(BASE_ADDRESS);
        builder.unwrapTo(BASE_ADDRESS);
        builder.unwrapEncryptedAmount(ENCRYPTED_AMOUNT);
        builder.unwrapInputProof(INPUT_PROOF);

        const tx = await builder.build();
        const json = tx.toJson();

        should.equal(tx.type, TransactionType.UnwrapERC7984);
        json._type.should.equal(ETHTransactionType.EIP1559);
        json.data.should.startWith(unwrapMethodId);
      });
    });

    describe('signing and round-trip', () => {
      it('should produce a signed transaction with v, r, s and from fields', async () => {
        txBuilder.type(TransactionType.UnwrapERC7984);
        txBuilder.contract(WRAPPER_ADDRESS);
        txBuilder.unwrapFrom(BASE_ADDRESS);
        txBuilder.unwrapTo(BASE_ADDRESS);
        txBuilder.unwrapEncryptedAmount(ENCRYPTED_AMOUNT);
        txBuilder.unwrapInputProof(INPUT_PROOF);
        txBuilder.sign({ key: TEST_PRV_KEY });

        const tx = await txBuilder.build();
        const json = tx.toJson();

        should.exist(json.v);
        should.exist(json.r);
        should.exist(json.s);
        should.exist(json.from);
        should.equal(tx.type, TransactionType.UnwrapERC7984);
      });

      it('should serialize and deserialize to the same transaction', async () => {
        txBuilder.type(TransactionType.UnwrapERC7984);
        txBuilder.contract(WRAPPER_ADDRESS);
        txBuilder.unwrapFrom(BASE_ADDRESS);
        txBuilder.unwrapTo(BASE_ADDRESS);
        txBuilder.unwrapEncryptedAmount(ENCRYPTED_AMOUNT);
        txBuilder.unwrapInputProof(INPUT_PROOF);

        const originalTx = await txBuilder.build();
        const rawHex = originalTx.toBroadcastFormat();

        const rebuiltBuilder = getBuilder(coinName);
        rebuiltBuilder.from(rawHex);
        const rebuiltTx = await rebuiltBuilder.build();

        rebuiltTx.toBroadcastFormat().should.equal(rawHex);
        should.equal(rebuiltTx.type, TransactionType.UnwrapERC7984);
      });
    });

    describe('validation', () => {
      it('should reject missing unwrapFrom', async () => {
        txBuilder.type(TransactionType.UnwrapERC7984);
        txBuilder.contract(WRAPPER_ADDRESS);
        txBuilder.unwrapTo(BASE_ADDRESS);
        txBuilder.unwrapEncryptedAmount(ENCRYPTED_AMOUNT);
        txBuilder.unwrapInputProof(INPUT_PROOF);
        await txBuilder.build().should.be.rejectedWith(/missing unwrapFrom/);
      });

      it('should reject missing unwrapEncryptedAmount', async () => {
        txBuilder.type(TransactionType.UnwrapERC7984);
        txBuilder.contract(WRAPPER_ADDRESS);
        txBuilder.unwrapFrom(BASE_ADDRESS);
        txBuilder.unwrapTo(BASE_ADDRESS);
        txBuilder.unwrapInputProof(INPUT_PROOF);
        await txBuilder.build().should.be.rejectedWith(/missing unwrapEncryptedAmount/);
      });
    });
  });
}
