import * as assert from 'assert';
import * as sinon from 'sinon';
import { removePasskeyFromAccount } from '../../src/removePasskeyFromAccount';
import type { WebAuthnOtpDevice } from '@bitgo/public-types';

describe('removePasskeyFromAccount', function () {
  let mockBitGo: {
    url: sinon.SinonStub;
    del: sinon.SinonStub;
  };

  const device: WebAuthnOtpDevice = {
    id: 'mongo-object-id-123',
    credentialId: 'cred-id-should-not-be-used',
    prfSalt: 'some-salt',
    isPasskey: true,
  };

  beforeEach(function () {
    mockBitGo = {
      url: sinon.stub().callsFake((path: string) => `https://app.bitgo.com/api/v1${path}`),
      del: sinon.stub().returns({
        result: sinon.stub().resolves(undefined),
      }),
    };
  });

  afterEach(function () {
    sinon.restore();
  });

  it('should DELETE /user/otp/{device.id} using device.id', async function () {
    await removePasskeyFromAccount({ bitgo: mockBitGo as any, device });

    assert.strictEqual(mockBitGo.url.calledOnce, true);
    assert.strictEqual(mockBitGo.url.firstCall.args[0], `/user/otp/${device.id}`);
    assert.strictEqual(mockBitGo.del.calledOnce, true);
  });

  it('should not use credentialId', async function () {
    await removePasskeyFromAccount({ bitgo: mockBitGo as any, device });

    const urlArg: string = mockBitGo.url.firstCall.args[0];
    assert.ok(!urlArg.includes(device.credentialId), 'URL should not contain credentialId');
  });

  it('should resolve without returning a value', async function () {
    const result = await removePasskeyFromAccount({ bitgo: mockBitGo as any, device });
    assert.strictEqual(result, undefined);
  });

  it('should throw if device.id is empty', async function () {
    const badDevice: WebAuthnOtpDevice = { ...device, id: '' };
    await assert.rejects(() => removePasskeyFromAccount({ bitgo: mockBitGo as any, device: badDevice }), {
      message: 'device.id is required to remove a passkey from the account',
    });
    assert.strictEqual(mockBitGo.del.called, false);
  });

  it('should throw if device.id is undefined', async function () {
    const badDevice = { ...device, id: undefined } as unknown as WebAuthnOtpDevice;
    await assert.rejects(() => removePasskeyFromAccount({ bitgo: mockBitGo as any, device: badDevice }), {
      message: 'device.id is required to remove a passkey from the account',
    });
    assert.strictEqual(mockBitGo.del.called, false);
  });
});
