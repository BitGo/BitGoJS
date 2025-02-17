import should from 'should';
import utils from '../../src/lib/utils';
import { accounts, IcpTransactionData } from '../resources/icp';
import { encode } from 'cbor-x';
import { randomBytes } from 'crypto';

describe('utils', () => {
  describe('isValidAddress()', () => {
    it('should validate addresses correctly', () => {
      should.equal(utils.isValidAddress(accounts.account1.address), true);
      should.equal(utils.isValidAddress(accounts.account2.address), true);
      should.equal(utils.isValidAddress(accounts.account3.address), true);
      should.equal(utils.isValidAddress(accounts.account4.address), true);
      should.equal(utils.isValidAddress(accounts.account5.address), true);
      should.equal(utils.isValidAddress(accounts.account6.address), true);
    });

    it('should invalidate wrong addresses correctly', () => {
      should.equal(utils.isValidAddress(accounts.errorsAccounts.account1.address), false);
      should.equal(utils.isValidAddress(accounts.errorsAccounts.account2.address), false);
      should.equal(utils.isValidAddress(accounts.errorsAccounts.account3.address), false);
      should.equal(utils.isValidAddress(accounts.errorsAccounts.account4.address), false);
      should.equal(utils.isValidAddress(accounts.errorsAccounts.account5.address), false);
      should.equal(utils.isValidAddress(accounts.errorsAccounts.account6.address), false);
    });
  });

  describe('gasData()', () => {
    it('should return correct gas data', () => {
      should.equal(utils.gasData(), '-10000');
    });
  });

  describe('isValidPublicKey()', () => {
    it('should validate public key correctly', () => {
      should.equal(utils.isValidPublicKey(accounts.account1.publicKey), true);
      should.equal(utils.isValidPublicKey(accounts.account2.publicKey), true);
      should.equal(utils.isValidPublicKey(accounts.account3.publicKey), true);
      should.equal(utils.isValidPublicKey(accounts.account4.publicKey), true);
      should.equal(utils.isValidPublicKey(accounts.account5.publicKey), true);
      should.equal(utils.isValidPublicKey(accounts.account6.publicKey), true);
    });

    it('should invalidate public key correctly', () => {
      should.equal(utils.isValidPublicKey(accounts.errorsAccounts.account1.publicKey), false);
      should.equal(utils.isValidPublicKey(accounts.errorsAccounts.account2.publicKey), false);
      should.equal(utils.isValidPublicKey(accounts.errorsAccounts.account3.publicKey), false);
      should.equal(utils.isValidPublicKey(accounts.errorsAccounts.account4.publicKey), false);
      should.equal(utils.isValidPublicKey(accounts.errorsAccounts.account5.publicKey), false);
      should.equal(utils.isValidPublicKey(accounts.errorsAccounts.account6.publicKey), false);
    });
  });

  describe('cborEncode()', () => {
    it('should correctly encode a number', () => {
      const value = 42;
      const expectedHex = Buffer.from(encode(value)).toString('hex');
      should.equal(utils.cborEncode(value), expectedHex);
    });

    it('should correctly encode a string', () => {
      const value = 'hello';
      const expectedHex = Buffer.from(encode(value)).toString('hex');
      should.equal(utils.cborEncode(value), expectedHex);
    });

    it('should correctly encode a boolean (true)', () => {
      const value = true;
      const expectedHex = Buffer.from(encode(value)).toString('hex');
      should.equal(utils.cborEncode(value), expectedHex);
    });

    it('should correctly encode a boolean (false)', () => {
      const value = false;
      const expectedHex = Buffer.from(encode(value)).toString('hex');
      should.equal(utils.cborEncode(value), expectedHex);
    });

    it('should correctly encode null', () => {
      const value = null;
      const expectedHex = Buffer.from(encode(value)).toString('hex');
      should.equal(utils.cborEncode(value), expectedHex);
    });

    it('should correctly encode an array', () => {
      const value = [1, 2, 3];
      const expectedHex = Buffer.from(encode(value)).toString('hex');
      should.equal(utils.cborEncode(value), expectedHex);
    });

    it('should correctly encode an object', () => {
      const value = { key: 'value' };
      const expectedHex = Buffer.from(encode(value)).toString('hex');
      should.equal(utils.cborEncode(value), expectedHex);
    });

    it('should correctly encode an empty object', () => {
      const value = {};
      const expectedHex = Buffer.from(encode(value)).toString('hex');
      should.equal(utils.cborEncode(value), expectedHex);
    });

    it('should correctly encode an empty array', () => {
      const value = [];
      const expectedHex = Buffer.from(encode(value)).toString('hex');
      should.equal(utils.cborEncode(value), expectedHex);
    });

    it('should correctly encode a nested object', () => {
      const value = { a: 1, b: [2, 3], c: { d: 'hello' } };
      const expectedHex = Buffer.from(encode(value)).toString('hex');
      should.equal(utils.cborEncode(value), expectedHex);
    });

    it('should throw an error when encoding an undefined value', () => {
      should.throws(() => utils.cborEncode(undefined), Error);
    });

    it('should throw an error when encoding a function', () => {
      should.throws(
        () =>
          utils.cborEncode(() => {
            throw new Error('Value to encode cannot be undefined.');
          }),
        Error
      );
    });
  });

  describe('cborDecode()', () => {
    it('should correctly decode a CBOR-encoded string', () => {
      const original = 'Hello, CBOR!';
      const encoded = encode(original);
      const decoded = utils.cborDecode(encoded);
      should.equal(decoded, original);
    });

    it('should correctly decode a CBOR-encoded number', () => {
      const original = 42;
      const encoded = encode(original);
      const decoded = utils.cborDecode(encoded);
      should.equal(decoded, original);
    });

    it('should correctly decode a CBOR-encoded boolean', () => {
      const original = true;
      const encoded = encode(original);
      const decoded = utils.cborDecode(encoded);
      should.equal(decoded, original);
    });

    it('should correctly decode a CBOR-encoded object', () => {
      const original = { key: 'value', number: 100 };
      const encoded = encode(original);
      const decoded = utils.cborDecode(encoded);
      should.deepEqual(decoded, original);
    });

    it('should correctly decode a CBOR-encoded array', () => {
      const original = [1, 'text', false];
      const encoded = encode(original);
      const decoded = utils.cborDecode(encoded);
      should.deepEqual(decoded, original);
    });

    it('should return undefined for an empty CBOR buffer', () => {
      const encoded = encode(undefined);
      const decoded = utils.cborDecode(encoded);
      should.equal(decoded, undefined);
    });

    it('should throw an error for an invalid CBOR buffer', () => {
      should.throws(() => utils.cborDecode(Buffer.from('invalid data')), Error);
    });
  });

  describe('isValidLength()', () => {
    it('should return true for a valid compressed public key length (66 characters)', () => {
      should.equal(utils.isValidLength('a'.repeat(66)), true);
    });

    it('should return true for a valid uncompressed public key length (130 characters)', () => {
      should.equal(utils.isValidLength('a'.repeat(130)), true);
    });

    it('should return false for a string shorter than 66 characters', () => {
      should.equal(utils.isValidLength('a'.repeat(64)), false);
    });

    it('should return false for a string longer than 66 but shorter than 130 characters', () => {
      should.equal(utils.isValidLength('a'.repeat(100)), false);
    });

    it('should return false for a string longer than 130 characters', () => {
      should.equal(utils.isValidLength('a'.repeat(132)), false);
    });

    it('should return false for an empty string', () => {
      should.equal(utils.isValidLength(''), false);
    });

    it('should return false for a non-hexadecimal string', () => {
      should.equal(utils.isValidLength('ZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZ'), false);
    });
  });

  describe('isValidHex()', () => {
    it('should return true for a valid hexadecimal string', () => {
      should.equal(utils.isValidHex('abcdef1234567890ABCDEF'), true);
    });

    it('should return true for a valid hex string with even length', () => {
      should.equal(utils.isValidHex('a1b2c3d4e5f6'), true);
    });

    it('should return false for a string with an odd number of characters', () => {
      should.equal(utils.isValidHex('abcde'), false);
    });

    it('should return false for a string containing non-hex characters', () => {
      should.equal(utils.isValidHex('xyz123'), false);
      should.equal(utils.isValidHex('12345G'), false);
      should.equal(utils.isValidHex('1234@!'), false);
    });

    it('should return false for an empty string', () => {
      should.equal(utils.isValidHex(''), false);
    });

    it('should return false for a string with spaces', () => {
      should.equal(utils.isValidHex('abcdef 123456'), false);
    });

    it('should return false for a string with mixed valid and invalid characters', () => {
      should.equal(utils.isValidHex('abcd123!@#'), false);
    });
  });

  describe('hexToBytes()', () => {
    it('should correctly convert a valid hexadecimal string to a Uint8Array', () => {
      const hex = 'abcdef123456';
      const expected = new Uint8Array([0xab, 0xcd, 0xef, 0x12, 0x34, 0x56]);
      should.deepEqual(utils.hexToBytes(hex), expected);
    });

    it('should correctly convert an uppercase hexadecimal string to a Uint8Array', () => {
      const hex = 'ABCDEF123456';
      const expected = new Uint8Array([0xab, 0xcd, 0xef, 0x12, 0x34, 0x56]);
      should.deepEqual(utils.hexToBytes(hex), expected);
    });

    it('should return an empty Uint8Array for an empty string', () => {
      should.deepEqual(utils.hexToBytes(''), new Uint8Array([]));
    });

    it('should correctly convert a single byte hexadecimal string', () => {
      const hex = '0a';
      const expected = new Uint8Array([0x0a]);
      should.deepEqual(utils.hexToBytes(hex), expected);
    });

    it('should correctly convert a multi-byte hexadecimal string', () => {
      const hex = 'ff00ff';
      const expected = new Uint8Array([0xff, 0x00, 0xff]);
      should.deepEqual(utils.hexToBytes(hex), expected);
    });
  });

  describe('isValidPrivateKey()', () => {
    it('should validate private key correctly', () => {
      should.equal(utils.isValidPrivateKey(accounts.account1.secretKey), true);
      should.equal(utils.isValidPrivateKey(accounts.account2.secretKey), true);
      should.equal(utils.isValidPrivateKey(accounts.account3.secretKey), true);
      should.equal(utils.isValidPrivateKey(accounts.account4.secretKey), true);
      should.equal(utils.isValidPrivateKey(accounts.account5.secretKey), true);
      should.equal(utils.isValidPrivateKey(accounts.account6.secretKey), true);
    });

    it('should invalidate private key correctly', () => {
      should.equal(utils.isValidPrivateKey(accounts.errorsAccounts.account1.secretKey), false);
      should.equal(utils.isValidPrivateKey(accounts.errorsAccounts.account2.secretKey), false);
      should.equal(utils.isValidPrivateKey(accounts.errorsAccounts.account3.secretKey), false);
      should.equal(utils.isValidPrivateKey(accounts.errorsAccounts.account4.secretKey), false);
      should.equal(utils.isValidPrivateKey(accounts.errorsAccounts.account5.secretKey), false);
      should.equal(utils.isValidPrivateKey(accounts.errorsAccounts.account6.secretKey), false);
    });
  });

  describe('getAddressFromPublicKey()', () => {
    it('should return the correct address for a valid public key', async () => {
      const address1 = await utils.getAddressFromPublicKey(accounts.account1.publicKey);
      should.equal(address1, accounts.account1.address);
      const address2 = await utils.getAddressFromPublicKey(accounts.account1.publicKey);
      should.equal(address2, accounts.account1.address);
      const address3 = await utils.getAddressFromPublicKey(accounts.account1.publicKey);
      should.equal(address3, accounts.account1.address);
      const address4 = await utils.getAddressFromPublicKey(accounts.account1.publicKey);
      should.equal(address4, accounts.account1.address);
      const address5 = await utils.getAddressFromPublicKey(accounts.account1.publicKey);
      should.equal(address5, accounts.account1.address);
      const address6 = await utils.getAddressFromPublicKey(accounts.account1.publicKey);
      should.equal(address6, accounts.account1.address);
    });

    it('should throw an error for an invalid public key', async () => {
      await should(utils.getAddressFromPublicKey(accounts.errorsAccounts.account1.publicKey)).be.rejectedWith(
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
