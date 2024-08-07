import * as t from 'io-ts';
import { NonEmptyString } from 'io-ts-types';

function getCodecPair<C extends t.Mixed>(innerCodec: C): t.UnionC<[t.TypeC<{ lnbtc: C }>, t.TypeC<{ tlnbtc: C }>]> {
  return t.union([t.type({ lnbtc: innerCodec }), t.type({ tlnbtc: innerCodec })]);
}

export const LightningSignerConnectionsCodec = t.record(
  t.string,
  t.type({
    url: t.string,
    tlsCert: t.string,
  })
);

export type LightningSignerConnections = t.TypeOf<typeof LightningSignerConnectionsCodec>;

export const KeyPurposeCodec = t.union([t.literal('userAuth'), t.literal('nodeAuth')], 'KeyPurpose');

export type KeyPurpose = t.TypeOf<typeof KeyPurposeCodec>;

export const LightningAuthKeychainCoinSpecificCodec = getCodecPair(t.type({ purpose: KeyPurposeCodec }));

export const LightningKeychainCodec = t.strict(
  {
    id: NonEmptyString,
    pub: NonEmptyString,
    encryptedPrv: NonEmptyString,
    coinSpecific: t.undefined,
    source: t.literal('user'),
  },
  'LightningKeychain'
);

export type LightningKeychain = t.TypeOf<typeof LightningKeychainCodec>;

export const LightningAuthKeychainCodec = t.strict(
  {
    id: NonEmptyString,
    pub: NonEmptyString,
    encryptedPrv: NonEmptyString,
    coinSpecific: LightningAuthKeychainCoinSpecificCodec,
    source: t.literal('user'),
  },
  'LightningAuthKeychain'
);

export type LightningAuthKeychain = t.TypeOf<typeof LightningAuthKeychainCodec>;

export const InitLightningWalletRequestCodec = t.strict(
  {
    passphrase: NonEmptyString,
  },
  'InitLightningWalletRequest'
);

export type InitLightningWalletRequest = t.TypeOf<typeof InitLightningWalletRequestCodec>;
