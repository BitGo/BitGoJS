import { BaseCoin as CoinConfig } from '@bitgo/statics';
import EthereumAbi from 'ethereumjs-abi';
import { BaseKey, BaseTransaction, BuildTransactionError, TransactionType } from '@bitgo/sdk-core';
import { Transaction, TransactionBuilder as EthTransactionBuilder } from '@bitgo/sdk-coin-eth';
import { walletSimpleByteCode, walletSimpleConstructor } from './walletUtil';
import { getCommon } from './utils';
import { TransferBuilder } from './transferBuilder';
import { AvaxpLib } from '@bitgo/sdk-coin-avaxp';

export class TransactionBuilder extends EthTransactionBuilder {
  protected _transfer: TransferBuilder;
  protected _exportTx?: AvaxpLib.ExportInCTxBuilder = undefined;

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

  export(): ExportInCTxBuilder {
    if (!this._exportTx) {
      this._exportTx = new AvaxpLib.TransactionBuilderFactory(this._coinConfig).getExportInCBuilder();
    }
    return this._exportTx;
  }

  protected async buildImplementation(): Promise<BaseTransaction> {
    if (this._exportTx) {
      return await this._exportTx.build();
    } else {
      return super.buildImplementation();
    }
  }

  from(rawTransaction: string): void {
    try {
      const avaxpBuilder = new AvaxpLib.TransactionBuilderFactory(this._coinConfig).from(rawTransaction);
      if (avaxpBuilder instanceof ExportInCTxBuilder) {
        this._exportTx = avaxpBuilder;
        return;
      }
    } catch (e) {
      console.log(e);
    }
    super.from(rawTransaction);
  }

  validateTransaction(transaction: BaseTransaction): void {
    if (this._exportTx) {
      return;
    }
    super.validateTransaction(transaction);
  }

  sign(key: BaseKey) {
    if (this._exportTx) {
      this._exportTx.sign(key);
    } else {
      super.sign(key);
    }
  }
}
