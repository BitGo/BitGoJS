import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { BaseKey, BuildTransactionError, InvalidTransactionError, TransactionType } from '@bitgo/sdk-core';
import {
  SuiTransaction,
  RequestAddStake,
  RequestWithdrawStakedSui,
  SuiTransactionType,
  StakingProgrammableTransaction,
} from './iface';
import { TransactionBuilder } from './transactionBuilder';
import { Transaction } from './transaction';
import utils from './utils';
import assert from 'assert';
import { TransferTransaction } from './transferTransaction';
import { StakingTransaction } from './stakingTransaction';
import {
  TransactionBlock as ProgrammingTransactionBlockBuilder,
  MoveCallTransaction,
  Inputs,
} from './mystenlab/builder';
import BigNumber from 'bignumber.js';
import {
  ADD_STAKE_FUN_NAME,
  SUI_SYSTEM_ADDRESS,
  SUI_SYSTEM_MODULE_NAME,
  SUI_SYSTEM_STATE_OBJECT,
  WITHDRAW_STAKE_FUN_NAME,
} from './mystenlab/framework';
import { BCS } from '@mysten/bcs';
import { MAX_COMMAND_ARGS, MAX_GAS_OBJECTS } from './constants';

export class StakingBuilder extends TransactionBuilder<StakingProgrammableTransaction> {
  protected _addStakeTx: RequestAddStake[];
  protected _withdrawDelegation: RequestWithdrawStakedSui;
  protected _fundsInAddressBalance: BigNumber = new BigNumber(0);

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._transaction = new StakingTransaction(_coinConfig);
  }

  /**
   * Build a MoveCall transaction ready to be signed and executed.
   *
   * @returns {BitGoSuiTransaction} an unsigned Sui transaction
   */
  protected buildStakeTransaction(): SuiTransaction<StakingProgrammableTransaction> {
    return {
      type: SuiTransactionType.AddStake,
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
   * @param {RequestAddStake[]} request: a list of staking request
   */
  stake(request: RequestAddStake[]): this {
    request.forEach((req) => {
      utils.validateAddress(req.validatorAddress, 'validatorAddress');
      assert(utils.isValidAmount(req.amount), 'Invalid recipient amount');

      if (this._sender === req.validatorAddress) {
        throw new BuildTransactionError('Sender address cannot be the same as the Staking address');
      }
    });

    this._addStakeTx = request;
    return this;
  }

  /**
   * Create a new transaction for withdrawing coins ready to be signed
   *
   * @param {RequestWithdrawStakedSui} request
   */
  unstake(request: RequestWithdrawStakedSui): this {
    this.validateSuiObjectRef(request.stakedSui, 'stakedSui');
    this._withdrawDelegation = request;
    return this;
  }

  /**
   * Set the amount of SUI held in the sender's address balance system.
   * When set, the PTB will redeem this amount as a Coin<SUI> and merge it
   * into the gas coin before splitting the stake amount.
   *
   * @param {string} amount - amount in MIST held in address balance
   */
  fundsInAddressBalance(amount: string): this {
    this._fundsInAddressBalance = new BigNumber(amount);
    return this;
  }

  /** @inheritdoc */
  protected fromImplementation(rawTransaction: string): Transaction<StakingProgrammableTransaction> {
    const tx = new StakingTransaction(this._coinConfig);
    this.validateRawTransaction(rawTransaction);
    tx.fromRawTransaction(rawTransaction);
    this.initBuilder(tx);
    return this.transaction;
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction<StakingProgrammableTransaction>> {
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
  initBuilder(tx: Transaction<StakingProgrammableTransaction>): void {
    this._transaction = tx;

    if (tx.signature && tx.signature.length > 0) {
      this._signatures = [tx.suiSignature];
    }

    const txData = tx.toJson();
    this.type(SuiTransactionType.AddStake);
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

    const requests = utils.getStakeRequests(tx.suiTransaction.tx);
    this.stake(requests);
  }

  /**
   * Validates all fields are defined
   */
  private validateTransactionFields(): void {
    assert(this._type, new BuildTransactionError('type is required before building'));
    assert(this._sender, new BuildTransactionError('sender is required before building'));
    this._addStakeTx.forEach((req) => {
      assert(req.validatorAddress, new BuildTransactionError('validator address is required before building'));
      assert(req.amount, new BuildTransactionError('staking amount is required before building'));
    });
    assert(this._gasData, new BuildTransactionError('gasData is required before building'));
    this.validateGasData(this._gasData);
  }

  /**
   * Build SuiTransaction
   *
   * @return {BitGoSuiTransaction<MoveCallTx>}
   * @protected
   */
  protected buildSuiTransaction(): SuiTransaction<StakingProgrammableTransaction> {
    this.validateTransactionFields();

    const programmableTxBuilder = new ProgrammingTransactionBlockBuilder();
    switch (this._type) {
      case SuiTransactionType.AddStake:
        // number of objects passed as gas payment should be strictly less than `MAX_GAS_OBJECTS`. When the transaction
        // requires a larger number of inputs we use the merge command to merge the rest of the objects into the gasCoin
        if (this._gasData.payment.length >= MAX_GAS_OBJECTS) {
          const gasPaymentObjects = this._gasData.payment
            .slice(MAX_GAS_OBJECTS - 1)
            .map((object) => Inputs.ObjectRef(object));

          // limit for total number of `args: CallArg[]` for a single command is MAX_COMMAND_ARGS so the max length of
          // `sources[]` for a `mergeCoins(destination, sources[])` command is MAX_COMMAND_ARGS - 1 (1 used up for
          // `destination`). We need to create a total of `gasPaymentObjects/(MAX_COMMAND_ARGS - 1)` merge commands to
          // merge all the objects
          while (gasPaymentObjects.length > 0) {
            programmableTxBuilder.mergeCoins(
              programmableTxBuilder.gas,
              gasPaymentObjects.splice(0, MAX_COMMAND_ARGS - 1).map((object) => programmableTxBuilder.object(object))
            );
          }
        }

        // When the sender has funds in the address balance system, redeem them as a
        // Coin<SUI> and merge into the gas coin so SplitCoins can draw from the full
        // available balance (coin objects + address balance).
        if (this._fundsInAddressBalance.gt(0)) {
          const [addrCoin] = programmableTxBuilder.moveCall({
            target: '0x2::coin::redeem_funds',
            typeArguments: ['0x2::sui::SUI'],
            arguments: [programmableTxBuilder.withdrawal({ amount: BigInt(this._fundsInAddressBalance.toFixed()) })],
          });
          programmableTxBuilder.mergeCoins(programmableTxBuilder.gas, [addrCoin]);
        }

        // Create a new coin with staking balance, based on the coins used as gas payment.
        this._addStakeTx.forEach((req) => {
          const coin = programmableTxBuilder.splitCoins(programmableTxBuilder.gas, [
            programmableTxBuilder.pure(req.amount),
          ]);
          // Stake the split coin to a specific validator address.
          programmableTxBuilder.moveCall({
            target: `${SUI_SYSTEM_ADDRESS}::${SUI_SYSTEM_MODULE_NAME}::${ADD_STAKE_FUN_NAME}`,
            arguments: [
              programmableTxBuilder.object(Inputs.SharedObjectRef(SUI_SYSTEM_STATE_OBJECT)),
              coin,
              programmableTxBuilder.pure(Inputs.Pure(req.validatorAddress, BCS.ADDRESS)),
            ],
          } as unknown as MoveCallTransaction);
        });
        break;
      case SuiTransactionType.WithdrawStake:
        // Unstake staked object.
        programmableTxBuilder.moveCall({
          target: `${SUI_SYSTEM_ADDRESS}::${SUI_SYSTEM_MODULE_NAME}::${WITHDRAW_STAKE_FUN_NAME}`,
          arguments: [
            programmableTxBuilder.object(Inputs.SharedObjectRef(SUI_SYSTEM_STATE_OBJECT)),
            programmableTxBuilder.pure(Inputs.ObjectRef(this._withdrawDelegation.stakedSui)),
          ],
        } as unknown as MoveCallTransaction);
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
      expiration: this._expiration,
      fundsInAddressBalance: this._fundsInAddressBalance.gt(0) ? this._fundsInAddressBalance.toFixed() : undefined,
    };
  }
}
