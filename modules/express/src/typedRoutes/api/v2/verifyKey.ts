import * as t from 'io-ts';
import { httpRoute, httpRequest } from '@api-ts/io-ts-http';
import { BitgoExpressError } from '../../schemas/error';

/**
 * Path parameters for verifying user key material against a wallet
 */
export const VerifyKeyParams = {
  /** Blockchain identifier (e.g., 'tsol', 'tdot', 'tsui') */
  coin: t.string,
  /** The wallet ID */
  id: t.string,
} as const;

/**
 * Request body for verifying user key material against a wallet
 */
export const VerifyKeyBody = {
  /**
   * User TSS signing material, the same string that would be passed as `prv` when signing a
   * transaction (e.g. on sendmany); TSS EdDSA MPCv1 wallets only. Private key material: it is
   * recombined locally and never sent to the server, and never echoed in error messages.
   */
  prv: t.string,
} as const;

/**
 * Response for verifying user key material against a wallet
 */
export const VerifyKeyResponse = {
  /** Whether the signing material recombines to the wallet's commonKeychain */
  200: t.type({ match: t.boolean }),
  /** Invalid request parameters, unsupported wallet type, or malformed signing material */
  400: BitgoExpressError,
} as const;

/**
 * Verify that user-held TSS key material belongs to a wallet
 *
 * Recombines the shares locally and compares the result against the wallet's commonKeychain,
 * answering up front whether the material can sign for this wallet. Supported for TSS EdDSA
 * (MPCv1) wallets; other wallet types return a 400.
 *
 * @operationId express.v2.wallet.verifyKey
 * @tag Express
 */
export const PostVerifyKey = httpRoute({
  path: '/api/v2/{coin}/wallet/{id}/verifyKey',
  method: 'POST',
  request: httpRequest({
    params: VerifyKeyParams,
    body: VerifyKeyBody,
  }),
  response: VerifyKeyResponse,
});
