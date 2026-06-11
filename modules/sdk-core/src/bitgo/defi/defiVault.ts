/**
 * @prettier
 */
import {
  DefiOperation,
  DefiOperationListResult,
  DepositResult,
  DepositToVaultOptions,
  GetOperationOptions,
  IDefiVault,
  ListOperationsOptions,
  ResumeDepositOptions,
} from './iDefiVault';
import { IWallet } from '../wallet';
import { BitGoBase } from '../bitgoBase';

/**
 * Error thrown when a concurrent active deposit already exists for the (wallet, vault) pair.
 */
export class ActiveOperationExistsError extends Error {
  public readonly operationId: string;

  constructor(operationId: string) {
    super(`An active deposit operation already exists: ${operationId}`);
    this.name = 'ActiveOperationExistsError';
    this.operationId = operationId;
  }
}

/**
 * Orchestrates ERC-4626 vault deposit and withdraw flows for a wallet.
 *
 * Exposed as `wallet.defi` on the Wallet class. See TDD §6.3.1 for the full
 * design: the SDK sequences two sendMany calls (approve + deposit) and
 * returns an operationId that the UI uses for status tracking and recovery.
 *
 * Uses wallet.sendMany() under the hood so that both custody wallets
 * (txRequest creation only) and hot wallets (create + sign + broadcast)
 * are handled by the existing infrastructure.
 */
export class DefiVault implements IDefiVault {
  private readonly wallet: IWallet;
  private readonly bitgo: BitGoBase;

  constructor(wallet: IWallet) {
    this.wallet = wallet;
    this.bitgo = wallet.bitgo;
  }

  /**
   * Deposit an amount of underlying asset into a vault.
   *
   * Internally issues two sendMany calls (approve + deposit) and returns the
   * operationId that links them. If the deposit sendMany fails after
   * the approve succeeds, the error propagates — the server-side reconciler
   * handles orphaned approvals.
   *
   * @param params.vaultId - DeFi-service vault identifier
   * @param params.amount - amount in base units of the underlying asset
   * @param params.clientIdempotencyKey - optional client idempotency key
   * @param params.walletPassphrase - required for hot wallets, omit for custody
   */
  async depositToVault(params: DepositToVaultOptions): Promise<DepositResult> {
    if (!params.vaultId) {
      throw new Error('vaultId is required');
    }
    if (!params.amount) {
      throw new Error('amount is required');
    }

    // TODO(CGD-1709): Re-enable active operation pre-flight check once the
    // defi-service operations endpoint is deployed and returning active state.
    // const activeOps: DefiOperationListResult = await this.bitgo
    //   .get(this.bitgo.microservicesUrl(this.operationsUrl()))
    //   .query({ vaultId: params.vaultId, state: 'active' })
    //   .result();
    //
    // if (activeOps.items && activeOps.items.length > 0) {
    //   throw new ActiveOperationExistsError(activeOps.items[0].operationId);
    // }

    // Step 1: Approve txRequest via sendMany
    const approveResult = await this.wallet.sendMany({
      type: 'defiApprove',
      defiParams: {
        vaultId: params.vaultId,
        amount: params.amount,
        ...(params.clientIdempotencyKey ? { clientIdempotencyKey: params.clientIdempotencyKey } : {}),
      },
      ...(params.walletPassphrase ? { walletPassphrase: params.walletPassphrase } : {}),
    });

    const approveTxRequestId = this.extractTxRequestId(approveResult);
    const operationId = this.extractOperationId(approveResult);

    if (!operationId) {
      throw new Error('operationId not found in approve txRequest response');
    }

    // Step 2: Deposit txRequest via sendMany
    const depositResult = await this.wallet.sendMany({
      type: 'defiDeposit',
      defiParams: {
        vaultId: params.vaultId,
        amount: params.amount,
        operationId,
        ...(params.clientIdempotencyKey ? { clientIdempotencyKey: params.clientIdempotencyKey } : {}),
      },
      ...(params.walletPassphrase ? { walletPassphrase: params.walletPassphrase } : {}),
    });
    const depositTxRequestId = this.extractTxRequestId(depositResult);

    return {
      operationId,
      txRequestIds: {
        approve: approveTxRequestId,
        deposit: depositTxRequestId,
      },
    };
  }

