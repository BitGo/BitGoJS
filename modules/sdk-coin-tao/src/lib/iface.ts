import { Interface } from '@bitgo/abstract-substrate';

export interface TransferStakeTxData extends Interface.TxData {
  destinationColdkey: string;
  hotkey: string;
  originNetuid: string;
  destinationNetuid: string;
  alphaAmount: string;
}
