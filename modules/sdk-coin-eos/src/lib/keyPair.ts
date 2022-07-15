import {
  AddressFormat,
  BaseKeyPair,
  BlsKeyPair,
  DefaultKeys,
  Ed25519KeyPair,
  Secp256k1ExtendedKeyPair,
} from '@bitgo/sdk-core';

export class KeyPair implements BaseKeyPair {
  recordKeysFromPrivateKey(prv: string): void {
    throw new Error('Method not implemented.');
  }
  recordKeysFromPublicKey(pub: string): void {
    throw new Error('Method not implemented.');
  }
  getKeys() {
    throw new Error('Method not implemented.');
  }
  getAddress(format?: AddressFormat): string {
    throw new Error('Method not implemented.');
  }
}

export class KeyPair1 extends BlsKeyPair {}

export class KeyPair2 extends Ed25519KeyPair {
  recordKeysFromPrivateKeyInProtocolFormat(prv: string): DefaultKeys {
    throw new Error('Method not implemented.');
  }
  recordKeysFromPublicKeyInProtocolFormat(pub: string): DefaultKeys {
    throw new Error('Method not implemented.');
  }
  getAddress(format?: AddressFormat): string {
    throw new Error('Method not implemented.');
  }
  getKeys() {
    throw new Error('Method not implemented.');
  }
}

export class KeyPair3 extends Secp256k1ExtendedKeyPair {}
