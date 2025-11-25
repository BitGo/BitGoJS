import * as t from 'io-ts';
import { httpRoute, httpRequest, optional } from '@api-ts/io-ts-http';
import { BitgoExpressError } from '../../schemas/error';

/**
 * Path parameters for verifying if an address belongs to a wallet
 */
export const IsWalletAddressParams = {
  /** Coin ticker / chain identifier */
  coin: t.string,
  /** The ID of the wallet */
  id: t.string,
} as const;

/**
 * Keychain codec for address verification
 * Supports both BIP32 wallets (need ethAddress) and TSS/MPC wallets (need commonKeychain)
 */
export const KeychainCodec = t.intersection([
  // Required field
  t.type({
    pub: t.string,
  }),
  // Optional fields for different wallet types
  t.partial({
    /** Ethereum address (required for BIP32 wallet base address verification: V1, V2, V4) */
    ethAddress: t.string,
    /** Common keychain (required for TSS/MPC wallets: V3, V5, V6) */
    commonKeychain: t.string,
  }),
]);

/**
 * Request body for verifying if an address belongs to a wallet
 */
export const IsWalletAddressBody = {
  /** The address to verify */
  address: t.string,
  /** Keychains for verification */
  keychains: t.array(KeychainCodec),
  /** Base address of the wallet */
  baseAddress: optional(t.string),
  /** Wallet version */
  walletVersion: optional(t.number),
  /** Address index for TSS/MPC wallet derivation */
  index: optional(t.union([t.number, t.string])),
  /** Coin-specific address data */
  coinSpecific: optional(
    t.partial({
      /** Forwarder version */
      forwarderVersion: t.number,
      /** Salt for CREATE2 address derivation */
      salt: t.string,
      /** Fee address for v4 forwarders */
      feeAddress: t.string,
      /** Base address (alternative to top-level baseAddress) */
      baseAddress: t.string,
    })
  ),
  /** Implied forwarder version */
  impliedForwarderVersion: optional(t.number),
  /** Format for the address */
  format: optional(t.string),
  /** Root address for coins that use root address */
  rootAddress: optional(t.string),
} as const;

/**
 * Response for verifying if an address belongs to a wallet
 */
export const IsWalletAddressResponse = {
  200: t.boolean,
  400: BitgoExpressError,
} as const;

/**
 * Verify if an address belongs to a wallet
 *
 * This endpoint verifies whether a given address belongs to the specified wallet.
 * It performs cryptographic verification, checking address derivation
 * against wallet keychains and configuration.
 *
 * Returns `true` if the address belongs to the wallet, `false` otherwise.
 * Throws an error if verification fails or parameters are invalid.
 *
 * To verify a baseAddress, set the `baseAddress` and `address` to the base address of the wallet.
 *
 * **Limitations:**
 * - Forwarder v0: Cannot verify (nonce not stored). Returns `true` without verification.
 *
 * @operationId express.v2.wallet.isWalletAddress
 * @tag Express
 */
export const PostIsWalletAddress = httpRoute({
  path: '/api/v2/{coin}/wallet/{id}/iswalletaddress',
  method: 'POST',
  request: httpRequest({
    params: IsWalletAddressParams,
    body: IsWalletAddressBody,
  }),
  response: IsWalletAddressResponse,
});
