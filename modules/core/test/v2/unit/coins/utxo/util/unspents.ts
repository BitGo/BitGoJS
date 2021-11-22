/**
 * @prettier
 */
import * as bip32 from 'bip32';
import * as utxolib from '@bitgo/utxo-lib';

import { ReplayProtectionUnspent, Unspent, WalletUnspent } from '../../../../../../src/v2/coins/utxo/unspent';

import { getSeed } from '../../../../../lib/keys';

import { keychains, Triple } from './keychains';
import { getReplayProtectionAddresses } from '../../../../../../src/v2/coins/utxo/replayProtection';
import { Codes } from '@bitgo/unspents';

export function deriveKey(k: bip32.BIP32Interface, chain: number, index: number): bip32.BIP32Interface {
  return k.derivePath(`0/0/${chain}/${index}`);
}

export type InputScriptType = utxolib.bitgo.outputScripts.ScriptType2Of3 | 'replayProtection';

export function getOutputScript(
  keys: Triple<bip32.BIP32Interface>,
  chain: number,
  index: number
): utxolib.bitgo.outputScripts.SpendableScript {
  return utxolib.bitgo.outputScripts.createOutputScript2of3(
    keys.map((k) => deriveKey(k, chain, index).publicKey),
    utxolib.bitgo.outputScripts.scriptTypeForChain(chain)
  );
}

function mockOutputIdForAddress(address: string) {
  return getSeed(address).toString('hex') + ':1';
}

export function mockWalletUnspent(
  network: utxolib.Network,
  { id, chain = 0, index = 0, value, address }: Partial<WalletUnspent>,
  keys: Triple<bip32.BIP32Interface> = keychains
): Unspent {
  if (value === undefined) {
    throw new Error(`unspent value must be set`);
  }
  if (chain === undefined) {
    throw new Error(`unspent chain must be set`);
  }
  const derived = getOutputScript(keys, chain, index);
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
    redeemScript: derived.redeemScript?.toString('hex'),
    witnessScript: derived.witnessScript?.toString('hex'),
  };
}

export function mockUnspentReplayProtection(network: utxolib.Network): ReplayProtectionUnspent {
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
  scriptType: InputScriptType,
  index: number,
  value: number
): Unspent {
  if (scriptType === 'replayProtection') {
    return mockUnspentReplayProtection(network);
  } else {
    const chain = Codes.forType(scriptType as any).internal;
    return mockWalletUnspent(network, { chain, value, index }, keychains);
  }
}
