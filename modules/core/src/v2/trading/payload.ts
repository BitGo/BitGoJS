/**
 * @prettier
 */
export interface Payload {
  walletId: string;
  currency: string;
  amount: string;
  nonceHold: string;
  nonceSettle: string;
  otherParties: string[];
}
