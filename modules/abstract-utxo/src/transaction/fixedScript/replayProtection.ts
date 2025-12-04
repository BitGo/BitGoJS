import * as utxolib from '@bitgo/utxo-lib';
import { Descriptor, utxolibCompat } from '@bitgo/wasm-utxo';

// 33p1q7mTGyeM5UnZERGiMcVUkY12SCsatA
// bitcoincash:pqt5x9w0m6z0f3znjkkx79wl3l7ywrszesemp8xgpf
const pubkeyProd = Buffer.from('0255b9f71ac2c78fffd83e3e37b9e17ae70d5437b7f56d0ed2e93b7de08015aa59', 'hex');

// 2MuMnPoSDgWEpNWH28X2nLtYMXQJCyT61eY
// bchtest:pqtjmnzwqffkrk2349g3cecfwwjwxusvnq87n07cal
const pubkeyTestnet = Buffer.from('0219da48412c2268865fe8c126327d1b12eee350a3b69eb09e3323cc9a11828945', 'hex');

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

export function createReplayProtectionOutputScript(pubkey: Buffer): Buffer {
  const descriptor = Descriptor.fromString(`sh(pk(${pubkey.toString('hex')}))`, 'definite');
  return Buffer.from(descriptor.scriptPubkey());
}

const replayProtectionScriptsProd = [createReplayProtectionOutputScript(pubkeyProd)];
const replayProtectionScriptsTestnet = [createReplayProtectionOutputScript(pubkeyTestnet)];

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
