import { EContractVersion } from "@sundaeswap/core";
/**
 * What the SDK can do with a pool, by Sundae contract version.
 *
 * Deliberately a `Record` over every version: a new Sundae version will not
 * compile until someone answers both questions for it, rather than silently
 * defaulting to unsupported because nobody remembered a second list.
 */
const POOL_SUPPORT = {
  [EContractVersion.V1]: {
    swap: false,
    buildAgainstPool: false
  },
  [EContractVersion.V3]: {
    swap: true,
    buildAgainstPool: true
  },
  [EContractVersion.NftCheck]: {
    swap: false,
    buildAgainstPool: false
  },
  [EContractVersion.Condition]: {
    swap: false,
    buildAgainstPool: false
  },
  [EContractVersion.Stableswaps]: {
    swap: true,
    buildAgainstPool: true
  },
  [EContractVersion.V4]: {
    swap: true,
    buildAgainstPool: false
  }
};
function versionsWhere(capability) {
  return Object.keys(POOL_SUPPORT).filter(version => POOL_SUPPORT[version][capability]);
}

/**
 * `pool.version` comes off the Sundae API, so a version absent from the table
 * reads as unsupported rather than throwing. Fail closed.
 */
function supports(version, capability) {
  return POOL_SUPPORT[version]?.[capability] === true;
}

/** Versions whose order names the pool. See {@link isSupportedSundaeSwapVersion}. */
export const SUPPORTED_SUNDAE_SWAP_VERSIONS = versionsWhere("buildAgainstPool");
/**
 * Whether the pool-taking `buildSwapOrderTx` accepts this version. Narrower than
 * {@link isSwappableSundaeSwapVersion} — a V4 pool is swappable but its order
 * names no pool, so it is not buildable *against a pool*.
 */
export function isSupportedSundaeSwapVersion(version) {
  return supports(version, "buildAgainstPool");
}
export function assertSupportedSundaeSwapPool(pool) {
  if (!isSupportedSundaeSwapVersion(pool.version)) {
    throw new Error(`Unsupported Sundae swap pool version: ${pool.version}`);
  }
}

/** Versions the SDK can quote and place a swap for. */
export const SWAPPABLE_SUNDAE_SWAP_VERSIONS = versionsWhere("swap");
/** Whether the SDK can quote this version and place a swap for it. */
export function isSwappableSundaeSwapVersion(version) {
  return supports(version, "swap");
}

/**
 * Throws the same message as {@link assertSupportedSundaeSwapPool} on purpose:
 * callers and tests treat "Unsupported Sundae swap pool version: X" as the one
 * version-rejection string.
 */
export function assertSwappableSundaeSwapPool(pool) {
  if (!isSwappableSundaeSwapVersion(pool.version)) {
    throw new Error(`Unsupported Sundae swap pool version: ${pool.version}`);
  }
}
//# sourceMappingURL=support.js.map