const tronweb = require('tronweb');

// this is a construct unique to tron
export type ByteArray = number[];
export type Transaction = { txID: string, signature?: string[] };

export default class Tron { 
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

  static getBase58Address(address: ByteArray): string {
    return tronweb.utils.crypto.getBase58CheckAddress(address);
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
}
