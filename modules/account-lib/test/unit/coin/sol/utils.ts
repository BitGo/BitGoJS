import should from 'should';
import { Utils } from '../../../../src/coin/sol';
import * as testData from '../../../resources/sol/sol';
import { PublicKey, SystemProgram, TransactionInstruction } from '@solana/web3.js';
import { MEMO_PROGRAM_PK } from '../../../../src/coin/sol/constants';
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
      const signature = '5bzBmWctovza21BCUc9aywJjkKyvA1EKBEfL1RXHno4SGBSQ5Tcwq2geXMSEygoKM4ojAB47iTe4p9639yxFFndT';
      Utils.verifySignature(
        testData.TRANSFER_UNSIGNED_TX_WITH_MEMO_AND_DURABLE_NONCE,
        signature,
        testData.authAccount.pub,
      ).should.equal(true);
    });

    it('should succeed for valid signature in a signed tx', function () {
      const signature = '5bzBmWctovza21BCUc9aywJjkKyvA1EKBEfL1RXHno4SGBSQ5Tcwq2geXMSEygoKM4ojAB47iTe4p9639yxFFndT';
      Utils.verifySignature(
        testData.TRANSFER_SIGNED_TX_WITH_MEMO_AND_DURABLE_NONCE,
        signature,
        testData.authAccount.pub,
      ).should.equal(true);
    });

    it('should fail for invalid signature', function () {
      const signature = '2QdKALq4adaTahJH13AGzM5bAFuNshw43iQBdVS9D2Loq736zUgPXfHj32cNJKX6FyjUzYJhGfEyAAB5FgYUW6zR';
      Utils.verifySignature(
        testData.TRANSFER_UNSIGNED_TX_WITH_MEMO_AND_DURABLE_NONCE,
        signature,
        testData.authAccount.pub,
      ).should.equal(false);
    });

    it('should fail for invalid pub key', function () {
      const signature = '3pD6ayWtvFkn8Fe5efYbSaCYMpnDwzDTmmeoMhcSMAcMrGvmwPFhLxok5vxhHnooA3YSXfnyZgi4e3K3sCHmgU3k';
      Utils.verifySignature(
        testData.TRANSFER_UNSIGNED_TX_WITH_MEMO_AND_DURABLE_NONCE,
        signature,
        testData.nonceAccount.pub,
      ).should.equal(false);
    });

    it('should throw for invalid tx', function () {
      const signature = '3pD6ayWtvFkn8Fe5efYbSaCYMpnDwzDTmmeoMhcSMAcMrGvmwPFhLxok5vxhHnooA3YSXfnyZgi4e3K3sCHmgU3k';
      should(() => Utils.verifySignature(testData.INVALID_RAW_TX, signature, testData.nonceAccount.pub)).throwError(
        'Invalid serializedTx',
      );
    });
    it('should throw for invalid pubkey', function () {
      const signature = '3pD6ayWtvFkn8Fe5efYbSaCYMpnDwzDTmmeoMhcSMAcMrGvmwPFhLxok5vxhHnooA3YSXfnyZgi4e3K3sCHmgU3k';
      should(() =>
        Utils.verifySignature(
          testData.TRANSFER_UNSIGNED_TX_WITH_MEMO_AND_DURABLE_NONCE,
          signature,
          testData.pubKeys.invalidPubKeys[0],
        ),
      ).throwError('Invalid publicKey');
    });
    it('should throw for invalid signature', function () {
      const signature = 'randomstring';
      should(() =>
        Utils.verifySignature(
          testData.TRANSFER_UNSIGNED_TX_WITH_MEMO_AND_DURABLE_NONCE,
          signature,
          testData.nonceAccount.pub,
        ),
      ).throwError('Invalid signature');
    });
  });

  describe('isValidMemo', function () {
    it('should return true for valid memo', function () {
      Utils.isValidMemo('testmemo').should.equal(true);
    });
    it('should return false for a long memo', function () {
      Utils.isValidMemo(
        '3pD6ayWtvFkn8Fe5efYbSaCYMpnDwzDTmmeoMhcSMAcMrGvmwPFhLxok5vxhHnooA3YSXfnyZgi4e3K3sCHmgU3kPFhLxok5vxhHnooA3YSXfnyZgi4e3K3sCHmgU3k',
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
        'Invalid transaction, instruction program id not supported: ' + voteAddress,
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
      const programId = testData.nonceAccount.pub;

      const assignInstruction = SystemProgram.assign({
        accountPubkey: new PublicKey(accountPubkey),
        programId: new PublicKey(programId),
      });
      should(() => Utils.validateIntructionTypes([assignInstruction])).throwError(
        'Invalid transaction, instruction type not supported: ' + Utils.getInstructionType(assignInstruction),
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
});
