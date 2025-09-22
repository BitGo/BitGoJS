import * as utxolib from '@bitgo-beta/utxo-lib';

export function addBip322ProofMessage(psbt: utxolib.Psbt, inputIndex: number, message: Buffer): void {
  utxolib.bitgo.addProprietaryKeyValuesFromUnknownKeyValues(psbt, 'input', inputIndex, {
    key: {
      identifier: utxolib.bitgo.PSBT_PROPRIETARY_IDENTIFIER,
      subtype: utxolib.bitgo.ProprietaryKeySubtype.BIP322_MESSAGE,
      keydata: Buffer.alloc(0),
    },
    value: message,
  });
}

/**
 * Get the BIP322 proof message at a specific input index of the PSBT
 * @param psbt
 * @param inputIndex
 * @returns The BIP322 proof message as a Buffer, or undefined if not found
 */
export function getBip322ProofMessageAtIndex(psbt: utxolib.Psbt, inputIndex: number): Buffer | undefined {
  if (psbt.data.inputs.length <= inputIndex) {
    throw new Error(`Input index ${inputIndex} is out of bounds for the PSBT`);
  }
  const input = psbt.data.inputs[inputIndex];
  const proprietaryKeyVals = utxolib.bitgo.getPsbtInputProprietaryKeyVals(input, {
    identifier: utxolib.bitgo.PSBT_PROPRIETARY_IDENTIFIER,
    subtype: utxolib.bitgo.ProprietaryKeySubtype.BIP322_MESSAGE,
  });
  if (proprietaryKeyVals.length === 0) {
    return undefined;
  } else if (proprietaryKeyVals.length > 1) {
    throw new Error(`Multiple BIP322 messages found at input index ${inputIndex}`);
  }
  return Buffer.from(proprietaryKeyVals[0].value);
}

/**
 * checks if the transaction contains a BIP322 proof
 * does not check if the proof is valid
 * Source: https://github.com/bitcoin/bips/blob/master/bip-0322.mediawiki#user-content-Full
 * @params tx The transaction or the PSBT to check
 * @returns boolean
 */
export function isBip322ProofCheck(tx: utxolib.bitgo.UtxoPsbt | utxolib.bitgo.UtxoTransaction<bigint>): boolean {
  if (tx instanceof utxolib.bitgo.UtxoPsbt) {
    if (tx.version !== 0 || tx.locktime !== 0 || tx.data.outputs.length !== 1) {
      return false;
    }
    const output = tx.txOutputs[0];
    if (output.script.toString('hex') !== '6a' || output.value !== 0n) {
      return false;
    }

    // Return true if there is a message encoded in every input in the proprietary field
    return tx.data.inputs.every((input, index) => getBip322ProofMessageAtIndex(tx, index) !== undefined);
  } else if (tx instanceof utxolib.bitgo.UtxoTransaction) {
    if (tx.version !== 0 || tx.locktime !== 0 || tx.outs.length !== 1) {
      return false;
    }
    if (tx.outs.length !== 1) {
      return false;
    }
    const output = tx.outs[0];
    // check that the only output is an OP_RETURN with 0 value
    if (output.script.toString('hex') !== '6a' || output.value !== 0n) {
      return false;
    }

    for (const input of tx.ins) {
      if (input.index !== 0 || input.sequence !== 0) {
        return false;
      }
    }

    return true;
  } else {
    throw new Error('Unsupported transaction type for BIP322 proof check');
  }
}
