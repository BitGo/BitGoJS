/* eslint-disable no-redeclare */
import * as t from 'io-ts';
import { isIP } from 'net';
import { NonEmptyString } from 'io-ts-types';

export function getCodecPair<C extends t.Mixed>(
  innerCodec: C
): t.UnionC<[t.TypeC<{ lnbtc: C }>, t.TypeC<{ tlnbtc: C }>]> {
  return t.union([t.type({ lnbtc: innerCodec }), t.type({ tlnbtc: innerCodec })]);
}

interface IPAddressBrand {
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
    encryptedAdminMacaroon: t.string,
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
