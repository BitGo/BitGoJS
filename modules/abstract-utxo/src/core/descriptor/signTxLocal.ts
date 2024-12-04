import * as utxolib from '@bitgo/utxo-lib';

export function signTxLocal(tx: utxolib.bitgo.UtxoPsbt, key: utxolib.BIP32Interface): utxolib.bitgo.UtxoPsbt {
  tx = tx.clone();
  tx.signAllInputsHD(key);
  return tx;
}
