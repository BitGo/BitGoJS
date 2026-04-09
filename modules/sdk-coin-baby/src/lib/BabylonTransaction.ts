import { CosmosTransaction, CosmosUtils, TransactionExplanation, TxData } from '@bitgo/abstract-cosmos';
import { Entry, InvalidTransactionError, TransactionRecipient, TransactionType } from '@bitgo/sdk-core';
import { BabylonSpecificMessages, WithdrawRewardMessage } from './iface';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { UNAVAILABLE_TEXT } from './constants';

export class BabylonTransaction extends CosmosTransaction<BabylonSpecificMessages> {
  constructor(_coinConfig: Readonly<CoinConfig>, _utils: CosmosUtils<BabylonSpecificMessages>) {
    super(_coinConfig, _utils);
  }

  override explainTransactionInternal(
    json: TxData<BabylonSpecificMessages>,
    explanationResult: TransactionExplanation
  ): TransactionExplanation {
    let outputs: TransactionRecipient[];
    let outputAmount;
    switch (json.type) {
      case TransactionType.CustomTx:
        explanationResult.type = TransactionType.CustomTx;
        outputAmount = BigInt(0);
        outputs = json.sendMessages.flatMap((message) => {
          const value = message.value as BabylonSpecificMessages;
          switch (value._kind) {
            case 'CreateBtcDelegation':
              return [];
            case 'WithdrawReward':
              return [
                {
                  address: (value as WithdrawRewardMessage).address,
                  amount: UNAVAILABLE_TEXT,
                },
              ];
            default:
              throw new InvalidTransactionError(`Unsupported BabylonSpecificMessages message`);
          }
        });
        break;
      default:
        return super.explainTransactionInternal(json, explanationResult);
    }
    if (json.memo) {
      outputs.forEach((output) => {
        output.memo = json.memo;
      });
    }
    return {
      ...explanationResult,
      outputAmount: outputAmount?.toString(),
      outputs,
    };
  }

  override loadInputsAndOutputs(): void {
    if (this.type === undefined || !this.cosmosLikeTransaction) {
      throw new InvalidTransactionError('Transaction type or cosmosLikeTransaction is not set');
    }

    const outputs: Entry[] = [];
    const inputs: Entry[] = [];
    switch (this.type) {
      case TransactionType.CustomTx:
        this.cosmosLikeTransaction.sendMessages.forEach((message) => {
          const value = message.value as BabylonSpecificMessages;
          switch (value._kind) {
            case 'CreateBtcDelegation':
              break;
            case 'WithdrawReward':
              inputs.push({
                address: (value as WithdrawRewardMessage).address,
                value: UNAVAILABLE_TEXT,
                coin: this._coinConfig.name,
              });
              outputs.push({
                address: (value as WithdrawRewardMessage).address,
                value: UNAVAILABLE_TEXT,
                coin: this._coinConfig.name,
              });
              break;
            default:
              throw new InvalidTransactionError(`Unsupported BabylonSpecificMessages message`);
          }
        });
        break;
      default:
        return super.loadInputsAndOutputs();
    }
    this._inputs = inputs;
    this._outputs = outputs;
  }
}
