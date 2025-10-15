import * as t from 'io-ts';
import { httpRoute, httpRequest, optional } from '@api-ts/io-ts-http';
import { BitgoExpressError } from '../../schemas/error';

/**
 * Request parameters for creating a local keychain
 */
export const CreateLocalKeyChainRequestBody = {
  /** Optional seed for key generation (use with caution) */
  seed: optional(t.string),
};

/**
 * Response for creating a local keychain
 */
export const CreateLocalKeyChainResponse = t.type({
  /** The extended private key */
  xprv: t.string,
  /** The extended public key */
  xpub: t.string,
  /** The Ethereum address derived from the xpub (if available) */
  ethAddress: optional(t.string),
});

/**
 * Create a local keychain
 *
 * Locally creates a new keychain. This is a client-side function that does not
 * involve any server-side operations. Returns an object containing the xprv and xpub
 * for the new chain. The created keychain is not known to the BitGo service.
 * To use it with the BitGo service, use the 'Add Keychain' API call.
 *
 * For security reasons, it is highly recommended that you encrypt and destroy
 * the original xprv immediately to prevent theft.
 *
 * @tag express
 * @operationId express.v1.keychain.local
 */
export const PostCreateLocalKeyChain = httpRoute({
  path: '/api/v1/keychain/local',
  method: 'POST',
  request: httpRequest({
    body: CreateLocalKeyChainRequestBody,
  }),
  response: {
    /** Successfully created keychain */
    200: CreateLocalKeyChainResponse,
    /** Invalid request or key generation fails */
    400: BitgoExpressError,
  },
});
