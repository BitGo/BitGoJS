import { Keychain } from '@bitgo/sdk-core';
import * as assert from 'assert';
import { generateParamsForKeyCreation } from '../../src/generateParamsForKeyCreation';
import { KeyCurve } from '@bitgo/statics';

describe('generateParamsForKeyCreation', function () {
  it('should return the right params', async function () {
    const bitgoKeychain: Keychain = {
      id: 'randomId',
      commonKeychain: 'random string',
      type: 'tss',
    };
    const curve = KeyCurve.Ed25519;
    const walletLabel = 'random key name';
    const keyCardImage: HTMLImageElement = 'random image' as unknown as HTMLImageElement;

    const result = generateParamsForKeyCreation({ bitgoKeychain, curve, walletLabel, keyCardImage });
    assert.ok(result);
    assert.ok(result.qrData.user);
    assert.ok(result.qrData.user.data === bitgoKeychain.commonKeychain);
    assert.ok(result.qrData.bitgo && result.qrData.bitgo.data === bitgoKeychain.id);
    assert.ok(result.questions && result.questions.length === 2);
    assert.ok(result.walletLabel === walletLabel);
    assert.ok(result.curve === curve);
    assert.ok(result.keyCardImage === keyCardImage);
  });
});
