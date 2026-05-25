import assert from 'assert';
import {
  isValidKaspaAddress,
  isValidMainnetAddress,
  isValidTestnetAddress,
  isValidPublicKey,
  isValidPrivateKey,
  isValidTransactionId,
  pubKeyToKaspaAddress,
  addressToScriptPublicKey,
  Utils,
} from '../../src/lib/utils';
import { KaspaAddressType } from '../../src/lib/constants';
import { KeyPair } from '../../src/lib/keyPair';
import { KEYS, ADDRESSES, UTXOS, SCRIPT_PUBLIC_KEY, ECDSA_SCRIPT_PUBLIC_KEY } from '../fixtures/kaspa.fixtures';

describe('Kaspa Utils', function () {
  describe('isValidKaspaAddress', function () {
    it('should accept a valid mainnet address', function () {
      assert.ok(isValidKaspaAddress(ADDRESSES.valid));
    });

    it('should accept a valid testnet address', function () {
      assert.ok(isValidKaspaAddress(ADDRESSES.testnet));
    });

    it('should reject an empty string', function () {
      assert.equal(isValidKaspaAddress(''), false);
    });

    it('should reject a non-kaspa address format', function () {
      assert.equal(isValidKaspaAddress('bitcoin:qp9dksrqz9'), false);
    });

    it('should reject a plain invalid string', function () {
      assert.equal(isValidKaspaAddress('notanaddress'), false);
    });

    it('should reject null-like input', function () {
      assert.equal(isValidKaspaAddress(null as unknown as string), false);
    });
  });

  describe('isValidMainnetAddress', function () {
    it('should accept a valid mainnet address', function () {
      assert.ok(isValidMainnetAddress(ADDRESSES.valid));
    });

    it('should reject a testnet address', function () {
      assert.equal(isValidMainnetAddress(ADDRESSES.testnet), false);
    });

    it('should reject an empty string', function () {
      assert.equal(isValidMainnetAddress(''), false);
    });
  });

  describe('isValidTestnetAddress', function () {
    it('should accept a valid testnet address', function () {
      assert.ok(isValidTestnetAddress(ADDRESSES.testnet));
    });

    it('should reject a mainnet address', function () {
      assert.equal(isValidTestnetAddress(ADDRESSES.valid), false);
    });

    it('should reject an empty string', function () {
      assert.equal(isValidTestnetAddress(''), false);
    });
  });

  describe('pubKeyToKaspaAddress', function () {
    it('should derive a valid mainnet Schnorr address from compressed public key', function () {
      const pubKeyBuffer = Buffer.from(KEYS.pub, 'hex');
      const address = pubKeyToKaspaAddress(pubKeyBuffer, 'kaspa');
      assert.ok(address.startsWith('kaspa:'));
      assert.ok(isValidKaspaAddress(address));
    });

    it('should derive a valid testnet Schnorr address from compressed public key', function () {
      const pubKeyBuffer = Buffer.from(KEYS.pub, 'hex');
      const address = pubKeyToKaspaAddress(pubKeyBuffer, 'kaspatest');
      assert.ok(address.startsWith('kaspatest:'));
      assert.ok(isValidKaspaAddress(address));
    });

    it('should accept hex string public key', function () {
      const address = pubKeyToKaspaAddress(KEYS.pub, 'kaspa');
      assert.ok(address.startsWith('kaspa:'));
    });

    it('should throw for non-33-byte public key', function () {
      assert.throws(() => {
        pubKeyToKaspaAddress(Buffer.from('0102030405', 'hex'), 'kaspa');
      });
    });

    it('should produce same Schnorr address as KeyPair.getAddress', function () {
      const kp = new KeyPair({ pub: KEYS.pub });
      const fromKp = kp.getAddress('mainnet');
      const fromUtil = pubKeyToKaspaAddress(Buffer.from(KEYS.pub, 'hex'), 'kaspa');
      assert.equal(fromUtil, fromKp);
    });

    it('should derive a valid mainnet ECDSA address', function () {
      const pubKeyBuffer = Buffer.from(KEYS.pub, 'hex');
      const address = pubKeyToKaspaAddress(pubKeyBuffer, 'kaspa', KaspaAddressType.ECDSA);
      assert.ok(address.startsWith('kaspa:'));
      assert.ok(isValidKaspaAddress(address));
    });

    it('should derive a valid testnet ECDSA address', function () {
      const pubKeyBuffer = Buffer.from(KEYS.pub, 'hex');
      const address = pubKeyToKaspaAddress(pubKeyBuffer, 'kaspatest', KaspaAddressType.ECDSA);
      assert.ok(address.startsWith('kaspatest:'));
      assert.ok(isValidKaspaAddress(address));
    });

    it('Schnorr and ECDSA addresses from the same key should differ', function () {
      const pubKeyBuffer = Buffer.from(KEYS.pub, 'hex');
      const schnorrAddr = pubKeyToKaspaAddress(pubKeyBuffer, 'kaspa');
      const ecdsaAddr = pubKeyToKaspaAddress(pubKeyBuffer, 'kaspa', KaspaAddressType.ECDSA);
      assert.notEqual(schnorrAddr, ecdsaAddr);
    });

    it('ECDSA address matches KeyPair.getAddress(ECDSA)', function () {
      const kp = new KeyPair({ pub: KEYS.pub });
      const fromKp = kp.getAddress('mainnet', KaspaAddressType.ECDSA);
      const fromUtil = pubKeyToKaspaAddress(Buffer.from(KEYS.pub, 'hex'), 'kaspa', KaspaAddressType.ECDSA);
      assert.equal(fromUtil, fromKp);
    });

    it('ECDSA address matches fixture ADDRESSES.validEcdsa', function () {
      const address = pubKeyToKaspaAddress(Buffer.from(KEYS.pub, 'hex'), 'kaspa', KaspaAddressType.ECDSA);
      assert.equal(address, ADDRESSES.validEcdsa);
    });
  });

  describe('addressToScriptPublicKey', function () {
    it('should derive the Schnorr scriptPublicKey from a Schnorr address', function () {
      const script = addressToScriptPublicKey(ADDRESSES.valid);
      // Schnorr: OP_DATA_32 (0x20) + 32-byte xOnly + OP_CHECKSIG_SCHNORR (0xAC) = 34 bytes = 68 hex chars
      assert.equal(script.length, 68);
      assert.ok(script.endsWith('ac'), 'Schnorr script should end with 0xAC');
      assert.ok(script.startsWith('20'), 'Schnorr script should start with OP_DATA_32');
    });

    it('should match the fixture SCRIPT_PUBLIC_KEY for the Schnorr address', function () {
      const script = addressToScriptPublicKey(ADDRESSES.valid);
      assert.equal(script, SCRIPT_PUBLIC_KEY);
    });

    it('should derive the ECDSA scriptPublicKey from an ECDSA address', function () {
      const script = addressToScriptPublicKey(ADDRESSES.validEcdsa);
      // ECDSA: OP_DATA_33 (0x21) + 33-byte compressed + OP_CHECKSIG_ECDSA (0xAB) = 35 bytes = 70 hex chars
      assert.equal(script.length, 70);
      assert.ok(script.endsWith('ab'), 'ECDSA script should end with 0xAB');
      assert.ok(script.startsWith('21'), 'ECDSA script should start with OP_DATA_33');
    });

    it('should match the fixture ECDSA_SCRIPT_PUBLIC_KEY for the ECDSA address', function () {
      const script = addressToScriptPublicKey(ADDRESSES.validEcdsa);
      assert.equal(script, ECDSA_SCRIPT_PUBLIC_KEY);
    });

    it('should throw for an invalid address', function () {
      assert.throws(() => addressToScriptPublicKey('notanaddress'));
    });

    it('should throw for an address without a colon prefix', function () {
      assert.throws(() => addressToScriptPublicKey('nocolon'));
    });
  });

  describe('isValidPublicKey', function () {
    it('should accept a valid compressed 33-byte public key', function () {
      assert.ok(isValidPublicKey(KEYS.pub));
    });

    it('should reject an empty string', function () {
      assert.equal(isValidPublicKey(''), false);
    });

    it('should reject a string that is not hex', function () {
      assert.equal(isValidPublicKey('not_a_key'), false);
    });

    it('should reject incorrect key length', function () {
      assert.equal(isValidPublicKey('0102030405'), false);
    });

    it('should accept uncompressed 65-byte public key', function () {
      const fakeUncompressed = '04' + 'ab'.repeat(64);
      assert.ok(isValidPublicKey(fakeUncompressed));
    });

    it('should reject a null-like value', function () {
      assert.equal(isValidPublicKey(null as unknown as string), false);
    });
  });

  describe('isValidPrivateKey', function () {
    it('should accept a valid 32-byte hex private key', function () {
      assert.ok(isValidPrivateKey(KEYS.prv));
    });

    it('should reject an empty string', function () {
      assert.equal(isValidPrivateKey(''), false);
    });

    it('should reject a non-hex string', function () {
      assert.equal(isValidPrivateKey('not_a_key'), false);
    });

    it('should reject null-like value', function () {
      assert.equal(isValidPrivateKey(null as unknown as string), false);
    });
  });

  describe('isValidTransactionId', function () {
    it('should accept a valid 64-char hex transaction ID', function () {
      assert.ok(isValidTransactionId(UTXOS.simple.transactionId));
    });

    it('should reject short hex strings', function () {
      assert.equal(isValidTransactionId('abcdef1234'), false);
    });

    it('should reject non-hex strings', function () {
      assert.equal(isValidTransactionId('xyz' + 'a'.repeat(61)), false);
    });

    it('should reject empty string', function () {
      assert.equal(isValidTransactionId(''), false);
    });
  });

  describe('Utils class', function () {
    const utils = new Utils();

    it('isValidAddress should delegate to isValidKaspaAddress', function () {
      assert.ok(utils.isValidAddress(ADDRESSES.valid));
      assert.equal(utils.isValidAddress('invalid'), false);
    });

    it('isValidBlockId should accept 64-char hex', function () {
      assert.ok(utils.isValidBlockId(UTXOS.simple.transactionId));
      assert.equal(utils.isValidBlockId('short'), false);
    });

    it('isValidPrivateKey should accept valid key', function () {
      assert.ok(utils.isValidPrivateKey(KEYS.prv));
    });

    it('isValidPublicKey should accept valid key', function () {
      assert.ok(utils.isValidPublicKey(KEYS.pub));
    });

    it('isValidSignature should accept 128-char hex', function () {
      const sig = 'ab'.repeat(64);
      assert.ok(utils.isValidSignature(sig));
    });

    it('isValidSignature should reject short strings', function () {
      assert.equal(utils.isValidSignature('abcd'), false);
    });

    it('isValidTransactionId should accept 64-char hex', function () {
      assert.ok(utils.isValidTransactionId(UTXOS.simple.transactionId));
    });
  });
});
