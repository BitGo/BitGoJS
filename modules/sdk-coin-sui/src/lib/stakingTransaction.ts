import {
  BaseKey,
  InvalidTransactionError,
  ParseTransactionError,
  PublicKey as BasePublicKey,
  Signature,
  TransactionRecipient,
  TransactionType,
} from '@bitgo/sdk-core';
import {
  MethodNames,
  ModulesNames,
  MoveCallTx,
  SharedObjectRef,
  SuiObjectRef,
  SuiTransaction,
  SuiTransactionType,
  TransactionExplanation,
  TxData,
  TxDetails,
} from './iface';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import utils from './utils';
import { SUI_PACKAGE_FRAMEWORK_ADDRESS, SUI_GAS_PRICE, TRANSFER_AMOUNT_UNKNOWN_TEXT } from './constants';
import { Buffer } from 'buffer';
import { Transaction } from './transaction';

export class StakingTransaction extends Transaction<MoveCallTx> {
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  get suiTransaction(): SuiTransaction<MoveCallTx> {
    return this._suiTransaction;
  }

  setSuiTransaction(tx: SuiTransaction<MoveCallTx>): void {
    this._suiTransaction = tx;
  }

  addSignature(publicKey: BasePublicKey, signature: Buffer): void {
    this._signatures.push(signature.toString('hex'));
    this._signature = { publicKey, signature };
    this.serialize();
  }

  get suiSignature(): Signature {
    return this._signature;
  }

  /** @inheritdoc */
  canSign(key: BaseKey): boolean {
    return true;
  }

  /** @inheritdoc */
  toBroadcastFormat(): string {
    if (!this._suiTransaction) {
      throw new InvalidTransactionError('Empty transaction');
    }
    return this.serialize();
  }

  /** @inheritdoc */
  toJson(): TxData {
    if (!this._suiTransaction) {
      throw new ParseTransactionError('Empty transaction');
    }
    const suiTx = this._suiTransaction;
    let txDetails: TxDetails;
    switch (suiTx.type) {
      case SuiTransactionType.AddDelegation:
        txDetails = {
          Call: {
            package: suiTx.tx.package || SUI_PACKAGE_FRAMEWORK_ADDRESS,
            module: suiTx.tx.module || ModulesNames.SuiSystem,
            function: suiTx.tx.function || MethodNames.RequestAddDelegationMulCoin,
            typeArguments: suiTx.tx.typeArguments,
            arguments: suiTx.tx.arguments,
          },
        };
        break;
      case SuiTransactionType.WithdrawDelegation:
        txDetails = {
          Call: {
            package: suiTx.tx.package || SUI_PACKAGE_FRAMEWORK_ADDRESS,
            module: suiTx.tx.module || ModulesNames.SuiSystem,
            function: suiTx.tx.function || MethodNames.RequestWithdrawDelegation,
            typeArguments: suiTx.tx.typeArguments,
            arguments: suiTx.tx.arguments,
          },
        };
        break;
      case SuiTransactionType.SwitchDelegation:
        txDetails = {
          Call: {
            package: suiTx.tx.package || SUI_PACKAGE_FRAMEWORK_ADDRESS,
            module: suiTx.tx.module || ModulesNames.SuiSystem,
            function: suiTx.tx.function || MethodNames.RequestSwitchDelegation,
            typeArguments: suiTx.tx.typeArguments,
            arguments: suiTx.tx.arguments,
          },
        };
        break;
      default:
        throw new InvalidTransactionError('SuiTransactionType not supported');
    }

    return {
      id: this._id,
      kind: { Single: txDetails },
      sender: suiTx.sender,
      gasPayment: suiTx.gasPayment,
      gasBudget: suiTx.gasBudget,
      gasPrice: SUI_GAS_PRICE,
    };
  }

