import { PrebuildTransactionResult } from '../wallet';
import { SignedTransaction } from '../baseCoin';

export type TransferStatus =
  | 'NEW'
  | 'PENDING'
  | 'READY'
  | 'SENDING'
  | 'PENDING_APPROVAL'
  | 'PENDING_BITGO_TRUST_APPROVAL'
  | 'REJECTED'
  | 'FAILED'
  | 'CONFIRMED';

export interface TransferRequest {
  id: string;
  status: TransferStatus;
  coin: string;
  amount: string;
  receiveAddress: string;
  txRequestId?: string;
}

export interface TransferOptions {
  amount: string;
  connectionId: string;
}

export interface LinkPrebuildTransactionResult {
  transfer: TransferRequest;
  result: PrebuildTransactionResult;
}

export interface LinkSignOptions {
  walletPassphrase: string;
}

export interface LinkSignedTransaction {
  transfer: TransferRequest;
  signed: SignedTransaction;
}

export interface ILinkWallet {
  readonly walletId: string;
  readonly coin: string;
  transfer(options: TransferOptions): Promise<TransferRequest>;
  build(transfer: TransferRequest): Promise<LinkPrebuildTransactionResult>;
  sign(
    signOptions: LinkSignOptions,
    linkPrebuildTransaction: LinkPrebuildTransactionResult
  ): Promise<LinkSignedTransaction>;
  send(signedTransaction: LinkSignedTransaction): Promise<TransferRequest>;
  buildSignAndSend(signOptions: LinkSignOptions, transfer: TransferRequest);
}
