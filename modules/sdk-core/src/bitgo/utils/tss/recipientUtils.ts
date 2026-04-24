import { TransactionParams } from '../../baseCoin';
import { InvalidTransactionError } from '../../errors';
import { PopulatedIntent, TxRequest } from './baseTypes';

/**
 * Transaction types that legitimately carry no explicit recipients.
 * verifyTransaction handles no-recipient validation for these internally.
 * Mirrors the bypass list in abstractEthLikeNewCoins.ts verifyTssTransaction.
 *
 * ECDSA types: acceleration, fillNonce, transferToken, tokenApproval, consolidate,
 *              bridgeFunds, enableToken, customTx
 * EdDSA types: staking operations, wallet/account init, token ops, CANTON 2-step flows
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

  // EdDSA staking (SOL, ADA, NEAR, DOT, CSPR, SUI, APT)
  'stakingActivate',
  'stakingDeactivate',
  'stakingWithdraw',
  'stakingClaim',
  'stakingDelegate',
  'stakingUnlock',
  'stakingUnvote',
  'stakingPledge',
  'stakingAuthorize',
  'stakingAuthorizeRaw',
  'stakingLock', // CSPR
  'stakingAdd', // SUI
  'addStake', // SUI
  'withdrawStake', // SUI

  // EdDSA account / wallet initialization
  'walletInitialization',
  'addressInitialization', // DOT
  'createAccount', // SOL + CANTON
  'accountUpdate', // HBAR

  // EdDSA token operations
  'trustline', // XLM
  'closeAssociatedTokenAccount', // SOL, HBAR
  'associatedTokenAccountInitialization', // SOL, HBAR
  'tokenTransfer', // SUI
  'sendToken', // TON
  'sendNFT', // APT

  // NEAR
  'storageDeposit',

  // TON
  'singleNominatorWithdraw',
  'tonWhalesDeposit',
  'tonWhalesWithdrawal',
  'tonWhalesVestingDeposit',
  'tonWhalesVestingWithdrawal',

  // ADA
  'voteDelegation',

  // CANTON 2-step transfer flows
  'transferAccept', // already in populateIntent() exempt list
  'transferReject', // already in populateIntent() exempt list
  'transferAcknowledge',
  'transferOfferWithdrawn', // already in populateIntent() exempt list
  'oneStepPreApproval', // CANTON enableToken
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

  // Fall back to intent.intentType when txParams.type is not explicitly set.
  // This covers EdDSA coins where the wallet SDK populates intent but not txParams.type.
  const txType = effectiveTxParams.type ?? (txRequest.intent as PopulatedIntent)?.intentType ?? '';

  if (!effectiveTxParams.recipients?.length && !NO_RECIPIENT_TX_TYPES.has(txType)) {
    throw new InvalidTransactionError(
      'Recipient details are required to verify this transaction before signing. Pass txParams with at least one recipient.'
    );
  }

  return effectiveTxParams;
}
