import { CreateKmsKeyKmsRes, GetKeyKmsRes, KmsErrorRes, KmsInterface, PostKeyKmsRes } from "../kms-interface/kmsInterface";

export class mockKmsProvider implements KmsInterface {
    providerName: string = "mock";
    
    async postKey(kmsKey: string, prv: string, options: any): Promise<PostKeyKmsRes | KmsErrorRes> {
        const mockOutput = {
            encryptedPrv: "none shall pass",
            topLevelKeyId: 0
        }

        return mockOutput;
    }

    async getKey(kmsKey: string, keyId: string, options: any): Promise<GetKeyKmsRes | KmsErrorRes> {
        const mockOutput = {
            prv: "this is not a correct private key"
        }

        return mockOutput;
    }

    async createKmsKey(options: any): Promise<CreateKmsKeyKmsRes | KmsErrorRes> {
        const mockOutput = {
            kmsKey: "super secure skeleton"
        }

        return mockOutput;
    }
}
