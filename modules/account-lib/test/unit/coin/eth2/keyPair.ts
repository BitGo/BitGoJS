import should from 'should';
import { KeyPair } from '../../../../src/coin/eth2';
import * as testData from '../../../resources/eth2/eth2';

const pub = testData.ACCOUNT_1.publicKey;
const prv = testData.ACCOUNT_1.privateKey;

describe('Eth2 Key Pair', () => {
  describe('should create a valid KeyPair', () => {
    it('from an empty value', () => {
      const keyPair = new KeyPair();
      should.exists(keyPair.getKeys().pub);
      should.exists(keyPair.getKeys().prv);
      should.equal(keyPair.getKeys().pub.slice(0, 2), '0x');
    });

    it('without source', () => {
      const keyPair = new KeyPair();
      should.exists(keyPair.getKeys().prv);
      should.exists(keyPair.getKeys().pub);
    });

    it('from a private key', () => {
      const baseKeyPair = new KeyPair();
      const inheritKeyPair = new KeyPair();
      inheritKeyPair.recordKeysFromPrivateKey(baseKeyPair.getKeys().prv!);
      should.equal(inheritKeyPair.getKeys().prv, baseKeyPair.getKeys().prv);
    });

    it('from a byte array private key converted to string', () => {
      const privateKey = '0x' + Buffer.from(testData.ACCOUNT_1.privateKeyBytes).toString('hex');
      const keyPair = new KeyPair();
      keyPair.recordKeysFromPrivateKey(privateKey);
      should.equal(keyPair.getKeys().prv, privateKey);
    });

    it('should recognize a valid public key', () => {
      const keyPair = new KeyPair();
      KeyPair.isValidPub(keyPair.getKeys().pub).should.be.true();
    });

    it('should recognize an invalid public key', () => {
      const pubkey = 'abc';
      KeyPair.isValidPub(pubkey).should.be.false();
    });

    it('should recognize a valid priv key', () => {
      const prvBuff = Buffer.from(testData.ACCOUNT_1.privateKeyBytes);
      KeyPair.isValidPrv(prvBuff).should.be.true();

      const prvString = '0x' + prvBuff.toString('hex');
      KeyPair.isValidPrv(prvString).should.be.true();
    });

    it('should recognize an invalid priv key', () => {
      const prvBuff = Buffer.from('abc');
      KeyPair.isValidPrv(prvBuff).should.be.false();

      const prvString = '0x' + prvBuff.toString('hex');
      KeyPair.isValidPrv(prvString).should.be.false();
    });
  });

  describe('should fail to create a KeyPair', () => {
    it('from a public key', () => {
      should.throws(
        () => new KeyPair().recordKeysFromPublicKey(pub),
        e => e.message.includes(testData.errorMessageInvalidPublicKey),
      );
    });

    it('from an invalid private key', () => {
      const shorterPrv = '82A34E';
      const longerPrv = prv + '1';
      should.throws(
        () => new KeyPair().recordKeysFromPrivateKey(shorterPrv),
        e => e.message === testData.errorMessageInvalidPrivateKey,
      );
      should.throws(
        () => new KeyPair().recordKeysFromPrivateKey(longerPrv),
        e => e.message === testData.errorMessageInvalidPrivateKey,
      );
      should.throws(
        () => new KeyPair().recordKeysFromPrivateKey(prv + pub),
        e => e.message === testData.errorMessageInvalidPrivateKey,
      );
    });
  });
});
