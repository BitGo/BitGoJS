import { BaseKey, TransactionType } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { TransactionBuilder } from './transactionBuilder';
import { Transaction } from './transaction';
import * as CardanoWasm from '@emurgo/cardano-serialization-lib-nodejs';

export class StakingActivateBuilder extends TransactionBuilder {
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._type = TransactionType.StakingActivate;
  }

  protected get transactionType(): TransactionType {
    return TransactionType.StakingActivate;
  }

  /** @inheritdoc */
  initBuilder(tx: Transaction): void {
    super.initBuilder(tx);
  }

  /**
   * Creates the proper certificates needed to register a user's stake key & then delegate to a given pool.
   *
   * @param stakingPublicKey The user's public stake key
   * @param poolHash Pool ID Hash of the pool we are going to delegate to
   */
  stakingCredential(stakingPublicKey: string, poolHash: string): this {
    const stakeCredential = CardanoWasm.StakeCredential.from_keyhash(
      CardanoWasm.PublicKey.from_bytes(Buffer.from(stakingPublicKey, 'hex')).hash()
    );
    const stakeKeyRegistrationCert = CardanoWasm.Certificate.new_stake_registration(
      CardanoWasm.StakeRegistration.new(stakeCredential)
    );
    this._certs.push(stakeKeyRegistrationCert);
    const stakeDelegationCert = CardanoWasm.Certificate.new_stake_delegation(
      CardanoWasm.StakeDelegation.new(
        stakeCredential,
        CardanoWasm.Ed25519KeyHash.from_bytes(Buffer.from(poolHash, 'hex'))
      )
    );
    this._certs.push(stakeDelegationCert);
    return this;
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    const tx = await super.buildImplementation();
    tx.setTransactionType(TransactionType.StakingActivate);
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
