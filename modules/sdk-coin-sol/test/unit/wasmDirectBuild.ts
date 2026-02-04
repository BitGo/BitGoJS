/**
 * WASM Direct Transaction Building Tests
 *
 * These tests demonstrate building Solana transactions directly using WASM
 * WITHOUT going through TransactionBuilder or InstructionParams.
 *
 * Key differences from TransactionBuilder approach:
 * - No InstructionParams intermediate type
 * - No mapToTransactionIntent() conversion
 * - No TransactionBuilderFactory
 * - Direct buildTransaction(intent) call with WASM-native types
 *
 * This is the clean approach for wallet-platform integration.
 */
import should from 'should';
import {
  buildTransaction,
  parseTransaction,
  Transaction,
  TransactionIntent,
  stakeProgramId,
  stakeAccountSpace,
  systemProgramId,
} from '@bitgo/wasm-solana';
import * as testData from '../resources/sol';

describe('Sol WASM Direct Build', () => {
  // Test accounts (same as existing tests)
  const sender = testData.authAccount.pub;
  const recipient = testData.addresses.validAddresses[0];
  const blockhash = 'GHtXQBsoZHVnNFa9YevAzFr17DJjgHXk3ycTKD5xD3Zi';
  const validator = testData.validator.pub;
  const stakeAccount = testData.stakeAccount.pub;
  const nonceAccount = testData.nonceAccount.pub;

  // Rent exempt amounts
  const STAKE_ACCOUNT_RENT = BigInt(2282880);
  const STAKE_ACCOUNT_SIZE = Number(stakeAccountSpace());

  describe('Basic Transfers', () => {
    it('should build a simple SOL transfer', () => {
      const intent: TransactionIntent = {
        feePayer: sender,
        nonce: { type: 'blockhash', value: blockhash },
        instructions: [
          {
            type: 'transfer',
            from: sender,
            to: recipient,
            lamports: BigInt(1000000),
          },
        ],
      };

      const tx = buildTransaction(intent);

      // Verify transaction properties
      should.equal(tx.feePayer, sender);
      should.equal(tx.recentBlockhash, blockhash);

      // Verify we can get signable payload
      const payload = tx.signablePayload();
      should.exist(payload);
      should.ok(payload.length > 0);

      // Verify we can serialize
      const bytes = tx.toBytes();
      should.exist(bytes);
      should.ok(bytes.length > 0);

      // Verify round-trip: parse the built transaction
      const parsed = parseTransaction(bytes);
      should.exist(parsed);
      should.equal(parsed.feePayer, sender);
    });

    it('should build a transfer with memo', () => {
      const intent: TransactionIntent = {
        feePayer: sender,
        nonce: { type: 'blockhash', value: blockhash },
        instructions: [
          {
            type: 'transfer',
            from: sender,
            to: recipient,
            lamports: BigInt(1000000),
          },
          {
            type: 'memo',
            message: 'BitGo transfer',
          },
        ],
      };

      const tx = buildTransaction(intent);

      should.equal(tx.feePayer, sender);

      // Parse and verify memo is included in instructionsData
      const parsed = parseTransaction(tx.toBytes());
      const memoInstr = parsed.instructionsData.find((i) => i.type === 'Memo');
      should.exist(memoInstr);
      should.equal((memoInstr as any).memo, 'BitGo transfer');
    });

    it('should build a transfer with priority fee', () => {
      const intent: TransactionIntent = {
        feePayer: sender,
        nonce: { type: 'blockhash', value: blockhash },
        instructions: [
          {
            type: 'computeBudget',
            unitLimit: 200000,
            unitPrice: 5000,
          },
          {
            type: 'transfer',
            from: sender,
            to: recipient,
            lamports: BigInt(1000000),
          },
        ],
      };

      const tx = buildTransaction(intent);
      should.exist(tx.toBytes());
    });

    it('should build a transfer with durable nonce', () => {
      const nonceValue = '7afHRHcVbCKd1tbJHrXkDf7PtpNE8dDoP5qPoxPk6v4H';

      const intent: TransactionIntent = {
        feePayer: sender,
        nonce: {
          type: 'durable',
          address: nonceAccount,
          authority: sender,
          value: nonceValue,
        },
        instructions: [
          {
            type: 'transfer',
            from: sender,
            to: recipient,
            lamports: BigInt(1000000),
          },
        ],
      };

      const tx = buildTransaction(intent);

      // The blockhash should be the nonce value for durable nonce
      should.equal(tx.recentBlockhash, nonceValue);

      // Parse and verify durable nonce is detected
      const parsed = parseTransaction(tx.toBytes());
      should.exist(parsed.durableNonce);
      should.equal(parsed.durableNonce?.walletNonceAddress, nonceAccount);
      should.equal(parsed.durableNonce?.authWalletAddress, sender);
    });
  });

  describe('Staking Operations', () => {
    it('should build a staking activate transaction', () => {
      // Staking activate = CreateAccount + StakeInitialize + Delegate
      const intent: TransactionIntent = {
        feePayer: sender,
        nonce: { type: 'blockhash', value: blockhash },
        instructions: [
          // 1. Create stake account
          {
            type: 'createAccount',
            from: sender,
            newAccount: stakeAccount,
            lamports: BigInt(300000) + STAKE_ACCOUNT_RENT,
            space: STAKE_ACCOUNT_SIZE,
            owner: stakeProgramId(),
          },
          // 2. Initialize stake account
          {
            type: 'stakeInitialize',
            stake: stakeAccount,
            staker: sender,
            withdrawer: sender,
          },
          // 3. Delegate to validator
          {
            type: 'stakeDelegate',
            stake: stakeAccount,
            vote: validator,
            authority: sender,
          },
        ],
      };

      const tx = buildTransaction(intent);
      should.exist(tx.toBytes());

      // Verify structure via parsing
      const parsed = parseTransaction(tx.toBytes());
      should.exist(parsed);

      // Should have 3 instructions
      const instructions = parsed.instructionsData;
      should.exist(instructions);
      should.equal(instructions.length, 3);
    });

    it('should build a staking deactivate transaction', () => {
      const intent: TransactionIntent = {
        feePayer: sender,
        nonce: { type: 'blockhash', value: blockhash },
        instructions: [
          {
            type: 'stakeDeactivate',
            stake: stakeAccount,
            authority: sender,
          },
        ],
      };

      const tx = buildTransaction(intent);
      should.exist(tx.toBytes());
    });

    it('should build a staking withdraw transaction', () => {
      const intent: TransactionIntent = {
        feePayer: sender,
        nonce: { type: 'blockhash', value: blockhash },
        instructions: [
          {
            type: 'stakeWithdraw',
            stake: stakeAccount,
            recipient: sender,
            lamports: BigInt(100000),
            authority: sender,
          },
        ],
      };

      const tx = buildTransaction(intent);
      should.exist(tx.toBytes());
    });

    it('should build a partial deactivate (split + deactivate)', () => {
      const splitStakeAccount = testData.splitStakeAccount.pub;

      const intent: TransactionIntent = {
        feePayer: sender,
        nonce: { type: 'blockhash', value: blockhash },
        instructions: [
          // 1. Transfer rent to split account
          {
            type: 'transfer',
            from: sender,
            to: splitStakeAccount,
            lamports: STAKE_ACCOUNT_RENT,
          },
          // 2. Allocate space
          {
            type: 'allocate',
            account: splitStakeAccount,
            space: STAKE_ACCOUNT_SIZE,
          },
          // 3. Assign to stake program
          {
            type: 'assign',
            account: splitStakeAccount,
            owner: stakeProgramId(),
          },
          // 4. Split stake
          {
            type: 'stakeSplit',
            stake: stakeAccount,
            splitStake: splitStakeAccount,
            authority: sender,
            lamports: BigInt(100000),
          },
          // 5. Deactivate split account
          {
            type: 'stakeDeactivate',
            stake: splitStakeAccount,
            authority: sender,
          },
        ],
      };

      const tx = buildTransaction(intent);
      should.exist(tx.toBytes());
    });

    it('should build a re-delegate (delegate existing stake to new validator)', () => {
      const newValidator = testData.addresses.validAddresses[1];

      const intent: TransactionIntent = {
        feePayer: sender,
        nonce: { type: 'blockhash', value: blockhash },
        instructions: [
          {
            type: 'stakeDelegate',
            stake: stakeAccount,
            vote: newValidator,
            authority: sender,
          },
        ],
      };

      const tx = buildTransaction(intent);
      should.exist(tx.toBytes());
    });
  });

  describe('Nonce Account Operations', () => {
    it('should build a create nonce account transaction', () => {
      const newNonceAccount = testData.accountWithSeed.nonceAccount.publicKey;
      const NONCE_ACCOUNT_SIZE = 80; // Fixed size for nonce accounts
      const NONCE_RENT = BigInt(1447680);

      const intent: TransactionIntent = {
        feePayer: sender,
        nonce: { type: 'blockhash', value: blockhash },
        instructions: [
          // 1. Create account
          {
            type: 'createAccount',
            from: sender,
            newAccount: newNonceAccount,
            lamports: NONCE_RENT,
            space: NONCE_ACCOUNT_SIZE,
            owner: systemProgramId(),
          },
          // 2. Initialize nonce
          {
            type: 'nonceInitialize',
            nonce: newNonceAccount,
            authority: sender,
          },
        ],
      };

      const tx = buildTransaction(intent);
      should.exist(tx.toBytes());
    });
  });

  describe('Signature Operations', () => {
    it('should add signature to built transaction', () => {
      const intent: TransactionIntent = {
        feePayer: sender,
        nonce: { type: 'blockhash', value: blockhash },
        instructions: [
          {
            type: 'transfer',
            from: sender,
            to: recipient,
            lamports: BigInt(1000000),
          },
        ],
      };

      const tx = buildTransaction(intent);

      // Before signing - should be unsigned
      should.equal(tx.id, 'UNSIGNED');

      // Create a mock signature (64 bytes)
      const mockSignature = new Uint8Array(64);
      for (let i = 0; i < 64; i++) {
        mockSignature[i] = i + 1;
      }

      // Add signature
      tx.addSignature(sender, mockSignature);

      // After signing - should have an ID
      should.notEqual(tx.id, 'UNSIGNED');
      should.ok(tx.id.length > 20); // Base58 signature is ~87 chars

      // Should be able to serialize
      const signedBytes = tx.toBytes();
      should.exist(signedBytes);
    });

    it('should get broadcast format', () => {
      const intent: TransactionIntent = {
        feePayer: sender,
        nonce: { type: 'blockhash', value: blockhash },
        instructions: [
          {
            type: 'transfer',
            from: sender,
            to: recipient,
            lamports: BigInt(1000000),
          },
        ],
      };

      const tx = buildTransaction(intent);

      // Add mock signature
      const mockSignature = new Uint8Array(64).fill(1);
      tx.addSignature(sender, mockSignature);

      // Get broadcast format (base64)
      const broadcastFormat = tx.toBroadcastFormat();
      should.exist(broadcastFormat);
      should.ok(broadcastFormat.length > 0);

      // Should be valid base64
      const decoded = Buffer.from(broadcastFormat, 'base64');
      should.ok(decoded.length > 0);
    });
  });

  describe('Round-trip: Parse existing transaction, add signature', () => {
    it('should parse unsigned tx, add signature, and serialize', () => {
      // Use an existing unsigned transaction from test data
      const unsignedTxBase64 = testData.RAW_TX_UNSIGNED;
      const unsignedBytes = Buffer.from(unsignedTxBase64, 'base64');

      // Parse with WASM Transaction class (not parseTransaction)
      const tx = Transaction.fromBytes(unsignedBytes);

      // Should be unsigned
      should.equal(tx.id, 'UNSIGNED');

      // Add signature
      const mockSignature = new Uint8Array(64);
      for (let i = 0; i < 64; i++) {
        mockSignature[i] = i + 1;
      }
      tx.addSignature(tx.feePayer!, mockSignature);

      // Should now have ID
      should.notEqual(tx.id, 'UNSIGNED');

      // Should be able to get broadcast format
      const broadcast = tx.toBroadcastFormat();
      should.exist(broadcast);
    });

    it('should work with staking deactivate transaction', () => {
      // Use deactivate tx which only needs 1 signer (the authority)
      const unsignedTxBase64 = testData.STAKING_DEACTIVATE_UNSIGNED_TX_single;
      const unsignedBytes = Buffer.from(unsignedTxBase64, 'base64');

      const tx = Transaction.fromBytes(unsignedBytes);

      // Verify fee payer
      should.equal(tx.feePayer, testData.authAccount.pub);

      // Add signature for the authority
      const mockSig = new Uint8Array(64).fill(1);
      tx.addSignature(testData.authAccount.pub, mockSig);

      // Should have ID now
      should.notEqual(tx.id, 'UNSIGNED');
    });
  });

  describe('Comparison with expected outputs', () => {
    it('should produce valid transaction that can be parsed', () => {
      // Build a staking deactivate - simpler to compare
      const intent: TransactionIntent = {
        feePayer: sender,
        nonce: { type: 'blockhash', value: blockhash },
        instructions: [
          {
            type: 'stakeDeactivate',
            stake: stakeAccount,
            authority: sender,
          },
        ],
      };

      const tx = buildTransaction(intent);
      const bytes = tx.toBytes();

      // Parse the transaction we just built
      const parsed = parseTransaction(bytes);

      // Verify parsed structure
      should.equal(parsed.feePayer, sender);
      should.exist(parsed.instructionsData);
      should.equal(parsed.instructionsData.length, 1);

      // The instruction should be a stake deactivate
      // Note: WASM uses 'StakingDeactivate' for the combined semantic type
      const instr = parsed.instructionsData[0];
      should.equal(instr.type, 'StakingDeactivate');
    });
  });
});

