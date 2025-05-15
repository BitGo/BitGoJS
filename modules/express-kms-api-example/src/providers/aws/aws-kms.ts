import { getKeyKmsRes, kmsErrorRes, kmsInterface, postKeyKmsRes } from "../kms-interface/kmsInterface";
import * as awskms from '@aws-sdk/client-kms'

export class awsKmsProvider implements kmsInterface<awskms.KMSClient> {
    providerName: string = "aws";
    kms: awskms.KMSClient = new awskms.KMSClient();
    kmsKey: string = "";

    errorHandler(err: any) { switch(err.constructor) {
        case awskms.DependencyTimeoutException: {
            return { message: "KMS server timesout", code: 500 }
        }
        case awskms.InvalidKeyUsageException: {
            return { message: "KMS key is not configured to encrypt data. Check if KMS key is setup properly on aws", code: 400 }
        }
        case awskms.KeyUnavailableException: {
            return { message: "KMS key not avaliable. Check if KMS key is setup properly on aws", code: 500 }
        }
        case awskms.KMSInternalException: {
            return { message: "KMS Internal error occurs", code: 500 }
        }
        case awskms.NotFoundException: {
            return { message: "Resource not found", code: 400 }
        }
        default:
            return { message: "Unknown error occurs", code: 500 }
    }}

    postKey(prv: string): Promise<postKeyKmsRes | kmsErrorRes> {
        const input: awskms.EncryptRequest = {
            KeyId: this.kmsKey,
            Plaintext: Buffer.from(prv)
        }
        const command = new awskms.EncryptCommand(input);

        return this.kms.send(command)
        .then(res => {
            if (res.CiphertextBlob === undefined) throw 1;   // TODO: more proper handling
            return {
                bitgoKeyId: res.CiphertextBlob?.toString(),  // TODO: should we store this as a string?
                topLevelKeyId: res.KeyId,
                metadata: res.$metadata
            }
        }).catch(this.errorHandler);
    }

    getKey(keyId: string): Promise<getKeyKmsRes | kmsErrorRes> {
        const input: awskms.DecryptRequest = {
            CiphertextBlob: Buffer.from(keyId),
            KeyId: this.kmsKey,
        }
        const command = new awskms.DecryptCommand(input);

        return this.kms.send(command)
        .then(res => {
            if (res.Plaintext === undefined) throw 1;
            return {
                prv: res.Plaintext?.toString()
            }
        }).catch(this.errorHandler);
    }
}
