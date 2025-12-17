import * as utxolib from '@bitgo/utxo-lib';

export function hasWasmUtxoSupport(network: utxolib.Network): boolean {
  return utxolib.getMainnet(network) !== utxolib.networks.zcash;
}
