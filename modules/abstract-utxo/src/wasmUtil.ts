import { BIP32, ECPair, Psbt, descriptorWallet } from '@bitgo/wasm-utxo';
import * as utxolib from '@bitgo/utxo-lib';

export type BIP32Key = BIP32 | utxolib.BIP32Interface;
export type ECPairKey = ECPair | utxolib.ECPairInterface | Uint8Array;
export type UtxoLibPsbt = utxolib.Psbt | utxolib.bitgo.UtxoPsbt;

/**
 * Map of descriptor name to Descriptor instance.
 * Re-exported from wasm-utxo for consistency.
 */
export type DescriptorMap = descriptorWallet.DescriptorMap;

/**
 * Key type accepted by descriptorWallet.signWithKey
 */
export type SignerKey = Parameters<typeof descriptorWallet.signWithKey>[1];

/**
 * Convert a utxo-lib BIP32Interface to a wasm-utxo BIP32 instance.
 * Preserves private key by using base58 serialization.
 */
export function toWasmBIP32(key: BIP32Key): BIP32 {
  if (key instanceof BIP32) {
    return key;
  }
  // All utxo-lib BIP32Interface instances have toBase58
  return BIP32.fromBase58(key.toBase58());
}

export function toWasmECPair(key: ECPairKey): ECPair {
  if (key instanceof ECPair) {
    return key;
  }
  if (key instanceof Uint8Array) {
    return ECPair.from(key);
  }
  if (key.privateKey) {
    return ECPair.fromPrivateKey(key.privateKey);
  }
  return ECPair.fromPublicKey(key.publicKey);
}

export function isUtxoLibPsbt(psbt: unknown): psbt is UtxoLibPsbt {
  return psbt instanceof utxolib.Psbt || psbt instanceof utxolib.bitgo.UtxoPsbt;
}

export function toWasmPsbt(psbt: Psbt | UtxoLibPsbt | Uint8Array): Psbt {
  if (psbt instanceof Psbt) {
    return psbt;
  }
  if (psbt instanceof Uint8Array) {
    return Psbt.deserialize(psbt);
  }
  if (isUtxoLibPsbt(psbt)) {
    return Psbt.deserialize(psbt.toBuffer());
  }
  throw new Error('Unsupported PSBT type');
}

/**
 * Sum the `value` property of an array of objects.
 */
export function sumValues(arr: { value: bigint }[]): bigint {
  return arr.reduce((sum, e) => sum + e.value, BigInt(0));
}
