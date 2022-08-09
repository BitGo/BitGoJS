import assert from 'assert';
import { randomBytes } from 'crypto';
import * as BLS from '@bitgo/bls-dkg';
import { BaseKeyPair } from './baseKeyPair';
import { AddressFormat } from './enum';
import { NotImplementedError } from './errors';
import { BlsKeys, KeyPairOptions, isDkg, isBlsKey, isPrivateKey } from './iface';
import { isValidBLSPublicKey, isValidBLSPrivateKey, bigIntToHex } from '../util/crypto';

const DEFAULT_SIGNATURE_THRESHOLD = 2;
const DEFAULT_SIGNATURE_PARTICIPANTS = 3;

/**
 * Base class for BLS keypairs.
 */
export abstract class BlsKeyPair implements BaseKeyPair {
  protected keyPair: BlsKeys;

  /**
   * Public constructor. By default, creates a key pair with a random polynomial.
   *
   * @param {KeyPairOptions} source Either a dkg options, a public and secret shares, or a private key
   */
  protected constructor(source?: KeyPairOptions) {
    if (!source) {
      this.createShares(DEFAULT_SIGNATURE_THRESHOLD, DEFAULT_SIGNATURE_PARTICIPANTS);
    } else if (isDkg(source)) {
      this.createShares(source.threshold, source.participants);
    } else if (isBlsKey(source)) {
      assert(source.secretShares.every(isValidBLSPrivateKey), 'Invalid private keys');
      assert(isValidBLSPublicKey(source.publicShare), 'Invalid public key');
      this.keyPair = source;
    } else if (isPrivateKey(source)) {
      this.keyPair = {
        prv: source.prv,
        publicShare: '',
        secretShares: [],
        seed: '',
        chaincode: '',
      };
    } else {
      throw new Error('Invalid key pair options');
    }
  }

  createShares(threshold: number, participants: number): void {
    if (participants < threshold) {
      throw new Error('Participants should be greater than threshold');
    }
    const polynomial = BLS.generatePolynomial(threshold);
    const keySecretShares = BLS.secretShares(polynomial, participants);
    const keyPublicShare = BLS.publicShare(polynomial);
    this.keyPair = {
      seed: bigIntToHex(polynomial[0], 64),
      chaincode: randomBytes(32).toString('hex'),
      secretShares: keySecretShares.map((secretShare) => bigIntToHex(secretShare, 64)),
      publicShare: bigIntToHex(keyPublicShare),
    };
  }

  /**
   * Note - this is not possible using BLS. BLS does not support prvkey derived key gen
   *
   * @param {string[]} prv a hexadecimal private key
   */
  recordKeysFromPrivateKey(prv: string): void {
    throw new NotImplementedError('Private key derivation is not supported in bls');
  }

  /**
   * Note - this is not possible using BLS. BLS does not support pubkey derived key gen
   *
   * @param {string} pub - An extended, compressed, or uncompressed public key
   */
  recordKeysFromPublicKey(pub: string): void {
    throw new NotImplementedError('Public key derivation is not supported in bls');
  }

  getAddress(format?: AddressFormat): string {
    throw new NotImplementedError('getAddress not implemented');
  }

  getKeys(): any {
    throw new NotImplementedError('getKeys not implemented');
  }

  /**
   * Signs bytes using the key pair
   *
   * @param msg The message bytes to sign
   * @return signature of the bytes using this keypair
   */
  async sign(msg: Buffer): Promise<string> {
    if (this.keyPair.prv) {
      const signedMessage = await BLS.sign(msg, BigInt('0x' + this.keyPair.prv));
      return '0x' + bigIntToHex(signedMessage);
    }
    throw new Error('Missing private key');
  }

  public static keyDerive(seed: string, pk: string, chaincode: string, path: string): BlsKeys {
    const seedBI = BigInt('0x' + seed);
    const pkBI = BigInt('0x' + pk);
    const chaincodeBI = BigInt('0x' + chaincode);
    const childKey = BLS.privateDerive(seedBI, pkBI, chaincodeBI, path);
    const childChaincode = bigIntToHex(childKey.chaincode);
    const entropy = BigInt('0x' + randomBytes(32).toString('hex'));
    const secretShares = BLS.secretShares([childKey.sk, entropy], DEFAULT_SIGNATURE_PARTICIPANTS);
    const publicShare = BLS.publicShare([childKey.sk]);
    return {
      seed,
      chaincode: childChaincode,
      secretShares: secretShares.map((secretShare) => bigIntToHex(secretShare)),
      publicShare: bigIntToHex(publicShare),
    };
  }

  /**
   * Aggregates the secret shares of different key pairs into one private key
   *
   * @param prvKeys an array of secret shares
   * @returns a private key
   */
  public static aggregatePrvkeys(prvKeys: string[]): string {
    assert(prvKeys.every(isValidBLSPrivateKey), 'Invalid private keys');
    try {
      const secretShares = prvKeys.map((secretShare) => BigInt('0x' + secretShare));
      const prv = BLS.mergeSecretShares(secretShares);
      return bigIntToHex(prv);
    } catch (e) {
      throw new Error('Error aggregating prvkeys: ' + e);
    }
  }

  /**
   * Aggregates the public shares of different key pairs into a common public key
   *
   * @param pubKeys an array of public shares
   * @returns a common public key
   */
  public static aggregatePubkeys(pubKeys: string[]): string {
    try {
      const publicShares = pubKeys.map((publicShare) => BigInt('0x' + publicShare));
      const commonPubKey = BLS.mergePublicShares(publicShares);
      return bigIntToHex(commonPubKey);
    } catch (e) {
      throw new Error('Error aggregating pubkeys: ' + e);
    }
  }

  public static aggregateChaincodes(chaincodeContributions: string[]): string {
    try {
      const chaincodes = chaincodeContributions.map((chaincode) => BigInt('0x' + chaincode));
      const commonChaincode = BLS.mergeChaincodes(chaincodes);
      return bigIntToHex(commonChaincode, 64);
    } catch (e) {
      throw new Error('Error aggregating chaincodes: ' + e);
    }
  }

  /**
   * Aggregates the message signed by different key pairs into one sign
   *
   * @param signatures the message signed by different key pairs. The signer id is relevant to ensure a valid signature.
   * @example <caption> E.g., the message is signed by user and wallet, then signatures would be:</caption>
   * {
   *   1: BigInt(messageSignedWithUserPrv),
   *   3: BigInt(messageSignedWithWalletPrv),
   * }
   * @returns a signature combining all the provided signed messages
   */
  public static aggregateSignatures(signatures: { [n: number]: bigint }): string {
    try {
      const signature = BLS.mergeSignatures(signatures);
      return '0x' + bigIntToHex(signature);
    } catch (e) {
      throw new Error('Error aggregating signatures: ' + e);
    }
  }

  /**
   * Verifies the signature for this key pair
   * @param pub The public key with which to verify the signature
   * @param msg The message to verify the signature with
   * @param signature the signature to verify
   * @return true if the signature is valid, else false
   */
  public static async verifySignature(pub: string, msg: Buffer, signature: string): Promise<boolean> {
    assert(isValidBLSPublicKey(pub), `Invalid public key: ${pub}`);
    return await BLS.verify(BigInt(signature), msg, BigInt('0x' + pub));
  }
}
