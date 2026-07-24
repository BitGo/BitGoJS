import { IEnterprise } from './iEnterprise';
import { EcdhDerivedKeypair } from '../keychain';

export interface GetEnterpriseOptions {
  id?: string;
}

export interface IEnterprises {
  list(params?: Record<string, never>): Promise<IEnterprise[]>;
  get(params?: GetEnterpriseOptions): Promise<IEnterprise>;
  create(params?: any): Promise<IEnterprise>;
  resignTssConfigsForEnterprises(oldEcdhKeypair: EcdhDerivedKeypair, newEcdhKeypair: EcdhDerivedKeypair): Promise<void>;
}
