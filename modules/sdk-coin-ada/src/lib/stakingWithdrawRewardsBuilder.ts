import { BaseKey, TransactionType } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { TransactionBuilder } from './transactionBuilder';
import { Transaction } from './transaction';
import * as CardanoWasm from '@emurgo/cardano-serialization-lib-nodejs';

export class StakingWithdrawRewardsBuilder extends TransactionBuilder {
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._type = TransactionType.StakingWithdraw;
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    const tx = await super.buildImplementation();
    tx.setTransactionType(TransactionType.StakingWithdraw);
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

  /**
   * Creates a withdrawal to add to our transaction body so we can withdraw from our rewards/stake address
   *
   * @param stakingPubKey User's public stake key
   * @param value Amount from the rewards address we're withdrawing
   */
  addWithdrawal(stakingPubKey: string, value: string) {
    const coinName = this._coinConfig.name;
    const stakePub = CardanoWasm.PublicKey.from_bytes(Buffer.from(stakingPubKey, 'hex'));
    let rewardAddress;
    if (coinName === 'ada') {
      rewardAddress = CardanoWasm.RewardAddress.new(
        CardanoWasm.NetworkInfo.mainnet().network_id(),
        CardanoWasm.StakeCredential.from_keyhash(stakePub.hash())
      );
    } else {
      rewardAddress = CardanoWasm.RewardAddress.new(
        CardanoWasm.NetworkInfo.testnet().network_id(),
        CardanoWasm.StakeCredential.from_keyhash(stakePub.hash())
      );
    }
    this._withdrawals.push({
      stakeAddress: rewardAddress.to_address().to_bech32(),
      value,
    });
    return this;
  }
}
