import assert from 'assert';
import { KeyPair, Iota } from '../../src';
import utils from '../../src/lib/utils';
import should from 'should';
import { Eddsa } from '@bitgo/sdk-core';
import { Ed25519Bip32HdTree, HDTree } from '@bitgo/sdk-lib-mpc';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';

describe('Iota KeyPair', function () {
  let rootKeychain;
  let rootPublicKey;
  let MPC: Eddsa;
  let hdTree: HDTree;
  let bitgo: TestBitGoAPI;
  let basecoin;

  before(async () => {
    hdTree = await Ed25519Bip32HdTree.initialize();
    MPC = await Eddsa.initialize(hdTree);
    const A = MPC.keyShare(1, 2, 3);
    const B = MPC.keyShare(2, 2, 3);
    const C = MPC.keyShare(3, 2, 3);

    const A_combine = MPC.keyCombine(A.uShare, [B.yShares[1], C.yShares[1]]);

    const commonKeychain = A_combine.pShare.y + A_combine.pShare.chaincode;
    rootKeychain = MPC.deriveUnhardened(commonKeychain, 'm/0');
    rootPublicKey = Buffer.from(rootKeychain, 'hex').slice(0, 32).toString('hex');
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'mock' });
    bitgo.safeRegister('tiota', Iota.createInstance);
    basecoin = bitgo.coin('tiota');
  });

  describe('should create a valid KeyPair', () => {
    it('from an empty value', async () => {
      const keyPair = new KeyPair();
      should.exists(keyPair.getKeys().prv);
      should.exists(keyPair.getKeys().pub);
      const address = await utils.getAddressFromPublicKey(keyPair.getKeys().pub);
      console.log('address:', address);
      should.exists(address);
    });
  });

  describe('Keypair from derived Public Key', () => {
    it('should create keypair with just derived public key', () => {
      const keyPair = new KeyPair({ pub: rootPublicKey });
      keyPair.getKeys().pub.should.equal(rootPublicKey);
    });

    it('should derived ed25519 public key should be valid', () => {
      utils.isValidPublicKey(rootPublicKey).should.be.true();
    });
  });

  describe('Keypair from random seed', () => {
    it('should generate a keypair from random seed', function () {
      const keyPair = basecoin.generateKeyPair();
      keyPair.should.have.property('pub');
      keyPair.should.have.property('prv');
      basecoin.isValidPub(keyPair.pub).should.equal(true);
    });
  });

  describe('should fail to create a KeyPair', function () {
    it('from an invalid public key', () => {
      const source = {
        pub: '01D63D',
      };

      assert.throws(() => new KeyPair(source));
    });

    it('from an invalid public key with 0x prefix', () => {
      const source = {
        pub: '0x' + 'a'.repeat(64),
      };

      assert.throws(() => new KeyPair(source));
    });

    it('from a too short public key', () => {
      const source = {
        pub: 'abc123',
      };

      assert.throws(() => new KeyPair(source));
    });

    it('from a too long public key', () => {
      const source = {
        pub: 'a'.repeat(128),
      };

      assert.throws(() => new KeyPair(source));
    });
  });

  describe('KeyPair operations', () => {
    it('should get keys from keypair', () => {
      const keyPair = new KeyPair({ pub: rootPublicKey });
      const keys = keyPair.getKeys();

      keys.should.have.property('pub');
      keys.pub.should.equal(rootPublicKey);
    });

    it('should generate random keypair each time', () => {
      const keyPair1 = basecoin.generateKeyPair();
      const keyPair2 = basecoin.generateKeyPair();

      keyPair1.pub.should.not.equal(keyPair2.pub);
      keyPair1.prv.should.not.equal(keyPair2.prv);
    });

    it('should create keypair without private key', () => {
      const keyPair = new KeyPair({ pub: rootPublicKey });
      const keys = keyPair.getKeys();

      keys.should.have.property('pub');
      keys.pub.should.equal(rootPublicKey);
      should.not.exist(keys.prv);
    });

    it('should validate generated public keys', () => {
      const keyPair = basecoin.generateKeyPair();
      basecoin.isValidPub(keyPair.pub).should.equal(true);
      utils.isValidPublicKey(keyPair.pub).should.be.true();
    });
  });

  describe('Address derivation', () => {
    it('should derive address from public key', async () => {
      const keyPair = new KeyPair({ pub: rootPublicKey });
      const address = await utils.getAddressFromPublicKey(keyPair.getKeys().pub);

      should.exist(address);
      utils.isValidAddress(address).should.be.true();
    });

    it('should derive same address from same public key', async () => {
      const address1 = await utils.getAddressFromPublicKey(rootPublicKey);
      const address2 = await utils.getAddressFromPublicKey(rootPublicKey);

      address1.should.equal(address2);
    });

    it('should derive different addresses from different public keys', async () => {
      const keyPair1 = basecoin.generateKeyPair();
      const keyPair2 = basecoin.generateKeyPair();

      const address1 = await utils.getAddressFromPublicKey(keyPair1.pub);
      const address2 = await utils.getAddressFromPublicKey(keyPair2.pub);

      address1.should.not.equal(address2);
    });
  });
});
