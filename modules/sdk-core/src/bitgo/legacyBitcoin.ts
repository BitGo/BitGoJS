import * as utxolib from '@bitgo/utxo-lib';
import { bip32, BIP32Interface, ECPairInterface } from '@bitgo/utxo-lib';
import { sanitizeLegacyPath } from '../api';
import * as bitcoinUtil from './bitcoin';

interface ECPairCompat extends ECPairInterface {
  getPublicKeyBuffer(): Buffer;
}

function createECPairCompat(ecPair: ECPairInterface): ECPairCompat {
  return Object.assign(ecPair, {
    getPublicKeyBuffer(): Buffer {
      return ecPair.publicKey;
    },
  });
}

export function makeRandomKey(): ECPairCompat {
  return createECPairCompat(bitcoinUtil.makeRandomKey());
}

/**
 * Implementation of legacy "HDNode" class as used by certain components
 */
export class HDNode {
  constructor(private bip32: BIP32Interface) {}

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
  deriveKey(path: string): ECPairCompat;
  derive(path: string): HDNode;
}

export function hdPath(hdNode: HDNode): Derivable {
  return {
    derive(path: string): HDNode {
      return hdNode.derivePath(path);
    },

    deriveKey(path: string): ECPairCompat {
      const node = hdNode.derivePath(path);
      if (node.privateKey) {
        return createECPairCompat(utxolib.ECPair.fromPrivateKey(node.privateKey));
      } else {
        return createECPairCompat(utxolib.ECPair.fromPublicKey(node.publicKey));
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
