import assert from 'assert';
import { KeyPair } from '../../src';
import utils from '../../src/lib/utils';
import should from 'should';
import { Eddsa } from '@bitgo/sdk-core';
import { Ed25519Bip32HdTree, HDTree } from '@bitgo/sdk-lib-mpc';

describe('Ton KeyPair', function () {
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
    it('from an empty value', async () => {
      const keyPair = new KeyPair();
      should.exists(keyPair.getKeys().prv);
      should.exists(keyPair.getKeys().pub);
      const address = await utils.getAddressFromPublicKey(keyPair.getKeys().pub);
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

  describe('should fail to create a KeyPair', function () {
    it('from an invalid public key', () => {
      const source = {
        pub: '01D63D',
      };

      assert.throws(() => new KeyPair(source));
    });
  });
});
