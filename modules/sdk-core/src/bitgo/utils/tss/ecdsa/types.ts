import { Key } from 'openpgp';

import { EcdsaTypes } from '@bitgo/sdk-lib-mpc';

import { ECDSA } from '../../../../account-lib/mpc/tss';
import { ECDSAMethodTypes } from '../../../tss/ecdsa';
import { BackupKeyShare, CreateKeychainParamsBase, BackupGpgKey } from '../baseTypes';
import { BackupProvider } from '../../../wallet';

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

export type GetBitGoChallengesApi = {
  bitgoNitroHsm: EcdsaTypes.SerializedNtildeWithProofs;
  bitgoInstitutionalHsm: EcdsaTypes.SerializedNtildeWithProofs;
};

export type BitGoProofSignatures = {
  bitgoNitroHsmAdminSignature: Buffer;
  bitgoInstHsmAdminSignature: Buffer;
};

interface NtildeVerifiers {
  adminSignature: string;
  bitgoNitroHsmSignature?: string;
  bitgoInstitutionalHsmSignature?: string;
}

export type SerializedNtildeWithVerifiers = EcdsaTypes.SerializedNtilde & {
  verifiers: NtildeVerifiers;
};
