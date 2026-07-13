/**
 * @prettier
 */
import * as t from 'io-ts';
import { GetVaultResponse, VaultProtocol } from '@bitgo/public-types';
import {
  ConcreteDepositResult,
  MorphoDepositResult,
  DefiOperation,
  DefiOperationListResult,
  DepositResult,
  DepositToVaultOptions,
  GetOperationOptions,
  GetVaultConfigOptions,
  IDefiVault,
  ListOperationsOptions,
  ResumeDepositOptions,
  WithdrawFromVaultOptions,
  WithdrawResult,
} from './iDefiVault';
import { IWallet } from '../wallet';
import { BitGoBase } from '../bitgoBase';
import { decodeWithCodec } from '../utils';

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
   * Fetch vault config from defi-service. Used internally to determine
   * which deposit path to take (Concrete vs Morpho).
   */
  async getVaultConfig(params: GetVaultConfigOptions): Promise<GetVaultResponse> {
    if (!params.vaultId) {
      throw new Error('vaultId is required');
    }
    const raw = await this.bitgo
      .get(this.bitgo.microservicesUrl(`/api/defi-service/v1/vaults/${params.vaultId}`))
      .result();
    return decodeWithCodec(GetVaultResponse, raw, 'getVaultConfig');
  }

  /**
   * Deposit an amount of underlying asset into a vault.
   *
   * Dispatches to the concrete or morpho path based on vault provider.
   * The concrete path returns a pendingApproval (custodial wallet).
   * The morpho path issues two sendMany calls (approve + deposit).
   *
   * @param params.vaultId - DeFi-service vault identifier
   * @param params.amount - amount in base units of the underlying asset
   * @param params.walletPassphrase - required for hot wallets, omit for custody
   */
  async depositToVault(params: DepositToVaultOptions): Promise<DepositResult> {
    if (!params.vaultId) {
      throw new Error('vaultId is required');
    }
    if (!params.amount) {
      throw new Error('amount is required');
    }

    const config = await this.getVaultConfig({ vaultId: params.vaultId });

    if (config.protocol === VaultProtocol.CONCRETE_BTCCX) {
      return this.depositToConcreteVault(params);
    } else if (config.protocol === VaultProtocol.MORPHO) {
      return this.depositToMorphoVault(params);
    } else {
      throw new Error(`Unsupported vault protocol: ${config.protocol}`);
    }
  }

  /**
   * Concrete BTC vault deposit path. The client BTC wallet is custodial, so
   * sendMany returns a pendingApproval rather than a signed transfer.
   * No recipients are sent — WP resolves the escrow destination server-side.
   */
  private async depositToConcreteVault(params: DepositToVaultOptions): Promise<ConcreteDepositResult> {
    const sendManyResult = await this.wallet.sendMany({
      type: 'defi-deposit',
      defiParams: {
        vaultId: params.vaultId,
        amount: params.amount,
        actionType: 'defi-deposit',
      },
      ...(params.walletPassphrase ? { walletPassphrase: params.walletPassphrase } : {}),
    });

    return this.extractConcreteDepositResult(sendManyResult);
  }

  /**
   * Morpho vault deposit path. Issues two sendMany calls (approve + deposit)
   * and returns the operationId that links them.
   */
  private async depositToMorphoVault(params: DepositToVaultOptions): Promise<MorphoDepositResult> {
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

  /**
   * Withdraw vault shares from a DeFi vault.
   *
   * Issues a single sendMany call (defiWithdraw) and returns the operationId
   * and txRequestId. The state machine for withdrawal is simpler than deposit:
   * CREATED → WITHDRAW_TX_REQUESTED → WITHDRAW_SIGNED → WITHDRAW_CONFIRMED → COMPLETED
   *
   * @param params.vaultId - DeFi-service vault identifier
   * @param params.amount - amount in base units of the vault share token
   * @param params.walletPassphrase - required for hot wallets, omit for custody
   */
  async withdrawFromVault(params: WithdrawFromVaultOptions): Promise<WithdrawResult> {
    if (!params.vaultId) {
      throw new Error('vaultId is required');
    }
    if (!params.amount) {
      throw new Error('amount is required');
    }

    const withdrawResult = await this.wallet.sendMany({
      type: 'defiWithdraw',
      defiParams: {
        vaultId: params.vaultId,
        amount: params.amount,
      },
      ...(params.walletPassphrase ? { walletPassphrase: params.walletPassphrase } : {}),
    });

    const txRequestId = this.extractTxRequestId(withdrawResult);
    const operationId = this.extractOperationId(withdrawResult);

    if (!operationId) {
      throw new Error('operationId not found in withdraw txRequest response');
    }

    return { operationId, txRequestId };
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
   * Extract operationId from a sendMany result.
   *
   * The WP writes the defi-service-minted operationId into the built
   * transaction's `coinSpecific` (alongside `assignedNonce`), not into the
   * intent. Read it from there: the `full` apiVersion surfaces it at
   * `transactions[0].unsignedTx.coinSpecific.operationId`, the `lite` version
   * at `unsignedTxs[0].coinSpecific.operationId`. Fall back to
   * `intent.operationId` for forward-compat in case the WP later also
   * populates the intent.
   */
  private extractOperationId(sendManyResult: Record<string, unknown>): string | undefined {
    const txRequest = sendManyResult.txRequest as Record<string, unknown> | undefined;
    if (!txRequest) {
      return undefined;
    }

    // full apiVersion: transactions[0].unsignedTx.coinSpecific.operationId
    const transactions = txRequest.transactions as Array<Record<string, unknown>> | undefined;
    const fullUnsignedTx = transactions?.[0]?.unsignedTx as Record<string, unknown> | undefined;
    const fullCoinSpecific = fullUnsignedTx?.coinSpecific as Record<string, unknown> | undefined;
    if (fullCoinSpecific?.operationId) {
      return fullCoinSpecific.operationId as string;
    }

    // lite apiVersion: unsignedTxs[0].coinSpecific.operationId
    const unsignedTxs = txRequest.unsignedTxs as Array<Record<string, unknown>> | undefined;
    const liteCoinSpecific = unsignedTxs?.[0]?.coinSpecific as Record<string, unknown> | undefined;
    if (liteCoinSpecific?.operationId) {
      return liteCoinSpecific.operationId as string;
    }

    // forward-compat: intent.operationId (in case the WP later populates the intent)
    const intent = txRequest.intent as Record<string, unknown> | undefined;
    return intent?.operationId as string | undefined;
  }

  /**
   * Extracts {@link ConcreteDepositResult} from a custodial sendMany response.
   * Concrete BTC deposits return a `pendingApproval` instead of a txRequest —
   * throws if `pendingApproval.id` is absent, indicating an unexpected shape.
   */
  private extractConcreteDepositResult(sendManyResult: Record<string, unknown>): ConcreteDepositResult {
    const SendManyConcreteResponse = t.type({
      pendingApproval: t.intersection([t.type({ id: t.string }), t.partial({ state: t.string })]),
    });
    const decoded = decodeWithCodec(SendManyConcreteResponse, sendManyResult, 'defi-deposit sendMany response');
    return {
      pendingApprovalId: decoded.pendingApproval.id,
      state: decoded.pendingApproval.state ?? 'awaitingSignature',
    };
  }

  private operationsUrl(): string {
    return `/api/defi-service/v1/wallets/${this.wallet.id()}/operations`;
  }
}
