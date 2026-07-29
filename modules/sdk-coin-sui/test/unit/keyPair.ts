import assert from 'assert';
import { KeyPair } from '../../src';
import utils from '../../src/lib/utils';
import should from 'should';
import { Eddsa } from '@bitgo/sdk-core';
import bs58 from 'bs58';
import { Ed25519Bip32HdTree, HDTree } from '@bitgo/sdk-lib-mpc';

describe('SUI KeyPair', function () {
  let rootKeychain;
  let rootPublicKey;
  let MPC: Eddsa;
  let hdTree: HDTree;

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
  });

  describe('should create a valid KeyPair', () => {
    it('from an empty value', () => {
      const keyPair = new KeyPair();
      should.exists(keyPair.getKeys().prv);
      should.exists(keyPair.getKeys().pub);
    });
  });

  describe('Keypair from derived Public Key', () => {
    it('should create keypair with just derived public key', () => {
      const keyPair = new KeyPair({ pub: rootPublicKey });
      keyPair.getKeys().pub.should.equal(rootPublicKey);
    });

    it('should create keypair with base58 public key', () => {
      // common pub in wallet platform when adding signature is passed as base58 public key
      const base58PubKey = '8Arrfe4vAh5fAEJgUBwL42EZa5P22zJJUnn569hxWfJU';
      const keyPair = new KeyPair({ pub: base58PubKey });

      const decodedbs58Buffer: Buffer = bs58.decode(base58PubKey);
      const publicKeyHexString = decodedbs58Buffer.toString('hex');

      should.equal(keyPair.getKeys().pub, publicKeyHexString);
    });

    it('should derived ed25519 public key should be valid', () => {
      utils.isValidPublicKey(rootPublicKey).should.be.true();
    });

    it('should return sui address from derived public key', () => {
      const keyPair = new KeyPair({ pub: rootPublicKey });
      const address = keyPair.getAddress();
      utils.isValidAddress(address).should.be.true();
    });

    it('should return noramlize address from derived public key', () => {
      const keyPair = new KeyPair({ pub: rootPublicKey });
      const address = keyPair.getAddress();
      address.should.startWith('0x');
    });
  });

  describe('should fail to create a KeyPair', function () {
    it('from an invalid public key', () => {
      const source = {
        pub: '01D63D',
      };

      assert.throws(() => new KeyPair(source));
    });
  });
});
