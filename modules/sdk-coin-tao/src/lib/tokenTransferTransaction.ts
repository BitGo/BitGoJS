import { Interface as SubstrateInterface, Transaction as SubstrateTransaction } from '@bitgo/abstract-substrate';
import { InvalidTransactionError, TransactionRecipient } from '@bitgo/sdk-core';
import { decode } from '@substrate/txwrapper-polkadot';
import { TransferStakeTxData } from './iface';
import utils from './utils';

export class TokenTransferTransaction extends SubstrateTransaction {
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
    const txMethod = decodedTx.method.args as SubstrateInterface.TransferStakeArgs;

    const result = super.toJson() as TransferStakeTxData;
    result.destinationColdkey = txMethod.destinationColdkey;
    result.hotkey = txMethod.hotkey;
    result.originNetuid = txMethod.originNetuid;
    result.destinationNetuid = txMethod.destinationNetuid;
    result.alphaAmount = txMethod.alphaAmount;

    return result;
  }

  /** @inheritdoc */
  explainTransaction(): SubstrateInterface.TransactionExplanation {
    const result = this.toJson();
    const outputs: TransactionRecipient[] = this._outputs.map((output) => {
      return {
        address: output.address,
        amount: output.value,
        tokenName: output.coin,
      };
    });

    const explanationResult: SubstrateInterface.TransactionExplanation = {
      id: result.id,
      outputAmount: result.amount?.toString() || '0',
      changeAmount: '0',
      changeOutputs: [],
      outputs,
      fee: {
        fee: result.tip?.toString() || '',
        type: 'tip',
      },
      type: this.type,
    };
    return explanationResult;
  }
}
