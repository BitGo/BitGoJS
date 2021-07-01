/* eslint-disable @typescript-eslint/ban-ts-comment */
import * as EosJs from 'eosjs';

import { BaseUtils } from '../baseCoin';
import { NotImplementedError } from '../baseCoin/errors';
import { OfflineAbiProvider } from './OfflineAbiProvider';
const { TextEncoder, TextDecoder } = require('util');

export const initApi = (chainId: string): EosJs.Api => {
  // @ts-ignore
  return new EosJs.Api({
    abiProvider: new OfflineAbiProvider(),
    chainId: chainId,
    textDecoder: new TextDecoder(),
    textEncoder: new TextEncoder(),
  });
};
export class Utils implements BaseUtils {
  async deserializeTransaction(rawTx: Uint8Array): Promise<EosJs.ApiInterfaces.Transaction> {
    const api = initApi();
    const tx = await api.deserializeTransactionWithActions(rawTx);
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
    return true;
  }

  /** @inheritdoc */
  isValidPublicKey(key: string): boolean {
    return true;
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
