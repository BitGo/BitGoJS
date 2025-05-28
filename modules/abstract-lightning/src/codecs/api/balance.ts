import * as t from 'io-ts';
import { BigIntFromString } from 'io-ts-types/BigIntFromString';

// codecs for lightning wallet balance api

export const LndAmount = t.strict(
  {
    sat: BigIntFromString,
    msat: BigIntFromString,
  },
  'LndAmount'
);

export type LndAmount = t.TypeOf<typeof LndAmount>;

export const ChannelBalance = t.strict(
  {
    /** The balance on your side of the channel and what you the user can spend. */
    localBalance: LndAmount,
    /** The balance on the other side of the channel, what your channel partner can controls. */
    remoteBalance: LndAmount,
    /** Sum of local unsettled balances. */
    unsettledLocalBalance: LndAmount,
    /** Sum of remote unsettled balances. */
    unsettledRemoteBalance: LndAmount,
    /** Sum of local pending balances. */
    pendingOpenLocalBalance: LndAmount,
    /** Sum of local remote balances. */
    pendingOpenRemoteBalance: LndAmount,
  },
  'ChannelBalance'
);

export type ChannelBalance = t.TypeOf<typeof ChannelBalance>;

export const LndWalletBalance = t.strict(
  {
    /** Total balance, confirmed and unconfirmed */
    totalBalance: BigIntFromString,
    confirmedBalance: BigIntFromString,
    unconfirmedBalance: BigIntFromString,
    lockedBalance: BigIntFromString,
    reservedBalanceAnchorChan: BigIntFromString,
  },
  'LndWalletBalance'
);

export type LndWalletBalance = t.TypeOf<typeof LndWalletBalance>;

/**
 The balances as returned from lnd.

 Wallet Balance
 https://api.lightning.community/api/lnd/lightning/wallet-balance/index.html

 Channel Balance
 https://api.lightning.community/api/lnd/lightning/channel-balance/index.html
 */
export const LndBalance = t.strict(
  {
    offchain: ChannelBalance,
    onchain: LndWalletBalance,
    totalLimboBalance: BigIntFromString,
  },
  'LndBalance'
);

export type LndBalance = t.TypeOf<typeof LndBalance>;

export const LndGetOffchainBalances = t.strict(
  {
    outboundBalance: BigIntFromString,
    outboundPendingBalance: BigIntFromString,
    outboundUnsettledBalance: BigIntFromString,
    inboundBalance: BigIntFromString,
    inboundPendingBalance: BigIntFromString,
    inboundUnsettledBalance: BigIntFromString,
    lockedBalance: BigIntFromString,
  },
  'LndGetOffchainBalances'
);

// wallet onchain balances, names forced by type in AbstractCoin
export const LndGetOnchainBalances = t.strict(
  {
    spendableBalanceString: BigIntFromString,
    balanceString: BigIntFromString,
    confirmedBalanceString: BigIntFromString,
  },
  'LndGetOnchainBalances'
);

export const LndGetBalancesResponse = t.intersection(
  [
    t.strict({
      offchain: LndGetOffchainBalances,
    }),
    LndGetOnchainBalances,
  ],
  'LndGetBalancesResponse'
);

export type LndGetBalancesResponse = t.TypeOf<typeof LndGetBalancesResponse>;
