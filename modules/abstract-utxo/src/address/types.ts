import * as utxolib from '@bitgo/utxo-lib';

import { FixedScriptAddressCoinSpecific } from './fixedScript';
import { DescriptorAddressCoinSpecific } from './descriptor';

export type ScriptType2Of3 = utxolib.bitgo.outputScripts.ScriptType2Of3;

export type UtxoCoinSpecific = FixedScriptAddressCoinSpecific | DescriptorAddressCoinSpecific;

export type AddressFormat = 'base58' | 'cashaddr';

export type Keychain = { pub: string };

export interface VerifyAddressOptions<TCoinSpecific extends UtxoCoinSpecific> {
  address: string;
  addressType?: string;
  format?: AddressFormat;
  keychains?: Keychain[];
  chain?: number;
  index: number;
  coinSpecific?: TCoinSpecific;
}

export interface AddressDetails<TCoinSpecific> {
  address: string;
  chain: number;
  index: number;
  coin: string;
  coinSpecific: TCoinSpecific;
  addressType?: string;
}

export interface GenerateAddressOptions {
  addressType?: ScriptType2Of3;
  threshold?: number;
  chain?: number;
  index?: number;
  segwit?: boolean;
  bech32?: boolean;
  format?: AddressFormat;
}
