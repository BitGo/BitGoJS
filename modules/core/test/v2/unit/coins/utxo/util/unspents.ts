/**
 * @prettier
 */
import * as bip32 from 'bip32';
import * as utxolib from '@bitgo/utxo-lib';

import { Unspent } from '../../../../../../src/v2/coins/abstractUtxoCoin';

import { getSeed } from '../../../../../lib/keys';

import { keychains, Triple } from './keychains';

export function deriveKey(k: bip32.BIP32Interface, chain: number, index: number): bip32.BIP32Interface {
  return k.derivePath(`0/0/${chain}/${index}`);
}

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

export function mockUnspent(
  network: utxolib.Network,
  { id, chain = 0, index = 0, value, address }: Partial<Unspent>,
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
    id = getSeed(`${address}`).toString('hex') + ':1';
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
