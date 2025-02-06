/* eslint-disable no-redeclare */
import * as t from 'io-ts';
import { isIP } from 'net';
import { NonEmptyString } from 'io-ts-types';

export function getCodecPair<C extends t.Mixed>(
  innerCodec: C
): t.UnionC<[t.TypeC<{ lnbtc: C }>, t.TypeC<{ tlnbtc: C }>]> {
  return t.union([t.type({ lnbtc: innerCodec }), t.type({ tlnbtc: innerCodec })]);
}

export interface IPAddressBrand {
  readonly IPAddress: unique symbol; // Ensures uniqueness across modules
}

export const IPAddress = t.brand(
  t.string,
  (input): input is t.Branded<string, IPAddressBrand> => isIP(input) !== 0, // Type guard that checks if the string is a valid IP
  'IPAddress'
);

export type IPAddress = t.TypeOf<typeof IPAddress>;

export const KeyPurpose = t.union([t.literal('userAuth'), t.literal('nodeAuth')], 'KeyPurpose');

export type KeyPurpose = t.TypeOf<typeof KeyPurpose>;

export const LightningAuthKeychainCoinSpecific = getCodecPair(t.type({ purpose: KeyPurpose }));

export const LightningKeychain = t.strict(
  {
    id: NonEmptyString,
    pub: NonEmptyString,
    encryptedPrv: NonEmptyString,
    source: t.literal('user'),
  },
  'LightningKeychain'
);

export type LightningKeychain = t.TypeOf<typeof LightningKeychain>;

export const LightningAuthKeychain = t.strict(
  {
    id: NonEmptyString,
    pub: NonEmptyString,
    encryptedPrv: NonEmptyString,
    coinSpecific: LightningAuthKeychainCoinSpecific,
    source: t.literal('user'),
  },
  'LightningAuthKeychain'
);

export type LightningAuthKeychain = t.TypeOf<typeof LightningAuthKeychain>;

export const WatchOnlyAccount = t.type({
  purpose: t.number,
  coin_type: t.number,
  account: t.number,
  xpub: t.string,
});

export type WatchOnlyAccount = t.TypeOf<typeof WatchOnlyAccount>;

export const WatchOnly = t.type({
  master_key_birthday_timestamp: t.string,
  master_key_fingerprint: t.string,
  accounts: t.array(WatchOnlyAccount),
});

export type WatchOnly = t.TypeOf<typeof WatchOnly>;

export const LightningWalletCoinSpecific = getCodecPair(
  t.partial({
    encryptedSignerAdminMacaroon: t.string,
    signerIP: IPAddress,
    signerTlsCert: t.string,
    encryptedSignerTlsKey: t.string,
    watchOnly: WatchOnly,
    encryptedSignerMacaroon: t.string,
  })
);

export type LightningWalletCoinSpecific = t.TypeOf<typeof LightningWalletCoinSpecific>;

export const UpdateLightningWallet = t.partial(
  {
    coinSpecific: LightningWalletCoinSpecific,
    signature: t.string,
  },
  'UpdateLightningWallet'
);

export type UpdateLightningWallet = t.TypeOf<typeof UpdateLightningWallet>;

export const LndAmount = t.strict(
  {
    sat: t.string,
    msat: t.string,
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
    totalBalance: t.string,
    confirmedBalance: t.string,
    unconfirmedBalance: t.string,
    lockedBalance: t.string,
    reservedBalanceAnchorChan: t.string,
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
    totalLimboBalance: t.string,
  },
  'LndBalance'
);

export type LndBalance = t.TypeOf<typeof LndBalance>;

export const LndGetBalancesResponse = t.strict(
  {
    inboundBalance: t.string,
    inboundPendingBalance: t.string,
    inboundUnsettledBalance: t.string,
    outboundBalance: t.string,
    outboundPendingBalance: t.string,
    outboundUnsettledBalance: t.string,
    // wallet balances, names forced by type in AbstractCoin
    spendableBalanceString: t.string,
    balanceString: t.string,
    confirmedBalanceString: t.string,
  },
  'LndGetBalancesResponse'
);

export type LndGetBalancesResponse = t.TypeOf<typeof LndGetBalancesResponse>;

export const ChanPoints = t.strict(
  {
    fundingTxid: t.string,
    outputIndex: t.number,
  },
  'ChanPoints'
);

export type ChanPoints = t.TypeOf<typeof ChanPoints>;

export const BackupResponse = t.strict(
  {
    chanPoints: t.array(ChanPoints),
    multiChanBackup: t.string,
  },
  'BackupResponse'
);

export type BackupResponse = t.TypeOf<typeof BackupResponse>;

export const InvoiceStatus = t.union(
  [
    // Initial state.
    // Transitions to 'settled' or 'canceled' on LND notification.
    t.literal('open'),
    // Final state.
    t.literal('settled'),
    // Final state.
    t.literal('canceled'),
  ],
  'InvoiceStatus'
);
export type InvoiceStatus = t.TypeOf<typeof InvoiceStatus>;

export const CreateInvoiceBody = t.intersection(
  [
    t.type({
      valueMsat: t.string,
    }),
    t.partial({
      memo: t.string,
      expiry: t.number,
    }),
  ],
  'CreateInvoiceBody'
);
export type CreateInvoiceBody = t.TypeOf<typeof CreateInvoiceBody>;

/**
 * A representation of the data tracked by the indexer for an invoice it has
 * created within lnd.
 */
export const Invoice = t.intersection(
  [
    t.type({
      valueMsat: t.string,
      paymentHash: t.string,
      /** The BOLT #11 encoded invoice string */
      invoice: t.string,
      /** The public BitGo walletId to which this invoice belongs */
      walletId: t.string,
      status: InvoiceStatus,
      /** A date in ISO format representing when this invoice expires. */
      expiresAt: t.string,
    }),
    t.partial({
      memo: t.string,
    }),
  ],
  'Invoice'
);
export type Invoice = t.TypeOf<typeof Invoice>;

export const InvoiceInfo = t.intersection(
  [
    t.type({
      valueMsat: t.string,
      paymentHash: t.string,
      invoice: t.string,
      walletId: t.string,
      status: InvoiceStatus,
      expiresAt: t.string,
      createdAt: t.string,
      updatedAt: t.string,
    }),
    t.partial({
      /**
       * The number of millisats actually paid to this invoice, this may be greater
       * than the amount requested by the invoice, since lightning allows overpaying
       * (but not underpaying) invoices.
       */
      amtPaidMsat: t.string,
    }),
  ],
  'InvoiceInfo'
);
export type InvoiceInfo = t.TypeOf<typeof InvoiceInfo>;

export const InvoiceQuery = t.partial(
  {
    status: InvoiceStatus,
    limit: t.string,
    startDate: t.string,
    endDate: t.string,
  },
  'InvoiceQuery'
);

export type InvoiceQuery = t.TypeOf<typeof InvoiceQuery>;
