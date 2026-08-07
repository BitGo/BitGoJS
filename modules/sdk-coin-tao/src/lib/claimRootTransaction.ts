import { Interface as SubstrateInterface, Transaction as SubstrateTransaction } from '@bitgo/abstract-substrate';
import { InvalidTransactionError } from '@bitgo/sdk-core';
import { decode } from '@substrate/txwrapper-polkadot';
import { ClaimRootTxData } from './iface';
import utils from './utils';

export class ClaimRootTransaction extends SubstrateTransaction {
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
    const txMethod = decodedTx.method.args as SubstrateInterface.ClaimRootWithHotkeyArgs;

    const result = super.toJson() as ClaimRootTxData;
    result.hotkey = txMethod.hotkey;

    return result;
  }

  /** @inheritdoc */
  loadInputsAndOutputs(): void {
    if (!this._substrateTransaction) {
      return;
    }

    super.loadInputsAndOutputs();

    const decodedTx = decode(this._substrateTransaction, {
      metadataRpc: this._substrateTransaction.metadataRpc,
      registry: this._registry,
      isImmortalEra: utils.isZeroHex(this._substrateTransaction.era),
    }) as unknown as SubstrateInterface.DecodedTx;
    const txMethod = decodedTx.method.args as SubstrateInterface.ClaimRootWithHotkeyArgs;

    this._outputs.push({
      address: txMethod.hotkey,
      value: '0',
    });
  }

  /** @inheritdoc */
  explainTransaction(): SubstrateInterface.TransactionExplanation {
    const result = this.toJson() as ClaimRootTxData;

    return {
      id: result.id,
      outputAmount: '0',
      changeAmount: '0',
      changeOutputs: [],
      outputs: [{ address: result.hotkey, amount: '0' }],
      fee: {
        fee: result.tip?.toString() || '0',
        type: 'tip',
      },
      type: this.type,
    };
  }
}
