import * as assert from 'assert';
import * as t from 'io-ts';
import {
  KeychainChangePasswordBody,
  KeychainChangePasswordParams,
} from '../../../../src/typedRoutes/api/v2/keychainChangePassword';
import { assertDecode } from '../decode';

describe('express.keychain.changePassword', function () {
  it('decodes params', function () {
    // missing id
    assert.throws(() => assertDecode(t.type(KeychainChangePasswordParams), { coin: 'btc' }));
    // invalid coin type
    assert.throws(() => assertDecode(t.type(KeychainChangePasswordParams), { coin: 123, id: 'abc' }));
    // valid params
    assertDecode(t.type(KeychainChangePasswordParams), { coin: 'btc', id: 'abc' });
  });

  it('decodes body', function () {
    // missing required fields
    assert.throws(() => assertDecode(t.type(KeychainChangePasswordBody), {}));
    assert.throws(() => assertDecode(t.type(KeychainChangePasswordBody), { oldPassword: 'a' }));
    assert.throws(() => assertDecode(t.type(KeychainChangePasswordBody), { newPassword: 'b' }));
    // invalid types
    assert.throws(() => assertDecode(t.type(KeychainChangePasswordBody), { oldPassword: 1, newPassword: 'b' }));
    assert.throws(() => assertDecode(t.type(KeychainChangePasswordBody), { oldPassword: 'a', newPassword: 2 }));
    // valid minimal
    assertDecode(t.type(KeychainChangePasswordBody), { oldPassword: 'a', newPassword: 'b' });
    // valid with optional otp
    assertDecode(t.type(KeychainChangePasswordBody), { oldPassword: 'a', newPassword: 'b', otp: '123456' });
  });
});
