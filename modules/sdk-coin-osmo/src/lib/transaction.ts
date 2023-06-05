import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { fromHex, toBase64 } from '@cosmjs/encoding';

import osmoUtils from './utils';
import { CosmosTransaction } from '@bitgo/abstract-cosmos';

export class OsmoTransaction extends CosmosTransaction {
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  /**
   * Sets this transaction payload
   * @param rawTransaction raw transaction in base64 encoded string
   */
  enrichTransactionDetailsFromRawTransaction(rawTransaction: string): void {
    if (osmoUtils.isValidHexString(rawTransaction)) {
      this.cosmosLikeTransaction = osmoUtils.deserializeOsmoTransaction(toBase64(fromHex(rawTransaction)));
    } else {
      this.cosmosLikeTransaction = osmoUtils.deserializeOsmoTransaction(rawTransaction);
    }
    if (this.cosmosLikeTransaction.signature) {
      this.addSignature(Buffer.from(this.cosmosLikeTransaction.signature).toString('hex'));
    }
    const typeUrl = this.cosmosLikeTransaction.sendMessages[0].typeUrl;
    const transactionType = osmoUtils.getTransactionTypeFromTypeUrl(typeUrl);

    if (transactionType === undefined) {
      throw new Error('Transaction type is not supported ' + typeUrl);
    }
    this.transactionType = transactionType;
  }
}
