import { BaseUtils, ParseTransactionError, Signature } from '@bitgo/sdk-core';
import BigNumber from 'bignumber.js';
import { fromBase64, fromHex, toBase64, toHex } from '@cosmjs/encoding';
import {
  DecodedTxRaw,
  decodePubkey,
  decodeTxRaw,
  EncodeObject,
  makeAuthInfoBytes,
  makeSignDoc,
  Registry,
} from '@cosmjs/proto-signing';
import { AtomTransaction, GasFeeLimitData, MessageData } from './iface';
import { Coin, defaultRegistryTypes } from '@cosmjs/stargate';
import { encodeSecp256k1Signature } from '@cosmjs/amino';
import { TxRaw, SignDoc } from 'cosmjs-types/cosmos/tx/v1beta1/tx';
import { Any } from 'cosmjs-types/google/protobuf/any';

export class Utils implements BaseUtils {
  /** @inheritdoc */
  isValidBlockId(hash: string): boolean {
    return this.validateBlake2b(hash);
  }

  /** @inheritdoc */
  isValidPrivateKey(key: string): boolean {
    throw new Error('Method not implemented.');
  }

  /** @inheritdoc */
  isValidPublicKey(key: string): boolean {
    throw new Error('Method not implemented.');
  }

  /** @inheritdoc */
  isValidSignature(signature: string): boolean {
    throw new Error('Method not implemented.');
  }

  /** @inheritdoc */
  isValidTransactionId(txId: string): boolean {
    return this.validateBlake2b(txId);
  }

  validateBlake2b(hash: string): boolean {
    if (hash?.length !== 64) {
      return false;
    }
    return hash.match(/^[a-zA-Z0-9]+$/) !== null;
  }
  /**
   * Checks if raw transaction can be deserialized
   *
   * @param {string} rawTransaction - transaction in base64 string format
   * @returns {boolean} - the validation result
   */
  isValidRawTransaction(rawTransaction: string): boolean {
    throw new Error('Method not implemented.');
  }

  /**
   * Check the raw transaction has a valid format in the blockchain context, throw otherwise.
   *
   * @param {string} rawTransaction - Transaction in base64 string  format
   */
  validateRawTransaction(rawTransaction: string): void {
    if (!rawTransaction) {
      throw new ParseTransactionError('Invalid raw transaction: Undefined');
    }
    if (!this.isValidRawTransaction(rawTransaction)) {
      throw new ParseTransactionError('Invalid raw transaction');
    }
  }

  isValidAddress(address: string): boolean {
    const allowed_chars = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';
    const atomRegex = '^(cosmos)1([' + allowed_chars + ']+)$';
    const re = new RegExp(atomRegex);
    return re.test(address);
  }

  /**
   * Returns whether or not the string is a valid amount
   *
   * @param {number[]} amounts - the amounts to validate
   * @returns {boolean} - the validation result
   */
  isValidAmounts(amounts: number[]): boolean {
    for (const amount of amounts) {
      if (!this.isValidAmount(amount)) {
        return false;
      }
    }
    return true;
  }

  isValidAmount(amount: number): boolean {
    const bigNumberAmount = new BigNumber(amount);
    if (!bigNumberAmount.isInteger() || bigNumberAmount.isLessThanOrEqualTo(0)) {
      return false;
    }
    return true;
  }

  /**
   * Decodes raw tx data into messages, signing info, and fee data
   * @param txHex - raw base64 tx
   */
  getDecodedTxFromRawBase64(txRaw: string): DecodedTxRaw {
    return decodeTxRaw(fromBase64(txRaw));
  }

  /**
   * Returns the array of messages in the body of the decoded transaction
   * @param decodedTx
   */
  private getEncodedMessagesFromDecodedTx(decodedTx: DecodedTxRaw): EncodeObject[] {
    return decodedTx.body.messages;
  }

  /**
   * Arranges a decoded message into our MessageData value interface
   * @param decodedMessage
   * @private
   */
  private getMessageValueDataFromDecodedMessage(decodedMessage: any): any {
    return {
      fromAddress: decodedMessage.fromAddress,
      toAddress: decodedMessage.toAddress,
      amount: decodedMessage.amount,
    };
  }

