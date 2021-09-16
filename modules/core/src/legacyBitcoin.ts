/**
 * This file contains a compatability layer for some deprecated types and helper methods
 *
 * @prettier
 */
import * as utxolib from '@bitgo/utxo-lib';
import * as bip32 from 'bip32';
import { sanitizeLegacyPath } from './bip32path';

interface ECPair {
  getPublicKeyBuffer(): Buffer;
}

export { makeRandomKey } from './bitcoin';

/**
 * Implementation of legacy "HDNode" class as used by certain components
 */
export class HDNode {
  constructor(private bip32: bip32.BIP32Interface) {}

  get publicKey(): Buffer {
    return this.bip32.publicKey;
  }

  get privateKey(): Buffer | undefined {
    return this.bip32.privateKey;
  }

  public static fromSeedBuffer(buf: Buffer): HDNode {
    return new HDNode(bip32.fromSeed(buf));
  }

  public static fromBase58(str: string): HDNode {
    return new HDNode(bip32.fromBase58(str));
  }

  public isNeutered(): boolean {
    return this.bip32.isNeutered();
  }

  public neutered(): HDNode {
    return new HDNode(this.bip32.neutered());
  }

  public toBase58(): string {
    return this.bip32.toBase58();
  }

  public derivePath(p: string): HDNode {
    return new HDNode(this.bip32.derivePath(sanitizeLegacyPath(p)));
  }
}

export interface Derivable {
  deriveKey(path: string): ECPair;
  derive(path: string): HDNode;
}

export function hdPath(hdNode: HDNode): Derivable {
  return {
    derive(path: string): HDNode {
      return hdNode.derivePath(path);
    },

    deriveKey(path: string): ECPair {
      const node = hdNode.derivePath(path);
      if (node.isNeutered()) {
        return utxolib.ECPair.fromPublicKeyBuffer(node.publicKey);
      } else {
        return utxolib.bitgo.keyutil.privateKeyBufferToECPair(node.privateKey);
      }
    },
  };
}

export const networks = utxolib.networks;

export const address = {
  fromBase58Check(addr: string): { hash: Buffer; version: number } {
    return utxolib.address.fromBase58Check(addr, utxolib.networks.bitcoin);
  },

  toBase58Check(hash: Buffer, version: number): string {
    return utxolib.address.toBase58Check(hash, version, utxolib.networks.bitcoin);
  },
};
