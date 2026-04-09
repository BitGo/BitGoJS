import { BaseCoin as CoinConfig, NetworkType } from '@bitgo/statics';
import { BaseKey, BuildTransactionError, InvalidTransactionError, TransactionType } from '@bitgo/sdk-core';
import {
  RequestWalrusStakeWithPool,
  SuiTransaction,
  SuiTransactionType,
  WalrusStakingProgrammableTransaction,
} from './iface';
import { TransactionBuilder } from './transactionBuilder';
import { Transaction } from './transaction';
import utils from './utils';
import assert from 'assert';
import { TransferTransaction } from './transferTransaction';
import { StakingTransaction } from './stakingTransaction';
import {
  Inputs,
  MoveCallTransaction,
  TransactionArgument,
  TransactionBlock as ProgrammingTransactionBlockBuilder,
} from './mystenlab/builder';
import { MAX_GAS_OBJECTS } from './constants';
import { WALRUS_PROD_CONFIG, WALRUS_TESTNET_CONFIG } from './resources/walrusConfig';
import { SuiObjectRef } from './mystenlab/types';

export class WalrusStakingBuilder extends TransactionBuilder<WalrusStakingProgrammableTransaction> {
  protected _stakeWithPoolTx: RequestWalrusStakeWithPool[];
  protected _inputObjects: SuiObjectRef[];

  private walrusConfig: any; // TODO improve

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._transaction = new StakingTransaction(_coinConfig);

    // TODO improve mainnet vs. testnet configuration
    this.walrusConfig = _coinConfig.network.type === NetworkType.MAINNET ? WALRUS_PROD_CONFIG : WALRUS_TESTNET_CONFIG;
  }

  /**
   * Build a MoveCall transaction ready to be signed and executed.
   *
   * @returns {BitGoSuiTransaction} an unsigned Sui transaction
   */
  protected buildStakeTransaction(): SuiTransaction<WalrusStakingProgrammableTransaction> {
    return {
      type: SuiTransactionType.WalrusStakeWithPool,
      sender: this._sender,
      tx: {
        inputs: [],
        transactions: [],
      },
      gasData: this._gasData,
    };
  }

  /**
   * Get staking transaction type
   *
   * @return {TransactionType}
   * @protected
   */
  protected get transactionType(): TransactionType {
    return TransactionType.StakingAdd;
  }

  /** @inheritdoc */
  validateTransaction(transaction: TransferTransaction): void {
    if (!transaction.suiTransaction) {
      return;
    }
    this.validateTransactionFields();
  }

  /** @inheritdoc */
  sign(key: BaseKey) {
    this.transaction.setSuiTransaction(this.buildSuiTransaction());
    super.sign(key);
  }

  /**
   * Create a new transaction for staking coins ready to be signed and executed.
   *
   * @param {RequestWalrusStakeWithPool[]} request: a list of staking request
   */
  stake(request: RequestWalrusStakeWithPool[]): this {
    request.forEach((req) => {
      utils.validateAddress(req.validatorAddress, 'validatorAddress');
      assert(utils.isValidAmount(req.amount), 'Invalid recipient amount');

      if (this._sender === req.validatorAddress) {
        throw new BuildTransactionError('Sender address cannot be the same as the Staking address');
      }
    });

    this._stakeWithPoolTx = request;
    return this;
  }

  /**
   * Set the $WAL objects to be used for staking.
   *
   * @param tokens The WAL objects to be used
   * @returns this
   */
  inputObjects(inputObjects: SuiObjectRef[]): this {
    this.validateInputObjects(inputObjects);
    this._inputObjects = inputObjects;
    return this;
  }

  private validateInputObjects(inputObjects: SuiObjectRef[]): void {
    assert(
      inputObjects && inputObjects.length > 0,
      new BuildTransactionError('input objects required before building')
    );
    inputObjects.forEach((inputObject) => {
      this.validateSuiObjectRef(inputObject, 'input object');
    });
  }

  /** @inheritdoc */
  protected fromImplementation(rawTransaction: string): Transaction<WalrusStakingProgrammableTransaction> {
    const tx = new StakingTransaction(this._coinConfig);
    this.validateRawTransaction(rawTransaction);
    tx.fromRawTransaction(rawTransaction);
    this.initBuilder(tx);
    return this.transaction;
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction<WalrusStakingProgrammableTransaction>> {
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

  /**
   * Initialize the transaction builder fields using the decoded transaction data
   *
   * @param {StakingTransaction} tx the transaction data
   */
  initBuilder(tx: Transaction<WalrusStakingProgrammableTransaction>): void {
    this._transaction = tx;

    if (tx.signature && tx.signature.length > 0) {
      this._signatures = [tx.suiSignature];
    }

    const txData = tx.toJson();
    this.type(SuiTransactionType.WalrusStakeWithPool);
    this.sender(txData.sender);
    this.gasData(txData.gasData);

    const requests = utils.getWalrusStakeWithPoolRequests(tx.suiTransaction.tx);
    this.stake(requests);

    assert(txData.inputObjects);
    this.inputObjects(txData.inputObjects);
  }

  /**
   * Validates all fields are defined
   */
  private validateTransactionFields(): void {
    assert(this._type, new BuildTransactionError('type is required before building'));
    assert(this._sender, new BuildTransactionError('sender is required before building'));
    this._stakeWithPoolTx.forEach((req) => {
      assert(req.validatorAddress, new BuildTransactionError('validator address is required before building'));
      assert(req.amount, new BuildTransactionError('staking amount is required before building'));
    });
    assert(this._gasData, new BuildTransactionError('gasData is required before building'));
    this.validateGasData(this._gasData);
    this.validateInputObjects(this._inputObjects);
  }

  /**
   * Build SuiTransaction
   *
   * @return {BitGoSuiTransaction<MoveCallTx>}
   * @protected
   */
  protected buildSuiTransaction(): SuiTransaction<WalrusStakingProgrammableTransaction> {
    this.validateTransactionFields();

    const programmableTxBuilder = new ProgrammingTransactionBlockBuilder();
    switch (this._type) {
      case SuiTransactionType.WalrusStakeWithPool:
        const inputObjects = this._inputObjects.map((token) => programmableTxBuilder.object(Inputs.ObjectRef(token)));
        const mergedObject = inputObjects.shift() as TransactionArgument;

        if (inputObjects.length > 0) {
          programmableTxBuilder.mergeCoins(mergedObject, inputObjects);
        }

        // Create a new coin with staking balance, based on the coins used as gas payment.
        const stakedWals = this._stakeWithPoolTx.map((req) => {
          const splitObject = programmableTxBuilder.splitCoins(mergedObject, [
            programmableTxBuilder.pure(Number(req.amount)),
          ]);
          // Stake the split coin to a specific validator address.
          return programmableTxBuilder.moveCall({
            target: `${this.walrusConfig.WALRUS_PKG_ID}::${this.walrusConfig.WALRUS_STAKING_MODULE_NAME}::${this.walrusConfig.WALRUS_STAKE_WITH_POOL_FUN_NAME}`,
            arguments: [
              programmableTxBuilder.object(Inputs.SharedObjectRef(this.walrusConfig.WALRUS_STAKING_OBJECT)),
              splitObject,
              programmableTxBuilder.object(req.validatorAddress),
            ],
          } as unknown as MoveCallTransaction);
        });

        programmableTxBuilder.transferObjects(stakedWals, programmableTxBuilder.object(this._sender));
        break;
      default:
        throw new InvalidTransactionError(`unsupported target method`);
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
