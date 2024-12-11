import * as t from 'io-ts';
import { NamedDescriptor } from './NamedDescriptor';
import { AbstractUtxoCoinWalletData } from '../abstractUtxoCoin';
import { DescriptorMap, toDescriptorMap } from '../core/descriptor';
import { IWallet, WalletCoinSpecific } from '@bitgo/sdk-core';

type DescriptorWalletCoinSpecific = {
  descriptors: NamedDescriptor[];
};

function isDescriptorWalletCoinSpecific(obj: unknown): obj is DescriptorWalletCoinSpecific {
  return (
    obj !== null && typeof obj === 'object' && 'descriptors' in obj && t.array(NamedDescriptor).is(obj.descriptors)
  );
}

type DescriptorWalletData = AbstractUtxoCoinWalletData & {
  coinSpecific: DescriptorWalletCoinSpecific;
};

interface IDescriptorWallet extends IWallet {
  coinSpecific(): WalletCoinSpecific & DescriptorWalletCoinSpecific;
}

export function isDescriptorWalletData(obj: AbstractUtxoCoinWalletData): obj is DescriptorWalletData {
  return isDescriptorWalletCoinSpecific(obj.coinSpecific);
}

export function isDescriptorWallet(obj: IWallet): obj is IDescriptorWallet {
  return isDescriptorWalletCoinSpecific(obj.coinSpecific());
}

export function getDescriptorMapFromWalletData(wallet: DescriptorWalletData): DescriptorMap {
  return toDescriptorMap(wallet.coinSpecific.descriptors);
}

export function getDescriptorMapFromWallet(wallet: IDescriptorWallet): DescriptorMap {
  return toDescriptorMap(wallet.coinSpecific().descriptors);
}
