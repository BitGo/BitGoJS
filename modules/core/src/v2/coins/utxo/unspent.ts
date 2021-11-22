/**
 * @prettier
 */
import * as utxolib from '@bitgo/utxo-lib';
import { getReplayProtectionAddresses } from './replayProtection';

export interface PublicUnspent {
  id: string;
  address: string;
  value: number;
  valueString: string;
  blockHeight: number;
}

export interface WalletUnspent {
  id: string;
  address: string;
  value: number;
  index: number;
  chain: number;
  redeemScript?: string;
  witnessScript?: string;
}

export interface ReplayProtectionUnspent {
  id: string;
  address: string;
  value: number;
  chain?: undefined;
  index?: undefined;
}

export type Unspent = WalletUnspent | ReplayProtectionUnspent;

export function toOutput(u: Unspent, network: utxolib.Network): utxolib.TxOutput {
  return {
    script: utxolib.address.toOutputScript(u.address, network),
    value: u.value,
  };
}

export function isReplayProtectionUnspent(u: Unspent, network: utxolib.Network): u is ReplayProtectionUnspent {
  if (u.chain === undefined && u.index === undefined) {
    if (getReplayProtectionAddresses(network).includes(u.address)) {
      return true;
    }
    throw new Error(`not a wallet unspent, not a replay protection unspent: ${u.id} ${u.address}`);
  }
  return false;
}

export function isWalletUnspent(u: Unspent): u is WalletUnspent {
  return u.chain !== undefined;
}
