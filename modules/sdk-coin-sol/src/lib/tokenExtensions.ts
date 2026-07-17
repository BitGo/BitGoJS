import { SolTokenExtensions, SolTokenExtensionType } from '@bitgo/statics';
import {
  AccountState,
  ExtensionType,
  getExtensionData,
  getExtensionTypes,
  getInterestBearingMintConfigState,
  getMint,
  getPermanentDelegate,
  getTransferFeeConfig,
  getTransferHook,
  type Mint,
  TOKEN_2022_PROGRAM_ID,
} from '@solana/spl-token';
import { Commitment, Connection, PublicKey } from '@solana/web3.js';

/**
 * Result of reading a Token-2022 mint's extension data.
 *
 * `detectedTypeNames` lists EVERY extension present on the mint — including ones BitGo does
 * not model — so callers can run the onboarding safety gate (`getUnsupportedSolTokenExtensions`).
 * `extensions` is the typed, storable config for the extensions BitGo does model.
 */
export interface MintExtensionReadResult {
  detectedTypeNames: string[];
  extensions: SolTokenExtensions;
}

/** Map from `@solana/spl-token` ExtensionType names to BitGo's modeled extension types. */
const EXTENSION_NAME_MAP: Readonly<Record<string, SolTokenExtensionType>> = {
  TransferFeeConfig: SolTokenExtensionType.TransferFee,
  TransferHook: SolTokenExtensionType.TransferHook,
  PermanentDelegate: SolTokenExtensionType.PermanentDelegate,
  InterestBearingConfig: SolTokenExtensionType.InterestBearing,
  DefaultAccountState: SolTokenExtensionType.DefaultAccountState,
  ScaledUiAmountConfig: SolTokenExtensionType.ScaledUiAmount,
};

const CONFIDENTIAL_TRANSFER_NAMES = ['ConfidentialTransferMint', 'ConfidentialTransferFeeConfig'];

/** Human-readable names of every extension type present on the mint. */
export function extensionTypeNames(mintInfo: Mint): string[] {
  if (mintInfo.tlvData.length === 0) {
    return [];
  }
  return getExtensionTypes(mintInfo.tlvData).map((t) => ExtensionType[t] ?? `unknown(${t})`);
}

/** The subset of detected extensions that BitGo models. Pure — unit-testable without chain data. */
export function mapModeledExtensions(detectedTypeNames: readonly string[]): SolTokenExtensionType[] {
  const modeled: SolTokenExtensionType[] = [];
  for (const name of detectedTypeNames) {
    const mapped = EXTENSION_NAME_MAP[name];
    if (mapped !== undefined && !modeled.includes(mapped)) {
      modeled.push(mapped);
    }
  }
  return modeled;
}

/**
 * Enforce the protocol-level incompatibility: Transfer Hook and Confidential
 * Transfer cannot coexist on the same mint. Pure — unit-testable without chain data.
 */
export function assertExtensionCompatibility(detectedTypeNames: readonly string[]): void {
  const hasHook = detectedTypeNames.includes('TransferHook');
  const hasConfidential = detectedTypeNames.some((n) => CONFIDENTIAL_TRANSFER_NAMES.includes(n));
  if (hasHook && hasConfidential) {
    throw new Error('Mint declares both Transfer Hook and Confidential Transfer, which cannot coexist');
  }
}

function toBase58(key: PublicKey | null): string | undefined {
  return key ? key.toBase58() : undefined;
}

/**
 * Parse a decoded Token-2022 `Mint` into BitGo's extension model. Separated from the RPC call
 * so it can be unit-tested against recorded mint fixtures.
 */
export function parseMintExtensions(mintInfo: Mint): MintExtensionReadResult {
  const detectedTypeNames = extensionTypeNames(mintInfo);
  assertExtensionCompatibility(detectedTypeNames);

  const extensions: SolTokenExtensions = { detected: mapModeledExtensions(detectedTypeNames) };
  const authorities: NonNullable<SolTokenExtensions['authorities']> = {
    mintAuthority: toBase58(mintInfo.mintAuthority),
    freezeAuthority: toBase58(mintInfo.freezeAuthority),
  };

  const feeConfig = getTransferFeeConfig(mintInfo);
  if (feeConfig) {
    extensions.transferFee = {
      transferFeeBasisPoints: feeConfig.newerTransferFee.transferFeeBasisPoints,
      maximumFee: feeConfig.newerTransferFee.maximumFee.toString(),
    };
    authorities.transferFeeConfigAuthority = toBase58(feeConfig.transferFeeConfigAuthority);
    authorities.withdrawWithheldAuthority = toBase58(feeConfig.withdrawWithheldAuthority);
  }

  const hook = getTransferHook(mintInfo);
  if (hook) {
    extensions.transferHookProgramId = hook.programId.toBase58();
  }

  const delegate = getPermanentDelegate(mintInfo);
  if (delegate?.delegate) {
    authorities.permanentDelegate = delegate.delegate.toBase58();
  }

  const interest = getInterestBearingMintConfigState(mintInfo);
  if (interest) {
    extensions.interestBearing = { rateBasisPoints: interest.currentRate };
    authorities.rateAuthority = toBase58(interest.rateAuthority);
  }

  // DefaultAccountState is a single byte (AccountState). Decoded generically to avoid depending
  // on a version-specific typed getter. permissionlessThaw is NOT on-chain — resolved separately
  // at onboarding; defaults false until confirmed.
  const defaultStateData = getExtensionData(ExtensionType.DefaultAccountState, mintInfo.tlvData);
  if (defaultStateData) {
    extensions.defaultAccountState = {
      frozen: defaultStateData[0] === AccountState.Frozen,
      permissionlessThaw: false,
    };
  }

  // NOTE: ScaledUiAmount config parsing (initialMultiplier) is intentionally deferred — the typed
  // getter is not available in @solana/spl-token@0.4.9. The extension is still *detected* above
  // (so the safety gate sees it); populating scaledUiAmount.initialMultiplier is a follow-up that
  // bumps @solana/spl-token to a version exposing getScaledUiAmountConfig. See PR for 3.4.

  if (Object.values(authorities).some((v) => v !== undefined)) {
    extensions.authorities = authorities;
  }

  return { detectedTypeNames, extensions };
}

/** Fetch a Token-2022 mint and parse its extensions. Uses `finalized` commitment rules. */
export async function readMintExtensions(
  connection: Connection,
  mint: string | PublicKey,
  commitment: Commitment = 'finalized'
): Promise<MintExtensionReadResult> {
  const mintPubkey = typeof mint === 'string' ? new PublicKey(mint) : mint;
  const mintInfo = await getMint(connection, mintPubkey, commitment, TOKEN_2022_PROGRAM_ID);
  return parseMintExtensions(mintInfo);
}
