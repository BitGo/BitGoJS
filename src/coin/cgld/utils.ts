import { signTransaction } from '@celo/contractkit/lib/utils/signing-utils';
import { addHexPrefix } from 'ethereumjs-util';
import { RLP } from 'ethers/utils';
import { TxData } from '../eth/iface';
import { KeyPair } from '../eth/keyPair';
import { SigningError } from '../baseCoin/errors';

/**
 * Signs a Celo transaction using celo contract kit
 *
 * @param {TxData} transactionData the transaction data to sign
 * @param {KeyPair} keyPair the signer's keypair
 * @returns {string} the transaction signed and encoded
 */
export async function sign(transactionData: TxData, keyPair: KeyPair): Promise<string> {
  if (!keyPair.getKeys().prv) {
    throw new SigningError('Missing private key');
  }
  const privateKey = addHexPrefix(keyPair.getKeys().prv as string);
  const rawTransaction = await signTransaction(removeEmptyFields(transactionData), privateKey);
  return rawTransaction.raw;
}

/**
 * removes the unused optional fields of the tx to be used with @celo/contractkit
 *
 * @param {TxData} transactionData the transaction data unfiltered
 * @returns {TxData} the transaction data filtered with the available values
 */
function removeEmptyFields(transactionData: TxData): TxData {
  const filtered: TxData = {
    nonce: transactionData.nonce,
    data: transactionData.data,
    gasLimit: transactionData.gasLimit,
    gasPrice: transactionData.gasPrice,
    chainId: transactionData.chainId,
    value: transactionData.value,
  };
  if (transactionData.to && transactionData.to !== '0x') {
    filtered.to = transactionData.to;
  }
  if (transactionData.from && transactionData.from !== '0x') {
    filtered.from = transactionData.from;
  }
  if (transactionData.r) {
    filtered.r = transactionData.r;
  }
  if (transactionData.s) {
    filtered.s = transactionData.s;
  }
  if (transactionData.v) {
    filtered.v = transactionData.v;
  }

  return filtered;
}

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

export const fromNat = bn => (bn === '0x0' ? '0x' : bn.length % 2 === 0 ? bn : '0x0' + bn.slice(2));

/**
 *
 * @param {string} serializedTx the serialized transaction
 * @returns {TxData} the deserialized transaction
 */
export function deserialize(serializedTx: string): TxData {
  //const x = recoverTransaction(serializedTx);
  const rawValues = RLP.decode(serializedTx);
  console.log('signing-utils@recoverTransaction: values are %s', rawValues);
  const recovery = toNumber(rawValues[9]);
  // tslint:disable-next-line:no-bitwise
  const chainId = fromNumber((recovery - 35) >> 1);
  const celoTx: TxData = {
    nonce: rawValues[0].toLowerCase() === '0x' ? 0 : parseInt(rawValues[0], 16),
    gasPrice: rawValues[1].toLowerCase() === '0x' ? '0' : parseInt(rawValues[1], 16).toString(),
    gasLimit: rawValues[2].toLowerCase() === '0x' ? '0' : parseInt(rawValues[2], 16).toString(),
    to: rawValues[6],
    value: rawValues[7],
    data: rawValues[8],
    chainId: chainId,
  };
  return celoTx;
}
