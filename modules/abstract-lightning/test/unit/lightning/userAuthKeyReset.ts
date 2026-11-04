import assert from 'assert';
import * as E from 'fp-ts/Either';
import nock from 'nock';
import { BitGoAPI } from '@bitgo/sdk-api';
import { Wallet, common } from '@bitgo/sdk-core';
import * as statics from '@bitgo/statics';
import * as utxolib from '@bitgo/utxo-lib';

import { AbstractLightningCoin } from '../../../src/abstractLightningCoin';
import {
  CancelUserAuthKeyResetResponse,
  UserAuthKeyResetRequestInfo,
  UserAuthKeyResetSignedRequest,
  UserAuthKeyResetStatus,
} from '../../../src/codecs';
import { getUtxolibNetwork, verifyMessageSignature } from '../../../src/lightning';
import {
  compareUserAuthResetVerificationCodes,
  computeUserAuthResetVerificationCode,
  CustodialLightningWallet,
} from '../../../src/wallet';

const oldPub =
  'xpub661MyMwAqRbcGYjYsnsDj1SHdiXynWEXNnfNgMSpokN54FKyMqbu7rWEfVNDs6uAJmz86UVFtq4sefhQpXZhSAzQcL9zrEPtiLNNZoeSxCG';
const otherPub =
  'xpub661MyMwAqRbcG9xnTnAnRbJPo3MAHyRtH4zeehN8exYk4VFz5buepUzebhix33BKhS5Eb4V3LEfW5pYiSR8qmaEnyrpeghhKY8JfzAsUDpq';

const validSignedRequest = {
  walletId: 'wallet',
  oldUserAuthKeyPub: oldPub,
  newUserAuthKeyPub: otherPub,
  newUserAuthKeyId: 'key',
  createdAt: '2026-10-26T12:00:00.000Z',
};

class TestLightningCoin extends AbstractLightningCoin {
  constructor(bitgo: BitGoAPI, private readonly chain: 'lnbtc' | 'tlnbtc') {
    super(bitgo, getUtxolibNetwork(chain), statics.coins.get(chain));
  }
  getChain(): string {
    return this.chain;
  }
  getFamily(): string {
    return 'lnbtc';
  }
  getFullName(): string {
    return 'Lightning Bitcoin';
  }
}

