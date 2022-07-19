import assert from 'assert';
import should from 'should';
import { KeyPair } from '../../src';
import * as testData from '../resources/eth2';

const pub = testData.ACCOUNT_1.publicKey;
const prv = testData.ACCOUNT_1.privateKey;

describe('Eth2 Key Pair', () => {
  describe('should create a valid KeyPair', () => {
    it('without source', () => {
      const keyPair = new KeyPair();
      should.exists(keyPair.getKeys().secretShares);
      should.exists(keyPair.getKeys().publicShare);
      should.equal(keyPair.getKeys().secretShares.length, 3);
    });

    it('from a bls key', () => {
      const baseKeyPair = new KeyPair();
      const inheritKeyPair = new KeyPair(baseKeyPair.getKeys());
      should.equal(inheritKeyPair.getKeys().secretShares, baseKeyPair.getKeys().secretShares);
      should.equal(inheritKeyPair.getKeys().publicShare, baseKeyPair.getKeys().publicShare);
    });

    it('from a bls key with a single invalid private share', () => {
      assert.throws(
        () =>
          new KeyPair({
            secretShares: ['0x73eda753299d7d483339d80809a1d80553bda402fffe5bfeffffffff00000002'],
            publicShare: pub,
          })
      );
    });

    it('from a bls key with an invalid public share', () => {
      assert.throws(
        () =>
          new KeyPair({
            secretShares: [prv],
            publicShare: '123',
          })
      );
    });

    it('from dkg options', () => {
      const keyPair = new KeyPair({
        threshold: 1,
        participants: 2,
      });
      should.exists(keyPair.getKeys().secretShares);
      should.exists(keyPair.getKeys().publicShare);
      should.equal(keyPair.getKeys().secretShares.length, 2);
    });

    it('from invalid dkg options', () => {
      assert.throws(
        () =>
          new KeyPair({
            threshold: 2,
            participants: 1,
          })
      );
    });

    it('should recognize a valid public key', () => {
      const keyPair = new KeyPair();
      KeyPair.isValidPub(keyPair.getKeys().publicShare).should.be.true();
    });

    it('should recognize an invalid public key', () => {
      const pubkey = '123';
      KeyPair.isValidPub(pubkey).should.be.false();
    });

    it('should recognize a valid priv key', () => {
      const prvBuff = Buffer.from(testData.ACCOUNT_1.privateKeyBytes);
      KeyPair.isValidPrv(prvBuff).should.be.true();

      const prvString = '0x' + prvBuff.toString('hex');
      KeyPair.isValidPrv(prvString).should.be.true();
    });

    it('should recognize an invalid priv key', () => {
      const prvBuff = Buffer.from('73eda753299d7d483339d80809a1d80553bda402fffe5bfeffffffff00000002');
      KeyPair.isValidPrv(prvBuff).should.be.false();

      const prvString = '0x' + prvBuff.toString('hex');
      KeyPair.isValidPrv(prvString).should.be.false();
    });
  });

  describe('should validly perform key aggregation', () => {
    it('from a single valid pubkey', () => {
      const keyPair = new KeyPair();
      const pub = keyPair.getKeys().publicShare;
      const aggregatedKey = KeyPair.aggregatePubkeys([pub]);
      aggregatedKey.length.should.equal(98);
    });

    it('from a set of valid pubkeys', () => {
      const keyPair1 = new KeyPair();
      const pub1 = keyPair1.getKeys().publicShare;

      const keyPair2 = new KeyPair();
      const pub2 = keyPair2.getKeys().publicShare;
      const aggregatedKey = KeyPair.aggregatePubkeys([pub1, pub2]);
      aggregatedKey.length.should.equal(98);
    });
  });

  describe('should fail to create a KeyPair', () => {
    it('from a public key', () => {
      assert.throws(
        () => new KeyPair().recordKeysFromPublicKey(pub),
        (e) => e.message.includes(testData.errorMessageInvalidPublicKey)
      );
    });

    it('from a private key', () => {
      assert.throws(
        () => new KeyPair().recordKeysFromPrivateKey(prv),
        (e) => e.message === testData.errorMessageInvalidPrivateKey
      );
    });
  });

  describe('should reject key aggregation', () => {
    it('from a single invalid pubkey string', () => {
      const pub = '123';
      assert.throws(() => KeyPair.aggregatePubkeys([pub]));
    });

    it('from a single invalid pubkey buffer', () => {
      const pub = '0x' + Buffer.from('abc').toString('hex');
      assert.throws(() => KeyPair.aggregatePubkeys([pub]));
    });

    it('from a set of invalid pubkeys', () => {
      const pub1 = '0x' + Buffer.from('abc').toString('hex');

      const keyPair2 = new KeyPair();
      const pub2 = keyPair2.getKeys().publicShare;
      assert.throws(() => KeyPair.aggregatePubkeys([pub1, pub2]));
    });

    it('from a single invalid prvkey string', () => {
      const prv = BigInt('0x73eda753299d7d483339d80809a1d80553bda402fffe5bfeffffffff00000002');
      assert.throws(() => KeyPair.aggregatePrvkeys(['0x' + prv.toString(16)]));
    });

    it('from a set of invalid prvkeys', () => {
      const prv1 = BigInt('0x73eda753299d7d483339d80809a1d80553bda402fffe5bfeffffffff00000002');

      const keyPair2 = new KeyPair();
      const secretShares2 = keyPair2.getKeys().secretShares;
      assert.throws(() => KeyPair.aggregatePrvkeys(['0x' + prv1.toString(16), secretShares2[1]]));
    });
  });

  describe('Signatures', () => {
    it('should accept user and backup aggregated signature', async () => {
      const msg = Buffer.from('test message');
      const userKeyPair = new KeyPair();
      const userSecrets = userKeyPair.getKeys().secretShares;
      const userPub = userKeyPair.getKeys().publicShare;

      const backupKeyPair = new KeyPair();
      const backupSecrets = backupKeyPair.getKeys().secretShares;
      const backupPub = backupKeyPair.getKeys().publicShare;

      const walletKeyPair = new KeyPair();
      const walletSecrets = walletKeyPair.getKeys().secretShares;
      const walletPub = walletKeyPair.getKeys().publicShare;

      const userPrv = KeyPair.aggregatePrvkeys([userSecrets[0], backupSecrets[0], walletSecrets[0]]);
      const signKeyPair1 = new KeyPair({ prv: userPrv });
      const userSig = await signKeyPair1.sign(msg);

      const backupPrv = KeyPair.aggregatePrvkeys([userSecrets[1], backupSecrets[1], walletSecrets[1]]);
      const signKeyPair2 = new KeyPair({ prv: backupPrv });
      const backupSig = await signKeyPair2.sign(msg);

      const aggregatedKey = KeyPair.aggregatePubkeys([userPub, backupPub, walletPub]);
      const aggregatedSig = KeyPair.aggregateSignatures({ 1: BigInt(userSig), 2: BigInt(backupSig) });

      (await KeyPair.verifySignature(aggregatedKey, msg, aggregatedSig)).should.be.true();
    });

    it('should accept user and wallet aggregated signature', async () => {
      const msg = Buffer.from('test message');
      const userKeyPair = new KeyPair();
      const userSecrets = userKeyPair.getKeys().secretShares;
      const userPub = userKeyPair.getKeys().publicShare;

      const backupKeyPair = new KeyPair();
      const backupSecrets = backupKeyPair.getKeys().secretShares;
      const backupPub = backupKeyPair.getKeys().publicShare;

      const walletKeyPair = new KeyPair();
      const walletSecrets = walletKeyPair.getKeys().secretShares;
      const walletPub = walletKeyPair.getKeys().publicShare;

      const userPrv = KeyPair.aggregatePrvkeys([userSecrets[0], backupSecrets[0], walletSecrets[0]]);
      const signKeyPair1 = new KeyPair({ prv: userPrv });
      const userSig = await signKeyPair1.sign(msg);

      const walletPrv = KeyPair.aggregatePrvkeys([userSecrets[2], backupSecrets[2], walletSecrets[2]]);
      const signKeyPair2 = new KeyPair({ prv: walletPrv });
      const walletSig = await signKeyPair2.sign(msg);

      const aggregatedKey = KeyPair.aggregatePubkeys([userPub, backupPub, walletPub]);
      const aggregatedSig = KeyPair.aggregateSignatures({ 1: BigInt(userSig), 3: BigInt(walletSig) });

      (await KeyPair.verifySignature(aggregatedKey, msg, aggregatedSig)).should.be.true();
    });

    it('should accept backup and wallet aggregated signature', async () => {
      const msg = Buffer.from('test message');
      const userKeyPair = new KeyPair();
      const userSecrets = userKeyPair.getKeys().secretShares;
      const userPub = userKeyPair.getKeys().publicShare;

      const backupKeyPair = new KeyPair();
      const backupSecrets = backupKeyPair.getKeys().secretShares;
      const backupPub = backupKeyPair.getKeys().publicShare;

      const walletKeyPair = new KeyPair();
      const walletSecrets = walletKeyPair.getKeys().secretShares;
      const walletPub = walletKeyPair.getKeys().publicShare;

      const backupPrv = KeyPair.aggregatePrvkeys([userSecrets[1], backupSecrets[1], walletSecrets[1]]);
      const signKeyPair1 = new KeyPair({ prv: backupPrv });
      const backupSig = await signKeyPair1.sign(msg);

      const walletPrv = KeyPair.aggregatePrvkeys([userSecrets[2], backupSecrets[2], walletSecrets[2]]);
      const signKeyPair2 = new KeyPair({ prv: walletPrv });
      const walletSig = await signKeyPair2.sign(msg);

      const aggregatedKey = KeyPair.aggregatePubkeys([userPub, backupPub, walletPub]);
      const aggregatedSig = KeyPair.aggregateSignatures({ 2: BigInt(backupSig), 3: BigInt(walletSig) });

      (await KeyPair.verifySignature(aggregatedKey, msg, aggregatedSig)).should.be.true();
    });

    it('should accept 3-of-3 aggregated signature', async () => {
      const msg = Buffer.from('test message');
      const keyPair1 = new KeyPair();
      const secrets1 = keyPair1.getKeys().secretShares;
      const pub1 = keyPair1.getKeys().publicShare;

      const keyPair2 = new KeyPair();
      const secrets2 = keyPair2.getKeys().secretShares;
      const pub2 = keyPair2.getKeys().publicShare;

      const keyPair3 = new KeyPair();
      const secrets3 = keyPair3.getKeys().secretShares;
      const pub3 = keyPair3.getKeys().publicShare;

      const prv1 = KeyPair.aggregatePrvkeys([secrets1[0], secrets2[0], secrets3[0]]);
      const signKeyPair1 = new KeyPair({ prv: prv1 });
      const sig1 = await signKeyPair1.sign(msg);
      const prv2 = KeyPair.aggregatePrvkeys([secrets1[1], secrets2[1], secrets3[1]]);
      const signKeyPair2 = new KeyPair({ prv: prv2 });
      const sig2 = await signKeyPair2.sign(msg);
      const prv3 = KeyPair.aggregatePrvkeys([secrets1[2], secrets2[2], secrets3[2]]);
      const signKeyPair3 = new KeyPair({ prv: prv3 });
      const sig3 = await signKeyPair3.sign(msg);

      const aggregatedKey = KeyPair.aggregatePubkeys([pub1, pub2, pub3]);
      const aggregatedSig = KeyPair.aggregateSignatures({ 1: BigInt(sig1), 2: BigInt(sig2), 3: BigInt(sig3) });

      (await KeyPair.verifySignature(aggregatedKey, msg, aggregatedSig)).should.be.true();
    });

    it('should reject 1-of-3 aggregated signature', async () => {
      const msg = Buffer.from('test message');
      const keyPair1 = new KeyPair();
      const secrets1 = keyPair1.getKeys().secretShares;
      const pub1 = keyPair1.getKeys().publicShare;

      const keyPair2 = new KeyPair();
      const secrets2 = keyPair2.getKeys().secretShares;
      const pub2 = keyPair2.getKeys().publicShare;

      const keyPair3 = new KeyPair();
      const secrets3 = keyPair3.getKeys().secretShares;
      const pub3 = keyPair3.getKeys().publicShare;

      const prv = KeyPair.aggregatePrvkeys([secrets1[0], secrets2[0], secrets3[0]]);
      const signKeyPair = new KeyPair({ prv });
      const sig1 = await signKeyPair.sign(msg);

      const aggregatedKey = KeyPair.aggregatePubkeys([pub1, pub2, pub3]);
      const aggregatedSig = KeyPair.aggregateSignatures({ 1: BigInt(sig1) });

      (await KeyPair.verifySignature(aggregatedKey, msg, aggregatedSig)).should.be.false();
      (await KeyPair.verifySignature(aggregatedKey, msg, sig1)).should.be.false();
    });
  });
});
