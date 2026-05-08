import { Interface as SubstrateInterface, Transaction as SubstrateTransaction } from '@bitgo/abstract-substrate';
import { InvalidTransactionError } from '@bitgo/sdk-core';
import { decode } from '@substrate/txwrapper-polkadot';
import { MoveStakeTxData } from './iface';
import utils from './utils';

export class MoveStakeTransaction extends SubstrateTransaction {
  /** @inheritdoc */
  toJson(): SubstrateInterface.TxData {
    if (!this._substrateTransaction) {
      throw new InvalidTransactionError('Empty transaction');
    }

    const decodedTx = decode(this._substrateTransaction, {
      metadataRpc: this._substrateTransaction.metadataRpc,
      registry: this._registry,
      isImmortalEra: utils.isZeroHex(this._substrateTransaction.era),
    }) as unknown as SubstrateInterface.DecodedTx;
    const txMethod = decodedTx.method.args as SubstrateInterface.MoveStakeArgs;

    const result = super.toJson() as MoveStakeTxData;
    result.originHotkey = txMethod.originHotkey;
    result.destinationHotkey = txMethod.destinationHotkey;
    result.originNetuid = txMethod.originNetuid;
    result.destinationNetuid = txMethod.destinationNetuid;
    result.alphaAmount = txMethod.alphaAmount;

    return result;
  }

  /** @inheritdoc */
  loadInputsAndOutputs(): void {
    super.loadInputsAndOutputs();

    const decodedTx = decode(this._substrateTransaction, {
      metadataRpc: this._substrateTransaction.metadataRpc,
      registry: this._registry,
      isImmortalEra: utils.isZeroHex(this._substrateTransaction.era),
    }) as unknown as SubstrateInterface.DecodedTx;
    const txMethod = decodedTx.method.args as SubstrateInterface.MoveStakeArgs;

    this._inputs.push({
      address: txMethod.originHotkey,
      value: txMethod.alphaAmount,
    });

    this._outputs.push({
      address: txMethod.destinationHotkey,
      value: txMethod.alphaAmount,
    });
  }

  /** @inheritdoc */
  explainTransaction(): SubstrateInterface.TransactionExplanation {
    const result = this.toJson() as MoveStakeTxData;

    const explanationResult: SubstrateInterface.TransactionExplanation = {
      id: result.id,
      outputAmount: result.alphaAmount?.toString() || '0',
      changeAmount: '0',
      changeOutputs: [],
      outputs: [],
      fee: {
        fee: result.tip?.toString() || '',
        type: 'tip',
      },
      type: this.type,
    };
    return explanationResult;
  }
}
