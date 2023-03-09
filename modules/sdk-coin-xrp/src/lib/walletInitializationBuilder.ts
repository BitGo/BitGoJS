import { BuildTransactionError, TransactionType } from '@bitgo/sdk-core';
import { Transaction } from './transaction';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { TransactionBuilder } from './transactionBuilder';
import XrpUtils from './utils';
import { SignerEntry } from 'xrpl/dist/npm/models/common';
import { SignerDetails } from './iface';
import { MAX_SIGNERS, MIN_SIGNERS, MIN_SIGNER_QUORUM } from './constants';
import { SignerListSet } from 'xrpl';

export class WalletInitializationBuilder extends TransactionBuilder {
  protected _signerQuorum: number;
  protected _signerEntries: SignerEntry[] = [];
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  protected get transactionType(): TransactionType {
    return TransactionType.WalletInitialization;
  }

  protected get xrpTransactionType(): 'SignerListSet' {
    return 'SignerListSet';
  }

  signerQuorum(quorum: number): TransactionBuilder {
    XrpUtils.validateSignerQuorum(quorum);
    this._signerQuorum = quorum;
    return this;
  }

  signer(signer: SignerDetails): TransactionBuilder {
    if (this._signerEntries.length > MAX_SIGNERS) {
      throw new BuildTransactionError(`Cannot have more than ${MAX_SIGNERS} signers`);
    }
    XrpUtils.validateSigner(signer);
    this._signerEntries.push({
      SignerEntry: { Account: signer.address, SignerWeight: signer.weight },
    });
    return this;
  }

  initBuilder(tx: Transaction): void {
    super.initBuilder(tx);

    const { signerEntries, signerQuorum } = tx.toJson();
    if (signerQuorum) {
      this.signerQuorum(signerQuorum);
    }

    if (signerEntries?.length) {
      signerEntries.forEach((signer) =>
        this.signer({
          address: signer.SignerEntry.Account,
          weight: signer.SignerEntry.SignerWeight,
        })
      );
    }
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    if (!this._sender) {
      throw new BuildTransactionError('Sender must be set before building the transaction');
    }
    if (!this._signerQuorum || this._signerQuorum < MIN_SIGNER_QUORUM) {
      throw new BuildTransactionError('Signer quorum must be set before building the transaction');
    }
    if (!this._signerEntries) {
      throw new BuildTransactionError('Signers must be set before building the transaction');
    }

    if (this._signerEntries.length < MIN_SIGNERS || this._signerEntries.length > MAX_SIGNERS) {
      throw new BuildTransactionError(`Signers must be between ${MIN_SIGNERS} and ${MAX_SIGNERS}`);
    }

    const signerListSetFields: SignerListSet = {
      TransactionType: this.xrpTransactionType,
      Account: this._sender,
      SignerQuorum: this._signerQuorum,
      SignerEntries: this._signerEntries,
    };

    this._specificFields = signerListSetFields;
    return await super.buildImplementation();
  }
}
