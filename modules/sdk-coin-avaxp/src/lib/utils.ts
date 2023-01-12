import {
  isValidXpub,
  isValidXprv,
  NotImplementedError,
  BaseUtils,
  InvalidTransactionError,
  ParseTransactionError,
  Entry,
} from '@bitgo/sdk-core';
import { BinTools, BN, Buffer as BufferAvax } from 'avalanche';
import { NodeIDStringToBuffer } from 'avalanche/dist/utils';
import { ec } from 'elliptic';
import { AmountInput, AmountOutput, SelectCredentialClass, BaseTx as PVMBaseTx } from 'avalanche/dist/apis/platformvm';
import { Credential } from 'avalanche/dist/common/credentials';
import { KeyPair as KeyPairAvax } from 'avalanche/dist/apis/platformvm/keychain';
import { AvalancheNetwork } from '@bitgo/statics';
import { Signature, StandardTransferableInput, StandardTransferableOutput } from 'avalanche/dist/common';
import * as createHash from 'create-hash';
import { EVMOutput } from 'avalanche/dist/apis/evm';
import { ADDRESS_SEPARATOR, INPUT_SEPARATOR, Tx } from './iface';

export class Utils implements BaseUtils {
  public binTools = BinTools.getInstance();
  public cb58Decode = this.binTools.cb58Decode;
  public cb58Encode = this.binTools.cb58Encode;
  public stringToBuffer = this.binTools.stringToBuffer;
  public bufferToString = this.binTools.bufferToString;
  public NodeIDStringToBuffer = NodeIDStringToBuffer;
  public addressToString = this.binTools.addressToString;

  public includeIn(walletAddresses: string[], otxoOutputAddresses: string[]): boolean {
    return walletAddresses.map((a) => otxoOutputAddresses.includes(a)).reduce((a, b) => a && b, true);
  }

  /**
   * Checks if it is a valid address no illegal characters
   *
   * @param {string} address - address to be validated
   * @returns {boolean} - the validation result
   */
  /** @inheritdoc */
  isValidAddress(address: string | string[]): boolean {
    const addressArr: string[] = Array.isArray(address) ? address : address.split('~');

    for (const address of addressArr) {
      if (!this.isValidAddressRegex(address)) {
        return false;
      }
    }

    return true;
  }

  private isValidAddressRegex(address: string): boolean {
    return /^(^P||NodeID)-[a-zA-Z0-9]+$/.test(address);
  }

  /**
   * Checks if it is a valid blockId with length 66 including 0x
   *
   * @param {string} hash - blockId to be validated
   * @returns {boolean} - the validation result
   */
  /** @inheritdoc */
  isValidBlockId(hash: string): boolean {
    return this.binTools.isCB58(hash) && this.binTools.b58ToBuffer(hash).length === 36;
  }

  /**
   * Checks if the string is a valid protocol public key or
   * extended public key.
   *
   * @param {string} pub - the  public key to be validated
   * @returns {boolean} - the validation result
   */
  isValidPublicKey(pub: string): boolean {
    if (isValidXpub(pub)) return true;

    let pubBuf;
    if (pub.length === 50) {
      try {
        pubBuf = utils.binTools.cb58Decode(pub);
      } catch {
        return false;
      }
    } else {
      if (pub.length !== 66 && pub.length !== 130) return false;

      const firstByte = pub.slice(0, 2);

      // uncompressed public key
      if (pub.length === 130 && firstByte !== '04') return false;

      // compressed public key
      if (pub.length === 66 && firstByte !== '02' && firstByte !== '03') return false;

      if (!this.allHexChars(pub)) return false;

      pubBuf = BufferAvax.from(pub, 'hex');
    }
    // validate the public key
    const secp256k1 = new ec('secp256k1');
    try {
      const keyPair = secp256k1.keyFromPublic(pubBuf);
      const { result } = keyPair.validate();
      return result;
    } catch (e) {
      return false;
    }
  }

  public parseAddress = (pub: string): BufferAvax => this.binTools.stringToAddress(pub);

