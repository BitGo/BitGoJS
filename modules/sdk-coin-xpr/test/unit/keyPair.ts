import { KeyPair } from '../../src/lib';
import should from 'should';

describe('Proton (XPR Network) KeyPair', function () {
  // Test vectors - use valid seed (not all zeros which is invalid for secp256k1)
  const testPrivateKey = 'PVT_K1_2bfGi9rYsXQSXXTvJbDAPhHLQUojjaNLomdm3cEJ1XTzMqUt3V';
  const testSeed = Buffer.from('a'.repeat(64), 'hex');

  describe('Key Generation', function () {
    it('should generate a valid keypair without a seed', function () {
      const keyPair = new KeyPair();
      const keys = keyPair.getKeys();

      should.exist(keys.prv);
      should.exist(keys.pub);
      keys.prv!.should.be.a.String();
      keys.pub.should.be.a.String();
      keys.prv!.should.startWith('PVT_K1_');
      keys.pub.should.startWith('PUB_K1_');
    });

    it('should generate a valid keypair with a seed', function () {
      const keyPair = new KeyPair({ seed: testSeed });
      const keys = keyPair.getKeys();

      should.exist(keys.prv);
      should.exist(keys.pub);
      keys.prv!.should.be.a.String();
      keys.pub.should.be.a.String();
      keys.prv!.should.startWith('PVT_K1_');
      keys.pub.should.startWith('PUB_K1_');
    });

    it('should generate the same keypair with the same seed', function () {
      const keyPair1 = new KeyPair({ seed: testSeed });
      const keyPair2 = new KeyPair({ seed: testSeed });

      const keys1 = keyPair1.getKeys();
      const keys2 = keyPair2.getKeys();

      should.exist(keys1.prv);
      should.exist(keys2.prv);
      keys1.prv!.should.equal(keys2.prv!);
      keys1.pub.should.equal(keys2.pub);
    });

    it('should generate an address from the keypair', function () {
      const keyPair = new KeyPair();
      const address = keyPair.getAddress();

      address.should.be.a.String();
      address.length.should.be.greaterThan(0);
      // For Proton, address returns the public key
      address.should.startWith('PUB_K1_');
    });
  });

  describe('Key Import', function () {
    it('should import from a private key string', function () {
      const keyPair = new KeyPair({ prv: testPrivateKey });
      const keys = keyPair.getKeys();

      should.exist(keys.prv);
      should.exist(keys.pub);
      keys.prv!.should.equal(testPrivateKey);
    });

    it('should import from a public key string', function () {
      // First generate a keypair to get a valid public key
      const generatedKp = new KeyPair({ prv: testPrivateKey });
      const pubKey = generatedKp.getKeys().pub;

      const keyPair = new KeyPair({ pub: pubKey });
      const keys = keyPair.getKeys();

      should.not.exist(keys.prv);
      keys.pub.should.equal(pubKey);
    });

    it('should import from a raw hex private key', function () {
      // 32 bytes / 64 hex characters
      const rawHex = 'a'.repeat(64);
      const keyPair = new KeyPair({ prv: rawHex });
      const keys = keyPair.getKeys();

      should.exist(keys.prv);
      should.exist(keys.pub);
      keys.prv!.should.startWith('PVT_K1_');
    });

    it('should throw on invalid private key', function () {
      should.throws(() => {
        new KeyPair({ prv: 'invalid-key' });
      });
    });

    it('should throw on invalid public key', function () {
      should.throws(() => {
        new KeyPair({ pub: 'invalid-pub-key' });
      });
    });
  });

  describe('Signing and Verification', function () {
    it('should sign a digest and verify the signature', function () {
      const keyPair = new KeyPair({ prv: testPrivateKey });
      const digest = Buffer.from('0'.repeat(64), 'hex'); // 32 bytes

      const signature = keyPair.sign(digest);
      signature.should.be.a.String();
      signature.should.startWith('SIG_K1_');

      const isValid = keyPair.verify(signature, digest);
      isValid.should.equal(true);
    });

    it('should sign with hex string digest', function () {
      const keyPair = new KeyPair({ prv: testPrivateKey });
      const digestHex = '0'.repeat(64); // 32 bytes as hex string

      const signature = keyPair.sign(digestHex);
      signature.should.be.a.String();
      signature.should.startWith('SIG_K1_');
    });

    it('should fail verification with wrong digest', function () {
      const keyPair = new KeyPair({ prv: testPrivateKey });
      const digest1 = Buffer.from('0'.repeat(64), 'hex');
      const digest2 = Buffer.from('1'.repeat(64), 'hex');

      const signature = keyPair.sign(digest1);
      const isValid = keyPair.verify(signature, digest2);
      isValid.should.equal(false);
    });

    it('should throw when signing without private key', function () {
      const keyPair = new KeyPair({ prv: testPrivateKey });
      const pubKey = keyPair.getKeys().pub;
      const pubOnlyKeyPair = new KeyPair({ pub: pubKey });
      const digest = Buffer.from('0'.repeat(64), 'hex');

      should.throws(() => {
        pubOnlyKeyPair.sign(digest);
      }, /Cannot sign without a private key/);
    });

    it('should throw when digest is not 32 bytes', function () {
      const keyPair = new KeyPair({ prv: testPrivateKey });
      const shortDigest = Buffer.from('0'.repeat(20), 'hex'); // 10 bytes

      should.throws(() => {
        keyPair.sign(shortDigest);
      }, /Digest must be 32 bytes/);
    });
  });

  describe('Raw Key Access', function () {
    it('should get raw private key as hex', function () {
      const keyPair = new KeyPair({ prv: testPrivateKey });
      const rawPrivateKey = keyPair.getRawPrivateKey();

      should.exist(rawPrivateKey);
      rawPrivateKey!.should.be.a.String();
      rawPrivateKey!.length.should.equal(64); // 32 bytes = 64 hex chars
    });

    it('should get raw public key as hex', function () {
      const keyPair = new KeyPair({ prv: testPrivateKey });
      const rawPublicKey = keyPair.getRawPublicKey();

      rawPublicKey.should.be.a.String();
      rawPublicKey.length.should.equal(66); // 33 bytes compressed = 66 hex chars
    });

    it('should return undefined for raw private key when only public key is available', function () {
      const keyPair = new KeyPair({ prv: testPrivateKey });
      const pubKey = keyPair.getKeys().pub;
      const pubOnlyKeyPair = new KeyPair({ pub: pubKey });

      const rawPrivateKey = pubOnlyKeyPair.getRawPrivateKey();
      should.not.exist(rawPrivateKey);
    });
  });
});
