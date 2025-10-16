import * as t from 'io-ts';
import { httpRoute, httpRequest, optional } from '@api-ts/io-ts-http';
import { BitgoExpressError } from '../../schemas/error';

export const SimpleCreateRequestBody = {
  /** wallet passphrase to encrypt user and backup keys with */
  passphrase: t.string,
  /** wallet label, is shown in BitGo UI */
  label: optional(t.string),
  /** backup keychain xpub, it is HIGHLY RECOMMENDED you generate this on a separate machine!
   * BITGO DOES NOT GUARANTEE SAFETY OF WALLETS WITH MULTIPLE KEYS CREATED ON THE SAME MACHINE */
  backupXpub: optional(t.string),
  /* Provision backup key from this provider (KRS), e.g. "keyternal". Setting this value will create an instant-capable wallet. */
  backupXpubProvider: optional(t.string),
  enterprise: optional(t.string),
  /** the code used to encrypt the wallet passcode used in the recovery process */
  passcodeEncryptionCode: optional(t.string),
  disableTransactionNotifications: optional(t.boolean),
  disableKRSEmail: optional(t.boolean),
};

/**
 * Create Wallet with Keychain
 * Create a new 2-of-3 wallet and it's associated keychains.
 * Returns the locally created keys with their encrypted xprvs.
 * **WARNING: BE SURE TO BACKUP! NOT DOING SO CAN RESULT IN LOSS OF FUNDS!**
 *
 * 1. Creates the user keychain locally on the client, and encrypts it with the provided passphrase
 * 2. If no xpub was provided, creates the backup keychain locally on the client, and encrypts it with the provided passphrase
 * 3. Uploads the encrypted user and backup keychains to BitGo
 * 4. Creates the BitGo key on the service
 * 5. Creates the wallet on BitGo with the 3 public keys above
 *
 * @tag express
 * @operationId express.v1.wallet.simplecreate
 */
export const PostSimpleCreate = httpRoute({
  path: '/api/v1/wallets/simplecreate',
  method: 'POST',
  request: httpRequest({
    body: SimpleCreateRequestBody,
  }),
  response: {
    200: t.type({
      /** newly created wallet model object */
      wallet: t.string,
      /** the newly created user keychain, which has an encrypted xprv stored on BitGo */
      userKeychain: t.string,
      /** the newly created backup keychain */
      backupKeychain: t.string,
    }),
    400: BitgoExpressError,
  },
});
