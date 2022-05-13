import assert from 'assert';
import should from 'should';
import BigNum from 'bn.js';
import { StacksTestnet, StacksMainnet } from '@stacks/network';
import { register } from '../../../../../src/index';
import { TransactionBuilderFactory } from '../../../../../src/coin/stx';
import * as testData from '../../../../resources/stx/stx';
import { TransactionType } from '../../../../../src/coin/baseCoin';
import { bufferCV, noneCV, someCV, standardPrincipalCV, tupleCV, uintCV, intCV } from '@stacks/transactions';
import { stringifyCv } from '../../../../../src/coin/stx/utils';

describe('Stx Contract call Builder', () => {
  const factory = register('tstx', TransactionBuilderFactory);
  const factoryProd = register('stx', TransactionBuilderFactory);

  const initTxBuilder = () => {
    const txBuilder = factory.getContractBuilder();
    txBuilder.fee({ fee: '180' });
    txBuilder.nonce(0);
    txBuilder.contractAddress(testData.CONTRACT_ADDRESS);
    txBuilder.contractName(testData.CONTRACT_NAME);
    txBuilder.functionName(testData.CONTRACT_FUNCTION_NAME);
    return txBuilder;
  };

  describe('contract builder environment', function () {
    it('should select the right network', function () {
      should.equal(factory.getTransferBuilder().coinName(), 'tstx');
      should.equal(factoryProd.getTransferBuilder().coinName(), 'stx');
      // used type any to access protected properties
      const txBuilder: any = factory.getTransferBuilder();
      const txBuilderProd: any = factoryProd.getTransferBuilder();

      txBuilder._network.should.deepEqual(new StacksTestnet());
      txBuilderProd._network.should.deepEqual(new StacksMainnet());
    });
  });

  describe('should build ', () => {
    it('an unsigned contract call transaction', async () => {
      const builder = initTxBuilder();
      builder.functionArgs([
        { type: 'uint128', val: '400000000' },
        { type: 'principal', val: testData.ACCOUNT_2.address },
        { type: 'optional', val: { type: 'uint128', val: '200' } },
        {
          type: 'optional',
          val: {
            type: 'tuple',
            val: [
              { key: 'hashbytes', type: 'buffer', val: Buffer.from('some-hash') },
              { key: 'version', type: 'buffer', val: new BigNum(1).toBuffer() },
            ],
          },
        },
      ]);
      builder.fromPubKey(testData.TX_SENDER.pub);
      builder.numberSignatures(1);
      const tx = await builder.build();

      const txJson = tx.toJson();
      should.deepEqual(txJson.payload.contractAddress, testData.CONTRACT_ADDRESS);
      should.deepEqual(txJson.payload.contractName, testData.CONTRACT_NAME);
      should.deepEqual(txJson.payload.functionName, testData.CONTRACT_FUNCTION_NAME);
      should.deepEqual(txJson.nonce, 0);
      should.deepEqual(txJson.fee.toString(), '180');
      should.deepEqual(tx.toBroadcastFormat(), testData.UNSIGNED_CONTRACT_CALL);

      tx.type.should.equal(TransactionType.ContractCall);
      tx.outputs.length.should.equal(1);
      tx.outputs[0].address.should.equal(testData.CONTRACT_ADDRESS);
      tx.outputs[0].value.should.equal('0');
      tx.inputs.length.should.equal(1);
      tx.inputs[0].address.should.equal(testData.TX_SENDER.address);
      tx.inputs[0].value.should.equal('0');
    });

    it('a signed contract call with args', async () => {
      const builder = initTxBuilder();
      builder.functionArgs([
        { type: 'uint128', val: '400000000' },
        { type: 'principal', val: testData.ACCOUNT_2.address },
        { type: 'optional' },
        {
          type: 'optional',
          val: {
            type: 'tuple',
            val: [
              { key: 'hashbytes', type: 'buffer', val: Buffer.from('some-hash') },
              { key: 'version', type: 'buffer', val: new BigNum(1).toBuffer() },
            ],
          },
        },
      ]);
      builder.sign({ key: testData.TX_SENDER.prv });
      const tx = await builder.build();

      const txJson = tx.toJson();
      should.deepEqual(txJson.payload.contractAddress, testData.CONTRACT_ADDRESS);
      should.deepEqual(txJson.payload.contractName, testData.CONTRACT_NAME);
      should.deepEqual(txJson.payload.functionName, testData.CONTRACT_FUNCTION_NAME);
      should.deepEqual(txJson.nonce, 0);
      should.deepEqual(txJson.fee.toString(), '180');
      should.deepEqual(tx.toBroadcastFormat(), testData.SIGNED_CONTRACT_WITH_ARGS);

      tx.type.should.equal(TransactionType.ContractCall);
      tx.outputs.length.should.equal(1);
      tx.outputs[0].address.should.equal(testData.CONTRACT_ADDRESS);
      tx.outputs[0].value.should.equal('0');
      tx.inputs.length.should.equal(1);
      tx.inputs[0].address.should.equal(testData.TX_SENDER.address);
      tx.inputs[0].value.should.equal('0');
    });

    it('a signed contract call transaction', async () => {
      const amount = 123;
      const builder = initTxBuilder();
      builder.functionArgs([{ type: 'optional', val: { type: 'int128', val: amount } }]);
      builder.sign({ key: testData.TX_SENDER.prv });
      const tx = await builder.build();

      const txJson = tx.toJson();
      should.deepEqual(txJson.payload.contractAddress, testData.CONTRACT_ADDRESS);
      should.deepEqual(txJson.payload.contractName, testData.CONTRACT_NAME);
      should.deepEqual(txJson.payload.functionName, testData.CONTRACT_FUNCTION_NAME);
      should.deepEqual(txJson.nonce, 0);
      should.deepEqual(txJson.fee.toString(), '180');
      should.deepEqual(txJson.payload.functionArgs, [stringifyCv(someCV(intCV(amount)))]);
      should.deepEqual(tx.toBroadcastFormat(), testData.SIGNED_CONTRACT_CALL);
      tx.type.should.equal(TransactionType.ContractCall);
    });

    it('a signed serialized contract call transaction', async () => {
      const builder = factory.from(testData.SIGNED_CONTRACT_CALL);
      const tx = await builder.build();
      const txJson = tx.toJson();
      should.deepEqual(txJson.payload.contractAddress, testData.CONTRACT_ADDRESS);
      should.deepEqual(txJson.payload.contractName, testData.CONTRACT_NAME);
      should.deepEqual(txJson.payload.functionName, testData.CONTRACT_FUNCTION_NAME);
      should.deepEqual(txJson.nonce, 0);
      should.deepEqual(txJson.fee.toString(), '180');
      should.deepEqual(txJson.payload.functionArgs, [stringifyCv(someCV(intCV(123)))]);
      should.deepEqual(tx.toBroadcastFormat(), testData.SIGNED_CONTRACT_CALL);
      tx.type.should.equal(TransactionType.ContractCall);
      tx.outputs.length.should.equal(1);
      tx.outputs[0].address.should.equal(testData.CONTRACT_ADDRESS);
      tx.outputs[0].value.should.equal('0');
      tx.inputs.length.should.equal(1);
      tx.inputs[0].address.should.equal(testData.TX_SENDER.address);
      tx.inputs[0].value.should.equal('0');
    });

    it('a multisig transfer transaction', async () => {
      const builder = initTxBuilder();
      builder.functionArgs([{ type: 'optional', val: { type: 'int128', val: '123' } }]);

      builder.sign({ key: testData.prv1 });
      builder.sign({ key: testData.prv2 });
      builder.fromPubKey([testData.pub1, testData.pub2, testData.pub3]);
      builder.numberSignatures(2);
      const tx = await builder.build();
      JSON.stringify(tx.toJson());
      should.deepEqual(tx.toBroadcastFormat(), testData.MULTI_SIG_CONTRACT_CALL);
    });

    describe('ParseCV test', () => {
      it('Optional with out value', () => {
        const amount = '400000000';
        const builder = initTxBuilder();
        builder.functionArgs([
          { type: 'uint128', val: amount },
          { type: 'principal', val: testData.ACCOUNT_2.address },
          { type: 'optional' },
          {
            type: 'optional',
            val: {
              type: 'tuple',
              val: [
                { key: 'hashbytes', type: 'buffer', val: Buffer.from('some-hash') },
                { key: 'version', type: 'buffer', val: new BigNum(1).toBuffer() },
              ],
            },
          },
        ]);
        should.deepEqual((builder as any)._functionArgs, [
          uintCV(amount),
          standardPrincipalCV(testData.ACCOUNT_2.address),
          noneCV(),
          someCV(
            tupleCV({
              hashbytes: bufferCV(Buffer.from('some-hash')),
              version: bufferCV(new BigNum(1).toBuffer()),
            }),
          ),
        ]);
      });

      it('use ClarityValue', () => {
        const amount = '400000000';
        const builder = initTxBuilder();
        builder.functionArgs([
          uintCV(amount),
          standardPrincipalCV(testData.ACCOUNT_2.address),
          noneCV(),
          someCV(
            tupleCV({
              hashbytes: bufferCV(Buffer.from('some-hash')),
              version: bufferCV(new BigNum(1).toBuffer()),
            }),
          ),
        ]);
        should.deepEqual((builder as any)._functionArgs, [
          uintCV(amount),
          standardPrincipalCV(testData.ACCOUNT_2.address),
          noneCV(),
          someCV(
            tupleCV({
              hashbytes: bufferCV(Buffer.from('some-hash')),
              version: bufferCV(new BigNum(1).toBuffer()),
            }),
          ),
        ]);
      });

      it('Buffer as string', () => {
        const builder = initTxBuilder();
        builder.functionArgs([
          { type: 'buffer', val: 'some-hash' },
          { type: 'buffer', val: '1' },
        ]);
        should.deepEqual((builder as any)._functionArgs, [
          bufferCV(Buffer.from('some-hash')),
          bufferCV(new BigNum(1).toBuffer()),
        ]);
      });

      it('Buffer as number', () => {
        const builder = initTxBuilder();
        builder.functionArgs([
          { type: 'buffer', val: '1' },
          { type: 'buffer', val: 1 },
        ]);
        should.deepEqual((builder as any)._functionArgs, [
          bufferCV(new BigNum(1).toBuffer()),
          bufferCV(new BigNum(1).toBuffer()),
        ]);
      });

      it('invalid type', () => {
        const builder = initTxBuilder();

        assert.throws(
          () => builder.functionArgs([{ type: 'unknow', val: 'any-val' }]),
          new RegExp('Unexpected Clarity ABI type primitive: "unknow"'),
        );
      });
    });

    describe('should fail', () => {
      it('a contract call with an invalid key', () => {
        const builder = initTxBuilder();
        assert.throws(() => builder.sign({ key: 'invalidKey' }), /Unsupported private key/);
      });
      it('a contract call with an invalid contract address', () => {
        const builder = initTxBuilder();
        assert.throws(() => builder.contractAddress(testData.ACCOUNT_1.address), /Invalid contract address/);
      });
      it('a contract call with an invalid contract name', () => {
        const builder = initTxBuilder();
        assert.throws(() => builder.contractName('test'), /Only pox and send-many-memo contracts supported/);
      });
      it('a contract call with an invalid contract function name', () => {
        const builder = initTxBuilder();
        assert.throws(
          () => builder.functionName('test-function'),
          new RegExp('test-function is not supported contract function name'),
        );
      });
    });
  });
});
