import { ChainedTokenCredential, DefaultAzureCredential } from '@azure/identity';
import azureKMS, { EncryptParameters } from '@azure/keyvault-keys';
import { GetKeyKmsRes, KmsErrorRes, KmsInterface, PostKeyKmsRes } from '../kms-interface/kmsInterface';

type AzureKmsProviderConstructorProps = {
  keyVaultName: string;
  kmsKey: string;
  encryptionAlgorithm: EncryptParameters['algorithm']; // RSA1_5 | A256GCM | etc
};

export class AzureKmsProvider implements KmsInterface {
  providerName = 'azure';
  vaultUrl = '';
  credentials: ChainedTokenCredential = new DefaultAzureCredential();
  encryptionAlgorithm: EncryptParameters['algorithm'] | undefined; // RSA1_5 | A256GCM | etc
  keyClient!: azureKMS.KeyClient;

  constructor({ keyVaultName, encryptionAlgorithm }: AzureKmsProviderConstructorProps) {
    this.vaultUrl = `https://${keyVaultName}.vault.azure.net`;
    this.keyClient = new azureKMS.KeyClient(this.vaultUrl, this.credentials);
    this.encryptionAlgorithm = encryptionAlgorithm;
  }

  async postKey(kmsKey: string, prv: string, options: any): Promise<PostKeyKmsRes | KmsErrorRes> {
    const keyVaultKey = await this.keyClient.getKey(kmsKey);
    const clientSDK = new azureKMS.CryptographyClient(keyVaultKey, this.credentials);

    if (this.encryptionAlgorithm === undefined) {
      return this.errorHandler(Error('On postKey-Azure: Encryption algorithm is not defined'));
    }

    const input = {
      algorithm: this.encryptionAlgorithm,
      plaintext: Buffer.from(prv),
    };

    try {
      const resp = await clientSDK.encrypt(input);
      return {
        topLevelKeyId: resp.keyID,
        encryptedPrv: resp.result.toString(),
        metadata: { provider: this.providerName, algorithm: input.algorithm },
      };
    } catch (err) {
      return this.errorHandler(err);
    }
  }

  async getKey(kmsKey: string, keyId: string, options: any): Promise<GetKeyKmsRes | KmsErrorRes> {
    // TODO: Azure implementation
    const keyVaultKey = await this.keyClient.getKey(kmsKey);
    const clientSDK = new azureKMS.CryptographyClient(keyVaultKey, this.credentials);

    try {
      const res = await clientSDK.decrypt({
        ciphertext: Buffer.from(keyId),
        algorithm: 'RSA1_5', // TODO: algorithm hardcoded for now as other variants requires an iv parameter that i need to investigate
      });
      if (res.result === undefined) throw 1;
      return {
        prv: res.result.toString(),
      };
    } catch (err) {
      return this.errorHandler(err);
    }
  }

  errorHandler(err: any): KmsErrorRes {
    //TODO: I was looking for some instance that contains the error codes but couldn't find it
    //      so for now i'm returning a generic error msg
    return { message: err.message, code: 500 };
  }
}
