export interface SignedTransaction {
  signedTransaction: string;
  id: string;
}

export interface ApiMemo {
  MemoData?: string;
  MemoType?: string;
  MemoFormat?: string;
}

export interface TxJSON {
  account: string;
  type: string;
  memos?: { Memo: ApiMemo }[];
  flags?: number;
  fulfillment?: string;
  amount?: string;
  destination?: string;
  fee?: string;
  sequence?: number;
  lastLedgerSequence?: number;
  domain?: string;
  setFlag?: number;
  messageKey?: string;
  destinationTag?: string;
  signerQuorum?: number;
  signerEntries?: SignerEntry[];
}

export interface Signer {
  SigningPubKey: string;
  TxnSignature: string;
  Account: string;
}

export interface SignerEntry {
  SignerEntry: {
    Account: string;
    SignerWeight: number;
  };
}
