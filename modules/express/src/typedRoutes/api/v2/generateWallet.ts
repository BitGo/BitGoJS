import * as t from 'io-ts';
import { BooleanFromString } from 'io-ts-types';
import { httpRoute, httpRequest, optional } from '@api-ts/io-ts-http';
import { BitgoExpressError } from '../../schemas/error';
import { UserKeychainCodec, BackupKeychainCodec, BitgoKeychainCodec } from '../../schemas/keychain';
import { multisigType, walletType } from '../../schemas/wallet';

/**
 * Request body for wallet generation.
 */
export const GenerateWalletBody = {
  /** Wallet label (example: "My Wallet") */
  label: t.string,
  /** Enterprise id. This is required for Ethereum wallets since they can only be created as part of an enterprise */
  enterprise: optional(t.string),
  /** If absent, BitGo uses the default wallet type for the asset. This is relevant only for assets that support both multisignature (`onchain`) and MPC (`tss`) on the BitGo platform. These assets are: `arbeth`, `eth`, `opeth`, `polygon`, and `soneium`. These assets all default to `tss`. */
  multisigType: optional(multisigType),
  /** The type of wallet, defined by key management and signing protocols. 'hot' and 'cold' are both self-managed wallets. If absent, defaults to 'hot'. 'trading' for Go Account wallets. */
  type: optional(walletType),
  /** Passphrase to be used to encrypt the user key on the wallet */
  passphrase: optional(t.string),
  /** User provided public key */
  userKey: optional(t.string),
  /** Public part of a key pair (example: xpub661MyMwAqRbcGMVhmc7wqQRYMtcX9LAvSj1pjB213y5TsrkV2uuzJjWnjBrT1FUeNWGPjaVm5p7o6jdNcQJrV1cy3a1R8NQ9m7LuYKA8RpH) */
  backupXpub: optional(t.string),
  /** Optional key recovery service to provide and store the backup key */
  backupXpubProvider: optional(t.literal('dai')),
  /** Flag for disabling wallet transaction notifications */
  disableTransactionNotifications: optional(t.boolean),
  /** The passphrase used for decrypting the encrypted wallet passphrase during wallet recovery */
  passcodeEncryptionCode: optional(t.string),
  /** Seed that derives an extended user key or common keychain for a cold wallet. */
  coldDerivationSeed: optional(t.string),
  /** Gas price to use when deploying an Ethereum wallet */
  gasPrice: optional(t.number),
  /** Flag for preventing KRS from sending email after creating backup key */
  disableKRSEmail: optional(t.boolean),
  /** (ETH only) Specify the wallet creation contract version used when creating a wallet contract. Use 0 for the old wallet creation, 1 for the new wallet creation, where it is only deployed upon receiving funds. 2 for wallets with the same functionality as v1 but with NFT support. 3 for MPC wallets. 4 is same as v2 but with some changes related to network identifier and encoding of tx data. v4 is applicable for Arbitrum, Optimism, ZkSync, and other EVM-compatible chains that we will onboard in the future. 5 for MPC MPCv2 wallets. 6 for EVM MPCv2 wallets with receive addresses. */
  walletVersion: optional(t.number),
  /** True, if the wallet type is a distributed-custodial. If passed, you must also pass the 'enterprise' parameter. */
  isDistributedCustody: optional(t.boolean),
  /** BitGo key ID for self-managed cold MPC wallets. */
  bitgoKeyId: optional(t.string),
  /** Common keychain for self-managed cold MPC wallets. */
  commonKeychain: optional(t.string),
} as const;

/**
 * Generate wallet response (200 OK)
 *
 * Can be either:
 * 1. Simple wallet object (without includeKeychains query param)
 * 2. Wallet with keychains (when includeKeychains=true)
 *
 * When keychains are included:
 * - encryptedWalletPassphrase: Encrypted wallet passphrase. Used with passcodeEncryptionCode.
 *   Example: "{\"iv\":\"IpwAFi0+TDsLJCV4pg8T6w==\",\"v\":1,\"iter\":10000,\"ks\":256,\"ts\":64,\"mode\":\"ccm\",\"adata\":\"\",\"cipher\":\"aes\",\"salt\":\"3lkIc47rjzo=\",\"ct\":\"/m6JL/ttTJWXNmHm+dzI\"}"
 * - userKeychain: User keychain with encrypted private key and xpub
 * - backupKeychain: Backup keychain with private key (if created locally, includes xprv)
 * - bitgoKeychain: BitGo-managed keychain with only xpub
 * - warning: Warning message if backup keychain was created locally (user must backup xprv)
 *   Example: "Be sure to backup the backup keychain -- it is not stored anywhere else!"
 */
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
 * Generate wallet
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
 * ⓘ For Ethereum wallets, the `enterprise` parameter is required. Each enterprise has a fee address that will be used to pay for transaction fees. Ensure the fee address is funded before creating a wallet.
 *
 * ⓘ Subtokens share wallets with their parent coin. Use the parent coin (e.g., `eth` for ERC20 tokens) to create a wallet that can hold tokens.
 *
 * ⓘ Many account-based assets, including Ethereum, require you to [Fund Gas Tanks](https://developers.bitgo.com/docs/get-started-gas-tanks#/) to initialize new wallets on chain. Ensure your gas tank has a sufficient balance before generating a wallet.
 *
 * @operationId express.wallet.generate
 * @tag Express
 * @public
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
