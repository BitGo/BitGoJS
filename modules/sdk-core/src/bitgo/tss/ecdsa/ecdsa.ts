import { ECDSA, Ecdsa } from './../../../account-lib/mpc/tss';
import { DecryptableNShare, CombinedKey, SigningMaterial, EncryptedNShare } from './types';
import { encryptAndSignText, readSignedMessage } from './../../utils';

type NShare = ECDSA.NShare;
type KeyShare = ECDSA.KeyShare;
/**
 * Combines NShares to combine the final TSS key
 * This can only be used to create the User or Backup key since it requires the common keychain from BitGo first
 *
 * @param params.keyShare - TSS key share
 * @param params.encryptedNShares - encrypted NShares with information on how to decrypt
 * @param params.commonKeychain - expected common keychain of the combined key
 * @returns {CombinedKey} combined TSS key
 */
export async function createCombinedKey(params: {
  keyShare: KeyShare;
  encryptedNShares: DecryptableNShare[];
  commonKeychain: string;
}): Promise<CombinedKey> {
  const MPC = new Ecdsa();

  const { keyShare, encryptedNShares, commonKeychain } = params;
  const nShares: NShare[] = [];

  let bitgoNShare: NShare | undefined;
  let userNShare: NShare | undefined;
  let backupNShare: NShare | undefined;

  for (const encryptedNShare of encryptedNShares) {
    const privateShare = await readSignedMessage(
      encryptedNShare.nShare.encryptedPrivateShare,
      encryptedNShare.senderPublicArmor,
      encryptedNShare.recipientPrivateArmor
    );

    const nShare: NShare = {
      i: encryptedNShare.nShare.i,
      j: encryptedNShare.nShare.j,
      y: encryptedNShare.nShare.publicShare,
      u: privateShare,
      n: encryptedNShare.nShare.n,
      chaincode: encryptedNShare.nShare.chaincode,
    };

    switch (encryptedNShare.nShare.j) {
      case 1:
        userNShare = nShare;
        break;
      case 2:
        backupNShare = nShare;
        break;
      case 3:
        bitgoNShare = nShare;
        break;
      default:
        throw new Error('Invalid NShare index');
    }

    nShares.push(nShare);
  }

  if (!bitgoNShare) {
    throw new Error('Missing BitGo N Share');
  }

  const combinedKey = MPC.keyCombine(keyShare.pShare, nShares);
  if (combinedKey.xShare.y + combinedKey.xShare.chaincode !== commonKeychain) {
    throw new Error('Common keychains do not match');
  }

  const signingMaterial: SigningMaterial = {
    pShare: keyShare.pShare,
    bitgoNShare,
    backupNShare,
    userNShare,
  };

  return {
    signingMaterial,
    commonKeychain,
  };
}

/**
 * Prepares a NShare to be exchanged with other key holders.
 * Output is in a format that is usable within BitGo's ecosystem.
 *
 * @param params.keyShare - TSS key share of the party preparing exchange materials
 * @param params.recipientIndex - index of the recipient (1, 2, or 3)
 * @param params.recipientGpgPublicArmor - recipient's public gpg key in armor format
 * @param params.senderGpgPrivateArmor - sender's private gpg key in armor format
 * @returns { EncryptedNShare } encrypted Y Share
 */
export async function encryptNShare(params: {
  keyShare: KeyShare;
  recipientIndex: number;
  recipientGpgPublicArmor: string;
  senderGpgPrivateArmor: string;
}): Promise<EncryptedNShare> {
  const { keyShare, recipientIndex, recipientGpgPublicArmor, senderGpgPrivateArmor } = params;

  const nShare = keyShare.nShares[recipientIndex];
  if (!nShare) {
    throw new Error('Invalid recipient');
  }

  const publicShare = keyShare.pShare.y;
  const privateShare = nShare.u;

  const encryptedPrivateShare = await encryptAndSignText(privateShare, recipientGpgPublicArmor, senderGpgPrivateArmor);

  return {
    i: nShare.i,
    j: nShare.j,
    n: nShare.n,
    publicShare,
    encryptedPrivateShare,
    chaincode: nShare.chaincode,
  };
}
