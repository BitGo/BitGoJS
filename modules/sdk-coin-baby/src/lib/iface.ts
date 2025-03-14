import { btcstakingtx } from '@babylonlabs-io/babylon-proto-ts';

export interface CreateBtcDelegationMessage extends btcstakingtx.MsgCreateBTCDelegation {
  kind: 'CreateBtcDelegation';
}

export type CustomTxMessage = CreateBtcDelegationMessage;
