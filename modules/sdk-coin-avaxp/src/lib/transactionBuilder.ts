import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { BuildTransactionError } from '@bitgo/sdk-core';
import { Transaction } from './transaction';
import { BN, Buffer as BufferAvax } from 'avalanche';
import utils from './utils';
import { DecodedUtxoObj, SECP256K1_Transfer_Output } from './iface';
import {
  SECPTransferInput,
  SECPTransferOutput,
  SelectCredentialClass,
  TransferableInput,
  TransferableOutput,
} from 'avalanche/dist/apis/platformvm';
import { SignerTransactionBuilder } from './signerTransactionBuilder';
import { Credential } from 'avalanche/dist/common';

export abstract class TransactionBuilder extends SignerTransactionBuilder {
  protected recoverSigner = false;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    this.buildAvaxpTransaction();
    return super.buildImplementation();
  }

  /**
   * Builds the avaxp transaction. transaction field is changed.
   */
  protected abstract buildAvaxpTransaction(): void;

  // region Getters and Setters
  /**
   * When using recovery key must be set here
   * TODO: STLX-17317 recovery key signing
   * @param {boolean} true if it's recovery signer, default true.
   */
  public recoverMode(recoverSigner = true): this {
    this.recoverSigner = recoverSigner;
    return this;
  }

  /**
   * Threshold is an int that names the number of unique signatures required to spend the output.
   * Must be less than or equal to the length of Addresses.
   * @param {number}
   */
  threshold(value: number): this {
    this.validateThreshold(value);
    this.transaction._threshold = value;
    return this;
  }

  /**
   * Locktime is a long that contains the unix timestamp that this output can be spent after.
   * The unix timestamp is specific to the second.
   * @param value
   */
  locktime(value: string | number): this {
    this.validateLocktime(new BN(value));
    this.transaction._locktime = new BN(value);
    return this;
  }

  /**
   * fromPubKey is a list of unique addresses that correspond to the private keys that can be used to spend this output.
   * @param {string | stirng[]} senderPubKey
   * @deprecated
   * {@see sender}
   */
  fromPubKey(senderPubKey: string | string[]): this {
    const pubKeys = senderPubKey instanceof Array ? senderPubKey : [senderPubKey];
    this.transaction._sender = pubKeys.map(utils.parseAddress);
    return this;
  }

  /**
   * fromPubKey is a list of unique addresses that correspond to the private keys that can be used to spend this output.
   * @param {string | stirng[]} senderPubKey
   */
  sender(senderPubKey: string | string[]): this {
    const pubKeys = senderPubKey instanceof Array ? senderPubKey : [senderPubKey];
    this.transaction._sender = pubKeys.map(utils.parseAddress);
    return this;
  }

  /**
   * List of UTXO required as inputs.
   * A UTXO is a standalone representation of a transaction output.
   *
   * @param {DecodedUtxoObj[]} list of UTXOS
   */
  utxos(value: DecodedUtxoObj[]): this {
    this.validateUtxos(value);
    this.transaction._utxos = value;
    return this;
  }
  /**
   *
   * @param value Optional Buffer for the memo
   * @returns value Buffer for the memo
   * set using Buffer.from("message")
   */
  memo(value: string): this {
    this.transaction._memo = utils.stringToBuffer(value);
    return this;
  }
  // endregion
  // region utxo engine
  /**
   * Threshold must be 2 and since output always get reordered we want to make sure we can always add signatures in the correct location
   * To find the correct location for the signature, we use the output's addresses to create the signatureIdx in the order that we desire
   * 0: user key, 1: hsm key, 2: recovery key
   * @protected
   */
  protected createInput(): {
    inputs: TransferableInput[];
    credentials: Credential[];
    amount: BN;
  } {
    const inputs: TransferableInput[] = [];

    // amount spent so far
    let currentTotal: BN = new BN(0);

    const credentials: Credential[] = [];

    /*
    A = user key
    B = hsm key
    C = backup key
    bitgoAddresses = bitgo addresses [ A, B, C ]
    utxo.addresses = IMS addresses [ B, C, A ]
    utxo.addressesIndex = [ 2, 0, 1 ]
    we pick 0, 1 for non-recovery
    we pick 1, 2 for recovery
    */
    this.transaction._utxos.forEach((utxo) => {
      // in WP, output.addressesIndex is empty, so fill it
      if (!utxo.addressesIndex || utxo.addressesIndex.length === 0) {
        const utxoAddresses: BufferAvax[] = utxo.addresses.map((a) => utils.parseAddress(a));
        utxo.addressesIndex = this.transaction._sender.map((a) => utxoAddresses.findIndex((u) => a.equals(u)));
      }
      // in OVC, output.addressesIndex is defined correctly from the previous iteration
    });

    // validate the utxos
    this.transaction._utxos.forEach((utxo) => {
      if (!utxo) {
        throw new BuildTransactionError('Utxo is undefined');
      }
      // addressesIndex should never have a mismatch
      if (utxo.addressesIndex?.includes(-1)) {
        throw new BuildTransactionError('Addresses are inconsistent: ' + utxo.txid);
      }
      if (utxo.threshold !== this.transaction._threshold) {
        throw new BuildTransactionError('Threshold is inconsistent');
      }
    });

    this.transaction._utxos.forEach((utxo, i) => {
      if (utxo.outputID === SECP256K1_Transfer_Output) {
        const txidBuf = utils.cb58Decode(utxo.txid);
        const amt: BN = new BN(utxo.amount);
        const outputidx = utils.cb58Decode(utxo.outputidx);
        const addressesIndex = utxo.addressesIndex ?? [];

        // either user (0) or recovery (2)
        const firstIndex = this.recoverSigner ? 2 : 0;
        const bitgoIndex = 1;
        currentTotal = currentTotal.add(amt);

        const secpTransferInput = new SECPTransferInput(amt);

        // if user/backup > bitgo
        if (addressesIndex[bitgoIndex] < addressesIndex[firstIndex]) {
          secpTransferInput.addSignatureIdx(addressesIndex[bitgoIndex], this.transaction._sender[bitgoIndex]);
          secpTransferInput.addSignatureIdx(addressesIndex[firstIndex], this.transaction._sender[firstIndex]);
          credentials.push(
            SelectCredentialClass(
              secpTransferInput.getCredentialID(), // 9
              ['', this.transaction._sender[firstIndex].toString('hex')].map(utils.createSig)
            )
          );
        } else {
          secpTransferInput.addSignatureIdx(addressesIndex[firstIndex], this.transaction._sender[firstIndex]);
          secpTransferInput.addSignatureIdx(addressesIndex[bitgoIndex], this.transaction._sender[bitgoIndex]);
          credentials.push(
            SelectCredentialClass(
              secpTransferInput.getCredentialID(),
              [this.transaction._sender[firstIndex].toString('hex'), ''].map(utils.createSig)
            )
          );
        }

        const input: TransferableInput = new TransferableInput(
          txidBuf,
          outputidx,
          this.transaction._assetId,
          secpTransferInput
        );
        inputs.push(input);
      }
    });

    return {
      inputs,
      credentials,
      amount: currentTotal,
    };
  }

  /**
   * Create the StakeOut where the recipient address are the sender.
   * @protected
   *
   */
  protected changeOutputs(amount: BN): TransferableOutput[] {
    // there are no chenge outputs.
    if (amount.lten(0)) return [];
    return [
      new TransferableOutput(
        this.transaction._assetId,
        new SECPTransferOutput(
          amount,
          this.transaction._sender,
          this.transaction._locktime,
          this.transaction._threshold
        )
      ),
    ];
  }
  // endregion
}
