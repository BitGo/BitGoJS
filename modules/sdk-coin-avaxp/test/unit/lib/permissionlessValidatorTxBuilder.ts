import assert from 'assert';
import * as testData from '../../resources/avaxp';
import * as AvaxpLib from '../../../src/lib';
import { TransactionBuilderFactory } from '../../../src/lib';
import { coins } from '@bitgo/statics';
import { BaseTransaction, HalfSignedAccountTransaction, TransactionType } from '@bitgo/sdk-core';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';
import { AvaxP, TavaxP } from '../../../src';
import { pvm } from '@bitgo/avalanchejs';

describe('AvaxP permissionlessValidatorTxBuilder', () => {
  let basecoin;
  let bitgo: TestBitGoAPI;
  const factory = new TransactionBuilderFactory(coins.get('tavaxp'));

  before(() => {
    bitgo = TestBitGo.decorate(BitGoAPI, {
      env: 'mock',
    });
    bitgo.initializeTestVars();
    bitgo.safeRegister('avaxp', AvaxP.createInstance);
    bitgo.safeRegister('tavaxp', TavaxP.createInstance);
    basecoin = bitgo.coin('tavaxp');
  });

  it('should create transaction builder from hex', () => {
    const txBuilder = factory.from(testData.ADDVALIDATOR_SAMPLES.unsignedTxHex);
    console.log(txBuilder);
  });

  describe('Transaction readable', () => {
    let tx: BaseTransaction;
    before(async () => {
      const txBuilder = new TransactionBuilderFactory(coins.get('tavaxp')).from(
        testData.ADD_VALIDATOR_ID_SAMPLE.fullsigntxHex
      );
      tx = await txBuilder.build();
    });

    it('Should json stringifiy addPermissionlessValidator transaction', async () => {
      const txJson = tx.toJson();
      assert(typeof JSON.stringify(tx.toJson()), 'string');
      txJson.id.should.equal(testData.ADD_VALIDATOR_ID_SAMPLE.txid);
    });

    it('Should get a txid', async () => {
      tx.id.should.equal(testData.ADD_VALIDATOR_ID_SAMPLE.txid);
    });
  });

  describe('should explains transaction', () => {
    it('should explains a Signed AddPermissionlessValidatorTx', async () => {
      // TODO(CR-1073): try to decode permissionless validator tx got from explorer. It is failing as no outputs are found
      const txBuilder = new TransactionBuilderFactory(coins.get('tavaxp')).from(
        // https://testnet.snowtrace.io/pvm/tx/2tt3KE6gAG7qpMLL6xoynSyk7ht4egQ74wcF7AuGm25vQ3QNWB?chainId=43113
        '0x000000000019000000050000000000000000000000000000000000000000000000000000000000000000000000013d9bdac0ed1d761330cf680efdeb1a42159eb387d6d2950c96f7d28f61bbe2aa00000007000000000baeb90000000000000000000000000200000003ac03c0ca71a1dde84702d272fbdd08600186701242e19ad9a617fb95dcf8843ade66e06e578f549a8be54f016ab748127ab1a184626cba44c748a1ee000000024f194d8e066b11dfe92f593cfa5c2fa1ae450927ecd5b093952e61834f4d8aa4000000013d9bdac0ed1d761330cf680efdeb1a42159eb387d6d2950c96f7d28f61bbe2aa000000050000000023a4c180000000030000000200000000000000014f194d8e066b11dfe92f593cfa5c2fa1ae450927ecd5b093952e61834f4d8aa4000000013d9bdac0ed1d761330cf680efdeb1a42159eb387d6d2950c96f7d28f61bbe2aa000000050000000023a4c180000000030000000200000000000000010000000094a8b8179f0b6e7e7ce55b4d6ec5ad56dae1de9f0000000062bb03e60000000062e32556000000003b9aca0000000000000000000000000000000000000000000000000000000000000000000000001c8f95423f7142d00a48e1014a3de8d28907d420dc33b3052a6dee03a3f2941a393c2351e354704ca66a3fc29870282e1586a3ab4c45cfe31cae34c1d06f212434ac71b1be6cfe046c80c162e057614a94a5bc9f1ded1a7029deb0ba4ca7c9b71411e293438691be79c2dbf19d1ca7c3eadb9c756246fc5de5b7b89511c7d7302ae051d9e03d7991138299b5ed6a570a98000000013d9bdac0ed1d761330cf680efdeb1a42159eb387d6d2950c96f7d28f61bbe2aa00000007000000003b9aca0000000000000000000000000200000003ac03c0ca71a1dde84702d272fbdd08600186701242e19ad9a617fb95dcf8843ade66e06e578f549a8be54f016ab748127ab1a184626cba44c748a1ee0000000b00000000000000000000000200000003ac03c0ca71a1dde84702d272fbdd08600186701242e19ad9a617fb95dcf8843ade66e06e578f549a8be54f016ab748127ab1a184626cba44c748a1ee0000000b00000000000000000000000200000003ac03c0ca71a1dde84702d272fbdd08600186701242e19ad9a617fb95dcf8843ade66e06e578f549a8be54f016ab748127ab1a184626cba44c748a1ee00030d40000000020000000900000002b631e9553a8721978bffed3e778de7eb904e167599c1d26d5a8d3c46158df661164c6ca6029f24988020ccfcd673e5c19817ff74d012651f245d009a749591160170eae73d7e19b045671d41050b11791643567d1bc9cc51fa226d2be95a65689f19cda06a242a9749f6a150fcc2a5b50af12a1bc3564d1b76ac1e3826b5e21361010000000900000002b631e9553a8721978bffed3e778de7eb904e167599c1d26d5a8d3c46158df661164c6ca6029f24988020ccfcd673e5c19817ff74d012651f245d009a749591160170eae73d7e19b045671d41050b11791643567d1bc9cc51fa226d2be95a65689f19cda06a242a9749f6a150fcc2a5b50af12a1bc3564d1b76ac1e3826b5e2136101'
      );
      const tx = await txBuilder.build();
      const txExplain = tx.explainTransaction();
      txExplain.outputAmount.should.equal(testData.ADDVALIDATOR_SAMPLES.minValidatorStake);
      txExplain.type.should.equal(TransactionType.AddPermissionlessValidator);
      txExplain.outputs[0].address.should.equal(testData.ADDVALIDATOR_SAMPLES.nodeID);
      console.log(txExplain);
      console.log(tx.toJson());
    });

    it('should explains a Half Signed AddPermissionlessValidatorTx', async () => {
      const txBuilder = new TransactionBuilderFactory(coins.get('tavaxp')).from(
        testData.ADDVALIDATOR_SAMPLES.halfsigntxHex
      );
      const tx = await txBuilder.build();
      const txExplain = tx.explainTransaction();
      txExplain.outputAmount.should.equal(testData.ADDVALIDATOR_SAMPLES.minValidatorStake);
      txExplain.type.should.equal(TransactionType.AddValidator);
      txExplain.outputs[0].address.should.equal(testData.ADDVALIDATOR_SAMPLES.nodeID);
    });

    it('should explains a unsigned AddPermissionlessValidatorTx', async () => {
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

  describe('Sign Transaction', () => {
    it('build and sign an AddPermissionlessValidator transaction and broadcast', async () => {
      const unixNow = BigInt(Math.round(new Date().getTime() / 1000));
      const startTime = unixNow + BigInt(60);
      const endTime = startTime + BigInt(2630000);

      const recoveryMode = false;
      const txBuilder = new AvaxpLib.TransactionBuilderFactory(coins.get('tavaxp'))
        .getPermissionlessValidatorTxBuilder()
        .threshold(testData.BUILD_AND_SIGN_ADD_PERMISSIONLESS_VALIDATOR_SAMPLE.threshold)
        .locktime(testData.BUILD_AND_SIGN_ADD_PERMISSIONLESS_VALIDATOR_SAMPLE.locktime)
        .recoverMode(recoveryMode)
        .fromPubKey(testData.BUILD_AND_SIGN_ADD_PERMISSIONLESS_VALIDATOR_SAMPLE.bitgoAddresses)
        // .startTime(testData.BUILD_AND_SIGN_ADD_PERMISSIONLESS_VALIDATOR_SAMPLE.startTime)
        // .endTime(testData.BUILD_AND_SIGN_ADD_PERMISSIONLESS_VALIDATOR_SAMPLE.endTime)
        .startTime(startTime.toString())
        .endTime(endTime.toString())
        .stakeAmount(testData.BUILD_AND_SIGN_ADD_PERMISSIONLESS_VALIDATOR_SAMPLE.stakeAmount)
        .delegationFeeRate(testData.BUILD_AND_SIGN_ADD_PERMISSIONLESS_VALIDATOR_SAMPLE.delegationFeeRate)
        .nodeID(testData.BUILD_AND_SIGN_ADD_PERMISSIONLESS_VALIDATOR_SAMPLE.nodeId)
        .blsPublicKey(testData.BUILD_AND_SIGN_ADD_PERMISSIONLESS_VALIDATOR_SAMPLE.blsPublicKey)
        .blsSignature(testData.BUILD_AND_SIGN_ADD_PERMISSIONLESS_VALIDATOR_SAMPLE.blsSignature)
        .utxos(testData.BUILD_AND_SIGN_ADD_PERMISSIONLESS_VALIDATOR_SAMPLE.utxos);
      const tx = await txBuilder.build();
      tx.type.should.equal(TransactionType.AddPermissionlessValidator);

      // Test sign with user key
      txBuilder.sign({ key: testData.BUILD_AND_SIGN_ADD_PERMISSIONLESS_VALIDATOR_SAMPLE.userPrivateKey });
      const txBuilder2 = factory.from((await txBuilder.build()).toBroadcastFormat());
      txBuilder2.sign({ key: testData.BUILD_AND_SIGN_ADD_PERMISSIONLESS_VALIDATOR_SAMPLE.backupPrivateKey });
      console.log('building after signing with user key');
      const fullSignedTx = await txBuilder2.build();
      console.log(fullSignedTx.toJson());

      const AVAX_PUBLIC_URL = 'https://api.avax-test.network';
      const pvmapi = new pvm.PVMApi(AVAX_PUBLIC_URL);
      try {
        const res = await pvmapi.issueTx({ tx: fullSignedTx.toBroadcastFormat() });
        console.log(res);
      } catch (e) {
        console.log(e);
      }
    });

    it('build and sign an AddPermissionlessValidator transaction', async () => {
      const recoveryMode = false;
      const txBuilder = new AvaxpLib.TransactionBuilderFactory(coins.get('tavaxp'))
        .getPermissionlessValidatorTxBuilder()
        .threshold(testData.BUILD_AND_SIGN_ADD_VALIDATOR_SAMPLE.threshold)
        .locktime(testData.BUILD_AND_SIGN_ADD_VALIDATOR_SAMPLE.locktime)
        .recoverMode(recoveryMode)
        .fromPubKey(testData.BUILD_AND_SIGN_ADD_VALIDATOR_SAMPLE.bitgoAddresses)
        .startTime(testData.BUILD_AND_SIGN_ADD_VALIDATOR_SAMPLE.startTime)
        .endTime(testData.BUILD_AND_SIGN_ADD_VALIDATOR_SAMPLE.endTime)
        .stakeAmount(testData.BUILD_AND_SIGN_ADD_VALIDATOR_SAMPLE.stakeAmount)
        .delegationFeeRate(testData.BUILD_AND_SIGN_ADD_VALIDATOR_SAMPLE.delegationFeeRate)
        .nodeID(testData.BUILD_AND_SIGN_ADD_VALIDATOR_SAMPLE.nodeId)
        .blsPublicKey(testData.BUILD_AND_SIGN_ADD_VALIDATOR_SAMPLE.blsPublicKey)
        .blsSignature(testData.BUILD_AND_SIGN_ADD_VALIDATOR_SAMPLE.blsSignature)
        .utxos(testData.BUILD_AND_SIGN_ADD_VALIDATOR_SAMPLE.utxos);
      const tx = await txBuilder.build();
      tx.type.should.equal(TransactionType.AddPermissionlessValidator);
      // const txHex = tx.toBroadcastFormat();
      // console.log('unsigned txHex\n' + txHex);

      // const privateKey = recoveryMode
      //   ? testData.BUILD_AND_SIGN_ADD_VALIDATOR_SAMPLE.backupPrivateKey
      //   : testData.BUILD_AND_SIGN_ADD_VALIDATOR_SAMPLE.userPrivateKey;

      // const params = {
      //   txPrebuild: {
      //     txHex: txHex,
      //   },
      //   prv: privateKey,
      // };

      // Test sign with user key
      txBuilder.sign({ key: testData.BUILD_AND_SIGN_ADD_VALIDATOR_SAMPLE.userPrivateKey });
      txBuilder.sign({ key: testData.BUILD_AND_SIGN_ADD_VALIDATOR_SAMPLE.backupPrivateKey });
      console.log('building after signing with user key');
      const fullSignedTx = await txBuilder.build();
      console.log(fullSignedTx.toJson());

      // Test sign with backup key
      // txBuilder.recoverMode(true);
      //
      // console.log('building after signing with backup key');
      // await txBuilder.build();

      // const halfSignedTransaction = await basecoin.signTransaction(params);
      // const halfSignedTxHex = (halfSignedTransaction as HalfSignedAccountTransaction)?.halfSigned?.txHex;
      // console.log('halfSigned txHex\n' + halfSignedTxHex);
      //
      // const params2 = {
      //   txPrebuild: {
      //     txHex: halfSignedTxHex,
      //   },
      //   prv: recoveryMode
      //     ? testData.BUILD_AND_SIGN_ADD_VALIDATOR_SAMPLE.userPrivateKey
      //     : testData.BUILD_AND_SIGN_ADD_VALIDATOR_SAMPLE.backupPrivateKey,
      // };
      //
      // const fullySignedTransaction = await basecoin.signTransaction(params2);
      // const fullySignedTxHex = (fullySignedTransaction as FullySignedTransaction)?.txHex;
      // console.log('fullySigned txHex\n' + fullySignedTxHex);
    });

    it('build and sign a transaction in recovery mode', async () => {
      const recoveryMode = true;
      const txBuilder = new AvaxpLib.TransactionBuilderFactory(coins.get('tavaxp'))
        .getValidatorBuilder()
        .threshold(testData.BUILD_AND_SIGN_ADD_VALIDATOR_SAMPLE.threshold)
        .locktime(testData.BUILD_AND_SIGN_ADD_VALIDATOR_SAMPLE.locktime)
        .recoverMode(recoveryMode)
        .fromPubKey(testData.BUILD_AND_SIGN_ADD_VALIDATOR_SAMPLE.bitgoAddresses)
        .startTime(testData.BUILD_AND_SIGN_ADD_VALIDATOR_SAMPLE.startTime)
        .endTime(testData.BUILD_AND_SIGN_ADD_VALIDATOR_SAMPLE.endTime)
        .stakeAmount(testData.BUILD_AND_SIGN_ADD_VALIDATOR_SAMPLE.stakeAmount)
        .delegationFeeRate(testData.BUILD_AND_SIGN_ADD_VALIDATOR_SAMPLE.delegationFeeRate)
        .nodeID(testData.BUILD_AND_SIGN_ADD_VALIDATOR_SAMPLE.nodeId)
        .utxos(testData.BUILD_AND_SIGN_ADD_VALIDATOR_SAMPLE.utxos);
      const tx = await txBuilder.build();

      let txHex = tx.toBroadcastFormat();
      txHex.should.equal(testData.BUILD_AND_SIGN_ADD_VALIDATOR_SAMPLE.unsignedRawtxRecovery);

      const privateKey = recoveryMode
        ? testData.BUILD_AND_SIGN_ADD_VALIDATOR_SAMPLE.backupPrivateKey
        : testData.BUILD_AND_SIGN_ADD_VALIDATOR_SAMPLE.userPrivateKey;

      const params = {
        txPrebuild: {
          txHex: tx.toBroadcastFormat(),
        },
        prv: privateKey,
      };

      const halfSignedTransaction = await basecoin.signTransaction(params);
      txHex = (halfSignedTransaction as HalfSignedAccountTransaction)?.halfSigned?.txHex;
      txHex.should.equal(testData.BUILD_AND_SIGN_ADD_VALIDATOR_SAMPLE.halfSignedRawTxRecovery);
    });
  });
});
