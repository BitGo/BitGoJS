import * as awskms from '@aws-sdk/client-kms';
import {
  CreateKmsKeyKmsRes,
  GetKeyKmsRes,
  KmsErrorRes,
  KmsInterface,
  PostKeyKmsRes,
} from '../kms-interface/kmsInterface';

export class AwsKmsProvider implements KmsInterface {
  providerName = 'aws';
  kms: awskms.KMSClient = new awskms.KMSClient();

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

  async postKey(kmsKey: string, prv: string, options: any): Promise<PostKeyKmsRes | KmsErrorRes> {
    const input: awskms.EncryptRequest = {
      KeyId: kmsKey,
      Plaintext: Buffer.from(prv),
    };
    const command = new awskms.EncryptCommand(input);

    try {
      const res = await this.kms.send(command);
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

  async getKey(kmsKey: string, keyId: string, options: any): Promise<GetKeyKmsRes | KmsErrorRes> {
    const input: awskms.DecryptRequest = {
      CiphertextBlob: Buffer.from(keyId),
      KeyId: kmsKey,
    };
    const command = new awskms.DecryptCommand(input);

    let res;
    try {
      res = await this.kms.send(command);
      if (res.Plaintext === undefined) throw 1;
    } catch (err) {
      return this.errorHandler(err);
    }

    return {
      prv: res.Plaintext?.toString(),
    };
  }

  async createKmsKey(options: any): Promise<CreateKmsKeyKmsRes | KmsErrorRes> {
    const input: awskms.CreateKeyRequest = {};
    const command = new awskms.CreateKeyCommand(input);

    let res;
    try {
      res = await this.kms.send(command);
      if (res.KeyMetadata === undefined || res.KeyMetadata.Arn === undefined) throw 1;
    } catch (err) {
      return this.errorHandler(err);
    }

    return {
      kmsKey: res.KeyMetadata?.Arn as string,
    };
  }
}
