import * as t from 'io-ts';
import { httpRoute, httpRequest, optional } from '@api-ts/io-ts-http';
import { BitgoExpressError } from '../../schemas/error';

/**
 * Request parameters for deriving a local keychain
 */
export const DeriveLocalKeyChainRequestBody = {
  /** BIP32 derivation path (e.g., 'm/0/1' or '0/1'). Defines the hierarchical path from the parent key to derive the child key. */
  path: t.string,
  /** BIP32 extended private key in base58 format (e.g., 'xprv9s21...'). Provide this to derive both child xprv and xpub. Must provide either xprv or xpub, but not both. */
  xprv: optional(t.string),
  /** BIP32 extended public key in base58 format (e.g., 'xpub661MyMw...'). Provide this to derive only child xpub (cannot derive xprv from xpub). Must provide either xprv or xpub, but not both. */
  xpub: optional(t.string),
};

/**
 * Response for deriving a local keychain
 */
export const DeriveLocalKeyChainResponse = t.type({
  /** The BIP32 derivation path that was used (echoes the input path for verification) */
  path: t.string,
  /** The derived BIP32 extended public key in base58 format. Always returned regardless of whether xprv or xpub was provided as input. */
  xpub: t.string,
  /** The derived BIP32 extended private key in base58 format. Only included if an xprv was provided in the request (not derivable from xpub alone). */
  xprv: optional(t.string),
  /** The Ethereum address (0x-prefixed hex format) derived from the xpub. Included when Ethereum address derivation is available for the key type. */
  ethAddress: optional(t.string),
});

/**
 * Derive a local keychain using BIP32 hierarchical deterministic derivation
 *
 * Performs client-side BIP32 key derivation from a parent extended key (xprv or xpub) to a child key
 * at the specified derivation path. This operation is performed entirely locally on the BitGo Express
 * server without transmitting keys to BitGo's servers.
 *
 * **Use Cases:**
 * - Derive child keys for specific addresses without storing all keys
 * - Generate deterministic key hierarchies from a master key
 * - Create segregated key paths for different purposes or accounts
 *
 * **Derivation Process:**
 * 1. Accepts either an xprv (extended private key) or xpub (extended public key) as input
 * 2. Parses the BIP32 extended key and validates its format
 * 3. Applies BIP32 derivation algorithm at the specified path (e.g., 'm/0/1')
 * 4. Returns the derived xpub (and xprv if input was xprv)
 * 5. Optionally derives an Ethereum address from the xpub if applicable
 *
 * **Important Constraints:**
 * - You must provide exactly one of xprv OR xpub (not both, not neither)
 * - If xprv is provided: Returns both derived xprv and xpub
 * - If xpub is provided: Returns only derived xpub (cannot derive xprv from xpub)
 * - Ethereum address is only included if derivation is supported for the key type
 *
 * **Security Considerations:**
 * - This operation is performed locally and keys are never sent to BitGo's servers
 * - Extended private keys (xprv) should be handled with extreme care
 * - Consider encrypting xprv values before storage or transmission
 *
 * @operationId express.v1.keychain.derive
 * @tag express
 */
export const PostDeriveLocalKeyChain = httpRoute({
  path: '/api/v1/keychain/derive',
  method: 'POST',
  request: httpRequest({
    body: DeriveLocalKeyChainRequestBody,
  }),
  response: {
    /** Successfully derived child keychain. Returns the derived xpub (always) and xprv (if input was xprv), along with optional Ethereum address. */
    200: DeriveLocalKeyChainResponse,
    /** Invalid request parameters (e.g., missing path, invalid xprv/xpub format, both xprv and xpub provided, neither xprv nor xpub provided, or invalid derivation path). */
    400: BitgoExpressError,
  },
});
