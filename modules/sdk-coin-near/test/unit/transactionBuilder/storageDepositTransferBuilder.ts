import should from 'should';
import * as base58 from 'bs58';

import { BitGoAPI } from '@bitgo/sdk-api';
import { Eddsa, TransactionType } from '@bitgo/sdk-core';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { coins } from '@bitgo/statics';

import * as testData from '../../resources/near';
import { getBuilderFactory } from '../getBuilderFactory';

import { KeyPair, Nep141Token, TransactionBuilderFactory } from '../../../src';

describe('Near: Storage Deposit Transfer Builder', () => {
  const coinName = 'near:usdc';
  const coinNameTest = 'tnear:tnep24dp';
  let nep141Token: Nep141Token;
  let bitgo: TestBitGoAPI;

  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, {
      env: 'mock',
    });
    bitgo.initializeTestVars();
    Nep141Token.createTokenConstructors().forEach(({ name, coinConstructor }) => {
      bitgo.safeRegister(name, coinConstructor);
    });
    nep141Token = bitgo.coin(coinNameTest) as Nep141Token;
  });

  describe('Near storage deposit transfer builder', function () {
    const factory = new TransactionBuilderFactory(coins.get(coinNameTest));
    const factoryProd = new TransactionBuilderFactory(coins.get(coinName));
    const gas = '125000000000000';
    const deposit = '1250000000000000000000';

    const initTxBuilder = () => {
      const txBuilder = factory.getStorageDepositTransferBuilder();
      txBuilder.gas(gas);
      txBuilder.deposit(deposit);
      txBuilder.nonce(BigInt(1));
      txBuilder.receiverId(nep141Token.contractAddress);
      txBuilder.recentBlockHash(testData.blockHash.block1);
      return txBuilder;
    };

    describe('fungible token builder environment', function () {
      it('should select the right network', function () {
        should.equal(factory.getStorageDepositTransferBuilder().coinName(), coinNameTest);
        should.equal(factoryProd.getStorageDepositTransferBuilder().coinName(), coinName);
        // used type any to access protected properties
        const txBuilder: any = factory.getStorageDepositTransferBuilder();
        const txBuilderProd: any = factoryProd.getStorageDepositTransferBuilder();

        txBuilder._coinConfig.name.should.deepEqual(coinNameTest);
        txBuilderProd._coinConfig.name.should.deepEqual(coinName);
      });
    });

    describe('should build', function () {
      it('an unsigned storage deposit self transfer transaction', async () => {
        const builder = initTxBuilder();
        builder.sender(testData.accounts.account1.address, testData.accounts.account1.publicKey);
        const tx = await builder.build();
        should.equal(tx.type, TransactionType.StorageDeposit);
        tx.inputs.length.should.equal(0);
        tx.outputs.length.should.equal(0);
        const rawTx = tx.toBroadcastFormat();
        rawTx.should.deepEqual(testData.rawTx.selfStorageDeposit.unsigned);
      });

      it('a signed storage deposit self transfer transaction', async () => {
        const builder = initTxBuilder();
        builder.sender(testData.accounts.account1.address, testData.accounts.account1.publicKey);
        builder.sign({ key: testData.accounts.account1.secretKey });
        const tx = await builder.build();
        should.equal(tx.type, TransactionType.StorageDeposit);
        tx.inputs.length.should.equal(0);
        tx.outputs.length.should.equal(0);
        const rawTx = tx.toBroadcastFormat();
        rawTx.should.deepEqual(testData.rawTx.selfStorageDeposit.signed);
      });
    });

    it('an unsigned storage deposit transfer transaction', async () => {
      const builder = initTxBuilder();
      builder.sender(testData.accounts.account1.address, testData.accounts.account1.publicKey);
      builder.beneficiaryId(testData.accounts.account2.address);
      const tx = await builder.build();
      should.equal(tx.type, TransactionType.StorageDeposit);
      tx.inputs.length.should.equal(0);
      tx.outputs.length.should.equal(0);
      const rawTx = tx.toBroadcastFormat();
      rawTx.should.deepEqual(testData.rawTx.storageDeposit.unsigned);
    });

    it('a signed fungible token transfer with storage deposit transaction', async () => {
      const builder = initTxBuilder();
      builder.sender(testData.accounts.account1.address, testData.accounts.account1.publicKey);
      builder.beneficiaryId(testData.accounts.account2.address);
      builder.sign({ key: testData.accounts.account1.secretKey });
      const tx = await builder.build();
      should.equal(tx.type, TransactionType.StorageDeposit);
      tx.inputs.length.should.equal(0);
      tx.outputs.length.should.equal(0);
      const rawTx = tx.toBroadcastFormat();
      rawTx.should.deepEqual(testData.rawTx.storageDeposit.signed);
    });

    describe('add TSS signature', function () {
      let MPC: Eddsa;

      before('initialize mpc module', async () => {
        MPC = await Eddsa.initialize();
      });
      it('should add TSS signature', async () => {
        const factory = getBuilderFactory(coinNameTest);
        const A = MPC.keyShare(1, 2, 3);
        const B = MPC.keyShare(2, 2, 3);
        const C = MPC.keyShare(3, 2, 3);

        const A_combine = MPC.keyCombine(A.uShare, [B.yShares[1], C.yShares[1]]);
        const B_combine = MPC.keyCombine(B.uShare, [A.yShares[2], C.yShares[2]]);
        const C_combine = MPC.keyCombine(C.uShare, [A.yShares[3], B.yShares[3]]);

        const commonPub = A_combine.pShare.y;
        const nearKeyPair = new KeyPair({ pub: commonPub });
        const sender = nearKeyPair.getAddress();

        let txBuilder = initTxBuilder();
        txBuilder.sender(testData.accounts.account1.address, testData.accounts.account1.publicKey);
        const unsignedTransaction = await txBuilder.build();
        const signablePayload = unsignedTransaction.signablePayload;

        // signing with A and B
        let A_sign_share = MPC.signShare(signablePayload, A_combine.pShare, [A_combine.jShares[2]]);
        let B_sign_share = MPC.signShare(signablePayload, B_combine.pShare, [B_combine.jShares[1]]);
        let A_sign = MPC.sign(signablePayload, A_sign_share.xShare, [B_sign_share.rShares[1]], [C.yShares[1]]);
        let B_sign = MPC.sign(signablePayload, B_sign_share.xShare, [A_sign_share.rShares[2]], [C.yShares[2]]);
        // sign the message_buffer (unsigned txHex)
        let signature = MPC.signCombine([A_sign, B_sign]);
        let rawSignature = Buffer.concat([Buffer.from(signature.R, 'hex'), Buffer.from(signature.sigma, 'hex')]);
        txBuilder = initTxBuilder();
        txBuilder.sender(sender, commonPub);
        txBuilder.addSignature({ pub: nearKeyPair.getKeys().pub }, rawSignature);
        let signedTransaction = await txBuilder.build();
        signedTransaction.signature.length.should.equal(1);
        signedTransaction.signature[0].should.equal(base58.encode(rawSignature));

        // signing with A and C
        A_sign_share = MPC.signShare(signablePayload, A_combine.pShare, [A_combine.jShares[3]]);
        let C_sign_share = MPC.signShare(signablePayload, C_combine.pShare, [C_combine.jShares[1]]);
        A_sign = MPC.sign(signablePayload, A_sign_share.xShare, [C_sign_share.rShares[1]], [B.yShares[1]]);
        let C_sign = MPC.sign(signablePayload, C_sign_share.xShare, [A_sign_share.rShares[3]], [B.yShares[3]]);
        signature = MPC.signCombine([A_sign, C_sign]);
        rawSignature = Buffer.concat([Buffer.from(signature.R, 'hex'), Buffer.from(signature.sigma, 'hex')]);
        txBuilder = initTxBuilder();
        txBuilder.sender(sender, commonPub);
        txBuilder.addSignature({ pub: nearKeyPair.getKeys().pub }, rawSignature);
        signedTransaction = await txBuilder.build();
        signedTransaction.signature.length.should.equal(1);
        signedTransaction.signature[0].should.equal(base58.encode(rawSignature));

        // signing with B and C
        B_sign_share = MPC.signShare(signablePayload, B_combine.pShare, [B_combine.jShares[3]]);
        C_sign_share = MPC.signShare(signablePayload, C_combine.pShare, [C_combine.jShares[2]]);
        B_sign = MPC.sign(signablePayload, B_sign_share.xShare, [C_sign_share.rShares[2]], [A.yShares[2]]);
        C_sign = MPC.sign(signablePayload, C_sign_share.xShare, [B_sign_share.rShares[3]], [A.yShares[3]]);
        signature = MPC.signCombine([B_sign, C_sign]);
        rawSignature = Buffer.concat([Buffer.from(signature.R, 'hex'), Buffer.from(signature.sigma, 'hex')]);
        txBuilder = initTxBuilder();
        txBuilder.sender(sender, commonPub);
        txBuilder.addSignature({ pub: nearKeyPair.getKeys().pub }, rawSignature);
        signedTransaction = await txBuilder.build();
        signedTransaction.signature.length.should.equal(1);
        signedTransaction.signature[0].should.equal(base58.encode(rawSignature));

        const rebuiltTransaction = await factory.from(signedTransaction.toBroadcastFormat()).build();

        rebuiltTransaction.signature[0].should.equal(base58.encode(rawSignature));
      });
    });
  });
});
