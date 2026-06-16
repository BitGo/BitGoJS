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
 * Unlike `iswalletaddress` (which checks a candidate address), this endpoint *produces* the
 * address offline from public key material only, using the same derivation BitGo performs
 * server-side. A client can therefore independently reproduce a wallet's deposit address and
 * confirm the one returned by the BitGo API rather than trusting it.
 *
 * Offline & stateless: the handler operates purely on the request body — no wallet lookup, no
 * private keys, and no network access — so it can run in an air-gapped BitGo Express. The caller
 * supplies the derivation `index`; the endpoint never allocates or increments one.
 *
 * Supported coins and the keychain material each requires:
 * - BIP32 multisig UTXO (e.g. `btc`, `tbtc`): the user/backup/bitgo **xpub triple** via `pub`,
 *   in that order. The `chain` code selects the script type — 0/1 = P2SH (legacy),
 *   10/11 = P2SH-P2WSH (wrapped segwit), 20/21 = P2WSH (native segwit / bech32),
 *   30/31 = P2TR (taproot); an optional `format` overrides the encoding.
 * - MPC/TSS EVM (e.g. `eth`, `teth`; wallet versions 3/5/6): the `commonKeychain`; returns an
 *   EIP-55 checksummed `0x` address. Legacy BIP32 forwarder wallets (versions 1/2/4) are not yet
 *   supported and return an error.
 * - EdDSA TSS (e.g. `sol`, `tsol`): the `commonKeychain`; returns a base58 address. For SMC
 *   wallets, pass `derivedFromParentWithSeed` so the derivation path is prefixed accordingly.
 *
 * Bring your own trusted keys: the security value comes from supplying keychains you hold
 * independently (captured at wallet creation and stored on your side) and then checking the
 * derived address against what the BitGo API returns. Feeding in keychains freshly fetched from
 * the same API you are verifying makes the check circular and provides no assurance.
 *
 * Recommended derive→verify round-trip: derive the address here, then call `iswalletaddress`
 * with the same keychains and index. The two share the same derivation, so a matching result is
 * a strong, independent correctness guarantee.
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
