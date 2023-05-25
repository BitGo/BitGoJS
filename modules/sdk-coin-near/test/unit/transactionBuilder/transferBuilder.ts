import { getBuilderFactory } from '../getBuilderFactory';
import { KeyPair } from '../../../src';
import should from 'should';
import * as testData from '../../resources/near';
import { Eddsa, TransactionType } from '@bitgo/sdk-core';
import * as base58 from 'bs58';

describe('Near Transfer Builder', () => {
  const factory = getBuilderFactory('tnear');

  describe('Succeed', () => {
    it('build a transfer tx unsigned', async () => {
      const txBuilder = factory.getTransferBuilder();
      txBuilder.sender(testData.accounts.account1.address, testData.accounts.account1.publicKey);
      txBuilder.nonce(1);
      txBuilder.receiverId(testData.accounts.account2.address);
      txBuilder.recentBlockHash(testData.blockHash.block1);
      txBuilder.amount(testData.AMOUNT);
      const tx = await txBuilder.build();
      should.equal(tx.type, TransactionType.Send);

      tx.inputs.length.should.equal(1);
      tx.inputs[0].should.deepEqual({
        address: testData.accounts.account1.address,
        value: testData.AMOUNT,
        coin: 'tnear',
      });
      tx.outputs.length.should.equal(1);
      tx.outputs[0].should.deepEqual({
        address: testData.accounts.account2.address,
        value: testData.AMOUNT,
        coin: 'tnear',
      });
      const rawTx = tx.toBroadcastFormat();
      should.equal(rawTx, testData.rawTx.transfer.unsigned);
    });

    it('build a transfer tx signed', async () => {
      const txBuilder = factory.getTransferBuilder();
      txBuilder.sender(testData.accounts.account1.address, testData.accounts.account1.publicKey);
      txBuilder.nonce(1);
      txBuilder.receiverId(testData.accounts.account2.address);
      txBuilder.recentBlockHash(testData.blockHash.block1);
      txBuilder.amount(testData.AMOUNT);
      txBuilder.sign({ key: testData.accounts.account1.secretKey });
      const tx = await txBuilder.build();
      should.equal(tx.type, TransactionType.Send);

      tx.inputs.length.should.equal(1);
      tx.inputs[0].should.deepEqual({
        address: testData.accounts.account1.address,
        value: testData.AMOUNT,
        coin: 'tnear',
      });
      tx.outputs.length.should.equal(1);
      tx.outputs[0].should.deepEqual({
        address: testData.accounts.account2.address,
        value: testData.AMOUNT,
        coin: 'tnear',
      });
      const txBroadcast = tx.toBroadcastFormat();
      should.equal(txBroadcast, testData.rawTx.transfer.signed);
    });
  });

  describe('add TSS signature', function () {
    let MPC: Eddsa;

    before('initialize mpc module', async () => {
      MPC = await Eddsa.initialize();
    });
    it('should add TSS signature', async () => {
      const factory = getBuilderFactory('tnear');
      const A = MPC.keyShare(1, 2, 3);
      const B = MPC.keyShare(2, 2, 3);
      const C = MPC.keyShare(3, 2, 3);

      const A_combine = MPC.keyCombine(A.uShare, [B.yShares[1], C.yShares[1]]);
      const B_combine = MPC.keyCombine(B.uShare, [A.yShares[2], C.yShares[2]]);
      const C_combine = MPC.keyCombine(C.uShare, [A.yShares[3], B.yShares[3]]);

      const commonPub = A_combine.pShare.y;
      const nearKeyPair = new KeyPair({ pub: commonPub });
      const sender = nearKeyPair.getAddress();

      let txBuilder = factory.getTransferBuilder();
      txBuilder.sender(testData.accounts.account1.address, testData.accounts.account1.publicKey);
      txBuilder.nonce(1);
      txBuilder.receiverId(testData.accounts.account2.address);
      txBuilder.recentBlockHash(testData.blockHash.block1);
      txBuilder.amount(testData.AMOUNT);
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
      txBuilder = factory.getTransferBuilder();
      txBuilder.sender(sender, commonPub);
      txBuilder.nonce(1);
      txBuilder.receiverId(testData.accounts.account2.address);
      txBuilder.recentBlockHash(testData.blockHash.block1);
      txBuilder.amount(testData.AMOUNT);
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
      txBuilder = factory.getTransferBuilder();
      txBuilder.sender(sender, commonPub);
      txBuilder.nonce(1);
      txBuilder.receiverId(testData.accounts.account2.address);
      txBuilder.recentBlockHash(testData.blockHash.block1);
      txBuilder.amount(testData.AMOUNT);
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
      txBuilder = factory.getTransferBuilder();
      txBuilder.sender(sender, commonPub);
      txBuilder.nonce(1);
      txBuilder.receiverId(testData.accounts.account2.address);
      txBuilder.recentBlockHash(testData.blockHash.block1);
      txBuilder.amount(testData.AMOUNT);
      txBuilder.addSignature({ pub: nearKeyPair.getKeys().pub }, rawSignature);
      signedTransaction = await txBuilder.build();
      signedTransaction.signature.length.should.equal(1);
      signedTransaction.signature[0].should.equal(base58.encode(rawSignature));

      const rebuiltTransaction = await factory.from(signedTransaction.toBroadcastFormat()).build();

      rebuiltTransaction.signature[0].should.equal(base58.encode(rawSignature));
    });
  });
});
