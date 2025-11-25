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

  /**
   * Keychains for cryptographic verification
   * Can be retrieved from GET /api/v2/{coin}/key/{id}
   */
  keychains: t.array(KeychainCodec),

  /** Base address of the wallet (wallet.coinSpecific.baseAddress) */
  baseAddress: optional(t.string),

  /** Wallet version (wallet.coinSpecific.walletVersion) */
  walletVersion: optional(t.number),

  /**
   * Address derivation index
   * ForwarderAddress: address.index
   * BaseAddress: 0
   */
  index: optional(t.union([t.number, t.string])),
  /** Coin-specific address data */
  coinSpecific: optional(
    t.partial({
      /** Forwarder version (address.coinSpecific.forwarderVersion, required for forwarder addresses only) */
      forwarderVersion: t.number,

      /**
       * Salt for CREATE2 address derivation
       * ForwarderAddress: address.coinSpecific.salt
       * BaseAddress: wallet.coinSpecific.salt
       */
      salt: t.string,

      /** Fee address for v4 forwarders (wallet.coinSpecific.feeAddress) */
      feeAddress: t.string,

      /** Base address (wallet.coinSpecific.baseAddress) */
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
 * Due to architecture limitations, forwarder version 0 addresses cannot be verified and will return `true` without verification.
 * Verifying custodial wallet addresses is not supported.
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
