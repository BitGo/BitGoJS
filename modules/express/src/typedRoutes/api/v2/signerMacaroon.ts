import * as t from 'io-ts';
import { httpRoute, httpRequest, optional } from '@api-ts/io-ts-http';
import { BitgoExpressError } from '../../schemas/error';

/**
 * Path parameters for creating a signer macaroon
 * @property {string} coin - A lightning coin name (e.g, lnbtc).
 * @property {string} walletId - The ID of the wallet.
 */
export const SignerMacaroonParams = {
  coin: t.string,
  walletId: t.string,
};

/**
 * Request body for creating a signer macaroon
 * @property {string} passphrase - Passphrase to decrypt the admin macaroon of the signer node.
 * @property {boolean} addIpCaveatToMacaroon - If true, adds an IP caveat to the generated signer macaroon.
 */
export const SignerMacaroonBody = {
  passphrase: t.string,
  addIpCaveatToMacaroon: optional(t.boolean),
};

/**
 * Lightning - Create signer macaroon
 *
 * This is only used for self-custody lightning. Create the signer macaroon for the watch-only Lightning Network Daemon (LND) node. This macaroon derives from the signer node admin macaroon and is used by the watch-only node to request signatures from the signer node for operational tasks. Returns the updated wallet with the encrypted signer macaroon in the `coinSpecific` response field.
 *
 * @operationId express.lightning.signerMacaroon
 */
export const PostSignerMacaroon = httpRoute({
  method: 'POST',
  path: '/api/v2/{coin}/wallet/{walletId}/signermacaroon',
  request: httpRequest({
    params: SignerMacaroonParams,
    body: SignerMacaroonBody,
  }),
  response: {
    200: t.UnknownRecord,
    400: BitgoExpressError,
  },
});
