/* eslint-disable @typescript-eslint/ban-ts-comment */
import * as querystring from 'querystring';
import * as url from 'url';
import { BigNumber } from 'bignumber.js';
import * as EosJs from 'eosjs';
import * as ecc from 'eosjs-ecc';
import * as _ from 'lodash';
import { BaseUtils } from '../baseCoin';
import { NotImplementedError } from '../baseCoin/errors';
import { AddressValidationError, NameValidationError } from './errors';
import { AddressDetails } from './ifaces';
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
    throw new NotImplementedError('isValidBlockId not implemented');
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
    throw new NotImplementedError('isValidSignature not implemented');
  }

  verifySignature(signature: string, data: string | Buffer, pubkey: string): boolean {
    return ecc.verify(signature, data, pubkey);
  }
  /** @inheritdoc */
  isValidTransactionId(txId: string): boolean {
    throw new NotImplementedError('isValidTransactionId not implemented');
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

  getAddressDetails(address: string): AddressDetails {
    const destinationDetails = url.parse(address);
    const destinationAddress = destinationDetails.pathname;

    if (!destinationAddress) {
      throw new Error(`failed to parse address: ${address}`);
    }

    // EOS addresses have to be "human readable", which means up to 12 characters and only a-z1-5., i.e.mtoda1.bitgo
    // source: https://developers.eos.io/eosio-cpp/docs/naming-conventions
    if (!this.isValidAddress(destinationAddress)) {
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
      throw new Error(`failed to parse query string: ${address}`);
    }

    const queryDetails = querystring.parse(destinationDetails.query);
    if (!queryDetails.memoId) {
      // if there are more properties, the query details need to contain the memoId property
      throw new Error(`invalid property in address: ${address}`)
    }

    if (Array.isArray(queryDetails.memoId) && queryDetails.memoId.length !== 1) {
      // valid addresses can only contain one memo id
      throw new Error(`invalid address ${address} must contain exactly one memoId`)
    }

    const [memoId] = _.castArray(queryDetails.memoId);
    if (!this.isValidMemoId(memoId)) {
      throw new Error(`invalid address: ${address}, memoId is not valid`)
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
      throw new AddressValidationError(address);
    }

    const addressDetails = this.getAddressDetails(address);
    const rootAddressDetails = this.getAddressDetails(rootAddress);

    if (!addressDetails || !rootAddressDetails) {
      return false;
    }

  if (addressDetails.address !== rootAddressDetails.address) {
    throw new Error(`address validation failure: ${addressDetails.address} vs ${rootAddressDetails.address}`)
  }

    return true;
  }
}

export default new Utils();
