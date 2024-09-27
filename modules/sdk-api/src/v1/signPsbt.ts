import * as utxolib from '@bitgo/utxo-lib';

import * as buildDebug from 'debug';

const debug = buildDebug('bitgo:v1:txb');

/**
 * Co-sign a PSBT.
 * Simply a wrapper around `utxolib.bitgo.createPsbtFromBuffer` and `psbt.signAllInputsHD`.
 * @param params
 */
export function signPsbtRequest(params: { psbt: string; keychain: { xprv: string } } | unknown): {
  psbt: string;
} {
  if (typeof params !== 'object' || params === null) {
    throw new Error(`invalid argument`);
  }

  if (!('psbt' in params) || typeof params.psbt !== 'string') {
    throw new Error(`invalid params.psbt`);
  }

  if (!('keychain' in params) || typeof params.keychain !== 'object' || params.keychain === null) {
    throw new Error(`invalid params.keychain`);
  }

  if (!('xprv' in params.keychain) || typeof params.keychain.xprv !== 'string') {
    throw new Error(`invalid params.keychain.xprv`);
  }

  const psbt = utxolib.bitgo.createPsbtDecode(params.psbt, utxolib.networks.bitcoin);
  const keypair = utxolib.bip32.fromBase58(params.keychain.xprv, utxolib.networks.bitcoin);
  debug('signing PSBT with keychain %s', keypair.neutered().toBase58());
  utxolib.bitgo.withUnsafeNonSegwit(psbt, () => psbt.signAllInputsHD(keypair));
  return {
    psbt: psbt.toBuffer().toString('hex'),
  };
}
