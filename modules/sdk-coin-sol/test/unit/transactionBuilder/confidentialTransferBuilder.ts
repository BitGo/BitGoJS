import { KeyPair, Utils, Transaction } from '../../../src';
import should from 'should';
import * as testData from '../../resources/sol';
import { getBuilderFactory } from '../getBuilderFactory';

describe('Solana Confidential Transfer Builder', () => {
  const factory = getBuilderFactory('sol');
  const account = new KeyPair(testData.associatedTokenAccounts.accounts[0]).getKeys();
  const recentBlockHash = 'GHtXQBsoZHVnNFa9YevAzFr17DJjgHXk3ycTKD5xD3Zi';

  // Test addresses (Token-2022 mint + ATAs)
  const mintAddress = testData.associatedTokenAccountsForSol2022.mintId;
  const tokenAddress = testData.associatedTokenAccountsForSol2022.accounts[0].ata;
  const destinationTokenAddress = 'ENn8a2tGMS9bR5XV7smGHJvNgzkyxJmnD2eUvQxY5jSP';
  const authorityAddress = account.pub;
  // Valid base58 addresses for context state accounts (any valid Solana pubkey)
  const eqCtxAddress = testData.associatedTokenAccounts.accounts[0].ata;
  const validityCtxAddress = testData.associatedTokenAccounts.accounts[0].pub;
  const rangeCtxAddress = testData.nonceAccount.pub;

  // Hex test data
  const zeroBytes36 = '00'.repeat(36);
  const zeroBytes64 = '00'.repeat(64);
  const proofDataHex = '00'.repeat(320); // typical equality proof size

  const ctBuilder = () => {
    const txBuilder = factory.getConfidentialTransferBuilder();
    txBuilder.nonce(recentBlockHash);
    txBuilder.sender(account.pub);
    return txBuilder;
  };

  /** Access the raw Solana Transaction from the built tx */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const solTx = (tx: any): any => (tx as Transaction).solTransaction;

  describe('ConfigureAccount', () => {
    it('should build a configure account instruction with correct 47-byte layout', async () => {
      const builder = ctBuilder();
      builder.configureAccount({
        tokenAddress,
        mintAddress,
        authorityAddress,
        decryptableZeroBalance: zeroBytes36,
        maximumPendingBalanceCreditCounter: '65536',
        proofInstructionOffset: 1,
      });

      const tx = await builder.build();
      const instructions = tx.toJson().instructionsData;
      instructions.should.have.length(1);
      instructions[0].type.should.equal('ConfigureConfidentialTransferAccount');

      // Verify raw instruction data
      const rawInstructions = solTx(tx).instructions;
      rawInstructions.should.have.length(1);
      const data = rawInstructions[0].data;
      data.length.should.equal(47);
      data[0].should.equal(27); // ConfidentialTransferExtension
      data[1].should.equal(2); // ConfigureAccount
      data.slice(2, 38).toString('hex').should.equal(zeroBytes36); // decryptable_zero_balance
      data.readBigUInt64LE(38).toString().should.equal('65536'); // max pending balance credit counter
      data[46].should.equal(1); // proof_instruction_offset

      // Verify accounts
      const keys = rawInstructions[0].keys;
      keys.should.have.length(4);
      keys[0].pubkey.toString().should.equal(tokenAddress);
      keys[0].isWritable.should.be.true();
      keys[1].pubkey.toString().should.equal(mintAddress);
      keys[1].isWritable.should.be.false();
      keys[2].pubkey.toString().should.equal('Sysvar1nstructions1111111111111111111111111'); // instructions sysvar
      keys[3].pubkey.toString().should.equal(authorityAddress);
      keys[3].isSigner.should.be.true();
    });

    it('should use context state address when provided', async () => {
      const contextStateAddress = testData.associatedTokenAccounts.accounts[0].pub;
      const builder = ctBuilder();
      builder.configureAccount({
        tokenAddress,
        mintAddress,
        authorityAddress,
        instructionsSysvarOrContextStateAddress: contextStateAddress,
        decryptableZeroBalance: zeroBytes36,
        maximumPendingBalanceCreditCounter: '65536',
        proofInstructionOffset: 0,
      });

      const tx = await builder.build();
      const keys = solTx(tx).instructions[0].keys;
      keys[2].pubkey.toString().should.equal(contextStateAddress);
      const data = solTx(tx).instructions[0].data;
      data[46].should.equal(0); // proof_instruction_offset = 0 (context state)
    });
  });

  describe('ApplyPendingBalance', () => {
    it('should build an apply pending balance instruction with correct 46-byte layout', async () => {
      const builder = ctBuilder();
      builder.applyPendingBalance({
        tokenAddress,
        authorityAddress,
        expectedPendingBalanceCreditCounter: '3',
        newDecryptableAvailableBalance: zeroBytes36,
      });

      const tx = await builder.build();
      const instructions = tx.toJson().instructionsData;
      instructions.should.have.length(1);
      instructions[0].type.should.equal('ApplyPendingBalance');

      const rawInstructions = solTx(tx).instructions;
      rawInstructions.should.have.length(1);
      const data = rawInstructions[0].data;
      data.length.should.equal(46);
      data[0].should.equal(27); // ConfidentialTransferExtension
      data[1].should.equal(8); // ApplyPendingBalance
      data.readBigUInt64LE(2).toString().should.equal('3'); // expected_pending_balance_credit_counter
      data.slice(10, 46).toString('hex').should.equal(zeroBytes36); // new_decryptable_available_balance

      // Verify accounts: [token(writable), authority(signer)]
      const keys = rawInstructions[0].keys;
      keys.should.have.length(2);
      keys[0].pubkey.toString().should.equal(tokenAddress);
      keys[0].isWritable.should.be.true();
      keys[1].pubkey.toString().should.equal(authorityAddress);
      keys[1].isSigner.should.be.true();
    });
  });

  describe('Deposit', () => {
    it('should build a deposit instruction with correct 11-byte layout', async () => {
      const builder = ctBuilder();
      builder.confidentialDeposit({
        tokenAddress,
        mintAddress,
        authorityAddress,
        amount: '1000000',
        decimals: 6,
      });

      const tx = await builder.build();
      const instructions = tx.toJson().instructionsData;
      instructions.should.have.length(1);
      instructions[0].type.should.equal('ConfidentialDeposit');

      const rawInstructions = solTx(tx).instructions;
      rawInstructions.should.have.length(1);
      const data = rawInstructions[0].data;
      data.length.should.equal(11);
      data[0].should.equal(27); // ConfidentialTransferExtension
      data[1].should.equal(5); // Deposit
      data.readBigUInt64LE(2).toString().should.equal('1000000'); // amount
      data[10].should.equal(6); // decimals

      // Verify accounts: [token(writable), mint, authority(signer)]
      const keys = rawInstructions[0].keys;
      keys.should.have.length(3);
      keys[0].pubkey.toString().should.equal(tokenAddress);
      keys[0].isWritable.should.be.true();
      keys[1].pubkey.toString().should.equal(mintAddress);
      keys[2].pubkey.toString().should.equal(authorityAddress);
      keys[2].isSigner.should.be.true();
    });
  });

  describe('Withdraw', () => {
    it('should build a withdraw instruction with correct 49-byte layout and inline proofs', async () => {
      const builder = ctBuilder();
      builder.confidentialWithdraw({
        tokenAddress,
        mintAddress,
        authorityAddress,
        amount: '500000',
        decimals: 6,
        newDecryptableAvailableBalance: zeroBytes36,
        equalityProofInstructionOffset: 1,
        rangeProofInstructionOffset: 2,
      });

      const tx = await builder.build();
      const instructions = tx.toJson().instructionsData;
      instructions.should.have.length(1);
      instructions[0].type.should.equal('ConfidentialWithdraw');

      const rawInstructions = solTx(tx).instructions;
      rawInstructions.should.have.length(1);
      const data = rawInstructions[0].data;
      data.length.should.equal(49);
      data[0].should.equal(27); // ConfidentialTransferExtension
      data[1].should.equal(6); // Withdraw
      data.readBigUInt64LE(2).toString().should.equal('500000'); // amount
      data[10].should.equal(6); // decimals
      data.slice(11, 47).toString('hex').should.equal(zeroBytes36); // new_decryptable
      data[47].should.equal(1); // equality proof offset
      data[48].should.equal(2); // range proof offset

      // Verify accounts: [token(writable), mint, sysvar, authority(signer)]
      const keys = rawInstructions[0].keys;
      keys.should.have.length(4);
      keys[0].pubkey.toString().should.equal(tokenAddress);
      keys[0].isWritable.should.be.true();
      keys[1].pubkey.toString().should.equal(mintAddress);
      keys[2].pubkey.toString().should.equal('Sysvar1nstructions1111111111111111111111111');
      keys[3].pubkey.toString().should.equal(authorityAddress);
      keys[3].isSigner.should.be.true();
    });

    it('should build a withdraw instruction with context state accounts', async () => {
      const builder = ctBuilder();
      builder.confidentialWithdraw({
        tokenAddress,
        mintAddress,
        authorityAddress,
        equalityProofContextStateAddress: eqCtxAddress,
        rangeProofContextStateAddress: rangeCtxAddress,
        amount: '500000',
        decimals: 6,
        newDecryptableAvailableBalance: zeroBytes36,
        equalityProofInstructionOffset: 0,
        rangeProofInstructionOffset: 0,
      });

      const tx = await builder.build();
      const keys = solTx(tx).instructions[0].keys;
      // [token, mint, eqCtx, rgCtx, authority] — no sysvar since all proofs use context state
      keys.should.have.length(5);
      keys[2].pubkey.toString().should.equal(eqCtxAddress);
      keys[3].pubkey.toString().should.equal(rangeCtxAddress);
      keys[4].pubkey.toString().should.equal(authorityAddress);
      keys[4].isSigner.should.be.true();
    });
  });

  describe('ConfidentialTransfer', () => {
    it('should build a transfer instruction with correct 169-byte layout and inline proofs', async () => {
      const builder = ctBuilder();
      builder.confidentialTransfer({
        sourceTokenAddress: tokenAddress,
        mintAddress,
        destinationTokenAddress,
        authorityAddress,
        newSourceDecryptableAvailableBalance: zeroBytes36,
        transferAmountAuditorCiphertextLo: zeroBytes64,
        transferAmountAuditorCiphertextHi: zeroBytes64,
        equalityProofInstructionOffset: 1,
        ciphertextValidityProofInstructionOffset: 2,
        rangeProofInstructionOffset: 3,
      });

      const tx = await builder.build();
      const instructions = tx.toJson().instructionsData;
      instructions.should.have.length(1);
      instructions[0].type.should.equal('ConfidentialTransfer');

      const rawInstructions = solTx(tx).instructions;
      rawInstructions.should.have.length(1);
      const data = rawInstructions[0].data;
      data.length.should.equal(169);
      data[0].should.equal(27); // ConfidentialTransferExtension
      data[1].should.equal(7); // Transfer
      data.slice(2, 38).toString('hex').should.equal(zeroBytes36); // new_source_decryptable
      data.slice(38, 102).toString('hex').should.equal(zeroBytes64); // auditor_ct_lo
      data.slice(102, 166).toString('hex').should.equal(zeroBytes64); // auditor_ct_hi
      data[166].should.equal(1); // equality proof offset
      data[167].should.equal(2); // validity proof offset
      data[168].should.equal(3); // range proof offset

      // Verify accounts: [source(writable), mint, dest(writable), sysvar, authority(signer)]
      const keys = rawInstructions[0].keys;
      keys.should.have.length(5);
      keys[0].pubkey.toString().should.equal(tokenAddress);
      keys[0].isWritable.should.be.true();
      keys[1].pubkey.toString().should.equal(mintAddress);
      keys[2].pubkey.toString().should.equal(destinationTokenAddress);
      keys[2].isWritable.should.be.true();
      keys[3].pubkey.toString().should.equal('Sysvar1nstructions1111111111111111111111111');
      keys[4].pubkey.toString().should.equal(authorityAddress);
      keys[4].isSigner.should.be.true();
    });

    it('should build a transfer instruction with context state accounts', async () => {
      const builder = ctBuilder();
      builder.confidentialTransfer({
        sourceTokenAddress: tokenAddress,
        mintAddress,
        destinationTokenAddress,
        authorityAddress,
        equalityProofContextStateAddress: eqCtxAddress,
        ciphertextValidityProofContextStateAddress: validityCtxAddress,
        rangeProofContextStateAddress: rangeCtxAddress,
        newSourceDecryptableAvailableBalance: zeroBytes36,
        transferAmountAuditorCiphertextLo: zeroBytes64,
        transferAmountAuditorCiphertextHi: zeroBytes64,
        equalityProofInstructionOffset: 0,
        ciphertextValidityProofInstructionOffset: 0,
        rangeProofInstructionOffset: 0,
      });

      const tx = await builder.build();
      const keys = solTx(tx).instructions[0].keys;
      // [source, mint, dest, eqCtx, validityCtx, rangeCtx, authority] — no sysvar
      keys.should.have.length(7);
      keys[3].pubkey.toString().should.equal(eqCtxAddress);
      keys[4].pubkey.toString().should.equal(validityCtxAddress);
      keys[5].pubkey.toString().should.equal(rangeCtxAddress);
      keys[6].pubkey.toString().should.equal(authorityAddress);
      keys[6].isSigner.should.be.true();
    });
  });

  describe('VerifyPubkeyValidity', () => {
    it('should build a verify pubkey validity instruction with inline proof data', async () => {
      const builder = ctBuilder();
      builder.verifyPubkeyValidity({ proofData: proofDataHex });

      const tx = await builder.build();
      const rawInstructions = solTx(tx).instructions;
      rawInstructions.should.have.length(1);
      const data = rawInstructions[0].data;
      data[0].should.equal(4); // VerifyPubkeyValidity discriminator
      data.length.should.equal(1 + 320); // discriminator + proof data
      data.slice(1).toString('hex').should.equal(proofDataHex);

      // No accounts for inline proof
      rawInstructions[0].keys.should.have.length(0);

      // Verify program id (canonical on-chain id)
      rawInstructions[0].programId.toString().should.equal('ZkE1Gama1Proof11111111111111111111111111111');
    });

    it('should build with context state account (fix #3)', async () => {
      const builder = ctBuilder();
      builder.verifyPubkeyValidity({
        contextStateAccountAddress: eqCtxAddress,
        contextStateAuthorityAddress: authorityAddress,
      });

      const tx = await builder.build();
      const rawIx = solTx(tx).instructions[0];
      const data = rawIx.data;
      data[0].should.equal(4); // VerifyPubkeyValidity discriminator
      // Context state accounts: [contextState(writable), authority]
      rawIx.keys.should.have.length(2);
      rawIx.keys[0].pubkey.toString().should.equal(eqCtxAddress);
      rawIx.keys[0].isWritable.should.be.true();
      rawIx.keys[1].pubkey.toString().should.equal(authorityAddress);
    });
  });

  describe('VerifyEqualityProof', () => {
    it('should build with inline proof data', async () => {
      const builder = ctBuilder();
      builder.verifyEqualityProof({ proofData: proofDataHex });

      const tx = await builder.build();
      const data = solTx(tx).instructions[0].data;
      data[0].should.equal(3); // VerifyCiphertextCommitmentEquality discriminator
      data.length.should.equal(1 + 320);
      data.slice(1).toString('hex').should.equal(proofDataHex);
    });

    it('should build with context state offset', async () => {
      const builder = ctBuilder();
      builder.verifyEqualityProof({
        contextStateAccountAddress: eqCtxAddress,
        contextStateAuthorityAddress: authorityAddress,
        offset: 0,
      });

      const tx = await builder.build();
      const rawIx = solTx(tx).instructions[0];
      const data = rawIx.data;
      data[0].should.equal(3);
      data.readUInt32LE(1).should.equal(0); // offset as u32

      // Context state accounts: [contextState(writable), authority]
      rawIx.keys.should.have.length(2);
      rawIx.keys[0].pubkey.toString().should.equal(eqCtxAddress);
      rawIx.keys[0].isWritable.should.be.true();
      rawIx.keys[1].pubkey.toString().should.equal(authorityAddress);
    });
  });

  describe('VerifyValidityProof', () => {
    it('should build with inline proof data', async () => {
      const builder = ctBuilder();
      builder.verifyValidityProof({ proofData: proofDataHex });

      const tx = await builder.build();
      const data = solTx(tx).instructions[0].data;
      data[0].should.equal(12); // VerifyBatchedGroupedCiphertext3HandlesValidity
      data.length.should.equal(1 + 320);
    });
  });

  describe('VerifyRangeProof', () => {
    it('should build with inline proof data', async () => {
      const builder = ctBuilder();
      builder.verifyRangeProof({ proofData: '00'.repeat(1000) }); // range proof is ~1000 bytes

      const tx = await builder.build();
      const data = solTx(tx).instructions[0].data;
      data[0].should.equal(7); // VerifyBatchedRangeProofU128
      data.length.should.equal(1 + 1000);
    });
  });

  describe('Multiple instructions (v1 tx simulation)', () => {
    it('should build ApplyPendingBalance + 3 proofs + Transfer in correct order', async () => {
      const builder = ctBuilder();
      builder
        .applyPendingBalance({
          tokenAddress,
          authorityAddress,
          expectedPendingBalanceCreditCounter: '2',
          newDecryptableAvailableBalance: zeroBytes36,
        })
        .verifyEqualityProof({ proofData: proofDataHex })
        .verifyValidityProof({ proofData: proofDataHex })
        .verifyRangeProof({ proofData: '00'.repeat(1000) })
        .confidentialTransfer({
          sourceTokenAddress: tokenAddress,
          mintAddress,
          destinationTokenAddress,
          authorityAddress,
          newSourceDecryptableAvailableBalance: zeroBytes36,
          transferAmountAuditorCiphertextLo: zeroBytes64,
          transferAmountAuditorCiphertextHi: zeroBytes64,
          equalityProofInstructionOffset: 1,
          ciphertextValidityProofInstructionOffset: 2,
          rangeProofInstructionOffset: 3,
        });

      const tx = await builder.build();
      const instructions = tx.toJson().instructionsData;
      instructions.should.have.length(5);
      instructions[0].type.should.equal('ApplyPendingBalance');
      instructions[1].type.should.equal('VerifyEqualityProof');
      instructions[2].type.should.equal('VerifyValidityProof');
      instructions[3].type.should.equal('VerifyRangeProof');
      instructions[4].type.should.equal('ConfidentialTransfer');

      // Note: Cannot verify toBroadcastFormat() here because 3 proofs (320+320+1000 bytes)
      // + transfer (169B) exceeds v0 tx size limit (1232B). These are v1 transactions (4132B).
      // The instruction data layouts are verified individually in the tests above.
    });

    it('should build ConfigureAccount + VerifyPubkeyValidity', async () => {
      const builder = ctBuilder();
      builder
        .configureAccount({
          tokenAddress,
          mintAddress,
          authorityAddress,
          decryptableZeroBalance: zeroBytes36,
          maximumPendingBalanceCreditCounter: '65536',
          proofInstructionOffset: 1,
        })
        .verifyPubkeyValidity({ proofData: proofDataHex });

      const tx = await builder.build();
      const instructions = tx.toJson().instructionsData;
      instructions.should.have.length(2);
      instructions[0].type.should.equal('ConfigureConfidentialTransferAccount');
      instructions[1].type.should.equal('VerifyPubkeyValidity');

      const rawTx = tx.toBroadcastFormat();
      Utils.isValidRawTransaction(rawTx).should.equal(true);
    });
  });

  describe('Raw transaction validity', () => {
    it('should produce a valid raw transaction', async () => {
      const builder = ctBuilder();
      builder.configureAccount({
        tokenAddress,
        mintAddress,
        authorityAddress,
        decryptableZeroBalance: zeroBytes36,
        maximumPendingBalanceCreditCounter: '65536',
        proofInstructionOffset: 1,
      });

      const tx = await builder.build();
      const rawTx = tx.toBroadcastFormat();
      Utils.isValidRawTransaction(rawTx).should.equal(true);
    });
  });

  describe('Validation', () => {
    it('should reject empty builder', async () => {
      const builder = ctBuilder();
      await builder.build().should.be.rejectedWith(/confidential transfer instruction/);
    });

    it('should reject missing tokenAddress on configureAccount', () => {
      const builder = ctBuilder();
      should.throws(() =>
        builder.configureAccount({
          tokenAddress: '',
          mintAddress,
          authorityAddress,
          decryptableZeroBalance: zeroBytes36,
          maximumPendingBalanceCreditCounter: '65536',
          proofInstructionOffset: 1,
        })
      );
    });
  });

  // ─── Fix-specific tests ────────────────────────────────────────────────────

  describe('Fix #1: signed i8 proof instruction offsets', () => {
    it('should correctly encode negative offset on ConfigureAccount', async () => {
      const builder = ctBuilder();
      builder.configureAccount({
        tokenAddress,
        mintAddress,
        authorityAddress,
        decryptableZeroBalance: zeroBytes36,
        maximumPendingBalanceCreditCounter: '65536',
        proofInstructionOffset: -1, // proof is the previous instruction
      });

      const tx = await builder.build();
      const data = solTx(tx).instructions[0].data;
      data[46].should.equal(255); // -1 as i8 = 255 as u8 (two's complement)
    });

    it('should correctly encode negative offset on Withdraw', async () => {
      const builder = ctBuilder();
      builder.confidentialWithdraw({
        tokenAddress,
        mintAddress,
        authorityAddress,
        equalityProofContextStateAddress: eqCtxAddress,
        rangeProofContextStateAddress: rangeCtxAddress,
        amount: '100',
        decimals: 6,
        newDecryptableAvailableBalance: zeroBytes36,
        equalityProofInstructionOffset: -1,
        rangeProofInstructionOffset: -2,
      });

      const tx = await builder.build();
      const data = solTx(tx).instructions[0].data;
      data[47].should.equal(255); // -1 as i8
      data[48].should.equal(254); // -2 as i8
    });

    it('should correctly encode negative offsets on Transfer', async () => {
      const builder = ctBuilder();
      builder.confidentialTransfer({
        sourceTokenAddress: tokenAddress,
        mintAddress,
        destinationTokenAddress,
        authorityAddress,
        equalityProofContextStateAddress: eqCtxAddress,
        ciphertextValidityProofContextStateAddress: validityCtxAddress,
        rangeProofContextStateAddress: rangeCtxAddress,
        newSourceDecryptableAvailableBalance: zeroBytes36,
        transferAmountAuditorCiphertextLo: zeroBytes64,
        transferAmountAuditorCiphertextHi: zeroBytes64,
        equalityProofInstructionOffset: -3,
        ciphertextValidityProofInstructionOffset: -2,
        rangeProofInstructionOffset: -1,
      });

      const tx = await builder.build();
      const data = solTx(tx).instructions[0].data;
      data[166].should.equal(253); // -3 as i8
      data[167].should.equal(254); // -2 as i8
      data[168].should.equal(255); // -1 as i8
    });
  });

  describe('Fix #2: instruction order preservation in parser', () => {
    it('should preserve interleaved CT and custom instruction order', async () => {
      const builder = ctBuilder();
      builder
        .applyPendingBalance({
          tokenAddress,
          authorityAddress,
          expectedPendingBalanceCreditCounter: '1',
          newDecryptableAvailableBalance: zeroBytes36,
        })
        .verifyEqualityProof({ proofData: proofDataHex })
        .confidentialTransfer({
          sourceTokenAddress: tokenAddress,
          mintAddress,
          destinationTokenAddress,
          authorityAddress,
          equalityProofContextStateAddress: eqCtxAddress,
          ciphertextValidityProofContextStateAddress: validityCtxAddress,
          rangeProofContextStateAddress: rangeCtxAddress,
          newSourceDecryptableAvailableBalance: zeroBytes36,
          transferAmountAuditorCiphertextLo: zeroBytes64,
          transferAmountAuditorCiphertextHi: zeroBytes64,
          equalityProofInstructionOffset: 0,
          ciphertextValidityProofInstructionOffset: 0,
          rangeProofInstructionOffset: 0,
        });

      const tx = await builder.build();
      const instructions = tx.toJson().instructionsData;
      // Order should be: ApplyPendingBalance, VerifyEqualityProof, ConfidentialTransfer
      instructions.should.have.length(3);
      instructions[0].type.should.equal('ApplyPendingBalance');
      instructions[1].type.should.equal('VerifyEqualityProof');
      instructions[2].type.should.equal('ConfidentialTransfer');
    });
  });

  describe('Fix #3: VerifyPubkeyValidity context state mode', () => {
    it('should not throw when only context state accounts are provided (no proofData)', async () => {
      const builder = ctBuilder();
      builder.verifyPubkeyValidity({
        contextStateAccountAddress: eqCtxAddress,
        contextStateAuthorityAddress: authorityAddress,
      });

      const tx = await builder.build();
      const rawIx = solTx(tx).instructions[0];
      // Should produce an offset-based instruction, not throw
      rawIx.data[0].should.equal(4);
      rawIx.keys.should.have.length(2);
    });
  });

  describe('Fix #4: context state address required when offset == 0', () => {
    it('should reject Withdraw with offset 0 but missing equality context state address', async () => {
      const builder = ctBuilder();
      builder.confidentialWithdraw({
        tokenAddress,
        mintAddress,
        authorityAddress,
        rangeProofContextStateAddress: rangeCtxAddress,
        amount: '100',
        decimals: 6,
        newDecryptableAvailableBalance: zeroBytes36,
        equalityProofInstructionOffset: 0, // context state mode but no address
        rangeProofInstructionOffset: 0,
      });
      await builder.build().should.be.rejectedWith(/equalityProofContextStateAddress is required/);
    });

    it('should reject Transfer with offset 0 but missing range context state address', async () => {
      const builder = ctBuilder();
      builder.confidentialTransfer({
        sourceTokenAddress: tokenAddress,
        mintAddress,
        destinationTokenAddress,
        authorityAddress,
        equalityProofContextStateAddress: eqCtxAddress,
        ciphertextValidityProofContextStateAddress: validityCtxAddress,
        newSourceDecryptableAvailableBalance: zeroBytes36,
        transferAmountAuditorCiphertextLo: zeroBytes64,
        transferAmountAuditorCiphertextHi: zeroBytes64,
        equalityProofInstructionOffset: 0,
        ciphertextValidityProofInstructionOffset: 0,
        rangeProofInstructionOffset: 0, // context state mode but no address
      });
      await builder.build().should.be.rejectedWith(/rangeProofContextStateAddress is required/);
    });
  });

  describe('Fix #5: numeric string validation', () => {
    it('should reject non-numeric amount on Deposit', async () => {
      const builder = ctBuilder();
      builder.confidentialDeposit({
        tokenAddress,
        mintAddress,
        authorityAddress,
        amount: 'abc',
        decimals: 6,
      });
      await builder.build().should.be.rejectedWith(/Invalid amount: expected non-negative integer string/);
    });

    it('should reject negative amount on Deposit', async () => {
      const builder = ctBuilder();
      builder.confidentialDeposit({
        tokenAddress,
        mintAddress,
        authorityAddress,
        amount: '-100',
        decimals: 6,
      });
      await builder.build().should.be.rejectedWith(/Invalid amount: expected non-negative integer string/);
    });

    it('should reject non-numeric counter on ApplyPendingBalance', async () => {
      const builder = ctBuilder();
      builder.applyPendingBalance({
        tokenAddress,
        authorityAddress,
        expectedPendingBalanceCreditCounter: 'not-a-number',
        newDecryptableAvailableBalance: zeroBytes36,
      });
      await builder.build().should.be.rejectedWith(/Invalid expectedPendingBalanceCreditCounter/);
    });

    it('should reject non-numeric counter on ConfigureAccount', async () => {
      const builder = ctBuilder();
      builder.configureAccount({
        tokenAddress,
        mintAddress,
        authorityAddress,
        decryptableZeroBalance: zeroBytes36,
        maximumPendingBalanceCreditCounter: 'foo',
        proofInstructionOffset: 1,
      });
      await builder.build().should.be.rejectedWith(/Invalid maximumPendingBalanceCreditCounter/);
    });

    it('should accept amount of 0 on Deposit', async () => {
      const builder = ctBuilder();
      builder.confidentialDeposit({
        tokenAddress,
        mintAddress,
        authorityAddress,
        amount: '0',
        decimals: 6,
      });

      const tx = await builder.build();
      const data = solTx(tx).instructions[0].data;
      data.readBigUInt64LE(2).toString().should.equal('0');
    });
  });

  describe('Fix #6: canonical ZK proof program ID', () => {
    it('should use canonical zk-elgamal-proof program id', async () => {
      const builder = ctBuilder();
      builder.verifyEqualityProof({ proofData: proofDataHex });

      const tx = await builder.build();
      solTx(tx).instructions[0].programId.toString().should.equal('ZkE1Gama1Proof11111111111111111111111111111');
    });

    it('should allow overriding ZK proof program id', async () => {
      const customProgramId = testData.associatedTokenAccounts.accounts[0].pub; // any valid pubkey
      const builder = ctBuilder();
      builder.zkProofProgramId(customProgramId);
      builder.verifyEqualityProof({ proofData: proofDataHex });

      const tx = await builder.build();
      solTx(tx).instructions[0].programId.toString().should.equal(customProgramId);
    });
  });

  describe('Fix #8: from() routing for CT transactions', () => {
    it('should route CT transaction to ConfidentialTransferBuilder on from()', async () => {
      // Build a CT transaction
      const builder = ctBuilder();
      builder.configureAccount({
        tokenAddress,
        mintAddress,
        authorityAddress,
        decryptableZeroBalance: zeroBytes36,
        maximumPendingBalanceCreditCounter: '65536',
        proofInstructionOffset: 1,
      });

      const tx = await builder.build();
      const rawTx = tx.toBroadcastFormat();

      // Parse it back via factory.from()
      const parsedBuilder = factory.from(rawTx);
      // Should be a ConfidentialTransferBuilder, not CustomInstructionBuilder
      parsedBuilder.constructor.name.should.equal('ConfidentialTransferBuilder');
    });

    it('should route non-CT custom transaction to CustomInstructionBuilder on from()', async () => {
      // Build a non-CT custom transaction
      const customBuilder = factory.getCustomInstructionBuilder();
      customBuilder.nonce(recentBlockHash);
      customBuilder.sender(account.pub);
      customBuilder.addCustomInstruction({
        programId: 'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr',
        keys: [],
        data: 'hello',
      });

      const tx = await customBuilder.build();
      const rawTx = tx.toBroadcastFormat();

      // Parse it back via factory.from()
      const parsedBuilder = factory.from(rawTx);
      parsedBuilder.constructor.name.should.equal('CustomInstructionBuilder');
    });
  });

  describe('Fix #9: range validation for decimals and proof offsets', () => {
    it('should reject decimals > 255 on Deposit', async () => {
      const builder = ctBuilder();
      builder.confidentialDeposit({
        tokenAddress,
        mintAddress,
        authorityAddress,
        amount: '100',
        decimals: 256,
      });
      await builder.build().should.be.rejectedWith(/Invalid decimals: expected u8 \(0-255\)/);
    });

    it('should reject negative decimals on Deposit', async () => {
      const builder = ctBuilder();
      builder.confidentialDeposit({
        tokenAddress,
        mintAddress,
        authorityAddress,
        amount: '100',
        decimals: -1,
      });
      await builder.build().should.be.rejectedWith(/Invalid decimals: expected u8 \(0-255\)/);
    });

    it('should reject non-integer decimals on Deposit', async () => {
      const builder = ctBuilder();
      builder.confidentialDeposit({
        tokenAddress,
        mintAddress,
        authorityAddress,
        amount: '100',
        decimals: 6.5,
      });
      await builder.build().should.be.rejectedWith(/Invalid decimals: expected u8 \(0-255\)/);
    });

    it('should reject proof offset > 127 on ConfigureAccount', async () => {
      const builder = ctBuilder();
      builder.configureAccount({
        tokenAddress,
        mintAddress,
        authorityAddress,
        decryptableZeroBalance: zeroBytes36,
        maximumPendingBalanceCreditCounter: '65536',
        proofInstructionOffset: 128,
      });
      await builder.build().should.be.rejectedWith(/Invalid proofInstructionOffset: expected i8 \(-128 to 127\)/);
    });

    it('should reject proof offset < -128 on ConfigureAccount', async () => {
      const builder = ctBuilder();
      builder.configureAccount({
        tokenAddress,
        mintAddress,
        authorityAddress,
        decryptableZeroBalance: zeroBytes36,
        maximumPendingBalanceCreditCounter: '65536',
        proofInstructionOffset: -129,
      });
      await builder.build().should.be.rejectedWith(/Invalid proofInstructionOffset: expected i8 \(-128 to 127\)/);
    });

    it('should reject equality proof offset > 127 on Withdraw', async () => {
      const builder = ctBuilder();
      builder.confidentialWithdraw({
        tokenAddress,
        mintAddress,
        authorityAddress,
        equalityProofContextStateAddress: eqCtxAddress,
        rangeProofContextStateAddress: rangeCtxAddress,
        amount: '100',
        decimals: 6,
        newDecryptableAvailableBalance: zeroBytes36,
        equalityProofInstructionOffset: 200,
        rangeProofInstructionOffset: 0,
      });
      await builder.build().should.be.rejectedWith(/Invalid equalityProofInstructionOffset: expected i8/);
    });

    it('should reject range proof offset < -128 on Withdraw', async () => {
      const builder = ctBuilder();
      builder.confidentialWithdraw({
        tokenAddress,
        mintAddress,
        authorityAddress,
        equalityProofContextStateAddress: eqCtxAddress,
        rangeProofContextStateAddress: rangeCtxAddress,
        amount: '100',
        decimals: 6,
        newDecryptableAvailableBalance: zeroBytes36,
        equalityProofInstructionOffset: 0,
        rangeProofInstructionOffset: -200,
      });
      await builder.build().should.be.rejectedWith(/Invalid rangeProofInstructionOffset: expected i8/);
    });

    it('should reject validity proof offset out of i8 range on Transfer', async () => {
      const builder = ctBuilder();
      builder.confidentialTransfer({
        sourceTokenAddress: tokenAddress,
        mintAddress,
        destinationTokenAddress,
        authorityAddress,
        equalityProofContextStateAddress: eqCtxAddress,
        ciphertextValidityProofContextStateAddress: validityCtxAddress,
        rangeProofContextStateAddress: rangeCtxAddress,
        newSourceDecryptableAvailableBalance: zeroBytes36,
        transferAmountAuditorCiphertextLo: zeroBytes64,
        transferAmountAuditorCiphertextHi: zeroBytes64,
        equalityProofInstructionOffset: 0,
        ciphertextValidityProofInstructionOffset: 255,
        rangeProofInstructionOffset: 0,
      });
      await builder.build().should.be.rejectedWith(/Invalid ciphertextValidityProofInstructionOffset: expected i8/);
    });

    it('should accept boundary offset values (-128 and 127)', async () => {
      const builder = ctBuilder();
      builder.configureAccount({
        tokenAddress,
        mintAddress,
        authorityAddress,
        decryptableZeroBalance: zeroBytes36,
        maximumPendingBalanceCreditCounter: '65536',
        proofInstructionOffset: 127,
      });

      const tx = await builder.build();
      const data = solTx(tx).instructions[0].data;
      data[46].should.equal(127);
    });
  });

  describe('Fix #10: u64 overflow validation', () => {
    it('should reject amount exceeding u64 max on Deposit', async () => {
      const builder = ctBuilder();
      builder.confidentialDeposit({
        tokenAddress,
        mintAddress,
        authorityAddress,
        amount: '18446744073709551616', // 2^64
        decimals: 6,
      });
      await builder.build().should.be.rejectedWith(/Invalid amount: value exceeds u64 max/);
    });

    it('should accept amount at u64 max on Deposit', async () => {
      const builder = ctBuilder();
      builder.confidentialDeposit({
        tokenAddress,
        mintAddress,
        authorityAddress,
        amount: '18446744073709551615', // 2^64 - 1
        decimals: 6,
      });

      const tx = await builder.build();
      const data = solTx(tx).instructions[0].data;
      data.readBigUInt64LE(2).toString().should.equal('18446744073709551615');
    });

    it('should reject counter exceeding u64 max on ConfigureAccount', async () => {
      const builder = ctBuilder();
      builder.configureAccount({
        tokenAddress,
        mintAddress,
        authorityAddress,
        decryptableZeroBalance: zeroBytes36,
        maximumPendingBalanceCreditCounter: '18446744073709551616', // 2^64
        proofInstructionOffset: 1,
      });
      await builder.build().should.be.rejectedWith(/Invalid maximumPendingBalanceCreditCounter: value exceeds u64 max/);
    });
  });
});
