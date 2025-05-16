import * as awskms from '@aws-sdk/client-kms';
import { ChainedTokenCredential, DefaultAzureCredential } from '@azure/identity';
import azureKMS, { EncryptParameters } from '@azure/keyvault-keys';
import { GetKeyKmsRes, KmsEncryptRequest, KmsErrorRes, ProviderNames } from '../kms-interface/kmsInterface';

type AzureKmsProviderConstructorProps = {
  keyVaultName: string;
  kmsKey: string;
  encryptionAlgorithm: EncryptParameters['algorithm']; // RSA1_5 | A256GCM | etc
};

export class AzureKmsProvider implements KmsInterface<azureKMS.KeyClient, azureKMS.CryptographyClient> {
  providerName: ProviderNames = 'azure';
  kmsKey = '';
  vaultUrl = '';
  credentials: ChainedTokenCredential = new DefaultAzureCredential();
  encryptionAlgorithm: EncryptParameters['algorithm'] | undefined; // RSA1_5 | A256GCM | etc
  keyClient!: azureKMS.KeyClient;

  constructor({ keyVaultName, kmsKey, encryptionAlgorithm }: AzureKmsProviderConstructorProps) {
    this.vaultUrl = `https://${keyVaultName}.vault.azure.net`;
    this.keyClient = new azureKMS.KeyClient(this.vaultUrl, this.credentials);
    this.kmsKey = kmsKey;
    this.encryptionAlgorithm = encryptionAlgorithm;
  }

  async postKey(prv: string): Promise<PostKeyKmsRes | KmsErrorRes> {
    if (this.providerName !== 'azure') {
      throw new Error('On postKey-Azure: Provider name is not azure');
    }

    const keyVaultKey = await this.keyClient.getKey(this.kmsKey);
    const clientSDK = new azureKMS.CryptographyClient(keyVaultKey, this.credentials);

    if (this.encryptionAlgorithm === undefined) {
      throw new Error('On postKey-Azure: Encryption algorithm is not defined');
    }

    const input: KmsEncryptRequest = {
      provider: 'azure', // I need to pass the provider name directly or add a guard
      algorithm: this.encryptionAlgorithm,
      plaintext: Buffer.from(prv),
    };

    try {
      const resp = await clientSDK.encrypt({ algorithm: input.algorithm, plaintext: input.plaintext });
      return {
        topLevelKeyId: resp.keyID,
        encryptedPrv: resp.result.toString(),
        metadata: { provider: this.providerName, algorithm: input.algorithm },
      };
    } catch (err) {
      return this.errorHandler(err);
    }
  }

  getKey(keyId: string): Promise<GetKeyKmsRes | KmsErrorRes> {
    // TODO: Azure implementation
    const input: awskms.DecryptRequest = {
      CiphertextBlob: Buffer.from(keyId),
      KeyId: this.kmsKey,
    };
    const command = new awskms.DecryptCommand(input);

    try {
      const res = await this.keyClient.send(command);
      if (res.Plaintext === undefined) throw 1;
      return {
        prv: res.Plaintext?.toString(),
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
