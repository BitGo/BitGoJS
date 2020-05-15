import { recoverTransaction } from '@celo/contractkit/lib/utils/signing-utils';
import { RLP } from 'ethers/utils';
import BigNumber from 'bignumber.js';
import { TxData } from '../eth/iface';
import { ParseTransactionError } from '../baseCoin/errors';

/**
 *
 * @param {number} num number to be converted to hex
 * @returns {string} the hex number
 */
function fromNumber(num: number): string {
  const hex = num.toString(16);
  return hex.length % 2 === 0 ? '0x' + hex : '0x0' + hex;
}

/**
 *
 * @param {string} hex The hex string to be converted
 * @returns {number} the resulting number
 */
function toNumber(hex: string): number {
  return parseInt(hex.slice(2), 16);
}

/**
 *
 * @param {string} serializedTx the serialized transaction
 * @returns {TxData} the deserialized transaction
 */
export function deserialize(serializedTx: string): TxData {
  try {
    const rawValues = RLP.decode(serializedTx);
    const recovery = toNumber(rawValues[9]);
    const chainId = fromNumber((recovery - 35) >> 1);
    const celoTx: TxData = {
      nonce: rawValues[0].toLowerCase() === '0x' ? 0 : parseInt(rawValues[0], 16),
      gasPrice: rawValues[1].toLowerCase() === '0x' ? '0' : new BigNumber(rawValues[1], 16).toString(),
      gasLimit: rawValues[2].toLowerCase() === '0x' ? '0' : new BigNumber(rawValues[2], 16).toString(),
      value: rawValues[7].toLowerCase() === '0x' ? '0' : new BigNumber(rawValues[7], 16).toString(),
      data: rawValues[8],
      chainId: chainId,
    };
    if (rawValues[6] !== '0x') celoTx.to = rawValues[6];
    return celoTx;
  } catch {
    throw new ParseTransactionError('Invalid serialized transaction');
  }
}
