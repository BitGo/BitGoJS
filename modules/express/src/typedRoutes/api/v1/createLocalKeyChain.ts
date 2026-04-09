import * as t from 'io-ts';
import { httpRoute, httpRequest, optional } from '@api-ts/io-ts-http';
import { BitgoExpressError } from '../../schemas/error';

/**
 * Request body for creating a local keychain
 */
export const CreateLocalKeyChainRequestBody = {
  /**
   * Optional seed for deterministic key generation. If not provided, a cryptographically
   * secure random seed with 512 bits of entropy will be automatically generated. When providing
   * a custom seed, ensure it has sufficient entropy and is generated using a cryptographically
   * secure random number generator.
   */
  seed: optional(t.string),
};

/**
 * Response for creating a local keychain
 */
export const CreateLocalKeyChainResponse = t.type({
  /** The extended private key in BIP32 format (xprv...). Keep this secure and never share it. */
  xprv: t.string,
  /** The extended public key in BIP32 format (xpub...). Safe to share. */
  xpub: t.string,
  /** Ethereum address derived from the xpub (optional - only present when Ethereum utilities are available) */
  ethAddress: optional(t.string),
});

/**
 * Create a local keychain
 *
 * Generates a new BIP32 HD (Hierarchical Deterministic) keychain locally on the Express server.
 * This is a local key generation operation that does not communicate with the BitGo service.
 * The operation is synchronous and completes immediately.
 *
 * Returns an object containing the xprv (private key) and xpub (public key) in BIP32 extended
 * key format. The generated keychain is not registered with BitGo. To use it with BitGo wallets,
 * you must add it using the 'Add Keychain' API call (note: only send the xpub, never the xprv).
 *
 * **Security:** The response contains the unencrypted private key (xprv). Ensure all
 * communications with BitGo Express use TLS/SSL encryption. Encrypt the private key
 * immediately upon receipt and securely destroy the unencrypted copy to prevent theft.
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
