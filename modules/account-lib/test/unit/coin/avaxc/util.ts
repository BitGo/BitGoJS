import should from 'should';
import { TEST_ACCOUNT } from '../../../resources/avaxc/avaxc';
import { isValidEthAddress, isValidEthPrivateKey, isValidEthPublicKey } from '../../../../src/coin/avaxc/utils';

describe('AVAX util library', () => {
  describe('keys validations success cases', () => {
    it('validate valid eth private key', () => {
      should.equal(isValidEthPrivateKey(TEST_ACCOUNT.ethPrivateKey), true);
    });

    it('validate valid eth public key', () => {
      should.equal(isValidEthPublicKey(TEST_ACCOUNT.ethUncompressedPublicKey), true);
    });

    it('validate valid eth address', () => {
      should.equal(isValidEthAddress(TEST_ACCOUNT.ethAddress), true);
    });
  });

  describe('keys validations failure cases', () => {
    it('validate empty eth private key', () => {
      should.equal(isValidEthPrivateKey(''), false);
    });

    it('validate empty eth public key', () => {
      should.equal(isValidEthPublicKey(''), false);
    });

    it('validate empty eth address', () => {
      should.equal(isValidEthAddress(''), false);
    });

    it('validate eth private key too short', () => {
      should.equal(isValidEthPrivateKey(TEST_ACCOUNT.ethPrivateKey.slice(1)), false);
    });

    it('validate eth public key too short', () => {
      should.equal(isValidEthPublicKey(TEST_ACCOUNT.ethUncompressedPublicKey.slice(1)), false);
    });

    it('validate eth address too short', () => {
      should.equal(isValidEthAddress(TEST_ACCOUNT.ethAddress.slice(1)), false);
    });

    it('validate eth private key too long', () => {
      should.equal(isValidEthPrivateKey(TEST_ACCOUNT.ethPrivateKey + '00'), false);
    });

    it('validate eth public key too long', () => {
      should.equal(isValidEthPublicKey(TEST_ACCOUNT.ethUncompressedPublicKey + '00'), false);
    });

    it('validate eth address too long', () => {
      should.equal(isValidEthAddress(TEST_ACCOUNT.ethAddress + '00'), false);
    });
  });
});
