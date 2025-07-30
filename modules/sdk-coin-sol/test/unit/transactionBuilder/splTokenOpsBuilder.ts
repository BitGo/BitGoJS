import { getBuilderFactory } from '../getBuilderFactory';
import { KeyPair, Utils } from '../../../src';
import should from 'should';
import * as testData from '../../resources/sol';
import { TransactionType } from '@bitgo/sdk-core';

describe('Sol SPL Token Ops Builder', () => {
  const factory = getBuilderFactory('tsol');
  const authAccount = new KeyPair(testData.authAccount).getKeys();
  const otherAccount = new KeyPair({ prv: testData.prvKeys.prvKey1.base58 }).getKeys();
  const recentBlockHash = 'GHtXQBsoZHVnNFa9YevAzFr17DJjgHXk3ycTKD5xD3Zi';
  const amount = '1000000';
  const nameUSDC = testData.tokenTransfers.nameUSDC;
  const mintUSDC = testData.tokenTransfers.mintUSDC;

  describe('Succeed', () => {
    it('should build a mint operation transaction', async () => {
      const txBuilder = factory.getSplTokenOpsBuilder();
      txBuilder.nonce(recentBlockHash);
      txBuilder.sender(authAccount.pub);
      txBuilder.mint({
        mintAddress: mintUSDC,
        destinationAddress: otherAccount.pub,
        authorityAddress: authAccount.pub,
        amount: amount,
        tokenName: nameUSDC,
      });
      txBuilder.setPriorityFee({ amount: 5000 });

      const tx = await txBuilder.build();
      tx.type.should.equal(TransactionType.Send);

      const txJson = tx.toJson();
      txJson.instructionsData.length.should.equal(2);
      txJson.instructionsData[0].type.should.equal('SetPriorityFee');
      txJson.instructionsData[1].type.should.equal('MintTo');
      txJson.instructionsData[1].params.should.deepEqual({
        mintAddress: mintUSDC,
        destinationAddress: otherAccount.pub,
        authorityAddress: authAccount.pub,
        amount: amount,
        tokenName: nameUSDC,
        programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
        decimalPlaces: undefined,
      });

      const rawTx = tx.toBroadcastFormat();
      should.equal(Utils.isValidRawTransaction(rawTx), true);
    });

    it('should build a burn operation transaction', async () => {
      const txBuilder = factory.getSplTokenOpsBuilder();
      txBuilder.nonce(recentBlockHash);
      txBuilder.sender(authAccount.pub);
      txBuilder.burn({
        mintAddress: mintUSDC,
        accountAddress: otherAccount.pub,
        authorityAddress: authAccount.pub,
        amount: amount,
        tokenName: nameUSDC,
      });
      txBuilder.setPriorityFee({ amount: 5000 });

      const tx = await txBuilder.build();
      tx.type.should.equal(TransactionType.Send);

      const txJson = tx.toJson();
      txJson.instructionsData.length.should.equal(2);
      txJson.instructionsData[0].type.should.equal('SetPriorityFee');
      txJson.instructionsData[1].type.should.equal('Burn');
      txJson.instructionsData[1].params.should.deepEqual({
        mintAddress: mintUSDC,
        accountAddress: otherAccount.pub,
        authorityAddress: authAccount.pub,
        amount: amount,
        tokenName: nameUSDC,
        programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
        decimalPlaces: undefined,
      });

      const rawTx = tx.toBroadcastFormat();
      should.equal(Utils.isValidRawTransaction(rawTx), true);
    });

    it('should build a mixed mint and burn operations transaction', async () => {
      const txBuilder = factory.getSplTokenOpsBuilder();
      txBuilder.nonce(recentBlockHash);
      txBuilder.sender(authAccount.pub);

      // Add mint operation
      txBuilder.mint({
        mintAddress: mintUSDC,
        destinationAddress: otherAccount.pub,
        authorityAddress: authAccount.pub,
        amount: amount,
        tokenName: nameUSDC,
      });

      // Add burn operation
      txBuilder.burn({
        mintAddress: mintUSDC,
        accountAddress: authAccount.pub,
        authorityAddress: authAccount.pub,
        amount: '500000',
        tokenName: nameUSDC,
      });

      txBuilder.setPriorityFee({ amount: 5000 });

      const tx = await txBuilder.build();
      tx.type.should.equal(TransactionType.Send);

      const txJson = tx.toJson();
      txJson.instructionsData.length.should.equal(3);
      txJson.instructionsData[0].type.should.equal('SetPriorityFee');
      txJson.instructionsData[1].type.should.equal('MintTo');
      txJson.instructionsData[1].params.should.deepEqual({
        mintAddress: mintUSDC,
        destinationAddress: otherAccount.pub,
        authorityAddress: authAccount.pub,
        amount: amount,
        tokenName: nameUSDC,
        programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
        decimalPlaces: undefined,
      });
      txJson.instructionsData[2].type.should.equal('Burn');
      txJson.instructionsData[2].params.should.deepEqual({
        mintAddress: mintUSDC,
        accountAddress: authAccount.pub,
        authorityAddress: authAccount.pub,
        amount: '500000',
        tokenName: nameUSDC,
        programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
        decimalPlaces: undefined,
      });

      const rawTx = tx.toBroadcastFormat();
      should.equal(Utils.isValidRawTransaction(rawTx), true);
    });

    it('should build operations using generic addOperation method', async () => {
      const txBuilder = factory.getSplTokenOpsBuilder();
      txBuilder.nonce(recentBlockHash);
      txBuilder.sender(authAccount.pub);

      txBuilder.addOperation({
        type: 'mint',
        mintAddress: mintUSDC,
        destinationAddress: otherAccount.pub,
        authorityAddress: authAccount.pub,
        amount: amount,
        tokenName: nameUSDC,
      });

      txBuilder.addOperation({
        type: 'burn',
        mintAddress: mintUSDC,
        accountAddress: authAccount.pub,
        authorityAddress: authAccount.pub,
        amount: '250000',
        tokenName: nameUSDC,
      });

      const tx = await txBuilder.build();
      tx.type.should.equal(TransactionType.Send);

      const txJson = tx.toJson();
      txJson.instructionsData.length.should.equal(2);
      txJson.instructionsData[0].type.should.equal('MintTo');
      txJson.instructionsData[1].type.should.equal('Burn');

      const rawTx = tx.toBroadcastFormat();
      should.equal(Utils.isValidRawTransaction(rawTx), true);
    });

    it('should work with token name only (without explicit mint address)', async () => {
      const txBuilder = factory.getSplTokenOpsBuilder();
      txBuilder.nonce(recentBlockHash);
      txBuilder.sender(authAccount.pub);

      txBuilder.mint({
        tokenName: nameUSDC,
        destinationAddress: otherAccount.pub,
        authorityAddress: authAccount.pub,
        amount: amount,
      });

      const tx = await txBuilder.build();
      tx.type.should.equal(TransactionType.Send);

      const txJson = tx.toJson();
      txJson.instructionsData.length.should.equal(1);
      txJson.instructionsData[0].type.should.equal('MintTo');
      txJson.instructionsData[0].params.mintAddress.should.equal(mintUSDC);

      const rawTx = tx.toBroadcastFormat();
      should.equal(Utils.isValidRawTransaction(rawTx), true);
    });
  });

  describe('Build and sign', () => {
    it('should build and sign a mint operation transaction', async () => {
      const txBuilder = factory.getSplTokenOpsBuilder();
      txBuilder.nonce(recentBlockHash);
      txBuilder.sender(authAccount.pub);
      txBuilder.mint({
        mintAddress: mintUSDC,
        destinationAddress: otherAccount.pub,
        authorityAddress: authAccount.pub,
        amount: amount,
        tokenName: nameUSDC,
      });
      txBuilder.sign({ key: authAccount.prv });

      const tx = await txBuilder.build();
      tx.type.should.equal(TransactionType.Send);

      const rawTx = tx.toBroadcastFormat();
      should.equal(Utils.isValidRawTransaction(rawTx, true, true), true);
    });

    it('should build and sign a mixed operations transaction', async () => {
      const txBuilder = factory.getSplTokenOpsBuilder();
      txBuilder.nonce(recentBlockHash);
      txBuilder.sender(authAccount.pub);

      txBuilder.mint({
        mintAddress: mintUSDC,
        destinationAddress: otherAccount.pub,
        authorityAddress: authAccount.pub,
        amount: amount,
        tokenName: nameUSDC,
      });

      txBuilder.burn({
        mintAddress: mintUSDC,
        accountAddress: authAccount.pub,
        authorityAddress: authAccount.pub,
        amount: '500000',
        tokenName: nameUSDC,
      });

      txBuilder.sign({ key: authAccount.prv });

      const tx = await txBuilder.build();

      // Should be a valid signed transaction
      const rawTx = tx.toBroadcastFormat();
      should.equal(Utils.isValidRawTransaction(rawTx, true, true), true);

      // Verify transaction structure
      const txJson = tx.toJson();
      txJson.instructionsData.length.should.equal(2);
      txJson.instructionsData[0].type.should.equal('MintTo');
      txJson.instructionsData[1].type.should.equal('Burn');
    });
  });

  describe('Fail', () => {
    it('should fail when no operations are provided', async () => {
      const txBuilder = factory.getSplTokenOpsBuilder();
      txBuilder.nonce(recentBlockHash);
      txBuilder.sender(authAccount.pub);

      await txBuilder.build().should.be.rejectedWith('At least one SPL token operation must be specified');
    });

    it('should fail with invalid operation type', () => {
      const txBuilder = factory.getSplTokenOpsBuilder();

      should(() =>
        txBuilder.addOperation({
          type: 'invalid' as any,
          mintAddress: mintUSDC,
          destinationAddress: otherAccount.pub,
          authorityAddress: authAccount.pub,
          amount: amount,
        })
      ).throwError('Operation type must be one of: mint, burn');
    });

    it('should fail mint operation without destination address', () => {
      const txBuilder = factory.getSplTokenOpsBuilder();

      should(() =>
        txBuilder.mint({
          mintAddress: mintUSDC,
          authorityAddress: authAccount.pub,
          amount: amount,
        } as any)
      ).throwError('Mint operation requires destinationAddress');
    });

    it('should fail burn operation without account address', () => {
      const txBuilder = factory.getSplTokenOpsBuilder();

      should(() =>
        txBuilder.burn({
          mintAddress: mintUSDC,
          authorityAddress: authAccount.pub,
          amount: amount,
        } as any)
      ).throwError('Burn operation requires accountAddress');
    });

    it('should fail with invalid amount', () => {
      const txBuilder = factory.getSplTokenOpsBuilder();

      should(() =>
        txBuilder.mint({
          mintAddress: mintUSDC,
          destinationAddress: otherAccount.pub,
          authorityAddress: authAccount.pub,
          amount: 'invalid',
        })
      ).throwError('Invalid amount: invalid');
    });

    it('should fail with invalid token name and no mint address', () => {
      const txBuilder = factory.getSplTokenOpsBuilder();

      should(() =>
        txBuilder.mint({
          tokenName: 'invalid-token',
          destinationAddress: otherAccount.pub,
          authorityAddress: authAccount.pub,
          amount: amount,
        })
      ).throwError('Invalid token name or missing mintAddress: invalid-token');
    });
  });
});
