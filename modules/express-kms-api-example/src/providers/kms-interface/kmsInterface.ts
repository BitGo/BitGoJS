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

export interface KmsInterface {
  providerName: string;
  postKey(kmsKey: string, prv: string, options: any): Promise<PostKeyKmsRes | KmsErrorRes>;
  getKey(kmsKey: string, keyId: any, options: any): Promise<GetKeyKmsRes | KmsErrorRes>;
}
