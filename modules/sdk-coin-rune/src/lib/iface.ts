import { CosmosTransactionMessage } from '@bitgo-beta/abstract-cosmos';

export interface MessageData {
  typeUrl: string;
  value: CosmosTransactionMessage;
}
