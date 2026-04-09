import { address, type AddressFormat } from '@bitgo/wasm-utxo';

import { UtxoCoinName } from '../../names';

export const pubkeyProd = Buffer.from('0255b9f71ac2c78fffd83e3e37b9e17ae70d5437b7f56d0ed2e93b7de08015aa59', 'hex');

export const pubkeyTestnet = Buffer.from('0219da48412c2268865fe8c126327d1b12eee350a3b69eb09e3323cc9a11828945', 'hex');

export function getReplayProtectionPubkeys(coinName: UtxoCoinName): Buffer[] {
  switch (coinName) {
    case 'bch':
    case 'bsv':
      return [pubkeyProd];
    case 'tbsv':
    case 'tbch':
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

export function getReplayProtectionAddresses(coinName: UtxoCoinName, format: AddressFormat = 'default'): string[] {
  switch (coinName) {
    case 'bch':
    case 'bsv':
      return replayProtectionScriptsProd.map((script) => address.fromOutputScriptWithCoin(script, coinName, format));
    case 'tbsv':
    case 'tbch':
      return replayProtectionScriptsTestnet.map((script) => address.fromOutputScriptWithCoin(script, coinName, format));
    default:
      return [];
  }
}

export function isReplayProtectionUnspent(u: { address: string }, coinName: UtxoCoinName): boolean {
  return getReplayProtectionAddresses(coinName).includes(u.address);
}
