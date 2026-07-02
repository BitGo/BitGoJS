import { Args } from '@substrate/txwrapper-core';
import { Interface } from '@bitgo/abstract-substrate';
import { DecodedUnsignedTx } from '@substrate/txwrapper-core/lib/types';

export type AnyJson = string | number | boolean | null | { [key: string]: AnyJson } | Array<AnyJson>;

/**
 * Extended TxData interface for Polyx transactions
 * Adds assetId field to the base TxData interface from abstract-substrate
 */
export interface TxData extends Interface.TxData {
  assetId?: string;
  fromDID?: string;
  toDID?: string;
  instructionId?: string;
  portfolioDID?: string;
  /**
   * Hex of the full raw encoded `ExtrinsicPayload` (see `Transaction.rawExtrinsicPayload`).
   * Surfaced alongside the MPC/combine `signableHex` so consumers that need the raw payload
   * (e.g. the HSM `polyx/signtx` path) can use it for extrinsics larger than 256 bytes, where
   * the signing bytes are the blake2_256 hash rather than the raw payload.
   */
  rawSignableHex?: string;
}

/**
 * Settlement type for Polyx transactions
 */
export enum SettlementType {
  SettleOnAffirmation = 'SettleOnAffirmation',
}

/**
 * Portfolio kind for Polyx transactions
 */
export enum PortfolioKind {
  Default = 'Default',
}

/**
 * Method names for Polyx transactions.
 * Extends the base MethodNames from Interface with additional Polyx-specific methods.
 */
export const MethodNames = {
  // Include all values from the base object
  ...Interface.MethodNames,

  /**
   * Registers a Decentralized Identifier (DID) along with Customer Due Diligence (CDD) information.
   * [CLEANUP-V8-OLD] v7 CDD-provider path; still present and callable on v8 at the same call
   * index (0x0714). Kept for Flipt rollback alongside the v8 DID Registrar path (RegisterDid).
   *
   * @see https://developers.polymesh.network/sdk-docs/enums/Generated/Types/IdentityTx/#cddregisterdidwithcdd
   */
  RegisterDidWithCDD: 'cddRegisterDidWithCdd' as const,

  /**
   * v8 DID Registrar path — registers a DID without a CDD claim. BitGo acts as the DID
   * Registrar and signs with the platform key, same operational model as RegisterDidWithCDD.
   */
  RegisterDid: 'registerDid' as const,

  /**
   * Pre-approves an asset.
   */
  PreApproveAsset: 'preApproveAsset' as const,

  AddAndAffirmWithMediators: 'addAndAffirmWithMediators' as const,

  RejectInstruction: 'rejectInstruction' as const,

  /** v8 — balances.transfer was renamed transferAllowDeath (same call slot 0x0500). */
  TransferAllowDeath: 'transferAllowDeath' as const,

  /** v8 — balances.transferKeepAlive moved to a new call index (0x0503). */
  TransferKeepAlive: 'transferKeepAlive' as const,
} as const;

// Create a type that represents the keys of this object
export type MethodNamesType = keyof typeof MethodNames;

// Create a type that represents the values of this object
export type MethodNamesValues = (typeof MethodNames)[MethodNamesType];

// [CLEANUP-V8-OLD] v7 CDD path args (identity.cddRegisterDidWithCdd). Kept for Flipt rollback.
export interface RegisterDidWithCDDArgs extends Args {
  targetAccount: string;
  secondaryKeys: [];
  expiry: null;
}

/**
 * v8 identity.registerDid args. NOTE: this call takes only `targetAccount` — it does NOT carry
 * `secondaryKeys`/`expiry` the way the v7 CDD path does. Verified against the real testnetV8Material
 * metadata (registerDid's call fields are `[target_account]` only); the migration plan's dry-run
 * note claiming an identical {targetAccount, secondaryKeys, expiry} shape does not hold.
 */
export interface RegisterDidArgs extends Args {
  targetAccount: string;
}

export interface PreApproveAssetArgs extends Args {
  assetId: string;
}

// [CLEANUP-V8-OLD] v7 settlement.addAndAffirmWithMediators args — portfolios/legs use bare
// PortfolioId. v8 replaces this with V8AddAndAffirmWithMediatorsArgs (AssetHolder-wrapped, below).
export interface AddAndAffirmWithMediatorsArgs extends Args {
  venueId: null;
  settlementType: SettlementType.SettleOnAffirmation;
  tradeDate: null;
  valueDate: null;
  legs: Array<{
    fungible: {
      sender: { did: string; kind: PortfolioKind.Default };
      receiver: { did: string; kind: PortfolioKind.Default };
      assetId: string;
      amount: string;
    };
  }>;
  portfolios: Array<{ did: string; kind: PortfolioKind.Default }>;
  instructionMemo: string;
  mediators: [];
}

