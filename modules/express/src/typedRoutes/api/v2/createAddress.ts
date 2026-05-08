import * as t from 'io-ts';
import { httpRoute, httpRequest, optional } from '@api-ts/io-ts-http';
import { BitgoExpressError } from '../../schemas/error';
import { EIP1559, ForwarderVersion, CreateAddressFormat } from '../../schemas/address';

/**
 * Path parameters for creating a wallet address
 */
export const CreateAddressParams = {
  /** Blockchain identifier (e.g., 'btc', 'eth', 'tbtc', 'teth') */
  coin: t.string,
  /** The wallet ID */
  id: t.string,
} as const;

/**
 * Request body for creating a wallet address
 */
export const CreateAddressBody = {
  /** Address type for chains with multiple formats (e.g., 'p2sh', 'p2wsh' for Bitcoin-like chains) */
  type: optional(t.string),
  /** Derivation chain: 0 for external/receive addresses, 1 for internal/change addresses. Default varies by wallet type */
  chain: optional(t.number),
  /**
   * (ETH only) Specify forwarder version to use in address creation.
   * 0: legacy forwarder;
   * 1: fee-improved forwarder;
   * 2: NFT-supported forwarder (v2 wallets);
   * 3: MPC wallets;
   * 4: EVM variants;
   * 5: new MPC wallets with wallet-version 6
   */
  forwarderVersion: optional(ForwarderVersion),
  /** Reference address for EVM keyring address derivation (required for certain EVM-based wallet configurations) */
  evmKeyRingReferenceAddress: optional(t.string),
  /** Token identifier for OFC (Offchain) wallets - required when creating token-specific addresses (e.g., 'ofcbtc') */
  onToken: optional(t.string),
  /** A human-readable label for the address (Max length: 250) */
  label: optional(t.string),
  /** Use lower priority fee for Ethereum forwarder contract deployment. Default: false */
  lowPriority: optional(t.boolean),
  /** Gas price in wei for Ethereum forwarder contract deployment */
  gasPrice: optional(t.union([t.number, t.string])),
  /** EIP-1559 fee parameters (maxFeePerGas, maxPriorityFeePerGas) for Ethereum wallets with forwarderVersion 0 */
  eip1559: optional(EIP1559),
  /** Address encoding format: 'cashaddr' for Bitcoin Cash or 'base58' for legacy format */
  format: optional(CreateAddressFormat),
  /** Number of addresses to create in one request (1-250). Returns array when count > 1, single object when count = 1. Default: 1 */
  count: optional(t.number),
  /** Base address for wallets using hierarchical address structures (coin-specific) */
  baseAddress: optional(t.string),
  /** When false, throws error if address verification is skipped (e.g., during pending chain initialization). Default: true */
  allowSkipVerifyAddress: optional(t.boolean),
} as const;

/** Response for creating wallet address(es) */
export const CreateAddressResponse = {
  /** OK */
  200: t.unknown,
  /** Invalid request parameters or address creation failed */
  400: BitgoExpressError,
} as const;

/**
 * Create one or more new receive addresses for a wallet
 *
 * Generates new addresses on the specified derivation chain. Returns a single address object
 * by default, or an array when creating multiple addresses. For Ethereum wallets, this may
 * deploy forwarder contracts with configurable gas parameters.
 *
 * @operationId express.v2.wallet.createAddress
 * @tag Express
 */
export const PostCreateAddress = httpRoute({
  path: '/api/v2/{coin}/wallet/{id}/address',
  method: 'POST',
  request: httpRequest({
    params: CreateAddressParams,
    body: CreateAddressBody,
  }),
  response: CreateAddressResponse,
});
