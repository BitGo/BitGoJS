import should from 'should';
import {
  SystemProgram,
  PublicKey,
  TransactionInstruction,
  ComputeBudgetProgram,
  MessageV0,
  VersionedTransaction,
  Keypair,
  AddressLookupTableAccount,
  SYSVAR_RECENT_BLOCKHASHES_PUBKEY,
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

  // Helper to deconstruct a serialized VersionedTransaction into the data shape
  // consumed by fromVersionedTransactionData
  function extractVersionedTransactionData(base64Bytes: string): VersionedTransactionData {
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

  describe('durable nonce injection', () => {
    const SYSTEM_PROGRAM_ID = SystemProgram.programId.toBase58();
    const SYSVAR_RECENT_BLOCKHASHES_ID = SYSVAR_RECENT_BLOCKHASHES_PUBKEY.toBase58();
    const walletNonceAddress = testData.nonceAccount.pub;
    const authWalletAddress = authAccount.pub;

    const seededPublicKey = (seed: number): PublicKey => Keypair.fromSeed(Buffer.alloc(32, seed)).publicKey;

    // Deterministic fixture keys covering all four MessageV0 header sections
    const fixturePayer = seededPublicKey(11); // writable signer (account 0)
    const fixtureRoSigner = seededPublicKey(12); // read-only signer
    const fixtureWritableNonSigner = seededPublicKey(13);
    const fixtureRoNonSigner = seededPublicKey(14);
    const fixtureAltWritable = seededPublicKey(15); // loaded from the lookup table
    const fixtureAltReadonly = seededPublicKey(16); // loaded from the lookup table
    const fixtureProgram = seededPublicKey(17);

    // The lookup table has filler addresses at indexes 0 and 2 so the
    // referenced indexes (1 writable, 3 readonly) are non-trivial
    const lookupTableAccount = new AddressLookupTableAccount({
      key: seededPublicKey(200),
      state: {
        deactivationSlot: BigInt(0),
        lastExtendedSlot: 0,
        lastExtendedSlotStartIndex: 0,
        addresses: [seededPublicKey(90), fixtureAltWritable, seededPublicKey(91), fixtureAltReadonly],
      },
    });

    /**
     * Compile versioned transaction data through web3.js with a lookup table,
     * mirroring the data callers extract from a real VersionedTransaction.
     */
    function buildVersionedFixture(
      payerKey: PublicKey,
      instructions: {
        programId: PublicKey;
        keys: { pubkey: PublicKey; isSigner: boolean; isWritable: boolean }[];
      }[]
    ): { message: MessageV0; data: VersionedTransactionData } {
      const message = MessageV0.compile({
        payerKey,
        recentBlockhash: recentBlockHash,
        addressLookupTableAccounts: [lookupTableAccount],
        instructions: instructions.map(
          (ix) =>
            new TransactionInstruction({
              programId: ix.programId,
              keys: ix.keys,
              data: Buffer.from([1, 2, 3, 4]),
            })
        ),
      });

      const data: VersionedTransactionData = {
        versionedInstructions: message.compiledInstructions.map((ci) => ({
          programIdIndex: ci.programIdIndex,
          accountKeyIndexes: [...ci.accountKeyIndexes],
          data: base58.encode(ci.data),
        })),
        addressLookupTables: message.addressTableLookups.map((alt) => ({
          accountKey: alt.accountKey.toBase58(),
          writableIndexes: [...alt.writableIndexes],
          readonlyIndexes: [...alt.readonlyIndexes],
        })),
        staticAccountKeys: message.staticAccountKeys.map((key) => key.toBase58()),
        messageHeader: {
          numRequiredSignatures: message.header.numRequiredSignatures,
          numReadonlySignedAccounts: message.header.numReadonlySignedAccounts,
          numReadonlyUnsignedAccounts: message.header.numReadonlyUnsignedAccounts,
        },
        recentBlockhash: recentBlockHash,
      };

      return { message, data };
    }

    /** Compile processed VersionedTransactionData back into a MessageV0 */
    function compileProcessedMessage(data: VersionedTransactionData): MessageV0 {
      return new MessageV0({
        header: { ...data.messageHeader },
        staticAccountKeys: data.staticAccountKeys.map((key) => new PublicKey(key)),
        recentBlockhash: data.recentBlockhash ?? recentBlockHash,
        compiledInstructions: data.versionedInstructions.map((instruction) => ({
          programIdIndex: instruction.programIdIndex,
          accountKeyIndexes: [...instruction.accountKeyIndexes],
          data: Buffer.from(base58.decode(instruction.data)),
        })),
        addressTableLookups: data.addressLookupTables.map((alt) => ({
          accountKey: new PublicKey(alt.accountKey),
          writableIndexes: [...alt.writableIndexes],
          readonlyIndexes: [...alt.readonlyIndexes],
        })),
      });
    }

    /** Inject the durable nonce advance instruction and return the processed data */
    function injectNonceAdvance(data: VersionedTransactionData): VersionedTransactionData {
      const txBuilder = factory.getCustomInstructionBuilder();
      txBuilder.nonce(recentBlockHash, { walletNonceAddress, authWalletAddress });
      txBuilder.fromVersionedTransactionData(data);
      const processed = txBuilder['_transaction'].getVersionedTransactionData();
      should.exist(processed);
      return processed!;
    }

    /** Fixture using every header section and both lookup-table slots */
    const mainFixture = () =>
      buildVersionedFixture(fixturePayer, [
        {
          programId: fixtureProgram,
          keys: [
            { pubkey: fixturePayer, isSigner: true, isWritable: true },
            { pubkey: fixtureRoSigner, isSigner: true, isWritable: false },
            { pubkey: fixtureAltWritable, isSigner: false, isWritable: true },
            { pubkey: fixtureAltReadonly, isSigner: false, isWritable: false },
            { pubkey: fixtureWritableNonSigner, isSigner: false, isWritable: true },
            { pubkey: fixtureRoNonSigner, isSigner: false, isWritable: false },
          ],
        },
      ]);

    it('keeps lookup-table-referencing instructions pointing at the same accounts', () => {
      const { message, data } = mainFixture();
      const processed = injectNonceAdvance(data);

      // The fixture must actually reference accounts loaded from the lookup table
      Math.max(
        ...data.versionedInstructions.flatMap((ix) => [...ix.accountKeyIndexes, ix.programIdIndex])
      ).should.be.greaterThanOrEqual(data.staticAccountKeys.length);

      const before = message.getAccountKeys({ addressLookupTableAccounts: [lookupTableAccount] });
      const after = compileProcessedMessage(processed).getAccountKeys({
        addressLookupTableAccounts: [lookupTableAccount],
      });

      processed.versionedInstructions.should.have.length(data.versionedInstructions.length + 1);
      const remappedInstructions = processed.versionedInstructions.slice(1);
      remappedInstructions.forEach((instruction, ixIndex) => {
        const original = data.versionedInstructions[ixIndex];
        before.get(original.programIdIndex)!.toBase58().should.equal(after.get(instruction.programIdIndex)!.toBase58());
        instruction.accountKeyIndexes.should.have.length(original.accountKeyIndexes.length);
        original.accountKeyIndexes.forEach((_, k) => {
          before
            .get(original.accountKeyIndexes[k])!
            .toBase58()
            .should.equal(after.get(instruction.accountKeyIndexes[k])!.toBase58());
        });
        instruction.data.should.equal(original.data);
      });
    });

    it('keeps Jupiter lookup-table accounts pointing at the same accounts', () => {
      const data = extractVersionedTransactionData(testData.JUPITER_VERSIONED_TX_BYTES);
      const processed = injectNonceAdvance(data);

      // authority, nonce account and sysvar are added; the system program is already present
      const shift = processed.staticAccountKeys.length - data.staticAccountKeys.length;
      shift.should.equal(3);
      processed.messageHeader.should.deepEqual({
        numRequiredSignatures: 2,
        numReadonlySignedAccounts: 1,
        numReadonlyUnsignedAccounts: 6,
      });

      const oldStaticLen = data.staticAccountKeys.length;
      const remappedInstructions = processed.versionedInstructions.slice(1);
      remappedInstructions.forEach((instruction, ixIndex) => {
        const original = data.versionedInstructions[ixIndex];
        const remappedProgramIndex = instruction.programIdIndex;
        if (original.programIdIndex < oldStaticLen) {
          processed.staticAccountKeys[remappedProgramIndex].should.equal(
            data.staticAccountKeys[original.programIdIndex]
          );
        } else {
          remappedProgramIndex.should.equal(original.programIdIndex + shift);
        }
        original.accountKeyIndexes.forEach((oldIndex, k) => {
          const newIndex = instruction.accountKeyIndexes[k];
          if (oldIndex < oldStaticLen) {
            processed.staticAccountKeys[newIndex].should.equal(data.staticAccountKeys[oldIndex]);
          } else {
            newIndex.should.equal(oldIndex + shift);
          }
        });
      });
    });

    it('makes the nonce account writable and keeps original read-only accounts read-only', () => {
      const { data } = mainFixture();
      const processed = injectNonceAdvance(data);
      const message = compileProcessedMessage(processed);

      // header adjusted for the new authority, nonce account, sysvar and system program
      processed.messageHeader.should.deepEqual({
        numRequiredSignatures: 3, // payer + ro signer + new authority
        numReadonlySignedAccounts: 2, // ro signer + new authority
        numReadonlyUnsignedAccounts: 4, // ro non-signer, program, system program, sysvar
      });

      const indexOf = (key: string) => processed.staticAccountKeys.indexOf(key);

      // AdvanceNonceAccount requires a writable nonce account
      message.isAccountWritable(indexOf(walletNonceAddress)).should.equal(true);
      // original accounts keep their writability
      message.isAccountWritable(indexOf(fixturePayer.toBase58())).should.equal(true);
      message.isAccountWritable(indexOf(fixtureWritableNonSigner.toBase58())).should.equal(true);
      message.isAccountWritable(indexOf(fixtureRoSigner.toBase58())).should.equal(false);
      message.isAccountWritable(indexOf(fixtureRoNonSigner.toBase58())).should.equal(false);
      message.isAccountWritable(indexOf(fixtureProgram.toBase58())).should.equal(false);
      // the new authority is a read-only signer
      message.isAccountSigner(indexOf(authWalletAddress)).should.equal(true);
      message.isAccountWritable(indexOf(authWalletAddress)).should.equal(false);
      // no duplicate keys
      new Set(processed.staticAccountKeys).size.should.equal(processed.staticAccountKeys.length);
    });

    it('prepends a well-formed AdvanceNonceAccount instruction', () => {
      const { data } = mainFixture();
      const processed = injectNonceAdvance(data);

      const [nonceAdvance] = processed.versionedInstructions;
      should.exist(nonceAdvance);
      nonceAdvance.data.should.equal('6vx8P'); // SystemProgram AdvanceNonceAccount
      nonceAdvance.programIdIndex.should.equal(processed.staticAccountKeys.indexOf(SYSTEM_PROGRAM_ID));
      nonceAdvance.accountKeyIndexes.should.deepEqual([
        processed.staticAccountKeys.indexOf(walletNonceAddress),
        processed.staticAccountKeys.indexOf(SYSVAR_RECENT_BLOCKHASHES_ID),
        processed.staticAccountKeys.indexOf(authWalletAddress),
      ]);
    });

    it('turns an authority already present as a writable non-signer into a writable signer, once', () => {
      const { data } = buildVersionedFixture(fixturePayer, [
        {
          programId: fixtureProgram,
          keys: [
            { pubkey: fixturePayer, isSigner: true, isWritable: true },
            // authority already present as a writable non-signer
            { pubkey: new PublicKey(authWalletAddress), isSigner: false, isWritable: true },
            { pubkey: fixtureRoNonSigner, isSigner: false, isWritable: false },
          ],
        },
      ]);
      const processed = injectNonceAdvance(data);
      const message = compileProcessedMessage(processed);

      // appears once, as a signer, keeping its writability
      processed.staticAccountKeys.filter((key) => key === authWalletAddress).should.have.length(1);
      const authIndex = processed.staticAccountKeys.indexOf(authWalletAddress);
      message.isAccountSigner(authIndex).should.equal(true);
      message.isAccountWritable(authIndex).should.equal(true);

      processed.messageHeader.numRequiredSignatures.should.equal(data.messageHeader.numRequiredSignatures + 1);
      processed.messageHeader.numReadonlySignedAccounts.should.equal(data.messageHeader.numReadonlySignedAccounts);
    });

    it('turns an authority already present as a read-only non-signer into a read-only signer, once', () => {
      const { data } = buildVersionedFixture(fixturePayer, [
        {
          programId: fixtureProgram,
          keys: [
            { pubkey: fixturePayer, isSigner: true, isWritable: true },
            // authority already present as a read-only non-signer
            { pubkey: new PublicKey(authWalletAddress), isSigner: false, isWritable: false },
            { pubkey: fixtureWritableNonSigner, isSigner: false, isWritable: true },
          ],
        },
      ]);
      const processed = injectNonceAdvance(data);
      const message = compileProcessedMessage(processed);

      // appears once, as a read-only signer
      processed.staticAccountKeys.filter((key) => key === authWalletAddress).should.have.length(1);
      const authIndex = processed.staticAccountKeys.indexOf(authWalletAddress);
      message.isAccountSigner(authIndex).should.equal(true);
      message.isAccountWritable(authIndex).should.equal(false);

      processed.messageHeader.numRequiredSignatures.should.equal(data.messageHeader.numRequiredSignatures + 1);
      processed.messageHeader.numReadonlySignedAccounts.should.equal(data.messageHeader.numReadonlySignedAccounts + 1);
      // it left the read-only non-signers (system program + sysvar are added)
      processed.messageHeader.numReadonlyUnsignedAccounts.should.equal(
        data.messageHeader.numReadonlyUnsignedAccounts + 1
      );
    });

    it('does not add a signer when the nonce authority is already the fee payer', () => {
      const { data } = buildVersionedFixture(new PublicKey(authWalletAddress), [
        {
          programId: fixtureProgram,
          keys: [
            { pubkey: new PublicKey(authWalletAddress), isSigner: true, isWritable: true },
            { pubkey: fixtureWritableNonSigner, isSigner: false, isWritable: true },
          ],
        },
      ]);
      const processed = injectNonceAdvance(data);
      const message = compileProcessedMessage(processed);

      processed.staticAccountKeys[0].should.equal(authWalletAddress);
      processed.staticAccountKeys.filter((key) => key === authWalletAddress).should.have.length(1);
      processed.messageHeader.numRequiredSignatures.should.equal(data.messageHeader.numRequiredSignatures);
      processed.messageHeader.numReadonlySignedAccounts.should.equal(data.messageHeader.numReadonlySignedAccounts);
      message.isAccountSigner(0).should.equal(true);
    });

    it('moves a nonce account already present as read-only into the writable non-signers', () => {
      const { data } = buildVersionedFixture(fixturePayer, [
        {
          programId: fixtureProgram,
          keys: [
            { pubkey: fixturePayer, isSigner: true, isWritable: true },
            { pubkey: fixtureRoNonSigner, isSigner: false, isWritable: false },
            // nonce account already present as a read-only non-signer
            { pubkey: new PublicKey(walletNonceAddress), isSigner: false, isWritable: false },
          ],
        },
      ]);
      const processed = injectNonceAdvance(data);
      const message = compileProcessedMessage(processed);

      processed.staticAccountKeys.filter((key) => key === walletNonceAddress).should.have.length(1);
      const nonceIndex = processed.staticAccountKeys.indexOf(walletNonceAddress);
      message.isAccountWritable(nonceIndex).should.equal(true);
      message.isAccountSigner(nonceIndex).should.equal(false);
      // the other original read-only account stays read-only
      message.isAccountWritable(processed.staticAccountKeys.indexOf(fixtureRoNonSigner.toBase58())).should.equal(false);
    });

    it('produces a signable payload that deserializes as a MessageV0 with the nonce advance first', async () => {
      const { data } = mainFixture();
      const txBuilder = factory.getCustomInstructionBuilder();
      txBuilder.nonce(recentBlockHash, { walletNonceAddress, authWalletAddress });
      txBuilder.fromVersionedTransactionData(data);

      const tx = await txBuilder.build();
      const message = MessageV0.deserialize(tx.signablePayload);

      message.compiledInstructions.should.have.length(data.versionedInstructions.length + 1);
      const nonceAdvance = message.compiledInstructions[0];
      message.staticAccountKeys[nonceAdvance.programIdIndex].toBase58().should.equal(SYSTEM_PROGRAM_ID);
      message.staticAccountKeys[nonceAdvance.accountKeyIndexes[0]].toBase58().should.equal(walletNonceAddress);
      message.staticAccountKeys[nonceAdvance.accountKeyIndexes[1]]
        .toBase58()
        .should.equal(SYSVAR_RECENT_BLOCKHASHES_ID);
      message.staticAccountKeys[nonceAdvance.accountKeyIndexes[2]].toBase58().should.equal(authWalletAddress);
    });

    it('rejects versioned data whose message header is inconsistent', () => {
      const { data } = mainFixture();
      const inconsistent = {
        ...data,
        messageHeader: { ...data.messageHeader, numReadonlyUnsignedAccounts: 99 },
      };
      const txBuilder = factory.getCustomInstructionBuilder();
      txBuilder.nonce(recentBlockHash, { walletNonceAddress, authWalletAddress });
      should(() => txBuilder.fromVersionedTransactionData(inconsistent)).throwError(/Invalid message header/);
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
          addresses: Array.from(
            {
              length: Math.max(...lookup.writableIndexes, ...lookup.readonlyIndexes) + 1,
            },
            () => Keypair.generate().publicKey.toBase58()
          ),
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

    it('rejects addFeePayerSignature() from a key that is not account 0', async () => {
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

    it('rejects a fee payer that is loaded through an address lookup table', () => {
      const data = memoTxData([authAccount.pub, MEMO_PROGRAM], {
        numRequiredSignatures: 1,
        numReadonlySignedAccounts: 0,
        numReadonlyUnsignedAccounts: 0,
      });
      data.addressLookupTables = [
        {
          accountKey: Keypair.generate().publicKey.toBase58(),
          writableIndexes: [0],
          readonlyIndexes: [],
          addresses: [feePayerAccount.pub],
        },
      ];
      should(() => feePayerBuilder(data, feePayerAccount.pub)).throwError(
        'Fee payer cannot be loaded through an address lookup table: ' + feePayerAccount.pub
      );
    });

    it('rejects fee-payer rewriting when lookup-table addresses are unresolved', () => {
      const data = memoTxData([authAccount.pub, MEMO_PROGRAM], {
        numRequiredSignatures: 1,
        numReadonlySignedAccounts: 0,
        numReadonlyUnsignedAccounts: 0,
      });
      data.addressLookupTables = [
        {
          accountKey: Keypair.generate().publicKey.toBase58(),
          writableIndexes: [0],
          readonlyIndexes: [],
        },
      ];
      should(() => feePayerBuilder(data, feePayerAccount.pub)).throwError(
        /address lookup table addresses are unresolved/
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
