import * as utxolib from '@bitgo/utxo-lib';
import { getSeed } from '@bitgo/sdk-test';
import * as wasmUtxo from '@bitgo/wasm-utxo';

import { getReplayProtectionAddresses, ScriptType2Of3 } from '../../../src';
import { getCoinName } from '../../../src/names';
import type { Unspent, WalletUnspent } from '../../../src/unspent';

type RootWalletKeys = utxolib.bitgo.RootWalletKeys;
type ChainCode = wasmUtxo.fixedScriptWallet.ChainCode;

export type InputScriptType = ScriptType2Of3 | 'replayProtection';

const defaultChain: ChainCode = wasmUtxo.fixedScriptWallet.ChainCode.value('p2sh', 'external');

export function getWalletAddress(
  network: utxolib.Network,
  walletKeys: RootWalletKeys,
  chain = defaultChain,
  index = 0
): string {
  return wasmUtxo.fixedScriptWallet.address(walletKeys, chain, index, network);
}

function mockOutputIdForAddress(address: string) {
  return getSeed(address).toString('hex') + ':1';
}

export function mockWalletUnspent<TNumber extends number | bigint = number>(
  network: utxolib.Network,
  walletKeys: RootWalletKeys,
  { id, chain = defaultChain, index = 0, value, address }: Partial<WalletUnspent<TNumber>>
): WalletUnspent<TNumber> {
  if (value === undefined) {
    throw new Error(`unspent value must be set`);
  }
  if (chain === undefined) {
    throw new Error(`unspent chain must be set`);
  }
  const deriveAddress = getWalletAddress(network, walletKeys, chain, index);
  if (address) {
    if (address !== deriveAddress) {
      throw new Error(`derivedAddress mismatch: ${address} derived=${deriveAddress}`);
    }
  } else {
    address = deriveAddress;
  }
  if (!id) {
    id = mockOutputIdForAddress(address);
  }
  return {
    id,
    address,
    chain,
    index,
    value,
  };
}

export function mockUnspentReplayProtection<TNumber extends number | bigint = number>(
  network: utxolib.Network,
  value: TNumber
): Unspent<TNumber> {
  const coinName = getCoinName(network);
  const addresses = getReplayProtectionAddresses(coinName);
  if (addresses.length) {
    const address = addresses[0];
    return {
      id: mockOutputIdForAddress(address),
      address,
      value,
    };
  }
  throw new Error(`${utxolib.getNetworkName(network)} has no replay protection unspetns`);
}

export function mockUnspent<TNumber extends number | bigint = number>(
  network: utxolib.Network,
  walletKeys: RootWalletKeys,
  chain: ChainCode | InputScriptType,
  index: number,
  value: TNumber
): Unspent<TNumber> {
  if (chain === 'replayProtection') {
    return mockUnspentReplayProtection(network, (typeof value === 'bigint' ? BigInt(1000) : 1000) as TNumber);
  } else {
    // chain is either a ChainCode (number) or a ScriptType2Of3 (string)
    const scriptType =
      typeof chain === 'number' ? wasmUtxo.fixedScriptWallet.ChainCode.scriptType(chain) : (chain as ScriptType2Of3);
    const internalChain = wasmUtxo.fixedScriptWallet.ChainCode.value(scriptType, 'internal');
    return mockWalletUnspent(network, walletKeys, { chain: internalChain, value, index });
  }
}
