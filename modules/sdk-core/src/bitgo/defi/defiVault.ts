/**
 * @prettier
 */
import * as t from 'io-ts';
import { CoinFeature } from '@bitgo/statics';
import { GetVaultResponse, VaultProtocol, VaultProtocolType } from '@bitgo/public-types';
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
  WrapOptions,
  WrapResult,
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
   * Minimal dispatch codec. The deposit path reads only `protocol` to choose
   * between the concrete and morpho flows, so it must not hard-fail on the
   * validity of unrelated response fields (e.g. `composition[]`) it never
   * consumes. A code path must not fail on the validity of data it does not
   * consume.
   */
  private static readonly VaultDispatch = t.type({ protocol: VaultProtocolType });

  /**
   * Fetch the raw vault config from defi-service. Shared by callers that
   * decode the full response and callers that decode only what they use.
   */
  private async fetchVaultRaw(vaultId: string): Promise<unknown> {
    if (!vaultId) {
      throw new Error('vaultId is required');
    }
    return await this.bitgo
      .get(this.bitgo.microservicesUrl(`/api/defi-service/v1/vaults/${vaultId}`))
      .set('enterprise-id', this.wallet.toJSON().enterprise)
      .result();
  }

  /**
   * Fetch vault config from defi-service. Used internally to determine
   * which deposit path to take (Concrete vs Morpho).
   */
  async getVaultConfig(params: GetVaultConfigOptions): Promise<GetVaultResponse> {
    return decodeWithCodec(GetVaultResponse, await this.fetchVaultRaw(params.vaultId), 'getVaultConfig');
  }

  /**
   * Fetch only the vault protocol from defi-service. Decodes the minimal
   * `VaultDispatch` shape rather than the full `GetVaultResponse`, so callers
   * that need only the protocol are not hostage to the validity of unrelated
   * response fields (e.g. `composition[]`) they never consume.
   */
  async getVaultProtocol(params: GetVaultConfigOptions): Promise<VaultProtocol> {
    const { protocol } = decodeWithCodec(
      DefiVault.VaultDispatch,
      await this.fetchVaultRaw(params.vaultId),
      'vaultDispatch'
    );
    return protocol;
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

    const protocol = await this.getVaultProtocol({ vaultId: params.vaultId });

    if (protocol === VaultProtocol.CONCRETE_BTCCX) {
      return this.depositToConcreteVault(params);
    } else if (protocol === VaultProtocol.MORPHO) {
      return this.depositToMorphoVault(params);
    } else {
      throw new Error(`Unsupported vault protocol: ${protocol}`);
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

  /**
   * Wrap native currency into its canonical wrapped-native ERC-20
   * (ETH → WETH via the WETH9 `deposit()` call).
   *
   * A thin orchestrator over a single sendMany, like {@link withdrawFromVault}.
   * WP builds the calldata and resolves the WETH9 address server-side from the
   * vault binding; the SDK only forwards vaultId and amount.
   *
   * @param params.vaultId - DeFi-service vault identifier. Required in v1: binding
   *   the wrap to a vault is what supplies the per-enterprise authorization gate
   *   and the address-whitelist path server-side (TDD §3.6). M7 makes it optional,
   *   which is backward-compatible.
   * @param params.amount - amount in base units of the native coin (18dp for ETH)
   * @param params.walletPassphrase - required for hot wallets, omit for custody
   */
  async wrap(params: WrapOptions): Promise<WrapResult> {
    return this.sendWrapIntent('wrapNative', params);
  }

  /**
   * Unwrap the canonical wrapped-native ERC-20 back to native currency
   * (WETH → ETH via the WETH9 `withdraw(uint256)` call).
   *
   * @param params.vaultId - DeFi-service vault identifier (see {@link wrap})
   * @param params.amount - amount in base units of the wrapped token (18dp for WETH)
   * @param params.walletPassphrase - required for hot wallets, omit for custody
   */
  async unwrap(params: WrapOptions): Promise<WrapResult> {
    return this.sendWrapIntent('unwrapNative', params);
  }

  // ── Internal helpers ────────────────────────────────────────────────

  /**
   * Shared body of {@link wrap} and {@link unwrap} — the two differ only in the
   * sendMany type they issue.
   *
   * Deliberately does not call {@link extractOperationId}: no operation is minted
   * for wrap/unwrap in v1, so it would only ever return undefined. Operation
   * tracking arrives in milestone M5.
   */
  private async sendWrapIntent(type: 'wrapNative' | 'unwrapNative', params: WrapOptions): Promise<WrapResult> {
    const vaultId = params.vaultId?.trim();
    if (!vaultId) {
      throw new Error('vaultId is required');
    }
    // The downstream BigIntFromString codec (wallet.ts) accepts anything JS's BigInt() constructor
    // does - negative amounts, hex strings like '0xabc', and zero - and this amount forwards
    // straight into a value-moving WETH9 deposit()/withdraw() call. Require a positive unsigned
    // decimal integer string here; zero is deliberately rejected too, since a zero-amount wrap/
    // unwrap has no on-chain effect but would still spend gas.
    if (!params.amount || !/^\d+$/.test(params.amount) || BigInt(params.amount) === 0n) {
      throw new Error('amount must be a positive unsigned decimal integer string');
    }
    // Wrapped-native vaults (WETH9 deposit()/withdraw()) only exist on EVM chains. Fail fast here
    // instead of letting an unsupported coin reach wallet-platform and return an opaque prebuild error.
    if (!this.wallet.baseCoin.getConfig().features.includes(CoinFeature.EVM_COIN)) {
      throw new Error(`wrap/unwrap is not supported for ${this.wallet.baseCoin.getFamily()} wallets`);
    }

    const result = await this.wallet.sendMany({
      type,
      defiParams: {
        vaultId,
        amount: params.amount,
      },
      ...(params.walletPassphrase ? { walletPassphrase: params.walletPassphrase } : {}),
    });

    return { txRequestId: this.extractTxRequestId(result) };
  }

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
