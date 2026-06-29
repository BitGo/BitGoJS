import type { descriptorWallet } from '@bitgo/wasm-utxo';

export { Miniscript, Descriptor } from '@bitgo/wasm-utxo';
export type DescriptorMap = descriptorWallet.DescriptorMap;
export { assertDescriptorWalletAddress } from './assertDescriptorWalletAddress';
export {
  NamedDescriptor,
  createNamedDescriptorWithSignature,
  hasValidSignature,
  NamedDescriptorNative,
  toNamedDescriptorNative,
} from './NamedDescriptor';
export { isDescriptorWallet, getDescriptorMapFromWallet } from './descriptorWallet';
export { getPolicyForEnv } from './validatePolicy';
export * as createWallet from './createWallet';
