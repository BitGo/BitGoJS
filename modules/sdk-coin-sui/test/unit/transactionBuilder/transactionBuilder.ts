import { getBuilderFactory } from '../getBuilderFactory';
import * as testData from '../../resources/sui';
import should from 'should';
import { TransactionType } from '@bitgo/sdk-core';
import { SuiTransactionType } from '../../../src/lib/iface';
import { CUSTOM_TX_STAKING_POOL_SPLIT, recipients, STAKING_AMOUNT, UNSUPPORTED_TX } from '../../resources/sui';
import { KeyPair } from '../../../src/lib/keyPair';
import { GasData } from '../../../src/lib/mystenlab/types';
import { StakingTransaction, TransferTransaction } from '../../../src';
import { UnstakingTransaction } from '../../../src/lib/unstakingTransaction';
import { AMOUNT_UNKNOWN_TEXT } from '../../../src/lib/constants';
import { CustomTransaction } from '../../../src/lib/customTransaction';

describe('Sui Transaction Builder', async () => {
  let builders;
  const factory = getBuilderFactory('tsui');

  describe('Transfer TX', async () => {
    beforeEach(function (done) {
      builders = [factory.getTransferBuilder()];
      done();
    });

    it('should build a transfer transaction and serialize it and deserialize it', async function () {
      const txBuilder = factory.getTransferBuilder();
      txBuilder.type(SuiTransactionType.Transfer);
      txBuilder.sender(testData.sender.address);
      txBuilder.send(recipients);
      txBuilder.gasData(testData.gasData);
      const tx = await txBuilder.build();
      should.equal(tx.type, TransactionType.Send);
      const rawTx = tx.toBroadcastFormat();
      should.equal(rawTx, testData.TRANSFER);
      const reserialized = await factory.from(rawTx).build();
      reserialized.should.be.deepEqual(tx);
      reserialized.toBroadcastFormat().should.equal(rawTx);
    });

    it('should build and sign a transfer tx with gasPayment', async function () {
      const txBuilder = factory.getTransferBuilder();
      txBuilder.type(SuiTransactionType.Transfer);
      txBuilder.sender(testData.sender.address);
      txBuilder.send(recipients);
      txBuilder.gasData(testData.gasData);
      const tx = await txBuilder.build();
      should.equal(tx.id, 'UNAVAILABLE');
      const rawTx = tx.toBroadcastFormat();
      should.equal(rawTx, testData.TRANSFER);

      const txBuilder2 = await factory.from(rawTx);
      await txBuilder2.addSignature({ pub: testData.sender.publicKey }, Buffer.from(testData.sender.signatureHex));
      const signedTx = await txBuilder2.build();
      should.equal(signedTx.type, TransactionType.Send);
      should.equal(signedTx.id, 'BxoeGXbBCuw6VFEcgwHHUAKrCoAsGanPB39kdVVKZZcR');

      const rawSignedTx = signedTx.toBroadcastFormat();
      should.equal(rawSignedTx, testData.TRANSFER);
      const reserializedTxBuilder = factory.from(rawSignedTx);
      reserializedTxBuilder.addSignature({ pub: testData.sender.publicKey }, Buffer.from(testData.sender.signatureHex));
      const reserialized = await reserializedTxBuilder.build();

      reserialized.should.be.deepEqual(signedTx);
      reserialized.toBroadcastFormat().should.equal(rawSignedTx);
    });

    it('should submit a transfer transaction with private keys', async () => {
      const keyPairSender = new KeyPair({ prv: testData.privateKeys.prvKey1 });
      const keyPairRecipient = new KeyPair({ prv: testData.privateKeys.prvKey2 });
      const senderAddress = keyPairSender.getAddress();
      const receiveAddress = keyPairRecipient.getAddress();
      const expectedTransferTxSig =
        'AI8Q9KINqSCOeHvhv6MJ6Vf3TWbTcxhpclg0PD9gBgand2kLQZxEJS/HJASganLKfZ277Il4mAifKHzvtb2fCA+lzaq1j4wMuCiXuFW4ojFfuoBhEiBy/K4eB5BkHZ+eZw==';
      const expectedTransferTxHex =
        'AAACAAgA4fUFAAAAAAAgtev+nncDfTtowJZEPHUMsJXia4wKmT/Xpgtrzsy6O38CAgABAQAAAQECAAABAQCQB0K7kj6pBqVvMloXWXdS7NOsMCa7qW4O3/Rd6NszqwJ3AbiIwWM5ms1bgEYzwdDlMrwxQ8/vNMo2C+YHxo3N72YEAAAAAAAAIDrMcEOTidjOdp7a1J/jjJ9tOjb6P2WTyBSwQqAHiA1/yfVla+cYIwE9k34GVOs+3LJhla/SMAm+mrlufz8twgNmBAAAAAAAACAhXnkXobS2E/RZ/cLDQ/n3BH/TxAjKv5VxsbLEZCUxu5AHQruSPqkGpW8yWhdZd1Ls06wwJrupbg7f9F3o2zOr6AMAAAAAAAAALTEBAAAAAAA=';

      const coins = [
        {
          digest: '4xXTGhhtNUjBU8nMivsLWTMRWvZRc5RWDMgyTMnnRDYS',
          objectId: '0x7701b888c163399acd5b804633c1d0e532bc3143cfef34ca360be607c68dcdef',
          version: 1126,
        },
        {
          digest: '3FG1Nfk5HrQ1tWYKS8BX9ynZTSprL5hLn3pgw7kdj1RU',
          objectId: '0xc9f5656be71823013d937e0654eb3edcb26195afd23009be9ab96e7f3f2dc203',
          version: 1126,
        },
      ];
      const txBuilder_1 = factory.getTransferBuilder();
      txBuilder_1.type(SuiTransactionType.Transfer);
      txBuilder_1.sender(senderAddress);
      txBuilder_1.send([{ address: receiveAddress, amount: '100000000' }]);
      const gasData: GasData = {
        payment: coins,
        owner: senderAddress,
        budget: testData.GAS_BUDGET,
        price: 1000,
      };
      txBuilder_1.gasData(gasData);

      const tx_1 = await txBuilder_1.build();
      const signable_1 = tx_1.signablePayload;
      const signature_1 = keyPairSender.signMessageinUint8Array(signable_1);
      txBuilder_1.addSignature({ pub: keyPairSender.getKeys().pub }, Buffer.from(signature_1));
      const signedTx_1 = (await txBuilder_1.build()) as TransferTransaction;
      const txHex_1 = signedTx_1.toBroadcastFormat();
      const sig_1 = Buffer.from(signedTx_1.serializedSig).toString('base64');

      const txBuilderFromRaw_2 = factory.getTransferBuilder();
      txBuilderFromRaw_2.from(txHex_1);
      const signable_2 = tx_1.signablePayload;
      txBuilderFromRaw_2.sign({ key: testData.privateKeys.prvKey1 });
      const signedTx_2 = (await txBuilderFromRaw_2.build()) as TransferTransaction;
      const txHex_2 = signedTx_2.toBroadcastFormat();
      const sig_2 = Buffer.from(signedTx_2.serializedSig).toString('base64');

      should.equal(Buffer.from(signable_1).toString('hex'), Buffer.from(signable_2).toString('hex'));
      should.equal(txHex_1, txHex_2);
      should.equal(txHex_1, expectedTransferTxHex);
      should.equal(txHex_2, expectedTransferTxHex);
      should.equal(sig_1, sig_2);
      should.equal(sig_1, expectedTransferTxSig);
      should.equal(sig_2, expectedTransferTxSig);
    });

    it('should submit a slit coin transaction with private keys', async () => {
      const keyPairSender = new KeyPair({ prv: testData.privateKeys.prvKey1 });
      const senderAddress = keyPairSender.getAddress();
      const expectedTransferTxSig =
        'AGGWHZuyUjsxMhMoPoqdsZRTC50a8mByDhupwE0WrDlvvqzwaRO7R5sY20/IYgabUA9fep3o35ssnRhUZ0jDqwmlzaq1j4wMuCiXuFW4ojFfuoBhEiBy/K4eB5BkHZ+eZw==';
      const expectedTransferTxHex =
        'AAAVAAgA4fUFAAAAAAAgkAdCu5I+qQalbzJaF1l3UuzTrDAmu6luDt/0XejbM6sACADh9QUAAAAAAAgA4fUFAAAAAAAIAOH1BQAAAAAACADh9QUAAAAAAAgA4fUFAAAAAAAIAOH1BQAAAAAACADh9QUAAAAAAAgA4fUFAAAAAAAIAOH1BQAAAAAACADh9QUAAAAAAAgA4fUFAAAAAAAIAOH1BQAAAAAACADh9QUAAAAAAAgA4fUFAAAAAAAIAOH1BQAAAAAACADh9QUAAAAAAAgA4fUFAAAAAAAIAOH1BQAAAAAACADh9QUAAAAAKAIAAQEAAAEBAgAAAQEAAgABAQIAAQECAgABAQACAAEBAwABAQIEAAEBAAIAAQEEAAEBAgYAAQEAAgABAQUAAQECCAABAQACAAEBBgABAQIKAAEBAAIAAQEHAAEBAgwAAQEAAgABAQgAAQECDgABAQACAAEBCQABAQIQAAEBAAIAAQEKAAEBAhIAAQEAAgABAQsAAQECFAABAQACAAEBDAABAQIWAAEBAAIAAQENAAEBAhgAAQEAAgABAQ4AAQECGgABAQACAAEBDwABAQIcAAEBAAIAAQEQAAEBAh4AAQEAAgABAREAAQECIAABAQACAAEBEgABAQIiAAEBAAIAAQETAAEBAiQAAQEAAgABARQAAQECJgABAQCQB0K7kj6pBqVvMloXWXdS7NOsMCa7qW4O3/Rd6NszqwJ3AbiIwWM5ms1bgEYzwdDlMrwxQ8/vNMo2C+YHxo3N72YEAAAAAAAAIDrMcEOTidjOdp7a1J/jjJ9tOjb6P2WTyBSwQqAHiA1/yfVla+cYIwE9k34GVOs+3LJhla/SMAm+mrlufz8twgNmBAAAAAAAACAhXnkXobS2E/RZ/cLDQ/n3BH/TxAjKv5VxsbLEZCUxu5AHQruSPqkGpW8yWhdZd1Ls06wwJrupbg7f9F3o2zOr6AMAAAAAAAAALTEBAAAAAAA=';

      const coins = [
        {
          digest: '4xXTGhhtNUjBU8nMivsLWTMRWvZRc5RWDMgyTMnnRDYS',
          objectId: '0x7701b888c163399acd5b804633c1d0e532bc3143cfef34ca360be607c68dcdef',
          version: 1126,
        },
        {
          digest: '3FG1Nfk5HrQ1tWYKS8BX9ynZTSprL5hLn3pgw7kdj1RU',
          objectId: '0xc9f5656be71823013d937e0654eb3edcb26195afd23009be9ab96e7f3f2dc203',
          version: 1126,
        },
      ];
      const txBuilder_1 = factory.getTransferBuilder();
      txBuilder_1.type(SuiTransactionType.Transfer);
      txBuilder_1.sender(senderAddress);
      txBuilder_1.send(Array(20).fill({ address: senderAddress, amount: '100000000' }));
      const gasData: GasData = {
        payment: coins,
        owner: senderAddress,
        budget: testData.GAS_BUDGET,
        price: 1000,
      };
      txBuilder_1.gasData(gasData);

      const tx_1 = await txBuilder_1.build();
      const signable_1 = tx_1.signablePayload;
      const signature_1 = keyPairSender.signMessageinUint8Array(signable_1);
      txBuilder_1.addSignature({ pub: keyPairSender.getKeys().pub }, Buffer.from(signature_1));
      const signedTx_1 = (await txBuilder_1.build()) as TransferTransaction;
      const txHex_1 = signedTx_1.toBroadcastFormat();
      const sig_1 = Buffer.from(signedTx_1.serializedSig).toString('base64');

      const txBuilderFromRaw_2 = factory.getTransferBuilder();
      txBuilderFromRaw_2.from(txHex_1);
      const signable_2 = tx_1.signablePayload;
      const signature_2 = keyPairSender.signMessageinUint8Array(signable_2);
      txBuilderFromRaw_2.addSignature({ pub: keyPairSender.getKeys().pub }, Buffer.from(signature_2));
      const signedTx_2 = (await txBuilderFromRaw_2.build()) as TransferTransaction;
      const txHex_2 = signedTx_2.toBroadcastFormat();
      const sig_2 = Buffer.from(signedTx_2.serializedSig).toString('base64');

      should.equal(Buffer.from(signable_1).toString('hex'), Buffer.from(signable_2).toString('hex'));
      should.equal(txHex_1, txHex_2);
      should.equal(txHex_1, expectedTransferTxHex);
      should.equal(txHex_2, expectedTransferTxHex);
      should.equal(sig_1, sig_2);
      should.equal(sig_1, expectedTransferTxSig);
      should.equal(sig_2, expectedTransferTxSig);
    });

    it('should fail to build if missing type', async function () {
      for (const txBuilder of builders) {
        txBuilder.sender(testData.sender.address);
        txBuilder.send(recipients);
        txBuilder.gasData(testData.gasData);
        await txBuilder.build().should.rejectedWith('type is required before building');
      }
    });

    it('should fail to build if missing sender', async function () {
      for (const txBuilder of builders) {
        txBuilder.type(SuiTransactionType.Transfer);
        txBuilder.send(recipients);
        txBuilder.gasData(testData.gasData);
        await txBuilder.build().should.rejectedWith('sender is required before building');
      }
    });

    it('should fail to build if missing recipients', async function () {
      for (const txBuilder of builders) {
        txBuilder.type(SuiTransactionType.Transfer);
        txBuilder.sender(testData.sender.address);
        txBuilder.gasData(testData.gasData);
        await txBuilder.build().should.rejectedWith('at least one recipient is required before building');
      }
    });

    it('should fail to build if missing gasData', async function () {
      for (const txBuilder of builders) {
        txBuilder.type(SuiTransactionType.Transfer);
        txBuilder.sender(testData.sender.address);
        txBuilder.send(recipients);
        await txBuilder.build().should.rejectedWith('gasData is required before building');
      }
    });

    it('should fail to build if missing payment coins in gasData', async function () {
      for (const txBuilder of builders) {
        txBuilder.type(SuiTransactionType.Transfer);
        txBuilder.sender(testData.sender.address);
        txBuilder.send(recipients);
        should(() => txBuilder.gasData(testData.gasDataWithoutGasPayment)).throwError(
          `gas payment is required before building`
        );
        await txBuilder.build().should.rejectedWith('gasData is required before building');
      }
    });

    it('should build a send from rawTx', async function () {
      const txBuilder = factory.from(testData.TRANSFER);
      const builtTx = await txBuilder.build();
      should.equal(builtTx.type, TransactionType.Send);
      should.equal(builtTx.id, 'BxoeGXbBCuw6VFEcgwHHUAKrCoAsGanPB39kdVVKZZcR');
      builtTx.inputs.length.should.equal(1);
      builtTx.inputs[0].should.deepEqual({
        address: testData.sender.address,
        value: (testData.AMOUNT * 2).toString(),
        coin: 'tsui',
      });
      builtTx.outputs.length.should.equal(2);
      builtTx.outputs[0].should.deepEqual({
        address: testData.recipients[0].address,
        value: testData.recipients[0].amount,
        coin: 'tsui',
      });
      builtTx.outputs[1].should.deepEqual({
        address: testData.recipients[1].address,
        value: testData.recipients[1].amount,
        coin: 'tsui',
      });
      const jsonTx = builtTx.toJson();
      jsonTx.gasData.should.deepEqual(testData.gasData);
      jsonTx.kind.ProgrammableTransaction.should.deepEqual({
        inputs: testData.txInputs,
        transactions: testData.txTransactions,
      });
      jsonTx.sender.should.equal(testData.sender.address);
      jsonTx.gasData.should.deepEqual(testData.gasData);
      builtTx.toBroadcastFormat().should.equal(testData.TRANSFER);
    });
  });
  describe('Staking TX', async () => {
    beforeEach(function (done) {
      builders = [factory.getStakingBuilder()];
      done();
    });

    it('should build an add staking transaction and serialize it and deserialize it', async function () {
      const txBuilder = factory.getStakingBuilder();
      txBuilder.type(SuiTransactionType.AddStake);
      txBuilder.sender(testData.sender.address);
      txBuilder.stake([testData.requestAddStake]);
      txBuilder.gasData(testData.gasData);
      const tx = await txBuilder.build();
      should.equal(tx.type, TransactionType.StakingAdd);
      const rawTx = tx.toBroadcastFormat();
      should.equal(rawTx, testData.ADD_STAKE);
      const reserialized = await factory.from(rawTx).build();
      reserialized.toBroadcastFormat().should.equal(rawTx);
    });

    it('should build an stakeMany transaction and serialize it and deserialize it', async function () {
      const txBuilder = factory.getStakingBuilder();
      txBuilder.type(SuiTransactionType.AddStake);
      txBuilder.sender(testData.sender.address);
      txBuilder.stake(testData.requestAddStakeMany);
      txBuilder.gasData(testData.gasData);
      const tx = await txBuilder.build();
      should.equal(tx.type, TransactionType.StakingAdd);
      const rawTx = tx.toBroadcastFormat();
      should.equal(rawTx, testData.STAKE_MANY);
      const reserialized = await factory.from(rawTx).build();
      // reserialized.should.be.deepEqual(tx);
      reserialized.toBroadcastFormat().should.equal(rawTx);
    });

    it('should build and sign a staking tx with gasPayment', async function () {
      const txBuilder = factory.getStakingBuilder();
      txBuilder.type(SuiTransactionType.AddStake);
      txBuilder.sender(testData.sender.address);
      txBuilder.stake([testData.requestAddStake]);
      txBuilder.gasData(testData.gasData);
      const tx = await txBuilder.build();
      should.equal(tx.id, 'bP78boZ48sDdJsg2V1tJahpGyBwaC9GSTL2rvyADnsh');
      const rawTx = tx.toBroadcastFormat();
      should.equal(rawTx, testData.ADD_STAKE);

      const txBuilder2 = await factory.from(rawTx);
      await txBuilder2.addSignature({ pub: testData.sender.publicKey }, Buffer.from(testData.sender.signatureHex));
      const signedTx = await txBuilder2.build();
      should.equal(signedTx.type, TransactionType.StakingAdd);
      should.equal(signedTx.id, 'bP78boZ48sDdJsg2V1tJahpGyBwaC9GSTL2rvyADnsh');

      const rawSignedTx = signedTx.toBroadcastFormat();
      should.equal(rawSignedTx, testData.ADD_STAKE);
      const reserializedTxBuilder = factory.from(rawSignedTx);
      reserializedTxBuilder.addSignature({ pub: testData.sender.publicKey }, Buffer.from(testData.sender.signatureHex));
      const reserialized = await reserializedTxBuilder.build();

      reserialized.should.be.deepEqual(signedTx);
      reserialized.toBroadcastFormat().should.equal(rawSignedTx);
    });

    it('should build and sign a staking transaction with private keys', async () => {
      const keyPairSender = new KeyPair({ prv: testData.privateKeys.prvKey1 });
      const senderAddress = keyPairSender.getAddress();
      const expectedStakingTxSig =
        'AD8755e+kA3/Iy+3oRxBbQiK0Iz4qmD4sZcpoQN0UMPxIXv7Qx4twvuAiZf9H2nHYa/Ae0asM4Rkz1SCP0dhXgqlzaq1j4wMuCiXuFW4ojFfuoBhEiBy/K4eB5BkHZ+eZw==';
      const expectedStakingTxHex =
        'AAAJAAgALTEBAAAAAAEBAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAUBAAAAAAAAAAEAIESxsxniNJWZX8g32v0o/Gr4tkXt3f8PwUZ/GtYxNiwjAAgArCP8BgAAAAAgRLGzGeI0lZlfyDfa/Sj8avi2Re3d/w/BRn8a1jE2LCYACAAtMQEAAAAAACBEsbMZ4jSVmV/IN9r9KPxq+LZF7d3/D8FGfxrWMTYsJgAIAKwj/AYAAAAAIESxsxniNJWZX8g32v0o/Gr4tkXt3f8PwUZ/GtYxNiwjCAIAAQEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAwpzdWlfc3lzdGVtEXJlcXVlc3RfYWRkX3N0YWtlAAMBAQACAAABAgACAAEBAwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMKc3VpX3N5c3RlbRFyZXF1ZXN0X2FkZF9zdGFrZQADAQEAAgIAAQQAAgABAQUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADCnN1aV9zeXN0ZW0RcmVxdWVzdF9hZGRfc3Rha2UAAwEBAAIEAAEGAAIAAQEHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAwpzdWlfc3lzdGVtEXJlcXVlc3RfYWRkX3N0YWtlAAMBAQACBgABCACQB0K7kj6pBqVvMloXWXdS7NOsMCa7qW4O3/Rd6NszqwJ3AbiIwWM5ms1bgEYzwdDlMrwxQ8/vNMo2C+YHxo3N72YEAAAAAAAAIDrMcEOTidjOdp7a1J/jjJ9tOjb6P2WTyBSwQqAHiA1/yfVla+cYIwE9k34GVOs+3LJhla/SMAm+mrlufz8twgNmBAAAAAAAACAhXnkXobS2E/RZ/cLDQ/n3BH/TxAjKv5VxsbLEZCUxu5AHQruSPqkGpW8yWhdZd1Ls06wwJrupbg7f9F3o2zOr6AMAAAAAAAAALTEBAAAAAAA=';

      const coins = [
        {
          digest: '4xXTGhhtNUjBU8nMivsLWTMRWvZRc5RWDMgyTMnnRDYS',
          objectId: '0x7701b888c163399acd5b804633c1d0e532bc3143cfef34ca360be607c68dcdef',
          version: 1126,
        },
        {
          digest: '3FG1Nfk5HrQ1tWYKS8BX9ynZTSprL5hLn3pgw7kdj1RU',
          objectId: '0xc9f5656be71823013d937e0654eb3edcb26195afd23009be9ab96e7f3f2dc203',
          version: 1126,
        },
      ];
      const txBuilder_1 = factory.getStakingBuilder();
      txBuilder_1.type(SuiTransactionType.AddStake);
      txBuilder_1.sender(senderAddress);
      txBuilder_1.stake(testData.requestAddStakeMany);
      const gasData: GasData = {
        payment: coins,
        owner: senderAddress,
        budget: testData.GAS_BUDGET,
        price: 1000,
      };
      txBuilder_1.gasData(gasData);

      const tx_1 = await txBuilder_1.build();
      const signable_1 = tx_1.signablePayload;
      const signature_1 = keyPairSender.signMessageinUint8Array(signable_1);
      txBuilder_1.addSignature({ pub: keyPairSender.getKeys().pub }, Buffer.from(signature_1));
      const signedTx_1 = (await txBuilder_1.build()) as StakingTransaction;
      const txHex_1 = signedTx_1.toBroadcastFormat();
      const sig_1 = Buffer.from(signedTx_1.serializedSig).toString('base64');

      const txBuilderFromRaw_2 = factory.getStakingBuilder();
      txBuilderFromRaw_2.from(txHex_1);
      const signable_2 = tx_1.signablePayload;
      txBuilderFromRaw_2.sign({ key: testData.privateKeys.prvKey1 });
      const signedTx_2 = (await txBuilderFromRaw_2.build()) as StakingTransaction;
      const txHex_2 = signedTx_2.toBroadcastFormat();
      const sig_2 = Buffer.from(signedTx_2.serializedSig).toString('base64');

      should.equal(Buffer.from(signable_1).toString('hex'), Buffer.from(signable_2).toString('hex'));
      should.equal(txHex_1, txHex_2);
      should.equal(txHex_1, expectedStakingTxHex);
      should.equal(txHex_2, expectedStakingTxHex);
      should.equal(sig_1, sig_2);
      should.equal(sig_1, expectedStakingTxSig);
      should.equal(sig_2, expectedStakingTxSig);
    });

    it('should fail to build if missing type', async function () {
      for (const txBuilder of builders) {
        txBuilder.sender(testData.sender.address);
        txBuilder.stake([testData.requestAddStake]);
        txBuilder.gasData(testData.gasData);
        await txBuilder.build().should.rejectedWith('type is required before building');
      }
    });

    it('should fail to build if missing sender', async function () {
      for (const txBuilder of builders) {
        txBuilder.type(SuiTransactionType.AddStake);
        txBuilder.stake([testData.requestAddStake]);
        txBuilder.gasData(testData.gasData);
        await txBuilder.build().should.rejectedWith('sender is required before building');
      }
    });

    it('should fail to build if missing gasData', async function () {
      for (const txBuilder of builders) {
        txBuilder.sender(testData.sender.address);
        txBuilder.type(SuiTransactionType.AddStake);
        txBuilder.stake([testData.requestAddStake]);
        await txBuilder.build().should.rejectedWith('gasData is required before building');
      }
    });

    it('should fail to build if missing payment coins in gasData', async function () {
      for (const txBuilder of builders) {
        txBuilder.sender(testData.sender.address);
        txBuilder.type(SuiTransactionType.AddStake);
        txBuilder.stake([testData.requestAddStake]);
        should(() => txBuilder.gasData(testData.gasDataWithoutGasPayment)).throwError(
          `gas payment is required before building`
        );
        await txBuilder.build().should.rejectedWith('gasData is required before building');
      }
    });

    it('should build a send from rawTx', async function () {
      const txBuilder = factory.from(testData.ADD_STAKE);
      const builtTx = await txBuilder.build();
      should.equal(builtTx.type, TransactionType.StakingAdd);
      should.equal(builtTx.id, 'bP78boZ48sDdJsg2V1tJahpGyBwaC9GSTL2rvyADnsh');
      builtTx.inputs.length.should.equal(1);
      builtTx.inputs[0].should.deepEqual({
        address: testData.sender.address,
        value: STAKING_AMOUNT.toString(),
        coin: 'tsui',
      });
      builtTx.outputs.length.should.equal(1);
      builtTx.outputs[0].should.deepEqual({
        address: testData.requestAddStake.validatorAddress,
        value: STAKING_AMOUNT.toString(),
        coin: 'tsui',
      });
      const jsonTx = builtTx.toJson();
      jsonTx.gasData.should.deepEqual(testData.gasData);
      jsonTx.kind.ProgrammableTransaction.should.deepEqual({
        inputs: testData.txInputsAddStake,
        transactions: testData.txTransactionsAddStake,
      });
      jsonTx.sender.should.equal(testData.sender.address);
      jsonTx.gasData.should.deepEqual(testData.gasData);
      builtTx.toBroadcastFormat().should.equal(testData.ADD_STAKE);
    });
  });
  describe('Unstaking TX', async () => {
    beforeEach(function (done) {
      builders = [factory.getUnstakingBuilder()];
      done();
    });

    it('should build an unstaking transaction and serialize it and deserialize it', async function () {
      const txBuilder = factory.getUnstakingBuilder();
      txBuilder.type(SuiTransactionType.WithdrawStake);
      txBuilder.sender(testData.sender.address);
      txBuilder.unstake(testData.requestWithdrawStakedSui);
      txBuilder.gasData(testData.gasData);
      const tx = await txBuilder.build();
      should.equal(tx.type, TransactionType.StakingClaim);
      const rawTx = tx.toBroadcastFormat();
      should.equal(rawTx, testData.WITHDRAW_STAKED_SUI);
      const reserialized = await factory.from(rawTx).build();
      reserialized.toBroadcastFormat().should.equal(rawTx);
    });

    it('should build and sign a staking tx with gasPayment', async function () {
      const txBuilder = factory.getUnstakingBuilder();
      txBuilder.type(SuiTransactionType.WithdrawStake);
      txBuilder.sender(testData.sender.address);
      txBuilder.unstake(testData.requestWithdrawStakedSui);
      txBuilder.gasData(testData.gasData);
      const tx = await txBuilder.build();
      should.equal(tx.id, 'Rixz9C2yQ6jDFFsovUs84Y6yw2dco8HH4QhK7RCQYNo');
      const rawTx = tx.toBroadcastFormat();
      should.equal(rawTx, testData.WITHDRAW_STAKED_SUI);

      const txBuilder2 = await factory.from(rawTx);
      await txBuilder2.addSignature({ pub: testData.sender.publicKey }, Buffer.from(testData.sender.signatureHex));
      const signedTx = await txBuilder2.build();
      should.equal(signedTx.type, TransactionType.StakingClaim);
      should.equal(signedTx.id, 'Rixz9C2yQ6jDFFsovUs84Y6yw2dco8HH4QhK7RCQYNo');

      const rawSignedTx = signedTx.toBroadcastFormat();
      should.equal(rawSignedTx, testData.WITHDRAW_STAKED_SUI);
      const reserializedTxBuilder = factory.from(rawSignedTx);
      reserializedTxBuilder.addSignature({ pub: testData.sender.publicKey }, Buffer.from(testData.sender.signatureHex));
      const reserialized = await reserializedTxBuilder.build();

      reserialized.should.be.deepEqual(signedTx);
      reserialized.toBroadcastFormat().should.equal(rawSignedTx);
    });

    it('should build and sign a staking transaction with private keys', async () => {
      const keyPairSender = new KeyPair({ prv: testData.privateKeys.prvKey1 });
      const senderAddress = keyPairSender.getAddress();
      const expectedStakingTxSig =
        'ABqwaOIsxZjf/LIE985SJK2lH56oNxIuHVpZhN+6L9uZFYFuipa6zsg5fnprxuBPIUVTorw3yEJcoKNGZwOpQgKlzaq1j4wMuCiXuFW4ojFfuoBhEiBy/K4eB5BkHZ+eZw==';
      const expectedStakingTxHex =
        'AAACAQEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABQEAAAAAAAAAAQEA7m38PaMuIVQaKurfzSUPigoju3q9qciYhAf8MgaMN0ZhBAAAAAAAACDJYCWUFis6HawzxGyErvRT03pYayRliLki0kYsV0XCBAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMKc3VpX3N5c3RlbRZyZXF1ZXN0X3dpdGhkcmF3X3N0YWtlAAIBAAABAQCQB0K7kj6pBqVvMloXWXdS7NOsMCa7qW4O3/Rd6NszqwJ3AbiIwWM5ms1bgEYzwdDlMrwxQ8/vNMo2C+YHxo3N72YEAAAAAAAAIDrMcEOTidjOdp7a1J/jjJ9tOjb6P2WTyBSwQqAHiA1/yfVla+cYIwE9k34GVOs+3LJhla/SMAm+mrlufz8twgNmBAAAAAAAACAhXnkXobS2E/RZ/cLDQ/n3BH/TxAjKv5VxsbLEZCUxu5AHQruSPqkGpW8yWhdZd1Ls06wwJrupbg7f9F3o2zOr6AMAAAAAAAAALTEBAAAAAAA=';

      const coins = [
        {
          digest: '4xXTGhhtNUjBU8nMivsLWTMRWvZRc5RWDMgyTMnnRDYS',
          objectId: '0x7701b888c163399acd5b804633c1d0e532bc3143cfef34ca360be607c68dcdef',
          version: 1126,
        },
        {
          digest: '3FG1Nfk5HrQ1tWYKS8BX9ynZTSprL5hLn3pgw7kdj1RU',
          objectId: '0xc9f5656be71823013d937e0654eb3edcb26195afd23009be9ab96e7f3f2dc203',
          version: 1126,
        },
      ];
      const txBuilder_1 = factory.getUnstakingBuilder();
      txBuilder_1.type(SuiTransactionType.WithdrawStake);
      txBuilder_1.sender(senderAddress);
      txBuilder_1.unstake(testData.requestWithdrawStakedSui);
      const gasData: GasData = {
        payment: coins,
        owner: senderAddress,
        budget: testData.GAS_BUDGET,
        price: 1000,
      };
      txBuilder_1.gasData(gasData);

      const tx_1 = await txBuilder_1.build();
      const signable_1 = tx_1.signablePayload;
      const signature_1 = keyPairSender.signMessageinUint8Array(signable_1);
      txBuilder_1.addSignature({ pub: keyPairSender.getKeys().pub }, Buffer.from(signature_1));
      const signedTx_1 = (await txBuilder_1.build()) as UnstakingTransaction;
      const txHex_1 = signedTx_1.toBroadcastFormat();
      const sig_1 = Buffer.from(signedTx_1.serializedSig).toString('base64');

      const txBuilderFromRaw_2 = factory.getUnstakingBuilder();
      txBuilderFromRaw_2.from(txHex_1);
      const signable_2 = tx_1.signablePayload;
      txBuilderFromRaw_2.sign({ key: testData.privateKeys.prvKey1 });
      const signedTx_2 = (await txBuilderFromRaw_2.build()) as UnstakingTransaction;
      const txHex_2 = signedTx_2.toBroadcastFormat();
      const sig_2 = Buffer.from(signedTx_2.serializedSig).toString('base64');

      should.equal(Buffer.from(signable_1).toString('hex'), Buffer.from(signable_2).toString('hex'));
      should.equal(txHex_1, txHex_2);
      should.equal(txHex_1, expectedStakingTxHex);
      should.equal(txHex_2, expectedStakingTxHex);
      should.equal(sig_1, sig_2);
      should.equal(sig_1, expectedStakingTxSig);
      should.equal(sig_2, expectedStakingTxSig);
    });

    it('should fail to build if missing type', async function () {
      for (const txBuilder of builders) {
        txBuilder.sender(testData.sender.address);
        txBuilder.unstake(testData.requestWithdrawStakedSui);
        txBuilder.gasData(testData.gasData);
        await txBuilder.build().should.rejectedWith('type is required before building');
      }
    });

    it('should fail to build if missing sender', async function () {
      for (const txBuilder of builders) {
        txBuilder.type(SuiTransactionType.WithdrawStake);
        txBuilder.unstake(testData.requestWithdrawStakedSui);
        txBuilder.gasData(testData.gasData);
        await txBuilder.build().should.rejectedWith('sender is required before building');
      }
    });

    it('should fail to build if missing gasData', async function () {
      for (const txBuilder of builders) {
        txBuilder.sender(testData.sender.address);
        txBuilder.type(SuiTransactionType.WithdrawStake);
        txBuilder.unstake(testData.requestWithdrawStakedSui);
        await txBuilder.build().should.rejectedWith('gasData is required before building');
      }
    });

    it('should fail to build if missing payment coins in gasData', async function () {
      for (const txBuilder of builders) {
        txBuilder.sender(testData.sender.address);
        txBuilder.type(SuiTransactionType.WithdrawStake);
        txBuilder.unstake(testData.requestWithdrawStakedSui);
        should(() => txBuilder.gasData(testData.gasDataWithoutGasPayment)).throwError(
          `gas payment is required before building`
        );
        await txBuilder.build().should.rejectedWith('gasData is required before building');
      }
    });

    it('should build a send from rawTx', async function () {
      const txBuilder = factory.from(testData.WITHDRAW_STAKED_SUI);
      const builtTx = await txBuilder.build();
      should.equal(builtTx.type, TransactionType.StakingClaim);
      should.equal(builtTx.id, 'Rixz9C2yQ6jDFFsovUs84Y6yw2dco8HH4QhK7RCQYNo');
      builtTx.inputs.length.should.equal(1);
      builtTx.inputs[0].should.deepEqual({
        address: testData.requestWithdrawStakedSui.stakedSui.objectId,
        value: AMOUNT_UNKNOWN_TEXT,
        coin: 'tsui',
      });
      builtTx.outputs.length.should.equal(1);
      builtTx.outputs[0].should.deepEqual({
        address: testData.sender.address,
        value: AMOUNT_UNKNOWN_TEXT,
        coin: 'tsui',
      });
      const jsonTx = builtTx.toJson();
      jsonTx.gasData.should.deepEqual(testData.gasData);
      jsonTx.kind.ProgrammableTransaction.should.deepEqual({
        inputs: testData.txInputWithdrawStaked,
        transactions: testData.txTransactionsWithdrawStaked,
      });
      jsonTx.sender.should.equal(testData.sender.address);
      jsonTx.gasData.should.deepEqual(testData.gasData);
      builtTx.toBroadcastFormat().should.equal(testData.WITHDRAW_STAKED_SUI);
    });

    it('should determine correct type for withdrawal with amount', async function () {
      const txBuilder = factory.from(testData.WITHDRAW_STAKED_SUI_WITH_AMOUNT);
      const tx = await txBuilder.build();
      should.equal(tx.type, TransactionType.StakingClaim);
    });
  });
  describe('Custom TX', async () => {
    it('should sign a custom tx', async function () {
      const keyPairSender = new KeyPair({ prv: testData.privateKeys.prvKey1 });

      const txBuilder = factory.from(CUSTOM_TX_STAKING_POOL_SPLIT);
      const tx = await txBuilder.build();
      const unsignedTxHex = tx.toBroadcastFormat();
      const signable = tx.signablePayload;
      const signatureBytes = keyPairSender.signMessageinUint8Array(signable);
      txBuilder.addSignature({ pub: keyPairSender.getKeys().pub }, Buffer.from(signatureBytes));
      const signedTx = (await txBuilder.build()) as CustomTransaction;
      const signedTxHex = signedTx.toBroadcastFormat();
      should.equal(signedTxHex, unsignedTxHex);
      should.equal(signedTx.signature.length, 1);
      should.equal(signedTx.signature[0], Buffer.from(signatureBytes).toString('hex'));

      const serializedSig = Buffer.from(signedTx.serializedSig).toString('base64');
      should.equal(
        serializedSig,
        'APGQHoYbVSyL6M7lOQL5w2YYzeeVcTMEbe0Y4jVphQA+0QHq3VEDoXVwIukkL44z+vqsekviS4gQ0ZwUPTWHFQilzaq1j4wMuCiXuFW4ojFfuoBhEiBy/K4eB5BkHZ+eZw=='
      );
    });

    it('should fail to build if unsupported txn type', async function () {
      should(() => factory.from(UNSUPPORTED_TX)).throwError(
        'unsupported target method 0000000000000000000000000000000000000000000000000000000000000003::staking_pool::split_staked_sui'
      );
    });
  });
});
