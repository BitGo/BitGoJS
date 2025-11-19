import * as utxolib from '@bitgo/utxo-lib';

export function hasWasmUtxoSupport(network: utxolib.Network): boolean {
  return ![
    utxolib.networks.bitcoincash,
    utxolib.networks.bitcoingold,
    utxolib.networks.ecash,
    utxolib.networks.zcash,
  ].includes(utxolib.getMainnet(network));
}
