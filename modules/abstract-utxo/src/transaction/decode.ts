import * as utxolib from '@bitgo/utxo-lib';

export type DecodedTransaction<TNumber extends number | bigint> =
  | utxolib.bitgo.UtxoTransaction<TNumber>
  | utxolib.bitgo.UtxoPsbt;

export function decodeTransaction<TNumber extends number | bigint>(
  input: Buffer | string,
  network: utxolib.Network,
  amountType: 'number' | 'bigint'
): DecodedTransaction<TNumber> {
  if (typeof input === 'string') {
    for (const format of ['hex', 'base64'] as const) {
      const buffer = Buffer.from(input, format);
      const bufferToString = buffer.toString(format);
      if (
        (format === 'base64' && bufferToString === input) ||
        (format === 'hex' && bufferToString === input.toLowerCase())
      ) {
        return decodeTransaction(buffer, network, amountType);
      }
    }

    throw new Error('input must be a valid hex or base64 string');
  }

  if (utxolib.bitgo.isPsbt(input)) {
    return utxolib.bitgo.createPsbtFromBuffer(input, network);
  } else {
    return utxolib.bitgo.createTransactionFromBuffer(input, network, {
      amountType,
    });
  }
}

export function decodeTransactionFromPrebuild<TNumber extends number | bigint>(
  prebuild: {
    txHex?: string;
    txBase64?: string;
  },
  network: utxolib.Network,
  amountType: 'number' | 'bigint'
): DecodedTransaction<TNumber> {
  const string = prebuild.txHex ?? prebuild.txBase64;
  if (!string) {
    throw new Error('missing required txHex or txBase64 property');
  }
  return decodeTransaction(string, network, amountType);
}
