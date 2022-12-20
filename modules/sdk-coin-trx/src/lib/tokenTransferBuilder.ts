import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { BaseKey } from '@bitgo/sdk-core';
import { ContractCallBuilder } from './contractCallBuilder';
import { Transaction } from './transaction';
import { getHexAddressFromBase58Address, encodeDataParams } from './utils';

// the first 4 bytes of the Keccak-256 encoded function selector used in token transfers, 'transfer(address,uint256)'
// this must be concatenated with the encoded parameters, recipientAddress and amount
const methodId = '0xa9059cbb';

export class TokenTransferBuilder extends ContractCallBuilder {
  private _recipientAddress; // currently only support 1 token/transfer
  private _amount;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    return await super.buildImplementation();
  }

  /**
   * Set the data with the transfer method call and parameters
   *
   * @param recipientAddress - recipient of token transfer
   * @param amount - token amount
   */
  tokenTransferData(recipientAddress: string, amount: number): this {
    this.validateAddress({ address: recipientAddress });
    const recipientHex = getHexAddressFromBase58Address(recipientAddress);

    const types = ['address', 'uint256'];
    const values = [recipientHex, amount];
    const tokenTransferData = encodeDataParams(types, values, methodId);
    this.data(tokenTransferData);
    return this;
  }

  /** @inheritdoc */
  protected fromImplementation(rawTransaction: any): Transaction {
    return super.fromImplementation(rawTransaction);
  }

  /** @inheritdoc */
  protected signImplementation(key: BaseKey): Transaction {
    return super.signImplementation(key);
  }
}
