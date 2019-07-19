/**
 * @prettier
 */

type CURRENT_PAYLOAD_VERSION = '1.1.1';

export interface Payload {
  version: CURRENT_PAYLOAD_VERSION;
  accountId: string;
  currency: string;
  subtotal: string;
  fees?: {
    feeType: string;
    feeAmount: string;
  }[];
  amount: string;
  nonceHold: string;
  nonceSettle: string;
  otherParties: { accountId: string; currency: string; amount: string }[];
}
