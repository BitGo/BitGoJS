import assert from 'assert';
import * as testData from '../../resources/avaxp';
import * as AvaxpLib from '../../../src/lib';
import { TransactionBuilderFactory } from '../../../src/lib';
import { coins } from '@bitgo/statics';
import { BaseTransaction, HalfSignedAccountTransaction, TransactionType } from '@bitgo/sdk-core';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';
import { AvaxP, TavaxP } from '../../../src';

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

  describe('should validate', () => {
    it('Should validate a correct raw tx', () => {
      factory.from(testData.ADDVALIDATOR_SAMPLES.unsignedTxHex);
      // should not throw a error!
    });
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
        '0x00000000001900000005000000000000000000000000000000000000000000000000000000000000000000000000000000019ccec07a0e563bfb86a91cea6a8bf5b33779fb247c7d33262506e5c71604a758000000013d9bdac0ed1d761330cf680efdeb1a42159eb387d6d2950c96f7d28f61bbe2aa0000000500000000b2d05e00000000010000000000000000154bcbed02f19e99daf6e9bac66dee576cd434aa00000000660772e00000000066096d2000000000b2d05e0000000000000000000000000000000000000000000000000000000000000000000000001cb417d46a85addb0f8d25eeb5f390d8fe74ae508d0bd51defbdf3683c1bf697604710f864b0399b0d97616e0580ddd34c94cd10670efa4609cef5a000c3fc240abd06f36b11611117d78e5e2c3271dc7403d2a635ee01ea5e9e9a6482edb925cc15e33c0e82a5cf5548fa39b7ceed722a3127235e6223afbaa32cef3cff7f2845fa7851806e50abc4eb9bc9790079539d000000013d9bdac0ed1d761330cf680efdeb1a42159eb387d6d2950c96f7d28f61bbe2aa0000000700000000b2d05e00000000000000000000000001000000019a1bbbda9e4b27105d703258a17410680067d9210000000b000000000000000000000001000000019a1bbbda9e4b27105d703258a17410680067d9210000000b000000000000000000000001000000019a1bbbda9e4b27105d703258a17410680067d921000f4240000000010000000900000001ed1e26d73d8823720628ff36276d1db5e64d5d022ebad12ed71d69a5d1d6d7e712ed8c7e2c11a1d3de2c42aca66611889134d966bc7e5b767d4b925b10b2043c004c613725'
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
      // console.log(tx.toJson());
      tx.type.should.equal(TransactionType.AddPermissionlessValidator);
      // TODO(CR-1073): continue testing
      const txHex = tx.toBroadcastFormat();
      console.log('unsigned txHex');
      console.log(txHex);

      const privateKey = recoveryMode
        ? testData.BUILD_AND_SIGN_ADD_VALIDATOR_SAMPLE.backupPrivateKey
        : testData.BUILD_AND_SIGN_ADD_VALIDATOR_SAMPLE.userPrivateKey;

      const params = {
        txPrebuild: {
          txHex: txHex,
        },
        prv: privateKey,
      };

      const halfSignedTransaction = await basecoin.signTransaction(params);
      const halfSignedTxHex = (halfSignedTransaction as HalfSignedAccountTransaction)?.halfSigned?.txHex;
      const txBuilderRaw2 = new AvaxpLib.TransactionBuilderFactory(coins.get('tavaxp')).from(halfSignedTxHex as string);

      const buildHalfSigned = await txBuilderRaw2.build();
      // console.log(txHex);
      // console.log(buildHalfSigned.toJson());
      console.log('halfSigned txHex');
      console.log(buildHalfSigned.toBroadcastFormat());
      console.log('\n' + halfSignedTxHex);
      // const txJson2 = tx.toJson();
      // txJson2.type.should.equal(TransactionType.AddPermissionlessValidator);
      // txHex.should.not.be.empty();
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
