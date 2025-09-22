import { Interface } from '@bitgo-beta/abstract-substrate';

export interface TransferStakeTxData extends Interface.TxData {
  destinationColdkey: string;
  hotkey: string;
  originNetuid: string;
  destinationNetuid: string;
  alphaAmount: string;
}

export interface MoveStakeTxData extends Interface.TxData {
  originHotkey: string;
  destinationHotkey: string;
  originNetuid: string;
  destinationNetuid: string;
  alphaAmount: string;
}
