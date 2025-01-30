import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { Transaction } from './transaction';

export class TransferTransaction extends Transaction {
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  /**
   * Sets this transaction payload
   *
   * @param {string} rawTransaction
   */
  fromRawTransaction(rawTransaction: string): void {
    try {
      const parsedTx = JSON.parse(rawTransaction);
      this.IcpTransactionData = {
        senderAddress: parsedTx.address,
        receiverAddress: parsedTx.externalOutputs[0].address,
        amount: parsedTx.inputAmount,
        fee: parsedTx.fee, //TODO: check if this is correct
        senderPublicKeyHex: parsedTx.senderPublicKey,
        sequenceNumber: parsedTx.seqno,
        transactionType: parsedTx.type,
        expireTime: parsedTx.expireTime,
        id: parsedTx.id,
        coin: parsedTx.coin,
      };
    } catch (e) {
      throw e;
    }
  }
}
