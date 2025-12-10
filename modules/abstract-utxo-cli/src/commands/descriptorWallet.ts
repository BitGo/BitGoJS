import { IWallet } from '@bitgo/sdk-core';

export type Descriptor = {
  name: string;
  value: string;
};

export function getDescriptors(wallet: IWallet): Descriptor[] {
  const descriptors = (wallet as any)._wallet.coinSpecific.descriptors;
  if (!descriptors) {
    throw new Error('No descriptors found');
  }
  if (!Array.isArray(descriptors)) {
    throw new Error('Descriptors must be an array');
  }
  if (descriptors.length === 0) {
    throw new Error('No descriptors found');
  }
  for (const d of descriptors) {
    if (typeof d !== 'object') {
      throw new Error('Descriptor must be an object');
    }
    if (!d.name || typeof d.name !== 'string') {
      throw new Error('Descriptor must have a name');
    }
    if (!d.value || typeof d.value !== 'string') {
      throw new Error('Descriptor must have a value');
    }
  }
  return descriptors as Descriptor[];
}
