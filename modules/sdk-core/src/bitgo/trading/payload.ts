type CURRENT_PAYLOAD_VERSION = '1.2.0';

export interface Payload {
  version: CURRENT_PAYLOAD_VERSION;
  accountId: string;
  amounts: PayloadAmounts[];
  nonceHold: string;
  nonceSettle: string;
}

export interface PayloadAmounts {
  accountId: string;
  sendAmount: string;
  sendCurrency: string;
  receiveAmount: string;
  receiveCurrency: string;
  sendSubtotal: string; // sendAmount - fees[].feeAmount
  fees?: {
    // will only show up if the accountId is the signing accountId
    feeType: string;
    feeAmount: string;
  }[];
}
