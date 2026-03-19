import * as t from 'io-ts';
import { BooleanFromString } from 'io-ts-types';
import { httpRoute, httpRequest, optional } from '@api-ts/io-ts-http';
import { BitgoExpressError } from '../../schemas/error';
import { UserKeychainCodec, BackupKeychainCodec, BitgoKeychainCodec } from '../../schemas/keychain';
import { multisigType, walletSubType, walletType } from '../../schemas/wallet';

/**
 * Request body for wallet generation.
 */
export const GenerateWalletBody = {
  /** Wallet label */
  label: t.string,
  /** Enterprise id. Required for Ethereum wallets since they can only be created as part of an enterprise. Optional for other coins. */
  enterprise: optional(t.string),
  /** If absent, BitGo uses the default wallet type for the asset. This is relevant only for assets that support both multisignature (`onchain`) and MPC (`tss`) on the BitGo platform. These assets are: `arbeth`, `eth`, `opeth`, `polygon`, and `soneium`. These assets all default to `tss`. */
  multisigType: optional(multisigType),
  /** The type of wallet, defined by key management and signing protocols. 'hot' and 'cold' are both self-managed wallets. If absent, defaults to 'hot' */
  type: optional(walletType),
  /** The subType of the wallet */
  subType: optional(walletSubType),
  /** Passphrase to be used to encrypt the user key on the wallet */
  passphrase: optional(t.string),
  /** User provided public key */
  userKey: optional(t.string),
  /** Backup extended public key */
  backupXpub: optional(t.string),
  /** Optional key recovery service to provide and store the backup key */
  backupXpubProvider: optional(t.literal('dai')),
  /** Flag for disabling wallet transaction notifications */
  disableTransactionNotifications: optional(t.boolean),
  /** The passphrase used for decrypting the encrypted wallet passphrase during wallet recovery */
  passcodeEncryptionCode: optional(t.string),
  /** Seed that derives an extended user key or common keychain for a cold wallet */
  coldDerivationSeed: optional(t.string),
  /** Gas price to use when deploying an Ethereum wallet */
  gasPrice: optional(t.number),
  /** Flag for preventing KRS from sending email after creating backup key */
  disableKRSEmail: optional(t.boolean),
  /** (ETH only) Specify the wallet creation contract version used when creating a wallet contract */
  walletVersion: optional(t.number),
  /** True, if the wallet type is a distributed-custodial. If passed, you must also pass the 'enterprise' parameter */
  isDistributedCustody: optional(t.boolean),
  /** BitGo key ID for self-managed cold MPC wallets */
  bitgoKeyId: optional(t.string),
  /** Common keychain for self-managed cold MPC wallets */
  commonKeychain: optional(t.string),
  /** Reference wallet ID for creating EVM keyring child wallets. When provided, the new wallet inherits keys and properties from the reference wallet, enabling unified addresses across EVM chains. */
  evmKeyRingReferenceWalletId: optional(t.string),
} as const;

export const GenerateWalletResponse200 = t.union([
  t.UnknownRecord,
  t.type({
    wallet: t.UnknownRecord,
    encryptedWalletPassphrase: optional(t.string),
    userKeychain: optional(UserKeychainCodec),
    backupKeychain: optional(BackupKeychainCodec),
    bitgoKeychain: optional(BitgoKeychainCodec),
    warning: optional(t.string),
  }),
]);

/**
 * Response body for wallet generation.
 */
export const GenerateWalletResponse = {
  /** The newly created wallet */
  200: GenerateWalletResponse200,
  /** Bad request */
  400: BitgoExpressError,
} as const;

/**
 * Path parameters for wallet generation.
 */
export const GenerateWalletV2Params = {
  /** Coin ticker / chain identifier */
  coin: t.string,
};

/**
 * Query parameters for wallet generation.
 * @property includeKeychains - Include user, backup and bitgo keychains along with generated wallet
 */
export const GenerateWalletV2Query = {
  /** Include user, backup and bitgo keychains along with generated wallet */
  includeKeychains: optional(BooleanFromString),
};

/**
 * Generate Wallet
 *
 * Generate a new wallet for a coin. If you want a wallet to hold tokens, generate a wallet for the native coin of the blockchain (e.g. generate an ETH wallet to hold ERC20 tokens).
 *
 * Calling this endpoint does all of the following:
 *
 * 1. Creates the user keychain locally on your machine and encrypts it with the provided passphrase (skipped if you pass a `userKey`).
 * 2. Creates the backup keychain locally on your machine.
 * 3. Uploads the encrypted user keychain and public backup keychain to BitGo.
 * 4. Creates the BitGo key (and the backup key if you pass `backupXpubProvider`) on the service.
 * 5. Creates the wallet on BitGo with the 3 public keys above.
 *
 * ⓘ Ethereum wallets can only be created under an enterprise. Pass in the id of the enterprise to associate the wallet with. Your enterprise id can be seen by clicking on the “Manage Organization” link on the enterprise dropdown. Each enterprise has a fee address which will be used to pay for transaction fees on all Ethereum wallets in that enterprise. The fee address is displayed in the dashboard of the website, please fund it before creating a wallet.
 *
 * ⓘ You cannot generate a wallet by passing in a subtoken as the coin. Subtokens share wallets with their parent coin and it is not possible to create a wallet specific to one token.
 *
 * ⓘ This endpoint should be called through BitGo Express if used without the SDK, such as when using cURL.
 *
 * ⓘ Many account-based assets, including Ethereum, require you to [Fund Gas Tanks](https://developers.bitgo.com/docs/get-started-gas-tanks#/) to initialize a new wallets on chain. Ensure your gas tank has a sufficient balance to cover this cost before generating a new wallet.
 *
 * @operationId express.wallet.generate
 * @tag Express
 */
export const PostGenerateWallet = httpRoute({
  path: '/api/v2/{coin}/wallet/generate',
  method: 'POST',
  request: httpRequest({
    params: GenerateWalletV2Params,
    query: GenerateWalletV2Query,
    body: GenerateWalletBody,
  }),
  response: GenerateWalletResponse,
});
