/**
 * WASM vs Legacy Transaction Builder Semantic Equivalence Tests
 *
 * These tests verify that the WASM transaction builder produces semantically equivalent
 * transactions to the legacy @solana/web3.js-based builder.
 *
 * IMPORTANT: The WASM builder (Rust) and legacy builder (JavaScript/@solana/web3.js) may
 * produce different raw byte representations for the same logical transaction. This is
 * expected behavior due to:
 *
 * 1. Account ordering: Solana transactions contain an accounts array that can be ordered
 *    differently while producing the same on-chain behavior.
 * 2. Compact array encoding: Different implementations may use different but valid encodings.
 * 3. Signature placeholder ordering: Unsigned transactions may order signature slots differently.
 *
 * Both representations are valid Solana transactions that will execute identically on-chain.
 * These tests verify semantic equivalence (same instructions, same accounts, same behavior)
 * rather than byte-for-byte equality.
 */
import should from 'should';

import * as testData from '../../resources/sol';
import { getBuilderFactory } from '../getBuilderFactory';
import { KeyPair, Utils } from '../../../src';
import { InstructionBuilderTypes } from '../../../src/lib/constants';
import { Transaction } from '../../../src/lib/transaction';
import { mapToTransactionIntent, areInstructionsSupportedByWasm } from '../../../src/lib/wasmIntentMapper';
import { buildTransaction as wasmBuildTransaction } from '@bitgo/wasm-solana';

