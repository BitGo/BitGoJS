import { TransactionParams } from '../../baseCoin';
import { InvalidTransactionError } from '../../errors';
import { PopulatedIntent, TxRequest } from './baseTypes';

/**
 * Transaction types that legitimately carry no explicit recipients.
 * These are the intentType strings as stored in TxRequest.intent.intentType by WP.
 * verifyTransaction handles no-recipient validation for these internally.
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
  'enabletoken',
  'disabletoken',
  'customTx',
  // DeFi operations — recipients/calldata built server-side from defiParams.
  // camelCase variants match buildParams.type (SDK-facing); kebab-case variants match
  // intent.intentType (WP-facing, used on the PA path where buildParams is absent).
  'defiApprove',
  'defiDeposit',
  'defi-approve',
  'defi-deposit',
  // Smart contract invocations with no explicit SDK-level recipients
  'contractCall',

  // BSC/BNB delegation-based staking — intentType strings from TxRequest.intent.intentType
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

  // Claim rewards — BSC and CELO (TRX/SOL/Cosmos use EdDSA, not affected by this guard)
  'claim',
  'stakeClaimRewards',

  'createAccount',
  'transferAccept',
  'transferReject',
  'transferOfferWithdrawn',
  'cantonCommand',
  'pledge',

  // Avalanche / Flare cross-chain atomic imports — recipients are not supplied
  // by the client because the import consumes UTXOs already owned by the
  // wallet; the destination address is the wallet itself. WP issues these
  // with intentType 'import' (P-chain) or 'importtoc' (C-chain).
  'import',
  'importtoc',

  // SOL token account management
  'closeAssociatedTokenAccount',

  // ADA governance
  'voteDelegation',

  // CANTON multi-step transfer lifecycle
  'transferAcknowledge',

  // CANTON no-recipient workflow intents — per mpcUtils.ts exempt list and wallet.ts builders;
  // these intents carry no client recipients
  'cosignDelegationAccept',
  'allocationAllocate',
  'allocationAllocateWithdrawn',
  'cantonEndInvestorOnboardingOffer',
  'cantonEndInvestorOnboardingAccept',
  'cantonEndInvestorOnboardingReject',
  'cantonParticipantOnboardingRequest',
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

  // Propagate the resolved type so downstream callers
  if (!effectiveTxParams.type && txType) {
    effectiveTxParams.type = txType;
  }

  // Propagate stakingRequestId from intent into effectiveTxParams so verifyTssTransaction
  // overrides can bypass the no-recipient guard without needing access to txRequest directly.
  const intentStakingRequestId = (txRequest.intent as PopulatedIntent)?.stakingRequestId;
  if (intentStakingRequestId && !effectiveTxParams.stakingRequestId) {
    effectiveTxParams.stakingRequestId = intentStakingRequestId;
  }

  // All staking intents (BSC delegate/undelegate, CELO stake/unstake, etc.) carry
  // stakingRequestId as a required field on BaseStakeIntent (@bitgo/public-types).
  // Use its presence as a generic staking signal — no need to enumerate every intentType.
  const isStakingIntent = !!(txRequest.intent as PopulatedIntent)?.stakingRequestId;

  // buildParams.type from the wallet UI is PascalCase ('Import'); intent.intentType from WP
  // is lowercase ('import'). Either may be the source of truth depending on the signing path.
  const intentType = (txRequest.intent as PopulatedIntent)?.intentType ?? '';

  if (
    !effectiveTxParams.recipients?.length &&
    !isStakingIntent &&
    !NO_RECIPIENT_TX_TYPES.has(txType) &&
    !NO_RECIPIENT_TX_TYPES.has(intentType)
  ) {
    throw new InvalidTransactionError(
      'Recipient details are required to verify this transaction before signing. Pass txParams with at least one recipient.'
    );
  }

  return effectiveTxParams;
}
