export { Miniscript, Descriptor } from '@bitgo/wasm-utxo';
export type { DescriptorMap } from '../wasmUtil.js';
export { assertDescriptorWalletAddress } from './assertDescriptorWalletAddress.js';
export {
  NamedDescriptor,
  createNamedDescriptorWithSignature,
  hasValidSignature,
  NamedDescriptorNative,
  toNamedDescriptorNative,
} from './NamedDescriptor.js';
export { isDescriptorWallet, getDescriptorMapFromWallet } from './descriptorWallet.js';
export { getPolicyForEnv } from './validatePolicy.js';
export * as createWallet from './createWallet/index.js';