describe('Sol WASM Semantic Equivalence', () => {
  const factory = getBuilderFactory('tsol');

  // Test accounts
  const wallet = new KeyPair(testData.authAccount).getKeys();
  const nonceAccount = testData.nonceAccount;

  const recentBlockHash = 'GHtXQBsoZHVnNFa9YevAzFr17DJjgHXk3ycTKD5xD3Zi';

  /**
   * Helper to compare two transactions semantically (not byte-for-byte).
   * Verifies that both transactions have the same logical structure.
   */
  const compareTransactionsSemantically = (legacyTx: Transaction, wasmTx: Transaction) => {
    const legacyJson = legacyTx.toJson();
    const wasmJson = wasmTx.toJson();

    // Fee payer should be the same
    should.equal(wasmJson.feePayer, legacyJson.feePayer, 'Fee payer should match');

    // Number of signatures should be the same
    should.equal(wasmJson.numSignatures, legacyJson.numSignatures, 'Number of signatures should match');

    // Transaction type should be the same
    should.equal(wasmTx.type, legacyTx.type, 'Transaction type should match');

    // Inputs and outputs should match
    should.deepEqual(wasmTx.inputs, legacyTx.inputs, 'Inputs should match');
    should.deepEqual(wasmTx.outputs, legacyTx.outputs, 'Outputs should match');

    // Both should be valid raw transactions
    should.equal(Utils.isValidRawTransaction(legacyTx.toBroadcastFormat()), true, 'Legacy tx should be valid');
    should.equal(Utils.isValidRawTransaction(wasmTx.toBroadcastFormat()), true, 'WASM tx should be valid');
  };

  /**
   * Helper to compare parsed instruction data.
   * The instruction parameters should be semantically equivalent.
   */
  const compareInstructionData = (legacyInstructions: any[], wasmInstructions: any[], skipExtraParamsCheck = false) => {
    should.equal(
      wasmInstructions.length,
      legacyInstructions.length,
      `Instruction count should match: WASM has ${wasmInstructions.length}, legacy has ${legacyInstructions.length}`
    );

    for (let i = 0; i < legacyInstructions.length; i++) {
      const legacy = legacyInstructions[i];
      const wasm = wasmInstructions[i];

      should.equal(wasm.type, legacy.type, `Instruction ${i} type should match`);

      // Compare params, optionally skipping extraParams which may have undefined vs missing key differences
      if (skipExtraParamsCheck && legacy.params && wasm.params) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { extraParams: _legacyExtra, ...legacyRest } = legacy.params;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { extraParams: _wasmExtra, ...wasmRest } = wasm.params;
        should.deepEqual(wasmRest, legacyRest, `Instruction ${i} params (excluding extraParams) should match`);
      } else {
        should.deepEqual(wasm.params, legacy.params, `Instruction ${i} params should match`);
      }
    }
  };

  describe('Basic Transfer transactions', () => {
    it('should produce semantically equivalent transfer transactions', async () => {
      // Build using legacy builder
      const legacyBuilder = factory.getTransferBuilder();
      legacyBuilder
        .sender(wallet.pub)
        .nonce(recentBlockHash)
        .send({ address: testData.addresses.validAddresses[0], amount: '10000' })
        .fee({ amount: 5000 });
      const legacyTx = (await legacyBuilder.build()) as Transaction;

      // Build using WASM directly
      const intent = mapToTransactionIntent({
        feePayer: wallet.pub,
        recentBlockhash: recentBlockHash,
        instructionsData: [
          {
            type: InstructionBuilderTypes.Transfer,
            params: {
              fromAddress: wallet.pub,
              toAddress: testData.addresses.validAddresses[0],
              amount: '10000',
            },
          },
        ],
      });

      const wasmRawTx = wasmBuildTransaction(intent).toBytes();
      const wasmTx = new Transaction(factory['_coinConfig']);
      wasmTx.fromRawTransaction(Buffer.from(wasmRawTx).toString('base64'));

      // Compare semantically
      compareTransactionsSemantically(legacyTx, wasmTx);
      compareInstructionData(legacyTx.toJson().instructionsData, wasmTx.toJson().instructionsData);

      // Log for visibility that bytes differ but both are valid
      const legacyBytes = legacyTx.toBroadcastFormat();
      const wasmBytes = wasmTx.toBroadcastFormat();
      if (legacyBytes !== wasmBytes) {
        // This is expected - different byte ordering but same semantic meaning
        // Both are valid Solana transactions
      }
    });

    it('should produce semantically equivalent transfer with memo', async () => {
      // Build using legacy builder
      const legacyBuilder = factory.getTransferBuilder();
      legacyBuilder
        .sender(wallet.pub)
        .nonce(recentBlockHash)
        .send({ address: testData.addresses.validAddresses[0], amount: '10000' })
        .memo('test memo')
        .fee({ amount: 5000 });
      const legacyTx = (await legacyBuilder.build()) as Transaction;

      // Build using WASM directly
      const intent = mapToTransactionIntent({
        feePayer: wallet.pub,
        recentBlockhash: recentBlockHash,
        instructionsData: [
          {
            type: InstructionBuilderTypes.Transfer,
            params: {
              fromAddress: wallet.pub,
              toAddress: testData.addresses.validAddresses[0],
              amount: '10000',
            },
          },
          {
            type: InstructionBuilderTypes.Memo,
            params: {
              memo: 'test memo',
            },
          },
        ],
      });

      const wasmRawTx = wasmBuildTransaction(intent).toBytes();
      const wasmTx = new Transaction(factory['_coinConfig']);
      wasmTx.fromRawTransaction(Buffer.from(wasmRawTx).toString('base64'));

      // Compare semantically
      compareTransactionsSemantically(legacyTx, wasmTx);
      compareInstructionData(legacyTx.toJson().instructionsData, wasmTx.toJson().instructionsData);
    });

    it('should build valid intent with durable nonce params', () => {
      // Test that mapToTransactionIntent correctly prepends NonceAdvance for durable nonce
      const intent = mapToTransactionIntent({
        feePayer: wallet.pub,
        recentBlockhash: recentBlockHash,
        durableNonceParams: { walletNonceAddress: nonceAccount.pub, authWalletAddress: wallet.pub },
        instructionsData: [
          {
            type: InstructionBuilderTypes.Transfer,
            params: {
              fromAddress: wallet.pub,
              toAddress: testData.addresses.validAddresses[0],
              amount: '10000',
            },
          },
        ],
      });

      // Intent should have NonceAdvance as first instruction
      should.equal(intent.instructions.length, 2, 'Intent should have 2 instructions');
      should.equal(intent.instructions[0].type, 'nonceAdvance', 'First instruction should be nonceAdvance');
      should.equal((intent.instructions[0] as any).nonce, nonceAccount.pub, 'Nonce address should be correct');
      should.equal((intent.instructions[0] as any).authority, wallet.pub, 'Nonce authority should be correct');
      should.equal(intent.instructions[1].type, 'transfer', 'Second instruction should be transfer');
    });
  });

  describe('WASM support detection', () => {
    it('should correctly identify WASM-supported instructions', () => {
      // Basic operations should be supported
      should.equal(
        areInstructionsSupportedByWasm([
          { type: InstructionBuilderTypes.Transfer, params: {} as any },
          { type: InstructionBuilderTypes.Memo, params: {} as any },
        ]),
        true,
        'Transfer and Memo should be supported'
      );

      should.equal(
        areInstructionsSupportedByWasm([
          { type: InstructionBuilderTypes.NonceAdvance, params: {} as any },
          { type: InstructionBuilderTypes.SetPriorityFee, params: {} as any },
          { type: InstructionBuilderTypes.SetComputeUnitLimit, params: {} as any },
        ]),
        true,
        'Nonce and compute budget should be supported'
      );
    });

    it('should correctly identify supported staking and token operations', () => {
      // Staking operations are now enabled
      should.equal(
        areInstructionsSupportedByWasm([{ type: InstructionBuilderTypes.StakingActivate, params: {} as any }]),
        true,
        'Staking operations should be supported'
      );

      should.equal(
        areInstructionsSupportedByWasm([{ type: InstructionBuilderTypes.TokenTransfer, params: {} as any }]),
        true,
        'Token operations should be supported'
      );

      should.equal(
        areInstructionsSupportedByWasm([{ type: InstructionBuilderTypes.CreateNonceAccount, params: {} as any }]),
        true,
        'Wallet init should be supported'
      );
    });
  });

  describe('Round-trip parsing', () => {
    it('should parse WASM-built transactions correctly with SDK parser', async () => {
      // Build a transaction with WASM
      const intent = mapToTransactionIntent({
        feePayer: wallet.pub,
        recentBlockhash: recentBlockHash,
        instructionsData: [
          {
            type: InstructionBuilderTypes.Transfer,
            params: {
              fromAddress: wallet.pub,
              toAddress: testData.addresses.validAddresses[0],
              amount: '10000',
            },
          },
          {
            type: InstructionBuilderTypes.Memo,
            params: {
              memo: 'round trip test',
            },
          },
        ],
      });

      const wasmRawTx = wasmBuildTransaction(intent).toBytes();

      // Parse with SDK's Transaction class
      const parsedTx = new Transaction(factory['_coinConfig']);
      parsedTx.fromRawTransaction(Buffer.from(wasmRawTx).toString('base64'));

      // Verify parsed content
      const json = parsedTx.toJson();
      should.equal(json.feePayer, wallet.pub, 'Fee payer should be parsed correctly');

      // Find the transfer instruction
      const transferInstr = json.instructionsData.find((i: any) => i.type === 'Transfer') as any;
      should.exist(transferInstr, 'Should have Transfer instruction');
      should.equal(transferInstr?.params.toAddress, testData.addresses.validAddresses[0]);
      should.equal(transferInstr?.params.amount, '10000');

      // Find the memo instruction
      const memoInstr = json.instructionsData.find((i: any) => i.type === 'Memo') as any;
      should.exist(memoInstr, 'Should have Memo instruction');
      should.equal(memoInstr?.params.memo, 'round trip test');
    });

    it('should rebuild WASM transactions from raw format', async () => {
      // Build a transaction with WASM
      const intent = mapToTransactionIntent({
        feePayer: wallet.pub,
        recentBlockhash: recentBlockHash,
        instructionsData: [
          {
            type: InstructionBuilderTypes.Transfer,
            params: {
              fromAddress: wallet.pub,
              toAddress: testData.addresses.validAddresses[0],
              amount: '10000',
            },
          },
        ],
      });

      const wasmRawTx = wasmBuildTransaction(intent).toBytes();

      // Parse with SDK
      const tx1 = new Transaction(factory['_coinConfig']);
      tx1.fromRawTransaction(Buffer.from(wasmRawTx).toString('base64'));

      // Get raw format and parse again
      const rawFormat = tx1.toBroadcastFormat();
      const tx2 = new Transaction(factory['_coinConfig']);
      tx2.fromRawTransaction(rawFormat);

      // Both should have the same structure
      should.deepEqual(
        tx2.toJson().instructionsData,
        tx1.toJson().instructionsData,
        'Instructions should match after round-trip'
      );
      should.equal(tx2.toJson().feePayer, tx1.toJson().feePayer, 'Fee payer should match after round-trip');
    });
  });
});
