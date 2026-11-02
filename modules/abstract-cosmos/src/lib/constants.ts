export const DEFAULT_SEED_SIZE_BYTES = 16;
export const sendMsgTypeUrl = '/cosmos.bank.v1beta1.MsgSend';
export const delegateMsgTypeUrl = '/cosmos.staking.v1beta1.MsgDelegate';
export const undelegateMsgTypeUrl = '/cosmos.staking.v1beta1.MsgUndelegate';
export const redelegateTypeUrl = '/cosmos.staking.v1beta1.MsgBeginRedelegate';
export const withdrawDelegatorRewardMsgTypeUrl = '/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward';
export const executeContractMsgTypeUrl = '/cosmwasm.wasm.v1.MsgExecuteContract';
export const groupProposalMsgTypeUrl = '/cosmos.group.v1.MsgSubmitProposal';
export const groupVoteMsgTypeUrl = '/cosmos.group.v1.MsgVote';
export const UNAVAILABLE_TEXT = 'UNAVAILABLE';
export const ROOT_PATH = 'm/0';
/** length in hex characters of a compressed secp256k1 public key */
export const COMPRESSED_PUBLIC_KEY_LENGTH = 66;
export const sendMsgType = '/types.MsgSend'; // thorchain uses this custom message type
