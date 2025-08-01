import should from 'should';
import { SystemProgram, PublicKey, TransactionInstruction, ComputeBudgetProgram } from '@solana/web3.js';
import { getBuilderFactory } from '../getBuilderFactory';
import { KeyPair, Utils, Transaction } from '../../../src';
import * as testData from '../../resources/sol';

describe('Sol Custom Instruction Builder', () => {
  const factory = getBuilderFactory('tsol');

  const customInstructionBuilder = () => {
    const txBuilder = factory.getCustomInstructionBuilder();
    txBuilder.nonce(recentBlockHash);
    txBuilder.sender(authAccount.pub);
    return txBuilder;
  };

  const authAccount = new KeyPair(testData.authAccount).getKeys();
  const otherAccount = new KeyPair({ prv: testData.prvKeys.prvKey1.base58 }).getKeys();
  const recentBlockHash = 'GHtXQBsoZHVnNFa9YevAzFr17DJjgHXk3ycTKD5xD3Zi';
  const memo = 'test memo';

  describe('Succeed', () => {
    it('build a transaction with a single custom instruction', async () => {
      const transferInstruction = SystemProgram.transfer({
        fromPubkey: new PublicKey(authAccount.pub),
        toPubkey: new PublicKey(otherAccount.pub),
        lamports: 1000000,
      });

      const txBuilder = customInstructionBuilder();
      txBuilder.addCustomInstruction(transferInstruction);
      const tx = await txBuilder.build();

      tx.inputs.length.should.equal(1);
      tx.inputs[0].should.deepEqual({
        address: authAccount.pub,
        value: '1000000',
        coin: 'tsol',
      });
      tx.outputs.length.should.equal(1);
      tx.outputs[0].should.deepEqual({
        address: otherAccount.pub,
        value: '1000000',
        coin: 'tsol',
      });

      const rawTx = tx.toBroadcastFormat();
      should.equal(Utils.isValidRawTransaction(rawTx), true);
    });

    it('build a transaction with multiple custom instructions', async () => {
      const transferInstruction = SystemProgram.transfer({
        fromPubkey: new PublicKey(authAccount.pub),
        toPubkey: new PublicKey(otherAccount.pub),
        lamports: 1000000,
      });

      const priorityFeeInstruction = ComputeBudgetProgram.setComputeUnitPrice({
        microLamports: 1000,
      });

      const txBuilder = customInstructionBuilder();
      txBuilder.addCustomInstructions([transferInstruction, priorityFeeInstruction]);
      const tx = await txBuilder.build();

      tx.inputs.length.should.equal(1);
      tx.outputs.length.should.equal(1);

      const rawTx = tx.toBroadcastFormat();
      should.equal(Utils.isValidRawTransaction(rawTx), true);

      // Should have 2 instructions
      (tx as Transaction).solTransaction.instructions.should.have.length(2);
    });

    it('build a transaction with custom instruction and memo', async () => {
      const transferInstruction = SystemProgram.transfer({
        fromPubkey: new PublicKey(authAccount.pub),
        toPubkey: new PublicKey(otherAccount.pub),
        lamports: 1000000,
      });

      const txBuilder = customInstructionBuilder();
      txBuilder.addCustomInstruction(transferInstruction);
      txBuilder.memo(memo);
      const tx = await txBuilder.build();

      const rawTx = tx.toBroadcastFormat();
      should.equal(Utils.isValidRawTransaction(rawTx), true);

      // Should have instruction + memo
      (tx as Transaction).solTransaction.instructions.should.have.length(2);
    });

    it('build a signed transaction with custom instruction', async () => {
      const transferInstruction = SystemProgram.transfer({
        fromPubkey: new PublicKey(authAccount.pub),
        toPubkey: new PublicKey(otherAccount.pub),
        lamports: 1000000,
      });

      const txBuilder = customInstructionBuilder();
      txBuilder.addCustomInstruction(transferInstruction);
      txBuilder.sign({ key: authAccount.prv });
      const tx = await txBuilder.build();

      const rawTx = tx.toBroadcastFormat();
      should.equal(Utils.isValidRawTransaction(rawTx), true);

      // Should be signed
      (tx as Transaction).solTransaction.signatures.should.not.be.empty();
    });

    it('clear instructions from builder', async () => {
      const transferInstruction = SystemProgram.transfer({
        fromPubkey: new PublicKey(authAccount.pub),
        toPubkey: new PublicKey(otherAccount.pub),
        lamports: 1000000,
      });

      const txBuilder = customInstructionBuilder();
      txBuilder.addCustomInstruction(transferInstruction);
      txBuilder.getInstructions().should.have.length(1);

      txBuilder.clearInstructions();
      txBuilder.getInstructions().should.have.length(0);
    });
  });

  describe('Fail', () => {
    it('for null instruction', () => {
      const txBuilder = customInstructionBuilder();
      should(() => txBuilder.addCustomInstruction(null as unknown as TransactionInstruction)).throwError(
        'Instruction cannot be null or undefined'
      );
    });

    it('for undefined instruction', () => {
      const txBuilder = customInstructionBuilder();
      should(() => txBuilder.addCustomInstruction(undefined as unknown as TransactionInstruction)).throwError(
        'Instruction cannot be null or undefined'
      );
    });

    it('for instruction without programId', () => {
      const txBuilder = customInstructionBuilder();
      const invalidInstruction = {
        keys: [],
        data: Buffer.alloc(0),
      } as unknown as TransactionInstruction;

      should(() => txBuilder.addCustomInstruction(invalidInstruction)).throwError(
        'Instruction must have a valid programId'
      );
    });

    it('for instruction without keys', () => {
      const txBuilder = customInstructionBuilder();
      const invalidInstruction = {
        programId: new PublicKey('11111111111111111111111111111112'),
        data: Buffer.alloc(0),
      } as TransactionInstruction;

      should(() => txBuilder.addCustomInstruction(invalidInstruction)).throwError(
        'Instruction must have valid keys array'
      );
    });

    it('for instruction without data', () => {
      const txBuilder = customInstructionBuilder();
      const invalidInstruction = {
        programId: new PublicKey('11111111111111111111111111111112'),
        keys: [],
      } as unknown as TransactionInstruction;

      should(() => txBuilder.addCustomInstruction(invalidInstruction)).throwError(
        'Instruction must have valid data buffer'
      );
    });

    it('for non-array in addCustomInstructions', () => {
      const txBuilder = customInstructionBuilder();
      should(() => txBuilder.addCustomInstructions('invalid' as unknown as TransactionInstruction[])).throwError(
        'Instructions must be an array'
      );
    });

    it('when building without instructions', async () => {
      const txBuilder = customInstructionBuilder();
      await txBuilder.build().should.be.rejectedWith('At least one custom instruction must be specified');
    });

    it('when building without sender', async () => {
      const transferInstruction = SystemProgram.transfer({
        fromPubkey: new PublicKey(authAccount.pub),
        toPubkey: new PublicKey(otherAccount.pub),
        lamports: 1000000,
      });

      const txBuilder = factory.getCustomInstructionBuilder();
      txBuilder.nonce(recentBlockHash);
      txBuilder.addCustomInstruction(transferInstruction);

      await txBuilder.build().should.be.rejectedWith('Invalid transaction: missing sender');
    });

    it('when building without nonce', async () => {
      const transferInstruction = SystemProgram.transfer({
        fromPubkey: new PublicKey(authAccount.pub),
        toPubkey: new PublicKey(otherAccount.pub),
        lamports: 1000000,
      });

      const txBuilder = factory.getCustomInstructionBuilder();
      txBuilder.sender(authAccount.pub);
      txBuilder.addCustomInstruction(transferInstruction);

      await txBuilder.build().should.be.rejectedWith('Invalid transaction: missing nonce blockhash');
    });
  });
});
