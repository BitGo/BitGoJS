import * as should from 'should';
import { coins } from '@bitgo/statics';
import { Kas, Tkas } from '../../src';
import { KeyPair } from '../../src/lib/keyPair';

describe('Kaspa (KAS)', function () {
  let kas: Kas;
  let tkas: Tkas;

  before(function () {
    const mockBitgo = {
      url: () => '',
      microservicesUrl: () => '',
      post: () => ({ result: () => Promise.resolve({}) }),
      get: () => ({ result: () => Promise.resolve({}) }),
    } as any;
    kas = new Kas(mockBitgo, coins.get('kas'));
    tkas = new Tkas(mockBitgo, coins.get('tkas'));
  });

  describe('Coin Properties', function () {
    it('should have the correct chain name', function () {
      kas.getChain().should.equal('kas');
      tkas.getChain().should.equal('tkas');
    });

    it('should have the correct family', function () {
      kas.getFamily().should.equal('kas');
    });

    it('should have the correct full name', function () {
      kas.getFullName().should.equal('Kaspa');
      tkas.getFullName().should.equal('Testnet Kaspa');
    });

    it('should have the correct base factor (10^8)', function () {
      kas.getBaseFactor().should.equal(100000000);
    });

    it('should support TSS (ECDSA MPC)', function () {
      kas.supportsTss().should.be.true();
      kas.getMPCAlgorithm().should.equal('ecdsa');
    });
  });

  describe('Key Validation', function () {
    it('should validate a valid public key', function () {
      kas.isValidPub('0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798').should.be.true();
    });

    it('should reject an invalid public key', function () {
      kas.isValidPub('not-a-key').should.be.false();
    });

    it('should validate a valid private key', function () {
      kas.isValidPrv('a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2').should.be.true();
    });
  });

  describe('Key Generation', function () {
    it('should generate a key pair', function () {
      const kp = kas.generateKeyPair();
      should.exist(kp.pub);
      should.exist(kp.prv);
      kp.pub!.should.have.length(66);
      kp.prv!.should.have.length(64);
    });

    it('should generate a key pair from seed', function () {
      const seed = Buffer.alloc(32, 1);
      const kp = kas.generateKeyPair(seed);
      should.exist(kp.pub);
      should.exist(kp.prv);
    });

    it('should generate consistent keys from same seed', function () {
      const seed = Buffer.alloc(32, 42);
      const kp1 = kas.generateKeyPair(seed);
      const kp2 = kas.generateKeyPair(seed);
      kp1.pub!.should.equal(kp2.pub!);
      kp1.prv!.should.equal(kp2.prv!);
    });
  });

  describe('Address Validation', function () {
    it('should validate a mainnet address', function () {
      const kp = new KeyPair();
      const address = kp.getAddress('mainnet');
      kas.isValidAddress(address).should.be.true();
    });

    it('should reject an invalid address', function () {
      kas.isValidAddress('not-an-address').should.be.false();
    });

    it('should reject empty address', function () {
      kas.isValidAddress('').should.be.false();
    });
  });
});