describe('user auth key reset', function () {
  describe('verification code', function () {
    // Vectors independently computed with: base64.b32encode(sha256(input))[:10] in Python.
    it('matches fixed vectors for an lnbtc and a tlnbtc pub', function () {
      assert.strictEqual(computeUserAuthResetVerificationCode('ln-wallet', oldPub), 'RMJTE-ZBMRO');
      assert.strictEqual(computeUserAuthResetVerificationCode('test-wallet', otherPub), 'S7YHL-YBCKQ');
    });

    it('binds the code to both the wallet and the key', function () {
      assert.strictEqual(computeUserAuthResetVerificationCode('other-wallet', oldPub), '2BQIM-KXT6H');
      assert.notStrictEqual(
        computeUserAuthResetVerificationCode('ln-wallet', otherPub),
        computeUserAuthResetVerificationCode('ln-wallet', oldPub)
      );
    });

    it('compares case-insensitively and ignores dashes and spaces', function () {
      assert(compareUserAuthResetVerificationCodes('rmjte zbmro', 'RMJTE-ZBMRO'));
      assert(compareUserAuthResetVerificationCodes('RMJTEZBMRO', 'RMJTE-ZBMRO'));
      assert(compareUserAuthResetVerificationCodes(' rmjte-zbmro ', 'RMJTE-ZBMRO'));
      assert(!compareUserAuthResetVerificationCodes('RMJTE-ZBMRP', 'RMJTE-ZBMRO'));
    });
  });

  describe('codecs', function () {
    it('accepts the signed request', function () {
      assert(E.isRight(UserAuthKeyResetSignedRequest.decode(validSignedRequest)));
    });

    it('rejects an extra field', function () {
      assert(E.isLeft(UserAuthKeyResetSignedRequest.decode({ ...validSignedRequest, extra: true })));
    });

    it('rejects each missing field', function () {
      for (const field of Object.keys(validSignedRequest)) {
        const incomplete: Record<string, string> = { ...validSignedRequest };
        delete incomplete[field];
        assert(E.isLeft(UserAuthKeyResetSignedRequest.decode(incomplete)), `${field} should be required`);
      }
    });

    it('only accepts the known request statuses', function () {
      for (const status of [
        'requested',
        'canceled',
        'expired',
        'pending',
        'dnr_held',
        'wp_swapped',
        'completed',
        'failed',
      ]) {
        assert(E.isRight(UserAuthKeyResetStatus.decode(status)), status);
      }
      // "released" is releasedAt !== null, not a status; "cancelled" is a misspelling of canceled
      assert(E.isLeft(UserAuthKeyResetStatus.decode('released')));
      assert(E.isLeft(UserAuthKeyResetStatus.decode('cancelled')));
    });

    it('requires completedAt and releasedAt on the request info, allowing null', function () {
      const info = { requestId: 'r', status: 'completed', createdAt: '2026-10-26T12:00:00.000Z' };
      assert(E.isRight(UserAuthKeyResetRequestInfo.decode({ ...info, completedAt: null, releasedAt: null })));
      assert(E.isRight(UserAuthKeyResetRequestInfo.decode({ ...info, completedAt: 'a', releasedAt: 'b' })));
      assert(E.isLeft(UserAuthKeyResetRequestInfo.decode(info)));
    });

    it('only accepts canceled as the cancel response', function () {
      assert(E.isRight(CancelUserAuthKeyResetResponse.decode({ status: 'canceled' })));
      assert(E.isLeft(CancelUserAuthKeyResetResponse.decode({ status: 'cancelled' })));
    });
  });

  for (const chain of ['lnbtc', 'tlnbtc'] as const) {
    describe(`CustodialLightningWallet (${chain})`, function () {
      const bitgo = new BitGoAPI({ env: 'mock', clientConstants: {}, hmacVerification: false });
      const resetPath = `/api/v2/${chain}/wallet/walletId/lightning/userAuthKey/resetRequest`;
      let wallet: CustodialLightningWallet;
      let bgUrl: string;

      before(function () {
        const coin = new TestLightningCoin(bitgo, chain);
        wallet = new CustodialLightningWallet(
          new Wallet(bitgo, coin, {
            id: 'walletId',
            coin: chain,
            subType: 'lightningCustody',
            coinSpecific: { keys: ['old', 'node'] },
          })
        );
        bgUrl = common.Environments[bitgo.getEnv()].uri;
      });

      afterEach(function () {
        nock.cleanAll();
      });

      function nockAuthKeys(): nock.Scope {
        return nock(bgUrl)
          .get(`/api/v2/${chain}/key/old`)
          .reply(200, { id: 'old', pub: oldPub, source: 'user', coinSpecific: { [chain]: { purpose: 'userAuth' } } })
          .get(`/api/v2/${chain}/key/node`)
          .reply(200, {
            id: 'node',
            pub: otherPub,
            source: 'user',
            coinSpecific: { [chain]: { purpose: 'nodeAuth' } },
          });
      }

      it('registers the encrypted key, submits a verifiable proof and never sends the private key', async function () {
        const requests: unknown[] = [];
        let encryptedPrv = '';
        let newPub = '';

        const keys = nockAuthKeys()
          .post(`/api/v2/${chain}/key`)
          .reply(function (_uri, body) {
            requests.push(body);
            const key = body as {
              pub: string;
              encryptedPrv: string;
              source: string;
              keyType: string;
              coinSpecific: Record<string, { purpose: string }>;
              originalPasscodeEncryptionCode?: string;
            };
            assert.strictEqual(key.source, 'user');
            assert.strictEqual(key.keyType, 'independent');
            assert.strictEqual(key.coinSpecific[chain].purpose, 'userAuth');
            assert.strictEqual(key.originalPasscodeEncryptionCode, undefined);
            newPub = key.pub;
            encryptedPrv = key.encryptedPrv;
            return [200, { id: 'newKeyId' }];
          });

        const route = nock(bgUrl)
          .post(resetPath)
          .reply(function (_uri, body) {
            requests.push(body);
            const request = body as {
              newUserAuthKeyId: string;
              signedRequest: UserAuthKeyResetSignedRequest;
              signature: string;
            };
            assert.deepStrictEqual(Object.keys(request).sort(), ['newUserAuthKeyId', 'signature', 'signedRequest']);
            assert.strictEqual(request.newUserAuthKeyId, 'newKeyId');
            assert(E.isRight(UserAuthKeyResetSignedRequest.decode(request.signedRequest)));
            assert.strictEqual(request.signedRequest.walletId, 'walletId');
            assert.strictEqual(request.signedRequest.oldUserAuthKeyPub, oldPub);
            assert.strictEqual(request.signedRequest.newUserAuthKeyPub, newPub);
            assert.strictEqual(request.signedRequest.newUserAuthKeyId, 'newKeyId');
            assert(
              verifyMessageSignature(request.signedRequest, request.signature, newPub, getUtxolibNetwork(chain)),
              'proof must verify against the new pub'
            );
            // lightning-services and wallet-platform verify with the default network: must verify there too
            assert(verifyMessageSignature(request.signedRequest, request.signature, newPub));
            return [
              200,
              {
                requestId: 'resetId',
                status: 'requested',
                createdAt: '2026-10-26T12:00:00.000Z',
                verificationCode: 'WRONG-CODE',
              },
            ];
          });

        const result = await wallet.requestUserAuthKeyReset({ passphrase: 'new-password', encryptionVersion: 1 });

        const prv = await bitgo.decrypt({ input: encryptedPrv, password: 'new-password' });
        assert.strictEqual(utxolib.bip32.fromBase58(prv).neutered().toBase58(), newPub);
        const sent = JSON.stringify(requests);
        assert(!sent.includes(prv), 'private key must not be sent');
        assert(!sent.includes('new-password'), 'passphrase must not be sent');
        assert.deepStrictEqual(result, {
          requestId: 'resetId',
          status: 'requested',
          // computed locally; the server's `verificationCode` is ignored
          verificationCode: computeUserAuthResetVerificationCode('walletId', newPub),
        });
        keys.done();
        route.done();
      });

      it('does not queue a request when key registration fails', async function () {
        const keys = nockAuthKeys().post(`/api/v2/${chain}/key`).reply(500, { error: 'boom' });
        const route = nock(bgUrl).post(resetPath).reply(200, {});
        await assert.rejects(() => wallet.requestUserAuthKeyReset({ passphrase: 'new-password' }));
        keys.done();
        assert(!route.isDone());
      });

      it('rejects a response with an unknown status without echoing it', async function () {
        const keys = nockAuthKeys().post(`/api/v2/${chain}/key`).reply(200, { id: 'newKeyId' });
        nock(bgUrl)
          .post(resetPath)
          .reply(200, { requestId: 'resetId', status: 'secret-status', createdAt: '2026-10-26T12:00:00.000Z' });
        await assert.rejects(
          () => wallet.requestUserAuthKeyReset({ passphrase: 'new-password' }),
          (err: Error) => err.message === 'Invalid user auth key reset response'
        );
        keys.done();
      });

      it('gets the latest request including completedAt and releasedAt', async function () {
        const info = {
          requestId: 'resetId',
          status: 'completed',
          createdAt: '2026-10-26T12:00:00.000Z',
          completedAt: '2026-10-26T13:00:00.000Z',
          releasedAt: null,
        };
        const route = nock(bgUrl).get(resetPath).reply(200, info);
        assert.deepStrictEqual(await wallet.getUserAuthKeyResetRequest(), info);
        route.done();
      });

      it('propagates 404 when there is no request', async function () {
        nock(bgUrl).get(resetPath).reply(404, { error: 'not found' });
        await assert.rejects(
          () => wallet.getUserAuthKeyResetRequest(),
          (err: { status?: number }) => err.status === 404
        );
      });

      it('cancels a request with an encoded request id', async function () {
        const route = nock(bgUrl).delete(`${resetPath}/reset%2Fid`).reply(200, { status: 'canceled' });
        assert.deepStrictEqual(await wallet.cancelUserAuthKeyResetRequest('reset/id'), { status: 'canceled' });
        route.done();
      });
    });
  }
});
