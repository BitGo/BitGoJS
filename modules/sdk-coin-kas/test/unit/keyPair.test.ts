import * as should from 'should';
import { KeyPair } from '../../src/lib/keyPair';
import { isValidAddress, isValidPublicKey } from '../../src/lib/utils';

describe('Kaspa KeyPair', () => {
  const validPrivateKey = '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';

  describe('constructor', () => {
    it('should generate a random key pair with no arguments', () => {
      const kp = new KeyPair();
      const keys = kp.getKeys();
      should.exist(keys.pub);
      should.exist(keys.prv);
      keys.pub.length.should.equal(66); // 33 bytes hex
      keys.prv!.length.should.equal(64); // 32 bytes hex
    });

    it('should create key pair from private key', () => {
      const kp = new KeyPair({ prv: validPrivateKey });
      const keys = kp.getKeys();
      keys.prv!.should.equal(validPrivateKey);
      should.exist(keys.pub);
      // Compressed public key must start with 02 or 03
      (keys.pub.startsWith('02') || keys.pub.startsWith('03')).should.be.true();
    });

    it('should create key pair from public key', () => {
      const kp1 = new KeyPair({ prv: validPrivateKey });
      const pub = kp1.getKeys().pub;
      const kp2 = new KeyPair({ pub });
      kp2.getKeys().pub.should.equal(pub);
    });

    it('should throw on invalid private key', () => {
      should.throws(() => new KeyPair({ prv: 'not-valid' }));
    });
  });

  describe('getAddress', () => {
    // Known vector: privkey 1234...ef → pubkey 02bb50e2...020d → x-only bb50e2...020d
    const knownMainnetAddress = 'kaspa:qza4pckcnf8dwpnr6zqxt8lq449ehslqdst6yf6r89nvkkwwacpq6xssxnds3';
    const knownTestnetAddress = 'kaspatest:qza4pckcnf8dwpnr6zqxt8lq449ehslqdst6yf6r89nvkkwwacpq68kkaunp4';

    it('should derive a valid mainnet address', () => {
      const kp = new KeyPair({ prv: validPrivateKey });
      const address = kp.getAddress('mainnet');
      address.should.startWith('kaspa:');
      isValidAddress(address).should.be.true();
    });

    it('should derive the correct mainnet address for known vector', () => {
      const kp = new KeyPair({ prv: validPrivateKey });
      kp.getAddress('mainnet').should.equal(knownMainnetAddress);
    });

    it('should derive a valid testnet address', () => {
      const kp = new KeyPair({ prv: validPrivateKey });
      const address = kp.getAddress('testnet');
      address.should.startWith('kaspatest:');
      isValidAddress(address).should.be.true();
    });

    it('should derive the correct testnet address for known vector', () => {
      const kp = new KeyPair({ prv: validPrivateKey });
      kp.getAddress('testnet').should.equal(knownTestnetAddress);
    });

    it('should derive different addresses for mainnet vs testnet', () => {
      const kp = new KeyPair({ prv: validPrivateKey });
      const mainnet = kp.getAddress('mainnet');
      const testnet = kp.getAddress('testnet');
      mainnet.should.not.equal(testnet);
    });
  });

  describe('getXOnlyPublicKey', () => {
    it('should return a 32-byte x-only public key', () => {
      const kp = new KeyPair({ prv: validPrivateKey });
      const xOnly = kp.getXOnlyPublicKey();
      xOnly.length.should.equal(32);
    });
  });

  describe('isValidPublicKey', () => {
    it('should return true for a valid compressed public key', () => {
      const kp = new KeyPair({ prv: validPrivateKey });
      isValidPublicKey(kp.getKeys().pub).should.be.true();
    });

    it('should return false for invalid public keys', () => {
      isValidPublicKey('invalid').should.be.false();
      isValidPublicKey('').should.be.false();
      isValidPublicKey('00' + 'aa'.repeat(32)).should.be.false(); // invalid prefix
    });
  });
});
