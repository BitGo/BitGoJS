import * as bitcoinjs from 'bitcoinjs-lib';
import { Base58CheckResult, Bech32Result } from 'bitcoinjs-lib/src/address';

import * as zcashAddress from '../src/bitgo/zcash/address';
import { isValidNetwork, isZcash, Network } from './networks';
import { p2trPayments } from './index';

export function fromOutputScript(outputScript: Buffer, network: Network): string {
  if (isValidNetwork(network) && isZcash(network)) {
    return zcashAddress.fromOutputScript(outputScript, network);
  }

  // We added p2tr payments from our forked bitcoinjs-lib to utxo-lib instead. Our bitcoinjs fork will no longer have
  // p2tr support so utxo-lib should take care of retrieving a p2tr address from outputScript and bitcoinjs-lib can
  // handle the other type of payments.
  try {
    return p2trPayments.p2tr({ output: outputScript, network }).address as string;
  } catch (e) {
    // noop. try the bitcoinjs method
  }

  return bitcoinjs.address.fromOutputScript(outputScript, network as bitcoinjs.Network);
}

export function toOutputScript(address: string, network: Network): Buffer {
  if (isValidNetwork(network) && isZcash(network)) {
    return zcashAddress.toOutputScript(address, network);
  }
  return bitcoinjs.address.toOutputScript(address, network as bitcoinjs.Network);
}

export function toBase58Check(hash: Buffer, version: number, network: Network): string {
  if (isValidNetwork(network) && isZcash(network)) {
    return zcashAddress.toBase58Check(hash, version);
  }
  return bitcoinjs.address.toBase58Check(hash, version);
}

export function fromBase58Check(address: string, network: Network): Base58CheckResult {
  if (isValidNetwork(network) && isZcash(network)) {
    return zcashAddress.fromBase58Check(address);
  }
  return bitcoinjs.address.fromBase58Check(address);
}

export const { fromBech32, toBech32 } = bitcoinjs.address;

export { Base58CheckResult, Bech32Result };
