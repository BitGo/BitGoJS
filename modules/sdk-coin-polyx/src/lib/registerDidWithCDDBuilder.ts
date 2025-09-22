import { Interface, utils } from '@bitgo-beta/abstract-substrate';
import { PolyxBaseBuilder } from './baseBuilder';
import { DecodedSignedTx, DecodedSigningPayload, defineMethod, UnsignedTransaction } from '@substrate/txwrapper-core';
import { BaseCoin as CoinConfig } from '@bitgo-beta/statics';
import { TransactionType, BaseAddress, InvalidTransactionError } from '@bitgo-beta/sdk-core';
import { RegisterDidWithCDDArgs, TxMethod, MethodNames } from './iface';
import { RegisterDidWithCDDTransactionSchema } from './txnSchema';
import { Transaction } from './transaction';

export class RegisterDidWithCDDBuilder extends PolyxBaseBuilder<TxMethod, Transaction> {
  protected _to: string;
  protected _method: TxMethod;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._transaction = new Transaction(_coinConfig);
  }

  protected get transactionType(): TransactionType {
    return TransactionType.WalletInitialization;
  }

  protected buildTransaction(): UnsignedTransaction {
    const baseTxInfo = this.createBaseTxInfo();
    return this.RegisterDidWithCDD(
      {
        targetAccount: this._to,
        secondaryKeys: [],
        expiry: null,
      },
      baseTxInfo
    );
  }

  /**
   *
   * The destination address for transfer transaction.
   *
   * @param {string} dest
   * @returns {TransferBuilder} This transfer builder.
   */
  to({ address }: BaseAddress): this {
    this.validateAddress({ address });
    this._to = address;
    return this;
  }

  /** @inheritdoc */
  protected fromImplementation(rawTransaction: string): Transaction {
    const tx = super.fromImplementation(rawTransaction);
    if (this._method?.name === MethodNames.RegisterDidWithCDD) {
      const txMethod = this._method.args as RegisterDidWithCDDArgs;
      this.to({ address: utils.decodeSubstrateAddress(txMethod.targetAccount, this.getAddressFormat()) });
    } else {
      throw new InvalidTransactionError(`Invalid Transaction Type: ${this._method?.name}. Expected RegisterDidWithCDD`);
    }
    return tx;
  }

  /** @inheritdoc */
  validateDecodedTransaction(decodedTxn: DecodedSigningPayload | DecodedSignedTx, rawTransaction?: string): void {
    if (decodedTxn.method?.name === MethodNames.RegisterDidWithCDD) {
      const txMethod = decodedTxn.method.args as RegisterDidWithCDDArgs;
      const targetAccount = txMethod.targetAccount;
      const secondaryKeys = txMethod.secondaryKeys;
      const expiry = txMethod.expiry;

      const validationResult = RegisterDidWithCDDTransactionSchema.validate({ targetAccount, secondaryKeys, expiry });
      if (validationResult.error) {
        throw new InvalidTransactionError(`Invalid transaction: ${validationResult.error.message}`);
      }
    }
  }

  /**
   * Construct a transaction to register a DID with CDD information
   *
   * @param {RegisterDidWithCDDArgs} args Arguments to be passed to the cddRegisterDidWithCdd method
   * @param {Interface.CreateBaseTxInfo} info Base txn info required to construct the DID registration txn
   * @returns {UnsignedTransaction} an unsigned transaction for DID registration with CDD
   */
  private RegisterDidWithCDD(args: RegisterDidWithCDDArgs, info: Interface.CreateBaseTxInfo): UnsignedTransaction {
    return defineMethod(
      {
        method: {
          args,
          name: 'cddRegisterDidWithCdd',
          pallet: 'identity',
        },
        ...info.baseTxInfo,
      },
      info.options
    );
  }
}
