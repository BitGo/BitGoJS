import BigNumber from 'bignumber.js';
import { ITransactionRecipient } from '../baseCoin';

export function transactionRecipientsMatch(recipient1: ITransactionRecipient, recpient2: ITransactionRecipient) {
  const address1 = recipient1.address;
  const address2 = recpient2.address;

  const amount1 = new BigNumber(recipient1.amount);
  const amount2 = new BigNumber(recpient2.amount);

  const tokenName1 = recipient1.tokenName;
  const tokenName2 = recpient2.tokenName;

  const memo1 = recipient1.memo;
  const memo2 = recpient2.memo;

  const addressMatch = address1 === address2;
  const amountMatch = amount1.isEqualTo(amount2);
  const memoMatch = memo1 === memo2;
  const tokenMatch = tokenName1 === tokenName2;

  return {
    addressMatch,
    amountMatch,
    memoMatch,
    tokenMatch,
    exactMatch: addressMatch && amountMatch && memoMatch && tokenMatch,
  };
}
