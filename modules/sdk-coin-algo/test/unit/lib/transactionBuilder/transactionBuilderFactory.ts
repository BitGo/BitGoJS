import should from 'should';
import { TransactionType } from '@bitgo/sdk-core';
import { coins } from '@bitgo/statics';

import { TransactionBuilderFactory, TransferBuilder, KeyRegistrationBuilder, algoUtils } from '../../../../src/lib';
import * as AlgoResources from '../../../fixtures/resources';
describe('Algo Transaction Builder Factory', () => {
  const factory = new TransactionBuilderFactory(coins.get('algo'));
  const { rawTx } = AlgoResources;

  it('should parse a key registration txn and return a key registration builder', () => {
    should(factory.from(rawTx.keyReg.unsigned)).instanceOf(KeyRegistrationBuilder);
    should(factory.from(rawTx.keyReg.signed)).instanceOf(KeyRegistrationBuilder);
  });

  it('should parse a transfer txn and return a transfer builder', () => {
    should(factory.from(rawTx.transfer.unsigned)).instanceOf(TransferBuilder);
    should(factory.from(rawTx.transfer.signed)).instanceOf(TransferBuilder);
  });

  it('should parse a asset transfer txn and return a asset transfer builder', () => {
    should(factory.from(rawTx.transfer.unsigned)).instanceOf(TransferBuilder);
    should(factory.from(rawTx.transfer.signed)).instanceOf(TransferBuilder);
  });

  describe('serialized transactions', () => {
    it('a non signed keyreg transaction from serialized', async () => {
      const builder = factory.from(AlgoResources.rawTx.keyReg.unsigned);
      builder.numberOfRequiredSigners(1).sign({ key: AlgoResources.accounts.account1.prvKey });
      const tx = await builder.build();
      should.equal(tx.type, TransactionType.WalletInitialization);
      should.equal(Buffer.from(tx.toBroadcastFormat()).toString('hex'), AlgoResources.rawTx.keyReg.signed);
    });

    it('a signed keyreg transaction from serialized', async () => {
      const builder = factory.from(AlgoResources.rawTx.keyReg.signed);
      const tx = await builder.build();
      should.equal(tx.type, TransactionType.WalletInitialization);
      should.equal(Buffer.from(tx.toBroadcastFormat()).toString('hex'), AlgoResources.rawTx.keyReg.signed);
    });

    it('a non signed keyreg transaction serialized with old sdk', async () => {
      const decodedTx = algoUtils.decodeAlgoTxn(AlgoResources.rawTx.keyReg.oldSdkUnsigned);
      should.equal(Buffer.from(decodedTx.rawTransaction).toString('base64'), AlgoResources.rawTx.keyReg.oldSdkUnsigned);
    });

    it('second non signed keyreg transaction serialized with old sdk', () => {
      const tx = algoUtils.decodeAlgoTxn(AlgoResources.rawTx.keyReg.oldSdkUnsigned2);
      should.equal(tx.txn.type, 'keyreg');
      should.equal(tx.txn.fee, 1000);
      should.equal(tx.txn.voteFirst, 1);
      should.equal(tx.txn.voteLast, 6000001);
      should.equal(tx.txn.voteKeyDilution, 10000);
      should.equal(tx.signed, false);
    });

    it('a signed keyreg transaction serialized with old sdk', async () => {
      const decodedTx = algoUtils.decodeAlgoTxn(AlgoResources.rawTx.keyReg.oldSdkSigned);
      decodedTx.signed.should.be.true();
      decodedTx.txn.fee.should.equals(1050);
      decodedTx.txn.should.have.property('type');
      decodedTx.txn.type!.should.equals('keyreg');
      decodedTx.txn.should.have.property('nonParticipation');
      decodedTx.txn.nonParticipation!.should.be.true();
    });

    it('a multisigned transfer transaction from serialized', async () => {
      const builder = factory.from(AlgoResources.rawTx.transfer.multisig);
      const tx = await builder.build();
      should.equal(Buffer.from(tx.toBroadcastFormat()).toString('hex'), AlgoResources.rawTx.transfer.multisig);
      should.equal(tx.type, TransactionType.Send);
    });

    it('a signed transfer transaction from serialized', async () => {
      const builder = factory.from(AlgoResources.rawTx.transfer.signed);
      const tx = await builder.build();
      should.equal(Buffer.from(tx.toBroadcastFormat()).toString('hex'), AlgoResources.rawTx.transfer.signed);
      should.equal(tx.type, TransactionType.Send);
    });

    it('a halfsigned transfer transaction from serialized', async () => {
      const builder = factory.from(AlgoResources.rawTx.transfer.halfSigned);
      builder
        .numberOfRequiredSigners(2)
        .setSigners([AlgoResources.accounts.account1.address, AlgoResources.accounts.account3.address])
        .sign({ key: AlgoResources.accounts.account3.prvKey });

      const tx = await builder.build();
      should.equal(Buffer.from(tx.toBroadcastFormat()).toString('hex'), AlgoResources.rawTx.transfer.multisig);
      should.equal(tx.type, TransactionType.Send);
    });

    it('a unsigned transfer transaction from serialized', async () => {
      const builder = factory.from(AlgoResources.rawTx.transfer.unsigned);
      builder.numberOfRequiredSigners(1).sign({ key: AlgoResources.accounts.account1.prvKey });
      const tx = await builder.build();
      should.equal(Buffer.from(tx.toBroadcastFormat()).toString('hex'), AlgoResources.rawTx.transfer.signed);
      should.equal(tx.type, TransactionType.Send);
    });
  });
  it('an unsigned transfer transaction from serialized', async () => {
    const builder = factory.from(AlgoResources.rawTx.assetTransfer.unsigned);
    const tx = await builder.build();
    should.equal(Buffer.from(tx.toBroadcastFormat()).toString('hex'), AlgoResources.rawTx.assetTransfer.unsigned);
    should.equal(tx.type, TransactionType.Send);
  });
  it('a signed asset transfer transaction from serialized', async () => {
    const builder = factory.from(AlgoResources.rawTx.assetTransfer.signed);
    const tx = await builder.build();
    should.equal(Buffer.from(tx.toBroadcastFormat()).toString('hex'), AlgoResources.rawTx.assetTransfer.signed);
    should.equal(tx.type, TransactionType.Send);
  });
});