  /**
   * Returns whether or not the string is a valid protocol private key, or extended
   * private key.
   *
   * The protocol key format is described in the @stacks/transactions npm package, in the
   * createStacksPrivateKey function:
   * https://github.com/blockstack/stacks.js/blob/master/packages/transactions/src/keys.ts#L125
   *
   * @param {string} prv - the private key (or extended private key) to be validated
   * @returns {boolean} - the validation result
   */
  isValidPrivateKey(prv: string): boolean {
    if (isValidXprv(prv)) return true;

    if (prv.length !== 64 && prv.length !== 66) return false;

    if (prv.length === 66 && prv.slice(64) !== '01') return false;

    return this.allHexChars(prv);
  }

  /**
   * Returns whether or not the string is a composed of hex chars only
   *
   * @param {string} maybe - the  string to be validated
   * @returns {boolean} - the validation result
   */
  allHexChars(maybe: string): boolean {
    return /^(0x){0,1}([0-9a-f])+$/i.test(maybe);
  }

  /** @inheritdoc */
  isValidSignature(signature: string): boolean {
    throw new NotImplementedError('isValidSignature not implemented');
  }

  /** @inheritdoc */
  isValidTransactionId(txId: string): boolean {
    throw new NotImplementedError('isValidTransactionId not implemented');
  }

  getCredentials(tx: PVMBaseTx): Credential[] {
    return tx.getIns().map((ins) => SelectCredentialClass(ins.getInput().getCredentialID()));
  }

  /**
   * Avaxp wrapper to create signature and return it for credentials using Avalanche's buffer
   * @param network
   * @param message
   * @param prv
   * @return signature
   */
  createSignatureAvaxBuffer(network: AvalancheNetwork, message: BufferAvax, prv: BufferAvax): BufferAvax {
    const ky = new KeyPairAvax(network.hrp, network.networkID.toString());
    ky.importKey(prv);
    return ky.sign(message);
  }

  /**
   * Avaxp wrapper to create signature and return it for credentials
   * @param network
   * @param message
   * @param prv
   * @return signature
   */
  createSignature(network: AvalancheNetwork, message: Buffer, prv: Buffer): Buffer {
    return Buffer.from(this.createSignatureAvaxBuffer(network, BufferAvax.from(message), BufferAvax.from(prv)));
  }

  /**
   * Avaxp wrapper to verify signature using Avalanche's buffer
   * @param network
   * @param message
   * @param signature
   * @param prv
   * @return true if it's verify successful
   */
  verifySignatureAvaxBuffer(
    network: AvalancheNetwork,
    message: BufferAvax,
    signature: BufferAvax,
    prv: BufferAvax
  ): boolean {
    const ky = new KeyPairAvax(network.hrp, network.networkID.toString());
    ky.importKey(prv);
    return ky.verify(message, signature);
  }

  /**
   * Avaxp wrapper to verify signature
   * @param network
   * @param message
   * @param signature
   * @param prv
   * @return true if it's verify successful
   */
  verifySignature(network: AvalancheNetwork, message: Buffer, signature: Buffer, prv: Buffer): boolean {
    return this.verifySignatureAvaxBuffer(
      network,
      BufferAvax.from(message),
      BufferAvax.from(signature),
      BufferAvax.from(prv)
    );
  }

  createSig(sigHex: string): Signature {
    const sig = new Signature();
    sig.fromBuffer(BufferAvax.from(sigHex.padStart(130, '0'), 'hex'));
    return sig;
  }

  /**
   * Avaxp wrapper to recovery signature using Avalanche's buffer
   * @param network
   * @param message
   * @param signature
   * @return
   */
  recoverySignatureAvaxBuffer(network: AvalancheNetwork, message: BufferAvax, signature: BufferAvax): BufferAvax {
    const ky = new KeyPairAvax(network.hrp, network.networkID.toString());
    return ky.recover(message, signature);
  }

  /**
   * Avaxp wrapper to verify signature
   * @param network
   * @param message
   * @param signature
   * @return true if it's verify successful
   */
  recoverySignature(network: AvalancheNetwork, message: Buffer, signature: Buffer): Buffer {
    return Buffer.from(this.recoverySignatureAvaxBuffer(network, BufferAvax.from(message), BufferAvax.from(signature)));
  }

