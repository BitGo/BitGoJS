import * as t from 'io-ts';
import { httpRoute, httpRequest, optional } from '@api-ts/io-ts-http';
import { BitgoExpressError } from '../../schemas/error';

/**
 * Path parameters for retrofitting a wallet's MPC keys
 * @property {string} coin - A cryptocurrency or token ticker symbol.
 * @property {string} id - The ID of the wallet.
 */
export const WalletRetrofitParams = {
  /** A cryptocurrency or token ticker symbol. */
  coin: t.string,
  /** The ID of the wallet whose keys are being retrofitted. */
  id: t.string,
} as const;

/**
 * Request body for retrofitting a wallet's MPC keys
 */
export const WalletRetrofitBody = {
  /** The one-time password used to unlock the user session for the passcode recovery lookup. The request must be made with a login-session (short-lived) access token. */
  otp: t.string,
  /** The wallet passphrase. The new MPCv2 user key is encrypted with it. */
  passphrase: t.string,
  /** The ID of the enterprise the wallet belongs to. */
  enterprise: t.string,
  /** A fresh random secret that BitGo stores on the NEW user keychain for future server-assisted passcode recovery (the UI passes its newly generated keycard activation code here). Without it the retrofitted wallet cannot use server-assisted passcode recovery. */
  originalPasscodeEncryptionCode: optional(t.string),
  /** The encrypted MPCv1 keycard material needed to seed the MPCv2 key generation ceremony. */
  encryptedMaterial: t.type({
    /** Box A from the wallet's keycard: the MPCv1 user key share, encrypted with the wallet passphrase. */
    encryptedUserKey: t.string,
    /** Box B from the wallet's keycard: the MPCv1 backup key share, encrypted with the wallet passphrase. */
    encryptedBackupKey: t.string,
    /** Box D from the wallet's keycard: the wallet passphrase, encrypted with the passcode encryption code. */
    encryptedWalletPassphrase: t.string,
  }),
} as const;

export const WalletRetrofitResponse200 = t.type({
  // MPC keychains carry `commonKeychain` rather than `pub`, so the shared keychain codecs do not apply.
  userKeychain: t.UnknownRecord,
  backupKeychain: t.UnknownRecord,
  bitgoKeychain: t.UnknownRecord,
  /** The wallet after its key references have been swapped to the new MPCv2 keychains. */
  wallet: t.UnknownRecord,
});

export const WalletRetrofitKeyIds = t.type({
  userKeyId: t.string,
  backupKeyId: t.string,
  bitGoKeyId: t.string,
});

export const WalletRetrofitError = t.intersection([
  BitgoExpressError,
  t.partial({
    /** New key ids remain available when platform finalization fails. */
    keyIds: WalletRetrofitKeyIds,
  }),
]);

/**
 * Response for retrofitting a wallet's MPC keys
 */
export const WalletRetrofitResponse = {
  /** The newly created keychains and the wallet after finalization. */
  200: WalletRetrofitResponse200,
  /** Error; finalization failures include the new key ids for retry. */
  400: WalletRetrofitError,
} as const;

/**
 * Retrofit Wallet Keys (MPCv1 to MPCv2)
 *
 * Retrofit the MPCv1 keys of a TSS wallet to MPCv2. Runs the MPCv2 key generation ceremony locally,
 * seeded from the wallet's MPCv1 key material, and uploads the resulting new user, backup, and BitGo
 * keychains to BitGo.
 *
 * The wallet's MPCv1 keycard material is required: the encrypted user key (Box A), the encrypted
 * backup key (Box B), and the wallet passphrase encrypted with the passcode encryption code (Box D).
 *
 * ⓘ The wallet's passcode encryption code is fetched server-side via passcoderecovery, which
 * requires an unlocked login session: the request must carry a short-lived access token (a
 * long-lived API token lacks the required user_manage scope) and a valid otp.
 *
 * ⓘ Pass a fresh random `originalPasscodeEncryptionCode` to give the new keychain its own
 * server-side recovery code (the UI does this with its new keycard activation code). Without it,
 * server-assisted passcode recovery is unavailable for the retrofitted wallet.
 *
 * ⓘ This endpoint creates the new keychains and immediately finalizes the wallet key swap. A
 * finalization failure includes the newly created key ids in both the response message and
 * `keyIds` error field so the platform call can be retried without rerunning the ceremony.
 *
 * ⓘ This endpoint should be called through BitGo Express because the key ceremony runs locally.
 *
 * @operationId express.wallet.retrofit
 * @tag Express
 */
export const PostWalletRetrofit = httpRoute({
  path: '/api/v2/{coin}/wallet/{id}/retrofit',
  method: 'POST',
  request: httpRequest({
    params: WalletRetrofitParams,
    body: WalletRetrofitBody,
  }),
  response: WalletRetrofitResponse,
});
