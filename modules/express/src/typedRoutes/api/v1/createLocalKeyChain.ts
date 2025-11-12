import * as t from 'io-ts';
import { httpRoute, httpRequest, optional } from '@api-ts/io-ts-http';
import { BitgoExpressError } from '../../schemas/error';

/**
 * Request body for creating a local keychain
 */
export const CreateLocalKeyChainRequestBody = {
  /**
   * Optional seed for key generation. If not provided, a random seed with 512 bits
   * of entropy will be generated for maximum security. The seed is used to derive a BIP32
   * extended key pair.
   */
  seed: optional(t.string),
};

/**
 * Response for creating a local keychain
 */
export const CreateLocalKeyChainResponse = t.type({
  /** The extended private key in BIP32 format (xprv...) */
  xprv: t.string,
  /** The extended public key in BIP32 format (xpub...) */
  xpub: t.string,
  /** Ethereum address derived from the extended public key (only available when Ethereum utilities are accessible) */
  ethAddress: optional(t.string),
});

/**
 * Create a local keychain
 *
 * Locally creates a new keychain using BIP32 HD (Hierarchical Deterministic) key derivation.
 * This is a client-side operation that does not involve any server-side operations.
 *
 * Returns an object containing the xprv and xpub keys in BIP32 extended key format.
 * The created keychain is not known to the BitGo service. To use it with BitGo,
 * you must add it using the 'Add Keychain' API call.
 *
 * For security reasons, it is highly recommended that you encrypt the private key
 * immediately and securely destroy the unencrypted original to prevent theft.
 *
 * @operationId express.v1.keychain.local
 * @tag express
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
