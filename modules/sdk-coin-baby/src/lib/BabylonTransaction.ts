import { CosmosTransaction, CosmosUtils, TransactionExplanation, TxData } from '@bitgo/abstract-cosmos';
import { Entry, InvalidTransactionError, TransactionRecipient, TransactionType } from '@bitgo/sdk-core';
import { BabylonSpecificMessages } from './iface';
import { BaseCoin as CoinConfig } from '@bitgo/statics';

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
        outputs = [];
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
        break;
      default:
        return super.loadInputsAndOutputs();
    }
    this._inputs = inputs;
    this._outputs = outputs;
  }
}