  /**
   * Returns an array of MessageData[] from an encoded messages array
   * @param encodedMessages
   * @private
   */
  private getMessageDataFromEncodedMessages(encodedMessages: EncodeObject[]): MessageData[] {
    const registry = new Registry(defaultRegistryTypes);
    const messageData: MessageData[] = [];
    for (const message of encodedMessages) {
      messageData.push({
        value: this.getMessageValueDataFromDecodedMessage(registry.decode(message)),
        typeUrl: message.typeUrl,
      });
    }
    return messageData;
  }

  /**
   * Pulls the sequence number from a DecodedTxRaw AuthInfo property
   * @param decodedTx
   * @private
   */
  getSequenceFromDecodedTx(decodedTx: DecodedTxRaw): number {
    return Number(decodedTx.authInfo.signerInfos[0].sequence);
  }

  /**
   * Pulls the typeUrl from the encoded message of a DecodedTxRaw
   * @param decodedTx
   */
  getTypeUrlFromDecodedTx(decodedTx: DecodedTxRaw): string {
    const encodedMessage = this.getEncodedMessagesFromDecodedTx(decodedTx)[0];
    return encodedMessage.typeUrl;
  }

  getGasBudgetFromDecodedTx(decodedTx: DecodedTxRaw): GasFeeLimitData {
    return {
      amount: decodedTx.authInfo.fee?.amount as Coin[],
      gas: Number(decodedTx.authInfo.fee?.gasLimit),
    };
  }

  /**
   * Returns the array of MessageData[] from the decoded transaction
   * @param decodedTx
   */
  getMessageDataFromDecodedTx(decodedTx: DecodedTxRaw): MessageData[] {
    const encodedMessages = this.getEncodedMessagesFromDecodedTx(decodedTx);
    return this.getMessageDataFromEncodedMessages(encodedMessages);
  }

  createSignDocFromAtomTransaction(pubkey: any, atomTransaction: AtomTransaction) {
    const register = new Registry(defaultRegistryTypes);
    const txBodyValue = {
      messages: atomTransaction.sendMessages as unknown as Any[],
    };
    const txBodyBytes = register.encodeTxBody(txBodyValue);
    const sequence = atomTransaction.sequence;
    const authInfoBytes = makeAuthInfoBytes(
      [{ pubkey, sequence }],
      atomTransaction.gasBudget.amount,
      atomTransaction.gasBudget.gas,
      undefined,
      undefined,
      undefined
    );
    // Ignoring linting because makeSignDoc expects string/number inputs but are null for our purposes
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return makeSignDoc(txBodyBytes, authInfoBytes, null, null);
  }

  createSignedTxRaw(atomSignature: Signature, signDoc: SignDoc): TxRaw {
    console.log('atom sig at this point: ' + atomSignature.signature);
    console.log('hex of that signature: ' + atomSignature.signature.toString('hex'));
    const stdSignature = encodeSecp256k1Signature(fromHex(atomSignature.publicKey.pub), atomSignature.signature);
    console.log('stdSig: ' + stdSignature.signature);
    return TxRaw.fromPartial({
      bodyBytes: signDoc.bodyBytes,
      authInfoBytes: signDoc.authInfoBytes,
      signatures: [fromBase64(stdSignature.signature)],
    });
  }

  createBase64SignedTxBytesFromSignedTxRaw(signedTxRaw: TxRaw): string {
    const signedTxBytes = TxRaw.encode(signedTxRaw).finish();
    return toBase64(signedTxBytes);
  }

  isSignedRawTx(rawTransaction: string): boolean {
    // if (!this.isValidRawTransaction(rawTransaction)) {
    //   return false;
    // }
    const decodedTx = this.getDecodedTxFromRawBase64(rawTransaction);
    if (decodedTx.authInfo.signerInfos.length > 0) {
      return true;
    }
    return false;
  }

  getSignerInfoFromRawSignedTx(rawTransaction: string) {
    if (!this.isSignedRawTx(rawTransaction)) {
      throw new Error('getSignerInfoFromRawTx failed, raw tx is not signed');
    }
    const decodedTx = this.getDecodedTxFromRawBase64(rawTransaction);
    const aminoPubKey = decodedTx.authInfo.signerInfos[0].publicKey as Any;
    const decodedPubKeyHex = toHex(fromBase64(decodePubkey(aminoPubKey)?.value));
    const pubKey = {
      pub: decodedPubKeyHex,
    };
    const signature = Buffer.from(decodedTx.signatures[0]);
    return { pubKey, signature };
  }
}

const utils = new Utils();

export default utils;
