/**
 * @prettier
 */
import * as utxolib from '@bitgo/utxo-lib';
import { getReplayProtectionAddresses } from './replayProtection';

export interface PublicUnspent {
  id: string;
  address: string;
  value: number;
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

export function parseOutputId(id: string): { txid: string; vout: number } {
  const parts = id.split(':');
  if (parts.length !== 2) {
    throw new Error(`invalid outputId, must have format txid:vout`);
  }
  const [txid, voutStr] = parts;
  const vout = Number(voutStr);
  if (txid.length !== 64) {
    throw new Error(`invalid txid ${txid} ${txid.length}`);
  }
  if (Number.isNaN(vout) || vout < 0 || !Number.isSafeInteger(vout)) {
    throw new Error(`invalid vout: must be integer >= 0`);
  }
  return { txid, vout };
}

export function formatOutputId(txid: string, vout: number): string {
  return `${txid}:${vout}`;
}
