import * as assert from 'assert';
import * as t from 'io-ts';
import { LoginRequest } from '../../../src/typedRoutes/api/common/login';

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
});
