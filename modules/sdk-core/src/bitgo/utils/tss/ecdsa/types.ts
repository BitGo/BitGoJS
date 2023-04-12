import { ECDSA } from '../../../../account-lib/mpc/tss';
import { ECDSAMethodTypes } from '../../../tss/ecdsa';
import { BackupKeyShare, CreateKeychainParamsBase, BackupGpgKey } from '../baseTypes';
import { Key } from 'openpgp';
import { BackupProvider } from '../../../wallet';
import { NTilde } from '../../../../account-lib/mpc/tss/ecdsa/types';

export type KeyShare = ECDSA.KeyShare;
export type DecryptableNShare = ECDSAMethodTypes.DecryptableNShare;

export type CreateEcdsaKeychainParams = CreateKeychainParamsBase & {
  userKeyShare: ECDSA.KeyShare;
  backupKeyShare: BackupKeyShare;
  isThirdPartyBackup?: boolean;
  backupProvider?: BackupProvider;
  bitgoPublicGpgKey: Key;
  backupGpgKey: BackupGpgKey;
};

export type CreateEcdsaBitGoKeychainParams = Omit<CreateEcdsaKeychainParams, 'bitgoKeychain'>;

export type ApiChallenge = {
  ntilde: string;
  h1: string;
  h2: string;
};

export type ApiNTildeProof = {
  alpha: string[];
  t: string[];
};

export type ApiChallenges = {
  enterpriseChallenge: ApiChallenge;
  bitGoChallenge: ApiChallenge;
};

export type ChallengeWithNTildeProofApi = ApiChallenge & {
  ntildeProof: {
    h1WrtH2: ApiNTildeProof;
    h2WrtH1: ApiNTildeProof;
  };
};

export type GetBitGoChallengesApi = {
  bitgoNitroHsm: ChallengeWithNTildeProofApi;
  bitgoInstitutionalHsm: ChallengeWithNTildeProofApi;
};

export type SignedEnterpriseChallengeWithProof = {
  challengeWithProof: NTilde;
  adminSignature: Buffer;
};
