import * as t from 'io-ts';
import { httpRoute, httpRequest, optional } from '@api-ts/io-ts-http';
import { BitgoExpressError } from '../../schemas/error';

export const SimpleCreateRequestBody = {
  /** Wallet passphrase to encrypt user and backup keys with (required) */
  passphrase: t.string,
  /** Wallet label shown in BitGo UI */
  label: optional(t.string),
  /** Backup keychain xpub generated on a separate machine (HIGHLY RECOMMENDED for security - cannot be used with backupXpubProvider) */
  backupXpub: optional(t.string),
  /** Key Recovery Service provider for backup key, e.g. "keyternal" (creates instant-capable wallet - cannot be used with backupXpub) */
  backupXpubProvider: optional(t.string),
  /** Enterprise ID to create wallet under */
  enterprise: optional(t.string),
  /** Code used to encrypt the wallet passcode for the recovery process */
  passcodeEncryptionCode: optional(t.string),
  /** Disable transaction notifications for this wallet */
  disableTransactionNotifications: optional(t.boolean),
  /** Disable KRS email notifications (only applicable when using backupXpubProvider) */
  disableKRSEmail: optional(t.boolean),
};

export const SimpleCreateResponse = t.intersection([
  t.type({
    /** Newly created wallet model object with balance, label, keychains array, and other wallet properties */
    wallet: t.UnknownRecord,
    /** User keychain with xpub and encryptedXprv (encrypted with passphrase, stored on BitGo) */
    userKeychain: t.UnknownRecord,
    /** Backup keychain with xpub (and xprv if created locally - must be backed up immediately) */
    backupKeychain: t.UnknownRecord,
    /** BitGo-managed keychain with xpub (BitGo holds this key) */
    bitgoKeychain: t.UnknownRecord,
  }),
  t.partial({
    /** Warning message present only when backup keychain was created locally (has xprv) - reminds you to back it up */
    warning: t.string,
  }),
]);

/**
 * Create Wallet with Keychains
 *
 * Creates a new 2-of-3 multisignature wallet along with all three required keychains in a single
 * operation. This is a convenience method that handles the entire wallet setup process.
 *
 * **WARNING: BE SURE TO BACKUP! NOT DOING SO CAN RESULT IN LOSS OF FUNDS!**
 *
 * **Workflow:**
 * 1. Creates the user keychain locally and encrypts it with the provided passphrase
 * 2. Handles backup keychain based on parameters (see Backup Keychain Strategies below)
 * 3. Uploads the encrypted user keychain and backup keychain xpub to BitGo
 * 4. Creates the BitGo-managed keychain on the service
 * 5. Creates the 2-of-3 multisig wallet on BitGo with all three public keys
 *
 * **Backup Keychain Strategies:**
 * - **KRS Provider (Recommended)**: Set backupXpubProvider to use a Key Recovery Service (e.g., "keyternal")
 *   - Creates instant-capable wallets
 *   - Professional key management
 *   - Cannot be combined with backupXpub
 * - **External Xpub (Recommended)**: Provide backupXpub generated on a separate, secure machine
 *   - Maximum security (keys never on same machine)
 *   - You control the backup key
 *   - Cannot be combined with backupXpubProvider
 * - **Local Generation (NOT RECOMMENDED)**: If neither backupXpub nor backupXpubProvider provided
 *   - Creates backup key on same machine as user key (security risk)
 *   - Response includes warning message and unencrypted backup xprv
 *   - You MUST back up the backup keychain yourself
 *
 * **Response:** Returns wallet object and all three keychains. If backup keychain was created
 * locally, response includes warning message and the backup keychain will contain xprv (which
 * you must securely back up). Otherwise, backup keychain only contains xpub.
 *
 * @operationId express.v1.wallet.simplecreate
 * @tag express
 */
export const PostSimpleCreate = httpRoute({
  path: '/api/v1/wallets/simplecreate',
  method: 'POST',
  request: httpRequest({
    body: SimpleCreateRequestBody,
  }),
  response: {
    200: SimpleCreateResponse,
    400: BitgoExpressError,
  },
});