  /** @inheritDoc */
  explainTransaction(): TransactionExplanation {
    const result = this.toJson();
    const displayOrder = [
      'id',
      'outputs',
      'outputAmount',
      'changeOutputs',
      'changeAmount',
      'fee',
      'type',
      'module',
      'function',
      'validatorAddress',
    ];
    const outputs: TransactionRecipient[] = [];

    const explanationResult: TransactionExplanation = {
      displayOrder,
      id: this.id,
      outputs,
      outputAmount: '0',
      changeOutputs: [],
      changeAmount: '0',
      fee: { fee: this.suiTransaction.gasBudget.toString() },
      type: this.type,
    };

    switch (this.type) {
      case TransactionType.AddDelegator:
        return this.explainAddDelegationTransaction(result, explanationResult);
      case TransactionType.StakingWithdraw:
        return this.explainWithdrawDelegationTransaction(result, explanationResult);
      case TransactionType.StakingSwitch:
        return this.explainSwitchDelegationTransaction(result, explanationResult);
      default:
        throw new InvalidTransactionError('Transaction type not supported');
    }
  }

  /**
   * Set the transaction type.
   *
   * @param {TransactionType} transactionType The transaction type to be set.
   */
  transactionType(transactionType: TransactionType): void {
    this._type = transactionType;
  }

  /**
   * Load the input and output data on this transaction.
   */
  loadInputsAndOutputs(): void {
    if (!this.suiTransaction) {
      return;
    }
    switch (this.suiTransaction.type) {
      case SuiTransactionType.AddDelegation:
        const staking_amount = this.suiTransaction.tx.arguments[2].toString();
        this._inputs = [
          {
            address: this.suiTransaction.sender,
            value: staking_amount, // staking_amount
            coin: this._coinConfig.name,
          },
        ];
        this._outputs = [
          {
            address: utils.normalizeHexId(this.suiTransaction.tx.arguments[3].toString()), // validator address
            value: staking_amount, // staking_amount
            coin: this._coinConfig.name,
          },
        ];
        break;
      case SuiTransactionType.WithdrawDelegation:
        this._inputs = [
          {
            address: utils.normalizeHexId((this.suiTransaction.tx.arguments[1] as SuiObjectRef).objectId), // delegator address
            value: TRANSFER_AMOUNT_UNKNOWN_TEXT,
            coin: this._coinConfig.name,
          },
        ];
        this._outputs = [
          {
            address: this.suiTransaction.sender,
            value: TRANSFER_AMOUNT_UNKNOWN_TEXT,
            coin: this._coinConfig.name,
          },
        ];
        break;
      case SuiTransactionType.SwitchDelegation:
        this._inputs = [
          {
            address: this.suiTransaction.sender,
            value: TRANSFER_AMOUNT_UNKNOWN_TEXT,
            coin: this._coinConfig.name,
          },
        ];
        this._outputs = [
          {
            address: utils.normalizeHexId(this.suiTransaction.tx.arguments[3].toString()), // validator address
            value: TRANSFER_AMOUNT_UNKNOWN_TEXT,
            coin: this._coinConfig.name,
          },
        ];
        break;
      default:
        return;
    }
  }

  /**
   * Sets this transaction payload
   *
   * @param {string} rawTransaction
   */
  fromRawTransaction(rawTransaction: string): void {
    try {
      utils.isValidRawTransaction(rawTransaction);
      this._suiTransaction = Transaction.deserializeSuiTransaction(rawTransaction) as SuiTransaction<MoveCallTx>;
      this._type = utils.getTransactionType(this._suiTransaction.tx.function);
      this.loadInputsAndOutputs();
    } catch (e) {
      throw e;
    }
  }

