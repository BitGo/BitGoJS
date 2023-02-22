import { BaseUtils, NotImplementedError, ParseTransactionError, Signature } from '@bitgo/sdk-core';
import { encodeSecp256k1Pubkey, encodeSecp256k1Signature } from '@cosmjs/amino';
import { fromBase64, fromHex, toHex } from '@cosmjs/encoding';
import {
  DecodedTxRaw,
  decodePubkey,
  decodeTxRaw,
  EncodeObject,
  encodePubkey,
  makeAuthInfoBytes,
  makeSignDoc,
  Registry,
} from '@cosmjs/proto-signing';
import { Coin, defaultRegistryTypes } from '@cosmjs/stargate';
import BigNumber from 'bignumber.js';
import { AuthInfo, TxBody, TxRaw } from 'cosmjs-types/cosmos/tx/v1beta1/tx';
import { Any } from 'cosmjs-types/google/protobuf/any';
import { AtomTransaction, GasFeeLimitData, MessageData } from './iface';
import { KeyPair } from './keyPair';

export class Utils implements BaseUtils {
  private registry = new Registry([...defaultRegistryTypes]);

  /** @inheritdoc */
  isValidBlockId(hash: string): boolean {
    return this.validateBlake2b(hash);
  }

  /** @inheritdoc */
  isValidPrivateKey(key: string): boolean {
    try {
      new KeyPair({ prv: key });
      return true;
    } catch {
      return false;
    }
  }

  /** @inheritdoc */
  isValidPublicKey(key: string): boolean {
    try {
      new KeyPair({ pub: key });
      return true;
    } catch {
      return false;
    }
  }

  /** @inheritdoc */
  isValidSignature(signature: string): boolean {
    throw new NotImplementedError('isValidSignature not implemented');
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
    try {
      const decodedTx: DecodedTxRaw = this.getDecodedTxFromRawBase64(rawTransaction);
      if (decodedTx) {
        TxRaw.encode(
          TxRaw.fromPartial({
            bodyBytes: TxBody.encode(decodedTx.body).finish(),
            authInfoBytes: AuthInfo.encode(decodedTx.authInfo).finish(),
          })
        ).finish();
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
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
    const messageData: MessageData[] = [];
    for (const message of encodedMessages) {
      messageData.push({
        value: this.getMessageValueDataFromDecodedMessage(this.registry.decode(message)),
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

  getPublicKeyFromDecodedTx(decodedTx: DecodedTxRaw): string | undefined {
    return decodedTx.authInfo.signerInfos?.[0].publicKey?.value?.toString();
  }

  /**
   * Returns the array of MessageData[] from the decoded transaction
   * @param decodedTx
   */
  getMessageDataFromDecodedTx(decodedTx: DecodedTxRaw): MessageData[] {
    const encodedMessages = this.getEncodedMessagesFromDecodedTx(decodedTx);
    return this.getMessageDataFromEncodedMessages(encodedMessages);
  }

  createSignDocFromAtomTransaction(atomTransaction: AtomTransaction) {
    if (!atomTransaction.accountNumber) {
      throw new Error('accountNumber is required to create a sign doc');
    }
    if (!atomTransaction.chainId) {
      throw new Error('chainId is required to create a sign doc');
    }
    const txRaw = this.createTxRawFromAtomTransaction(atomTransaction);
    return makeSignDoc(txRaw.bodyBytes, txRaw.authInfoBytes, atomTransaction.chainId, atomTransaction.accountNumber);
  }

  createTxRawFromAtomTransaction(atomTransaction: AtomTransaction): TxRaw {
    if (!atomTransaction.publicKey) {
      throw new Error('publicKey is required to create a txRaw');
    }
    const encodedPublicKey: Any = encodePubkey(encodeSecp256k1Pubkey(fromHex(atomTransaction.publicKey)));
    const txBodyValue = {
      messages: atomTransaction.sendMessages as unknown as Any[],
    };
    const txBodyBytes = this.registry.encodeTxBody(txBodyValue);
    const sequence = atomTransaction.sequence;
    const authInfoBytes = makeAuthInfoBytes(
      [{ pubkey: encodedPublicKey, sequence }],
      atomTransaction.gasBudget.amount,
      atomTransaction.gasBudget.gas,
      undefined,
      undefined,
      undefined
    );
    return TxRaw.fromPartial({
      bodyBytes: txBodyBytes,
      authInfoBytes: authInfoBytes,
    });
  }

  createSignedTxRaw(signature: Signature, tx: { bodyBytes: Uint8Array; authInfoBytes: Uint8Array }): TxRaw {
    const stdSignature = encodeSecp256k1Signature(fromHex(signature.publicKey.pub), signature.signature);
    return TxRaw.fromPartial({
      bodyBytes: tx.bodyBytes,
      authInfoBytes: tx.authInfoBytes,
      signatures: [fromBase64(stdSignature.signature)],
    });
  }

  isSignedRawTx(rawTransaction: string): boolean {
    const decodedTx = this.getDecodedTxFromRawBase64(rawTransaction);
    if (decodedTx.signatures.length > 0) {
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
