import should from 'should';
import { Utils } from '../../src/lib';
import * as testData from '../resources/sol';
import { Lockup, PublicKey, StakeProgram, SystemProgram, TransactionInstruction } from '@solana/web3.js';
import {
  MEMO_PROGRAM_PK,
  stakingActivateInstructionsIndexes,
  stakingDeactivateInstructionsIndexes,
  stakingWithdrawInstructionsIndexes,
} from '../../src/lib/constants';
import BigNumber from 'bignumber.js';

describe('SOL util library', function () {
  describe('isValidAddress', function () {
    it('should fail to validate invalid addresses', function () {
      for (const address of testData.addresses.invalidAddresses) {
        should.doesNotThrow(() => Utils.isValidAddress(address));
        should.equal(Utils.isValidAddress(address), false);
      }
      // @ts-expect-error Testing for missing param, should not throw an error
      should.doesNotThrow(() => Utils.isValidAddress(undefined));
      // @ts-expect-error Testing for missing param, should return false
      should.equal(Utils.isValidAddress(undefined), false);
    });

    it('should succeed to validate valid addresses', function () {
      for (const address of testData.addresses.validAddresses) {
        should.equal(Utils.isValidAddress(address), true);
      }
    });
  });

  describe('isValidBlockId', function () {
    it('should fail to validate invalid Block hashes', function () {
      for (const blockHash of testData.blockHashes.invalidBlockHashes) {
        should.doesNotThrow(() => Utils.isValidBlockId(blockHash));
        should.equal(Utils.isValidBlockId(blockHash), false);
      }
    });

    it('should succeed to validate valid Block hashes', function () {
      for (const blockHash of testData.blockHashes.validBlockHashes) {
        should.equal(Utils.isValidBlockId(blockHash), true);
      }
    });
  });

  describe('isValidPublicKey', function () {
    it('should fail to validate invalid public keys', function () {
      for (const pubKey of testData.pubKeys.invalidPubKeys) {
        should.doesNotThrow(() => Utils.isValidPublicKey(pubKey));
        should.equal(Utils.isValidPublicKey(pubKey), false);
      }
      // @ts-expect-error Testing for missing param, should not throw an error
      should.doesNotThrow(() => Utils.isValidPublicKey(undefined));
      // @ts-expect-error Testing for missing param, should return false
      should.equal(Utils.isValidPublicKey(undefined), false);
    });

    it('should succeed to validate public keys', function () {
      for (const pubKey of testData.pubKeys.validPubKeys) {
        should.equal(Utils.isValidPublicKey(pubKey), true);
      }
    });
  });

  describe('isValidPrivateKey', function () {
    it('should fail to validate invalid private keys', function () {
      for (const prvKey of testData.prvKeys.invalidPrvKeys) {
        should.doesNotThrow(() => Utils.isValidPrivateKey(prvKey));
        should.equal(Utils.isValidPrivateKey(prvKey), false);
      }
    });

    it('should succeed to validate private keys', function () {
      const validPrvKey = [testData.prvKeys.prvKey1.base58, testData.prvKeys.prvKey1.uint8Array];
      for (const prvKey of validPrvKey) {
        should.equal(Utils.isValidPrivateKey(prvKey), true);
      }
    });
  });

  describe('isValidRawTransaction', function () {
    it('should fail to validate an invalid raw transaction', function () {
      should.doesNotThrow(() => Utils.isValidRawTransaction(testData.INVALID_RAW_TX));
      should.equal(Utils.isValidRawTransaction(testData.INVALID_RAW_TX), false);
    });

    it('should succeed to validate a valid raw transaction', function () {
      const validRawTxs = [testData.RAW_TX_UNSIGNED, testData.RAW_TX_SIGNED];
      for (const rawTx of validRawTxs) {
        should.equal(Utils.isValidRawTransaction(rawTx), true);
      }
    });
  });

  describe('isValidSignature and isValidTransactionId', function () {
    it('should fail to validate invalid signatures', function () {
      for (const signature of testData.signatures.invalidSignatures) {
        should.doesNotThrow(() => Utils.isValidSignature(signature));
        should.equal(Utils.isValidSignature(signature), false);
        should.doesNotThrow(() => Utils.isValidTransactionId(signature));
        should.equal(Utils.isValidTransactionId(signature), false);
      }
    });

    it('should succeed to validate valid signatures', function () {
      for (const signature of testData.signatures.validSignatures) {
        should.equal(Utils.isValidSignature(signature), true);
        should.equal(Utils.isValidTransactionId(signature), true);
      }
    });
  });

  describe('base58 and Uint8Array encoding', function () {
    it('should succeed to base58ToUint8Array', function () {
      should.deepEqual(Utils.base58ToUint8Array(testData.prvKeys.prvKey1.base58), testData.prvKeys.prvKey1.uint8Array);
    });

    it('should succeed to Uint8ArrayTobase58', function () {
      should.deepEqual(Utils.Uint8ArrayTobase58(testData.prvKeys.prvKey1.uint8Array), testData.prvKeys.prvKey1.base58);
    });
  });

  describe('isValidAmount', function () {
    it('should succeed for valid amounts', function () {
      const validAmounts = ['0', '12312312'];
      for (const amount of validAmounts) {
        should.equal(Utils.isValidAmount(amount), true);
      }
    });

    it('should fail for invalid amounts', function () {
      const invalidAmounts = ['-1', 'randomstring', '33.04235'];
      for (const amount of invalidAmounts) {
        should.equal(Utils.isValidAmount(amount), false);
      }
    });
  });

  describe('verifySignature', function () {
    it('should succeed for valid signature in a unsigned tx', function () {
      const signature = '335sxAuVj5ucXqVWW82QwpFLArPbdD3gXfXr4KrxkLkUpmLB3Nwz2G82z2TqiDD7mNAAbHkcAqD5ycDZp1vVKtjf';
      Utils.verifySignature(
        testData.TOKEN_TRANSFER_UNSIGNED_TX_WITH_MEMO_AND_DURABLE_NONCE,
        signature,
        testData.associatedTokenAccounts.accounts[0].pub
      ).should.equal(true);
    });

    it('should succeed for valid signature in a signed tx', function () {
      const signature = '335sxAuVj5ucXqVWW82QwpFLArPbdD3gXfXr4KrxkLkUpmLB3Nwz2G82z2TqiDD7mNAAbHkcAqD5ycDZp1vVKtjf';
      Utils.verifySignature(
        testData.TOKEN_TRANSFER_SIGNED_TX_WITH_MEMO_AND_DURABLE_NONCE,
        signature,
        testData.associatedTokenAccounts.accounts[0].pub
      ).should.equal(true);
    });

    it('should fail for invalid signature', function () {
      const signature = '2QdKALq4adaTahJH13AGzM5bAFuNshw43iQBdVS9D2Loq736zUgPXfHj32cNJKX6FyjUzYJhGfEyAAB5FgYUW6zR';
      Utils.verifySignature(
        testData.TRANSFER_UNSIGNED_TX_WITH_MEMO_AND_DURABLE_NONCE,
        signature,
        testData.authAccount.pub
      ).should.equal(false);
    });

    it('should fail for invalid pub key', function () {
      const signature = '3pD6ayWtvFkn8Fe5efYbSaCYMpnDwzDTmmeoMhcSMAcMrGvmwPFhLxok5vxhHnooA3YSXfnyZgi4e3K3sCHmgU3k';
      Utils.verifySignature(
        testData.TRANSFER_UNSIGNED_TX_WITH_MEMO_AND_DURABLE_NONCE,
        signature,
        testData.nonceAccount.pub
      ).should.equal(false);
    });

    it('should throw for invalid tx', function () {
      const signature = '3pD6ayWtvFkn8Fe5efYbSaCYMpnDwzDTmmeoMhcSMAcMrGvmwPFhLxok5vxhHnooA3YSXfnyZgi4e3K3sCHmgU3k';
      should(() => Utils.verifySignature(testData.INVALID_RAW_TX, signature, testData.nonceAccount.pub)).throwError(
        'Invalid serializedTx'
      );
    });
    it('should throw for invalid pubkey', function () {
      const signature = '3pD6ayWtvFkn8Fe5efYbSaCYMpnDwzDTmmeoMhcSMAcMrGvmwPFhLxok5vxhHnooA3YSXfnyZgi4e3K3sCHmgU3k';
      should(() =>
        Utils.verifySignature(
          testData.TRANSFER_UNSIGNED_TX_WITH_MEMO_AND_DURABLE_NONCE,
          signature,
          testData.pubKeys.invalidPubKeys[0]
        )
      ).throwError('Invalid publicKey');
    });
    it('should throw for invalid signature', function () {
      const signature = 'randomstring';
      should(() =>
        Utils.verifySignature(
          testData.TRANSFER_UNSIGNED_TX_WITH_MEMO_AND_DURABLE_NONCE,
          signature,
          testData.nonceAccount.pub
        )
      ).throwError('Invalid signature');
    });
  });

  describe('isValidMemo', function () {
    it('should return true for valid memo', function () {
      Utils.isValidMemo('testmemo').should.equal(true);
    });
    it('should return false for a long memo', function () {
      Utils.isValidMemo(
        '3pD6ayWtvFkn8Fe5efYbSaCYMpnDwzDTmmeoMhcSMAcMrGvmwPFhLxok5vxhHnooA3YSXfnyZgi4e3K3sCHmgU3kPFhLxok5vxhHnooA3YSXfnyZgi4e3K3sCHmgU3k'
      ).should.equal(false);
    });
  });

  describe('getInstructionType', function () {
    it('should succeed for memo program', function () {
      const memoInstruction = new TransactionInstruction({
        keys: [],
        programId: new PublicKey(MEMO_PROGRAM_PK),
        data: Buffer.from('random memo'),
      });
      Utils.getInstructionType(memoInstruction).should.equal('Memo');
    });
    it('should succeed for system program', function () {
      const fromAddress = testData.authAccount.pub;
      const toAddress = testData.nonceAccount.pub;
      const amount = '100000';
      const transferInstruction = SystemProgram.transfer({
        fromPubkey: new PublicKey(fromAddress),
        toPubkey: new PublicKey(toAddress),
        lamports: new BigNumber(amount).toNumber(),
      });
      Utils.getInstructionType(transferInstruction).should.equal('Transfer');
    });
    it('should fail for invalid type ', function () {
      const voteAddress = 'Vote111111111111111111111111111111111111111';
      const invalidInstruction = new TransactionInstruction({
        keys: [],
        programId: new PublicKey(voteAddress),
        data: Buffer.from('random memo'),
      });
      should(() => Utils.getInstructionType(invalidInstruction)).throwError(
        'Invalid transaction, instruction program id not supported: ' + voteAddress
      );
    });
  });

  describe('validateIntructionTypes', function () {
    it('should succeed for valid instruction type', function () {
      const fromAddress = testData.authAccount.pub;
      const toAddress = testData.nonceAccount.pub;
      const amount = '100000';
      const transferInstruction = SystemProgram.transfer({
        fromPubkey: new PublicKey(fromAddress),
        toPubkey: new PublicKey(toAddress),
        lamports: new BigNumber(amount).toNumber(),
      });
      should.doesNotThrow(() => Utils.validateIntructionTypes([transferInstruction]));
    });
    it('should fail for invalid instruction type', function () {
      const accountPubkey = testData.authAccount.pub;

      const assignInstruction = SystemProgram.nonceWithdraw({
        noncePubkey: new PublicKey(accountPubkey),
        authorizedPubkey: new PublicKey(accountPubkey),
        toPubkey: new PublicKey(accountPubkey),
        lamports: 200,
      });
      should(() => Utils.validateIntructionTypes([assignInstruction])).throwError(
        'Invalid transaction, instruction type not supported: ' + Utils.getInstructionType(assignInstruction)
      );
    });
  });

  describe('validateRawTransaction', function () {
    it('should succeed for valid raw transaction', function () {
      should.doesNotThrow(() => Utils.validateRawTransaction(testData.RAW_TX_UNSIGNED));
    });
    it('should fail for invalid raw transaction', function () {
      should(() => Utils.validateRawTransaction('AAAAAAAAAAAAAAAAA')).throwError('Invalid raw transaction');
    });
    it('should fail for missing param', function () {
      // @ts-expect-error Testing for missing param, should throw error
      should(() => Utils.validateRawTransaction()).throwError('Invalid raw transaction: Undefined');
    });
  });

  describe('getSolTokenFromTokenName', function () {
    it('should succeed for sol token', function () {
      should.notEqual(Utils.getSolTokenFromTokenName('tsol:usdc'), undefined);
    });
    it('should fail for non tokens', function () {
      should.equal(Utils.getSolTokenFromTokenName('tsol'), undefined);
    });
    it('should fail if tokenName is not in coins', function () {
      should.equal(Utils.getSolTokenFromTokenName('something random'), undefined);
    });
  });

  describe('getAssociatedTokenAccountAddress', function () {
    const usdcMintAddress = testData.tokenTransfers.mintUSDC;
    const tokenAddress = '141BFNem3pknc8CzPVLv1Ri3btgKdCsafYP5nXwmXfxU';
    it('should succeed for native address as owner address', async function () {
      const ownerAddress = testData.authAccount.pub;
      const result = await Utils.getAssociatedTokenAccountAddress(usdcMintAddress, ownerAddress);
      result.should.be.equal(tokenAddress);
    });
    it('should fail for token address as owner address', async function () {
      const invalidOwnerAddress = tokenAddress;
      await Utils.getAssociatedTokenAccountAddress(usdcMintAddress, invalidOwnerAddress).should.be.rejectedWith(
        'Invalid ownerAddress - address off ed25519 curve, got: ' + invalidOwnerAddress
      );
    });
  });

  describe('matchTransactionTypeByInstructionsOrder', function () {
    describe('Activate stake instructions', function () {
      it('should match staking activate instructions', function () {
        const fromAccount = new PublicKey(testData.authAccount.pub);
        const stakingAccount = new PublicKey(testData.stakeAccount.pub);
        const validator = new PublicKey(testData.validator.pub);
        const amount = '100000';

        // Instructions
        const stakingActivateInstructions = StakeProgram.createAccount({
          fromPubkey: fromAccount,
          stakePubkey: stakingAccount,
          authorized: {
            staker: fromAccount,
            withdrawer: fromAccount,
          },
          lockup: new Lockup(0, 0, fromAccount),
          lamports: new BigNumber(amount).toNumber(),
        }).instructions;

        const stakingDelegateInstructions = StakeProgram.delegate({
          authorizedPubkey: fromAccount,
          stakePubkey: stakingAccount,
          votePubkey: validator,
        }).instructions;

        const instructions = [...stakingActivateInstructions, ...stakingDelegateInstructions];
        const isAMatch = Utils.matchTransactionTypeByInstructionsOrder(
          instructions,
          stakingActivateInstructionsIndexes
        );
        isAMatch.should.be.true();
      });

      it('should match staking activate instructions with memo and durable nonce', function () {
        const fromAccount = new PublicKey(testData.authAccount.pub);
        const nonceAccount = testData.nonceAccount.pub;
        const stakingAccount = new PublicKey(testData.stakeAccount.pub);
        const validator = new PublicKey(testData.validator.pub);
        const amount = '100000';
        const memo = 'test memo';

        // Instructions
        const nonceAdvanceInstruction = SystemProgram.nonceAdvance({
          noncePubkey: new PublicKey(nonceAccount),
          authorizedPubkey: fromAccount,
        });

        const stakingActivateInstructions = StakeProgram.createAccount({
          fromPubkey: fromAccount,
          stakePubkey: stakingAccount,
          authorized: {
            staker: fromAccount,
            withdrawer: fromAccount,
          },
          lockup: new Lockup(0, 0, fromAccount),
          lamports: new BigNumber(amount).toNumber(),
        }).instructions;

        const stakingDelegateInstructions = StakeProgram.delegate({
          authorizedPubkey: fromAccount,
          stakePubkey: stakingAccount,
          votePubkey: validator,
        }).instructions;

        const memoInstruction = new TransactionInstruction({
          keys: [],
          programId: new PublicKey(MEMO_PROGRAM_PK),
          data: Buffer.from(memo),
        });

        const instructions = [
          nonceAdvanceInstruction,
          ...stakingActivateInstructions,
          ...stakingDelegateInstructions,
          memoInstruction,
        ];
        const isAMatch = Utils.matchTransactionTypeByInstructionsOrder(
          instructions,
          stakingActivateInstructionsIndexes
        );
        isAMatch.should.be.true();
      });
    });

    describe('Deactivate stake instructions', function () {
      it('should match staking deactivate instructions', function () {
        const fromAccount = new PublicKey(testData.authAccount.pub);
        const stakingAccount = new PublicKey(testData.stakeAccount.pub);

        // Instructions
        const stakingDeactivateInstructions = StakeProgram.deactivate({
          authorizedPubkey: fromAccount,
          stakePubkey: stakingAccount,
        }).instructions;

        const instructions = [...stakingDeactivateInstructions];
        const isAMatch = Utils.matchTransactionTypeByInstructionsOrder(
          instructions,
          stakingDeactivateInstructionsIndexes
        );
        isAMatch.should.be.true();
      });

      it('should match staking deactivate instructions with memo and durable nonce', function () {
        const fromAccount = new PublicKey(testData.authAccount.pub);
        const nonceAccount = testData.nonceAccount.pub;
        const stakingAccount = new PublicKey(testData.stakeAccount.pub);
        const memo = 'test memo';

        // Instructions
        const nonceAdvanceInstruction = SystemProgram.nonceAdvance({
          noncePubkey: new PublicKey(nonceAccount),
          authorizedPubkey: fromAccount,
        });

        const stakingDeactivateInstructions = StakeProgram.deactivate({
          authorizedPubkey: fromAccount,
          stakePubkey: stakingAccount,
        }).instructions;

        const memoInstruction = new TransactionInstruction({
          keys: [],
          programId: new PublicKey(MEMO_PROGRAM_PK),
          data: Buffer.from(memo),
        });

        const instructions = [nonceAdvanceInstruction, ...stakingDeactivateInstructions, memoInstruction];
        const isAMatch = Utils.matchTransactionTypeByInstructionsOrder(
          instructions,
          stakingDeactivateInstructionsIndexes
        );
        isAMatch.should.be.true();
      });
    });

    describe('Staking withdraw instructions', function () {
      it('should match staking withdraw instructions', function () {
        const fromAccount = new PublicKey(testData.authAccount.pub);
        const stakingAccount = new PublicKey(testData.stakeAccount.pub);
        const amount = '100000';

        // Instructions
        const stakingWithdrawInstructions = StakeProgram.withdraw({
          authorizedPubkey: fromAccount,
          stakePubkey: stakingAccount,
          toPubkey: fromAccount,
          lamports: new BigNumber(amount).toNumber(),
        }).instructions;

        const instructions = [...stakingWithdrawInstructions];
        const isAMatch = Utils.matchTransactionTypeByInstructionsOrder(
          instructions,
          stakingWithdrawInstructionsIndexes
        );
        isAMatch.should.be.true();
      });

      it('should match staking withdraw instructions with memo and durable nonce', function () {
        const fromAccount = new PublicKey(testData.authAccount.pub);
        const nonceAccount = testData.nonceAccount.pub;
        const stakingAccount = new PublicKey(testData.stakeAccount.pub);
        const amount = '100000';
        const memo = 'test memo';

        // Instructions
        const nonceAdvanceInstruction = SystemProgram.nonceAdvance({
          noncePubkey: new PublicKey(nonceAccount),
          authorizedPubkey: fromAccount,
        });

        // Instructions
        const stakingWithdrawInstructions = StakeProgram.withdraw({
          authorizedPubkey: fromAccount,
          stakePubkey: stakingAccount,
          toPubkey: fromAccount,
          lamports: new BigNumber(amount).toNumber(),
        }).instructions;

        const memoInstruction = new TransactionInstruction({
          keys: [],
          programId: new PublicKey(MEMO_PROGRAM_PK),
          data: Buffer.from(memo),
        });

        const instructions = [nonceAdvanceInstruction, ...stakingWithdrawInstructions, memoInstruction];
        const isAMatch = Utils.matchTransactionTypeByInstructionsOrder(
          instructions,
          stakingWithdrawInstructionsIndexes
        );
        isAMatch.should.be.true();
      });
    });
  });
});
