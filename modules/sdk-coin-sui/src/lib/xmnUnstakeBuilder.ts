import { BaseCoin as CoinConfig, NetworkType } from '@bitgo/statics';
import { BaseKey, BuildTransactionError, TransactionType } from '@bitgo/sdk-core';
import {
  RequestXmnRequestUnstake,
  RequestXmnUnbond,
  SuiTransaction,
  SuiTransactionType,
  XmnUnstakeProgrammableTransaction,
} from './iface';
import { TransactionBuilder } from './transactionBuilder';
import { Transaction } from './transaction';
import { UnstakingTransaction } from './unstakingTransaction';
import {
  Inputs,
  MoveCallTransaction,
  TransactionBlock as ProgrammingTransactionBlockBuilder,
} from './mystenlab/builder';
import { MAX_GAS_OBJECTS } from './constants';
import { XMN_MAINNET_CONFIG, XMN_TESTNET_CONFIG, XmnConfig } from './resources/xmnConfig';
import assert from 'assert';

/**
 * Builder for XMN unstaking transactions (2-step process).
 *
 * Step 1: XmnRequestUnstake
 *   Calls staking_factory::request_unstake<XMN, XMN, BRIDGE_TOKEN>(factory, openPosition, amount).
 *   Void return — UnbondingTicket is internally transferred to ctx.sender().
 *   After this TX, wait for the unbonding period (10 days mainnet / ~30 min testnet).
 *
 * Step 2: XmnUnbond
 *   Calls staking_factory::unbond<XMN, XMN, BRIDGE_TOKEN>(factory, unbondingTicket).
 *   Void return — principal XMN coin is internally transferred to ctx.sender().
 *   The UnbondingTicket object is deleted on-chain.
 *
 * IMPORTANT: Both functions have void returns. Do NOT call tx.transferObjects().
 */
export class XmnUnstakeBuilder extends TransactionBuilder<XmnUnstakeProgrammableTransaction> {
  protected _requestUnstake?: RequestXmnRequestUnstake;
  protected _unbond?: RequestXmnUnbond;

  private xmnConfig: XmnConfig;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._transaction = new UnstakingTransaction(_coinConfig);
    this.xmnConfig = _coinConfig.network.type === NetworkType.MAINNET ? XMN_MAINNET_CONFIG : XMN_TESTNET_CONFIG;
  }

  protected get transactionType(): TransactionType {
    return this._type === SuiTransactionType.XmnUnbond
      ? TransactionType.StakingWithdraw
      : TransactionType.StakingDeactivate;
  }

  validateTransaction(transaction: Transaction<XmnUnstakeProgrammableTransaction>): void {
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
   * Set request_unstake parameters (Step 1 of 2).
   *
   * @param request - OpenPosition object ref and optional amount (partial unstake)
   */
  requestUnstake(request: RequestXmnRequestUnstake): this {
    assert(request.openPosition, 'openPosition is required for requestUnstake');
    this._requestUnstake = request;
    this.type(SuiTransactionType.XmnRequestUnstake);
    return this;
  }

  /**
   * Set unbond parameters (Step 2 of 2).
   *
   * @param request - UnbondingTicket object ref (received after request_unstake)
   */
  unbond(request: RequestXmnUnbond): this {
    assert(request.unbondingTicket, 'unbondingTicket is required for unbond');
    this._unbond = request;
    this.type(SuiTransactionType.XmnUnbond);
    return this;
  }

  protected fromImplementation(rawTransaction: string): Transaction<XmnUnstakeProgrammableTransaction> {
    const tx = new UnstakingTransaction(this._coinConfig);
    this.validateRawTransaction(rawTransaction);
    tx.fromRawTransaction(rawTransaction);
    this.initBuilder(tx);
    return this.transaction;
  }

  protected async buildImplementation(): Promise<Transaction<XmnUnstakeProgrammableTransaction>> {
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

  initBuilder(tx: Transaction<XmnUnstakeProgrammableTransaction>): void {
    this._transaction = tx;

    if (tx.signature && tx.signature.length > 0) {
      this._signatures = [tx.suiSignature];
    }

    const txData = tx.toJson();
    this.sender(txData.sender);
    this.gasData(txData.gasData);
  }

  private validateTransactionFields(): void {
    assert(this._type, new BuildTransactionError('type is required before building'));
    assert(this._sender, new BuildTransactionError('sender is required before building'));

    if (this._type === SuiTransactionType.XmnRequestUnstake) {
      assert(this._requestUnstake, new BuildTransactionError('requestUnstake params are required'));
      assert(this._requestUnstake.openPosition, new BuildTransactionError('openPosition is required'));
    } else if (this._type === SuiTransactionType.XmnUnbond) {
      assert(this._unbond, new BuildTransactionError('unbond params are required'));
      assert(this._unbond.unbondingTicket, new BuildTransactionError('unbondingTicket is required'));
    } else {
      throw new BuildTransactionError(`Unsupported type for XmnUnstakeBuilder: ${this._type}`);
    }

    assert(this._gasData, new BuildTransactionError('gasData is required before building'));
    this.validateGasData(this._gasData);
  }

  protected buildSuiTransaction(): SuiTransaction<XmnUnstakeProgrammableTransaction> {
    this.validateTransactionFields();

    const programmableTxBuilder = new ProgrammingTransactionBlockBuilder();

    const factoryRef = programmableTxBuilder.object(
      Inputs.SharedObjectRef({
        objectId: this.xmnConfig.XMN_STAKING_FACTORY.objectId,
        initialSharedVersion: this.xmnConfig.XMN_STAKING_FACTORY.initialSharedVersion,
        mutable: this.xmnConfig.XMN_STAKING_FACTORY.mutable,
      })
    );

    const typeArgs = [
      this.xmnConfig.XMN_COIN_TYPE,
      this.xmnConfig.XMN_COIN_TYPE,
      this.xmnConfig.BRIDGE_TOKEN_COIN_TYPE,
    ];

    if (this._type === SuiTransactionType.XmnRequestUnstake) {
      // Call staking_factory::request_unstake<XMN, XMN, BRIDGE_TOKEN>(factory, openPosition, amount)
      // Void return — UnbondingTicket is internally transferred to ctx.sender()
      const args = [factoryRef, programmableTxBuilder.object(Inputs.ObjectRef(this._requestUnstake!.openPosition))];

      if (this._requestUnstake!.amount !== undefined) {
        args.push(programmableTxBuilder.pure(this._requestUnstake!.amount) as any);
      }

      programmableTxBuilder.moveCall({
        target: `${this.xmnConfig.XMN_PKG_ID}::${this.xmnConfig.STAKING_MODULE}::request_unstake`,
        typeArguments: typeArgs,
        arguments: args,
      } as unknown as MoveCallTransaction);
    } else {
      // XmnUnbond: Call staking_factory::unbond<XMN, XMN, BRIDGE_TOKEN>(factory, unbondingTicket)
      // Void return — principal XMN coin is internally transferred to ctx.sender()
      programmableTxBuilder.moveCall({
        target: `${this.xmnConfig.XMN_PKG_ID}::${this.xmnConfig.STAKING_MODULE}::unbond`,
        typeArguments: typeArgs,
        arguments: [factoryRef, programmableTxBuilder.object(Inputs.ObjectRef(this._unbond!.unbondingTicket))],
      } as unknown as MoveCallTransaction);
    }

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
