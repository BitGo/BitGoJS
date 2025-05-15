export type kmsErrorRes = {
    message: string,
    code: number,
    data?: any
}

export type postKeyKmsRes = { 
    bitgoKeyId: string,                  // TODO: should this be an any?
    topLevelKeyId?: any, 
    metadata?: any
};

export type getKeyKmsRes = {
    prv: string,
}

export abstract class kmsInterface<kmsClient> {
    abstract providerName: string;
    abstract kms: kmsClient;
    abstract kmsKey: string;        // TODO: should we store the kms key in database? it seems stupid to store it in memory

    constructor() {}

    abstract postKey(prv: string): Promise<postKeyKmsRes | kmsErrorRes>;
    abstract getKey(keyId: any): Promise<getKeyKmsRes | kmsErrorRes>;
}
