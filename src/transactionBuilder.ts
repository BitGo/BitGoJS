import { BaseCoin } from "./coin/baseCoin";
import BigNumber from "bignumber.js";
import { SigningError } from "./coin/baseCoin/errors";
import { BaseTransaction, BaseAddress, BaseKey } from "./coin/baseCoin/iface";
import { TransactionType } from "./coin/baseCoin/enum";
import { CoinFactory } from "./coinFactory";

export interface TransactionBuilderParams {
  coin?: BaseCoin;
  coinName?: string;
}

export class TransactionBuilder {
  public transaction: BaseTransaction;
  private coin: BaseCoin;

  private fromAddresses: Array<BaseAddress>;
  private destination: Array<Destination>;

  constructor(options: TransactionBuilderParams) {
    let coin = options.coin;
    if (!coin) {
      if (!options.coinName) {
        throw new Error('Failed to provide a coin and coinName.')
      }

      coin = CoinFactory.getCoin(options.coinName);
    }

    this.coin = coin;
    this.fromAddresses = new Array<BaseAddress>();
    this.destination = new Array<Destination>();
  }

  from(rawTransaction: any, transactionType: TransactionType) {
    let transaction = this.coin.parseTransaction(rawTransaction, transactionType);

    this.transaction = transaction;
  }
 
  /**
   * Signs the transaction in our builder.
   * @param key the key associated with this transaction
   * @param fromAddress 
   */
  sign(key: BaseKey, fromAddress: BaseAddress) {
    if (!this.coin.validateAddress(fromAddress)) {
      throw new SigningError(`${fromAddress.address} is not valid for ${this.coin.displayName}`);
    }

    if (!this.coin.validateKey(key)) {
      throw new SigningError(`Key is not valid for ${fromAddress}`);
    }

    this.transaction = this.coin.sign(key, fromAddress, this.transaction);
  }

  build(): BaseTransaction {
    let transaction = this.coin.buildTransaction(this.transaction);
    
    this.transaction = transaction;

    return this.transaction;
  }
}

export class Destination {
  constructor(private address: BaseAddress, private value: BigNumber) {}
}
