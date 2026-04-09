import assert from 'assert';
import should from 'should';
import BigNum from 'bn.js';
import { StacksTestnet, StacksMainnet } from '@stacks/network';
import { TransactionType } from '@bitgo/sdk-core';
import { bufferCV, noneCV, someCV, standardPrincipalCV, tupleCV, uintCV, intCV } from '@stacks/transactions';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';
import { coins } from '@bitgo/statics';

import { Stx, Tstx, StxLib } from '../../../src';
import * as testData from '../resources';

const { stringifyCv } = StxLib.Utils;

describe('Stacks: Contract Builder', function () {
  const coinName = 'stx';
  const coinNameTest = 'tstx';
  let bitgo: TestBitGoAPI;

  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, {
      env: 'mock',
    });
    bitgo.initializeTestVars();
    bitgo.safeRegister('stx', Stx.createInstance);
    bitgo.safeRegister('tstx', Tstx.createInstance);
  });

  describe('Stx Contract call Builder', () => {
    const factory = new StxLib.TransactionBuilderFactory(coins.get(coinNameTest));
    const factoryProd = new StxLib.TransactionBuilderFactory(coins.get(coinName));

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

      it('an unsigned self stacking contract call transaction', async () => {
        const builder = initTxBuilder();
        /* Contract call in clarity POX-4
        (define-public (stack-stx (amount-ustx uint)
                          (pox-addr (tuple (version (buff 1)) (hashbytes (buff 32))))
                          (start-burn-ht uint)
                          (lock-period uint)
                          (signer-sig (optional (buff 65)))
                          (signer-key (buff 33))
                          (max-amount uint)
                          (auth-id uint))
         */
        builder.functionArgs([
          { type: 'uint128', val: '400000000' },
          {
            type: 'tuple',
            val: [
              { key: 'hashbytes', type: 'buffer', val: Buffer.from('some-hash') },
              { key: 'version', type: 'buffer', val: new BigNum(1).toBuffer() },
            ],
          },
          { type: 'uint128', val: '52800' },
          { type: 'uint128', val: '2' },
          // Nakamoto upgrade new 4 parameters
          // https://docs.stacks.co/nakamoto-upgrade/signing-and-stacking/stacking-flow#solo-stacker-flow
          { type: 'optional', val: { type: 'buffer', val: Buffer.from('some-hash') } },
          { type: 'buffer', val: Buffer.from('some-hash') },
          { type: 'uint128', val: '340282366920938463463374607431768211455' },
          { type: 'uint128', val: '123456' },
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
        should.deepEqual(tx.toBroadcastFormat(), testData.UNSIGNED_SELF_STACK_CONTRACT_CALL);

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

      it('a signed self stacking contract call', async () => {
        const builder = initTxBuilder();
        /* Contract call in clarity POX-4
        (define-public (stack-stx (amount-ustx uint)
                          (pox-addr (tuple (version (buff 1)) (hashbytes (buff 32))))
                          (start-burn-ht uint)
                          (lock-period uint)
                          (signer-sig (optional (buff 65)))
                          (signer-key (buff 33))
                          (max-amount uint)
                          (auth-id uint))
         */
        builder.functionArgs([
          { type: 'uint128', val: '400000000' },
          {
            type: 'tuple',
            val: [
              { key: 'hashbytes', type: 'buffer', val: Buffer.from('some-hash') },
              { key: 'version', type: 'buffer', val: new BigNum(1).toBuffer() },
            ],
          },
          { type: 'uint128', val: '52800' },
          { type: 'uint128', val: '2' },
          // Nakamoto upgrade new 4 parameters
          // https://docs.stacks.co/nakamoto-upgrade/signing-and-stacking/stacking-flow#solo-stacker-flow
          { type: 'optional', val: { type: 'buffer', val: Buffer.from('some-hash') } },
          { type: 'buffer', val: Buffer.from('some-hash') },
          { type: 'uint128', val: '340282366920938463463374607431768211455' },
          { type: 'uint128', val: '123456' },
        ]);
        builder.sign({ key: testData.TX_SENDER.prv });
        const tx = await builder.build();

        const txJson = tx.toJson();
        should.deepEqual(txJson.payload.contractAddress, testData.CONTRACT_ADDRESS);
        should.deepEqual(txJson.payload.contractName, testData.CONTRACT_NAME);
        should.deepEqual(txJson.payload.functionName, testData.CONTRACT_FUNCTION_NAME);
        should.deepEqual(txJson.nonce, 0);
        should.deepEqual(txJson.fee.toString(), '180');
        should.deepEqual(tx.toBroadcastFormat(), testData.SIGNED_SELF_STACK_CONTRACT_CALL);

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

      it('a signed serialized self stacking contract call transaction', async () => {
        const builder = factory.from(testData.SIGNED_SELF_STACK_CONTRACT_CALL);
        const tx = await builder.build();
        const txJson = tx.toJson();
        should.deepEqual(txJson.payload.contractAddress, testData.CONTRACT_ADDRESS);
        should.deepEqual(txJson.payload.contractName, testData.CONTRACT_NAME);
        should.deepEqual(txJson.payload.functionName, testData.CONTRACT_FUNCTION_NAME);
        should.deepEqual(txJson.nonce, 0);
        should.deepEqual(txJson.fee.toString(), '180');
        // Now stacks-stx self-stacking supports 8 parameters
        // https://docs.stacks.co/nakamoto-upgrade/signing-and-stacking/stacking-flow#solo-stacker-flow
        should.deepEqual(txJson.payload.functionArgs.length, 8);
        should.deepEqual(tx.toBroadcastFormat(), testData.SIGNED_SELF_STACK_CONTRACT_CALL);
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
              })
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
              })
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
              })
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
            new RegExp('Unexpected Clarity ABI type primitive: "unknow"')
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
        it('a contract call with an invalid contract name pox-2', () => {
          const builder = initTxBuilder();
          assert.throws(() => builder.contractName('pox-2'), /Only pox-4 and send-many-memo contracts supported/);
        });
        it('a contract call with an invalid contract name pox-3', () => {
          const builder = initTxBuilder();
          assert.throws(() => builder.contractName('pox-3'), /Only pox-4 and send-many-memo contracts supported/);
        });
        it('a contract call with an invalid contract function name', () => {
          const builder = initTxBuilder();
          assert.throws(
            () => builder.functionName('test-function'),
            new RegExp('test-function is not supported contract function name')
          );
        });
      });
    });
  });
});
