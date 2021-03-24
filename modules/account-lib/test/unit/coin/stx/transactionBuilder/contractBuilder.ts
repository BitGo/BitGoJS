import should from 'should';
import { StacksTestnet } from '@stacks/network';
import { register } from '../../../../../src/index';
import { TransactionBuilderFactory } from '../../../../../src/coin/stx';
import * as testData from '../../../../resources/stx/stx';
import { TransactionType } from '../../../../../src/coin/baseCoin';
import BigNumber from 'bignumber.js';

describe('Stx Contract call Builder', () => {
  const factory = register('stx', TransactionBuilderFactory);

  const initTxBuilder = () => {
    const txBuilder = factory.getContractBuilder();
    txBuilder.fee({ fee: '180' });
    txBuilder.nonce(0);
    txBuilder.contractAddress(testData.CONTRACT_ADDRESS);
    txBuilder.contractName(testData.CONTRACT_NAME);
    txBuilder.functionName(testData.CONTRACT_FUNCTION_NAME);
    txBuilder.functionArgs([{ type: "int128", value: "123" }])
    return txBuilder;
  };

  describe('should build ', () => {
    it('a signed contract call transaction', async () => {
      const builder = initTxBuilder();
      builder.sign({ key: testData.TX_SENDER.prv });
      const tx = await builder.build();

      const txJson = tx.toJson();
      should.deepEqual(txJson.payload.contractAddress, testData.CONTRACT_ADDRESS);
      should.deepEqual(txJson.payload.contractName, testData.CONTRACT_NAME);
      should.deepEqual(txJson.payload.functionName, testData.CONTRACT_FUNCTION_NAME);
      should.deepEqual(txJson.nonce, 0);
      should.deepEqual(txJson.fee.toString(), '180');
      should.deepEqual(tx.toBroadcastFormat(), testData.SIGNED_CONTRACT_CALL);
      tx.type.should.equal(TransactionType.ContractCall);
    });


    it('a multisig transfer transaction', async () => {
      const builder = initTxBuilder();
      builder.network(new StacksTestnet());
      builder.numberSignatures(2);
      builder.sign({ key: testData.prv1 });
      builder.sign({ key: testData.prv2 });
      builder.sign({ key: testData.prv3 });
      const tx = await builder.build();
      should.deepEqual(tx.toBroadcastFormat(), testData.MULTI_SIG_CONTRACT_CALL);
    });


    describe('should fail', () => {
      it('a transfer transaction with an invalid key', () => {
        const builder = initTxBuilder();
        should.throws(
          () => builder.sign({ key: 'invalidKey' }),
          e => e.message === 'Unsupported private key',
        );
      });
    });
  });
});
