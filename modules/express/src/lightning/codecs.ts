/* eslint-disable no-redeclare */
import * as t from 'io-ts';

export const LightningSignerConfig = t.type({
  url: t.string,
  tlsCert: t.string,
});

export type LightningSignerConfig = t.TypeOf<typeof LightningSignerConfig>;

export const LightningSignerConfigs = t.record(t.string, LightningSignerConfig);

export type LightningSignerConfigs = t.TypeOf<typeof LightningSignerConfigs>;

export const WalletState = t.keyof({
  NON_EXISTING: 1,
  LOCKED: 1,
  UNLOCKED: 1,
  RPC_ACTIVE: 1,
  SERVER_ACTIVE: 1,
  WAITING_TO_START: 1,
});

export type WalletState = t.TypeOf<typeof WalletState>;

export const GetWalletStateResponse = t.type(
  {
    state: WalletState,
  },
  'GetWalletStateResponse'
);

export type GetWalletStateResponse = t.TypeOf<typeof GetWalletStateResponse>;

export const InitLightningWalletRequest = t.intersection(
  [
    t.strict({
      passphrase: t.string,
    }),
    t.partial({
      expressHost: t.string,
    }),
  ],
  'InitLightningWalletRequest'
);

export type InitLightningWalletRequest = t.TypeOf<typeof InitLightningWalletRequest>;

export const CreateSignerMacaroonRequest = t.type(
  {
    passphrase: t.string,
    addIpCaveatToMacaroon: t.boolean,
  },
  'CreateSignerMacaroonRequest'
);

export type CreateSignerMacaroonRequest = t.TypeOf<typeof CreateSignerMacaroonRequest>;

export const InitWalletResponse = t.type(
  {
    admin_macaroon: t.string,
  },
  'InitWalletResponse'
);

export type InitWalletResponse = t.TypeOf<typeof InitWalletResponse>;

export const BakeMacaroonResponse = t.type(
  {
    macaroon: t.string,
  },
  'BakeMacaroonResponse'
);

export type BakeMacaroonResponse = t.TypeOf<typeof BakeMacaroonResponse>;

export const UnlockLightningWalletRequest = t.strict(
  {
    passphrase: t.string,
  },
  'UnlockLightningWalletRequest'
);

export type UnlockLightningWalletRequest = t.TypeOf<typeof UnlockLightningWalletRequest>;

export const TransactionParams = t.type(
  {
    txid: t.string,
  },
  'TransactionParams'
);

export type TransactionParams = t.TypeOf<typeof TransactionParams>;

export const PaymentHashParams = t.type(
  {
    paymentHash: t.string,
  },
  'PaymentHashParams'
);

export type PaymentHashParams = t.TypeOf<typeof PaymentHashParams>;
