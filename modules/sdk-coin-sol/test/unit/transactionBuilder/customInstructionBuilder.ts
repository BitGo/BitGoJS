import should from 'should';
import {
  SystemProgram,
  PublicKey,
  TransactionInstruction,
  ComputeBudgetProgram,
  VersionedTransaction,
} from '@solana/web3.js';
import { getBuilderFactory } from '../getBuilderFactory';
import { KeyPair, Utils, Transaction } from '../../../src';
import * as testData from '../../resources/sol';
import { SolCompiledInstruction } from '@bitgo/sdk-core';

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

  // Helper function to convert TransactionInstruction to the expected format
  const convertInstructionToParams = (instruction: TransactionInstruction) => ({
    programId: instruction.programId.toString(),
    keys: instruction.keys.map((key) => ({
      pubkey: key.pubkey.toString(),
      isSigner: key.isSigner,
      isWritable: key.isWritable,
    })),
    data: instruction.data.toString('hex'),
  });

  describe('Succeed', () => {
    it('build a transaction with a single custom instruction', async () => {
      const transferInstruction = SystemProgram.transfer({
        fromPubkey: new PublicKey(authAccount.pub),
        toPubkey: new PublicKey(otherAccount.pub),
        lamports: 1000000,
      });

      const txBuilder = customInstructionBuilder();
      txBuilder.addCustomInstruction(convertInstructionToParams(transferInstruction));
      const tx = await txBuilder.build();

      tx.inputs.length.should.equal(0);

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
      txBuilder.addCustomInstructions([
        convertInstructionToParams(transferInstruction),
        convertInstructionToParams(priorityFeeInstruction),
      ]);
      const tx = await txBuilder.build();

      tx.inputs.length.should.equal(0);
      tx.outputs.length.should.equal(0);

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
      txBuilder.addCustomInstruction(convertInstructionToParams(transferInstruction));
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
      txBuilder.addCustomInstruction(convertInstructionToParams(transferInstruction));
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
      txBuilder.addCustomInstruction(convertInstructionToParams(transferInstruction));
      txBuilder.getInstructions().should.have.length(1);

      txBuilder.clearInstructions();
      txBuilder.getInstructions().should.have.length(0);
    });
  });

  // Type for testing invalid instruction formats
  interface InvalidInstruction {
    programId?: string;
    keys?: unknown;
    data?: unknown;
  }

  describe('Fail', () => {
    it('for null instruction', () => {
      const txBuilder = customInstructionBuilder();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      should(() => txBuilder.addCustomInstruction(null as any)).throwError('Instruction cannot be null or undefined');
    });

    it('for undefined instruction', () => {
      const txBuilder = customInstructionBuilder();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      should(() => txBuilder.addCustomInstruction(undefined as any)).throwError(
        'Instruction cannot be null or undefined'
      );
    });

    it('for instruction without programId', () => {
      const txBuilder = customInstructionBuilder();
      const invalidInstruction: InvalidInstruction = {
        keys: [],
        data: '',
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      should(() => txBuilder.addCustomInstruction(invalidInstruction as any)).throwError(
        'Compiled instruction must have a valid programIdIndex number'
      );
    });

    it('for instruction without keys', () => {
      const txBuilder = customInstructionBuilder();
      const invalidInstruction: InvalidInstruction = {
        programId: '11111111111111111111111111111112',
        data: '',
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      should(() => txBuilder.addCustomInstruction(invalidInstruction as any)).throwError(
        'Instruction must have valid keys array'
      );
    });

    it('for instruction without data', () => {
      const txBuilder = customInstructionBuilder();
      const invalidInstruction: InvalidInstruction = {
        programId: '11111111111111111111111111111112',
        keys: [],
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      should(() => txBuilder.addCustomInstruction(invalidInstruction as any)).throwError(
        'Instruction must have valid data string'
      );
    });

    it('for non-array in addCustomInstructions', () => {
      const txBuilder = customInstructionBuilder();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      should(() => txBuilder.addCustomInstructions('invalid' as any)).throwError('Instructions must be an array');
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
      txBuilder.addCustomInstruction(convertInstructionToParams(transferInstruction));

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
      txBuilder.addCustomInstruction(convertInstructionToParams(transferInstruction));

      await txBuilder.build().should.be.rejectedWith('Invalid transaction: missing nonce blockhash');
    });
  });

  describe('SolCompiledInstruction Support', () => {
    it('should accept and validate SolCompiledInstruction format', () => {
      const compiledInstruction: SolCompiledInstruction = {
        programIdIndex: 1,
        accountKeyIndexes: [0, 2, 3],
        data: '020000001027000000000000',
      };

      const txBuilder = customInstructionBuilder();
      should(() => txBuilder.addCustomInstruction(compiledInstruction)).not.throwError();

      txBuilder.getInstructions().should.have.length(1);
      const addedInstruction = txBuilder.getInstructions()[0];
      addedInstruction.params.should.deepEqual(compiledInstruction);
    });

    it('should validate compiled instruction format', () => {
      const txBuilder = customInstructionBuilder();

      // Invalid programIdIndex
      should(() =>
        txBuilder.addCustomInstruction({
          programIdIndex: -1,
          accountKeyIndexes: [0],
          data: '00',
        } as SolCompiledInstruction)
      ).throwError('Compiled instruction must have a valid programIdIndex number');

      // Invalid accountKeyIndexes
      should(() =>
        txBuilder.addCustomInstruction({
          programIdIndex: 0,
          accountKeyIndexes: [-1],
          data: '00',
        } as SolCompiledInstruction)
      ).throwError('Each accountKeyIndex must be a non-negative number');

      // Missing data
      should(() =>
        txBuilder.addCustomInstruction({
          programIdIndex: 0,
          accountKeyIndexes: [0],
        } as any)
      ).throwError('Compiled instruction must have valid data string');
    });

    it('should handle mixed SolInstruction and SolCompiledInstruction', () => {
      const traditionalInstruction = convertInstructionToParams(
        SystemProgram.transfer({
          fromPubkey: new PublicKey(authAccount.pub),
          toPubkey: new PublicKey(otherAccount.pub),
          lamports: 1000000,
        })
      );

      const compiledInstruction: SolCompiledInstruction = {
        programIdIndex: 1,
        accountKeyIndexes: [0, 2],
        data: '030000001027000000000000',
      };

      const txBuilder = customInstructionBuilder();
      txBuilder.addCustomInstruction(traditionalInstruction);
      txBuilder.addCustomInstruction(compiledInstruction);

      txBuilder.getInstructions().should.have.length(2);
    });
  });

  describe('VersionedTransaction Integration', () => {
    it('should parse Jupiter VersionedTransaction bytes', () => {
      // Test that we can parse the real Jupiter transaction
      const buffer = Buffer.from(testData.JUPITER_VERSIONED_TX_BYTES, 'base64');
      should(() => VersionedTransaction.deserialize(buffer)).not.throwError();

      const versionedTx = VersionedTransaction.deserialize(buffer);
      versionedTx.should.be.ok();
      versionedTx.message.should.be.ok();
      versionedTx.message.compiledInstructions.length.should.be.greaterThan(0);
    });

    it('should extract compiled instructions from VersionedTransaction', () => {
      const buffer = Buffer.from(testData.JUPITER_VERSIONED_TX_BYTES, 'base64');
      const versionedTx = VersionedTransaction.deserialize(buffer);

      // Extract compiled instructions in our format
      const compiledInstructions: SolCompiledInstruction[] = versionedTx.message.compiledInstructions.map((ci) => ({
        programIdIndex: ci.programIdIndex,
        accountKeyIndexes: ci.accountKeyIndexes,
        data: Buffer.from(ci.data).toString('hex'),
      }));

      compiledInstructions.length.should.be.greaterThan(0);

      // Validate each instruction has the right format
      for (const instruction of compiledInstructions) {
        instruction.should.have.property('programIdIndex');
        instruction.should.have.property('accountKeyIndexes');
        instruction.should.have.property('data');
        (typeof instruction.programIdIndex).should.equal('number');
        Array.isArray(instruction.accountKeyIndexes).should.equal(true);
        (typeof instruction.data).should.equal('string');
      }
    });

    it('should validate compiled instructions from VersionedTransaction', () => {
      const buffer = Buffer.from(testData.JUPITER_VERSIONED_TX_BYTES, 'base64');
      const versionedTx = VersionedTransaction.deserialize(buffer);

      const compiledInstructions: SolCompiledInstruction[] = versionedTx.message.compiledInstructions.map((ci) => ({
        programIdIndex: ci.programIdIndex,
        accountKeyIndexes: ci.accountKeyIndexes,
        data: Buffer.from(ci.data).toString('hex'),
      }));

      const txBuilder = customInstructionBuilder();

      // Should be able to add all compiled instructions without errors
      should(() => txBuilder.addCustomInstructions(compiledInstructions)).not.throwError();

      txBuilder.getInstructions().should.have.length(compiledInstructions.length);
    });
  });

  describe('fromUnsignedTransactionBytes - Main Entry Point', () => {
    it('should parse VersionedTransaction bytes and extract instructions', () => {
      const txBuilder = customInstructionBuilder();

      // Should parse without throwing errors
      should(() => txBuilder.fromUnsignedTransactionBytes(testData.JUPITER_VERSIONED_TX_BYTES)).not.throwError();

      // Should have extracted instructions
      const instructions = txBuilder.getInstructions();
      instructions.length.should.be.greaterThan(0);

      // Each instruction should be in SolCompiledInstruction format
      for (const instruction of instructions) {
        instruction.type.should.equal('CustomInstruction');
        instruction.params.should.have.property('programIdIndex');
        instruction.params.should.have.property('accountKeyIndexes');
        instruction.params.should.have.property('data');
      }
    });

    it('should preserve VersionedTransaction and ALTs in underlying transaction', async () => {
      const txBuilder = customInstructionBuilder();
      txBuilder.fromUnsignedTransactionBytes(testData.JUPITER_VERSIONED_TX_BYTES);

      // Build the transaction to verify it works end-to-end
      const tx = await txBuilder.build();

      // Should be detected as VersionedTransaction
      (tx as Transaction).isVersionedTransaction().should.be.true();

      // Should have ALTs preserved (even if empty array)
      const alts = (tx as Transaction).getAddressLookupTables();
      should.exist(alts);
      Array.isArray(alts).should.equal(true);

      // Should be able to serialize back to broadcast format
      const serialized = tx.toBroadcastFormat();
      should.exist(serialized);
      (typeof serialized).should.equal('string');
      serialized.length.should.be.greaterThan(0);
    });

    it('should handle invalid VersionedTransaction bytes', () => {
      const txBuilder = customInstructionBuilder();

      should(() => txBuilder.fromUnsignedTransactionBytes('invalid-base64')).throwError();
      should(() => txBuilder.fromUnsignedTransactionBytes('')).throwError();
    });

    it('should work with the complete transaction building flow', async () => {
      const txBuilder = customInstructionBuilder();

      // Parse the VersionedTransaction bytes
      txBuilder.fromUnsignedTransactionBytes(testData.JUPITER_VERSIONED_TX_BYTES);

      // Build should work without additional setup needed
      const tx = await txBuilder.build();

      // Verify transaction properties
      tx.should.be.ok();
      tx.type.should.equal(31); // TransactionType.CustomTx enum value
      (tx as Transaction).isVersionedTransaction().should.be.true();

      // Should be able to get signable payload
      const payload = tx.signablePayload;
      payload.should.be.instanceOf(Buffer);
      payload.length.should.be.greaterThan(0);
    });

    it('should extract the correct number of instructions from Jupiter transaction', () => {
      const txBuilder = customInstructionBuilder();
      txBuilder.fromUnsignedTransactionBytes(testData.JUPITER_VERSIONED_TX_BYTES);

      const instructions = txBuilder.getInstructions();

      // Verify we extracted instructions from the VersionedTransaction
      // This is based on the actual transaction structure
      instructions.length.should.be.greaterThan(0); // Should have at least one instruction

      // Verify each instruction has valid compiled format
      for (const instruction of instructions) {
        const params = instruction.params as SolCompiledInstruction;
        (typeof params.programIdIndex).should.equal('number');
        params.programIdIndex.should.be.greaterThanOrEqual(0);
        Array.isArray(params.accountKeyIndexes).should.equal(true);
        (typeof params.data).should.equal('string');
        // Data should be valid hex string
        params.data.should.match(/^[0-9a-fA-F]*$/);
      }
    });

    it('should clear instructions properly after using fromUnsignedTransactionBytes', () => {
      const txBuilder = customInstructionBuilder();

      // Add instructions from VersionedTransaction
      txBuilder.fromUnsignedTransactionBytes(testData.JUPITER_VERSIONED_TX_BYTES);
      txBuilder.getInstructions().length.should.be.greaterThan(0);

      // Clear should work
      txBuilder.clearInstructions();
      txBuilder.getInstructions().should.have.length(0);
    });
  });
});
