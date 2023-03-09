import * as url from 'url';
import * as querystring from 'querystring';
import * as _ from 'lodash';
import * as xrpl from 'xrpl';
import * as rippleKeypairs from 'ripple-keypairs';

import { Address, SignerDetails } from './iface';
import { BaseUtils, InvalidAddressError, ParseTransactionError, UtilsError } from '@bitgo/sdk-core';
import { XrpAllowedTransactionTypes } from './enum';
import { KeyPair as XrpKeyPair } from './keyPair';
import BigNumber from 'bignumber.js';
import { MIN_SIGNER_QUORUM, VALID_ACCOUNT_SET_FLAGS } from './constants';

class Utils implements BaseUtils {
  /** @inheritdoc */
  isValidTransactionId(txId: string): boolean {
    return this.isValidHex(txId);
  }

  /** @inheritdoc */
  isValidPrivateKey(key: string): boolean {
    try {
      new XrpKeyPair({ prv: key });
      return true;
    } catch {
      return false;
    }
  }

  validateAddress(address: string): void {
    if (!this.isValidAddress(address)) {
      throw new InvalidAddressError(`address ${address} is not valid`);
    }
  }

  /** @inheritdoc */
  isValidSignature(signature: string): boolean {
    return this.isValidHex(signature);
  }

  /** @inheritdoc */
  isValidBlockId(hash: string): boolean {
    return this.isValidHex(hash);
  }

  isValidHex(hex: string): boolean {
    return /^([a-fA-F0-9])+$/.test(hex);
  }

  /**
   * Parse an address string into address and destination tag
   */
  public getAddressDetails(address: string): Address {
    const destinationDetails = url.parse(address);
    const destinationAddress = destinationDetails.pathname;
    if (!destinationAddress || !xrpl.isValidClassicAddress(destinationAddress)) {
      throw new InvalidAddressError(`destination address "${destinationAddress}" is not valid`);
    }
    // there are no other properties like destination tags
    if (destinationDetails.pathname === address) {
      return {
        address: address,
        destinationTag: undefined,
      };
    }

    if (!destinationDetails.query) {
      throw new InvalidAddressError('no query params present');
    }

    const queryDetails = querystring.parse(destinationDetails.query);
    if (!queryDetails.dt) {
      // if there are more properties, the query details need to contain the destination tag property.
      throw new InvalidAddressError('destination tag missing');
    }

    if (Array.isArray(queryDetails.dt)) {
      // if queryDetails.dt is an array, that means dt was given multiple times, which is not valid
      throw new InvalidAddressError(
        `destination tag can appear at most once, but ${queryDetails.dt.length} destination tags were found`
      );
    }

    const parsedTag = parseInt(queryDetails.dt, 10);
    if (!Number.isSafeInteger(parsedTag)) {
      throw new InvalidAddressError('invalid destination tag');
    }

    if (parsedTag > 0xffffffff || parsedTag < 0) {
      throw new InvalidAddressError('destination tag out of range');
    }

    return {
      address: destinationAddress,
      destinationTag: parsedTag,
    };
  }

  /**
   * Construct a full, normalized address from an address and destination tag
   */
  public normalizeAddress({ address, destinationTag }: Address): string {
    if (!_.isString(address)) {
      throw new InvalidAddressError('invalid address, expected string');
    }
    if (_.isUndefined(destinationTag)) {
      return address;
    }
    if (!_.isInteger(destinationTag)) {
      throw new InvalidAddressError('invalid destination tag, expected integer');
    }
    if (destinationTag > 0xffffffff || destinationTag < 0) {
      throw new InvalidAddressError('destination tag out of range');
    }
    return `${address}?dt=${destinationTag}`;
  }

  /** @inheritdoc */
  public isValidAddress(address: string): boolean {
    try {
      const addressDetails = this.getAddressDetails(address);
      return address === this.normalizeAddress(addressDetails);
    } catch (e) {
      return false;
    }
  }

