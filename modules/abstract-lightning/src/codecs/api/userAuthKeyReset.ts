import * as t from 'io-ts';

const SignedRequestFields = t.type({
  walletId: t.string,
  oldUserAuthKeyPub: t.string,
  newUserAuthKeyPub: t.string,
  newUserAuthKeyId: t.string,
  createdAt: t.string,
});

export type UserAuthKeyResetSignedRequest = t.TypeOf<typeof SignedRequestFields>;

export const UserAuthKeyResetSignedRequest = new t.Type<UserAuthKeyResetSignedRequest>(
  'UserAuthKeyResetSignedRequest',
  (value): value is UserAuthKeyResetSignedRequest =>
    SignedRequestFields.is(value) &&
    Object.keys(value).every((key) => Object.prototype.hasOwnProperty.call(SignedRequestFields.props, key)),
  (value, context) => {
    const result = SignedRequestFields.validate(value, context);
    if (result._tag === 'Left') {
      return result;
    }
    return Object.keys(result.right).every((key) =>
      Object.prototype.hasOwnProperty.call(SignedRequestFields.props, key)
    )
      ? result
      : t.failure(value, context);
  },
  t.identity
);

export const UserAuthKeyResetRequest = t.type({
  newUserAuthKeyId: t.string,
  signedRequest: UserAuthKeyResetSignedRequest,
  signature: t.string,
});
export type UserAuthKeyResetRequest = t.TypeOf<typeof UserAuthKeyResetRequest>;

export const UserAuthKeyResetResponse = t.type({
  requestId: t.string,
  status: t.string,
  createdAt: t.string,
});
export type UserAuthKeyResetResponse = t.TypeOf<typeof UserAuthKeyResetResponse>;
