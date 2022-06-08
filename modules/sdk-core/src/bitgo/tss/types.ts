import { UShare, YShare } from './../../account-lib/mpc/tss';

// YShare that has been encrypted and signed via GPG
export type EncryptedYShare = {
  i: number;
  j: number;
  publicShare: string;
  encryptedPrivateShare: string;
  privateShareSignature: string;
};

// YShare with information needed to decrypt and verify a GPG mesasge
export type DecryptableYShare = {
  yShare: EncryptedYShare;
  recipientPrivateArmor: string;
  senderPublicArmor: string;
};

// Final TSS "Keypair"
export type CombinedKey = {
  commonKeychain: string;
  signingMaterial: SigningMaterial;
};

// Private portion of a TSS key, this must be handled like any other private key
export type SigningMaterial = {
  uShare: UShare;
  bitgoYShare: YShare;
  backupYShare?: YShare;
  userYShare?: YShare;
};

export enum ShareKeyPosition {
  USER = 1,
  BACKUP = 2,
  BITGO = 3,
}
