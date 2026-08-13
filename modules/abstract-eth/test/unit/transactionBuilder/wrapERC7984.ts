/**
 * TransactionBuilder tests for WrapERC7984 transaction type.
 *
 * Verifies:
 *   - Building a WrapERC7984 tx from scratch (legacy and EIP-1559 fees)
 *   - Signing and serialization round-trip
 *   - classifyTransaction correctly identifies wrap(address,uint256)
 *   - Error cases for missing fields / invalid amount
 */
import { TransactionType } from '@bitgo/sdk-core';
import should from 'should';
import { ETHTransactionType, TransactionBuilder } from '../../../src';
import { buildWrapCalldata, decodeWrapCalldata, wrapMethodId } from '../../../src/lib/zamaUtils';
import { classifyTransaction } from '../../../src/lib/utils';

const WRAPPER_ADDRESS = '0x2debbe0487ef921df4457f9e36ed05be2df1ac75'; // hteth:cusdt
const RECIPIENT = '0x1111111111111111111111111111111111111111';
const AMOUNT = '1000000';
const RATE = '1';
const TEST_PRV_KEY = 'FAC4D04AA0025ECF200D74BC9B5E4616E4B8338B69B61362AAAD49F76E68EF28';

export function runWrapERC7984Tests(coinName: string, getBuilder: (coin: string) => TransactionBuilder): void {
  describe(`${coinName} transaction builder — WrapERC7984`, () => {
    let txBuilder: TransactionBuilder;

    beforeEach(() => {
      txBuilder = getBuilder(coinName);
      txBuilder.fee({ fee: '1000000000', gasLimit: '200000' });
      txBuilder.counter(1);
    });

    describe('classifyTransaction', () => {
      it('should classify wrap(address,uint256) as WrapERC7984', () => {
        const calldata = buildWrapCalldata(RECIPIENT, AMOUNT, RATE);
        should.equal(classifyTransaction(calldata), TransactionType.WrapERC7984);
      });

      it('should NOT classify approve as WrapERC7984', () => {
        should.equal(classifyTransaction('0x095ea7b3' + '00'.repeat(64)), TransactionType.ContractCall);
      });
    });

    describe('build from scratch', () => {
      it('should build a WrapERC7984 transaction', async () => {
        txBuilder.type(TransactionType.WrapERC7984);
        txBuilder.contract(WRAPPER_ADDRESS);
        txBuilder.wrapRecipient(RECIPIENT);
        txBuilder.wrapAmount(AMOUNT);
        txBuilder.wrapRate(RATE);

        const tx = await txBuilder.build();
        const json = tx.toJson();

        should.equal(tx.type, TransactionType.WrapERC7984);
        json.to.toLowerCase().should.equal(WRAPPER_ADDRESS.toLowerCase());
        json.data.should.startWith(wrapMethodId);
        json.value.should.equal('0');

        const decoded = decodeWrapCalldata(json.data);
        decoded.to.toLowerCase().should.equal(RECIPIENT.toLowerCase());
        decoded.amount.should.equal(AMOUNT);
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
        builder.type(TransactionType.WrapERC7984);
        builder.contract(WRAPPER_ADDRESS);
        builder.wrapRecipient(RECIPIENT);
        builder.wrapAmount(AMOUNT);
        builder.wrapRate(RATE);

        const tx = await builder.build();
        const json = tx.toJson();

        should.equal(tx.type, TransactionType.WrapERC7984);
        json._type.should.equal(ETHTransactionType.EIP1559);
        json.data.should.startWith(wrapMethodId);
      });
    });

    describe('signing and round-trip', () => {
      it('should produce a signed transaction with v, r, s and from fields', async () => {
        txBuilder.type(TransactionType.WrapERC7984);
        txBuilder.contract(WRAPPER_ADDRESS);
        txBuilder.wrapRecipient(RECIPIENT);
        txBuilder.wrapAmount(AMOUNT);
        txBuilder.wrapRate(RATE);
        txBuilder.sign({ key: TEST_PRV_KEY });

        const tx = await txBuilder.build();
        const json = tx.toJson();

        should.exist(json.v);
        should.exist(json.r);
        should.exist(json.s);
        should.exist(json.from);
        should.equal(tx.type, TransactionType.WrapERC7984);
      });

      it('should serialize and deserialize to the same transaction', async () => {
        txBuilder.type(TransactionType.WrapERC7984);
        txBuilder.contract(WRAPPER_ADDRESS);
        txBuilder.wrapRecipient(RECIPIENT);
        txBuilder.wrapAmount(AMOUNT);
        txBuilder.wrapRate(RATE);

        const originalTx = await txBuilder.build();
        const rawHex = originalTx.toBroadcastFormat();

        const rebuiltBuilder = getBuilder(coinName);
        rebuiltBuilder.from(rawHex);
        const rebuiltTx = await rebuiltBuilder.build();

        rebuiltTx.toBroadcastFormat().should.equal(rawHex);
        should.equal(rebuiltTx.type, TransactionType.WrapERC7984);
      });
    });

    describe('validation', () => {
      it('should reject missing wrapRecipient', async () => {
        txBuilder.type(TransactionType.WrapERC7984);
        txBuilder.contract(WRAPPER_ADDRESS);
        txBuilder.wrapAmount(AMOUNT);
        txBuilder.wrapRate(RATE);
        await txBuilder.build().should.be.rejectedWith(/missing wrapRecipient/);
      });

      it('should reject missing wrapAmount', async () => {
        txBuilder.type(TransactionType.WrapERC7984);
        txBuilder.contract(WRAPPER_ADDRESS);
        txBuilder.wrapRecipient(RECIPIENT);
        txBuilder.wrapRate(RATE);
        await txBuilder.build().should.be.rejectedWith(/missing wrapAmount/);
      });

      it('should reject amount 0 via buildWrapCalldata', async () => {
        txBuilder.type(TransactionType.WrapERC7984);
        txBuilder.contract(WRAPPER_ADDRESS);
        txBuilder.wrapRecipient(RECIPIENT);
        txBuilder.wrapAmount('0');
        txBuilder.wrapRate(RATE);
        await txBuilder.build().should.be.rejectedWith(/amount must be > 0/);
      });
    });
  });
}
