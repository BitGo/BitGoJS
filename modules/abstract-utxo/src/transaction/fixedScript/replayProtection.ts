import * as utxolib from '@bitgo/utxo-lib';
import { utxolibCompat } from '@bitgo/wasm-utxo';

export const pubkeyProd = Buffer.from('0255b9f71ac2c78fffd83e3e37b9e17ae70d5437b7f56d0ed2e93b7de08015aa59', 'hex');

export const pubkeyTestnet = Buffer.from('0219da48412c2268865fe8c126327d1b12eee350a3b69eb09e3323cc9a11828945', 'hex');

export function getReplayProtectionPubkeys(network: utxolib.Network): Buffer[] {
  switch (network) {
    case utxolib.networks.bitcoincash:
    case utxolib.networks.bitcoinsv:
      return [pubkeyProd];
    case utxolib.networks.bitcoinsvTestnet:
    case utxolib.networks.bitcoincashTestnet:
      return [pubkeyTestnet];
  }
  return [];
}

// sh(pk(pubkeyProd))
// 33p1q7mTGyeM5UnZERGiMcVUkY12SCsatA
// bitcoincash:pqt5x9w0m6z0f3znjkkx79wl3l7ywrszesemp8xgpf
const replayProtectionScriptsProd = [Buffer.from('a914174315cfde84f4c45395ac6f15df8ffc470e02cc87', 'hex')];
// sh(pk(pubkeyTestnet))
// 2MuMnPoSDgWEpNWH28X2nLtYMXQJCyT61eY
// bchtest:pqtjmnzwqffkrk2349g3cecfwwjwxusvnq87n07cal
const replayProtectionScriptsTestnet = [Buffer.from('a914172dcc4e025361d951a9511c670973a4e3720c9887', 'hex')];

export function getReplayProtectionAddresses(
  network: utxolib.Network,
  format: 'default' | 'cashaddr' = 'default'
): string[] {
  switch (network) {
    case utxolib.networks.bitcoincash:
    case utxolib.networks.bitcoinsv:
      return replayProtectionScriptsProd.map((script) => utxolibCompat.fromOutputScript(script, network, format));
    case utxolib.networks.bitcoinsvTestnet:
    case utxolib.networks.bitcoincashTestnet:
      return replayProtectionScriptsTestnet.map((script) => utxolibCompat.fromOutputScript(script, network, format));
    default:
      return [];
  }
}

export function isReplayProtectionUnspent<TNumber extends number | bigint>(
  u: utxolib.bitgo.Unspent<TNumber>,
  network: utxolib.Network
): boolean {
  return getReplayProtectionAddresses(network).includes(u.address);
}
