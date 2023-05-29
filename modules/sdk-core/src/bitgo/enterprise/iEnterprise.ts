import { EcdsaTypes } from '@bitgo/sdk-lib-mpc';

import { ISettlements, IAffirmations } from '../trading';
import { IWallet } from '../wallet';
import { Buffer } from 'buffer';
import { BitGoProofSignatures } from '../utils/tss/ecdsa';

export type EnterpriseFeatureFlag = 'useEnterpriseEcdsaTssChallenge';

export type EnterpriseData = {
  id: string;
  name: string;
  featureFlags?: string[];
};

/**
 * Tss Ecdsa Challenge Verifiers
 */
export type ChallengeVerifiers = {
  verifiers: {
    adminSignature: string;
  };
};

export type UpdateTssEcdsaChallenge = {
  enterprise: EcdsaTypes.SerializedNtildeWithProofs & ChallengeVerifiers;
  bitgoNitroHsm: ChallengeVerifiers;
  bitgoInstitutionalHsm: ChallengeVerifiers;
};

export type TssEcdsaPartyChallengeConfig = {
  enterprise: EcdsaTypes.SerializedNtilde & ChallengeVerifiers;
  bitgoNitroHsm: EcdsaTypes.SerializedNtilde & ChallengeVerifiers;
  bitgoInstitutionalHsm: EcdsaTypes.SerializedNtilde & ChallengeVerifiers;
  createdBy: string;
};

export type EnterpriseTssConfig = {
  enterpriseId: string;
  ecdsa: {
    challenge: TssEcdsaPartyChallengeConfig;
  };
};

export interface IEnterprise {
  url(query?: string): string;
  coinUrl(query?: string): string;
  coinWallets(params?: Record<string, never>): Promise<IWallet[]>;
  users(params?: Record<string, never>): Promise<any>;
  getFeeAddressBalance(params?: Record<string, never>): Promise<any>;
  addUser(params?: any): Promise<any>;
  removeUser(params?: any): Promise<any>;
  getFirstPendingTransaction(params?: Record<string, never>): Promise<any>;
  settlements(): ISettlements;
  affirmations(): IAffirmations;
  verifyEcdsaBitGoChallengeProofs(userPassword: string): Promise<BitGoProofSignatures>;
  uploadAndEnableTssEcdsaSigning(
    userPassword: string,
    bitgoInstChallengeProofSignature: Buffer,
    bitgoNitroChallengeProofSignature: Buffer,
    challenge?: EcdsaTypes.DeserializedNtildeWithProofs
  ): Promise<void>;
  hasFeatureFlags(flags: EnterpriseFeatureFlag[]): boolean;
}
