import * as t from 'io-ts';
import { httpRoute, httpRequest, optional } from '@api-ts/io-ts-http';
import { BitgoExpressError } from '../../schemas/error';
import { EIP1559, ForwarderVersion, CreateAddressFormat } from '../../schemas/address';

/**
 * Path parameters for creating a wallet address
 */
export const CreateAddressParams = {
  /** Coin ticker / chain identifier */
  coin: t.string,
  /** The ID of the wallet. */
  walletId: t.string,
} as const;

/**
 * Request body for creating a wallet address
 */
export const CreateAddressBody = {
  /** Address type for chains that support multiple address types */
  type: optional(t.string),
  /** Chain on which the new address should be created. Default: 1 */
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
  /** EVM keyring reference address (EVM only) */
  evmKeyRingReferenceAddress: optional(t.string),
  /** Create an address for the given token (OFC only) (eg. ofcbtc) */
  onToken: optional(t.string),
  /** A human-readable label for the address (Max length: 250) */
  label: optional(t.string),
  /** Whether the deployment should use a low priority fee key (ETH only) Default: false */
  lowPriority: optional(t.boolean),
  /** Explicit gas price to use when deploying the forwarder contract (ETH only) */
  gasPrice: optional(t.union([t.number, t.string])),
  /** EIP1559 fee parameters (ETH forwarderVersion: 0 wallets only) */
  eip1559: optional(EIP1559),
  /** Format to use for the new address (e.g., 'cashaddr' for BCH) */
  format: optional(CreateAddressFormat),
  /** Number of new addresses to create (maximum 250) */
  count: optional(t.number),
  /** Base address of the wallet (if applicable) */
  baseAddress: optional(t.string),
  /** When false, throw error if address verification is skipped */
  allowSkipVerifyAddress: optional(t.boolean),
} as const;

/** Response for creating a wallet address */
export const CreateAddressResponse = {
  200: t.unknown,
  400: BitgoExpressError,
} as const;

/**
 * Create address for a wallet
 *
 * @operationId express.v2.wallet.createAddress
 */
export const PostCreateAddress = httpRoute({
  path: '/api/v2/{coin}/wallet/{walletId}/address',
  method: 'POST',
  request: httpRequest({
    params: CreateAddressParams,
    body: CreateAddressBody,
  }),
  response: CreateAddressResponse,
});
