import { EContractVersion, type IPoolData } from "@sundaeswap/core";
interface IPoolSupport {
    /** We can quote this pool and place a swap for it. */
    swap: boolean;
    /**
     * The order names the pool, so the pool-taking `buildSwapOrderTx` accepts it.
     * A V4 order is an intent that names no pool — the scooper chooses — so a V4
     * pool is swappable without this.
     */
    buildAgainstPool: boolean;
}
/**
 * What the SDK can do with a pool, by Sundae contract version.
 *
 * Deliberately a `Record` over every version: a new Sundae version will not
 * compile until someone answers both questions for it, rather than silently
 * defaulting to unsupported because nobody remembered a second list.
 */
declare const POOL_SUPPORT: {
    readonly V1: {
        readonly swap: false;
        readonly buildAgainstPool: false;
    };
    readonly V3: {
        readonly swap: true;
        readonly buildAgainstPool: true;
    };
    readonly NftCheck: {
        readonly swap: false;
        readonly buildAgainstPool: false;
    };
    readonly Condition: {
        readonly swap: false;
        readonly buildAgainstPool: false;
    };
    readonly Stableswaps: {
        readonly swap: true;
        readonly buildAgainstPool: true;
    };
    readonly V4: {
        readonly swap: true;
        readonly buildAgainstPool: false;
    };
};
type TVersionsWhere<K extends keyof IPoolSupport> = {
    [V in EContractVersion]: (typeof POOL_SUPPORT)[V][K] extends true ? V : never;
}[EContractVersion];
/** Versions whose order names the pool. See {@link isSupportedSundaeSwapVersion}. */
export declare const SUPPORTED_SUNDAE_SWAP_VERSIONS: readonly TVersionsWhere<"buildAgainstPool">[];
export type TSundaeSwapVersion = TVersionsWhere<"buildAgainstPool">;
/**
 * Whether the pool-taking `buildSwapOrderTx` accepts this version. Narrower than
 * {@link isSwappableSundaeSwapVersion} — a V4 pool is swappable but its order
 * names no pool, so it is not buildable *against a pool*.
 */
export declare function isSupportedSundaeSwapVersion(version: EContractVersion): version is TSundaeSwapVersion;
export declare function assertSupportedSundaeSwapPool(pool: IPoolData): asserts pool is IPoolData & {
    version: TSundaeSwapVersion;
};
/** Versions the SDK can quote and place a swap for. */
export declare const SWAPPABLE_SUNDAE_SWAP_VERSIONS: readonly TVersionsWhere<"swap">[];
export type TSwappableSundaeSwapVersion = TVersionsWhere<"swap">;
/** Whether the SDK can quote this version and place a swap for it. */
export declare function isSwappableSundaeSwapVersion(version: EContractVersion): version is TSwappableSundaeSwapVersion;
/**
 * Throws the same message as {@link assertSupportedSundaeSwapPool} on purpose:
 * callers and tests treat "Unsupported Sundae swap pool version: X" as the one
 * version-rejection string.
 */
export declare function assertSwappableSundaeSwapPool(pool: IPoolData): asserts pool is IPoolData & {
    version: TSwappableSundaeSwapVersion;
};
export {};
//# sourceMappingURL=support.d.ts.map