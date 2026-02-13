import { BaseCoin as CoinConfig, EthereumNetwork, CoinFeature, NetworkType } from '@bitgo/statics';
import { BuildTransactionError, TransactionType } from '@bitgo/sdk-core';
import {
  TransactionBuilder as AbstractTransactionBuilder,
  Transaction,
  TransferBuilder,
  getCommon as getAbstractCommon,
} from '@bitgo/abstract-eth';
import EthereumCommon from '@ethereumjs/common';

/**
 * Get the Ethereum common configuration for Irys.
 * @param coin - The coin configuration
 * @returns Ethereum common configuration object
 */
function getCommon(coin: Readonly<CoinConfig>): EthereumCommon {
  return EthereumCommon.custom(
    {
      name: coin.network.name,
      networkId: (coin.network as EthereumNetwork).chainId,
      chainId: (coin.network as EthereumNetwork).chainId,
    },
    {
      baseChain: coin.network.type === NetworkType.MAINNET ? 'mainnet' : 'sepolia',
      hardfork: coin.features.includes(CoinFeature.EIP1559) ? 'london' : undefined,
      eips: coin.features.includes(CoinFeature.EIP1559) ? [1559] : undefined,
    }
  );
}

/**
 * Irys transaction builder for standard EVM transactions.
 */
export class TransactionBuilder extends AbstractTransactionBuilder {
  protected _transfer: TransferBuilder;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._common = getCommon(this._coinConfig);
    this.transaction = new Transaction(this._coinConfig, this._common);
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

  /**
   * Get contract data for wallet initialization.
   *
   * This method is intentionally not implemented for Irys. Irys uses commitment
   * transactions (STAKE, PLEDGE) for staking operations, which are built via
   * IrysCommitmentTransactionBuilder, not through standard EVM contract calls.
   * Standard EVM transfers work normally via the inherited transfer() method.
   *
   * @throws Error - Always throws as this is not supported for Irys
   */
  protected getContractData(addresses: string[]): string {
    throw new Error(
      'getContractData is not implemented for Irys. Use IrysCommitmentTransactionBuilder for staking operations.'
    );
  }
}
