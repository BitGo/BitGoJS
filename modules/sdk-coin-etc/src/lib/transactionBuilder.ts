import { BaseCoin as CoinConfig } from '@bitgo-beta/statics';
import EthereumAbi from 'ethereumjs-abi';
import { TransactionBuilder as EthTransactionBuilder, walletSimpleConstructor } from '@bitgo-beta/sdk-coin-eth';
import { BuildTransactionError, TransactionType } from '@bitgo-beta/sdk-core';
import { getCommon, walletSimpleByteCode } from './utils';
import { TransferBuilder } from './transferBuilder';
import { Transaction } from './';

export class TransactionBuilder extends EthTransactionBuilder {
  protected _transfer: TransferBuilder;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._common = getCommon(this._coinConfig.network.type);
    this.transaction = new Transaction(this._coinConfig, this._common);
  }

  /**
   * Returns the smart contract encoded data
   *
   * @param {string[]} addresses - the contract signers
   * @returns {string} - the smart contract encoded data
   */
  protected getContractData(addresses: string[]): string {
    const params = [addresses];
    const resultEncodedParameters = EthereumAbi.rawEncode(walletSimpleConstructor, params)
      .toString('hex')
      .replace('0x', '');
    return walletSimpleByteCode + resultEncodedParameters;
  }

  /** @inheritdoc */
  transfer(data?: string): TransferBuilder {
    if (this._type !== TransactionType.Send) {
      throw new BuildTransactionError('Transfers can only be set for send transactions');
    }
    if (!this._transfer) {
      this._transfer = new TransferBuilder(data);
    }
    return this._transfer;
  }
}
