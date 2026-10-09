import 'should';
import * as sinon from 'sinon';
import nock from 'nock';
import type { IEncryptionSession } from '@bitgo/sdk-core';
// CJS module.exports assignment; require idiom matches src/bitgoAPI.ts. The
// structural contract below pins the surface this test exercises.
interface V1UpdatePasswordResult {
  keychains: Record<string, string>;
  version: number;
}

interface V1Bitgo {
  url(path: string): string;
  post(url: string): { result(): Promise<unknown> };
  decrypt(params: { input: string; password: string }): Promise<string>;
  encrypt(params: { input: string; password: string; encryptionVersion?: number }): Promise<string>;
}

type V1KeychainsCtor = new (bitgo: V1Bitgo) => {
  updatePassword(params: {
    oldPassword: string;
    newPassword: string;
    encryptionVersion?: number;
    encryptionSession?: IEncryptionSession;
  }): Promise<V1UpdatePasswordResult>;
};

const Keychains: V1KeychainsCtor = require('../../../src/v1/keychains');

const ROOT = 'https://app.example.local';

/**
 * The deprecated v1 keychains updatePassword (src/v1/keychains.ts) fetches the user's
 * server-stored encryptedXprvs, re-encrypts each with the new password, and preserves
 * each envelope's version (isV2Envelope ? 2 : 1). It deliberately ignores both
 * `encryptionVersion` and `encryptionSession` -- v1 stays v1 during a v2 rotation and
 * no session is ever consumed. These tests pin that wire behavior so the rollback
 * contract documented in WCN-2640 cannot regress.
 */
describe('v1 Keychains.updatePassword', function () {
  const v1Envelope = JSON.stringify({ v: 1, iter: 10000, salt: 'c2FsdA==', iv: 'aXY=', ct: 'Y3Q=' });
  const v2Envelope = JSON.stringify({ v: 2, m: 65536, t: 3, p: 4, salt: 'c2FsdA==', iv: 'aXY=', ct: 'Y3Q=' });
  const undecryptableEnvelope = JSON.stringify({ v: 1, iter: 10000, salt: 'YmFk', iv: 'aXY=', ct: 'Y3Q=' });

  function makeBitgo(
    stored: Record<string, string>,
    decryptResults: Record<string, string>,
    encryptStub: sinon.SinonStub
  ) {
    return {
      url: (path: string) => `${ROOT}/api/v1${path}`,
      post: () => ({ result: async () => ({ version: 25, keychains: stored }) }),
      decrypt: async ({ input }: { input: string }) => {
        const result = decryptResults[input];
        if (result === undefined) {
          throw new Error('decryption failed');
        }
        return result;
      },
      encrypt: encryptStub,
    };
  }

  afterEach(function () {
    nock.cleanAll();
    sinon.restore();
  });

  it('ignores encryptionSession and preserves per-envelope versions under a v2 rotation', async function () {
    const stored = { xpubV1: v1Envelope, xpubV2: v2Envelope };
    nock(ROOT).post('/api/v1/user/encrypted').reply(200, { version: 25, keychains: stored });

    const encryptStub = sinon.stub().resolves('re-encrypted');
    const keychains = new Keychains(
      makeBitgo(stored, { [v1Envelope]: 'plain-v1', [v2Envelope]: 'plain-v2' }, encryptStub)
    );

    const session: IEncryptionSession = {
      encrypt: sinon.stub().resolves('session-encrypted'),
      decrypt: sinon.stub().resolves('session-decrypted'),
      destroy: sinon.stub(),
    };

    const result = await keychains.updatePassword({
      oldPassword: 'oldpw',
      newPassword: 'newpw',
      encryptionVersion: 2,
      encryptionSession: session,
    });

    // the v1-leg never touches the session: no encrypt, no destroy (destroy is the caller's job)
    (session.encrypt as sinon.SinonStub).called.should.equal(false);
    (session.destroy as sinon.SinonStub).called.should.equal(false);

    // re-encryption preserves each envelope's own version: v1 -> encryptionVersion 1,
    // v2 -> encryptionVersion 2, NOT the caller's encryptionVersion: 2 opt-in
    encryptStub.calledTwice.should.equal(true);
    encryptStub.getCall(0).args[0].encryptionVersion.should.equal(1);
    encryptStub.getCall(1).args[0].encryptionVersion.should.equal(2);
    encryptStub.alwaysCalledWithMatch({ password: 'newpw' }).should.equal(true);

    result.keychains.should.deepEqual({ xpubV1: 're-encrypted', xpubV2: 're-encrypted' });
    result.version.should.equal(25);
  });

  it('keeps keychains that cannot be decrypted with the old password unchanged', async function () {
    const stored = { xpubV1: v1Envelope, xpubV2: v2Envelope, xpubUndecryptable: undecryptableEnvelope };
    nock(ROOT).post('/api/v1/user/encrypted').reply(200, { version: 25, keychains: stored });

    const encryptStub = sinon.stub().resolves('re-encrypted');
    const keychains = new Keychains(
      makeBitgo(stored, { [v1Envelope]: 'plain-v1', [v2Envelope]: 'plain-v2' }, encryptStub)
    );

    const result = await keychains.updatePassword({ oldPassword: 'oldpw', newPassword: 'newpw' });

    encryptStub.calledTwice.should.equal(true);
    result.keychains.xpubUndecryptable.should.equal(undecryptableEnvelope);
    result.keychains.xpubV1.should.equal('re-encrypted');
    result.keychains.xpubV2.should.equal('re-encrypted');
  });
});
