import {
  IKeychains,
  CreateBitGoOptions,
  CreateBackupOptions,
  KeyPair,
  AddKeychainOptions,
  Keychain,
  GetKeysForSigningOptions,
  ListKeychainsResult,
  ChangedKeychains,
  UpdateSingleKeychainPasswordOptions,
  UpdatePasswordOptions,
  ListKeychainOptions,
  GetKeychainOptions,
  CreateMpcOptions,
  KeychainsTriplet,
  BitGoBase,
} from '@bitgo/sdk-core';

export class UnifiedWalletKeychains implements IKeychains {
  private readonly bitgo: BitGoBase;

  constructor(bitgo: BitGoBase) {
    this.bitgo = bitgo;
  }

  add(params?: AddKeychainOptions): Promise<Keychain> {
    throw new Error('Not implemented');
  }

  create(params?: { seed?: Buffer }): KeyPair {
    throw new Error('Not implemented');
  }

  createBackup(params?: CreateBackupOptions): Promise<Keychain> {
    throw new Error('Not implemented');
  }

  createBitGo(params?: CreateBitGoOptions): Promise<Keychain> {
    throw new Error('Not implemented');
  }

  // TODO (BG-66142): complete implementation and create EVMTSSUtils helper class
  createMpc(params: CreateMpcOptions): Promise<KeychainsTriplet> {
    throw new Error('Not implemented');
  }

  get(params: GetKeychainOptions): Promise<Keychain> {
    throw new Error('Not  implemented');
  }

  getKeysForSigning(params?: GetKeysForSigningOptions): Promise<Keychain[]> {
    throw new Error('Not implemented');
  }

  list(params?: ListKeychainOptions): Promise<ListKeychainsResult> {
    throw new Error('Not implemented');
  }

  updatePassword(params: UpdatePasswordOptions): Promise<ChangedKeychains> {
    throw new Error('Not implemented');
  }

  updateSingleKeychainPassword(params?: UpdateSingleKeychainPasswordOptions): Keychain {
    throw new Error('Not implemented');
  }
}
