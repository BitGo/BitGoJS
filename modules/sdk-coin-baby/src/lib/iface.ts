import { btcstakingtx, incentivetx } from '@babylonlabs-io/babylon-proto-ts';

export type BabylonSpecificMessageKind = 'CreateBtcDelegation' | 'WithdrawReward';

type WithKind<T, Kind extends BabylonSpecificMessageKind> = T & {
  _kind: Kind;
};

export type CreateBtcDelegationMessage = WithKind<btcstakingtx.MsgCreateBTCDelegation, 'CreateBtcDelegation'>;
export type WithdrawRewardMessage = WithKind<incentivetx.MsgWithdrawReward, 'WithdrawReward'>;

// union other babylon specific message types here
export type BabylonSpecificMessages = CreateBtcDelegationMessage | WithdrawRewardMessage;
