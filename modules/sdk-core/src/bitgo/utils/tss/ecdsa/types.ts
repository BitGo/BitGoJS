import { ECDSA } from '../../../../account-lib/mpc/tss';
import { ECDSAMethodTypes } from '../../../tss/ecdsa';
import { BackupKeyShare, CreateKeychainParamsBase, BackupGpgKey } from '../baseTypes';
import { Key } from 'openpgp';
import { BackupProvider } from '../../../wallet';
import { Buffer } from 'buffer';

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

export type ApiNtildeProof = {
  alpha: string[];
  t: string[];
};

export type ApiChallenges = {
  enterpriseChallenge: ApiChallenge;
  bitgoChallenge: ApiChallenge;
};

export type ChallengeWithNtildeProofApi = ApiChallenge & {
  ntildeProof: {
    h1WrtH2: ApiNtildeProof;
    h2WrtH1: ApiNtildeProof;
  };
};

export type GetBitGoChallengesApi = {
  bitgoNitroHsm: ChallengeWithNtildeProofApi;
  bitgoInstitutionalHsm: ChallengeWithNtildeProofApi;
};

export type BitGoProofSignatures = {
  bitgoNitroHsmAdminSignature: Buffer;
  bitgoInstHsmAdminSignature: Buffer;
};
