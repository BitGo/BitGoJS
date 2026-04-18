import * as should from 'should';
import { coins } from '@bitgo/statics';
import { Kaspa, Tkaspa } from '../../src';
import { KeyPair } from '../../src/lib/keyPair';

describe('Kaspa (KASPA)', function () {
  let kaspa: Kaspa;
  let tkaspa: Tkaspa;

  before(function () {
    const mockBitgo = {
      url: () => '',
      microservicesUrl: () => '',
      post: () => ({ result: () => Promise.resolve({}) }),
      get: () => ({ result: () => Promise.resolve({}) }),
    } as any;
    kaspa = new Kaspa(mockBitgo, coins.get('kaspa'));
    tkaspa = new Tkaspa(mockBitgo, coins.get('tkaspa'));
  });

  describe('Coin Properties', function () {
    it('should have the correct chain name', function () {
      kaspa.getChain().should.equal('kaspa');
      tkaspa.getChain().should.equal('tkaspa');
    });

    it('should have the correct family', function () {
      kaspa.getFamily().should.equal('kaspa');
    });

    it('should have the correct full name', function () {
      kaspa.getFullName().should.equal('Kaspa');
      tkaspa.getFullName().should.equal('Testnet Kaspa');
    });

    it('should have the correct base factor (10^8)', function () {
      kaspa.getBaseFactor().should.equal(100000000);
    });

    it('should support TSS (ECDSA MPC)', function () {
      kaspa.supportsTss().should.be.true();
      kaspa.getMPCAlgorithm().should.equal('ecdsa');
    });
  });

  describe('Key Validation', function () {
    it('should validate a valid public key', function () {
      kaspa.isValidPub('0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798').should.be.true();
    });

    it('should reject an invalid public key', function () {
      kaspa.isValidPub('not-a-key').should.be.false();
    });

    it('should validate a valid private key', function () {
      kaspa.isValidPrv('a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2').should.be.true();
    });
  });

  describe('Key Generation', function () {
    it('should generate a key pair', function () {
      const kp = kaspa.generateKeyPair();
      should.exist(kp.pub);
      should.exist(kp.prv);
      kp.pub!.should.have.length(66);
      kp.prv!.should.have.length(64);
    });

    it('should generate a key pair from seed', function () {
      const seed = Buffer.alloc(32, 1);
      const kp = kaspa.generateKeyPair(seed);
      should.exist(kp.pub);
      should.exist(kp.prv);
    });

    it('should generate consistent keys from same seed', function () {
      const seed = Buffer.alloc(32, 42);
      const kp1 = kaspa.generateKeyPair(seed);
      const kp2 = kaspa.generateKeyPair(seed);
      kp1.pub!.should.equal(kp2.pub!);
      kp1.prv!.should.equal(kp2.prv!);
    });
  });

  describe('Address Validation', function () {
    it('should validate a mainnet address', function () {
      const kp = new KeyPair();
      const address = kp.getAddress('mainnet');
      kaspa.isValidAddress(address).should.be.true();
    });

    it('should reject an invalid address', function () {
      kaspa.isValidAddress('not-an-address').should.be.false();
    });

    it('should reject empty address', function () {
      kaspa.isValidAddress('').should.be.false();
    });
  });
});
