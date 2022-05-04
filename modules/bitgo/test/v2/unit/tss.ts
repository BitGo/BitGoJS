import { Ed25519BIP32, Eddsa } from '@bitgo/account-lib';
import { KeyShare } from '@bitgo/account-lib/dist/src/mpc/tss';
import { encryptYShare, createCombinedKey } from '../../../src/tss';
import * as openpgp from 'openpgp';
import { readSignedMessage } from '../../../src/v2/internal/opengpgUtils';
import * as should from 'should';

describe('test tss helper functions', function () {
  let mpc: Eddsa;

  let userKeyShare: KeyShare;
  let backupKeyShare: KeyShare;
  let bitgoKeyShare: KeyShare;

  let userKey;
  let backupKey;
  let bitgoKey;

  let userGpgKeypair: { publicKey: string, privateKey: string };
  let backupGpgKeypair: { publicKey: string, privateKey: string };
  let bitgoGpgKeypair: { publicKey: string, privateKey: string };

  let commonKeychain: string;

  before(async function () {
    const hdTree = await Ed25519BIP32.initialize();
    mpc = await Eddsa.initialize(hdTree);

    userKeyShare = mpc.keyShare(1, 2, 3);
    backupKeyShare = mpc.keyShare(2, 2, 3);
    bitgoKeyShare = mpc.keyShare(3, 2, 3);

    userKey = mpc.keyCombine(userKeyShare.uShare, [backupKeyShare.yShares[1], bitgoKeyShare.yShares[1]]);
    backupKey = mpc.keyCombine(backupKeyShare.uShare, [userKeyShare.yShares[2], bitgoKeyShare.yShares[2]]);
    bitgoKey = mpc.keyCombine(bitgoKeyShare.uShare, [backupKeyShare.yShares[3], userKeyShare.yShares[3]]);

    (userKey.pShare.y + userKey.pShare.chaincode).should.equal(backupKey.pShare.y + backupKey.pShare.chaincode);
    (userKey.pShare.y + userKey.pShare.chaincode).should.equal(bitgoKey.pShare.y + bitgoKey.pShare.chaincode);
    commonKeychain = userKey.pShare.y + userKey.pShare.chaincode;

    userGpgKeypair = await openpgp.generateKey({
      userIDs: [
        {
          name: 'user',
          email: 'user@bitgo.com',
        },
      ],
    });
    backupGpgKeypair = await openpgp.generateKey({
      userIDs: [
        {
          name: 'backup',
          email: 'backup@bitgo.com',
        },
      ],
    });
    bitgoGpgKeypair = await openpgp.generateKey({
      userIDs: [
        {
          name: 'bitgo',
          email: 'bitgo@bitgo.com',
        },
      ],
    });
  });

  describe('encryptYShare', function () {
    it('should encrypt y share', async function () {
      for (let i = 2; i <= 3; i++) {
        const encryptedYShare = await encryptYShare({
          keyShare: userKeyShare,
          recipientIndex: i,
          senderGpgPrivateArmor: userGpgKeypair.privateKey,
          recipientGpgPublicArmor: bitgoGpgKeypair.publicKey,
        });

        const decryptedMessage = await readSignedMessage(encryptedYShare.encryptedPrivateShare, userGpgKeypair.publicKey, bitgoGpgKeypair.privateKey);
        decryptedMessage.should.equal(userKeyShare.yShares[i].u + userKeyShare.yShares[i].chaincode);

        encryptedYShare.i.should.equal(i);
        encryptedYShare.j.should.equal(1);
        encryptedYShare.publicShare.should.equal(userKeyShare.uShare.y + userKeyShare.uShare.chaincode);
      }
    });

    it('should error for invalid recipient index', async function () {
      await encryptYShare({
        keyShare: userKeyShare,
        recipientIndex: 1,
        senderGpgPrivateArmor: userGpgKeypair.privateKey,
        recipientGpgPublicArmor: bitgoGpgKeypair.publicKey,
      }).should.be.rejectedWith('Invalid recipient');
      await encryptYShare({
        keyShare: backupKeyShare,
        recipientIndex: 2,
        senderGpgPrivateArmor: userGpgKeypair.privateKey,
        recipientGpgPublicArmor: bitgoGpgKeypair.publicKey,
      }).should.be.rejectedWith('Invalid recipient');
      await encryptYShare({
        keyShare: bitgoKeyShare,
        recipientIndex: 3,
        senderGpgPrivateArmor: userGpgKeypair.privateKey,
        recipientGpgPublicArmor: bitgoGpgKeypair.publicKey,
      }).should.be.rejectedWith('Invalid recipient');
    });
  });

  describe('createCombinedKey', function () {
    it('should create combined user key', async function () {
      const bitgoToUserShare = await encryptYShare({
        keyShare: bitgoKeyShare,
        recipientIndex: 1,
        recipientGpgPublicArmor: userGpgKeypair.publicKey,
        senderGpgPrivateArmor: bitgoGpgKeypair.privateKey,
      });
      const backupToUserShare = await encryptYShare({
        keyShare: backupKeyShare,
        recipientIndex: 1,
        recipientGpgPublicArmor: userGpgKeypair.publicKey,
        senderGpgPrivateArmor: backupGpgKeypair.privateKey,
      });

      const combinedUserKey = await createCombinedKey({
        keyShare: userKeyShare,
        commonKeychain,
        encryptedYShares: [{
          yShare: bitgoToUserShare,
          recipientPrivateArmor: userGpgKeypair.privateKey,
          senderPublicArmor: bitgoGpgKeypair.publicKey,
        }, {
          yShare: backupToUserShare,
          recipientPrivateArmor: userGpgKeypair.privateKey,
          senderPublicArmor: backupGpgKeypair.publicKey,
        }],
      });

      combinedUserKey.commonKeychain.should.equal(commonKeychain);
      combinedUserKey.signingMaterial.uShare.should.deepEqual(userKeyShare.uShare);
      combinedUserKey.signingMaterial.backupYShare!.should.deepEqual(backupKeyShare.yShares[1]);
      combinedUserKey.signingMaterial.bitgoYShare.should.deepEqual(bitgoKeyShare.yShares[1]);
      should.not.exist(combinedUserKey.signingMaterial.userYShare);
    });

    it('should create combined backup key', async function () {
      const bitgoToBackupShare = await encryptYShare({
        keyShare: bitgoKeyShare,
        recipientIndex: 2,
        recipientGpgPublicArmor: backupGpgKeypair.publicKey,
        senderGpgPrivateArmor: bitgoGpgKeypair.privateKey,
      });
      const userToBackupShare = await encryptYShare({
        keyShare: userKeyShare,
        recipientIndex: 2,
        recipientGpgPublicArmor: backupGpgKeypair.publicKey,
        senderGpgPrivateArmor: userGpgKeypair.privateKey,
      });

      const combinedBackupKey = await createCombinedKey({
        keyShare: backupKeyShare,
        commonKeychain,
        encryptedYShares: [{
          yShare: bitgoToBackupShare,
          recipientPrivateArmor: backupGpgKeypair.privateKey,
          senderPublicArmor: bitgoGpgKeypair.publicKey,
        }, {
          yShare: userToBackupShare,
          recipientPrivateArmor: backupGpgKeypair.privateKey,
          senderPublicArmor: userGpgKeypair.publicKey,
        }],
      });

      combinedBackupKey.commonKeychain.should.equal(commonKeychain);
      combinedBackupKey.signingMaterial.uShare.should.deepEqual(backupKeyShare.uShare);
      combinedBackupKey.signingMaterial.userYShare!.should.deepEqual(userKeyShare.yShares[2]);
      combinedBackupKey.signingMaterial.bitgoYShare.should.deepEqual(bitgoKeyShare.yShares[2]);
      should.not.exist(combinedBackupKey.signingMaterial.backupYShare);
    });

    it('should fail if common keychains do not match', async function () {
      const bitgoToUserShare = await encryptYShare({
        keyShare: bitgoKeyShare,
        recipientIndex: 1,
        recipientGpgPublicArmor: userGpgKeypair.publicKey,
        senderGpgPrivateArmor: bitgoGpgKeypair.privateKey,
      });
      const backupToUserShare = await encryptYShare({
        keyShare: backupKeyShare,
        recipientIndex: 1,
        recipientGpgPublicArmor: userGpgKeypair.publicKey,
        senderGpgPrivateArmor: backupGpgKeypair.privateKey,
      });

      await createCombinedKey({
        keyShare: userKeyShare,
        commonKeychain: 'nottherightkeychain',
        encryptedYShares: [{
          yShare: bitgoToUserShare,
          recipientPrivateArmor: userGpgKeypair.privateKey,
          senderPublicArmor: bitgoGpgKeypair.publicKey,
        }, {
          yShare: backupToUserShare,
          recipientPrivateArmor: userGpgKeypair.privateKey,
          senderPublicArmor: backupGpgKeypair.publicKey,
        }],
      }).should.be.rejectedWith('Common keychains do not match');
    });

    it('should fail if gpg keys are mismatched', async function () {
      const bitgoToUserShare = await encryptYShare({
        keyShare: bitgoKeyShare,
        recipientIndex: 1,
        recipientGpgPublicArmor: userGpgKeypair.publicKey,
        senderGpgPrivateArmor: bitgoGpgKeypair.privateKey,
      });
      const backupToUserShare = await encryptYShare({
        keyShare: backupKeyShare,
        recipientIndex: 1,
        recipientGpgPublicArmor: userGpgKeypair.publicKey,
        senderGpgPrivateArmor: backupGpgKeypair.privateKey,
      });

      await createCombinedKey({
        keyShare: userKeyShare,
        commonKeychain: 'nottherightkeychain',
        encryptedYShares: [{
          yShare: bitgoToUserShare,
          recipientPrivateArmor: backupGpgKeypair.privateKey,
          senderPublicArmor: bitgoGpgKeypair.publicKey,
        }, {
          yShare: backupToUserShare,
          recipientPrivateArmor: userGpgKeypair.privateKey,
          senderPublicArmor: backupGpgKeypair.publicKey,
        }],
      }).should.be.rejectedWith('Error decrypting message: Session key decryption failed.');
    });
  });
});
