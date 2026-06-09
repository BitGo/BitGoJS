/**
 * @prettier
 */

export interface DepositToVaultOptions {
  /** DeFi-service vault identifier */
  vaultId: string;
  /** Amount in base units of the underlying asset */
  amount: string;
  /** Optional client-supplied idempotency key */
  clientIdempotencyKey?: string;
  /** Wallet passphrase — required for hot wallets, omit for custody */
  walletPassphrase?: string;
}

export interface ResumeDepositOptions {
  /** operationId of the partially-completed deposit */
  operationId: string;
  /** Wallet passphrase — required for hot wallets, omit for custody */
  walletPassphrase?: string;
}

export interface GetOperationOptions {
  operationId: string;
}

export interface ListOperationsOptions {
  vaultId: string;
  state?: string;
  type?: string;
  limit?: number;
  cursor?: string;
}

export interface DefiOperation {
  operationId: string;
  walletId: string;
  vaultId: string;
  type: 'DEPOSIT' | 'WITHDRAW';
  assetAmount: string;
  state: string;
  txRequestId?: string;
  associatedTxRequestId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DepositResult {
  operationId: string;
  txRequestIds: {
    approve: string;
    deposit: string;
  };
}

export interface DefiOperationListResult {
  items: DefiOperation[];
  nextCursor?: string;
}

export interface IDefiVault {
  depositToVault(params: DepositToVaultOptions): Promise<DepositResult>;
  resumeDeposit(params: ResumeDepositOptions): Promise<DepositResult>;
  getOperation(params: GetOperationOptions): Promise<DefiOperation>;
  listOperations(params: ListOperationsOptions): Promise<DefiOperationListResult>;
}
