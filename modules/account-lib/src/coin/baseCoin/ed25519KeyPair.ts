import { BaseKeyPair } from './baseKeyPair';
import { AddressFormat } from './enum';
import { NotImplementedError } from './errors';

export abstract class Ed25519KeyPair implements BaseKeyPair {
  getAddress(format?: AddressFormat): string {
    throw new NotImplementedError('getAddress not implemented');
  }

  getKeys(): any {
    // TODO: implement from stellar seed, etc.
    throw new NotImplementedError('getKeys not implemented');
  }

  recordKeysFromPrivateKey(prv: string): void {
    throw new NotImplementedError('recordKeysFromPrivateKey not implemented');
  }

  recordKeysFromPublicKey(pub: string): void {
    throw new NotImplementedError('recordKeysFromPublicKey not implemented');
  }
}
