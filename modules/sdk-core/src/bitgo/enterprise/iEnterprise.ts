import { EcdsaTypes } from '@bitgo/sdk-lib-mpc';
import { IWallet } from '../wallet';
import { Buffer } from 'buffer';
import { BitGoProofSignatures, SerializedNtildeWithVerifiers } from '../utils/tss/ecdsa';
import { EcdhDerivedKeypair } from '../keychain';

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
  verifyEcdsaBitGoChallengeProofs(userPassword: string): Promise<BitGoProofSignatures>;
  uploadAndEnableTssEcdsaSigning(
    userPassword: string,
    bitgoInstChallengeProofSignature: Buffer,
    bitgoNitroChallengeProofSignature: Buffer,
    openSSLBytes: Uint8Array,
    challenge?: EcdsaTypes.DeserializedNtildeWithProofs
  ): Promise<void>;
  getExistingTssEcdsaChallenge(): Promise<EcdsaTypes.DeserializedNtildeWithProofs>;
  resignEnterpriseChallenges(
    oldEcdhKeypair: EcdhDerivedKeypair,
    newEcdhKeypair: EcdhDerivedKeypair,
    entChallenge: SerializedNtildeWithVerifiers,
    bitgoInstChallenge: SerializedNtildeWithVerifiers,
    bitgoNitroChallenge: SerializedNtildeWithVerifiers
  ): Promise<void>;
  hasFeatureFlags(flags: EnterpriseFeatureFlag[]): boolean;
}
