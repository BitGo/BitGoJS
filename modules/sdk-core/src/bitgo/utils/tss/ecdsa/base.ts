import { secp256k1 } from '@noble/curves/secp256k1';

import { IBaseCoin, TransactionParams } from '../../../baseCoin';
import baseTSSUtils from '../baseTSSUtils';
import { KeyShare } from './types';
import { BackupGpgKey, PopulatedIntent, TxRequest } from '../baseTypes';
import { generateGPGKeyPair } from '../../opengpgUtils';
import { BitGoBase } from '../../../bitgoBase';
import { IWallet } from '../../../wallet';
import { InvalidTransactionError } from '../../../errors';

/**
 * Transaction types that legitimately carry no explicit recipients.
 * verifyTransaction handles no-recipient validation for these internally.
 * Mirrors the bypass list in abstractEthLikeNewCoins.ts verifyTssTransaction.
 */
export const NO_RECIPIENT_TX_TYPES = new Set([
  'acceleration',
  'fillNonce',
  'transferToken',
  'tokenApproval',
  'consolidate',
  'bridgeFunds',
]);

/**
 * Resolves the effective txParams for TSS signing recipient verification.
 *
 * For smart contract interactions, recipients live in txRequest.intent.recipients
 * (native amount = 0, so buildParams is empty). Falls back to intent recipients
 * mapped to ITransactionRecipient shape when txParams.recipients is absent.
 *
 * Throws InvalidTransactionError if no recipients can be resolved and the
 * transaction type is not a known no-recipient type.
 */
export function resolveEffectiveTxParams(
  txRequest: TxRequest,
  txParams: TransactionParams | undefined
): TransactionParams {
  const intentRecipients = (txRequest.intent as PopulatedIntent)?.recipients?.map((intentRecipient) => ({
    address: intentRecipient.address.address,
    amount: intentRecipient.amount.value,
    data: intentRecipient.data,
  }));

  const effectiveTxParams: TransactionParams = {
    ...txParams,
    recipients: txParams?.recipients?.length ? txParams.recipients : intentRecipients,
  };

  if (!effectiveTxParams.recipients?.length && !NO_RECIPIENT_TX_TYPES.has(effectiveTxParams.type ?? '')) {
    throw new InvalidTransactionError(
      'Recipient details are required to verify this transaction before signing. Pass txParams with at least one recipient.'
    );
  }

  return effectiveTxParams;
}

/** @inheritdoc */
export class BaseEcdsaUtils extends baseTSSUtils<KeyShare> {
  // We do not have full support for 3-party verification (w/ external source) of key shares and signature shares. There is no 3rd party key service support with this release.

  constructor(bitgo: BitGoBase, baseCoin: IBaseCoin, wallet?: IWallet) {
    super(bitgo, baseCoin, wallet);
    this.setBitgoGpgPubKey(bitgo);
  }

  /**
   * Gets backup pub gpg key string
   */
  async getBackupGpgPubKey(): Promise<BackupGpgKey> {
    return generateGPGKeyPair('secp256k1');
  }

  /**
   * util function that checks that a commonKeychain is valid and can ultimately resolve to a valid public key
   * @param commonKeychain - a user uploaded commonKeychain string
   * @throws if the commonKeychain is invalid length or invalid format
   */

  static validateCommonKeychainPublicKey(commonKeychain: string) {
    const pub = BaseEcdsaUtils.getPublicKeyFromCommonKeychain(commonKeychain);
    try {
      const point = secp256k1.ProjectivePoint.fromHex(pub);
      return point.toHex(false).slice(2);
    } catch (e) {
      throw new Error('Invalid commonKeychain, error: ' + e.message);
    }
  }

  /**
   * Gets the common public key from commonKeychain.
   *
   * @param {String} commonKeychain common key chain between n parties
   * @returns {string} encoded public key
   */
  static getPublicKeyFromCommonKeychain(commonKeychain: string): string {
    if (commonKeychain.length !== 130) {
      throw new Error(`Invalid commonKeychain length, expected 130, got ${commonKeychain.length}`);
    }
    const commonPubHexStr = commonKeychain.slice(0, 66);
    return commonPubHexStr;
  }
}
