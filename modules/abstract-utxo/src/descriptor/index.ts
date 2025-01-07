export { Miniscript, Descriptor } from '@bitgo/wasm-miniscript';
export { assertDescriptorWalletAddress } from './assertDescriptorWalletAddress';
export { NamedDescriptor, createNamedDescriptorWithSignature, hasValidSignature } from './NamedDescriptor';
export { isDescriptorWallet, getDescriptorMapFromWallet } from './descriptorWallet';
export { getPolicyForEnv } from './validatePolicy';
export * as createWallet from './createWallet';
