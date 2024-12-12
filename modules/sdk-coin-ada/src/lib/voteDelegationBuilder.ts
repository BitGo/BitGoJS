import { BaseKey, TransactionType } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { TransactionBuilder } from './transactionBuilder';
import { Transaction } from './transaction';
import * as CardanoWasm from '@emurgo/cardano-serialization-lib-nodejs';
import adaUtils from './utils';

export class VoteDelegationBuilder extends TransactionBuilder {
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._type = TransactionType.VoteDelegation;
  }

  protected get transactionType(): TransactionType {
    return TransactionType.VoteDelegation;
  }

  /** @inheritdoc */
  initBuilder(tx: Transaction): void {
    super.initBuilder(tx);
  }

  /**
   * Creates the proper certificates needed to delegate a user's vote to a given DRep
   *
   * @param stakingPublicKey The user's public stake key
   * @param dRepId The DRep ID of the DRep we will delegate vote to
   */
  addVoteDelegationCertificate(stakingPublicKey: string, dRepId: string): this {
    const stakeCredential = CardanoWasm.Credential.from_keyhash(
      CardanoWasm.PublicKey.from_bytes(Buffer.from(stakingPublicKey, 'hex')).hash()
    );
    const voteDelegationCert = CardanoWasm.Certificate.new_vote_delegation(
      CardanoWasm.VoteDelegation.new(stakeCredential, adaUtils.getDRepFromDRepId(dRepId))
    );
    this._certs.push(voteDelegationCert);
    return this;
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    const tx = await super.buildImplementation();
    tx.setTransactionType(TransactionType.VoteDelegation);
    return tx;
  }

  /** @inheritdoc */
  protected fromImplementation(rawTransaction: string): Transaction {
    return super.fromImplementation(rawTransaction);
  }

  /** @inheritdoc */
  protected signImplementation(key: BaseKey): Transaction {
    return super.signImplementation(key);
  }
}
