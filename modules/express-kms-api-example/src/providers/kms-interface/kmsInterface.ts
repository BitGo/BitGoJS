import { EncryptParameters } from '@azure/keyvault-keys';

export type KmsErrorRes = {
  message: string;
  code: number;
  data?: any;
};

export type PostKeyKmsRes = {
  encryptedPrv: string; // TODO: should this be an any?
  topLevelKeyId?: any;
  metadata?: any;
};

export type GetKeyKmsRes = {
  prv: string;
};

export type ProviderNames = 'aws' | 'azure';

export interface KmsInterface<KmsClient, CryptoClient> {
  providerName: ProviderNames;
  keyClient: KmsClient; // Max: replacing kms with keyClient as in aws seems that you could do all ops from one class
  cryptoClient: CryptoClient | undefined; //      but in Azure you need the keyClient to connect and the cryptoClient to operate
  kmsKey: string; // TODO: should we store the kms key in database? it seems stupid to store it in memory
  postKey(prv: string): Promise<PostKeyKmsRes | KmsErrorRes>;
  getKey(keyId: any): Promise<GetKeyKmsRes | KmsErrorRes>;
}

// TODO: maybe move this type to somewhere else to avoid importing the keyvault-keys lib here
export type KmsEncryptRequest =
  | {
      provider: 'aws';
      KeyId: string;
      Plaintext: Buffer<any>;
    }
  | { provider: 'azure'; algorithm: EncryptParameters['algorithm']; plaintext: Buffer<any> };
