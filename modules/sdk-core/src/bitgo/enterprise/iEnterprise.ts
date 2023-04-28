import { ISettlements, IAffirmations } from '../trading';
import { IWallet } from '../wallet';
import { Buffer } from 'buffer';
import { BitGoProofSignatures } from '../utils/tss/ecdsa';
import { DeserializedNtilde } from '../../account-lib/mpc/tss/ecdsa/types';

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
    challenge?: DeserializedNtilde
  ): Promise<void>;
  getExistingTssEcdsaChallenge(): Promise<DeserializedNtilde>;
}
