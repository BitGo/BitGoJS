import * as t from 'io-ts';
import { NamedDescriptor } from './NamedDescriptor';
import { AbstractUtxoCoinWalletData } from '../abstractUtxoCoin';
import { DescriptorMap, toDescriptorMap } from '../core/descriptor';

type DescriptorWalletData = AbstractUtxoCoinWalletData & {
  coinSpecific: {
    descriptors: NamedDescriptor[];
  };
};

export function isDescriptorWalletData(obj: AbstractUtxoCoinWalletData): obj is DescriptorWalletData {
  if ('coinSpecific' in obj && 'descriptors' in obj.coinSpecific) {
    return t.array(NamedDescriptor).is(obj.coinSpecific.descriptors);
  }
  return false;
}

export function getDescriptorMapFromWalletData(wallet: DescriptorWalletData): DescriptorMap {
  return toDescriptorMap(wallet.coinSpecific.descriptors);
}
