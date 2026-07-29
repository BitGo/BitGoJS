import { EcdsaTypes } from '@bitgo/sdk-lib-mpc';
import { KShare, OShare, WShare } from './ecdsa/types';
import { MuDShare } from './ecdsa/ecdsa';

export enum ShareKeyPosition {
  USER = 1,
  BACKUP = 2,
  BITGO = 3,
}

export type TxRequestChallengeResponse = EcdsaTypes.SerializedEcdsaChallenges & {
  n: string;
};

export type TssEcdsaStep1ReturnMessage = {
  privateShareProof: string;
  vssProof?: string;
  userPublicGpgKey: string;
  publicShare: string;
  encryptedSignerOffsetShare: string;
  kShare: KShare;
  // wShare could be encrypted. If it is encrypted, it will be a string, otherwise it will be a WShare.
  wShare: WShare | string;
};

export type TssEcdsaStep2ReturnMessage = {
  muDShare: MuDShare;
  // oShare could be encrypted. If it is encrypted, it will be a string, otherwise it will be an OShare.
  oShare: OShare | string;
};
