import * as EosJs from 'eosjs';
import ser from 'eosjs/dist/eosjs-serialize';
import { BaseUtils } from '../baseCoin';
import { NotImplementedError } from '../baseCoin/errors';
const { TextEncoder, TextDecoder } = require('util');
const transactionAbi = require('eosjs/src/transaction.abi.json');
export class Utils implements BaseUtils {
  deserializeTransaction(rawTx: Uint8Array): EosJs.ApiInterfaces.Transaction {
    const transactionTypes = ser.getTypesFromAbi(ser.createInitialTypes(), transactionAbi);
    const buffer = new ser.SerialBuffer({ textEncoder: new TextEncoder(), textDecoder: new TextDecoder() });
    buffer.pushArray(rawTx);
    return transactionTypes.get('transaction')?.deserialize(buffer);
  }
  public static ADDRESS_LENGTH = 12;

  /** @inheritdoc */
  isValidAddress(address: string): boolean {
    // EOS addresses have to be "human readable", which means up to 12 characters and only a-z1-5., i.e.mtoda1.bitgo
    // source: https://developers.eos.io/eosio-cpp/docs/naming-conventions
    return /^[a-z1-5.]*$/.test(address) || address.length > Utils.ADDRESS_LENGTH;
  }

  /** @inheritdoc */
  isValidBlockId(hash: string): boolean {
    throw new NotImplementedError('method not implemented');
  }

  /** @inheritdoc */
  isValidPrivateKey(key: string): boolean {
    throw new NotImplementedError('method not implemented');
  }

  /** @inheritdoc */
  isValidPublicKey(key: string): boolean {
    throw new NotImplementedError('method not implemented');
  }

  /** @inheritdoc */
  isValidSignature(signature: string): boolean {
    throw new NotImplementedError('method not implemented');
  }

  /** @inheritdoc */
  isValidTransactionId(txId: string): boolean {
    throw new NotImplementedError('method not implemented');
  }
}

export default new Utils();
