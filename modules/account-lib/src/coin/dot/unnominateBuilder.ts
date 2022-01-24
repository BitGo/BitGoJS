import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { DecodedSignedTx, DecodedSigningPayload, UnsignedTransaction } from '@substrate/txwrapper-core';
import { methods } from '@substrate/txwrapper-polkadot';
import { TransactionType } from '../baseCoin';
import { InvalidTransactionError } from '../baseCoin/errors';
import { MethodNames } from './iface';
import { Transaction } from './transaction';
import { TransactionBuilder } from './transactionBuilder';

export class UnnominateBuilder extends TransactionBuilder {
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  /**
   *
   * Declare no desire to either validate or nominate.
   * Note that no arguments are needed.
   *
   * @returns {UnsignedTransaction} an unsigned Dot transaction
   *
   * @see https://polkadot.js.org/docs/substrate/extrinsics/#chill
   */
  protected buildTransaction(): UnsignedTransaction {
    const baseTxInfo = this.createBaseTxInfo();
    const tx = methods.staking.chill({}, baseTxInfo.baseTxInfo, baseTxInfo.options);
    return tx;
  }

  protected get transactionType(): TransactionType {
    return TransactionType.StakingUnvote;
  }

  /** @inheritdoc */
  validateDecodedTransaction(decodedTxn: DecodedSigningPayload | DecodedSignedTx): void {
    if (decodedTxn.method?.name === MethodNames.Chill) {
      const txMethod = decodedTxn.method.args;
      if (Object.keys(txMethod).length !== 0) {
        throw new InvalidTransactionError(`Unnominate Transaction validation failed: Should have no args.`);
      }
    }
  }

  /** @inheritdoc */
  protected fromImplementation(rawTransaction: string): Transaction {
    const tx = super.fromImplementation(rawTransaction);
    if (this._method?.name !== MethodNames.Chill) {
      throw new InvalidTransactionError(`Invalid Transaction Type: ${this._method?.name}. Expected chill`);
    }
    return tx;
  }
}
