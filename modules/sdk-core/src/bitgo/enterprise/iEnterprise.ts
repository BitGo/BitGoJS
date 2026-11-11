import { EcdsaTypes } from '@bitgo/sdk-lib-mpc';
import { IWallet } from '../wallet';
import { Buffer } from 'buffer';
import { BitGoProofSignatures, SerializedNtildeWithVerifiers } from '../utils/tss/ecdsa';
import { EcdhDerivedKeypair } from '../keychain';
import { ISafes } from '../safe';

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
    openSSLBytes: Uint8Array
  ): Promise<void>;
  /**
   * @deprecated Passing `challenge` signs it without provenance verification. Omit it to generate a fresh
   * challenge locally, or use resignTssEcdsaChallenge to re-sign the enterprise's existing challenge.
   */
  uploadAndEnableTssEcdsaSigning(
    userPassword: string,
    bitgoInstChallengeProofSignature: Buffer,
    bitgoNitroChallengeProofSignature: Buffer,
    openSSLBytes: Uint8Array,
    challenge?: EcdsaTypes.DeserializedNtildeWithProofs
  ): Promise<void>;
  /** @deprecated Use resignTssEcdsaChallenge. Returns an unverified challenge. */
  getExistingTssEcdsaChallenge(): Promise<EcdsaTypes.DeserializedNtildeWithProofs>;
  resignTssEcdsaChallenge(userPassword: string): Promise<void>;
  resignEnterpriseChallenges(
    oldEcdhKeypair: EcdhDerivedKeypair,
    newEcdhKeypair: EcdhDerivedKeypair,
    entChallenge: SerializedNtildeWithVerifiers,
    bitgoInstChallenge: SerializedNtildeWithVerifiers,
    bitgoNitroChallenge: SerializedNtildeWithVerifiers
  ): Promise<void>;
  hasFeatureFlags(flags: EnterpriseFeatureFlag[]): boolean;
  /** @experimental */
  safes(): ISafes;
}