  /**
   * Resume a partially-completed deposit. Call this when the SDK process died
   * between the approve and deposit txRequest creation.
   *
   * @param params.operationId - the operationId from the original depositToVault call
   * @param params.walletPassphrase - required for hot wallets, omit for custody
   */
  async resumeDeposit(params: ResumeDepositOptions): Promise<DepositResult> {
    if (!params.operationId) {
      throw new Error('operationId is required');
    }

    // Fetch the operation to get the vault and amount details
    const operation = await this.getOperation({ operationId: params.operationId });

    if (operation.associatedTxRequestId) {
      throw new Error('Deposit txRequest already exists for this operation; nothing to resume');
    }

    if (!operation.txRequestId) {
      throw new Error('Approve txRequest not found for this operation; cannot resume');
    }

    // Issue the deposit txRequest using the existing operation's details
    const depositResult = await this.wallet.sendMany({
      type: 'defiDeposit',
      defiParams: {
        vaultId: operation.vaultId,
        amount: operation.assetAmount,
        operationId: params.operationId,
      },
      ...(params.walletPassphrase ? { walletPassphrase: params.walletPassphrase } : {}),
    });

    return {
      operationId: params.operationId,
      txRequestIds: {
        approve: operation.txRequestId,
        deposit: this.extractTxRequestId(depositResult),
      },
    };
  }

  /**
   * Get the current state of a DeFi operation.
   *
   * @param params.operationId - the operation to retrieve
   */
  async getOperation(params: GetOperationOptions): Promise<DefiOperation> {
    if (!params.operationId) {
      throw new Error('operationId is required');
    }

    return await this.bitgo.get(this.bitgo.microservicesUrl(this.operationsUrl() + '/' + params.operationId)).result();
  }

  /**
   * List operations for a vault filtered by walletId.
   *
   * @param params.vaultId - vault to list operations for
   * @param params.state - optional state filter
   * @param params.type - optional type filter (DEPOSIT | WITHDRAW)
   * @param params.limit - page size
   * @param params.cursor - pagination cursor
   */
  async listOperations(params: ListOperationsOptions): Promise<DefiOperationListResult> {
    if (!params.vaultId) {
      throw new Error('vaultId is required');
    }

    const query: Record<string, string | number> = {
      vaultId: params.vaultId,
    };
    if (params.state) query.state = params.state;
    if (params.type) query.type = params.type;
    if (params.limit) query.limit = params.limit;
    if (params.cursor) query.cursor = params.cursor;

    return await this.bitgo.get(this.bitgo.microservicesUrl(this.operationsUrl())).query(query).result();
  }

  // ── Internal helpers ────────────────────────────────────────────────

  /**
   * Extract txRequestId from a sendMany result.
   * sendMany returns different shapes depending on wallet type:
   * - TSS full: { txRequest: { txRequestId } } or { pendingApproval, txRequest }
   * - TSS lite: result from tssUtils.sendTxRequest
   */
  private extractTxRequestId(sendManyResult: Record<string, unknown>): string {
    const txRequest = sendManyResult.txRequest as Record<string, unknown> | undefined;
    if (txRequest?.txRequestId) {
      return txRequest.txRequestId as string;
    }
    if (sendManyResult.txRequestId) {
      return sendManyResult.txRequestId as string;
    }
    throw new Error('txRequestId not found in sendMany response');
  }

  /**
   * Extract operationId from the intent of a sendMany result.
   * The WP populates operationId in the intent of the approve txRequest.
   */
  private extractOperationId(sendManyResult: Record<string, unknown>): string | undefined {
    const txRequest = sendManyResult.txRequest as Record<string, unknown> | undefined;
    const intent = txRequest?.intent as Record<string, unknown> | undefined;
    return intent?.operationId as string | undefined;
  }

  private operationsUrl(): string {
    return `/api/defi-service/v1/wallets/${this.wallet.id()}/operations`;
  }
}
