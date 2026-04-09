import { KeyPair, CloseAtaBuilder } from '../../../src';
import should from 'should';
import * as testData from '../../resources/sol';
import { getBuilderFactory } from '../getBuilderFactory';

describe('Sol Close Associated Token Account Builder', () => {
  const factory = getBuilderFactory('sol');

  const account = new KeyPair(testData.associatedTokenAccounts.accounts[0]).getKeys();
  const wrongAccount = new KeyPair({ prv: testData.prvKeys.prvKey1.base58 }).getKeys();

  // The ATA of account[0] for sol:usdc
  const ataAddress = testData.associatedTokenAccounts.accounts[0].ata;
  const ownerAddress = testData.associatedTokenAccounts.accounts[0].pub;
  const recentBlockHash = 'GHtXQBsoZHVnNFa9YevAzFr17DJjgHXk3ycTKD5xD3Zi';

  const closeAtaBuilder = () => {
    const txBuilder = factory.getCloseAtaInitializationBuilder();
    txBuilder.nonce(recentBlockHash);
    txBuilder.sender(ownerAddress);
    txBuilder.accountAddress(ataAddress);
    txBuilder.destinationAddress(ownerAddress);
    txBuilder.authorityAddress(ownerAddress);
    return txBuilder;
  };

  describe('Build and sign', () => {
    describe('Succeed', () => {
      it('should build an unsigned close ATA transaction', async () => {
        const txBuilder = closeAtaBuilder();
        const tx = await txBuilder.build();
        const rawTx = tx.toBroadcastFormat();

        should.exist(rawTx);
        tx.inputs.length.should.equal(0);
        tx.outputs.length.should.equal(0);

        const instructions = tx.toJson().instructionsData;
        const closeInstruction = instructions.find((i) => i.type === 'CloseAssociatedTokenAccount');
        should.exist(closeInstruction);
        closeInstruction.params.accountAddress.should.equal(ataAddress);
        closeInstruction.params.destinationAddress.should.equal(ownerAddress);
        closeInstruction.params.authorityAddress.should.equal(ownerAddress);
      });

      it('should build a signed close ATA transaction', async () => {
        const txBuilder = closeAtaBuilder();
        txBuilder.sign({ key: account.prv });
        const tx = await txBuilder.build();
        const rawTx = tx.toBroadcastFormat();

        should.exist(rawTx);
        const instructions = tx.toJson().instructionsData;
        const closeInstruction = instructions.find((i) => i.type === 'CloseAssociatedTokenAccount');
        should.exist(closeInstruction);
      });

      it('should roundtrip: build unsigned, then from() and sign', async () => {
        const txBuilder = closeAtaBuilder();
        const tx = await txBuilder.build();
        const rawTx = tx.toBroadcastFormat();

        const txBuilder2 = factory.from(rawTx) as CloseAtaBuilder;
        txBuilder2.sign({ key: account.prv });
        const tx2 = await txBuilder2.build();
        const rawTx2 = tx2.toBroadcastFormat();

        should.exist(rawTx2);
        const instructions = tx2.toJson().instructionsData;
        const closeInstruction = instructions.find((i) => i.type === 'CloseAssociatedTokenAccount');
        should.exist(closeInstruction);
        closeInstruction.params.accountAddress.should.equal(ataAddress);
        closeInstruction.params.destinationAddress.should.equal(ownerAddress);
        closeInstruction.params.authorityAddress.should.equal(ownerAddress);
      });

      it('should build with a durable nonce', async () => {
        const nonceAccount = new KeyPair(testData.nonceAccount).getKeys();
        const txBuilder = closeAtaBuilder();
        txBuilder.nonce(recentBlockHash, {
          walletNonceAddress: nonceAccount.pub,
          authWalletAddress: ownerAddress,
        });
        const tx = await txBuilder.build();

        should.exist(tx.toBroadcastFormat());
        const json = tx.toJson();
        should.exist(json.durableNonce);
        json.durableNonce!.walletNonceAddress.should.equal(nonceAccount.pub);
        json.durableNonce!.authWalletAddress.should.equal(ownerAddress);
      });
    });

    describe('explainTransaction', () => {
      it('should return ataClosures for a close ATA transaction', async () => {
        const txBuilder = closeAtaBuilder();
        const tx = await txBuilder.build();
        const explanation = tx.explainTransaction();

        explanation.type.should.equal('CloseAssociatedTokenAccount');
        should.exist(explanation.ataClosures);
        explanation.ataClosures!.length.should.equal(1);
        explanation.ataClosures![0].accountAddress.should.equal(ataAddress);
        explanation.ataClosures![0].destinationAddress.should.equal(ownerAddress);
        explanation.ataClosures![0].authorityAddress.should.equal(ownerAddress);
      });
    });

    describe('Fail', () => {
      it('should fail when accountAddress is the same as destinationAddress', async () => {
        const txBuilder = factory.getCloseAtaInitializationBuilder();
        txBuilder.nonce(recentBlockHash);
        txBuilder.sender(ownerAddress);
        txBuilder.accountAddress(ownerAddress);
        txBuilder.destinationAddress(ownerAddress);
        txBuilder.authorityAddress(ownerAddress);
        await txBuilder.build().should.be.rejectedWith(
          'Account address to close cannot be the same as the destination address'
        );
      });

      it('should fail when accountAddress is missing', async () => {
        const txBuilder = factory.getCloseAtaInitializationBuilder();
        txBuilder.nonce(recentBlockHash);
        txBuilder.sender(ownerAddress);
        txBuilder.destinationAddress(ownerAddress);
        txBuilder.authorityAddress(ownerAddress);
        await txBuilder.build().should.be.rejectedWith('Account Address must be set before building the transaction');
      });

      it('should fail when destinationAddress is missing', async () => {
        const txBuilder = factory.getCloseAtaInitializationBuilder();
        txBuilder.nonce(recentBlockHash);
        txBuilder.sender(ownerAddress);
        txBuilder.accountAddress(ataAddress);
        txBuilder.authorityAddress(ownerAddress);
        await txBuilder.build().should.be.rejectedWith(
          'Destination Address must be set before building the transaction'
        );
      });

      it('should fail when authorityAddress is missing', async () => {
        const txBuilder = factory.getCloseAtaInitializationBuilder();
        txBuilder.nonce(recentBlockHash);
        txBuilder.sender(ownerAddress);
        txBuilder.accountAddress(ataAddress);
        txBuilder.destinationAddress(ownerAddress);
        await txBuilder.build().should.be.rejectedWith('Authority Address must be set before building the transaction');
      });

      it('should fail when nonce is missing', async () => {
        const txBuilder = factory.getCloseAtaInitializationBuilder();
        txBuilder.sender(ownerAddress);
        txBuilder.accountAddress(ataAddress);
        txBuilder.destinationAddress(ownerAddress);
        txBuilder.authorityAddress(ownerAddress);
        await txBuilder.build().should.be.rejectedWith('Invalid transaction: missing nonce blockhash');
      });

      it('should fail when sender is missing', async () => {
        const txBuilder = factory.getCloseAtaInitializationBuilder();
        txBuilder.nonce(recentBlockHash);
        txBuilder.accountAddress(ataAddress);
        txBuilder.destinationAddress(ownerAddress);
        txBuilder.authorityAddress(ownerAddress);
        await txBuilder.build().should.be.rejectedWith('Invalid transaction: missing sender');
      });

      it('should fail when accountAddress is invalid', () => {
        const txBuilder = factory.getCloseAtaInitializationBuilder();
        should(() => txBuilder.accountAddress('invalid-address')).throwError(
          'Invalid or missing accountAddress, got: invalid-address'
        );
      });

      it('should fail when destinationAddress is invalid', () => {
        const txBuilder = factory.getCloseAtaInitializationBuilder();
        should(() => txBuilder.destinationAddress('invalid-address')).throwError(
          'Invalid or missing destinationAddress, got: invalid-address'
        );
      });

      it('should fail when authorityAddress is invalid', () => {
        const txBuilder = factory.getCloseAtaInitializationBuilder();
        should(() => txBuilder.authorityAddress('invalid-address')).throwError(
          'Invalid or missing authorityAddress, got: invalid-address'
        );
      });

      it('should fail to sign with incorrect key', async () => {
        const txBuilder = closeAtaBuilder();
        txBuilder.sign({ key: wrongAccount.prv });
        await txBuilder.build().should.be.rejectedWith('unknown signer: CP5Dpaa42RtJmMuKqCQsLwma5Yh3knuvKsYDFX85F41S');
      });

      it('should not sign twice with the same key', async () => {
        const txBuilder = closeAtaBuilder();
        txBuilder.sign({ key: account.prv });
        should(() => txBuilder.sign({ key: account.prv })).throwError('Duplicated signer: ' + account.prv?.toString());
      });
    });
  });

  describe('From and sign', () => {
    it('should build from the existing close ATA raw transaction', async () => {
      const txBuilder = factory.from(testData.TRANSFER_UNSIGNED_TX_CLOSE_ATA);
      should.exist(txBuilder);
      // Verify it decodes as CloseAssociatedTokenAccount
      const tx = await txBuilder.build();
      const explanation = tx.explainTransaction();
      explanation.type.should.equal('CloseAssociatedTokenAccount');
    });
  });
});