/**
 * Helper function demonstrating the clean wallet-platform integration pattern.
 *
 * This is what wallet-platform buildTxn would look like:
 */
export async function buildSolTransferWithWasm(params: {
  sender: string;
  recipient: string;
  amount: bigint;
  blockhash?: string;
  durableNonce?: { address: string; authority: string; value: string };
  memo?: string;
  priorityFee?: { unitLimit?: number; unitPrice?: number };
}): Promise<{ txBytes: Uint8Array; txBase64: string }> {
  const instructions: TransactionIntent['instructions'] = [];

  // Add priority fee if specified
  if (params.priorityFee) {
    instructions.push({
      type: 'computeBudget',
      unitLimit: params.priorityFee.unitLimit,
      unitPrice: params.priorityFee.unitPrice,
    });
  }

  // Add transfer
  instructions.push({
    type: 'transfer',
    from: params.sender,
    to: params.recipient,
    lamports: params.amount,
  });

  // Add memo if specified
  if (params.memo) {
    instructions.push({
      type: 'memo',
      message: params.memo,
    });
  }

  const intent: TransactionIntent = {
    feePayer: params.sender,
    nonce: params.durableNonce
      ? {
          type: 'durable',
          address: params.durableNonce.address,
          authority: params.durableNonce.authority,
          value: params.durableNonce.value,
        }
      : {
          type: 'blockhash',
          value: params.blockhash!,
        },
    instructions,
  };

  const tx = buildTransaction(intent);

  return {
    txBytes: tx.toBytes(),
    txBase64: tx.toBroadcastFormat(),
  };
}

/**
 * Helper demonstrating clean getSignedTx pattern.
 *
 * This is what wallet-platform getSignedTx would look like:
 */
export function getSignedTxWithWasm(params: { txBytes: Uint8Array; signerPubkey: string; signature: Uint8Array }): {
  id: string;
  txBase64: string;
} {
  const tx = Transaction.fromBytes(params.txBytes);
  tx.addSignature(params.signerPubkey, params.signature);

  return {
    id: tx.id,
    txBase64: tx.toBroadcastFormat(),
  };
}
