import { EcdsaTypes } from '@bitgo/sdk-lib-mpc';

import { ISettlements, IAffirmations } from '../trading';
import { IWallet } from '../wallet';
import { Buffer } from 'buffer';
import { BitGoProofSignatures } from '../utils/tss/ecdsa';

// useEnterpriseEcdsaTssChallenge is deprecated
export type EnterpriseFeatureFlag = 'useEnterpriseEcdsaTssChallenge';

export interface EnterpriseData {
  id: string;
  name: string;
  featureFlags?: string[];
}

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
  getExistingTssEcdsaChallenge(): Promise<EcdsaTypes.DeserializedNtildeWithProofs>;
  hasFeatureFlags(flags: EnterpriseFeatureFlag[]): boolean;
}