/**
 * v8 AssetHolder enum — wraps the DID+kind that identifies a fungible-asset holder.
 * Confirmed on Polymesh Testnet v8 (block 24801173): settlement legs / holderSet now use
 * this wrapper instead of the bare v7 PortfolioId shape. Only the `Portfolio` variant is
 * used by BitGo's portfolio-based flows; `Account` covers account-based ownership (out of
 * scope for this migration).
 */
export type AssetHolder = { Portfolio: { did: string; kind: PortfolioKind.Default } } | { Account: string };

/**
 * v8 settlement.addAndAffirmWithMediators args. Call index is unchanged (0x2514) but
 * `portfolios` is renamed `holderSet` and every leg sender/receiver is wrapped in AssetHolder.
 */
export interface V8AddAndAffirmWithMediatorsArgs extends Args {
  venueId: null;
  settlementType: SettlementType.SettleOnAffirmation;
  tradeDate: null;
  valueDate: null;
  legs: Array<{
    fungible: {
      sender: AssetHolder;
      receiver: AssetHolder;
      assetId: string;
      amount: string;
    };
  }>;
  holderSet: AssetHolder[];
  instructionMemo: string;
  mediators: [];
}

/**
 * Decoded shape of AssetHolder. SCALE decoding (txwrapper-core's `decode()`, used by
 * `fromImplementation`/`validateDecodedTransaction`) lowercases the enum variant name and
 * expands `kind` to `{ default: null }` — verified by round-tripping a sample value through
 * the real testnetV8Material metadata registry. This differs from the construction shape
 * (`AssetHolder` above, capitalized `Portfolio`/`Account`) used when building a transaction.
 */
export type DecodedAssetHolder = { portfolio: { did: string; kind: { default: null } } } | { account: string };

/** Decoded shape of V8AddAndAffirmWithMediatorsArgs — see DecodedAssetHolder for why this differs
 * from the construction-side type. */
export interface DecodedV8AddAndAffirmWithMediatorsArgs extends Args {
  venueId: null;
  settlementType: { settleOnAffirmation: null };
  tradeDate: null;
  valueDate: null;
  legs: Array<{
    fungible: {
      sender: DecodedAssetHolder;
      receiver: DecodedAssetHolder;
      assetId: string;
      amount: string;
    };
  }>;
  holderSet: DecodedAssetHolder[];
  instructionMemo: string;
  mediators: [];
}

export interface RejectInstructionBuilderArgs extends Args {
  id: string;
  portfolio: { did: string; kind: PortfolioKind.Default };
  numberOfAssets: { fungible: number; nonFungible: number; offChain: number };
}

export interface TxMethod extends Omit<Interface.TxMethod, 'args' | 'name'> {
  args:
    | Interface.TransferArgs
    | Interface.TransferAllArgs
    | Interface.AddStakeArgs
    | Interface.RemoveStakeArgs
    | Interface.BondArgs
    | Interface.BondExtraArgs
    | Interface.NominateArgs
    | Interface.ChillArgs
    | Interface.UnbondArgs
    | Interface.WithdrawUnbondedArgs
    | Interface.BatchArgs
    | RegisterDidWithCDDArgs
    | RegisterDidArgs
    | PreApproveAssetArgs
    | AddAndAffirmWithMediatorsArgs
    | V8AddAndAffirmWithMediatorsArgs
    | RejectInstructionBuilderArgs;
  name: MethodNamesValues;
}

export interface DecodedTx extends Omit<DecodedUnsignedTx, 'method'> {
  method: TxMethod;
}

// [CLEANUP-V8-OLD] v7 staking.bond args carry `controller` (bond(controller, value, payee)).
// v8 drops the controller leg (stash is its own controller) — see V8BondArgs below. Kept for the
// v7 BatchStakingBuilder rollback path.
export interface BondArgs extends Args {
  value: string;
  controller: string;
  payee: string | { Account: string };
}

/**
 * v8 staking.bond args. Polymesh v8 changed `bond(controller, value, payee)` to
 * `bond(value, payee)` — the stash account is its own controller, so no `controller` field is
 * encoded. Used by V8BatchStakingBuilder.
 */
export interface V8BondArgs extends Args {
  value: string;
  payee: string | { Account: string };
}

export interface BondExtraArgs extends Args {
  maxAdditional: string;
}

export interface NominateArgs extends Args {
  targets: string[];
}

export interface BatchCallObject {
  method?: string;
  callIndex?: string;
  args: Record<string, unknown>;
}

export interface BatchArgs {
  calls: BatchCallObject[];
}

export interface UnbondArgs extends Args {
  value: string;
}

export interface WithdrawUnbondedArgs extends Args {
  numSlashingSpans: number;
}
