/**
 * @prettier
 */
import { IWallet } from '../wallet/iWallet';
import { BitGoBase } from '../bitgoBase';
import { ShieldJourneyDetail, ShieldTokenOptions, ShieldTokenResult } from './iConfidential';

export { ShieldTokenOptions, ShieldTokenResult, ShieldJourneyDetail };

const DEFAULT_POLL_INTERVAL_MS = 2000;
const DEFAULT_POLL_TIMEOUT_MS = 120_000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Orchestrates ERC-7984 shield (wrapApprove → wait → sign WP-created wrap).
 *
 * Per TDD: the client creates only `wrapApprove`. WP performs the allowance
 * branch and creates the `wrap` txnReq on approve confirm. The SDK polls the
 * shield journey GET and signs/sends that wrap txnReq for hot wallets.
 */
export class ConfidentialToken {
  private readonly wallet: IWallet;
  private readonly bitgo: BitGoBase;

  constructor(wallet: IWallet) {
    this.wallet = wallet;
    this.bitgo = wallet.bitgo;
  }

  /**
   * Shield (wrap) an underlying ERC-20 amount into an ERC-7984 confidential token.
   *
   * @param params.tokenName - confidential wrapper token (e.g. `hteth:cusdt`)
   * @param params.amount - underlying amount in base units
   * @param params.walletPassphrase - required for hot TSS wallets
   */
  async shieldToken(params: ShieldTokenOptions): Promise<ShieldTokenResult> {
    if (!params.tokenName) {
      throw new Error('tokenName is required');
    }
    if (!params.amount) {
      throw new Error('amount is required');
    }
    if (!/^[1-9]\d*$/.test(String(params.amount))) {
      throw new Error(`amount must be a positive integer string, got '${params.amount}'`);
    }

    // Step 1: client creates wrapApprove only (WP owns allowance branch + wrap create)
    const wrapApproveResult = (await this.wallet.sendMany({
      type: 'wrapApprove',
      shieldParams: {
        tokenName: params.tokenName,
        amount: String(params.amount),
      },
      ...(params.walletPassphrase ? { walletPassphrase: params.walletPassphrase } : {}),
    })) as Record<string, unknown>;

    const wrapApproveTxRequestId = this.extractTxRequestId(wrapApproveResult);
    const wrapLinkId = this.extractWrapLinkId(wrapApproveResult);
    if (!wrapLinkId) {
      throw new Error('wrapLinkId not found in wrapApprove txRequest response');
    }

    // Custodial / pendingApproval: stop after wrapApprove; WP creates wrap later
    const pendingApproval = wrapApproveResult.pendingApproval as { id?: string } | undefined;
    if (pendingApproval?.id) {
      return {
        wrapLinkId,
        wrapApproveTxRequestId,
        pendingApprovalId: pendingApproval.id,
        raw: { wrapApproveResult },
      };
    }

    // Step 2: wait for WP-created wrap txnReq (same wrapLinkId)
    const journey = await this.pollForWrapTxRequest(wrapLinkId, {
      pollIntervalMs: params.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS,
      pollTimeoutMs: params.pollTimeoutMs ?? DEFAULT_POLL_TIMEOUT_MS,
    });

    if (!journey.wrapTxRequestId) {
      throw new Error(`shield journey for ${wrapLinkId} reached status ${journey.status} without wrapTxRequestId`);
    }

    // Step 3: sign + send WP-created wrap (client must not POST create)
    if (!params.walletPassphrase) {
      return {
        wrapLinkId,
        wrapApproveTxRequestId,
        wrapTxRequestId: journey.wrapTxRequestId,
        raw: { wrapApproveResult },
      };
    }

    const wrapResult = await this.wallet.signAndSendTxRequest({
      txRequestId: journey.wrapTxRequestId,
      walletPassphrase: params.walletPassphrase,
      isTxRequestFull: true,
    });

    return {
      wrapLinkId,
      wrapApproveTxRequestId,
      wrapTxRequestId: journey.wrapTxRequestId,
      raw: { wrapApproveResult, wrapResult },
    };
  }

  /**
   * Fetch shield journey detail for a wrapLinkId.
   */
  async getShieldJourney(wrapLinkId: string): Promise<ShieldJourneyDetail> {
    if (!wrapLinkId) {
      throw new Error('wrapLinkId is required');
    }
    return (await this.bitgo.get(this.wallet.url(`/token/shield/${wrapLinkId}`)).result()) as ShieldJourneyDetail;
  }

  private async pollForWrapTxRequest(
    wrapLinkId: string,
    opts: { pollIntervalMs: number; pollTimeoutMs: number }
  ): Promise<ShieldJourneyDetail> {
    const deadline = Date.now() + opts.pollTimeoutMs;
    let last: ShieldJourneyDetail | undefined;

    while (Date.now() < deadline) {
      last = await this.getShieldJourney(wrapLinkId);
      if (last.wrapTxRequestId && (last.status === 'WRAP' || last.status === 'CONSUMED')) {
        return last;
      }
      if (last.status === 'APPROVE_FAILED' || last.status === 'WRAP_FAILED') {
        throw new Error(`shield journey ${wrapLinkId} failed with status ${last.status}`);
      }
      await sleep(opts.pollIntervalMs);
    }

    throw new Error(
      `timed out waiting for WP-created wrap txnReq for wrapLinkId ${wrapLinkId}` +
        (last ? ` (last status: ${last.status})` : '')
    );
  }

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

  private extractWrapLinkId(sendManyResult: Record<string, unknown>): string | undefined {
    const txRequest = sendManyResult.txRequest as Record<string, unknown> | undefined;
    if (!txRequest) {
      return undefined;
    }

    const transactions = txRequest.transactions as Array<Record<string, unknown>> | undefined;
    const fullUnsignedTx = transactions?.[0]?.unsignedTx as Record<string, unknown> | undefined;
    const fullCoinSpecific = fullUnsignedTx?.coinSpecific as Record<string, unknown> | undefined;
    if (typeof fullCoinSpecific?.wrapLinkId === 'string') {
      return fullCoinSpecific.wrapLinkId;
    }

    const unsignedTxs = txRequest.unsignedTxs as Array<Record<string, unknown>> | undefined;
    const liteCoinSpecific = unsignedTxs?.[0]?.coinSpecific as Record<string, unknown> | undefined;
    if (typeof liteCoinSpecific?.wrapLinkId === 'string') {
      return liteCoinSpecific.wrapLinkId;
    }

    return undefined;
  }
}
