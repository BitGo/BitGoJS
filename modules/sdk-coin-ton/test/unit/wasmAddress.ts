/**
 * Tests for WASM-based TON address derivation.
 *
 * Validates that getAddressFromPublicKey() produces addresses that match
 * known fixtures, and that isValidTonAddress() correctly validates addresses.
 */

/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
import should from 'should';
import { getAddressFromPublicKey, isValidTonAddress } from '../../src/lib/wasmAddress';
import * as testData from '../resources/ton';

describe('WASM address derivation:', function () {
  describe('getAddressFromPublicKey', function () {
    it('should derive a non-bounceable address (UQ...) from a known public key', async function () {
      // The sender public key is known from test fixtures
      const { publicKey } = testData.sender;
      const address = getAddressFromPublicKey(publicKey, false, 'V4R2');

      // Should start with UQ (non-bounceable, user-friendly)
      address.should.startWith('UQ');
      address.should.equal(testData.sender.address);
    });

    it('should derive a bounceable address (EQ...) from a known public key', async function () {
      const { publicKey } = testData.sender;
      const bounceable = getAddressFromPublicKey(publicKey, true, 'V4R2');

      // Should start with EQ (bounceable)
      bounceable.should.startWith('EQ');
    });

    it('should produce a 48-character base64url address', function () {
      const { publicKey } = testData.sender;
      const address = getAddressFromPublicKey(publicKey, false, 'V4R2');

      // TON addresses are 48 characters in base64url
      address.replace(/\?memoId=.*/, '').length.should.equal(48);
    });

    it('should derive correct address for token sender public key', function () {
      const { publicKey } = testData.tokenSender;
      const address = getAddressFromPublicKey(publicKey, false, 'V4R2');

      address.should.startWith('UQ');
      address.should.equal(testData.tokenSender.address);
    });
  });

  describe('isValidTonAddress', function () {
    it('should validate known good addresses', function () {
      for (const addr of testData.addresses.validAddresses) {
        isValidTonAddress(addr).should.be.true(`${addr} should be valid`);
      }
    });

    it('should reject invalid addresses', function () {
      isValidTonAddress('randomString').should.be.false();
      isValidTonAddress('0xc4173a804406a365e69dfb297ddfgsdcvf').should.be.false();
      isValidTonAddress('').should.be.false();
    });

    it('should validate EQ... (bounceable) addresses', function () {
      isValidTonAddress(testData.signedSendTransaction.recipient.address).should.be.true();
    });

    it('should validate UQ... (non-bounceable) addresses', function () {
      isValidTonAddress(testData.signedSendTransaction.recipientBounceable.address).should.be.true();
    });
  });
});
