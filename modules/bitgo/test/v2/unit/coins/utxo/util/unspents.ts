/**
 * @prettier
 */
import * as utxolib from '@bitgo/utxo-lib';
const { scriptTypeForChain, chainCodesP2sh, getExternalChainCode, getInternalChainCode } = utxolib.bitgo;

type RootWalletKeys = utxolib.bitgo.RootWalletKeys;
type Unspent = utxolib.bitgo.Unspent;
type WalletUnspent = utxolib.bitgo.WalletUnspent;
type ChainCode = utxolib.bitgo.ChainCode;

import { getSeed } from '@bitgo/sdk-test';
import { getReplayProtectionAddresses } from '@bitgo/abstract-utxo';

export type InputScriptType = utxolib.bitgo.outputScripts.ScriptType2Of3 | 'replayProtection';

const defaultChain: ChainCode = getExternalChainCode(chainCodesP2sh);

export function getOutputScript(
  walletKeys: RootWalletKeys,
  chain = defaultChain,
  index = 0
): utxolib.bitgo.outputScripts.SpendableScript {
  return utxolib.bitgo.outputScripts.createOutputScript2of3(
    walletKeys.deriveForChainAndIndex(chain, index).publicKeys,
    scriptTypeForChain(chain)
  );
}

export function getWalletAddress(
  network: utxolib.Network,
  walletKeys: RootWalletKeys,
  chain = defaultChain,
  index = 0
): string {
  return utxolib.address.fromOutputScript(getOutputScript(walletKeys, chain, index).scriptPubKey, network);
}

function mockOutputIdForAddress(address: string) {
  return getSeed(address).toString('hex') + ':1';
}

export function mockWalletUnspent(
  network: utxolib.Network,
  walletKeys: RootWalletKeys,
  { id, chain = defaultChain, index = 0, value, address }: Partial<WalletUnspent>
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
  throw new Error(`${utxolib.getNetworkName(network)} has no replay protection unspetns`);
}

export function mockUnspent(
  network: utxolib.Network,
  walletKeys: RootWalletKeys,
  chain: ChainCode | InputScriptType,
  index: number,
  value: number
): Unspent {
  if (chain === 'replayProtection') {
    return mockUnspentReplayProtection(network);
  } else {
    return mockWalletUnspent(network, walletKeys, { chain: getInternalChainCode(chain), value, index });
  }
}
