import { KeyPair, Utils } from '../../../src';
import { CloseAtaBuilder } from '../../../src/lib/closeAtaBuilder';
import should from 'should';
import * as testData from '../../resources/sol';
import { TransactionType } from '@bitgo/sdk-core';
import { getBuilderFactory } from '../getBuilderFactory';
import { InstructionBuilderTypes } from '../../../src/lib/constants';

describe('Sol Close ATA Builder', () => {
  const factory = getBuilderFactory('tsol');
  const recentBlockHash = 'GHtXQBsoZHVnNFa9YevAzFr17DJjgHXk3ycTKD5xD3Zi';

  const account = new KeyPair(testData.authAccount).getKeys();
  const nonceAccount = new KeyPair(testData.nonceAccount).getKeys();
  const account2 = new KeyPair(testData.authAccount2).getKeys();

  // ATA addresses (valid Solana addresses from test fixtures)
  const ataAddress1 = nonceAccount.pub;
  const ataAddress2 = account2.pub;
  const destinationAddress = account.pub;

  const closeAtaBuilder = () => {
    const txBuilder = factory.getCloseAtaInitializationBuilder();
    txBuilder.nonce(recentBlockHash);
    txBuilder.sender(account.pub);
    return txBuilder;
  };

  describe('Single ATA close (backward compatible)', () => {
    describe('Succeed', () => {
      it('build a single close ATA tx unsigned', async () => {
        const txBuilder = closeAtaBuilder();
        txBuilder.accountAddress(ataAddress1);
        txBuilder.destinationAddress(destinationAddress);
        txBuilder.authorityAddress(account.pub);

        const tx = await txBuilder.build();
        tx.type.should.equal(TransactionType.CloseAssociatedTokenAccount);

        const rawTx = tx.toBroadcastFormat();
        should.equal(Utils.isValidRawTransaction(rawTx), true);

        const instructions = tx.toJson().instructionsData;
        instructions.length.should.equal(1);
        instructions[0].type.should.equal(InstructionBuilderTypes.CloseAssociatedTokenAccount);
        instructions[0].params.accountAddress.should.equal(ataAddress1);
        instructions[0].params.destinationAddress.should.equal(destinationAddress);
        instructions[0].params.authorityAddress.should.equal(account.pub);
      });

      it('build a single close ATA tx signed', async () => {
        const txBuilder = closeAtaBuilder();
        txBuilder.accountAddress(ataAddress1);
        txBuilder.destinationAddress(destinationAddress);
        txBuilder.authorityAddress(account.pub);
        txBuilder.sign({ key: account.prv });

        const tx = await txBuilder.build();
        tx.type.should.equal(TransactionType.CloseAssociatedTokenAccount);

        const rawTx = tx.toBroadcastFormat();
        should.equal(Utils.isValidRawTransaction(rawTx), true);
      });

      it('build a single close ATA tx with durable nonce', async () => {
        const txBuilder = closeAtaBuilder();
        txBuilder.nonce(recentBlockHash, {
          walletNonceAddress: nonceAccount.pub,
          authWalletAddress: account.pub,
        });
        txBuilder.accountAddress(ataAddress2);
        txBuilder.destinationAddress(destinationAddress);
        txBuilder.authorityAddress(account.pub);

        const tx = await txBuilder.build();
        tx.type.should.equal(TransactionType.CloseAssociatedTokenAccount);

        const rawTx = tx.toBroadcastFormat();
        should.equal(Utils.isValidRawTransaction(rawTx), true);
      });
    });

    describe('Fail', () => {
      it('should fail when account address is not set', async () => {
        const txBuilder = closeAtaBuilder();
        txBuilder.destinationAddress(destinationAddress);
        txBuilder.authorityAddress(account.pub);

        await txBuilder.build().should.rejectedWith('Account Address must be set before building the transaction');
      });

      it('should fail when destination address is not set', async () => {
        const txBuilder = closeAtaBuilder();
        txBuilder.accountAddress(ataAddress1);
        txBuilder.authorityAddress(account.pub);

        await txBuilder.build().should.rejectedWith('Destination Address must be set before building the transaction');
      });

      it('should fail when authority address is not set', async () => {
        const txBuilder = closeAtaBuilder();
        txBuilder.accountAddress(ataAddress1);
        txBuilder.destinationAddress(destinationAddress);

        await txBuilder.build().should.rejectedWith('Authority Address must be set before building the transaction');
      });

      it('should fail when account address equals destination address', async () => {
        const txBuilder = closeAtaBuilder();
        txBuilder.accountAddress(destinationAddress);
        txBuilder.destinationAddress(destinationAddress);
        txBuilder.authorityAddress(account.pub);

        await txBuilder
          .build()
          .should.rejectedWith('Account address to close cannot be the same as the destination address');
      });

      it('should fail with invalid account address', () => {
        const txBuilder = closeAtaBuilder();
        should(() => txBuilder.accountAddress('invalidAddress')).throwError();
      });

      it('should fail with invalid destination address', () => {
        const txBuilder = closeAtaBuilder();
        should(() => txBuilder.destinationAddress('invalidAddress')).throwError();
      });

      it('should fail with invalid authority address', () => {
        const txBuilder = closeAtaBuilder();
        should(() => txBuilder.authorityAddress('invalidAddress')).throwError();
      });

      it('should fail when nonce is not provided', async () => {
        const txBuilder = factory.getCloseAtaInitializationBuilder();
        txBuilder.sender(account.pub);
        txBuilder.accountAddress(ataAddress1);
        txBuilder.destinationAddress(destinationAddress);
        txBuilder.authorityAddress(account.pub);

        await txBuilder.build().should.rejectedWith('Invalid transaction: missing nonce blockhash');
      });

      it('should fail when sender is not provided', async () => {
        const txBuilder = factory.getCloseAtaInitializationBuilder();
        txBuilder.nonce(recentBlockHash);
        txBuilder.accountAddress(ataAddress1);
        txBuilder.destinationAddress(destinationAddress);
        txBuilder.authorityAddress(account.pub);

        await txBuilder.build().should.rejectedWith('Invalid transaction: missing sender');
      });
    });
  });

  describe('Bulk ATA close (addCloseAtaInstruction)', () => {
    describe('Succeed', () => {
      it('build a bulk close ATA tx with multiple ATAs unsigned', async () => {
        const txBuilder = closeAtaBuilder();
        txBuilder.addCloseAtaInstruction(ataAddress1, destinationAddress, account.pub);
        txBuilder.addCloseAtaInstruction(ataAddress2, destinationAddress, account.pub);

        const tx = await txBuilder.build();
        tx.type.should.equal(TransactionType.CloseAssociatedTokenAccount);

        const rawTx = tx.toBroadcastFormat();
        should.equal(Utils.isValidRawTransaction(rawTx), true);

        const instructions = tx.toJson().instructionsData;
        instructions.length.should.equal(2);

        instructions[0].type.should.equal(InstructionBuilderTypes.CloseAssociatedTokenAccount);
        instructions[0].params.accountAddress.should.equal(ataAddress1);
        instructions[0].params.destinationAddress.should.equal(destinationAddress);
        instructions[0].params.authorityAddress.should.equal(account.pub);

        instructions[1].type.should.equal(InstructionBuilderTypes.CloseAssociatedTokenAccount);
        instructions[1].params.accountAddress.should.equal(ataAddress2);
        instructions[1].params.destinationAddress.should.equal(destinationAddress);
        instructions[1].params.authorityAddress.should.equal(account.pub);
      });

      it('build a bulk close ATA tx signed', async () => {
        const txBuilder = closeAtaBuilder();
        txBuilder.addCloseAtaInstruction(ataAddress1, destinationAddress, account.pub);
        txBuilder.addCloseAtaInstruction(ataAddress2, destinationAddress, account.pub);
        txBuilder.sign({ key: account.prv });

        const tx = await txBuilder.build();
        tx.type.should.equal(TransactionType.CloseAssociatedTokenAccount);

        const rawTx = tx.toBroadcastFormat();
        should.equal(Utils.isValidRawTransaction(rawTx), true);

        const instructions = tx.toJson().instructionsData;
        instructions.length.should.equal(2);
      });

      it('build a single close using addCloseAtaInstruction', async () => {
        const txBuilder = closeAtaBuilder();
        txBuilder.addCloseAtaInstruction(ataAddress1, destinationAddress, account.pub);

        const tx = await txBuilder.build();
        tx.type.should.equal(TransactionType.CloseAssociatedTokenAccount);

        const instructions = tx.toJson().instructionsData;
        instructions.length.should.equal(1);
        instructions[0].params.accountAddress.should.equal(ataAddress1);
      });

      it('all close instructions have same destination (root wallet)', async () => {
        const txBuilder = closeAtaBuilder();
        txBuilder.addCloseAtaInstruction(ataAddress1, destinationAddress, account.pub);
        txBuilder.addCloseAtaInstruction(ataAddress2, destinationAddress, account.pub);

        const tx = await txBuilder.build();
        const instructions = tx.toJson().instructionsData;

        for (const instruction of instructions) {
          instruction.params.destinationAddress.should.equal(destinationAddress);
        }
      });
    });

    describe('Fail', () => {
      it('should fail with duplicate ATA address', () => {
        const txBuilder = closeAtaBuilder();
        txBuilder.addCloseAtaInstruction(ataAddress1, destinationAddress, account.pub);

        should(() => txBuilder.addCloseAtaInstruction(ataAddress1, destinationAddress, account.pub)).throwError(
          'Duplicate ATA address: ' + ataAddress1
        );
      });

      it('should fail when account equals destination', () => {
        const txBuilder = closeAtaBuilder();

        should(() => txBuilder.addCloseAtaInstruction(destinationAddress, destinationAddress, account.pub)).throwError(
          'Account address to close cannot be the same as the destination address'
        );
      });

      it('should fail with invalid account address', () => {
        const txBuilder = closeAtaBuilder();
        should(() => txBuilder.addCloseAtaInstruction('invalid', destinationAddress, account.pub)).throwError();
      });

      it('should fail with invalid destination address', () => {
        const txBuilder = closeAtaBuilder();
        should(() => txBuilder.addCloseAtaInstruction(ataAddress1, 'invalid', account.pub)).throwError();
      });

      it('should fail with invalid authority address', () => {
        const txBuilder = closeAtaBuilder();
        should(() => txBuilder.addCloseAtaInstruction(ataAddress1, destinationAddress, 'invalid')).throwError();
      });
    });
  });

  describe('Mixing single-ATA and bulk APIs', () => {
    const mixErrorMessage = /Cannot mix single-ATA API .* with bulk-ATA API/;

    it('should throw when single-ATA setter is called after addCloseAtaInstruction (accountAddress)', () => {
      const txBuilder = closeAtaBuilder();
      txBuilder.addCloseAtaInstruction(ataAddress1, destinationAddress, account.pub);
      should(() => txBuilder.accountAddress(ataAddress2)).throw(mixErrorMessage);
    });

    it('should throw when single-ATA setter is called after addCloseAtaInstruction (destinationAddress)', () => {
      const txBuilder = closeAtaBuilder();
      txBuilder.addCloseAtaInstruction(ataAddress1, destinationAddress, account.pub);
      should(() => txBuilder.destinationAddress(account2.pub)).throw(mixErrorMessage);
    });

    it('should throw when single-ATA setter is called after addCloseAtaInstruction (authorityAddress)', () => {
      const txBuilder = closeAtaBuilder();
      txBuilder.addCloseAtaInstruction(ataAddress1, destinationAddress, account.pub);
      should(() => txBuilder.authorityAddress(account2.pub)).throw(mixErrorMessage);
    });

    it('should throw when addCloseAtaInstruction is called after single-ATA setter', () => {
      const txBuilder = closeAtaBuilder();
      txBuilder.accountAddress(ataAddress1);
      should(() => txBuilder.addCloseAtaInstruction(ataAddress2, destinationAddress, account.pub)).throw(
        mixErrorMessage
      );
    });

    it('should not corrupt the first bulk entry when bulk-then-single is rejected', () => {
      const txBuilder = closeAtaBuilder();
      txBuilder.addCloseAtaInstruction(ataAddress1, destinationAddress, account.pub);
      try {
        txBuilder.accountAddress(ataAddress2);
      } catch {
        /* expected */
      }
      // First entry must still be intact after the rejected mix attempt.
      const entries = (txBuilder as unknown as { _closeAtaEntries: Array<{ accountAddress: string }> })
        ._closeAtaEntries;
      entries.length.should.equal(1);
      entries[0].accountAddress.should.equal(ataAddress1);
    });
  });

  describe('From raw transaction', () => {
    it('should parse a single close ATA tx from raw and rebuild', async () => {
      // Build a tx first
      const txBuilder = closeAtaBuilder();
      txBuilder.accountAddress(ataAddress1);
      txBuilder.destinationAddress(destinationAddress);
      txBuilder.authorityAddress(account.pub);

      const tx = await txBuilder.build();
      const rawTx = tx.toBroadcastFormat();

      // Parse from raw
      const rebuiltBuilder = factory.from(rawTx);
      const rebuiltTx = await rebuiltBuilder.build();

      rebuiltTx.type.should.equal(TransactionType.CloseAssociatedTokenAccount);

      const instructions = rebuiltTx.toJson().instructionsData;
      instructions.length.should.equal(1);
      instructions[0].type.should.equal(InstructionBuilderTypes.CloseAssociatedTokenAccount);
      instructions[0].params.accountAddress.should.equal(ataAddress1);
      instructions[0].params.destinationAddress.should.equal(destinationAddress);
      instructions[0].params.authorityAddress.should.equal(account.pub);
    });

    it('should parse a bulk close ATA tx from raw and rebuild', async () => {
      // Build a bulk tx first
      const txBuilder = closeAtaBuilder();
      txBuilder.addCloseAtaInstruction(ataAddress1, destinationAddress, account.pub);
      txBuilder.addCloseAtaInstruction(ataAddress2, destinationAddress, account.pub);

      const tx = await txBuilder.build();
      const rawTx = tx.toBroadcastFormat();

      // Parse from raw
      const rebuiltBuilder = factory.from(rawTx);
      const rebuiltTx = await rebuiltBuilder.build();

      rebuiltTx.type.should.equal(TransactionType.CloseAssociatedTokenAccount);

      const instructions = rebuiltTx.toJson().instructionsData;
      instructions.length.should.equal(2);
      instructions[0].params.accountAddress.should.equal(ataAddress1);
      instructions[1].params.accountAddress.should.equal(ataAddress2);
    });

    it('should reject legacy single-ATA setters on a parsed bulk close tx', async () => {
      const txBuilder = closeAtaBuilder();
      txBuilder.addCloseAtaInstruction(ataAddress1, destinationAddress, account.pub);
      txBuilder.addCloseAtaInstruction(ataAddress2, destinationAddress, account.pub);
      const rawTx = (await txBuilder.build()).toBroadcastFormat();

      const parsed = factory.from(rawTx) as CloseAtaBuilder;
      const mixErrorMessage = /Cannot mix single-ATA API .* with bulk-ATA API/;
      should(() => parsed.accountAddress(ataAddress1)).throw(mixErrorMessage);
      should(() => parsed.destinationAddress(destinationAddress)).throw(mixErrorMessage);
      should(() => parsed.authorityAddress(account.pub)).throw(mixErrorMessage);
    });

    it('should parse existing close ATA raw tx from test resources', async () => {
      const txnBuilder = factory.from(testData.TRANSFER_UNSIGNED_TX_CLOSE_ATA);
      should.exist(txnBuilder);

      const tx = await txnBuilder.build();
      tx.type.should.equal(TransactionType.CloseAssociatedTokenAccount);
    });
  });
});
