import { TransactionParams } from '../../baseCoin';
import { InvalidTransactionError } from '../../errors';
import { PopulatedIntent, TxRequest } from './baseTypes';

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
  'enableToken',
  'customTx', // DeFi/WalletConnect smart contract interactions have no traditional recipients
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
