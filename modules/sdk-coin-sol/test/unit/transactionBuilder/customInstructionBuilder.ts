import should from 'should';
import {
  SystemProgram,
  PublicKey,
  TransactionInstruction,
  ComputeBudgetProgram,
  MessageV0,
  VersionedTransaction,
} from '@solana/web3.js';
import { getBuilderFactory } from '../getBuilderFactory';
import { KeyPair, Utils, Transaction } from '../../../src';
import * as testData from '../../resources/sol';
import { SolVersionedInstruction } from '@bitgo/sdk-core';
import { VersionedTransactionData } from '../../../src/lib/iface';
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

  describe('fee payer rewrite for versioned transactions', () => {
    // the enterprise fee address: has a private key so signatures can be produced for real
    const feePayerAccount = new KeyPair(testData.feePayerAccount).getKeys();
    const nonceAccountPub = testData.nonceAccount.pub;
    const MEMO_PROGRAM = 'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr';
    const SYSTEM_PROGRAM = '11111111111111111111111111111111';
    const SYSVAR_RECENT_BLOCKHASHES = 'SysvarRecentB1ockHashes11111111111111111111';

    /**
     * Minimal versioned transaction with a single memo instruction that references the
     * wallet as signer and the memo program.
     */
    const memoTxData = (
      staticAccountKeys: string[],
      messageHeader: VersionedTransactionData['messageHeader']
    ): VersionedTransactionData => ({
      versionedInstructions: [
        {
          programIdIndex: staticAccountKeys.indexOf(MEMO_PROGRAM),
          accountKeyIndexes: [staticAccountKeys.indexOf(authAccount.pub)],
          data: base58.encode(Buffer.from('Hello Versioned Tx', 'utf-8')),
        },
      ],
      addressLookupTables: [],
      staticAccountKeys,
      messageHeader,
    });

    const feePayerBuilder = (
      data: VersionedTransactionData,
      feePayer?: string,
      durableNonce?: { walletNonceAddress: string; authWalletAddress: string }
    ) => {
      const txBuilder = factory.getCustomInstructionBuilder();
      txBuilder.nonce(recentBlockHash, durableNonce);
      if (feePayer) {
        txBuilder.feePayer(feePayer);
      }
      txBuilder.fromVersionedTransactionData(data);
      return txBuilder;
    };

    it('inserts a fee payer that is not among the static keys as writable signer account 0', async () => {
      const data = memoTxData([authAccount.pub, MEMO_PROGRAM], {
        numRequiredSignatures: 1,
        numReadonlySignedAccounts: 0,
        numReadonlyUnsignedAccounts: 0,
      });
      const tx = (await feePayerBuilder(data, feePayerAccount.pub).build()) as Transaction;

      const built = tx.getVersionedTransactionData()!;
      should.exist(built);
      built.staticAccountKeys.should.deepEqual([feePayerAccount.pub, authAccount.pub, MEMO_PROGRAM]);
      built.messageHeader.should.deepEqual({
        numRequiredSignatures: 2,
        numReadonlySignedAccounts: 0,
        numReadonlyUnsignedAccounts: 0,
      });

      // the memo instruction keeps targeting the same accounts
      built.versionedInstructions[0].programIdIndex.should.equal(2);
      built.versionedInstructions[0].accountKeyIndexes.should.deepEqual([1]);
      built.versionedInstructions[0].data.should.equal(data.versionedInstructions[0].data);

      // the rewritten message compiles and round-trips
      should.exist(tx.signablePayload);
      const deserialized = VersionedTransaction.deserialize(Buffer.from(tx.toBroadcastFormat(), 'base64'));
      deserialized.message.staticAccountKeys[0].toBase58().should.equal(feePayerAccount.pub);
      deserialized.message.header.numRequiredSignatures.should.equal(2);
    });

    it('keeps lookup-table instructions targeting the same accounts when inserting a fee payer', async () => {
      // real Jupiter swap: 13 static keys plus 4 ALTs loading 26 accounts, so the instructions
      // mix static indexes (0-12) with lookup-table indexes (13-38)
      const originalDeserialized = VersionedTransaction.deserialize(
        Buffer.from(testData.JUPITER_VERSIONED_TX_BYTES, 'base64')
      );
      const versionedTxData: VersionedTransactionData = {
        versionedInstructions: originalDeserialized.message.compiledInstructions.map((ix) => ({
          programIdIndex: ix.programIdIndex,
          accountKeyIndexes: ix.accountKeyIndexes,
          data: base58.encode(ix.data),
        })),
        addressLookupTables: originalDeserialized.message.addressTableLookups!.map((lookup) => ({
          accountKey: lookup.accountKey.toBase58(),
          writableIndexes: lookup.writableIndexes,
          readonlyIndexes: lookup.readonlyIndexes,
        })),
        staticAccountKeys: originalDeserialized.message.staticAccountKeys.map((key) => key.toBase58()),
        messageHeader: originalDeserialized.message.header,
      };

      const tx = (await feePayerBuilder(versionedTxData, feePayerAccount.pub).build()) as Transaction;
      const built = tx.getVersionedTransactionData()!;

      built.staticAccountKeys.should.deepEqual([feePayerAccount.pub, ...versionedTxData.staticAccountKeys]);
      built.messageHeader.should.deepEqual({
        numRequiredSignatures: versionedTxData.messageHeader.numRequiredSignatures + 1,
        numReadonlySignedAccounts: versionedTxData.messageHeader.numReadonlySignedAccounts,
        numReadonlyUnsignedAccounts: versionedTxData.messageHeader.numReadonlyUnsignedAccounts,
      });

      // every static and lookup-table index shifts by exactly one, so every instruction
      // still targets the same accounts as the caller's original transaction
      versionedTxData.versionedInstructions.forEach((original, i) => {
        built.versionedInstructions[i].programIdIndex.should.equal(original.programIdIndex + 1);
        built.versionedInstructions[i].accountKeyIndexes.should.deepEqual(
          original.accountKeyIndexes.map((idx) => idx + 1)
        );
        built.versionedInstructions[i].data.should.equal(original.data);
      });
      built.addressLookupTables.should.deepEqual(versionedTxData.addressLookupTables);

      const deserialized = VersionedTransaction.deserialize(Buffer.from(tx.toBroadcastFormat(), 'base64'));
      deserialized.message.staticAccountKeys[0].toBase58().should.equal(feePayerAccount.pub);
    });

    it('moves a fee payer present as a writable non-signer to account 0 without duplicating it', async () => {
      const data = memoTxData([authAccount.pub, MEMO_PROGRAM, feePayerAccount.pub], {
        numRequiredSignatures: 1,
        numReadonlySignedAccounts: 0,
        numReadonlyUnsignedAccounts: 0,
      });
      const tx = (await feePayerBuilder(data, feePayerAccount.pub).build()) as Transaction;
      const built = tx.getVersionedTransactionData()!;

      built.staticAccountKeys.should.deepEqual([feePayerAccount.pub, authAccount.pub, MEMO_PROGRAM]);
      built.staticAccountKeys.filter((key) => key === feePayerAccount.pub).length.should.equal(1);
      built.messageHeader.should.deepEqual({
        numRequiredSignatures: 2,
        numReadonlySignedAccounts: 0,
        numReadonlyUnsignedAccounts: 0,
      });
      built.versionedInstructions[0].programIdIndex.should.equal(2);
      built.versionedInstructions[0].accountKeyIndexes.should.deepEqual([1]);
    });

    it('decrements numReadonlyUnsignedAccounts when a read-only non-signer fee payer is moved', async () => {
      const data = memoTxData([authAccount.pub, MEMO_PROGRAM, feePayerAccount.pub], {
        numRequiredSignatures: 1,
        numReadonlySignedAccounts: 0,
        numReadonlyUnsignedAccounts: 1,
      });
      const tx = (await feePayerBuilder(data, feePayerAccount.pub).build()) as Transaction;
      const built = tx.getVersionedTransactionData()!;

      built.staticAccountKeys.should.deepEqual([feePayerAccount.pub, authAccount.pub, MEMO_PROGRAM]);
      built.messageHeader.should.deepEqual({
        numRequiredSignatures: 2,
        numReadonlySignedAccounts: 0,
        numReadonlyUnsignedAccounts: 0,
      });
    });

    it('decrements numReadonlySignedAccounts when a read-only signer fee payer is moved', async () => {
      const data = memoTxData([authAccount.pub, feePayerAccount.pub, MEMO_PROGRAM], {
        numRequiredSignatures: 2,
        numReadonlySignedAccounts: 1,
        numReadonlyUnsignedAccounts: 0,
      });
      const tx = (await feePayerBuilder(data, feePayerAccount.pub).build()) as Transaction;
      const built = tx.getVersionedTransactionData()!;

      built.staticAccountKeys.should.deepEqual([feePayerAccount.pub, authAccount.pub, MEMO_PROGRAM]);
      built.messageHeader.should.deepEqual({
        numRequiredSignatures: 2,
        numReadonlySignedAccounts: 0,
        numReadonlyUnsignedAccounts: 0,
      });
      built.versionedInstructions[0].programIdIndex.should.equal(2);
      built.versionedInstructions[0].accountKeyIndexes.should.deepEqual([1]);
    });

    it('sponsors a durable-nonce transaction whose fee payer is the nonce authority with one signature', async () => {
      const data = memoTxData([authAccount.pub, MEMO_PROGRAM], {
        numRequiredSignatures: 1,
        numReadonlySignedAccounts: 0,
        numReadonlyUnsignedAccounts: 0,
      });
      const txBuilder = factory.getCustomInstructionBuilder();
      txBuilder.nonce(recentBlockHash, {
        walletNonceAddress: nonceAccountPub,
        authWalletAddress: feePayerAccount.pub,
      });
      txBuilder.feePayer(feePayerAccount.pub);
      txBuilder.fromVersionedTransactionData(data);
      const tx = (await txBuilder.build()) as Transaction;
      const built = tx.getVersionedTransactionData()!;

      // the fee payer is account 0, a signer, and appears exactly once
      built.staticAccountKeys[0].should.equal(feePayerAccount.pub);
      built.staticAccountKeys.filter((key) => key === feePayerAccount.pub).length.should.equal(1);
      built.messageHeader.numRequiredSignatures.should.equal(2);
      built.staticAccountKeys.slice(0, 2).should.deepEqual([feePayerAccount.pub, authAccount.pub]);

      // AdvanceNonceAccount is instruction 0 and names the fee payer (already account 0) as authority
      const nonceAdvance = built.versionedInstructions[0];
      nonceAdvance.data.should.equal('6vx8P');
      nonceAdvance.programIdIndex.should.equal(built.staticAccountKeys.indexOf(SYSTEM_PROGRAM));
      nonceAdvance.accountKeyIndexes.should.deepEqual([
        built.staticAccountKeys.indexOf(nonceAccountPub),
        built.staticAccountKeys.indexOf(SYSVAR_RECENT_BLOCKHASHES),
        0,
      ]);

      // the original memo instruction follows, still targeting the same accounts
      built.versionedInstructions[1].programIdIndex.should.equal(built.staticAccountKeys.indexOf(MEMO_PROGRAM));
      built.versionedInstructions[1].accountKeyIndexes.should.deepEqual([
        built.staticAccountKeys.indexOf(authAccount.pub),
      ]);
      built.versionedInstructions[1].data.should.equal(data.versionedInstructions[0].data);
    });

    it('addFeePayerSignature() places the fee payer signature in slot 0', async () => {
      const data = memoTxData([authAccount.pub, MEMO_PROGRAM], {
        numRequiredSignatures: 1,
        numReadonlySignedAccounts: 0,
        numReadonlyUnsignedAccounts: 0,
      });

      // produce a real fee-payer signature of the unsigned payload through the sign flow
      const signingBuilder = feePayerBuilder(data, feePayerAccount.pub);
      signingBuilder.sign({ key: feePayerAccount.prv });
      const signedTx = (await signingBuilder.build()) as Transaction;
      const feePayerSignature = base58.decode(signedTx.signature[0]);

      // replay the signature through addFeePayerSignature()
      const txBuilder = feePayerBuilder(data, feePayerAccount.pub);
      txBuilder.addFeePayerSignature({ pub: feePayerAccount.pub }, Buffer.from(feePayerSignature));
      const tx = (await txBuilder.build()) as Transaction;

      // byte-identical to the natively signed transaction: the signature landed in slot 0
      tx.toBroadcastFormat().should.equal(signedTx.toBroadcastFormat());
      const deserialized = VersionedTransaction.deserialize(Buffer.from(tx.toBroadcastFormat(), 'base64'));
      deserialized.message.staticAccountKeys[0].toBase58().should.equal(feePayerAccount.pub);
      deserialized.signatures.length.should.equal(2);
      Buffer.from(deserialized.signatures[0])
        .toString('hex')
        .should.equal(Buffer.from(feePayerSignature).toString('hex'));
      // slot 1 (the wallet) is still unsigned
      deserialized.signatures[1].every((byte) => byte === 0).should.be.true();
    });

    it('addFeePayerSignature() on a built transaction fills signature slot 0', async () => {
      const data = memoTxData([authAccount.pub, MEMO_PROGRAM], {
        numRequiredSignatures: 1,
        numReadonlySignedAccounts: 0,
        numReadonlyUnsignedAccounts: 0,
      });
      const unsignedTx = (await feePayerBuilder(data, feePayerAccount.pub).build()) as Transaction;

      const signingBuilder = feePayerBuilder(data, feePayerAccount.pub);
      signingBuilder.sign({ key: feePayerAccount.prv });
      const signedTx = (await signingBuilder.build()) as Transaction;
      const feePayerSignature = base58.decode(signedTx.signature[0]);

      unsignedTx.addFeePayerSignature({ pub: feePayerAccount.pub }, Buffer.from(feePayerSignature));
      unsignedTx.toBroadcastFormat().should.equal(signedTx.toBroadcastFormat());

      // a key that is not account 0 is rejected
      should(() => unsignedTx.addFeePayerSignature({ pub: authAccount.pub }, Buffer.alloc(64))).throwError(
        /account 0 of the message/
      );
    });

    it('rejects addFeePayerSignature() from a key that is not account 0', () => {
      const data = memoTxData([authAccount.pub, MEMO_PROGRAM], {
        numRequiredSignatures: 1,
        numReadonlySignedAccounts: 0,
        numReadonlyUnsignedAccounts: 0,
      });
      const txBuilder = feePayerBuilder(data, feePayerAccount.pub);
      should(() => txBuilder.addFeePayerSignature({ pub: authAccount.pub }, Buffer.alloc(64))).throwError(
        /account 0 of the message/
      );
    });

    it('leaves the transaction bytes unchanged without feePayer()', async () => {
      const data = memoTxData([authAccount.pub, MEMO_PROGRAM], {
        numRequiredSignatures: 1,
        numReadonlySignedAccounts: 0,
        numReadonlyUnsignedAccounts: 0,
      });
      const tx = (await feePayerBuilder(data).build()) as Transaction;

      // the caller's data is used exactly as supplied
      tx.getVersionedTransactionData()!.should.deepEqual(data);

      // the bytes are identical to a direct MessageV0 construction of the same data
      const expected = Buffer.from(
        new VersionedTransaction(
          new MessageV0({
            header: data.messageHeader,
            staticAccountKeys: data.staticAccountKeys.map((key) => new PublicKey(key)),
            recentBlockhash: recentBlockHash,
            compiledInstructions: [
              {
                programIdIndex: data.versionedInstructions[0].programIdIndex,
                accountKeyIndexes: data.versionedInstructions[0].accountKeyIndexes,
                data: Buffer.from(base58.decode(data.versionedInstructions[0].data)),
              },
            ],
            addressTableLookups: [],
          })
        ).serialize()
      ).toString('base64');
      tx.toBroadcastFormat().should.equal(expected);

      // setting feePayer() to the account that is already account 0 changes nothing
      const sameFeePayerTx = (await feePayerBuilder(data, authAccount.pub).build()) as Transaction;
      sameFeePayerTx.toBroadcastFormat().should.equal(expected);
    });

    it('rejects a fee payer that is an address lookup table account', () => {
      const data = memoTxData([authAccount.pub, MEMO_PROGRAM], {
        numRequiredSignatures: 1,
        numReadonlySignedAccounts: 0,
        numReadonlyUnsignedAccounts: 0,
      });
      data.addressLookupTables = [{ accountKey: feePayerAccount.pub, writableIndexes: [0], readonlyIndexes: [1] }];
      should(() => feePayerBuilder(data, feePayerAccount.pub)).throwError(
        'Fee payer cannot be an address lookup table account: ' + feePayerAccount.pub
      );
    });

    it('rejects an invalid fee payer address', () => {
      const data = memoTxData([authAccount.pub, MEMO_PROGRAM], {
        numRequiredSignatures: 1,
        numReadonlySignedAccounts: 0,
        numReadonlyUnsignedAccounts: 0,
      });
      should(() => feePayerBuilder(data, 'not-an-address')).throwError(/Invalid or missing fee payer/);
    });
  });
});
