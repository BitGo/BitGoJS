/**
 * @prettier
 */
/**
 * Options for {@link IWallet.shieldToken}.
 *
 * Client creates only `wrapApprove`; WP creates the follow-up `wrap` txnReq
 * after approve confirms (same `wrapLinkId`). See TDD Flow A.
 */
export interface ShieldTokenOptions {
  /** Confidential wrapper token name (e.g. `hteth:cusdt`). */
  tokenName: string;
  /** Underlying ERC-20 amount to shield, in base units (decimal string). */
  amount: string;
  /** Required for hot wallets; omit for custodial (pendingApproval path). */
  walletPassphrase?: string;
  /** Poll interval while waiting for WP-created wrap (ms). Default 2000. */
  pollIntervalMs?: number;
  /** Max wait for wrap txnReq after approve (ms). Default 120000. */
  pollTimeoutMs?: number;
}

/**
 * Result of a successful {@link IWallet.shieldToken} orchestration.
 */
export interface ShieldTokenResult {
  /** Linkage id minted on the wrapApprove txnReq (`unsignedTx.coinSpecific`). */
  wrapLinkId: string;
  wrapApproveTxRequestId: string;
  /** Present once WP has created the wrap txnReq and the SDK has signed/sent it (hot). */
  wrapTxRequestId?: string;
  /** Present when wrapApprove returned a pendingApproval (custodial). */
  pendingApprovalId?: string;
  raw?: {
    wrapApproveResult?: unknown;
    wrapResult?: unknown;
  };
}

/**
 * Journey detail returned by WP `GET …/token/shield/{wrapLinkId}`.
 * Status values follow TDD coinSpecific orchestration states.
 */
export interface ShieldJourneyDetail {
  wrapLinkId: string;
  status: string;
  wrapApproveTxRequestId?: string;
  wrapTxRequestId?: string;
}

/** Params passed through sendMany / TSS prebuild for ERC-7984 shield intents. */
export interface ShieldIntentParams {
  tokenName: string;
  amount: string;
}
