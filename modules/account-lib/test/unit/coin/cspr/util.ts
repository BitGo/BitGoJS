import * as should from 'should';
import * as Utils from '../../../../src/coin/cspr/utils';
import { KeyPair } from '../../../../src/coin/cspr';
import { randomBytes } from 'crypto';

describe('CSPR util library', function() {
  describe('validation', function() {
    it('should fail to validate invalid private keys', function() {
      const invalidPrvKeys = [
        'xprv9s21ZrQH143K2J9hbmRNqDXo5aQ3RXvycz8VLchc4dus6r7QekaRWsPT6WPirE67Ps5jae2Ti3webhmFDarJG76h3jFqeg8u3WzeisjS2qwXYZ',
        'xpub661MyMwAqRbcFjmMuHyjyZsQYGD6m8JZseFXpjAc1djoKvnMiJvqCeGu4cvxDNXstgPTsP1yeXewvUf6rUubvuG8mi9yPEb7hHVVCqRnhu7',
        '02620C05D663B1585616C79A482B8F1F27ED9FC24719EEB358E6A085C285732632', // private key
        '123',
      ];

      for (const prv of invalidPrvKeys) {
        should.doesNotThrow(() => Utils.isValidPrivateKey(prv));
        Utils.isValidPrivateKey(prv).should.be.false();
      }
    });

    it('should validate private keys', function() {
      const validPrvKeys = [
        'xprv9s21ZrQH143K2J9hbmRNqDXo5aQ3RXvycz8VLchc4dus6r7QekaRWsPT6WPirE67Ps5jae2Ti3webhmFDarJG76h3jFqeg8u3WzeisjS2qw',
        'xprv9s21ZrQH143K2SDygJstGsPjHNztrAP6RxNH3YiBetww4WtA7hZxEaSFdkzjsE7kAik4c48Mp5q3Bgsaqv6wEyUZ6rB6odvw7Q2u1WF2RP9',
        '1E7D588F5B3519FEE3B686E4A42E7275E4384DF807AE12165323B5FCEECB402A',
        'DBDE50C2141EEE3B50F097DB4893BD20C42171813DF1B8B19ABA29A2028E3F51',
      ];

      for (const prv of validPrvKeys) {
        Utils.isValidPrivateKey(prv).should.be.true();
      }
    });

    it('should fail to validate invalid public keys', function() {
      const invalidPubKeys = [
        'xpub661MyMwAqRbcFjmMuHyjyZsQYGD6m8JZseFXpjAc1djoKvnMiJvqCeGu4cvxDNXstgPTsP1yeXewvUf6rUubvuG8mi9yPEb7hHVVCqRnhu7XYZ',
        'xprv9s21ZrQH143K2J9hbmRNqDXo5aQ3RXvycz8VLchc4dus6r7QekaRWsPT6WPirE67Ps5jae2Ti3webhmFDarJG76h3jFqeg8u3WzeisjS2qw',
        '1E7D588F5B3519FEE3B686E4A42E7275E4384DF807AE12165323B5FCEECB402A', // private key
        '123',
      ];

      for (const pub of invalidPubKeys) {
        should.doesNotThrow(() => Utils.isValidPublicKey(pub));
        Utils.isValidPublicKey(pub).should.be.false();
      }
    });

    it('should validate pub keys', function() {
      const validPubKeys = [
        'xpub661MyMwAqRbcGEkHtJzvg4PRy9i6YzYewjr6sqXhCU8gyrZtdH88BMrdzU3wo1Q3TodAyMU3aPaVAVTPvkgpA3aMvN9hQUu6x7xU2E68Drz',
        'xpub661MyMwAqRbcFjmMuHyjyZsQYGD6m8JZseFXpjAc1djoKvnMiJvqCeGu4cvxDNXstgPTsP1yeXewvUf6rUubvuG8mi9yPEb7hHVVCqRnhu7',
        '02620C05D663B1585616C79A482B8F1F27ED9FC24719EEB358E6A085C285732632',
        '021E3BC1DE4255255BC799983F0A8384DAD84B3730BD95996AB95349C584B02B79',
      ];

      for (const pub of validPubKeys) {
        Utils.isValidPublicKey(pub).should.be.true();
      }
    });

    it('should fail to validate invalid addresses', function() {
      const invalidAddresses = [
        'xpub661MyMwAqRbcFjmMuHyjyZsQYGD6m8JZseFXpjAc1djoKvnMiJvqCeGu4cvxDNXstgPTsP1yeXewvUf6rUubvuG8mi9yPEb7hHVVCqRnhu7',
        'X03DC13CBBF29765C7745578D9E091280522F37684EF0E400B86B1C409BC454F1F3',
        'abc',
      ];

      for (const address of invalidAddresses) {
        should.doesNotThrow(() => Utils.isValidAddress(address));
        Utils.isValidAddress(address).should.be.false();
      }
    });

    it('should validate addresses', function() {
      const validAddresses = [
        '0203DC13CBBF29765C7745578D9E091280522F37684EF0E400B86B1C409BC454F1F3',
        '020385D724A9A3E7E32BADF40F3279AF5A190CB2CFCAB6639BF532A0069E0E3824D0',
        '01513fa90c1a74c34a8958dd86055e9736edb1ead918bd4d4d750ca851946be7aa', // ed25519
      ];

      for (const address of validAddresses) {
        Utils.isValidAddress(address).should.be.true();
      }
    });

    it('should fail to verify invalid message signature', function() {
      const invalidSignature = '01d2e4736b8ff27a1d23be876950afb6991dad455ae351efcd036f95a1f7fe5a';
      const data = '';
      const publicKey = '018267d68f8d249b1430551ecc7b4c176d66f2ba2bf98d5547e7c3accc99375e53';

      should.throws(() => Utils.verifySignature(invalidSignature, data, publicKey));
    });

    it('should fail to verify invalid tx signature', function() {
      const invalidSignature =
        '0201d2e4736b8ff27a1d23be876950afb6991dad455ae351efcd036f95a1f7fe5a01d2e4736b8ff27a1d23be876950afb6991dad455ae351efcd036f95a1f7fe5a';
      const data = '';
      const publicKey = '018267d68f8d249b1430551ecc7b4c176d66f2ba2bf98d5547e7c3accc99375e53';

      should.throws(() => Utils.verifySignature(invalidSignature, data, publicKey));
    });

    it('should verify valid message signature', function() {
      const keyPair = new KeyPair();
      const messageToSign = Buffer.from(randomBytes(32)).toString('hex');
      const { signature } = Utils.signMessage(keyPair, messageToSign);
      should.doesNotThrow(() =>
        Utils.verifySignature(Buffer.from(signature).toString('hex'), messageToSign, keyPair.getKeys().pub),
      );
    });
  });
});
