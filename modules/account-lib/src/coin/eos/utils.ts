/* eslint-disable @typescript-eslint/ban-ts-comment */
import * as EosJs from 'eosjs';
import * as ecc from 'eosjs-ecc';
import { BaseUtils } from '../baseCoin';
import { NotImplementedError } from '../baseCoin/errors';
import OfflineAbiProvider from './OfflineAbiProvider';
const { TextEncoder, TextDecoder } = require('util');

export const initApi = (chainId: string): EosJs.Api => {
  // @ts-ignore
  return new EosJs.Api({
    // @ts-ignore
    abiProvider: new OfflineAbiProvider(),
    chainId: chainId,
    textDecoder: new TextDecoder(),
    textEncoder: new TextEncoder(),
  });
};
export class Utils implements BaseUtils {
  async deserializeTransactionWithActions(
    rawTx: Uint8Array,
    chainId: string,
  ): Promise<EosJs.ApiInterfaces.Transaction> {
    const api = initApi(chainId);
    const tx = await api.deserializeTransactionWithActions(rawTx);
    return tx;
  }

  deserializeTransaction(rawTx: Uint8Array, chainId: string): EosJs.ApiInterfaces.Transaction {
    const api = initApi(chainId);
    const tx = api.deserializeTransaction(rawTx);
    return tx;
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
    return ecc.isValidPrivate(key);
  }

  /** @inheritdoc */
  isValidPublicKey(key: string): boolean {
    return ecc.isValidPublic(key);
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