  sha256(buf: Uint8Array): Buffer {
    return createHash.default('sha256').update(buf).digest();
  }

  /**
   * Check the raw transaction has a valid format in the blockchain context, throw otherwise.
   * It's to reuse in TransactionBuilder and TransactionBuilderFactory
   *
   * @param rawTransaction Transaction as hex string
   */
  validateRawTransaction(rawTransaction: string): void {
    if (!rawTransaction) {
      throw new InvalidTransactionError('Raw transaction is empty');
    }
    if (!utils.allHexChars(rawTransaction)) {
      throw new ParseTransactionError('Raw transaction is not hex string');
    }
  }

  /**
   * Check if tx is for the blockchainId
   *
   * @param {Tx} tx
   * @param {string} blockchainId
   * @returns true if tx is for blockchainId
   */
  isTransactionOf(tx: Tx, blockchainId: string): boolean {
    return utils.cb58Encode(tx.getUnsignedTx().getTransaction().getBlockchainID()) === blockchainId;
  }

  /**
   * Return a mapper function to that network address representation.
   * @param network required to stringify addresses
   * @return mapper function
   */
  mapOutputToEntry(network: AvalancheNetwork): (o: StandardTransferableOutput) => Entry {
    return this.mapTransferableOutputToEntry(network.hrp, network.alias);
  }

  /**
   * Return a mapper function to that network address representation.
   * @param network required to stringify addresses
   * @return mapper function
   */
  mapTransferableOutputToEntry(hrp: string, alias: string): (o: StandardTransferableOutput) => Entry {
    return (output) => {
      const amountOutput = output.getOutput() as AmountOutput;
      const address = amountOutput
        .getAddresses()
        .map((a) => this.binTools.addressToString(hrp, alias, a))
        .sort()
        .join(ADDRESS_SEPARATOR);
      return {
        value: amountOutput.getAmount().toString(),
        address,
      };
    };
  }
  /**
   * Return a mapper function to that network address representation.
   * @param network required to stringify addresses
   * @return mapper function
   */
  mapEVMOutputToEntry(output: EVMOutput): Entry {
    return {
      // it should be evmOuput.getAmount(), but it returns a 0.
      value: new BN((output as any).amount).toString(),
      // C-Chain address.
      address: '0x' + output.getAddressString(),
    };
  }

  /**
   * Map Input to Entry.
   * @param {TransferableInput} input
   * @return {Entry} converted input
   */
  mapInputToEntry(address: string): (StandardTransferableInput) => Entry {
    return (input) => {
      const amountInput = input.getInput() as any as AmountInput;
      return {
        id: this.inputToId(input),
        address,
        value: amountInput.getAmount().toString(),
      } as Entry;
    };
  }

  inputToId(input: StandardTransferableInput): string {
    return (
      utils.binTools.cb58Encode(input.getTxID()) + INPUT_SEPARATOR + utils.outputidxBufferToNumber(input.getOutputIdx())
    );
  }
  /**
   * remove hex prefix (0x)
   * @param hex string
   * @returns hex without 0x
   */
  removeHexPrefix(hex: string): string {
    if (hex.startsWith('0x')) {
      return hex.substring(2);
    }
    return hex;
  }

  /**
   * Outputidx convert from number (as string) to buffer.
   * @param {string} outputidx number
   * @return {BufferAvax} buffer of size 4 with that number value
   */
  outputidxNumberToBuffer(outputidx: string): BufferAvax {
    return BufferAvax.from(Number(outputidx).toString(16).padStart(8, '0'), 'hex');
  }

  /**
   * Outputidx buffer to number (as string)
   * @param {BufferAvax} outputidx
   * @return {string} outputidx number
   */
  outputidxBufferToNumber(outputidx: BufferAvax): string {
    return parseInt(outputidx.toString('hex'), 16).toString();
  }
}

const utils = new Utils();

export default utils;
