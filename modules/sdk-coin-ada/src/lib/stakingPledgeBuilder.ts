import { BaseKey, TransactionType } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { TransactionBuilder } from './transactionBuilder';
import { Transaction } from './transaction';

export class StakingPledgeBuilder extends TransactionBuilder {
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._type = TransactionType.StakingPledge;
  }

  protected get transactionType(): TransactionType {
    return TransactionType.StakingPledge;
  }

  /** @inheritdoc */
  initBuilder(tx: Transaction): void {
    super.initBuilder(tx);
  }

  /**
   * Add node key witness to the transaction to the transaction's witnesses list.
   *
   * @param nodePublicKey Public node key provided by the user.
   * @param nodeKeySignature Signature of the node key provided by the user.
   */
  addNodeKeyWitness(nodePublicKey: string, nodeKeySignature: string): this {
    this.addSignature({ pub: nodePublicKey }, Buffer.from(nodeKeySignature, 'hex'));
    return this;
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    const tx = await super.buildImplementation();
    tx.setTransactionType(TransactionType.StakingPledge);
    return tx;
  }

  /** @inheritdoc */
  protected fromImplementation(rawTransaction: string): Transaction {
    return super.fromImplementation(rawTransaction);
  }

  protected signImplementation(key: BaseKey): Transaction {
    return super.signImplementation(key);
  }
}
