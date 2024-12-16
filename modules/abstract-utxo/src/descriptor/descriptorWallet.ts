import * as t from 'io-ts';
import { IWallet, WalletCoinSpecific } from '@bitgo/sdk-core';

import { NamedDescriptor } from './NamedDescriptor';
import { DescriptorMap } from '../core/descriptor';
import { DescriptorValidationPolicy, KeyTriple, toDescriptorMapValidate } from './validatePolicy';
import { UtxoWallet, UtxoWalletData } from '../wallet';

type DescriptorWalletCoinSpecific = {
  descriptors: NamedDescriptor[];
};

function isDescriptorWalletCoinSpecific(obj: unknown): obj is DescriptorWalletCoinSpecific {
  return (
    obj !== null && typeof obj === 'object' && 'descriptors' in obj && t.array(NamedDescriptor).is(obj.descriptors)
  );
}

type DescriptorWalletData = UtxoWalletData & {
  coinSpecific: DescriptorWalletCoinSpecific;
};

export interface IDescriptorWallet extends UtxoWallet {
  coinSpecific(): WalletCoinSpecific & DescriptorWalletCoinSpecific;
}

export function isDescriptorWalletData(obj: UtxoWalletData): obj is DescriptorWalletData {
  return isDescriptorWalletCoinSpecific(obj.coinSpecific);
}

export function isDescriptorWallet(obj: IWallet): obj is IDescriptorWallet {
  return isDescriptorWalletCoinSpecific(obj.coinSpecific());
}

export function getDescriptorMapFromWallet(
  wallet: IDescriptorWallet,
  walletKeys: KeyTriple,
  policy: DescriptorValidationPolicy
): DescriptorMap {
  return toDescriptorMapValidate(wallet.coinSpecific().descriptors, walletKeys, policy);
}
