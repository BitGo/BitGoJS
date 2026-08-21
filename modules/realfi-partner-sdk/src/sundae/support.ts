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
const POOL_SUPPORT = {
  [EContractVersion.V1]: { swap: false, buildAgainstPool: false },
  [EContractVersion.V3]: { swap: true, buildAgainstPool: true },
  [EContractVersion.NftCheck]: { swap: false, buildAgainstPool: false },
  [EContractVersion.Condition]: { swap: false, buildAgainstPool: false },
  [EContractVersion.Stableswaps]: { swap: true, buildAgainstPool: true },
  [EContractVersion.V4]: { swap: true, buildAgainstPool: false },
} as const satisfies Record<EContractVersion, IPoolSupport>;

type TVersionsWhere<K extends keyof IPoolSupport> = {
  [V in EContractVersion]: (typeof POOL_SUPPORT)[V][K] extends true ? V : never;
}[EContractVersion];

function versionsWhere<K extends keyof IPoolSupport>(
  capability: K,
): readonly TVersionsWhere<K>[] {
  return (Object.keys(POOL_SUPPORT) as EContractVersion[]).filter(
    (version): version is TVersionsWhere<K> =>
      POOL_SUPPORT[version][capability],
  );
}

/**
 * `pool.version` comes off the Sundae API, so a version absent from the table
 * reads as unsupported rather than throwing. Fail closed.
 */
function supports(
  version: EContractVersion,
  capability: keyof IPoolSupport,
): boolean {
  return POOL_SUPPORT[version]?.[capability] === true;
}

/** Versions whose order names the pool. See {@link isSupportedSundaeSwapVersion}. */
export const SUPPORTED_SUNDAE_SWAP_VERSIONS = versionsWhere("buildAgainstPool");

export type TSundaeSwapVersion = TVersionsWhere<"buildAgainstPool">;

/**
 * Whether the pool-taking `buildSwapOrderTx` accepts this version. Narrower than
 * {@link isSwappableSundaeSwapVersion} — a V4 pool is swappable but its order
 * names no pool, so it is not buildable *against a pool*.
 */
export function isSupportedSundaeSwapVersion(
  version: EContractVersion,
): version is TSundaeSwapVersion {
  return supports(version, "buildAgainstPool");
}

export function assertSupportedSundaeSwapPool(
  pool: IPoolData,
): asserts pool is IPoolData & { version: TSundaeSwapVersion } {
  if (!isSupportedSundaeSwapVersion(pool.version)) {
    throw new Error(`Unsupported Sundae swap pool version: ${pool.version}`);
  }
}

/** Versions the SDK can quote and place a swap for. */
export const SWAPPABLE_SUNDAE_SWAP_VERSIONS = versionsWhere("swap");

export type TSwappableSundaeSwapVersion = TVersionsWhere<"swap">;

/** Whether the SDK can quote this version and place a swap for it. */
export function isSwappableSundaeSwapVersion(
  version: EContractVersion,
): version is TSwappableSundaeSwapVersion {
  return supports(version, "swap");
}

/**
 * Throws the same message as {@link assertSupportedSundaeSwapPool} on purpose:
 * callers and tests treat "Unsupported Sundae swap pool version: X" as the one
 * version-rejection string.
 */
export function assertSwappableSundaeSwapPool(
  pool: IPoolData,
): asserts pool is IPoolData & { version: TSwappableSundaeSwapVersion } {
  if (!isSwappableSundaeSwapVersion(pool.version)) {
    throw new Error(`Unsupported Sundae swap pool version: ${pool.version}`);
  }
}
