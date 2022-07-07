import {
  readSignedMessage,
  Ecdsa,
  ECDSA,
  ECDSAMethods,
} from '@bitgo/sdk-core';
import * as openpgp from 'openpgp';
import * as should from 'should';
import { keyShares } from '../../fixtures/tss/ecdsaKeyShares';

type KeyShare = ECDSA.KeyShare;
const encryptNShare = ECDSAMethods.encryptNShare;
const createCombinedKey = ECDSAMethods.createCombinedKey;
type GpgKeypair = {
  publicKey: string,
  privateKey: string
};

describe('test tss helper functions', function () {
  let mpc: Ecdsa;

  let userKeyShare: KeyShare;
  let backupKeyShare: KeyShare;
  let bitgoKeyShare: KeyShare;

  let userKey;
  let backupKey;
  let bitgoKey;

  let userGpgKeypair: GpgKeypair;
  let backupGpgKeypair: GpgKeypair;
  let bitgoGpgKeypair: GpgKeypair;
  let commonKeychain: string;

  before(async function () {
    mpc = new Ecdsa();
    userKeyShare = keyShares.userKeyShare;
    backupKeyShare = keyShares.backupKeyShare;
    bitgoKeyShare = keyShares.bitgoKeyShare;

    userKey = mpc.keyCombine(userKeyShare.pShare, [backupKeyShare.nShares[1], bitgoKeyShare.nShares[1]]);
    backupKey = mpc.keyCombine(backupKeyShare.pShare, [userKeyShare.nShares[2], bitgoKeyShare.nShares[2]]);
    bitgoKey = mpc.keyCombine(bitgoKeyShare.pShare, [backupKeyShare.nShares[3], userKeyShare.nShares[3]]);

    (userKey.xShare.y + userKey.xShare.chaincode).should.equal(backupKey.xShare.y + backupKey.xShare.chaincode);
    (userKey.xShare.y + userKey.xShare.chaincode).should.equal(bitgoKey.xShare.y + bitgoKey.xShare.chaincode);
    commonKeychain = userKey.xShare.y + userKey.xShare.chaincode;
    const gpgKeypairPromises = [
      { name: 'user', email: 'user@bitgo.com' },
      { name: 'backup', email: 'backup@bitgo.com' },
      { name: 'bitgo', email: 'bitgo@bitgo.com' },
    ].map(async user => {
      return openpgp.generateKey({
        userIDs: [
          {
            name: user.name,
            email: user.email,
          },
        ],
      });
    });

    const gpgKeypairs = await Promise.all(gpgKeypairPromises);
    userGpgKeypair = gpgKeypairs[0];
    backupGpgKeypair = gpgKeypairs[1];
    bitgoGpgKeypair = gpgKeypairs[2];
  });

  describe('encryptNShare', function () {
    it('should encrypt n shares foreach user', async function () {
      for (let i = 2; i <= 3; i++) {
        const encryptedNShare = await ECDSAMethods.encryptNShare(userKeyShare, i, bitgoGpgKeypair.publicKey, userGpgKeypair.privateKey);
        const decryptedMessage = await readSignedMessage(encryptedNShare.encryptedPrivateShare, userGpgKeypair.publicKey, bitgoGpgKeypair.privateKey);
        decryptedMessage.should.equal(userKeyShare.nShares[i].u);
        const publicKey = userKeyShare.pShare.y + userKeyShare.pShare.chaincode + userKeyShare.pShare.n;
        encryptedNShare.i.should.equal(i);
        encryptedNShare.j.should.equal(1);
        encryptedNShare.publicShare.should.equal(publicKey);
      }
    });

    it('should error for invalid recipient', async function () {
      await encryptNShare(userKeyShare, 1, userGpgKeypair.privateKey, bitgoGpgKeypair.publicKey).should.be.rejectedWith('Invalid recipient');
      await encryptNShare(backupKeyShare, 2, userGpgKeypair.privateKey, bitgoGpgKeypair.publicKey ).should.be.rejectedWith('Invalid recipient');
      await encryptNShare(bitgoKeyShare, 3, userGpgKeypair.privateKey, bitgoGpgKeypair.publicKey ).should.be.rejectedWith('Invalid recipient');
    });
  });

  describe('createCombinedKey', function () {
    it('should create combined user key', async function () {
      const bitgoToUserShare = await encryptNShare(bitgoKeyShare, 1, userGpgKeypair.publicKey, bitgoGpgKeypair.privateKey,);
      const backupToUserShare = await encryptNShare(backupKeyShare, 1,
        userGpgKeypair.publicKey,
        backupGpgKeypair.privateKey,
      );
      const combinedUserKey = await createCombinedKey(
        userKeyShare,
        [{
          nShare: bitgoToUserShare,
          recipientPrivateArmor: userGpgKeypair.privateKey,
          senderPublicArmor: bitgoGpgKeypair.publicKey,
        }, {
          nShare: backupToUserShare,
          recipientPrivateArmor: userGpgKeypair.privateKey,
          senderPublicArmor: backupGpgKeypair.publicKey,
        }],
        commonKeychain,
      );

      combinedUserKey.commonKeychain.should.equal(commonKeychain);
      combinedUserKey.signingMaterial.pShare.should.deepEqual(userKeyShare.pShare);
      should.exist(combinedUserKey.signingMaterial.backupNShare);
      combinedUserKey.signingMaterial.backupNShare?.should.deepEqual(backupKeyShare.nShares[1]);
      combinedUserKey.signingMaterial.bitgoNShare.should.deepEqual(bitgoKeyShare.nShares[1]);
      should.not.exist(combinedUserKey.signingMaterial.userNShare);
    });

    it('should create combined backup key', async function () {
      const bitgoToBackupShare = await encryptNShare(
        bitgoKeyShare,
        2,
        backupGpgKeypair.publicKey,
        bitgoGpgKeypair.privateKey,
      );

      const userToBackupShare = await encryptNShare(
        userKeyShare,
        2,
        backupGpgKeypair.publicKey,
        userGpgKeypair.privateKey,
      );

      const combinedBackupKey = await createCombinedKey(
        backupKeyShare,
        [{
          nShare: bitgoToBackupShare,
          recipientPrivateArmor: backupGpgKeypair.privateKey,
          senderPublicArmor: bitgoGpgKeypair.publicKey,
        }, {
          nShare: userToBackupShare,
          recipientPrivateArmor: backupGpgKeypair.privateKey,
          senderPublicArmor: userGpgKeypair.publicKey,
        }],
        commonKeychain,
      );

      combinedBackupKey.commonKeychain.should.equal(commonKeychain);
      combinedBackupKey.signingMaterial.pShare.should.deepEqual(backupKeyShare.pShare);
      should.exist(combinedBackupKey.signingMaterial.userNShare);
      combinedBackupKey.signingMaterial.userNShare?.should.deepEqual(userKeyShare.nShares[2]);
      combinedBackupKey.signingMaterial.bitgoNShare.should.deepEqual(bitgoKeyShare.nShares[2]);
      should.not.exist(combinedBackupKey.signingMaterial.backupNShare);
    });

    it('should fail if common keychains do not match', async function () {
      const bitgoToUserShare = await encryptNShare(
        bitgoKeyShare,
        1,
        userGpgKeypair.publicKey,
        bitgoGpgKeypair.privateKey,
      );
      const backupToUserShare = await encryptNShare(
        backupKeyShare,
        1,
        userGpgKeypair.publicKey,
        backupGpgKeypair.privateKey,
      );

      // this should fail to combine the keys because we pass in invalid common key chain
      await createCombinedKey(
        userKeyShare,
        [{
          nShare: bitgoToUserShare,
          recipientPrivateArmor: userGpgKeypair.privateKey,
          senderPublicArmor: bitgoGpgKeypair.publicKey,
        }, {
          nShare: backupToUserShare,
          recipientPrivateArmor: userGpgKeypair.privateKey,
          senderPublicArmor: backupGpgKeypair.publicKey,
        }],
        'nottherightkeychain',
      ).should.be.rejectedWith('Common keychains do not match');
    });

    it('should fail if gpg keys are mismatched', async function () {
      const bitgoToUserShare = await encryptNShare(
        bitgoKeyShare,
        1,
        userGpgKeypair.publicKey,
        bitgoGpgKeypair.privateKey,
      );
      const backupToUserShare = await encryptNShare(
        backupKeyShare,
        1,
        userGpgKeypair.publicKey,
        backupGpgKeypair.privateKey,
      );

      await createCombinedKey(
        userKeyShare,
        [{
          nShare: bitgoToUserShare,
          recipientPrivateArmor: backupGpgKeypair.privateKey,
          senderPublicArmor: bitgoGpgKeypair.publicKey,
        }, {
          nShare: backupToUserShare,
          recipientPrivateArmor: userGpgKeypair.privateKey,
          senderPublicArmor: backupGpgKeypair.publicKey,
        }],
        'nottherightkeychain',
      ).should.be.rejectedWith('Error decrypting message: Session key decryption failed.');
    });
  });
});
