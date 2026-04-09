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

  describe('KeyPair Creation', () => {
    it('should create keypair with public and private keys from empty value', async () => {
      const keyPair = new KeyPair();
      const keys = keyPair.getKeys();

      should.exist(keys.prv);
      should.exist(keys.pub);

      const address = await utils.getAddressFromPublicKey(keys.pub);
      should.exist(address);
    });

    it('should create keypair from derived public key', () => {
      const keyPair = new KeyPair({ pub: rootPublicKey });
      keyPair.getKeys().pub.should.equal(rootPublicKey);
      utils.isValidPublicKey(rootPublicKey).should.be.true();
    });

    it('should create keypair from random seed', () => {
      const keyPair = basecoin.generateKeyPair();
      keyPair.should.have.property('pub');
      keyPair.should.have.property('prv');
      basecoin.isValidPub(keyPair.pub).should.equal(true);
    });

    it('should create keypair without private key', () => {
      const keyPair = new KeyPair({ pub: rootPublicKey });
      const keys = keyPair.getKeys();

      keys.should.have.property('pub');
      keys.pub.should.equal(rootPublicKey);
      should.not.exist(keys.prv);
    });

    const invalidPublicKeys = [
      { pub: '01D63D', description: 'invalid format' },
      { pub: '0x' + 'a'.repeat(64), description: '0x prefix' },
      { pub: 'abc123', description: 'too short' },
      { pub: 'a'.repeat(128), description: 'too long' },
    ];

    invalidPublicKeys.forEach(({ pub, description }) => {
      it(`should reject public key with ${description}`, () => {
        assert.throws(() => new KeyPair({ pub }));
      });
    });
  });

  describe('KeyPair Operations', () => {
    it('should generate random keypair each time', () => {
      const keyPair1 = basecoin.generateKeyPair();
      const keyPair2 = basecoin.generateKeyPair();

      keyPair1.pub.should.not.equal(keyPair2.pub);
      keyPair1.prv.should.not.equal(keyPair2.prv);
    });

    it('should validate generated public keys', () => {
      const keyPair = basecoin.generateKeyPair();
      basecoin.isValidPub(keyPair.pub).should.equal(true);
      utils.isValidPublicKey(keyPair.pub).should.be.true();
    });
  });

  describe('Address Derivation', () => {
    it('should derive valid address from public key', () => {
      const keyPair = new KeyPair({ pub: rootPublicKey });
      const address = keyPair.getAddress();

      should.exist(address);
      utils.isValidAddress(address).should.be.true();
    });

    it('should derive same address from same public key', () => {
      const address1 = utils.getAddressFromPublicKey(rootPublicKey);
      const address2 = utils.getAddressFromPublicKey(rootPublicKey);

      address1.should.equal(address2);
    });

    it('should derive different addresses from different public keys', () => {
      const keyPair1 = basecoin.generateKeyPair();
      const keyPair2 = basecoin.generateKeyPair();

      const address1 = utils.getAddressFromPublicKey(keyPair1.pub);
      const address2 = utils.getAddressFromPublicKey(keyPair2.pub);

      address1.should.not.equal(address2);
    });
  });
});
