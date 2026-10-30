import * as t from 'io-ts';

/**
 * The client proof for a userAuth key reset: the new key signs this exact set of fields (canonical JSON),
 * which proves the client holds the new private key and binds the request to one wallet.
 *
 * Exact: a missing field fails and so does any extra field. (`t.exact` would silently strip extras.)
 */
const UserAuthKeyResetSignedRequestFields = t.type({
  walletId: t.string,
  oldUserAuthKeyPub: t.string,
  newUserAuthKeyPub: t.string,
  newUserAuthKeyId: t.string,
  createdAt: t.string,
});
const signedRequestFieldCount = Object.keys(UserAuthKeyResetSignedRequestFields.props).length;

export const UserAuthKeyResetSignedRequest = t.refinement(
  UserAuthKeyResetSignedRequestFields,
  (request) => Object.keys(request).length === signedRequestFieldCount,
  'UserAuthKeyResetSignedRequest'
);
export type UserAuthKeyResetSignedRequest = t.TypeOf<typeof UserAuthKeyResetSignedRequest>;

/**
 * Status of a reset request as tracked by lightning-services.
 * "Released" is not a status: it is `releasedAt !== null` on a `completed` or `failed` request.
 */
export const UserAuthKeyResetStatus = t.keyof({
  requested: null,
  canceled: null,
  expired: null,
  pending: null,
  dnr_held: null,
  wp_swapped: null,
  completed: null,
  failed: null,
});
export type UserAuthKeyResetStatus = t.TypeOf<typeof UserAuthKeyResetStatus>;

/** Body of POST /api/v2/:coin/wallet/:walletId/lightning/userAuthKey/resetRequest */
export const UserAuthKeyResetRequest = t.type({
  newUserAuthKeyId: t.string,
  signedRequest: UserAuthKeyResetSignedRequest,
  signature: t.string,
});
export type UserAuthKeyResetRequest = t.TypeOf<typeof UserAuthKeyResetRequest>;

/** Response of POST .../resetRequest */
export const UserAuthKeyResetResponse = t.type({
  requestId: t.string,
  status: UserAuthKeyResetStatus,
  createdAt: t.string,
});
export type UserAuthKeyResetResponse = t.TypeOf<typeof UserAuthKeyResetResponse>;

/** Response of GET .../resetRequest: the caller's latest request. Never contains the verification code. */
export const UserAuthKeyResetRequestInfo = t.type({
  requestId: t.string,
  status: UserAuthKeyResetStatus,
  createdAt: t.string,
  completedAt: t.union([t.string, t.null]),
  releasedAt: t.union([t.string, t.null]),
});
export type UserAuthKeyResetRequestInfo = t.TypeOf<typeof UserAuthKeyResetRequestInfo>;

/** Response of DELETE .../resetRequest/:requestId */
export const CancelUserAuthKeyResetResponse = t.type({
  status: t.literal('canceled'),
});
export type CancelUserAuthKeyResetResponse = t.TypeOf<typeof CancelUserAuthKeyResetResponse>;
