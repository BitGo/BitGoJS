import * as awskms from '@aws-sdk/client-kms';
import { GetKeyKmsRes, KmsErrorRes, KmsInterface, PostKeyKmsRes, ProviderNames } from '../kms-interface/kmsInterface';

export class AwsKmsProvider implements KmsInterface<awskms.KMSClient, undefined> {
  providerName: ProviderNames = 'aws';
  cryptoClient = undefined;
  keyClient: awskms.KMSClient = new awskms.KMSClient();
  kmsKey = '';

  errorHandler(err: any): KmsErrorRes {
    switch (err.constructor) {
      case awskms.DependencyTimeoutException: {
        return { message: 'KMS server timesout', code: 500 };
      }
      case awskms.InvalidKeyUsageException: {
        return {
          message: 'KMS key is not configured to encrypt data. Check if KMS key is setup properly on aws',
          code: 400,
        };
      }
      case awskms.KeyUnavailableException: {
        return { message: 'KMS key not avaliable. Check if KMS key is setup properly on aws', code: 500 };
      }
      case awskms.KMSInternalException: {
        return { message: 'KMS Internal error occurs', code: 500 };
      }
      case awskms.NotFoundException: {
        return { message: 'Resource not found', code: 400 };
      }
      default:
        return { message: 'Unknown error occurs', code: 500 };
    }
  }

  async postKey(prv: string): Promise<PostKeyKmsRes | KmsErrorRes> {
    const input: awskms.EncryptRequest = {
      KeyId: this.kmsKey,
      Plaintext: Buffer.from(prv),
    };
    const command = new awskms.EncryptCommand(input);

    try {
      const res = await this.keyClient.send(command);
      if (res.CiphertextBlob === undefined) throw 1; // TODO: more proper handling
      return {
        encryptedPrv: res.CiphertextBlob?.toString(), // TODO: should we store this as a string?
        topLevelKeyId: res.KeyId,
        metadata: res.$metadata,
      };
    } catch (err) {
      return this.errorHandler(err);
    }
  }

  async getKey(keyId: string): Promise<GetKeyKmsRes | KmsErrorRes> {
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
}
