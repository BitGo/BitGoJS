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
import { SolVersionedInstruction } from '@bitgo/sdk-core';
import base58 from 'bs58';

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
        'Versioned instruction must have a valid programIdIndex number'
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

  describe('SolVersionedInstruction Support', () => {
    it('should accept and validate SolVersionedInstruction format', () => {
      const compiledInstruction: SolVersionedInstruction = {
        programIdIndex: 1,
        accountKeyIndexes: [0, 2, 3],
        data: '3Bxs43ZMjSRQLs6o', // base58 encoded instruction data
      };

      const txBuilder = customInstructionBuilder();
      should(() => txBuilder.addCustomInstruction(compiledInstruction)).not.throwError();

      txBuilder.getInstructions().should.have.length(1);
      const addedInstruction = txBuilder.getInstructions()[0];
      addedInstruction.params.should.deepEqual(compiledInstruction);
    });

    it('should validate versioned instruction format', () => {
      const txBuilder = customInstructionBuilder();

      // Invalid programIdIndex
      should(() =>
        txBuilder.addCustomInstruction({
          programIdIndex: -1,
          accountKeyIndexes: [0],
          data: '1', // base58 for 0x00
        } as SolVersionedInstruction)
      ).throwError('Versioned instruction must have a valid programIdIndex number');

      // Invalid accountKeyIndexes
      should(() =>
        txBuilder.addCustomInstruction({
          programIdIndex: 0,
          accountKeyIndexes: [-1],
          data: '1', // base58 for 0x00
        } as SolVersionedInstruction)
      ).throwError('Each accountKeyIndex must be a non-negative number');

      // Missing data
      should(() =>
        txBuilder.addCustomInstruction({
          programIdIndex: 0,
          accountKeyIndexes: [0],
        } as SolVersionedInstruction)
      ).throwError('Versioned instruction must have valid data string');
    });

    it('should handle mixed SolInstruction and SolVersionedInstruction', () => {
      const traditionalInstruction = convertInstructionToParams(
        SystemProgram.transfer({
          fromPubkey: new PublicKey(authAccount.pub),
          toPubkey: new PublicKey(otherAccount.pub),
          lamports: 1000000,
        })
      );

      const compiledInstruction: SolVersionedInstruction = {
        programIdIndex: 1,
        accountKeyIndexes: [0, 2],
        data: '4HSo5YVBrgChTZX5',
      };

      const txBuilder = customInstructionBuilder();
      txBuilder.addCustomInstruction(traditionalInstruction);
      txBuilder.addCustomInstruction(compiledInstruction);

      txBuilder.getInstructions().should.have.length(2);
    });
  });

  describe('fromVersionedTransactionData', () => {
    function extractVersionedTransactionData(base64Bytes: string) {
      const buffer = Buffer.from(base64Bytes, 'base64');
      const versionedTx = VersionedTransaction.deserialize(buffer);

      return {
        versionedInstructions: versionedTx.message.compiledInstructions.map((ci) => ({
          programIdIndex: ci.programIdIndex,
          accountKeyIndexes: ci.accountKeyIndexes,
          data: base58.encode(ci.data),
        })),
        addressLookupTables: versionedTx.message.addressTableLookups.map((alt) => ({
          accountKey: alt.accountKey.toString(),
          writableIndexes: alt.writableIndexes,
          readonlyIndexes: alt.readonlyIndexes,
        })),
        staticAccountKeys: versionedTx.message.staticAccountKeys.map((key) => key.toString()),
        messageHeader: {
          numRequiredSignatures: versionedTx.message.header.numRequiredSignatures,
          numReadonlySignedAccounts: versionedTx.message.header.numReadonlySignedAccounts,
          numReadonlyUnsignedAccounts: versionedTx.message.header.numReadonlyUnsignedAccounts,
        },
      };
    }

    it('should process VersionedTransactionData and extract instructions', () => {
      const txBuilder = customInstructionBuilder();
      const versionedTxData = extractVersionedTransactionData(testData.JUPITER_VERSIONED_TX_BYTES);

      // Should parse without throwing errors
      should(() => txBuilder.fromVersionedTransactionData(versionedTxData)).not.throwError();

      // Should have extracted instructions
      const instructions = txBuilder.getInstructions();
      instructions.length.should.be.greaterThan(0);

      for (const instruction of instructions) {
        instruction.type.should.equal('VersionedCustomInstruction');
        instruction.params.should.have.property('programIdIndex');
        instruction.params.should.have.property('accountKeyIndexes');
        instruction.params.should.have.property('data');
      }
    });

    it('should store VersionedTransactionData in underlying transaction', async () => {
      const txBuilder = customInstructionBuilder();
      const versionedTxData = extractVersionedTransactionData(testData.JUPITER_VERSIONED_TX_BYTES);

      txBuilder.fromVersionedTransactionData(versionedTxData);

      const tx = txBuilder['_transaction'];
      const storedData = tx.getVersionedTransactionData();
      should.exist(storedData);
      storedData!.versionedInstructions.length.should.equal(versionedTxData.versionedInstructions.length);
      storedData!.addressLookupTables.length.should.equal(versionedTxData.addressLookupTables.length);
      storedData!.staticAccountKeys.length.should.equal(versionedTxData.staticAccountKeys.length);
    });

    it('should validate input data', () => {
      const txBuilder = customInstructionBuilder();

      // Invalid: null/undefined
      should(() => txBuilder.fromVersionedTransactionData(null as any)).throwError(/must be a valid object/);
      should(() => txBuilder.fromVersionedTransactionData(undefined as any)).throwError(/must be a valid object/);

      // Invalid: empty instructions
      should(() =>
        txBuilder.fromVersionedTransactionData({
          versionedInstructions: [],
          addressLookupTables: [],
          staticAccountKeys: ['test'],
          messageHeader: { numRequiredSignatures: 1, numReadonlySignedAccounts: 0, numReadonlyUnsignedAccounts: 0 },
        })
      ).throwError(/non-empty array/);

      // Invalid: missing addressLookupTables
      should(() =>
        txBuilder.fromVersionedTransactionData({
          versionedInstructions: [{ programIdIndex: 0, accountKeyIndexes: [0], data: '1' }], // base58 for 0x00
          staticAccountKeys: ['test'],
        } as any)
      ).throwError(/must be an array/);

      // Invalid: empty staticAccountKeys
      should(() =>
        txBuilder.fromVersionedTransactionData({
          versionedInstructions: [{ programIdIndex: 0, accountKeyIndexes: [0], data: '1' }], // base58 for 0x00
          addressLookupTables: [],
          staticAccountKeys: [],
          messageHeader: { numRequiredSignatures: 1, numReadonlySignedAccounts: 0, numReadonlyUnsignedAccounts: 0 },
        })
      ).throwError(/non-empty array/);
    });

    it('should work with the complete transaction building flow', async () => {
      const txBuilder = customInstructionBuilder();
      const versionedTxData = extractVersionedTransactionData(testData.JUPITER_VERSIONED_TX_BYTES);

      // Process the VersionedTransactionData
      txBuilder.fromVersionedTransactionData(versionedTxData);

      txBuilder.sender(versionedTxData.staticAccountKeys[0]); // Fee payer
      txBuilder.nonce(testData.blockHashes.validBlockHashes[0]);

      const tx = await txBuilder.build();

      // Verify transaction properties
      tx.should.be.ok();
      tx.type.should.equal(31); // TransactionType.CustomTx enum value

      // Verify signable payload
      const payload = tx.signablePayload;
      payload.should.be.instanceOf(Buffer);
      payload.length.should.be.greaterThan(0);

      // Verify payload is deterministic - rebuilding with same params produces same payload
      const txBuilder2 = customInstructionBuilder();
      txBuilder2.fromVersionedTransactionData(versionedTxData);
      txBuilder2.sender(versionedTxData.staticAccountKeys[0]);
      txBuilder2.nonce(testData.blockHashes.validBlockHashes[0]);
      const tx2 = await txBuilder2.build();
      should.equal(tx2.signablePayload.toString('hex'), payload.toString('hex'));
    });

    it('should extract the correct number of instructions from Jupiter transaction', () => {
      const txBuilder = customInstructionBuilder();
      const versionedTxData = extractVersionedTransactionData(testData.JUPITER_VERSIONED_TX_BYTES);

      txBuilder.fromVersionedTransactionData(versionedTxData);

      const instructions = txBuilder.getInstructions();

      // Verify we extracted instructions
      instructions.length.should.be.greaterThan(0);
      instructions.length.should.equal(versionedTxData.versionedInstructions.length);

      // Verify each instruction has valid compiled format
      for (const instruction of instructions) {
        const params = instruction.params as SolVersionedInstruction;
        (typeof params.programIdIndex).should.equal('number');
        params.programIdIndex.should.be.greaterThanOrEqual(0);
        Array.isArray(params.accountKeyIndexes).should.equal(true);
        (typeof params.data).should.equal('string');
        // Data should be valid base58 string (non-empty)
        params.data.length.should.be.greaterThan(0);
        // Verify it can be decoded
        should.doesNotThrow(() => base58.decode(params.data));
      }
    });

    it('should clear instructions properly after using fromVersionedTransactionData', () => {
      const txBuilder = customInstructionBuilder();
      const versionedTxData = extractVersionedTransactionData(testData.JUPITER_VERSIONED_TX_BYTES);

      txBuilder.fromVersionedTransactionData(versionedTxData);
      txBuilder.getInstructions().length.should.be.greaterThan(0);

      // Clear should work
      txBuilder.clearInstructions();
      txBuilder.getInstructions().should.have.length(0);
    });

    it('should extract fee payer from staticAccountKeys', () => {
      const txBuilder = factory.getCustomInstructionBuilder();
      txBuilder.nonce(recentBlockHash);

      const versionedTxData = extractVersionedTransactionData(testData.JUPITER_VERSIONED_TX_BYTES);

      txBuilder.fromVersionedTransactionData(versionedTxData);

      const sender = txBuilder['_sender'];
      should.exist(sender);
      sender.should.equal(versionedTxData.staticAccountKeys[0]);
    });

    it('should not override existing sender', () => {
      const txBuilder = customInstructionBuilder();
      const versionedTxData = extractVersionedTransactionData(testData.JUPITER_VERSIONED_TX_BYTES);

      const originalSender = txBuilder['_sender'];
      txBuilder.fromVersionedTransactionData(versionedTxData);

      const sender = txBuilder['_sender'];
      sender.should.equal(originalSender);
      sender.should.equal(authAccount.pub);
    });
  });
});
