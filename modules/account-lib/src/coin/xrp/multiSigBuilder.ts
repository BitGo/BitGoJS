import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { TransactionJSON } from 'ripple-lib';
import * as rippleTypes from 'ripple-lib/dist/npm/transaction/types';
import RippleBinaryCodec from 'ripple-binary-codec';
import { TransactionType } from '../baseCoin';
import { InvalidTransactionError } from '../baseCoin/errors';
import { Transaction } from './transaction';
import { TransactionBuilder } from './transactionBuilder';
import { MultiSigBuilderSchema } from './txnSchema';
import { SignerEntry } from './iface';

export class MultiSigBuilder extends TransactionBuilder {
  protected _signerEntries?: SignerEntry[];
  protected _signerQuorum: number;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  /**
   * Sets array of SignerEntry objects, indicating the addresses and weights of signers in this list.
   * https://xrpl.org/signerlistset.html#signerlistset-fields
   *
   * @param {SignerEntry[]} signerEntries the number of signers, set 0 for removal
   * @returns {MultiSigBuilder} builder
   */
  signerEntries(signerEntries: SignerEntry[]): this {
    if (this._signerQuorum > 0) {
      if (signerEntries.length < 1 || signerEntries.length > 8) {
        throw new InvalidTransactionError('This signer list must have at least 1 member and no more than 8 members');
      }
      this._signerEntries = signerEntries;
    }
    return this;
  }

  /**
   * Sets signer quorum
   * https://xrpl.org/signerlistset.html#signerlistset-fields
   *
   * @param {number} signerQuorum the number of signers, set 0 for removal
   * @returns {MultiSigBuilder} builder
   */
  signerQuorum(signerQuorum: number): this {
    if (signerQuorum < 0) {
      throw new InvalidTransactionError('Signer Quorum must be greater than or equal to 0');
    }
    this._signerQuorum = signerQuorum;
    return this;
  }

  protected buildXRPTxn(): TransactionJSON {
    const tx: TransactionJSON = {
      Account: this._sender,
      TransactionType: 'SignerListSet',
      SignerQuorum: this._signerQuorum,
    };

    if (this._signerEntries) tx.SignerEntries = this._signerEntries;
    return tx;
  }
  protected get transactionType(): TransactionType {
    return TransactionType.MultiSigSetup;
  }

  /** @inheritdoc */
  protected fromImplementation(rawTransaction: string): Transaction {
    const tx = super.fromImplementation(rawTransaction);
    const xrpTx = tx.getXRPTransaction();
    if (xrpTx) {
      this.signerQuorum(xrpTx.SignerQuorum as number);
      this.signerEntries(xrpTx.SignerEntries as SignerEntry[]);
    }
    return tx;
  }

  /** @inheritdoc */
  validateRawTransaction(rawTransaction: string): void {
    super.validateRawTransaction(rawTransaction);
    const decodedXrpTrx = RippleBinaryCodec.decode(rawTransaction) as rippleTypes.TransactionJSON;

    if (decodedXrpTrx.TransactionType !== 'SignerListSet') {
      throw new InvalidTransactionError(
        `Invalid Transaction Type: ${decodedXrpTrx.TransactionType}. Expected SignerListSet`,
      );
    }

    this.validateFields(decodedXrpTrx.SignerQuorum as number, decodedXrpTrx.SignerEntries as SignerEntry[]);
  }

  /** @inheritdoc */
  validateTransaction(transaction: Transaction): void {
    super.validateTransaction(transaction);
    this.validateFields(this._signerQuorum, this._signerEntries);
  }

  private validateFields(signerQuorum: number, signerEntries?: SignerEntry[]): void {
    const validationResult = MultiSigBuilderSchema.validate({
      signerQuorum,
      signerEntries,
    });
    if (validationResult.error) {
      throw new InvalidTransactionError(`Transaction validation failed: ${validationResult.error.message}`);
    }
  }
}
