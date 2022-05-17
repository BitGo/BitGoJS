interface PrivateKeychain {
  pk: bigint;
  sk: bigint;
  prefix: bigint;
  chaincode: bigint;
}

export interface PublicKeychain {
  pk: bigint;
  chaincode: bigint;
}

export interface HDTree {
  publicDerive(keychain: PublicKeychain, path: string): PublicKeychain;

  privateDerive(keychain: PrivateKeychain, path: string): PrivateKeychain;
}
