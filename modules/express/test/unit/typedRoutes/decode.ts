import * as assert from 'assert';
import * as t from 'io-ts';
import { DecryptRequestBody } from '../../../src/typedRoutes/api/common/decrypt';
import { EncryptRequestBody } from '../../../src/typedRoutes/api/common/encrypt';
import { LoginRequest } from '../../../src/typedRoutes/api/common/login';
import { VerifyAddressBody } from '../../../src/typedRoutes/api/common/verifyAddress';
import { SimpleCreateRequestBody } from '../../../src/typedRoutes/api/v1/simpleCreate';
import { LightningStateParams } from '../../../src/typedRoutes/api/v2/lightningState';

export function assertDecode<T>(codec: t.Type<T, unknown>, input: unknown): T {
  const result = codec.decode(input);
  if (result._tag === 'Left') {
    const errors = JSON.stringify(result.left, null, 2);
    assert.fail(`Decode failed with errors:\n${errors}`);
  }
  return result.right;
}

describe('io-ts decode tests', function () {
  it('express.login', function () {
    // password is required field
    assert.throws(() =>
      assertDecode(t.type(LoginRequest), {
        username: 'user',
      })
    );

    assertDecode(t.type(LoginRequest), {
      username: 'user',
      password: 'password',
    });
  });
  it('express.decrypt', function () {
    // input is required field
    assert.throws(() =>
      assertDecode(t.type(DecryptRequestBody), {
        password: 'hello',
      })
    );

    assertDecode(t.type(DecryptRequestBody), {
      input: 'input',
      password: 'password',
    });
  });
  it('express.encrypt', function () {
    // input is required field
    assert.throws(() =>
      assertDecode(t.type(EncryptRequestBody), {
        password: 'password',
      })
    );

    // input must be a string
    assert.throws(() =>
      assertDecode(t.type(EncryptRequestBody), {
        input: 123,
      })
    );

    // valid with just input
    assertDecode(t.type(EncryptRequestBody), {
      input: 'data to encrypt',
    });

    // valid with input and password
    assertDecode(t.type(EncryptRequestBody), {
      input: 'data to encrypt',
      password: 'password',
    });

    // valid with all fields
    assertDecode(t.type(EncryptRequestBody), {
      input: 'data to encrypt',
      password: 'password',
      adata: 'additional authenticated data',
    });

    // password and adata are optional, should accept undefined
    assertDecode(t.type(EncryptRequestBody), {
      input: 'data to encrypt',
      password: undefined,
      adata: undefined,
    });
  });
  it('express.verifyaddress', function () {
    assert.throws(() =>
      assertDecode(t.type(VerifyAddressBody), {
        address: 1123,
      })
    );
    assertDecode(t.type(VerifyAddressBody), {
      address: 'some-address',
    });
  });
  it('express.v1.wallet.simplecreate', function () {
    // passphrase is required
    assert.throws(() => assertDecode(t.type(SimpleCreateRequestBody), {}));

    assertDecode(t.type(SimpleCreateRequestBody), {
      passphrase: 'pass',
    });
  });
  it('express.lightning.getState params valid', function () {
    assertDecode(t.type(LightningStateParams), { coin: 'lnbtc', walletId: 'wallet123' });
  });
  it('express.lightning.getState params invalid', function () {
    assert.throws(() => assertDecode(t.type(LightningStateParams), { coin: 'lnbtc' }));
  });
});
