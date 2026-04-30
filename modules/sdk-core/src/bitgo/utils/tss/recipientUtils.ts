import { TransactionParams } from '../../baseCoin';
import { InvalidTransactionError } from '../../errors';
import { PopulatedIntent, TxRequest } from './baseTypes';

/**
 * Transaction types that legitimately carry no explicit recipients.
 * These are non-staking ECDSA types where verifyTransaction handles
 * no-recipient validation internally.
 * Mirrors the bypass list in abstractEthLikeNewCoins.ts verifyTssTransaction.
 */
export const NO_RECIPIENT_TX_TYPES = new Set([
  'acceleration',
  'fillNonce',
  'transferToken',
  'tokenApproval',
  'consolidate',
  'bridgeFunds',
  'enableToken',
  'customTx',
]);

/**
 * Resolves the effective txParams for TSS signing recipient verification.
 *
 * For smart contract interactions, recipients live in txRequest.intent.recipients
 * (native amount = 0, so buildParams is empty). Falls back to intent recipients
 * mapped to ITransactionRecipient shape when txParams.recipients is absent.
 *
 * Staking intents (BSC delegate/undelegate, CELO stake/unstake, etc.) are
 * identified generically by the presence of `stakingRequestId` on the intent —
 * a required field on BaseStakeIntent in @bitgo/public-types. These intents
 * have no txParams recipients by design; validation is done at the coin layer.
 *
 * Throws InvalidTransactionError if no recipients can be resolved and the
 * transaction is not a known no-recipient type.
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

  // Fall back to intent.intentType when txParams.type is not explicitly set.
  // Staking wallets call signTransaction without txParams, so the type lives only in the intent.
  const txType = effectiveTxParams.type ?? (txRequest.intent as PopulatedIntent)?.intentType ?? '';

  // Propagate the resolved type so downstream callers (e.g. verifyTssTransaction) can use it.
  if (!effectiveTxParams.type && txType) {
    effectiveTxParams.type = txType;
  }

  // All staking intents (BSC delegate/undelegate, CELO stake/unstake, etc.) carry
  // stakingRequestId as a required field on BaseStakeIntent (@bitgo/public-types).
  // Use its presence as a generic staking signal — no need to enumerate every intentType.
  const isStakingIntent = !!(txRequest.intent as any)?.stakingRequestId;

  if (!effectiveTxParams.recipients?.length && !isStakingIntent && !NO_RECIPIENT_TX_TYPES.has(txType)) {
    throw new InvalidTransactionError(
      'Recipient details are required to verify this transaction before signing. Pass txParams with at least one recipient.'
    );
  }

  return effectiveTxParams;
}
