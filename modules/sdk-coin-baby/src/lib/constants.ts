import { CosmosUtils } from '@bitgo/abstract-cosmos';
import { Networks } from '@bitgo/statics';

const cosmosUtils = new CosmosUtils();
const HRP = Networks.main.baby.addressPrefix;
export const validDenoms = ['baby', 'tbaby', 'ubbn', ...cosmosUtils.getTokenDenomsUsingCoinFamily('baby')];
export const accountAddressRegex = new RegExp(`^(${HRP})1(['qpzry9x8gf2tvdw0s3jn54khce6mua7l]{38})$`);
export const validatorAddressRegex = new RegExp(`^(${HRP}valoper)1(['qpzry9x8gf2tvdw0s3jn54khce6mua7l]{38})$`);
export const contractAddressRegex = new RegExp(`^(${HRP})1(['qpzry9x8gf2tvdw0s3jn54khce6mua7l]+)$`);
/** @deprecated Use `Networks.main.baby.addressPrefix` from `@bitgo/statics` instead. */
export const ADDRESS_PREFIX = HRP;
export const GAS_AMOUNT = '7000';
export const GAS_LIMIT = 200000;
export const UNAVAILABLE_TEXT = 'UNAVAILABLE';
export const wrappedDelegateMsgTypeUrl = '/babylon.epoching.v1.MsgWrappedDelegate';
export const wrappedUndelegateMsgTypeUrl = '/babylon.epoching.v1.MsgWrappedUndelegate';
export const wrappedBeginRedelegateTypeUrl = '/babylon.epoching.v1.MsgWrappedBeginRedelegate';
export const createBTCDelegationMsgTypeUrl = '/babylon.btcstaking.v1.MsgCreateBTCDelegation';
export const withdrawRewardMsgTypeUrl = '/babylon.incentive.MsgWithdrawReward';
