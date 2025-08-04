import * as utxolib from '@bitgo/utxo-lib';

export function addBip322ProofMessage(psbt: utxolib.bitgo.UtxoPsbt, inputIndex: number, message: Buffer): void {
  utxolib.bitgo.addProprietaryKeyValuesFromUnknownKeyValues(psbt, 'input', inputIndex, {
    key: {
      identifier: utxolib.bitgo.PSBT_PROPRIETARY_IDENTIFIER,
      subtype: utxolib.bitgo.ProprietaryKeySubtype.BIP322_MESSAGE,
      keydata: Buffer.alloc(0),
    },
    value: message,
  });
}

export function getBip322ProofInputIndex(psbt: utxolib.Psbt): number | undefined {
  const res = psbt.data.inputs.flatMap((input, inputIndex) => {
    const proprietaryKeyVals = utxolib.bitgo.getPsbtInputProprietaryKeyVals(input, {
      identifier: utxolib.bitgo.PSBT_PROPRIETARY_IDENTIFIER,
      subtype: utxolib.bitgo.ProprietaryKeySubtype.BIP322_MESSAGE,
    });
    if (proprietaryKeyVals.length > 1) {
      throw new Error(`Multiple BIP322 messages found at input index ${inputIndex}`);
    }
    return proprietaryKeyVals.length === 0 ? [] : [inputIndex];
  });
  return res.length === 0 ? undefined : res[0];
}

export function psbtIsBip322Proof(psbt: utxolib.Psbt): boolean {
  return getBip322ProofInputIndex(psbt) !== undefined;
}
