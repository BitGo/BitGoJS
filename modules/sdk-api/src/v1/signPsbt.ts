import * as utxolib from '@bitgo/utxo-lib';

import buildDebug from 'debug';

const debug = buildDebug('bitgo:v1:txb');

/**
 * The legacy sighash used by non-segwit inputs does not commit to the input value. Such an input can only be
 * signed safely if it carries the full previous transaction (nonWitnessUtxo) and that transaction hashes to
 * the txid the input spends. Throws if any non-segwit input does not meet this, so no input is signed.
 */
function assertNonSegwitInputsHavePrevTx(psbt: utxolib.bitgo.UtxoPsbt): void {
  psbt.data.inputs.forEach((input, i) => {
    const scriptType = utxolib.bitgo.getPsbtInputScriptType(input);
    if (scriptType !== 'p2sh' && scriptType !== 'p2shP2pk') {
      return;
    }
    if (!input.nonWitnessUtxo) {
      throw new Error(`input ${i} is a non-segwit input without nonWitnessUtxo`);
    }
    const prevTx = utxolib.bitgo.createTransactionFromBuffer(input.nonWitnessUtxo, psbt.network, {
      amountType: 'bigint',
    });
    const txInput = psbt.txInputs[i];
    if (!prevTx.getHash().equals(txInput.hash)) {
      throw new Error(`input ${i} nonWitnessUtxo does not match the txid the input spends`);
    }
    if (!prevTx.outs[txInput.index]) {
      throw new Error(`input ${i} nonWitnessUtxo has no output ${txInput.index}`);
    }
  });
}

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
  assertNonSegwitInputsHavePrevTx(psbt);
  const keypair = utxolib.bip32.fromBase58(params.keychain.xprv, utxolib.networks.bitcoin);
  debug('signing PSBT with keychain %s', keypair.neutered().toBase58());
  // Sign in safe mode: non-segwit inputs are hashed from nonWitnessUtxo, never from a claimed witnessUtxo value.
  utxolib.bitgo.withUnsafeNonSegwit(psbt, () => psbt.signAllInputsHD(keypair), false);
  return {
    psbt: psbt.toBuffer().toString('hex'),
  };
}
