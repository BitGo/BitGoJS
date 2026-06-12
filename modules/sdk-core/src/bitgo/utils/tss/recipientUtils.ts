import { TransactionParams } from '../../baseCoin';
import { InvalidTransactionError } from '../../errors';
import { PopulatedIntent, TxRequest } from './baseTypes';

/**
 * Type guard that narrows `TxRequest.intent` (typed as `unknown`) to `PopulatedIntent`.
 * Checks for the required `intentType` string field that all populated intents carry.
 */
function isPopulatedIntent(intent: unknown): intent is PopulatedIntent {
  return (
    typeof intent === 'object' &&
    intent !== null &&
    'intentType' in intent &&
    typeof (intent as PopulatedIntent).intentType === 'string'
  );
}

/**
 * Transaction types that legitimately carry no explicit recipients.
 * Mirrors the bypass list in abstractEthLikeNewCoins.ts verifyTssTransaction.
 *
 * ECDSA types: acceleration, fillNonce, transferToken, tokenApproval, consolidate,
 *              bridgeFunds, enableToken, customTx, contractCall
 * BSC/BNB delegation-based staking: delegate, undelegate, switchValidator
 * CELO/ETH lock-based staking: stake, unstake, stakeWithCallData, unstakeWithCallData,
 *              transferStake, increaseStake, goUnstake
 * Claim rewards (BSC, CELO — TRX/SOL use EdDSA and are unaffected): claim, stakeClaimRewards
 */
export const NO_RECIPIENT_TX_TYPES = new Set([
  // ECDSA types
  'acceleration',
  'fillNonce',
  'transferToken',
  'tokenApproval',
  'consolidate',
  'bridgeFunds',
  'enableToken',
  'customTx',
  // Smart contract
  'contractCall',

  // BSC/BNB delegation-based staking
  'delegate',
  'undelegate',
  'switchValidator',

  // CELO/ETH lock-based staking
  'stake',
  'unstake',
  'stakeWithCallData',
  'unstakeWithCallData',
  'transferStake',
  'increaseStake',
  'goUnstake',

  // Claim rewards
  'claim',
  'stakeClaimRewards',

  'createAccount',
  'transferAccept',
  'transferReject',
  'transferOfferWithdrawn',
  'cantonCommand',
  'pledge',
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
  const intent = isPopulatedIntent(txRequest.intent) ? txRequest.intent : undefined;

  const intentRecipients = intent?.recipients?.map((intentRecipient) => ({
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
  const txType = effectiveTxParams.type ?? intent?.intentType ?? '';

  // Propagate the resolved type so downstream callers (e.g. verifyTssTransaction) can use it.
  if (!effectiveTxParams.type && txType) {
    effectiveTxParams.type = txType;
  }

  // Propagate stakingRequestId from intent into effectiveTxParams so verifyTssTransaction
  // overrides can bypass the no-recipient guard without needing access to txRequest directly.
  const intentStakingRequestId = intent?.stakingRequestId;
  if (intentStakingRequestId && !effectiveTxParams.stakingRequestId) {
    effectiveTxParams.stakingRequestId = intentStakingRequestId;
  }

  // All staking intents carry stakingRequestId as a required field on BaseStakeIntent
  // Use its presence as a generic staking signal
  const isStakingIntent = !!intent?.stakingRequestId;

  if (!effectiveTxParams.recipients?.length && !isStakingIntent && !NO_RECIPIENT_TX_TYPES.has(txType)) {
    throw new InvalidTransactionError(
      'Recipient details are required to verify this transaction before signing. Pass txParams with at least one recipient.'
    );
  }

  return effectiveTxParams;
}
