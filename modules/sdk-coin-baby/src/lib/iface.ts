import { btcstakingtx } from '@babylonlabs-io/babylon-proto-ts';

export type BabylonSpecificMessageKind = 'CreateBtcDelegation';

type WithKind<T, Kind extends BabylonSpecificMessageKind> = T & {
  _kind: Kind;
};

export type CreateBtcDelegationMessage = WithKind<btcstakingtx.MsgCreateBTCDelegation, 'CreateBtcDelegation'>;

export type BabylonSpecificMessages = CreateBtcDelegationMessage; // union other babylon specific message types here
