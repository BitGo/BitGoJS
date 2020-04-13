import { Buffer } from 'buffer';
import { isValidAddress } from 'ethereumjs-util';
import EthereumCommon from 'ethereumjs-common';
import { Transaction } from 'ethereumjs-tx';
import { SigningError } from '../baseCoin/errors';
import { TxData } from './iface';
import { KeyPair } from './keyPair';
import { walletSimpleConstructor, walletSimpleByteCode } from './walletUtil';
import { encodeParameters } from './abiCoder';

/**
 * Signs the transaction using the Eth elliptic curve
 *
 * @param {TxData} transactionData the transaction data to sign
 * @param {KeyPair} keyPair the signer's keypair
 * @returns {string} the transaction signed and encoded
 */
export async function sign(transactionData: TxData, keyPair: KeyPair): Promise<string> {
  if (!keyPair.getKeys().prv) {
    throw new SigningError('Missing private key');
  }
  const customCommon = EthereumCommon.forCustomChain(
    'ropsten',
    {
      name: 'testnet',
      networkId: transactionData.chainId as number,
      chainId: transactionData.chainId as number,
    },
    'petersburg',
  );
  const ethTx = new Transaction(formatTransaction(transactionData), { common: customCommon });
  const privateKey = Buffer.from(keyPair.getKeys().prv as string, 'hex');
  ethTx.sign(privateKey);
  const encodedTransaction = ethTx.serialize().toString('hex');
  return encodedTransaction;
}

/**
 * Format transaction to be signed
 *
 * @param {TxData} transactionData the transaction data with base values
 * @returns {TxData} the transaction data with hex values
 */
function formatTransaction(transactionData: TxData): TxData {
  return {
    gasLimit: '0x' + Number(transactionData.gasLimit).toString(16),
    gasPrice: '0x' + Number(transactionData.gasPrice).toString(16),
    nonce: '0x' + Number(transactionData.nonce).toString(16),
    data: transactionData.data,
  };
}

/**
 * Returns the smart contract encoded data
 *
 * @param {string[]} addresses - the contract signers
 * @returns {string} - the smart contract encoded data
 */
export function getContractData(addresses: string[]): string {
  const params = [addresses];
  const resultEncodedParameters = encodeParameters(walletSimpleConstructor, params).replace('0x', '');
  return walletSimpleByteCode + resultEncodedParameters;
}

/**
 * Returns whether or not the string is a valid Eth block hash
 *
 * @param {string} hash - the tx hash to validate
 * @returns {boolean} - the validation result
 */
export function isValidBlockHash(hash: string): boolean {
  console.log('Not implemented isValidBlockHash ', hash);
  return true;
}

/**
 * Returns whether or not the string is a valid Eth address
 *
 * @param {string} address - the tx hash to validate
 * @returns {boolean} - the validation result
 */
export function isValidEthAddress(address: string): boolean {
  return isValidAddress(address);
}

/**
 * Returns whether or not the value is an object
 *
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an object, else `false`.
 */
export function isObject(value: any): boolean {
  const type = typeof value;
  return value != null && (type === 'object' || type === 'function');
}