  /**
   * Helper function for serialize() to get the correct txData with transaction type
   *
   * @return {TxData}
   */
  getTxData(): TxData {
    const suiTx = this._suiTransaction;
    let tx: TxDetails;

    switch (suiTx.type) {
      case SuiTransactionType.AddDelegation:
        tx = {
          Call: {
            package: suiTx.tx.package || SUI_PACKAGE_FRAMEWORK_ADDRESS,
            module: suiTx.tx.module || ModulesNames.SuiSystem,
            function: suiTx.tx.function || MethodNames.RequestAddDelegationMulCoin,
            typeArguments: suiTx.tx.typeArguments,
            arguments: [
              utils.mapSharedObjectToCallArg(suiTx.tx.arguments[0] as SharedObjectRef),
              utils.mapCoinsToCallArg(suiTx.tx.arguments[1] as SuiObjectRef[]),
              utils.mapAmountToCallArg(Number(suiTx.tx.arguments[2])),
              utils.mapAddressToCallArg(suiTx.tx.arguments[3].toString()),
            ],
          },
        };
        break;
      case SuiTransactionType.WithdrawDelegation:
        tx = {
          Call: {
            package: suiTx.tx.package || SUI_PACKAGE_FRAMEWORK_ADDRESS,
            module: suiTx.tx.module || ModulesNames.SuiSystem,
            function: suiTx.tx.function || MethodNames.RequestWithdrawDelegation,
            typeArguments: suiTx.tx.typeArguments,
            arguments: [
              utils.mapSharedObjectToCallArg(suiTx.tx.arguments[0] as SharedObjectRef),
              utils.mapSuiObjectRefToCallArg(suiTx.tx.arguments[1] as SuiObjectRef),
              utils.mapSuiObjectRefToCallArg(suiTx.tx.arguments[2] as SuiObjectRef),
            ],
          },
        };
        break;
      case SuiTransactionType.SwitchDelegation:
        tx = {
          Call: {
            package: suiTx.tx.package || SUI_PACKAGE_FRAMEWORK_ADDRESS,
            module: suiTx.tx.module || ModulesNames.SuiSystem,
            function: suiTx.tx.function || MethodNames.RequestSwitchDelegation,
            typeArguments: suiTx.tx.typeArguments,
            arguments: [
              utils.mapSharedObjectToCallArg(suiTx.tx.arguments[0] as SharedObjectRef),
              utils.mapSuiObjectRefToCallArg(suiTx.tx.arguments[1] as SuiObjectRef),
              utils.mapSuiObjectRefToCallArg(suiTx.tx.arguments[2] as SuiObjectRef),
              utils.mapAddressToCallArg(suiTx.tx.arguments[3].toString()),
            ],
          },
        };
        break;
      default:
        throw new InvalidTransactionError(`Sui StakingTransaction type ${suiTx.type} not supported`);
    }

    return {
      kind: { Single: tx },
      gasPayment: suiTx.gasPayment,
      gasPrice: SUI_GAS_PRICE,
      gasBudget: suiTx.gasBudget,
      sender: suiTx.sender,
    };
  }

  /**
   * Returns a complete explanation for a transfer transaction
   *
   * @param {TxData} json The transaction data in json format
   * @param {TransactionExplanation} explanationResult The transaction explanation to be completed
   * @returns {TransactionExplanation}
   */
  explainAddDelegationTransaction(json: TxData, explanationResult: TransactionExplanation): TransactionExplanation {
    const amount = this.suiTransaction.tx.arguments[2];
    return {
      ...explanationResult,
      fee: {
        fee: this.suiTransaction.gasBudget.toString(),
      },
      type: TransactionType.AddDelegator,
      outputs: [
        {
          address: utils.normalizeHexId(this.suiTransaction.tx.arguments[3].toString()),
          amount: Number(amount),
        },
      ],
      outputAmount: amount,
    };
  }

  /**
   * Returns a complete explanation for a withdraw delegation transaction
   *
   * @param {TxData} json The transaction data in json format
   * @param {TransactionExplanation} explanationResult The transaction explanation to be completed
   * @returns {TransactionExplanation}
   */
  explainWithdrawDelegationTransaction(
    json: TxData,
    explanationResult: TransactionExplanation
  ): TransactionExplanation {
    return {
      ...explanationResult,
      fee: {
        fee: this.suiTransaction.gasBudget.toString(),
      },
      type: TransactionType.StakingWithdraw,
      outputs: [
        {
          address: json.sender,
          amount: TRANSFER_AMOUNT_UNKNOWN_TEXT,
        },
      ],
    };
  }

  /**
   * Returns a complete explanation for a switch delegation transaction
   *
   * @param {TxData} json The transaction data in json format
   * @param {TransactionExplanation} explanationResult The transaction explanation to be completed
   * @returns {TransactionExplanation}
   */
  explainSwitchDelegationTransaction(json: TxData, explanationResult: TransactionExplanation): TransactionExplanation {
    return {
      ...explanationResult,
      fee: {
        fee: this.suiTransaction.gasBudget.toString(),
      },
      type: TransactionType.StakingSwitch,
      outputs: [
        {
          address: json.sender,
          amount: TRANSFER_AMOUNT_UNKNOWN_TEXT,
        },
        {
          address: utils.normalizeHexId(this.suiTransaction.tx.arguments[3].toString()),
          amount: TRANSFER_AMOUNT_UNKNOWN_TEXT,
        },
      ],
    };
  }
}
