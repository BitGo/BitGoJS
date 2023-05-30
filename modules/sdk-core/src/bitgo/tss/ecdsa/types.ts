import { ECDSA } from './../../../account-lib/mpc/tss';

export type NShare = ECDSA.NShare;
export type KeyShare = ECDSA.KeyShare;
export type XShare = ECDSA.XShare;
export type XShareWithChallenges = ECDSA.XShareWithChallenges;
export type YShare = ECDSA.YShare;
export type YShareWithChallenges = ECDSA.YShareWithChallenges;
export type SignShare = ECDSA.SignShareRT;
export type KShare = ECDSA.KShare;
export type WShare = ECDSA.WShare;
export type AShare = ECDSA.AShare;
export type GShare = ECDSA.GShare;
export type OShare = ECDSA.OShare;
export type DShare = ECDSA.DShare;
export type CreateUserGammaAndMuShareRT = ECDSA.SignConvertRT;
export type CreateUserOmicronAndDeltaShareRT = ECDSA.SignCombineRT;
export type SignatureShare = ECDSA.SShare;
export type Signature = ECDSA.Signature;
export type BShare = ECDSA.BShare;
export type SShare = ECDSA.SShare;
export type KeyCombined = ECDSA.KeyCombined;

export enum SendShareType {
  KShare = 'KShare',
  MUShare = 'MUShare',
  SShare = 'SShare',
}

export enum ReceivedShareType {
  AShare = 'AShare',
  DShare = 'DShare',
  Signature = 'Signature',
}

export type GetShareFromBitgoRT = DShare | AShare;
// NShare that has been encrypted and signed via GPG
export type EncryptedNShare = {
  i: number;
  j: number;
  publicShare: string;
  // signed and encrypted gpg armor
  encryptedPrivateShare: string;
  n: string;
  vssProof?: string;
  // u value proof
  privateShareProof?: string;
};

// NShare with information needed to decrypt and verify a GPG mesasge
export type DecryptableNShare = {
  nShare: EncryptedNShare;
  recipientPrivateArmor: string;
  senderPublicArmor: string;
  isbs58Encoded?: boolean;
};

// Final TSS "Keypair"
export type CombinedKey = {
  commonKeychain: string;
  signingMaterial: SigningMaterial;
};

// Private portion of a TSS key, this must be handled like any other private key
export type SigningMaterial = {
  pShare: ECDSA.PShare;
  bitgoNShare: ECDSA.NShare;
  backupNShare?: ECDSA.NShare;
  userNShare?: ECDSA.NShare;
};

export type CreateCombinedKeyParams = {
  keyShare: ECDSA.KeyShare;
  encryptedNShares: DecryptableNShare[];
  commonKeychain: string;
};

export type SendShareToBitgoRT = AShare | DShare | SShare | Signature;