  /** @inheritdoc */
  public isValidPublicKey(key: string): boolean {
    try {
      new XrpKeyPair({ pub: key });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * @param message hex encoded string
   * @param privateKey
   * return hex encoded signature string, throws if any of the inputs are invalid
   */
  public signString(message: string, privateKey: string): string {
    if (!this.isValidHex(message)) {
      throw new UtilsError('message must be a hex encoded string');
    }
    if (!this.isValidPrivateKey(privateKey)) {
      throw new UtilsError('invalid private key');
    }
    return rippleKeypairs.sign(message, privateKey);
  }

  /**
   * @param message hex encoded string
   * @param signature hex encooded signature string
   * @param publicKey
   * return boolean, throws if any of the inputs are invalid
   */
  public verifySignature(message: string, signature: string, publicKey: string): boolean {
    if (!this.isValidHex(message)) {
      throw new UtilsError('message must be a hex encoded string');
    }
    if (!this.isValidSignature(signature)) {
      throw new UtilsError('invalid signature');
    }
    if (!this.isValidPublicKey(publicKey)) {
      throw new UtilsError('invalid public key');
    }
    try {
      return rippleKeypairs.verify(message, signature, publicKey);
    } catch (e) {
      return false;
    }
  }

  /**
   * Check the raw transaction has a valid format in the blockchain context, throw otherwise.
   *
   * @param {string} rawTransaction - Transaction in hex string format
   */
  public validateRawTransaction(rawTransaction: string): void {
    if (!rawTransaction) {
      throw new ParseTransactionError('Invalid raw transaction: Undefined');
    }
    if (!this.isValidHex(rawTransaction)) {
      throw new ParseTransactionError('Invalid raw transaction: Hex string expected');
    }
    if (!this.isValidRawTransaction(rawTransaction)) {
      throw new ParseTransactionError('Invalid raw transaction');
    }
  }

  /**
   * Checks if raw transaction can be deserialized
   *
   * @param {string} rawTransaction - transaction in base64 string format
   * @returns {boolean} - the validation result
   */
  public isValidRawTransaction(rawTransaction: string): boolean {
    try {
      const jsonTx = xrpl.decode(rawTransaction);
      xrpl.validate(jsonTx);
      return true;
    } catch (e) {
      return false;
    }
  }

  public isValidTransactionType(type: string): boolean {
    return XrpAllowedTransactionTypes[type] !== undefined;
  }

  public validateAmount(amount: string) {
    if (!_.isString(amount)) {
      throw new UtilsError(`amount type ${typeof amount} must be a string`);
    }
    if (!this.isValidNumber(amount)) {
      throw new UtilsError(`amount ${amount} is not valid`);
    }
  }

  isValidNumber(amount: string | number): boolean {
    const bigNumberAmount = new BigNumber(amount);
    return bigNumberAmount.isInteger() && bigNumberAmount.isGreaterThanOrEqualTo(0);
  }

  public validateAccountSetFlag(setFlag: number) {
    if (!this.isValidNumber(setFlag)) {
      throw new UtilsError(`setFlag ${setFlag} is not valid`);
    }
    if (!VALID_ACCOUNT_SET_FLAGS.includes(setFlag)) {
      throw new UtilsError(`setFlag ${setFlag} is not a valid account set flag`);
    }
  }

  public validateSequence(sequence: number): void {
    if (!_.isNumber(sequence)) {
      throw new UtilsError(`sequence type ${typeof sequence} must be a number`);
    }
    if (!this.isValidNumber(sequence)) {
      throw new UtilsError(`sequence ${sequence} is not valid`);
    }
  }

  public validateFee(fee: string): void {
    if (!_.isString(fee)) {
      throw new UtilsError(`fee type ${typeof fee} must be a string`);
    }
    if (!this.isValidNumber(fee)) {
      throw new UtilsError(`fee ${fee} is not valid`);
    }
  }

  public validateFlags(flags: number): void {
    if (!_.isNumber(flags)) {
      throw new UtilsError(`flags type ${typeof flags} must be a number`);
    }
    if (!this.isValidNumber(flags)) {
      throw new UtilsError(`flags ${flags} is not valid`);
    }
  }

  public validateSignerQuorum(quorum: number): void {
    if (!_.isNumber(quorum)) {
      throw new UtilsError(`quorum type ${typeof quorum} must be a number`);
    }
    if (!this.isValidNumber(quorum)) {
      throw new UtilsError(`quorum ${quorum} is not valid`);
    }
    if (quorum < MIN_SIGNER_QUORUM) {
      throw new UtilsError(`quorum ${quorum} must be 1 or greater`);
    }
  }

  public validateSigner(signer: SignerDetails): void {
    if (!signer.address) {
      throw new UtilsError('signer must have an address');
    }
    if (!this.isValidAddress(signer.address)) {
      throw new UtilsError(`signer address ${signer.address} is invalid`);
    }
    if (signer.weight && !this.isValidNumber(signer.weight)) {
      throw new UtilsError(`signer weight ${signer.weight} is not valid`);
    }
  }

  public isValidMessageKey(messageKey: string): boolean {
    return _.isString(messageKey);
  }

  public compareKeyUsingLowerCase(key1: string, key2: string): boolean {
    return key1.toLowerCase() === key2.toLowerCase();
  }
}
const utils = new Utils();

export default utils;
