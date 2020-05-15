import { recoverTransaction } from '@celo/contractkit/lib/utils/signing-utils';
import { RLP } from 'ethers/utils';
import BigNumber from 'bignumber.js';
import { TxData } from '../eth/iface';
import { ParseTransactionError } from '../baseCoin/errors';

/**
 *
 * @param {string} serializedTx the serialized transaction
 * @returns {TxData} the deserialized transaction
 */
export function deserialize(serializedTx: string): TxData {
  try {
    const rawValues = RLP.decode(serializedTx);
    let celoDecodedTx;
    if (rawValues[10] !== '0x' && rawValues[11] !== '0x') {
      celoDecodedTx = recoverTransaction(serializedTx)[0];
    } else {
    }
    const celoTx: TxData = {
      nonce: rawValues[0].toLowerCase() === '0x' ? 0 : parseInt(rawValues[0], 16),
      gasPrice: rawValues[1].toLowerCase() === '0x' ? '0' : new BigNumber(rawValues[1], 16).toString(),
      gasLimit: rawValues[2].toLowerCase() === '0x' ? '0' : new BigNumber(rawValues[2], 16).toString(),
      value: rawValues[7].toLowerCase() === '0x' ? '0' : new BigNumber(rawValues[2], 16).toString(),
      data: rawValues[8],
      chainId: celoDecodedTx === undefined ? rawValues[9] : celoDecodedTx.chainId,
    };
    if (rawValues[6] !== '0x') celoTx.to = rawValues[6];
    return celoTx;
  } catch {
    throw new ParseTransactionError('Invalid serialized transaction');
  }
}
