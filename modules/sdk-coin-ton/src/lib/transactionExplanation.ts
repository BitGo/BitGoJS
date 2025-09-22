import { ITransactionRecipient } from '@bitgo-beta/sdk-core';

export interface ITransactionExplanation<TFee = any, TAmount = any> {
  displayOrder: string[];
  id: string;
  outputs: ITransactionRecipient[];
  outputAmount: TAmount;
  changeOutputs: ITransactionRecipient[];
  changeAmount: TAmount;
  fee: TFee;
  proxy?: string;
  producers?: string[];
  withdrawAmount?: string;
}
