import assert from 'assert';
import * as E from 'fp-ts/Either';
import nock from 'nock';
import { BitGoAPI } from '@bitgo/sdk-api';
import { Wallet, common } from '@bitgo/sdk-core';
import * as statics from '@bitgo/statics';
import * as utxolib from '@bitgo/utxo-lib';
import { AbstractLightningCoin } from '../../../src/abstractLightningCoin';
import { UserAuthKeyResetSignedRequest } from '../../../src/codecs';
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
  it('computes fixed mainnet and testnet verification codes', function () {
    assert.strictEqual(computeUserAuthResetVerificationCode('ln-wallet', oldPub), 'RMJTE-ZBMRO');
    assert.strictEqual(computeUserAuthResetVerificationCode('test-wallet', otherPub), 'S7YHL-YBCKQ');
    assert(compareUserAuthResetVerificationCodes('rmjte zbmro', 'RMJTE-ZBMRO'));
    assert(!compareUserAuthResetVerificationCodes('RMJTE-ZBMRP', 'RMJTE-ZBMRO'));
    assert.notStrictEqual(computeUserAuthResetVerificationCode('other-wallet', oldPub), 'RMJTE-ZBMRO');
  });

  it('rejects extra and missing signed request fields', function () {
    const request = {
      walletId: 'wallet',
      oldUserAuthKeyPub: oldPub,
      newUserAuthKeyPub: otherPub,
      newUserAuthKeyId: 'key',
      createdAt: '2026-10-26T12:00:00.000Z',
    };
    assert(E.isRight(UserAuthKeyResetSignedRequest.decode(request)));
    assert(E.isLeft(UserAuthKeyResetSignedRequest.decode({ ...request, extra: true })));
    for (const field of Object.keys(request)) {
      const incomplete: Record<string, string> = { ...request };
      delete incomplete[field];
      assert(E.isLeft(UserAuthKeyResetSignedRequest.decode(incomplete)));
    }
  });

  for (const chain of ['lnbtc', 'tlnbtc'] as const) {
    describe(chain, function () {
      const bitgo = new BitGoAPI({ env: 'mock', clientConstants: {}, hmacVerification: false });
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

      it('registers an encrypted key and submits a signed proof without the private key', async function () {
        const requests: unknown[] = [];
        let encryptedPrv = '';
        let pub = '';
        const keys = nock(bgUrl)
          .get(`/api/v2/${chain}/key/old`)
          .reply(200, { id: 'old', pub: oldPub, source: 'user', coinSpecific: { [chain]: { purpose: 'userAuth' } } })
          .get(`/api/v2/${chain}/key/node`)
          .reply(200, { id: 'node', pub: otherPub, source: 'user', coinSpecific: { [chain]: { purpose: 'nodeAuth' } } })
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
            pub = key.pub;
            encryptedPrv = key.encryptedPrv;
            return [200, { id: 'newKeyId' }];
          });
        const route = nock(bgUrl)
          .post(`/api/v2/${chain}/wallet/walletId/lightning/userAuthKey/resetRequest`)
          .reply(function (_uri, body) {
            requests.push(body);
            const request = body as {
              newUserAuthKeyId: string;
              signedRequest: UserAuthKeyResetSignedRequest;
              signature: string;
            };
            assert.strictEqual(request.newUserAuthKeyId, 'newKeyId');
            assert(E.isRight(UserAuthKeyResetSignedRequest.decode(request.signedRequest)));
            assert.strictEqual(request.signedRequest.oldUserAuthKeyPub, oldPub);
            assert.strictEqual(request.signedRequest.newUserAuthKeyPub, pub);
            assert.strictEqual(request.signedRequest.walletId, 'walletId');
            assert.strictEqual(request.signedRequest.newUserAuthKeyId, 'newKeyId');
            assert(verifyMessageSignature(request.signedRequest, request.signature, pub, getUtxolibNetwork(chain)));
            return [
              200,
              {
                requestId: 'resetId',
                status: 'pending',
                createdAt: '2026-10-26T12:00:00.000Z',
                verificationCode: 'WRONG-CODE',
              },
            ];
          });
        const result = await wallet.requestUserAuthKeyReset({ passphrase: 'new-password', encryptionVersion: 1 });
        const prv = await bitgo.decrypt({ input: encryptedPrv, password: 'new-password' });
        assert.strictEqual(utxolib.bip32.fromBase58(prv).neutered().toBase58(), pub);
        assert(!JSON.stringify(requests).includes(prv));
        assert(!JSON.stringify(requests).includes('new-password'));
        assert.deepStrictEqual(result, {
          requestId: 'resetId',
          status: 'pending',
          verificationCode: computeUserAuthResetVerificationCode('walletId', pub),
        });
        keys.done();
        route.done();
      });

      it('retrieves and cancels a request, and propagates 404', async function () {
        const path = `/api/v2/${chain}/wallet/walletId/lightning/userAuthKey/resetRequest`;
        const response = { requestId: 'resetId', status: 'pending', createdAt: '2026-10-26T12:00:00.000Z' };
        const routes = nock(bgUrl)
          .get(path)
          .reply(200, response)
          .delete(`${path}/resetId`)
          .reply(200, { status: 'cancelled' })
          .get(path)
          .reply(404, { error: 'not found' });
        assert.deepStrictEqual(await wallet.getUserAuthKeyResetRequest(), response);
        assert.deepStrictEqual(await wallet.cancelUserAuthKeyResetRequest('resetId'), { status: 'cancelled' });
        await assert.rejects(
          () => wallet.getUserAuthKeyResetRequest(),
          (err: { status?: number }) => err.status === 404
        );
        routes.done();
      });
    });
  }
});
