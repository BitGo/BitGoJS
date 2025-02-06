export type { Output, DescriptorWalletOutput, WithDescriptor, WithOptDescriptor } from './Output';
export type { DescriptorMap } from './DescriptorMap';
export * as psbt from './psbt';
export type { PsbtParams } from './psbt';

export { createAddressFromDescriptor, createScriptPubKeyFromDescriptor } from './address';
export { createPsbt, finalizePsbt, parse } from './psbt';
export { toDescriptorMap } from './DescriptorMap';
export { toDerivedDescriptorWalletOutput } from './Output';
