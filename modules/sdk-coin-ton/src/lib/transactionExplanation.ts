import { IAddressRecipient } from '@bitgo/sdk-core';

export interface ITransactionExplanation<TFee = any, TAmount = any> {
  displayOrder: string[];
  id: string;
  outputs: IAddressRecipient[];
  outputAmount: TAmount;
  changeOutputs: IAddressRecipient[];
  changeAmount: TAmount;
  fee: TFee;
  proxy?: string;
  producers?: string[];
  withdrawAmount?: string;
}
