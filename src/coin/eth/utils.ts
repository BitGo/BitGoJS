import { Buffer } from 'buffer';
import { isValidAddress } from 'ethereumjs-util';
import EthereumAbi from 'ethereumjs-abi';
import EthereumCommon from 'ethereumjs-common';
import { signTransaction } from '@celo/contractkit/lib/utils/signing-utils';
import { Transaction } from 'ethereumjs-tx';
import { SigningError } from '../baseCoin/errors';
import { TxData } from './iface';
import { KeyPair } from './keyPair';
import { walletSimpleConstructor, walletSimpleByteCode } from './walletUtil';

const customCommonMap = {
  rsk: EthereumCommon.forCustomChain(
    'kovan',
    {
      name: 'testnet',
      networkId: 31,
      chainId: 31,
    },
    'petersburg',
  ),
  eth: EthereumCommon.forCustomChain(
    'kovan',
    {
      name: 'testnet',
      networkId: 42,
      chainId: 42,
    },
    'petersburg',
  ),
};

/**
 * Signs the transaction using the appropriate algorithm
 *
 * @param {TxData} transactionData the transaction data to sign
 * @param {string} subCoin the specific coin type
 * @param {KeyPair} keyPair the signer's keypair
 * @returns {string} the transaction signed and encoded
 */
export async function sign(transactionData: TxData, subCoin: string, keyPair: KeyPair): Promise<string> {
  if (!keyPair.getKeys().prv) {
    throw new SigningError('Missing private key');
  }
  if (subCoin === 'celo') {
    return celoSign(transactionData, keyPair);
  } else {
    return commonEthereumSign(subCoin, transactionData, keyPair);
  }
}

/**
 * Signs an Ethereum transaction using ethereumjs-tx
 *
 * @param {string} subCoin the specific coin type
 * @param {TxData} transactionData the transaction data to sign
 * @param {KeyPair} keyPair the signer's keypair
 * @returns {string} the transaction signed and encoded
 */
async function commonEthereumSign(subCoin: string, transactionData: TxData, keyPair: KeyPair): Promise<string> {
  const customCommon = customCommonMap[subCoin];
  const ethTx = new Transaction(formatTransaction(transactionData), { common: customCommon });
  const privateKey = Buffer.from(keyPair.getKeys().prv as string, 'hex');
  ethTx.sign(privateKey);
  const encodedTransaction = ethTx.serialize().toString('hex');
  return '0x' + encodedTransaction;
}

/**
 * Signs a Celo transaction using celo contract kit
 *
 * @param {TxData} transactionData the transaction data to sign
 * @param {KeyPair} keyPair the signer's keypair
 * @returns {string} the transaction signed and encoded
 */
async function celoSign(transactionData: TxData, keyPair: KeyPair): Promise<string> {
  //TODO: format the transactionData to match Celo, following signing-utils.js recommendation
  const privateKey = '0x' + (keyPair.getKeys().prv as string);
  const rawTransaction = await signTransaction(formatCeloTx(transactionData), privateKey);
  return rawTransaction.raw;
}

/**
 * Format transaction to be signed
 *
 * @param {TxData} transactionData the transaction data with base values
 * @returns {TxData} the transaction data with hex values
 */
function formatCeloTx(transactionData: TxData): TxData {
  return {
    nonce: '0x' + Number(transactionData.nonce).toString(16),
    data: transactionData.data,
    gasLimit: '0x' + Number(transactionData.gasLimit).toString(16),
    gasPrice: '0x' + Number(transactionData.gasPrice).toString(16),
    chainId: '0x' + Number(transactionData.chainId).toString(16),
  };
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
  const resultEncodedParameters = EthereumAbi.rawEncode(walletSimpleConstructor, params)
    .toString('hex')
    .replace('0x', '');
  return walletSimpleByteCode + resultEncodedParameters;
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
