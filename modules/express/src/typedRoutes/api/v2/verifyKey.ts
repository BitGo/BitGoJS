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
  /** Invalid request parameters, unsupported wallet type, or signing material that is malformed, inconsistent, or cannot be verified */
  400: BitgoExpressError,
} as const;

/**
 * Verify that user-held TSS key material belongs to a wallet
 *
 * Recombines the shares locally and compares the result against the wallet's commonKeychain,
 * answering up front whether the material can sign for this wallet. Supported for TSS EdDSA
 * (MPCv1) wallets; other wallet types return a 400.
 *
 * Outcomes: `match: false` means the material is well-formed and self-consistent but
 * recombines to a different key. A 400 means the material is malformed, cryptographically
 * inconsistent, or lacks the VSS commitments needed to verify it at all. Callers treating
 * "this key does not work for this wallet" as one condition must handle both the 200 `false`
 * and the 400.
 *
 * `match: true` is a consistency check for a caller inspecting its own key file, not proof of
 * possession: anyone who knows the wallet's public commonKeychain can construct shares that
 * pass. Never use the result as an authorization signal.
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
