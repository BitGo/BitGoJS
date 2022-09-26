import { BaseKey, TransactionType } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { TransactionBuilder } from './transactionBuilder';
import { Transaction } from './transaction';
import * as CardanoWasm from '@emurgo/cardano-serialization-lib-nodejs';

export class StakingDeactivateBuilder extends TransactionBuilder {
  protected _stakingCredentialHash: string;
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._type = TransactionType.StakingDeactivate;
  }

  protected get transactionType(): TransactionType {
    return TransactionType.StakingDeactivate;
  }

  /**
   * Uses the stake key to generate a stake deregistration certificate to unstake from a pool
   * @param stakingPublicKey User's public stake key
   *
   */
  stakingCredential(stakingPublicKey: string): this {
    const stakeCredential = CardanoWasm.StakeCredential.from_keyhash(
      CardanoWasm.PublicKey.from_bytes(Buffer.from(stakingPublicKey, 'hex')).hash()
    );
    const stakeKeyDeregistrationCert = CardanoWasm.Certificate.new_stake_deregistration(
      CardanoWasm.StakeDeregistration.new(stakeCredential)
    );
    this._certs.push(stakeKeyDeregistrationCert);
    return this;
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    const tx = await super.buildImplementation();
    tx.setTransactionType(TransactionType.StakingDeactivate);
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
