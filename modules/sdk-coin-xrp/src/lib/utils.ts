import {
  BaseUtils,
  InvalidAddressError,
  InvalidTransactionError,
  UnsupportedTokenError,
  UtilsError,
} from '@bitgo/sdk-core';
import { BaseCoin, coins, XrpCoin } from '@bitgo/statics';
import * as querystring from 'querystring';
import * as rippleKeypairs from 'ripple-keypairs';
import * as url from 'url';
import * as xrpl from 'xrpl';
import { Amount, IssuedCurrencyAmount } from 'xrpl';
import { VALID_ACCOUNT_SET_FLAGS } from './constants';
import { Address, SignerDetails } from './iface';
import { KeyPair as XrpKeyPair } from './keyPair';
import assert from 'assert';

class Utils implements BaseUtils {
  isValidAddress(address: string): boolean {
    try {
      const addressDetails = this.getAddressDetails(address);
      return address === this.normalizeAddress(addressDetails);
    } catch (e) {
      return false;
    }
  }

  isValidTransactionId(txId: string): boolean {
    return this.isValidHex(txId);
  }

  isValidPublicKey(key: string): boolean {
    try {
      new XrpKeyPair({ pub: key });
      return true;
    } catch {
      return false;
    }
  }

  isValidPrivateKey(key: string): boolean {
    try {
      new XrpKeyPair({ prv: key });
      return true;
    } catch {
      return false;
    }
  }

  isValidSignature(signature: string): boolean {
    return this.isValidHex(signature);
  }

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
    if (typeof address !== 'string') {
      throw new InvalidAddressError('invalid address, expected string');
    }
    if (typeof destinationTag === 'undefined' || destinationTag === null) {
      return address;
    }
    if (!Number.isInteger(destinationTag)) {
      throw new InvalidAddressError('invalid destination tag, expected integer');
    }
    if (destinationTag > 0xffffffff || destinationTag < 0) {
      throw new InvalidAddressError('destination tag out of range');
    }
    return `${address}?dt=${destinationTag}`;
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
      throw new InvalidTransactionError('Invalid raw transaction: Undefined');
    }
    if (!this.isValidHex(rawTransaction)) {
      throw new InvalidTransactionError('Invalid raw transaction: Hex string expected');
    }
    if (!this.isValidRawTransaction(rawTransaction)) {
      throw new InvalidTransactionError('Invalid raw transaction');
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

  public validateAccountSetFlag(setFlag: number) {
    if (typeof setFlag !== 'number') {
      throw new UtilsError(`setFlag ${setFlag} is not valid`);
    }
    if (!VALID_ACCOUNT_SET_FLAGS.includes(setFlag)) {
      throw new UtilsError(`setFlag ${setFlag} is not a valid account set flag`);
    }
  }

  public validateSigner(signer: SignerDetails): void {
    if (!signer.address) {
      throw new UtilsError('signer must have an address');
    }
    if (!this.isValidAddress(signer.address)) {
      throw new UtilsError(`signer address ${signer.address} is invalid`);
    }
    if (typeof signer.weight !== 'number' || signer.weight < 0) {
      throw new UtilsError(`signer weight ${signer.weight} is not valid`);
    }
  }

  /**
   * Determines if the provided `amount` is for a token payment
   */
  public isIssuedCurrencyAmount(amount: Amount): amount is IssuedCurrencyAmount {
    return (
      !!amount &&
      typeof amount === 'object' &&
      typeof amount.currency === 'string' &&
      typeof amount.issuer === 'string' &&
      typeof amount.value === 'string'
    );
  }

  /**
   * Get the associated XRP Currency details from token name. Throws an error if token is unsupported
   * @param {string} tokenName - The token name
   */
  public getXrpCurrencyFromTokenName(tokenName: string): xrpl.IssuedCurrency {
    if (!coins.has(tokenName)) {
      throw new UnsupportedTokenError(`${tokenName} is not supported`);
    }
    const token = coins.get(tokenName);
    if (!token.isToken || !(token instanceof XrpCoin)) {
      throw new UnsupportedTokenError(`${tokenName} is not an XRP token`);
    }
    return {
      currency: token.currencyCode,
      issuer: token.issuerAddress,
    };
  }

  /**
   * Decodes a serialized XRPL transaction.
   *
   * @param {string} txHex - The serialized transaction in hex.
   * @returns {Object} - Decoded transaction object.
   * @throws {Error} - If decoding fails or input is invalid.
   */
  public decodeTransaction(txHex: string) {
    if (typeof txHex !== 'string' || txHex.trim() === '') {
      throw new Error('Invalid transaction hex. Expected a non-empty string.');
    }
    try {
      return xrpl.decode(txHex);
    } catch (error) {
      throw new Error(`Failed to decode transaction: ${error.message}`);
    }
  }

  /**
   * Get the statics coin object matching a given Xrp token issuer address and currency code if it exists
   *
   * @param issuerAddress The token issuer address to match against
   * @param currencyCode The token currency code to match against
   * @returns statics BaseCoin object for the matching token
   */
  public getXrpToken(issuerAddress, currencyCode): Readonly<BaseCoin> | undefined {
    const tokens = coins.filter((coin) => {
      if (coin instanceof XrpCoin) {
        return coin.issuerAddress === issuerAddress && coin.currencyCode === currencyCode;
      }
      return false;
    });
    const tokensArray = tokens.map((token) => token);
    if (tokensArray.length >= 1) {
      // there should never be two tokens with the same issuer address and currency code, so we assert that here
      assert(tokensArray.length === 1);
      return tokensArray[0];
    }
    return undefined;
  }
}

const utils = new Utils();

export default utils;
