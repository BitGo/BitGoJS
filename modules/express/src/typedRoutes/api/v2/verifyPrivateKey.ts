import * as t from 'io-ts';
import { httpRoute, httpRequest, optional, type HttpRoute } from '@api-ts/io-ts-http';
import { BitgoExpressError } from '../../schemas/error';

/**
 * Path parameters for verifying a private key against a wallet
 */
export const VerifyPrivateKeyParams = {
  /** A cryptocurrency or token ticker symbol. */
  coin: t.string,
  /** The wallet ID */
  id: t.string,
} as const;

/**
 * Request body for verifying that a private key matches a wallet's user keychain.
 * Exactly one of prv or encryptedPrv must be provided.
 */
export const VerifyPrivateKeyBody = {
  /**
   * The plaintext private key to verify.
   * Mutually exclusive with encryptedPrv + walletPassphrase.
   */
  prv: optional(t.string),

  /**
   * Encrypted private key (BitGo keycard format).
   * Must be supplied together with walletPassphrase.
   */
  encryptedPrv: optional(t.string),

  /**
   * Passphrase used to decrypt encryptedPrv.
   * Required when encryptedPrv is provided.
   */
  walletPassphrase: optional(t.string),

  /**
   * The multisig type of the wallet.
   * Use 'tss' for TSS/MPC wallets; omit or use 'onchain' for standard wallets.
   */
  multiSigType: optional(t.union([t.literal('tss'), t.literal('onchain')])),

  /**
   * The public key corresponding to the private key.
   * Required for TSS wallets where it is the common keychain.
   * For standard wallets, if omitted the user keychain pub is fetched from the wallet.
   */
  publicKey: optional(t.string),
} as const;

/**
 * Successful verification response
 */
export const VerifyPrivateKeyResponse200 = t.type({
  /** Whether the private key is valid for the wallet's user keychain */
  valid: t.boolean,
});

/**
 * Response for verifying a private key against a wallet
 */
export const VerifyPrivateKeyResponse = {
  200: VerifyPrivateKeyResponse200,
  400: BitgoExpressError,
} as const;

/**
 * Verify that a private key matches the user keychain of a wallet.
 *
 * This endpoint accepts either a plaintext private key (prv) or an encrypted
 * private key (encryptedPrv + walletPassphrase). It fetches the wallet's user
 * keychain from BitGo to obtain the corresponding public key, then calls
 * coin.assertIsValidKey to cryptographically verify the private key.
 *
 * Returns { valid: true } when the private key is valid for the wallet.
 * Returns a 400 error if required parameters are missing or invalid.
 * Throws if the private key does not match the public key on record.
 *
 * @operationId express.v2.wallet.verifyPrivateKey
 * @tag Express
 */
export const PostVerifyPrivateKey: HttpRoute<'post'> = httpRoute({
  path: '/api/v2/{coin}/wallet/{id}/verifyPrivateKey',
  method: 'POST',
  request: httpRequest({
    params: VerifyPrivateKeyParams,
    body: VerifyPrivateKeyBody,
  }),
  response: VerifyPrivateKeyResponse,
});
