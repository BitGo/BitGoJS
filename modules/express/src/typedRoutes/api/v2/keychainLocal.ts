import * as t from 'io-ts';
import { httpRoute, httpRequest } from '@api-ts/io-ts-http';
import { BitgoExpressError } from '../../schemas/error';

/**
 * @property {string} coin - Coin identifier (e.g. btc, tbtc, eth)
 */
export const KeychainLocalRequestParams = {
  coin: t.string,
};

/**
 * Local client-side function to create a new keychain.
 * Creating your keychains is a critical step for safely securing your Bitcoin. When generating new keychains, this API uses a random number generator that adheres to industry standards. If you provide your own seed, you must take extreme caution when creating it.
 * Returns an object containing the xprv and xpub for the new chain. The created keychain is not known to the BitGo service. To use it with the BitGo service, use the ‘Store Keychain’ API call.
 *
 * For security reasons, it is highly recommended that you encrypt and destroy the original xprv immediately to prevent theft.
 *
 * @operationId express.keychain.local
 */
export const PostKeychainLocal = httpRoute({
  path: '/api/v2/{coin}/keychain/local',
  method: 'POST',
  request: httpRequest({
    params: KeychainLocalRequestParams,
  }),
  response: {
    200: t.type({
      prv: t.string,
      pub: t.string,
    }),
    400: BitgoExpressError,
  },
});
