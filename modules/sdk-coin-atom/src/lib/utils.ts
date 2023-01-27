import { BaseUtils, ParseTransactionError } from '@bitgo/sdk-core';
import BigNumber from 'bignumber.js';
import { thetaTestnetChainId } from './constants';
import { fromBase64, fromHex, toBase64 } from '@cosmjs/encoding';
import {
  DecodedTxRaw,
  decodeTxRaw,
  EncodeObject,
  makeAuthInfoBytes,
  makeSignDoc,
  Registry,
} from '@cosmjs/proto-signing';
import { AtomTransaction, GasFeeLimitData, MessageData } from './iface';
import { Coin, defaultRegistryTypes, SignerData } from '@cosmjs/stargate';
import { encodeSecp256k1Signature } from '@cosmjs/amino';
import { Secp256k1Signature } from '@cosmjs/crypto';
import { TxRaw, SignDoc } from 'cosmjs-types/cosmos/tx/v1beta1/tx';

export class Utils implements BaseUtils {
  /** @inheritdoc */
  isValidBlockId(hash: string): boolean {
    throw new Error('Method not implemented.');
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
    throw new Error('Method not implemented.');
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
  private getSequenceFromDecodedTx(decodedTx: DecodedTxRaw): number {
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

  getExplicitSignerDataFromDecodedTx(decodedTx: DecodedTxRaw): SignerData {
    const sequence = this.getSequenceFromDecodedTx(decodedTx);
    return {
      accountNumber: 100, // TODO - get this from tx data somehow
      sequence,
      chainId: thetaTestnetChainId, // TODO - figure out if we can get this from tx data
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
    // TODO - validate that this is a valid atom transaction class
    const register = new Registry(defaultRegistryTypes);
    const txBodyBytes = register.encodeTxBody(atomTransaction.sendMessages as any);
    console.log(register.decodeTxBody(txBodyBytes));
    const sequence = atomTransaction.explicitSignerData.sequence;
    const authInfoBytes = makeAuthInfoBytes(
      [{ pubkey, sequence }],
      atomTransaction.gasBudget.amount,
      atomTransaction.gasBudget.gas,
      undefined,
      undefined,
      undefined
    );
    return makeSignDoc(
      txBodyBytes,
      authInfoBytes,
      atomTransaction.explicitSignerData.chainId,
      atomTransaction.explicitSignerData.accountNumber
    );
  }

  createSignedTxRaw(pubkey: string, signDoc: SignDoc, signature: any): TxRaw {
    const signatureBytes = new Secp256k1Signature(fromHex(signature.r), fromHex(signature.s)).toFixedLength();
    const stdSignature = encodeSecp256k1Signature(fromHex(pubkey), signatureBytes);
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
}

const utils = new Utils();

export default utils;
