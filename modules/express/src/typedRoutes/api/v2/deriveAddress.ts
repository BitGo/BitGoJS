import * as t from 'io-ts';
import { httpRoute, httpRequest, optional } from '@api-ts/io-ts-http';
import { BitgoExpressError } from '../../schemas/error';
import { CreateAddressFormat } from '../../schemas/address';

/**
 * Path parameters for locally deriving a wallet address
 */
export const DeriveAddressParams = {
  /** Blockchain identifier (e.g., 'btc', 'eth', 'tbtc', 'teth', 'sol') */
  coin: t.string,
} as const;

/**
 * A keychain entry for local derivation. Public key material only — no private keys.
 * Modelled as a union so a keychain must carry at least one of `pub` / `commonKeychain`:
 * - `pub` (xpub) for BIP32 multisig coins (UTXO, legacy EVM)
 * - `commonKeychain` for TSS/MPC coins (SOL, EVM MPC) — identical across keychains
 *
 * (A keychain may legitimately carry both; TSS keychains commonly do.)
 */
export const DeriveAddressKeychainCodec = t.union([t.type({ pub: t.string }), t.type({ commonKeychain: t.string })]);

/**
 * Request body for locally deriving a wallet receive address
 */
export const DeriveAddressBody = {
  /**
   * Keychains for derivation (public key material only).
   * BIP32 multisig: the user/backup/bitgo xpub triple via `pub`.
   * TSS/MPC: the `commonKeychain`.
   */
  keychains: t.array(DeriveAddressKeychainCodec),
  /** Derivation index for the address (caller-supplied; the endpoint is stateless) */
  index: t.number,
  /** Derivation chain code: UTXO script-type / external(0) vs internal(1) selector */
  chain: optional(t.number),
  /** Address format override (e.g. 'p2sh', 'p2wsh' for UTXO; 'cashaddr' / 'base58') */
  format: optional(CreateAddressFormat),
  /** Wallet version, to disambiguate derivation strategy (e.g. EVM forwarder vs MPC) */
  walletVersion: optional(t.number),
  /**
   * Wallet base address (the wallet contract address for EVM wallets). Required to derive
   * per-index forwarder receive addresses for legacy multisig EVM wallets (versions 1/2/4).
   */
  baseAddress: optional(t.string),
  /**
   * Coin-specific derivation inputs. For EVM legacy forwarder wallets:
   * `forwarderVersion` (1/2/4) selects the forwarder factory, and `feeAddress` is required for v4.
   */
  coinSpecific: optional(
    t.partial({
      forwarderVersion: t.number,
      feeAddress: t.string,
    })
  ),
  /**
   * Seed from the user keychain's derivedFromParentWithSeed field (SMC TSS wallets);
   * makes the derivation path `{prefix}/{index}` instead of `m/{index}`.
   */
  derivedFromParentWithSeed: optional(t.string),
} as const;

/**
 * Response for locally deriving a wallet address
 */
export const DeriveAddressResponse = {
  /** The derived address and related derivation info */
  200: t.intersection([
    t.type({
      /** The derived address */
      address: t.string,
      /** The derivation index used */
      index: t.number,
    }),
    t.partial({
      /** The derivation chain code used */
      chain: t.number,
      /** Coin-specific address data (e.g. redeemScript/witnessScript for UTXO) */
      coinSpecific: t.UnknownRecord,
      /** The HD derivation path actually used */
      derivationPath: t.string,
    }),
  ]),
  /** Invalid request parameters or derivation failed */
  400: BitgoExpressError,
} as const;

/**
 * Locally derive and return a wallet receive address from a derivation path.
 *
 * Unlike `iswalletaddress` (which checks a candidate address), this *produces* the address
 * offline from public key material only — the xpub triple for BIP32 multisig coins, or the
 * commonKeychain for TSS/MPC coins. No private keys, no wallet lookup, and no network access:
 * the handler operates purely on the request body and can run in an air-gapped Express.
 *
 * Pairs with `iswalletaddress` for a derive→verify round-trip: derive the address here, then
 * verify it against the same keychains to independently confirm correctness.
 *
 * @operationId express.v2.address.derive
 * @tag Express
 */
export const PostDeriveAddress = httpRoute({
  path: '/api/v2/{coin}/address/derive',
  method: 'POST',
  request: httpRequest({
    params: DeriveAddressParams,
    body: DeriveAddressBody,
  }),
  response: DeriveAddressResponse,
});
