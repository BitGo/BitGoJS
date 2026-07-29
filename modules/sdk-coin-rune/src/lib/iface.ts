import { CosmosTransactionMessage } from '@bitgo/abstract-cosmos';

export interface MessageData {
  typeUrl: string;
  value: CosmosTransactionMessage;
}
