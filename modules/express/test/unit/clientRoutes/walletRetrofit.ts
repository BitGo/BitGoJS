import * as assert from 'assert';
import * as sinon from 'sinon';
import { handleV2WalletRetrofit } from '../../../src/clientRoutes';
import type { ExpressApiRouteRequest } from '../../../src/typedRoutes/api';
import { WalletRetrofitResponse } from '../../../src/typedRoutes/api/v2/walletRetrofit';

type RetrofitError = Error & { result?: { keyIds?: unknown }; status?: number };

describe('Wallet Retrofit handler', function () {
  const keychains = {
    userKeychain: { id: 'user-key', source: 'user', type: 'tss', commonKeychain: 'common' },
    backupKeychain: { id: 'backup-key', source: 'backup', type: 'tss', commonKeychain: 'common' },
    bitgoKeychain: { id: 'bitgo-key', source: 'bitgo', type: 'tss', commonKeychain: 'common' },
  };
  const requestBody = {
    coin: 'tsol',
    id: 'wallet-id',
    otp: '0000000',
    passphrase: 'wallet-passphrase',
    enterprise: 'enterprise-id',
    originalPasscodeEncryptionCode: '654321',
    encryptedMaterial: {
      encryptedUserKey: 'box-a',
      encryptedBackupKey: 'box-b',
      encryptedWalletPassphrase: 'box-d',
    },
  };

  function makeRequest(walletResult: unknown, finalizationError?: Error) {
    const recreateMpc = sinon.stub().resolves(keychains);
    const finalizationRequest = {
      result: sinon.stub(),
      send: sinon.stub(),
    };
    finalizationRequest.send.returns(finalizationRequest);
    if (finalizationError) {
      finalizationRequest.result.rejects(finalizationError);
    } else {
      finalizationRequest.result.resolves(walletResult);
    }
    const bitgo = {
      coin: sinon.stub().returns({ keychains: () => ({ recreateMpc }) }),
      microservicesUrl: sinon.stub().callsFake((path: string) => `https://staging.example${path}`),
      post: sinon.stub().returns(finalizationRequest),
    };
    return {
      bitgo,
      decoded: requestBody,
      finalizationRequest,
      recreateMpc,
    };
  }

  it('returns keychains and the finalized wallet from one request', async function () {
    const wallet = { id: 'wallet-id', keys: ['user-key', 'backup-key', 'bitgo-key'], multisigTypeVersion: 'MPCv2' };
    const fixture = makeRequest(wallet);
    // The test fixture supplies the decoded fields consumed by the typed handler.
    const typedRequest = fixture as unknown as ExpressApiRouteRequest<'express.wallet.retrofit', 'post'>;

    const result = await handleV2WalletRetrofit(typedRequest);

    assert.deepStrictEqual(result, { ...keychains, wallet });
    assert.ok(fixture.recreateMpc.calledOnce);
    assert.ok(
      fixture.finalizationRequest.send.calledOnceWith({
        userKeyId: 'user-key',
        backupKeyId: 'backup-key',
        bitGoKeyId: 'bitgo-key',
      })
    );
    assert.ok(fixture.finalizationRequest.result.calledOnce);
    assert.ok(fixture.bitgo.post.calledOnceWith('https://staging.example/api/v2/wallet/wallet-id/retrofit'));

    const decoded = WalletRetrofitResponse[200].decode(result);
    assert.strictEqual(decoded._tag, 'Right');
  });

  it('includes new key ids when finalization fails', async function () {
    const finalizationError = Object.assign(new Error('commonKeychain mismatch'), {
      result: { error: 'commonKeychain mismatch' },
      status: 422,
    });
    const fixture = makeRequest(undefined, finalizationError);
    // The test fixture supplies the decoded fields consumed by the typed handler.
    const typedRequest = fixture as unknown as ExpressApiRouteRequest<'express.wallet.retrofit', 'post'>;

    await assert.rejects(
      () => handleV2WalletRetrofit(typedRequest),
      (error: unknown) => {
        assert.ok(error instanceof Error);
        const enrichedError = error as RetrofitError;
        assert.match(enrichedError.message, /userKeyId=user-key/);
        assert.match(enrichedError.message, /backupKeyId=backup-key/);
        assert.match(enrichedError.message, /bitGoKeyId=bitgo-key/);
        assert.deepStrictEqual(enrichedError.result?.keyIds, {
          userKeyId: 'user-key',
          backupKeyId: 'backup-key',
          bitGoKeyId: 'bitgo-key',
        });
        assert.strictEqual(enrichedError.status, 422);
        return true;
      }
    );
  });
});
