import type { bip32, Descriptor, descriptorWallet, Psbt } from '@bitgo/wasm-utxo';

/** The user, backup and BitGo keys of a wallet. */
export type WalletKeyTriple = [bip32.BIP32Interface, bip32.BIP32Interface, bip32.BIP32Interface];

/**
 * A special-purpose descriptor (for example a staking lockup) that a descriptor wallet can hold next to its
 * regular wallet descriptors. The generic descriptor wallet flow validates descriptors and spends through
 * registered extensions and does not know what any of them are.
 */
export interface DescriptorExtension {
  name: string;

  /** Whether the descriptor is a valid descriptor of this extension for a wallet with the given keys. */
  isWalletDescriptor(descriptor: Descriptor, walletKeys: WalletKeyTriple): boolean;

  /**
   * Throws if the PSBT spends inputs of this extension in a way that must not be signed.
   * Does nothing when none of the inputs belongs to the extension.
   */
  assertSpendPolicy(psbt: Psbt, descriptorMap: descriptorWallet.DescriptorMap): void;
}
