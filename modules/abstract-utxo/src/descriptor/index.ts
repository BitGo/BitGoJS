// Changed from direct import to async import pattern
// Import Miniscript and Descriptor dynamically where they are used
export { DescriptorMap } from '@bitgo/utxo-core/descriptor';
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
