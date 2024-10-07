import { BaseUtils, InvalidAddressError, UtilsError } from '@bitgo/sdk-core';
import * as querystring from 'querystring';
import * as rippleKeypairs from 'ripple-keypairs';
import * as url from 'url';
import * as xrpl from 'xrpl';
import { Address } from './iface';
import { KeyPair as XrpKeyPair } from './keyPair';

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
}

const utils = new Utils();

export default utils;
