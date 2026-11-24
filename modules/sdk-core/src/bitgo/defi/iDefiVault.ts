/**
 * @prettier
 */

import { GetVaultResponse, VaultProtocol } from '@bitgo/public-types';

export interface DepositToVaultOptions {
  /** DeFi-service vault identifier */
  vaultId: string;
  /** Amount in base units of the underlying asset */
  amount: string;
  /** Wallet passphrase — required for hot wallets, omit for custody */
  walletPassphrase?: string;
}

export interface ResumeDepositOptions {
  /** operationId of the partially-completed deposit */
  operationId: string;
  /** vault the operation belongs to — required to fetch the operation from the vault-scoped route */
  vaultId: string;
  /** Wallet passphrase — required for hot wallets, omit for custody */
  walletPassphrase?: string;
}

export interface GetOperationOptions {
  /** DeFi-service vault identifier — required by the vault-scoped route */
  vaultId: string;
  operationId: string;
}

export interface ListOperationsOptions {
  vaultId: string;
  /** filter by wallet — the API accepts an optional walletId query param */
  walletId?: string;
  state?: DefiOperationState;
  type?: 'DEPOSIT' | 'WITHDRAW';
  limit?: number;
  /** pagination cursor from a previous response's nextCursor */
  nextCursor?: string;
}

export interface GetVaultConfigOptions {
  vaultId: string;
}

/** defi-service operation states as returned by the public API (lowercase). */
export type DefiOperationState = 'pending' | 'completed' | 'cancelled';

export interface DefiOperation {
  operationId: string;
  walletId: string;
  vaultId: string;
  type: 'DEPOSIT' | 'WITHDRAW';
  assetAmount: string;
  state: DefiOperationState;
  txRequestId?: string;
  associatedTxRequestId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConcreteDepositResult {
  pendingApprovalId: string;
  state: string;
}

export interface Erc4626DepositResult {
  operationId: string;
  txRequestIds: { approve: string; deposit: string };
}

/**
 * @deprecated Renamed to {@link Erc4626DepositResult}. Alias kept for
 * backward compatibility with the published sdk-core API.
 */
export type MorphoDepositResult = Erc4626DepositResult;

export type DepositResult = ConcreteDepositResult | Erc4626DepositResult;

export interface DefiOperationListResult {
  operations: DefiOperation[];
  nextCursor?: string | null;
}

export interface WithdrawFromVaultOptions {
  /** DeFi-service vault identifier */
  vaultId: string;
  /** Amount in base units of the vault share token */
  amount: string;
  /** Wallet passphrase — required for hot wallets, omit for custody */
  walletPassphrase?: string;
}

export interface WithdrawResult {
  operationId: string;
  txRequestId: string;
}

export interface WrapOptions {
  /** DeFi-service vault identifier — required in v1, see note below */
  vaultId: string;
  /** Amount in base units (18dp for ETH/WETH) */
  amount: string;
  /** Wallet passphrase — required for hot wallets, omit for custody */
  walletPassphrase?: string;
}

export interface WrapResult {
  txRequestId: string;
  /** Reserved — populated from milestone M5 onward, absent in v1 */
  operationId?: string;
}

export interface IDefiVault {
  depositToVault(params: DepositToVaultOptions): Promise<DepositResult>;
  resumeDeposit(params: ResumeDepositOptions): Promise<DepositResult>;
  getOperation(params: GetOperationOptions): Promise<DefiOperation>;
  listOperations(params: ListOperationsOptions): Promise<DefiOperationListResult>;
  getVaultConfig(params: GetVaultConfigOptions): Promise<GetVaultResponse>;
  getVaultProtocol(params: GetVaultConfigOptions): Promise<VaultProtocol>;
  withdrawFromVault(params: WithdrawFromVaultOptions): Promise<WithdrawResult>;
  wrap(params: WrapOptions): Promise<WrapResult>;
  unwrap(params: WrapOptions): Promise<WrapResult>;
}
