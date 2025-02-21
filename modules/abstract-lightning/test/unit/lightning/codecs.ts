import * as t from 'io-ts';
import assert from 'assert';
import * as E from 'fp-ts/Either';
import { pipe } from 'fp-ts/function';
import { LightningAuthKeychain, LightningKeychain, UpdateLightningWalletSignedRequest } from '../../../src/codecs';

function describeCodec(c: t.Type<any>, valid: unknown[], invalid: unknown[]) {
  describe('Codec ' + c.name, function () {
    it('parses valid inputs', function () {
      valid.forEach((v) => {
        assert.strictEqual(E.isRight(c.decode(v)), true);
      });
    });

    it('rejects invalid inputs', function () {
      invalid.forEach((v) => {
        assert.strictEqual(E.isRight(c.decode(v)), false);
      });
    });

    it('encode ∘ decode', function () {
      valid.forEach((v) => {
        const roundTripped = pipe(v, c.decode, E.map(c.encode));
        assert.deepStrictEqual(roundTripped, E.right(v));
      });
    });
  });
}

describe('Codecs', function () {
  describeCodec(
    LightningKeychain,
    [
      {
        id: 'id',
        pub: 'xpub',
        encryptedPrv: 'encryptedPrv',
        source: 'user',
      },
    ],
    [
      null,
      'abg',
      1,
      {
        id: 'id',
        pub: 'xpub',
        encryptedPrv: 'encryptedPrv',
        source: 'backup',
      },
    ]
  );

  describeCodec(
    LightningAuthKeychain,
    [
      {
        id: 'id',
        pub: 'xpub',
        encryptedPrv: 'encryptedPrv',
        source: 'user',
        coinSpecific: {
          lnbtc: {
            purpose: 'userAuth',
          },
        },
      },
    ],
    [
      null,
      'abg',
      1,
      {
        id: 'id',
        pub: 'xpub',
        encryptedPrv: 'encryptedPrv',
        source: 'user',
        coinSpecific: {
          lnbtc: {
            purpose: 'dummy',
          },
        },
      },
      {
        id: 'id',
        pub: 'xpub',
        encryptedPrv: 'encryptedPrv',
      },
    ]
  );

  describeCodec(
    UpdateLightningWalletSignedRequest,
    [
      {
        encryptedSignerAdminMacaroon: 'encryptedSignerAdminMacaroon',
        signerHost: '127.0.0.1',
        signerTlsCert: 'signerTlsCert',
        encryptedSignerTlsKey: 'encryptedSignerTlsKey',
        watchOnly: {
          master_key_birthday_timestamp: 'master_key_birthday_timestamp',
          master_key_fingerprint: 'master_key_fingerprint',
          accounts: [{ purpose: 1, coin_type: 1, account: 1, xpub: 'xpub' }],
        },
        encryptedSignerMacaroon: 'encryptedSignerMacaroon',
      },
      {
        encryptedSignerAdminMacaroon: 'encryptedSignerAdminMacaroon',
      },
      {},
    ],
    [null, 'abg', 1]
  );
});
