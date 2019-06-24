/**
 * @prettier
 */
import { BaseCoin } from '../baseCoin';
import { BigNumber } from 'bignumber.js';
import * as crypto from 'crypto';
import * as utxoLib from 'bitgo-utxo-lib';
import * as url from 'url';
import * as querystring from 'querystring';
import * as _ from 'lodash';
import { InvalidAddressError, UnexpectedAddressError } from '../../errors';

const EOS_ADDRESS_LENGTH = 12;

interface KeyPair {
  pub: string;
  prv: string;
}

interface AddressDetails {
  address: string;
  memoId: string;
}

export class Eos extends BaseCoin {
  static createInstance(bitgo: any): BaseCoin {
    return new Eos(bitgo);
  }

  getChain(): string {
    return 'eos';
  }

  getFamily(): string {
    return 'eos';
  }

  getFullName(): string {
    return 'EOS';
  }

  getBaseFactor(): number {
    return 1e4;
  }

  /**
   * Flag for sending value of 0
   * @returns {boolean} True if okay to send 0 value, false otherwise
   */
  valuelessTransferAllowed(): boolean {
    return true;
  }

  /**
   * Generate secp256k1 key pair
   *
   * @param seed - Seed from which the new keypair should be generated, otherwise a random seed is used
   */
  generateKeyPair(seed?: Buffer): KeyPair {
    if (!seed) {
      // An extended private key has both a normal 256 bit private key and a 256
      // bit chain code, both of which must be random. 512 bits is therefore the
      // maximum entropy and gives us maximum security against cracking.
      seed = crypto.randomBytes(512 / 8);
    }
    const extendedKey = utxoLib.HDNode.fromSeedBuffer(seed);
    const xpub = extendedKey.neutered().toBase58();
    return {
      pub: xpub,
      prv: extendedKey.toBase58(),
    };
  }

  /**
   * Return boolean indicating whether input is valid public key for the coin.
   *
   * @param pub - the pub to be checked
   */
  isValidPub(pub: string): boolean {
    try {
      utxoLib.HDNode.fromBase58(pub);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Return boolean indicating whether input is valid seed for the coin
   *
   * @param prv - the prv to be checked
   */
  isValidPrv(prv: string): boolean {
    try {
      utxoLib.HDNode.fromBase58(prv);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Evaluates whether a memo is valid
   *
   * @param memo - the memo to be checked
   */
  isValidMemo(memo: string): boolean {
    return memo && memo.length <= 256;
  }

  /**
   * Return boolean indicating whether a memo id is valid
   *
   * @param memoId - the memo id to be checked
   */
  isValidMemoId(memoId: string): boolean {
    if (!this.isValidMemo(memoId)) {
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

  /**
   * Process address into address and memo id
   * @param address - the address
   */
  getAddressDetails(address: string): AddressDetails {
    const destinationDetails = url.parse(address);
    const queryDetails = querystring.parse(destinationDetails.query);
    const destinationAddress = destinationDetails.pathname;

    // EOS addresses have to be "human readable", which means start with a letter, up to 12 characters and only a-z1-5., i.e.mtoda1.bitgo
    // source: https://developers.eos.io/eosio-cpp/docs/naming-conventions
    if (!/^[a-z][a-z1-5.]*$/.test(destinationAddress) || destinationAddress.length > EOS_ADDRESS_LENGTH) {
      throw new InvalidAddressError(`invalid address: ${address}`);
    }

    // address doesn't have a memo id
    if (destinationDetails.pathname === address) {
      return {
        address: address,
        memoId: null,
      };
    }

    if (!queryDetails.memoId) {
      // if there are more properties, the query details need to contain the memoId property
      throw new InvalidAddressError(`invalid property in address: ${address}`);
    }

    if (Array.isArray(queryDetails.memoId) && queryDetails.memoId.length !== 1) {
      // valid addresses can only contain one memo id
      throw new InvalidAddressError(`invalid address '${address}', must contain exactly one memoId`);
    }

    const [memoId] = _.castArray(queryDetails.memoId);
    if (!this.isValidMemoId(memoId)) {
      throw new InvalidAddressError(`invalid address: '${address}', memoId is not valid`);
    }

    return {
      address: destinationAddress,
      memoId,
    };
  }

  /**
   * Validate and return address with appended memo id
   *
   * @param address
   * @param memoId
   */
  normalizeAddress({ address, memoId }: AddressDetails): string {
    if (this.isValidMemoId(memoId)) {
      return `${address}?memoId=${memoId}`;
    }
    return address;
  }

  /**
   * Return boolean indicating whether input is valid public key for the coin
   *
   * @param address - the address to be checked
   */
  isValidAddress(address: string): boolean {
    try {
      const addressDetails = this.getAddressDetails(address);
      return address === this.normalizeAddress(addressDetails);
    } catch (e) {
      return false;
    }
  }

  /**
   * Check if address is a valid EOS address, then verify it matches the root address.
   *
   * @param address - the address to verify
   * @param rootAddress - the wallet's root address
   */
  verifyAddress({ address, rootAddress }: { address: string; rootAddress: string }): void {
    if (!this.isValidAddress(address)) {
      throw new InvalidAddressError(`invalid address: ${address}`);
    }

    const addressDetails = this.getAddressDetails(address);
    const rootAddressDetails = this.getAddressDetails(rootAddress);

    if (addressDetails.address !== rootAddressDetails.address) {
      throw new Error(`address validation failure: ${addressDetails.address} vs ${rootAddressDetails.address}`);
    }
  }
}
