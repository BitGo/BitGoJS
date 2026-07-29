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
import { WalrusStakingTransaction } from './walrusStakingTransaction';
import {
  Inputs,
  MoveCallTransaction,
  TransactionArgument,
  TransactionBlock as ProgrammingTransactionBlockBuilder,
} from './mystenlab/builder';
import { MAX_GAS_OBJECTS } from './constants';
import { WALRUS_PROD_CONFIG, WALRUS_TESTNET_CONFIG } from './resources/walrusConfig';
import { SuiObjectRef } from './mystenlab/types';
import BigNumber from 'bignumber.js';

export class WalrusStakingBuilder extends TransactionBuilder<WalrusStakingProgrammableTransaction> {
  protected _stakeWithPoolTx: RequestWalrusStakeWithPool[];
  protected _inputObjects: SuiObjectRef[];
  protected _fundsInAddressBalance: BigNumber = new BigNumber(0);

  private walrusConfig: any; // TODO improve

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._transaction = new WalrusStakingTransaction(_coinConfig);

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

  /**
   * Set the amount of WAL held in the sender's address balance system.
   * When set, the PTB will redeem this amount as a Coin<WAL> before
   * merging/splitting and staking. WAL principal can come from coin
   * objects, address balance, or a mix.
   *
   * @param {string} amount - amount in WAL base units held in address balance
   */
  fundsInAddressBalance(amount: string): this {
    this._fundsInAddressBalance = new BigNumber(amount);
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
    const tx = new WalrusStakingTransaction(this._coinConfig);
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
   * @param {WalrusStakingTransaction} tx the transaction data
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

    if (txData.expiration && !('None' in txData.expiration)) {
      this._expiration = txData.expiration;
    }

    // Restore fundsInAddressBalance from BalanceWithdrawal input if present.
    const withdrawalInput = (tx.suiTransaction?.tx?.inputs as any[])?.find(
      (input: any) =>
        (input !== null && typeof input === 'object' && 'BalanceWithdrawal' in input) ||
        (input?.value !== null && typeof input?.value === 'object' && 'BalanceWithdrawal' in (input.value ?? {}))
    );
    if (withdrawalInput) {
      const bw = withdrawalInput.BalanceWithdrawal ?? withdrawalInput.value?.BalanceWithdrawal;
      this._fundsInAddressBalance = new BigNumber(String(bw.reservation?.MaxAmountU64 ?? bw.amount));
    }

    const requests = utils.getWalrusStakeWithPoolRequests(tx.suiTransaction.tx);
    this.stake(requests);

    if (txData.inputObjects && txData.inputObjects.length > 0) {
      this.inputObjects(txData.inputObjects);
    }
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
    const hasInputObjects = this._inputObjects && this._inputObjects.length > 0;
    const hasAddrBal = this._fundsInAddressBalance && this._fundsInAddressBalance.gt(0);
    assert(
      hasInputObjects || hasAddrBal,
      new BuildTransactionError('either inputObjects or fundsInAddressBalance is required before building')
    );
    if (hasInputObjects) {
      this._inputObjects.forEach((inputObject) => {
        this.validateSuiObjectRef(inputObject, 'input object');
      });
    }
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
      case SuiTransactionType.WalrusStakeWithPool: {
        const walCoinType = `${this.walrusConfig.WAL_PKG_ID}::${this.walrusConfig.WAL_COIN_MODULE_NAME}::${this.walrusConfig.WAL_COIN_NAME}`;

        // Step 1: consolidate any provided Coin<WAL> objects into a single coin.
        let baseWalCoin: TransactionArgument | undefined;
        if (this._inputObjects && this._inputObjects.length > 0) {
          const inputObjects = this._inputObjects.map((token) => programmableTxBuilder.object(Inputs.ObjectRef(token)));
          baseWalCoin = inputObjects.shift() as TransactionArgument;
          if (inputObjects.length > 0) {
            programmableTxBuilder.mergeCoins(baseWalCoin, inputObjects);
          }
        }

        // Step 2: redeem address-balance funds as a Coin<WAL> if requested.
        let redeemedCoin: TransactionArgument | undefined;
        if (this._fundsInAddressBalance.gt(0)) {
          const [coin] = programmableTxBuilder.moveCall({
            target: '0x2::coin::redeem_funds',
            typeArguments: [walCoinType],
            arguments: [
              programmableTxBuilder.withdrawal({
                amount: BigInt(this._fundsInAddressBalance.toFixed()),
                type: walCoinType,
              }),
            ],
          });
          redeemedCoin = coin;
        }

        // Step 3: combine into a single definite walCoin.
        let walCoin: TransactionArgument;
        if (baseWalCoin !== undefined && redeemedCoin !== undefined) {
          programmableTxBuilder.mergeCoins(baseWalCoin, [redeemedCoin]);
          walCoin = baseWalCoin;
        } else if (baseWalCoin !== undefined) {
          walCoin = baseWalCoin;
        } else if (redeemedCoin !== undefined) {
          walCoin = redeemedCoin;
        } else {
          // Unreachable: validateTransactionFields ensures at least one source.
          throw new BuildTransactionError('either inputObjects or fundsInAddressBalance is required before building');
        }

        // Create a new coin with staking balance and stake each request.
        const stakedWals = this._stakeWithPoolTx.map((req) => {
          const splitObject = programmableTxBuilder.splitCoins(walCoin, [
            programmableTxBuilder.pure(Number(req.amount)),
          ]);
          return programmableTxBuilder.moveCall({
            target: `${this.walrusConfig.WALRUS_PKG_ID}::${this.walrusConfig.WALRUS_STAKING_MODULE_NAME}::${this.walrusConfig.WALRUS_STAKE_WITH_POOL_FUN_NAME}`,
            arguments: [
              programmableTxBuilder.object(Inputs.SharedObjectRef(this.walrusConfig.WALRUS_STAKING_OBJECT)),
              splitObject,
              programmableTxBuilder.object(req.validatorAddress),
            ],
          } as unknown as MoveCallTransaction);
        });

        // Transfer staked WAL objects back to sender.
        programmableTxBuilder.transferObjects(stakedWals, programmableTxBuilder.object(this._sender));

        // Coin<WAL> cannot be merged into the SUI gas coin — transfer any
        // residual WAL coin back to sender to avoid a no-drop violation.
        if (redeemedCoin !== undefined) {
          programmableTxBuilder.transferObjects([walCoin], programmableTxBuilder.object(this._sender));
        }

        break;
      }
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
      expiration: this._expiration,
      fundsInAddressBalance: this._fundsInAddressBalance.gt(0) ? this._fundsInAddressBalance.toFixed() : undefined,
    };
  }
}
