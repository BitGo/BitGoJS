import { BaseCoin as CoinConfig, NetworkType } from '@bitgo/statics';
import { BaseKey, BuildTransactionError, TransactionType } from '@bitgo/sdk-core';
import {
  RequestXmnClaimRewards,
  SuiTransaction,
  SuiTransactionType,
  XmnClaimRewardsProgrammableTransaction,
} from './iface';
import { TransactionBuilder } from './transactionBuilder';
import { Transaction } from './transaction';
import { StakingTransaction } from './stakingTransaction';
import {
  Inputs,
  MoveCallTransaction,
  TransactionBlock as ProgrammingTransactionBlockBuilder,
} from './mystenlab/builder';
import { MAX_GAS_OBJECTS } from './constants';
import { XMN_MAINNET_CONFIG, XMN_TESTNET_CONFIG, XmnConfig } from './resources/xmnConfig';
import assert from 'assert';

/**
 * Builder for XMN claim rewards transactions.
 *
 * Calls staking_factory::claim_and_transfer<XMN, XMN, BRIDGE_TOKEN>(factory, openPosition).
 * Void return — the reward XMN coin is internally transferred to ctx.sender().
 *
 * The OpenPosition remains active after claiming; rewards are reset to zero.
 * auto_claimed_on_unstake = false — rewards must be claimed separately from unstaking.
 *
 * IMPORTANT: void return — do NOT call tx.transferObjects() on the result.
 */
export class XmnClaimRewardsBuilder extends TransactionBuilder<XmnClaimRewardsProgrammableTransaction> {
  protected _claimRequest: RequestXmnClaimRewards;

  private xmnConfig: XmnConfig;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._transaction = new StakingTransaction(_coinConfig);
    this.xmnConfig = _coinConfig.network.type === NetworkType.MAINNET ? XMN_MAINNET_CONFIG : XMN_TESTNET_CONFIG;
  }

  protected get transactionType(): TransactionType {
    return TransactionType.StakingClaim;
  }

  validateTransaction(transaction: Transaction<XmnClaimRewardsProgrammableTransaction>): void {
    if (!transaction.suiTransaction) {
      return;
    }
    this.validateTransactionFields();
  }

  sign(key: BaseKey) {
    this.transaction.setSuiTransaction(this.buildSuiTransaction());
    super.sign(key);
  }

  /**
   * Set the claim rewards request parameters.
   *
   * @param request - OpenPosition object ref to claim rewards from
   */
  claim(request: RequestXmnClaimRewards): this {
    assert(request.openPosition, 'openPosition is required for claim');
    this._claimRequest = request;
    return this;
  }

  protected fromImplementation(rawTransaction: string): Transaction<XmnClaimRewardsProgrammableTransaction> {
    const tx = new StakingTransaction(this._coinConfig);
    this.validateRawTransaction(rawTransaction);
    tx.fromRawTransaction(rawTransaction);
    this.initBuilder(tx);
    return this.transaction;
  }

  protected async buildImplementation(): Promise<Transaction<XmnClaimRewardsProgrammableTransaction>> {
    this.transaction.setSuiTransaction(this.buildSuiTransaction());
    this.transaction.transactionType(this.transactionType);

    if (this._signer) {
      this.transaction.sign(this._signer);
    }

    this._signatures.forEach((signature) => {
      this.transaction.addSignature(signature.publicKey, signature.signature);
    });

    this.transaction.loadInputsAndOutputs();
    return this.transaction;
  }

  initBuilder(tx: Transaction<XmnClaimRewardsProgrammableTransaction>): void {
    this._transaction = tx;

    if (tx.signature && tx.signature.length > 0) {
      this._signatures = [tx.suiSignature];
    }

    const txData = tx.toJson();
    this.type(SuiTransactionType.XmnClaimRewards);
    this.sender(txData.sender);
    this.gasData(txData.gasData);
  }

  private validateTransactionFields(): void {
    assert(this._type, new BuildTransactionError('type is required before building'));
    assert(this._sender, new BuildTransactionError('sender is required before building'));
    assert(this._claimRequest, new BuildTransactionError('claim request is required before building'));
    assert(this._claimRequest.openPosition, new BuildTransactionError('openPosition is required before building'));
    assert(this._gasData, new BuildTransactionError('gasData is required before building'));
    this.validateGasData(this._gasData);
  }

  protected buildSuiTransaction(): SuiTransaction<XmnClaimRewardsProgrammableTransaction> {
    this.validateTransactionFields();

    const programmableTxBuilder = new ProgrammingTransactionBlockBuilder();

    // Call staking_factory::claim_and_transfer<XMN, XMN, BRIDGE_TOKEN>(factory, openPosition)
    // Void return — reward XMN coin is internally transferred to ctx.sender()
    programmableTxBuilder.moveCall({
      target: `${this.xmnConfig.XMN_PKG_ID}::${this.xmnConfig.STAKING_MODULE}::claim_and_transfer`,
      typeArguments: [
        this.xmnConfig.XMN_COIN_TYPE,
        this.xmnConfig.XMN_COIN_TYPE,
        this.xmnConfig.BRIDGE_TOKEN_COIN_TYPE,
      ],
      arguments: [
        programmableTxBuilder.object(
          Inputs.SharedObjectRef({
            objectId: this.xmnConfig.XMN_STAKING_FACTORY.objectId,
            initialSharedVersion: this.xmnConfig.XMN_STAKING_FACTORY.initialSharedVersion,
            mutable: this.xmnConfig.XMN_STAKING_FACTORY.mutable,
          })
        ),
        programmableTxBuilder.object(Inputs.ObjectRef(this._claimRequest.openPosition)),
      ],
    } as unknown as MoveCallTransaction);

    const txData = programmableTxBuilder.blockData;
    return {
      type: this._type,
      sender: this._sender,
      tx: {
        inputs: [...txData.inputs],
        transactions: [...txData.transactions],
      },
      gasData: {
        ...this._gasData,
        payment: this._gasData.payment.slice(0, MAX_GAS_OBJECTS - 1),
      },
    };
  }
}
