import * as t from 'io-ts';
import { httpRoute, httpRequest, optional } from '@api-ts/io-ts-http';
import { BitgoExpressError } from '../../schemas/error';

/**
 * Request parameters for deriving a local keychain
 */
export const DeriveLocalKeyChainRequestBody = {
  /** The derivation path to use (e.g. 'm/0/1') */
  path: t.string,
  /** The extended private key to derive from (either xprv or xpub must be provided) */
  xprv: optional(t.string),
  /** The extended public key to derive from (either xprv or xpub must be provided) */
  xpub: optional(t.string),
};

/**
 * Response for deriving a local keychain
 */
export const DeriveLocalKeyChainResponse = t.type({
  /** The derivation path that was used */
  path: t.string,
  /** The derived extended public key */
  xpub: t.string,
  /** The derived extended private key (only included if xprv was provided in the request) */
  xprv: optional(t.string),
  /** The Ethereum address derived from the xpub (if available) */
  ethAddress: optional(t.string),
});

/**
 * Derive a local keychain
 *
 * Locally derives a keychain from a top level BIP32 string (xprv or xpub), given a path.
 * This is useful for deriving child keys from a parent key without having to store the child keys.
 *
 * The derivation process:
 * 1. Takes either an xprv (extended private key) or xpub (extended public key) as input
 * 2. Derives a child key at the specified path using BIP32 derivation
 * 3. Returns the derived xpub (and xprv if an xprv was provided)
 * 4. Also attempts to derive an Ethereum address from the xpub if possible
 *
 * Note: You must provide either xprv or xpub, but not both. If xprv is provided,
 * both the derived xprv and xpub are returned. If xpub is provided, only the
 * derived xpub is returned.
 *
 * @operationId express.v1.keychain.derive
 */
export const PostDeriveLocalKeyChain = httpRoute({
  path: '/api/v1/keychain/derive',
  method: 'POST',
  request: httpRequest({
    body: DeriveLocalKeyChainRequestBody,
  }),
  response: {
    /** Successfully derived keychain */
    200: DeriveLocalKeyChainResponse,
    /** Invalid request or derivation fails */
    400: BitgoExpressError,
  },
});
