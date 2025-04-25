import should from 'should';
import utils from '../../src/lib/utils';
import { Accounts, IcpTransactionData, BlockHashes, TransactionHashes } from '../resources/icp';
const { encode } = require('cbor-x');
import { randomBytes } from 'crypto';

describe('utils', () => {
  describe('isValidAddress()', () => {
    it('should validate addresses correctly', () => {
      should.equal(utils.isValidAddress(Accounts.account1.address), true);
      should.equal(utils.isValidAddress(Accounts.account2.address), true);
      should.equal(utils.isValidAddress(Accounts.account3.address), true);
      should.equal(utils.isValidAddress(Accounts.account4.address), true);
      should.equal(utils.isValidAddress(Accounts.account5.address), true);
      should.equal(utils.isValidAddress(Accounts.account6.address), true);
    });

    it('should invalidate wrong addresses correctly', () => {
      should.equal(utils.isValidAddress(Accounts.errorsAccounts.account1.address), false);
      should.equal(utils.isValidAddress(Accounts.errorsAccounts.account2.address), false);
      should.equal(utils.isValidAddress(Accounts.errorsAccounts.account3.address), false);
      should.equal(utils.isValidAddress(Accounts.errorsAccounts.account4.address), false);
      should.equal(utils.isValidAddress(Accounts.errorsAccounts.account5.address), false);
      should.equal(utils.isValidAddress(Accounts.errorsAccounts.account6.address), false);
    });
  });

  describe('isValidBlockId()', () => {
    it('should validate block hashes correctly', () => {
      should.equal(utils.isValidBlockId(BlockHashes.validHashes.block1), true);
      should.equal(utils.isValidBlockId(BlockHashes.validHashes.block2), true);
      should.equal(utils.isValidBlockId(BlockHashes.validHashes.block3), true);
    });
  });

  describe('isValidTransactionId()', () => {
    it('should validate transaction hashes correctly', () => {
      should.equal(utils.isValidBlockId(TransactionHashes.validHashes.txId1), true);
      should.equal(utils.isValidBlockId(TransactionHashes.validHashes.txId2), true);
      should.equal(utils.isValidBlockId(TransactionHashes.validHashes.txId3), true);
    });
  });

  describe('gasData()', () => {
    it('should return correct gas data', () => {
      should.equal(utils.feeData(), '-10000');
    });
  });

  describe('isValidPublicKey()', () => {
    it('should validate public key correctly', () => {
      should.equal(utils.isValidPublicKey(Accounts.account1.publicKey), true);
      should.equal(utils.isValidPublicKey(Accounts.account2.publicKey), true);
      should.equal(utils.isValidPublicKey(Accounts.account3.publicKey), true);
      should.equal(utils.isValidPublicKey(Accounts.account4.publicKey), true);
      should.equal(utils.isValidPublicKey(Accounts.account5.publicKey), true);
      should.equal(utils.isValidPublicKey(Accounts.account6.publicKey), true);
    });

    it('should invalidate public key correctly', () => {
      should.equal(utils.isValidPublicKey(Accounts.errorsAccounts.account1.publicKey), false);
      should.equal(utils.isValidPublicKey(Accounts.errorsAccounts.account2.publicKey), false);
      should.equal(utils.isValidPublicKey(Accounts.errorsAccounts.account3.publicKey), false);
      should.equal(utils.isValidPublicKey(Accounts.errorsAccounts.account4.publicKey), false);
      should.equal(utils.isValidPublicKey(Accounts.errorsAccounts.account5.publicKey), false);
      should.equal(utils.isValidPublicKey(Accounts.errorsAccounts.account6.publicKey), false);
    });
  });

  describe('cborEncode()', () => {
    it('should correctly encode an object', () => {
      const value = { key: 'value' };
      const expectedHex = Buffer.from(encode(value)).toString('hex');
      should.equal(utils.cborEncode(value), expectedHex);
    });

    it('should encode and decode a big number correctly', () => {
      const original = { number: BigInt(1740680777458000000) };
      const encoded = encode(original);
      const decoded = utils.cborDecode(encoded);
      should.deepEqual(decoded, original);
    });
  });

  describe('cborDecode()', () => {
    it('should correctly decode a CBOR-encoded object', () => {
      const original = { key: 'value', number: 100 };
      const encoded = encode(original);
      const decoded = utils.cborDecode(encoded);
      should.deepEqual(decoded, original);
    });
  });

  describe('isValidLength()', () => {
    it('should return true for a valid compressed public key length (66 characters)', () => {
      should.equal(utils.isValidLength('a'.repeat(66)), true);
    });
  });

  describe('isValidHex()', () => {
    it('should return true for a valid hexadecimal string', () => {
      should.equal(utils.isValidHex('abcdef1234567890ABCDEF'), true);
    });
  });

  describe('hexToBytes()', () => {
    it('should correctly convert a valid hexadecimal string to a Uint8Array', () => {
      const hex = 'abcdef123456';
      const expected = new Uint8Array([0xab, 0xcd, 0xef, 0x12, 0x34, 0x56]);
      should.deepEqual(utils.hexToBytes(hex), expected);
    });
  });

  describe('isValidPrivateKey()', () => {
    it('should validate private key correctly', () => {
      should.equal(utils.isValidPrivateKey(Accounts.account1.secretKey), true);
      should.equal(utils.isValidPrivateKey(Accounts.account2.secretKey), true);
      should.equal(utils.isValidPrivateKey(Accounts.account3.secretKey), true);
      should.equal(utils.isValidPrivateKey(Accounts.account4.secretKey), true);
      should.equal(utils.isValidPrivateKey(Accounts.account5.secretKey), true);
      should.equal(utils.isValidPrivateKey(Accounts.account6.secretKey), true);
    });

    it('should invalidate private key correctly', () => {
      should.equal(utils.isValidPrivateKey(Accounts.errorsAccounts.account1.secretKey), false);
      should.equal(utils.isValidPrivateKey(Accounts.errorsAccounts.account2.secretKey), false);
      should.equal(utils.isValidPrivateKey(Accounts.errorsAccounts.account3.secretKey), false);
      should.equal(utils.isValidPrivateKey(Accounts.errorsAccounts.account4.secretKey), false);
      should.equal(utils.isValidPrivateKey(Accounts.errorsAccounts.account5.secretKey), false);
      should.equal(utils.isValidPrivateKey(Accounts.errorsAccounts.account6.secretKey), false);
    });
  });

  describe('getAddressFromPublicKey()', () => {
    it('should return the correct address for a valid public key', async () => {
      const address1 = await utils.getAddressFromPublicKey(Accounts.account1.publicKey);
      should.equal(address1, Accounts.account1.address);
      const address2 = await utils.getAddressFromPublicKey(Accounts.account1.publicKey);
      should.equal(address2, Accounts.account1.address);
      const address3 = await utils.getAddressFromPublicKey(Accounts.account1.publicKey);
      should.equal(address3, Accounts.account1.address);
      const address4 = await utils.getAddressFromPublicKey(Accounts.account1.publicKey);
      should.equal(address4, Accounts.account1.address);
      const address5 = await utils.getAddressFromPublicKey(Accounts.account1.publicKey);
      should.equal(address5, Accounts.account1.address);
      const address6 = await utils.getAddressFromPublicKey(Accounts.account1.publicKey);
      should.equal(address6, Accounts.account1.address);
    });

    it('should throw an error for an invalid public key', async () => {
      await should(utils.getAddressFromPublicKey(Accounts.errorsAccounts.account1.publicKey)).be.rejectedWith(
        'Invalid hex-encoded public key format.'
      );
    });
  });

  describe('generateKeyPair()', () => {
    it('should generate a valid key pair without a seed', () => {
      const keyPair = utils.generateKeyPair();
      should.exist(keyPair);
      should.exist(keyPair.pub);
      should.exist(keyPair.prv);
    });

    it('should generate a valid key pair with a given seed', () => {
      const seed = randomBytes(32);
      const keyPair = utils.generateKeyPair(seed);
      should.exist(keyPair);
      should.exist(keyPair.pub);
      should.exist(keyPair.prv);
    });

    it('should generate different key pairs for different seeds', () => {
      const seed1 = randomBytes(32);
      const seed2 = randomBytes(32);
      const keyPair1 = utils.generateKeyPair(seed1);
      const keyPair2 = utils.generateKeyPair(seed2);

      should.notEqual(keyPair1.pub, keyPair2.pub);
      should.notEqual(keyPair1.prv, keyPair2.prv);
    });

    it('should generate the same key pair for the same seed', () => {
      const seed = randomBytes(32);
      const keyPair1 = utils.generateKeyPair(seed);
      const keyPair2 = utils.generateKeyPair(seed);

      should.equal(keyPair1.pub, keyPair2.pub);
      should.equal(keyPair1.prv, keyPair2.prv);
    });
  });

  describe('validateRawTransaction()', () => {
    const data = IcpTransactionData;
    it('should validate icpTransactionData correctly', () => {
      utils.validateRawTransaction(data);
    });
    it('should throw an error for invalid expiryTime', () => {
      (data.expiryTime = Date.now()), should.throws(() => utils.validateRawTransaction(data), 'Invalid expiry time');
    });
    it('should throw an error for invalid fee', () => {
      data.fee = '-100';
      should.throws(() => utils.validateRawTransaction(data), 'Invalid fee value');
    });
    it('should throw an error for invalid amount', () => {
      data.amount = '0';
      should.throws(() => utils.validateRawTransaction(data), 'amount cannot be less than or equal to zero');
    });
  });
});
