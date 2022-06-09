import { PrebuildTransactionOptions, PrebuildTransactionResult } from '../wallet';
import { SignedTransaction } from '../baseCoin';

export interface StakingRequest {
  id: string;
  amount: string;
  withdrawalAddress: string;
  clientId?: string;
  requestingUserId: string;
  type: string;
  enterpriseId: string;
  walletId: string;
  walletType: string;
  coin: string;
  status: string;
  statusModifiedDate: string;
  createdDate: string;
  transactions: StakingTransaction[];
}

export interface StakeOptions {
  amount: string;
  clientId?: string;
}

export interface UnstakeOptions {
  amount: string;
  clientId?: string;
}

export interface TransactionsReadyToSign {
  allSigningComplete: boolean;
  transactions: StakingTransaction[];
}

export interface StakingTransaction {
  id: string;
  stakingRequestId: string;
  delegationId: string;
  transactionType: string;
  createdDate: string;
  status: string;
  statusModifiedDate: string;
  amount: string;
  pendingApprovalId?: string;
  transferId?: string;
  txRequestId?: string;
  buildParams?: PrebuildTransactionOptions;
  gasPrice?: string;
}

export interface StakingPrebuildTransactionResult {
  transaction: StakingTransaction;
  result: PrebuildTransactionResult;
}

export interface StakingSignedTransaction {
  transaction: StakingTransaction;
  signed: SignedTransaction;
}

export interface StakingSignOptions {
  walletPassphrase: string;
}

export interface IStakingWallet {
  readonly walletId: string;
  readonly coin: string;
  stake(options: StakeOptions): Promise<StakingRequest>;
  unstake(options: UnstakeOptions): Promise<StakingRequest>;
  getStakingRequest(stakingRequestId: string): Promise<StakingRequest>;
  getTransactionsReadyToSign(stakingRequestId: string): Promise<TransactionsReadyToSign>;
  build(transaction: StakingTransaction): Promise<StakingPrebuildTransactionResult>;
  sign(
    signOptions: StakingSignOptions,
    stakingPrebuildTransaction: StakingPrebuildTransactionResult
  ): Promise<StakingSignedTransaction>;
  send(signedTransaction: StakingSignedTransaction): Promise<StakingTransaction>;
  buildSignAndSend(signOptions: StakingSignOptions, transaction: StakingTransaction);
}
