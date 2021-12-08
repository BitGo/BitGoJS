/**
 * @prettier
 */
import * as utxolib from '@bitgo/utxo-lib';
import { Codes } from '@bitgo/unspents';
import { RootWalletKeys, Unspent, WalletUnspent } from '@bitgo/utxo-lib/src/bitgo';

import { getSeed } from '../../../../../lib/keys';
import { getReplayProtectionAddresses } from '../../../../../../src/v2/coins/utxo/replayProtection';

export type InputScriptType = utxolib.bitgo.outputScripts.ScriptType2Of3 | 'replayProtection';

export function getOutputScript(
  walletKeys: RootWalletKeys,
  chain = 0,
  index = 0
): utxolib.bitgo.outputScripts.SpendableScript {
  return utxolib.bitgo.outputScripts.createOutputScript2of3(
    walletKeys.deriveForChainAndIndex(chain, index).publicKeys,
    utxolib.bitgo.outputScripts.scriptTypeForChain(chain)
  );
}

export function getWalletAddress(network: utxolib.Network, walletKeys: RootWalletKeys, chain = 0, index = 0): string {
  return utxolib.address.fromOutputScript(getOutputScript(walletKeys, chain, index).scriptPubKey, network);
}

function mockOutputIdForAddress(address: string) {
  return getSeed(address).toString('hex') + ':1';
}

export function mockWalletUnspent(
  network: utxolib.Network,
  walletKeys: RootWalletKeys,
  { id, chain = 0, index = 0, value, address }: Partial<WalletUnspent>
): WalletUnspent {
  if (value === undefined) {
    throw new Error(`unspent value must be set`);
  }
  if (chain === undefined) {
    throw new Error(`unspent chain must be set`);
  }
  const derived = getOutputScript(walletKeys, chain, index);
  const deriveAddress = utxolib.address.fromOutputScript(derived.scriptPubKey, network);
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

export function mockUnspentReplayProtection(network: utxolib.Network): Unspent {
  const addresses = getReplayProtectionAddresses(network);
  if (addresses.length) {
    const address = addresses[0];
    return {
      id: mockOutputIdForAddress(address),
      address,
      value: 0.1,
    };
  }
  throw new Error(`${utxolib.coins.getNetworkName(network)} has no replay protection unspetns`);
}

export function mockUnspent(
  network: utxolib.Network,
  walletKeys: RootWalletKeys,
  chain: number | InputScriptType,
  index: number,
  value: number
): Unspent {
  if (chain === 'replayProtection') {
    return mockUnspentReplayProtection(network);
  } else {
    chain = typeof chain === 'number' ? chain : Codes.forType(chain as any).internal;
    return mockWalletUnspent(network, walletKeys, { chain, value, index });
  }
}
