/* eslint-disable @typescript-eslint/ban-ts-comment */
import * as EosJs from 'eosjs';
import * as ecc from 'eosjs-ecc';
import * as url from 'url';
import * as _ from 'lodash';
import * as querystring from 'querystring';
import { BigNumber } from 'bignumber.js';
import { BaseUtils } from '../baseCoin';
import { NotImplementedError } from '../baseCoin/errors';
import { NameValidationError, AddressValidationError } from './errors';
import OfflineAbiProvider from './OfflineAbiProvider';
import { AddressDetails } from './ifaces'

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

  verifySignature(signature: string, data: string | Buffer, pubkey: string): boolean {
    return ecc.verify(signature, data, pubkey) === true;
  }
  /** @inheritdoc */
  isValidTransactionId(txId: string): boolean {
    throw new NotImplementedError('method not implemented');
  }

  isValidName(s: string): boolean {
    const regex = new RegExp(/^[.1-5a-z]{0,12}[.1-5a-j]?$/);
    if (!regex.test(s)) {
      throw new NameValidationError();
    }
    return true;
  }

  isValidMemo({ value }: { value: string }): boolean {
  return _.isString(value) && value.length <= 256;
  } 

  isValidMemoId(memoId: string): boolean {
    if (!this.isValidMemo({ value: memoId })) {
      return false;
    }

    let memoIdNumber;
    try {
      memoIdNumber = new BigNumber(memoId);
    } catch (e) {
      return false;
    }

    return memoIdNumber.gte(0);
  }

  normalizeAddress({ address, memoId }: AddressDetails): string {
  if (memoId && this.isValidMemoId(memoId)) {
    return `${address}?memoId=${memoId}`;
  }
  return address;
  }

  getAddressDetails(address: string): AddressDetails {
    const ADDRESS_LENGTH = 12;
    const destinationDetails = url.parse(address);
    const destinationAddress = destinationDetails.pathname;

    if (!destinationAddress) {
      throw new AddressValidationError(address)
    }

    // EOS addresses have to be "human readable", which means up to 12 characters and only a-z1-5., i.e.mtoda1.bitgo
    // source: https://developers.eos.io/eosio-cpp/docs/naming-conventions
    if (!/^[a-z1-5.]*$/.test(destinationAddress) || destinationAddress.length > ADDRESS_LENGTH) {
      throw new AddressValidationError(address)
    }

    // address doesn't have a memo id
    if (destinationDetails.pathname === address) {
      return {
        address: address,
        memoId: undefined,
      };
    }

    if (!destinationDetails.query) {
      throw new AddressValidationError(address)
    }

    const queryDetails = querystring.parse(destinationDetails.query);
    if (!queryDetails.memoId) {
      // if there are more properties, the query details need to contain the memoId property
      throw new AddressValidationError(address)
    }

    if (Array.isArray(queryDetails.memoId) && queryDetails.memoId.length !== 1) {
      // valid addresses can only contain one memo id
      throw new AddressValidationError(address)
    }

    const [memoId] = _.castArray(queryDetails.memoId);
    if (!this.isValidMemoId(memoId)) {
      throw new AddressValidationError(address)
    }

    return {
      address: destinationAddress,
      memoId,
    };
  }

  verifyAddress({ address, rootAddress }: any): boolean {
  if (!rootAddress || !_.isString(rootAddress)) {
    throw new Error('missing required string rootAddress');
  }

  if (!this.isValidAddress(address)) {
    throw new AddressValidationError(address)
  }

  const addressDetails = this.getAddressDetails(address);
  const rootAddressDetails = this.getAddressDetails(rootAddress);

  if (!addressDetails || !rootAddressDetails) {
    return false;
  }

  if (addressDetails.address !== rootAddressDetails.address) {
    throw new AddressValidationError(address)
  }

  return true;
  }
}

export default new Utils();
