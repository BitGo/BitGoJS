const tronweb = require('tronweb');
const tronproto = require('./protobuf/tron_pb');
const contractproto = require('./protobuf/Contract_pb');

import * as assert from 'assert';

// this is a construct unique to tron
export type ByteArray = number[];
export type Transaction = { txID: string, signature?: string[] };

export default class Tron { 

  constructor(coinName: string) {
    // TODO: this will probably need to become more useful if we need to decode if based on network
  }

  static parseTransaction(base64EncodedHex: string): ParsedTransaction | ParsedAccountUpdatePermission {
    const bytes = Buffer.from(base64EncodedHex, 'hex');
    let raw;

    // we need to decode our raw_data_hex field first
    try {
      raw = tronproto.Transaction.raw.deserializeBinary(bytes).toObject();
    } catch (e) {
      console.log('There was an error decoding the initial raw_data_hex from the serialized tx.');
      throw e;
    }
    
    // there should not be multiple contracts in this data
    assert(raw.contractList.length === 1);

    // ensure the contract type is supported
    switch  (raw.contractList[0].parameter.typeUrl) {
      case 'type.googleapis.com/protocol.TransferContract':
        return this.decodeTransferContract(raw.contractList[0].parameter.value);
      case 'type.googleapis.com/protocol.AccountPermissionUpdateContract':
        return this.decodeAccountPermissionUpdateContract(raw.contractList[0].parameter.value);
      default:
        throw new Error('Unsupported contract type');    
    }
  }

  static decodeTransferContract(base64: string): ParsedTransaction {
    const contractBytes = Buffer.from(base64, 'base64');
    let transferContract;

    try {
      transferContract = contractproto.TransferContract.deserializeBinary(contractBytes).toObject();
    } catch (e) {
      console.log('There was an error decoding the transfer contract in the transaction.');
      throw e;
    }

    assert(transferContract.ownerAddress);
    assert(transferContract.toAddress);
    assert(transferContract.hasOwnProperty('amount'));

    // deserialize attributes
    const ownerAddress = Tron.getBase58AddressFromByteArray(Tron.hexStr2byteArray(Buffer.from(transferContract.ownerAddress, 'base64').toString('hex')));
    const toAddress = Tron.getBase58AddressFromByteArray(Tron.hexStr2byteArray(Buffer.from(transferContract.toAddress, 'base64').toString('hex')));
    const amount = transferContract.amount;

    return {
      toAddress,
      ownerAddress,
      amount,
    };
  }

  static decodeAccountPermissionUpdateContract(base64: string): ParsedAccountUpdatePermission {
    throw new Error('Not implemented yet.');
  }

  static generateAccount(): Account {
    return tronweb.utils.accounts.generateAccount();
  }

  static isAddress(hexAddress: string): boolean {
    return tronweb.isAddress(hexAddress);
  }

  static hexStr2byteArray(str: string): ByteArray {
    return tronweb.utils.code.hexStr2byteArray(str);
  }

  static byteArray2hexStr(arr: ByteArray): string {
    return tronweb.utils.code.byteArray2hexStr(arr);
  }

  static getPubKeyFromPriKey(privateKey: ByteArray | Buffer | Uint8Array | string): ByteArray {
    return tronweb.utils.crypto.getPubKeyFromPriKey(privateKey);
  }

  static getAddressFromPriKey(privateKey: ByteArray | Buffer | Uint8Array | string): ByteArray {
    return tronweb.utils.crypto.getAddressFromPriKey(privateKey);
  }

  static getBase58AddressFromByteArray(address: ByteArray): string {
    return tronweb.utils.crypto.getBase58CheckAddress(address);
  }

  static getBase58AddressFromHex(hex: string): string {
    const arr = Tron.hexStr2byteArray(hex);
    return Tron.getBase58AddressFromByteArray(arr);
  }

  static signTransaction(privateKey: string | ByteArray, transaction: Transaction) {
    return tronweb.utils.crypto.signTransaction(privateKey, transaction);
  }

  static signString(message: string, privateKey: string | ByteArray, useTronHeader: boolean = true): string {
    return tronweb.Trx.signString(message, privateKey, useTronHeader);
  }

  static computeAddress(pubBytes: number[] | string): ByteArray {
    return tronweb.utils.crypto.computeAddress(pubBytes);
  }

  static getHexFromBase58Address(base58: string): string {
    // pulled from: https://github.com/TRON-US/tronweb/blob/dcb8efa36a5ebb65c4dab3626e90256a453f3b0d/src/utils/help.js#L17
    // but they don't surface this call in index.js
    const bytes = tronweb.utils.crypto.decodeBase58Address(base58);
    return Tron.byteArray2hexStr(bytes);
  }
}

export interface ParsedTransaction {
  // base58 encoded address
  toAddress: string;
  ownerAddress: string;
  amount: number;
}

export interface ParsedAccountUpdatePermission {
  // TODO: tbd
}

export interface Account {
  publicKey: string;
  privateKey: string;
}
