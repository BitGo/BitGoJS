import * as utxolib from '@bitgo/utxo-lib';

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
