import Eddsa, { KeyShare, UShare, YShare } from '@bitgo/account-lib/dist/src/mpc/tss';
import { readSignedMessage, encryptAndSignText } from './v2/internal/opengpgUtils';

// YShare that has been encrypted and signed via GPG
export type EncryptedYShare = {
  i: number
  j: number
  publicShare: string
  // signed and encrypted gpg armor
  encryptedPrivateShare: string
};

// YShare with information needed to decrypt and verify a GPG mesasge
export type DecryptableYShare = {
  yShare: EncryptedYShare
  recipientPrivateArmor: string
  senderPublicArmor: string
};

// Final TSS "Keypair"
export type CombinedKey = {
  commonKeychain: string
  signingMaterial: SigningMaterial
}

// Private portion of a TSS key, this must be handled like any other private key
export type SigningMaterial = {
  uShare: UShare;
  bitgoYShare: YShare;
  backupYShare?: YShare;
  userYShare?: YShare;
}

/**
 * Prepares a YShare to be exchanged with other key holders.
 * Output is in a format that is usable within BitGo's ecosystem.
 *
 * @param params.keyShare - TSS key share of the party preparing exchange materials
 * @param params.recipientIndex - index of the recipient (1, 2, or 3)
 * @param params.recipientGpgPublicArmor - recipient's public gpg key in armor format
 * @param params.senderGpgPrivateArmor - sender's private gpg key in armor format
 * @returns { EncryptedYShare } encrypted Y Share
 */
export async function encryptYShare(params: {
  keyShare: KeyShare,
  recipientIndex: number,
  recipientGpgPublicArmor: string,
  senderGpgPrivateArmor: string
}): Promise<EncryptedYShare> {
  const { keyShare, recipientIndex, recipientGpgPublicArmor, senderGpgPrivateArmor } = params;

  const yShare = keyShare.yShares[recipientIndex];
  if (!yShare) {
    throw new Error('Invalid recipient');
  }

  const publicShare = Buffer.concat([
    Buffer.from(keyShare.uShare.y, 'hex'),
    Buffer.from(keyShare.uShare.chaincode, 'hex'),
  ]).toString('hex');

  const privateShare = Buffer.concat([
    Buffer.from(yShare.u, 'hex'),
    Buffer.from(yShare.chaincode, 'hex'),
  ]).toString('hex');

  const encryptedPrivateShare = await encryptAndSignText(
    privateShare, recipientGpgPublicArmor, senderGpgPrivateArmor);

  return {
    i: yShare.i,
    j: yShare.j,
    publicShare,
    encryptedPrivateShare,
  };
}

/**
 * Combines YShares to combine the final TSS key
 * This can only be used to create the User or Backup key since it requires the common keychain from BitGo first
 *
 * @param params.keyShare - TSS key share
 * @param params.encryptedYShares - encrypted YShares with information on how to decrypt
 * @param params.commonKeychain - expected common keychain of the combined key
 * @returns {CombinedKey} combined TSS key
 */
export async function createCombinedKey(params: {
  keyShare: KeyShare,
  encryptedYShares: DecryptableYShare[],
  commonKeychain: string,
}): Promise<CombinedKey> {
  await Eddsa.initialize();
  const MPC = new Eddsa();

  const { keyShare, encryptedYShares, commonKeychain } = params;
  const yShares: YShare[] = [];

  let bitgoYShare: YShare | undefined;
  let userYShare: YShare | undefined;
  let backupYShare: YShare | undefined;

  for (const encryptedYShare of encryptedYShares) {
    const privateShare = await readSignedMessage(encryptedYShare.yShare.encryptedPrivateShare,
      encryptedYShare.senderPublicArmor, encryptedYShare.recipientPrivateArmor);

    const yShare: YShare = {
      i: encryptedYShare.yShare.i,
      j: encryptedYShare.yShare.j,
      y: encryptedYShare.yShare.publicShare.slice(0, 64),
      u: privateShare.slice(0, 64),
      chaincode: privateShare.slice(64),
    };

    switch (encryptedYShare.yShare.j) {
      case 1:
        userYShare = yShare;
        break;
      case 2:
        backupYShare = yShare;
        break;
      case 3:
        bitgoYShare = yShare;
        break;
      default:
        throw new Error('Invalid YShare index');
    }

    yShares.push(yShare);
  }

  const combinedKey = MPC.keyCombine(keyShare.uShare, yShares);
  if (combinedKey.pShare.y + combinedKey.pShare.chaincode !== commonKeychain) {
    throw new Error('Common keychains do not match');
  }
  if (!bitgoYShare) {
    throw new Error('Missing BitGo Y Share');
  }

  const signingMaterial: SigningMaterial = {
    uShare: keyShare.uShare,
    bitgoYShare,
    backupYShare,
    userYShare,
  };

  return {
    signingMaterial,
    commonKeychain,
  };
}
