import { addressFromCredentials } from "@blaze-cardano/core";
import { parse, type TSchema } from "@blaze-cardano/data";
import type { Provider } from "@blaze-cardano/query";
import {
  Core,
  TxBuilder,
  type Blaze,
  type CIP30DataSignature,
  type Wallet,
} from "@blaze-cardano/sdk";

import * as Data from "@blaze-cardano/data";
import {
  SignatureList,
  type Destination,
} from "../../generated-types/v0_3/index.js";
import { ScriptAlreadyDeployedError } from "./errors.js";
import { V0_3Types } from "../../generated-types/index.js";
import type { TMultisigScript, TProtocolVersion } from "./types.js";

type TDestinationCredentialLike =
  | { VerificationKey: [string] }
  | { Script: [string] };

type TDestinationLike = {
  address: {
    payment_credential: TDestinationCredentialLike;
    stake_credential?: { Inline: [TDestinationCredentialLike] } | unknown;
  };
  datum:
    | "NoDatum"
    | { DatumHash: [string] }
    | { InlineDatum: [Core.PlutusData | unknown] };
};

/**
 * Create a reward account from a script
 */
export function rewardAccountFromScript(
  script: Core.Script,
  network: Core.NetworkId,
): Core.RewardAccount {
  const credential = credentialFromScript(script);
  return Core.RewardAccount.fromCredential(credential.toCore(), network);
}

/**
 * Create a credential from a script
 */
export function credentialFromScript(script: Core.Script): Core.Credential {
  return credentialFromScriptHash(script.hash());
}

/**
 * Create a credential from a script hash
 */
export function credentialFromScriptHash(
  scriptHash: Core.Hash28ByteBase16,
): Core.Credential {
  return Core.Credential.fromCore({
    type: Core.CredentialType.ScriptHash,
    hash: scriptHash,
  });
}

/**
 * Send a value (with an attached datum) to either a key-credentialled or
 * script-credentialled address. This helper emits an explicit output for
 * the destination address so callers (mintOneShot / updateOneShotDatum /
 * etc.) work transparently in both single-signer and multisig deployments.
 *
 * Mutates `tx` (matching Blaze's builder pattern) and returns it for chaining.
 */
export function lockOrPayAssets(
  tx: TxBuilder,
  address: Core.Address,
  value: Core.Value,
  datum: Core.PlutusData,
): TxBuilder {
  return addDirectOutput(tx, address, value, datum);
}

/**
 * Add an explicit transaction output for the target address and value.
 *
 * Mutates `tx` and returns it for call sites that want to keep builder-style
 * chaining.
 */
export function addDirectOutput(
  tx: TxBuilder,
  address: Core.Address,
  value: Core.Value,
  datum?: Core.PlutusData,
): TxBuilder {
  const output = new Core.TransactionOutput(address, value);
  if (datum) {
    output.setDatum(Core.Datum.newInlineData(datum));
  }
  tx.addOutput(output);
  return tx;
}

/**
 * Blockfrost responds to `getUnspentOutputs` on an unused address with HTTP
 * 404 ("requested component has not been found"), which the provider surfaces
 * as a generic Error. Treat only that exact failure as "not found at this
 * address" so outages and malformed responses still propagate.
 *
 * The query path is matched with an optional leading slash: @blaze-cardano/query
 * builds `/addresses/...`, while a caller paging the same endpoint itself builds
 * `addresses/...` (Blockfrost's base url already ends in `/`). The cron carries
 * a matcher for the same message
 * (`cli/src/scripts/lib/order-utxo-fetch.ts`); keep the two in step.
 */
const BLOCKFROST_ADDRESS_NOT_FOUND =
  /^getUnspentOutputs: Blockfrost threw "The requested component has not been found\." for query: \/?addresses\//;

function isBlockfrostAddressNotFoundError(error: unknown): boolean {
  return (
    error instanceof Error && BLOCKFROST_ADDRESS_NOT_FOUND.test(error.message)
  );
}

/**
 * Fully resolve the address's current unspent outputs.
 *
 * Blockfrost can expose a reference script through the transaction-output
 * endpoint before (or without) hydrating `reference_script_hash` on the address
 * UTxO endpoint. Re-resolving the inputs returned by the address query
 * preserves the unspent-only constraint while recovering the full output
 * metadata from the exact transactions.
 */
async function hydrateUnspentOutputs<P extends Provider, W extends Wallet>(
  blaze: Blaze<P, W>,
  address: Core.Address,
): Promise<Core.TransactionUnspentOutput[]> {
  const unspent = await blaze.provider.getUnspentOutputs(address);
  if (unspent.length === 0) return [];
  return blaze.provider.resolveUnspentOutputs(
    unspent.map((utxo) => utxo.input()),
  );
}

/**
 * A `hydrateUnspentOutputs` call shared by every hash resolved against the same
 * address in one pass. Hydration costs one provider request per UTxO at the
 * address, so a caller resolving eight script hashes against a provider that
 * omits script metadata would otherwise pay the whole sweep eight times, and
 * the dapp runs this against a rate-limited Blockfrost proxy. Scoped to a
 * single call rather than cached on the SDK so a later pass still sees a script
 * deployed in the meantime.
 */
type THydrateAddress = () => Promise<Core.TransactionUnspentOutput[]>;

function shareHydration<P extends Provider, W extends Wallet>(
  blaze: Blaze<P, W>,
  address: Core.Address,
): THydrateAddress {
  let pending: Promise<Core.TransactionUnspentOutput[]> | undefined;
  return () => (pending ??= hydrateUnspentOutputs(blaze, address));
}

/**
 * Resolve a script reference at a specific address, tolerating Blockfrost's
 * throw for an address with no history instead of an empty result, and its
 * missing script metadata on the address UTxO endpoint.
 */
async function resolveScriptRefAtAddress<P extends Provider, W extends Wallet>(
  blaze: Blaze<P, W>,
  hash: Core.Hash28ByteBase16,
  address: Core.Address,
  hydrate: THydrateAddress = () => hydrateUnspentOutputs(blaze, address),
): Promise<Core.TransactionUnspentOutput | undefined> {
  try {
    const resolved = await blaze.provider.resolveScriptRef(hash, address);
    if (resolved) return resolved;
  } catch (error) {
    if (!isBlockfrostAddressNotFoundError(error)) throw error;
    return undefined;
  }

  const hydrated = await hydrate();
  return hydrated.find((utxo) => utxo.output().scriptRef()?.hash() === hash);
}

/**
 * Deploy a script as a reference script.
 *
 * When `address` is provided, the reference UTxO is locked at that address
 * (instead of Blaze's default burn address), which lets resolution query a
 * small, dedicated UTxO set rather than the shared burn address.
 *
 * Throws `ScriptAlreadyDeployedError` (carrying the existing reference
 * UTxO) if the script is already deployed *at the target location* — the
 * specified `address` when given, otherwise the burn-address default. The
 * guard is intentionally scoped to the deploy target only: a copy that
 * exists elsewhere (e.g. a legacy copy at the burn address) does NOT block
 * deploying to a newly specified address, which is exactly what a migration
 * needs. Callers that want idempotent reruns should catch that specific class.
 */
export async function deployScript<P extends Provider, W extends Wallet>(
  blaze: Blaze<P, W>,
  script: Core.Script,
  address?: Core.Address,
): Promise<TxBuilder> {
  const refInput = address
    ? await resolveScriptRefAtAddress(blaze, script.hash(), address)
    : await blaze.provider.resolveScriptRef(script.hash());
  if (refInput) {
    throw new ScriptAlreadyDeployedError(script.hash(), refInput);
  }
  // `address === undefined` -> Blaze locks the script at the burn address.
  const deployTx = blaze.newTransaction().deployScript(script, address);
  return deployTx;
}

const NFT_LOOKUP_ATTEMPTS = 3;
const NFT_LOOKUP_BACKOFF_MS = 250;

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Look up an NFT UTxO, retrying indexer lag after the output moves.
 * Treats both a thrown 404 and an empty result as lag. Re-throws the last
 * provider error when the budget is exhausted.
 */
export async function getUnspentOutputByNftWithRetry(
  provider: Provider,
  assetId: Core.AssetId,
): Promise<Core.TransactionUnspentOutput | undefined> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= NFT_LOOKUP_ATTEMPTS; attempt++) {
    try {
      const utxo = await provider.getUnspentOutputByNFT(assetId);
      if (utxo) return utxo;
      lastError = undefined;
    } catch (error) {
      lastError = error;
    }
    if (attempt < NFT_LOOKUP_ATTEMPTS) {
      await sleep(NFT_LOOKUP_BACKOFF_MS * attempt);
    }
  }
  if (lastError) throw lastError;
  return undefined;
}

/**
 * Rebuild `utxo` with `datum` attached inline, preserving its input ref,
 * address, value and reference script.
 */
function withInlineDatum(
  utxo: Core.TransactionUnspentOutput,
  datum: Core.PlutusData,
): Core.TransactionUnspentOutput {
  const output = utxo.output();
  const promoted = new Core.TransactionOutput(
    output.address(),
    output.amount(),
  );
  promoted.setDatum(Core.Datum.newInlineData(datum));
  const scriptRef = output.scriptRef();
  if (scriptRef) {
    promoted.setScriptRef(scriptRef);
  }
  return new Core.TransactionUnspentOutput(utxo.input(), promoted);
}

/**
 * Read an NFT singleton (proxy, treasury, vault) and its datum.
 *
 * Protocol singletons are locked inline. A hash-form read is a provider
 * artifact (Blockfrost omitting `inline_datum`). Validators require
 * `InlineDatum` on the singleton input; passing the preimage as `addInput`'s
 * 3rd arg is a supplemental witness datum that local eval and phase-1 reject.
 * Resolve the hash, verify the preimage, and reattach it inline.
 *
 * The lookup is retried: a singleton always exists, so a not-found answer is
 * the provider's index lagging the UTxO's latest move, not a missing singleton.
 */
export async function readSingletonDatum(
  provider: Provider,
  nftAssetId: Core.AssetId,
): Promise<{
  utxo: Core.TransactionUnspentOutput;
  datum: Core.PlutusData;
}> {
  const read = await getUnspentOutputByNftWithRetry(provider, nftAssetId);
  if (!read) {
    throw new Error(`No UTXO found with NFT: ${nftAssetId}`);
  }

  const inline = read.output().datum()?.asInlineData();
  if (inline) {
    return { utxo: read, datum: inline };
  }

  const datumHash = read.output().datum()?.asDataHash();
  if (!datumHash) {
    throw new Error(`No datum found in UTXO with NFT: ${nftAssetId}`);
  }

  const resolved = await provider.resolveDatum(datumHash);
  const preimageHash = Core.blake2b_256(resolved.toCbor());
  if (preimageHash !== datumHash) {
    throw new Error(
      `Datum resolved for UTXO with NFT ${nftAssetId} does not match its datum hash: ` +
        `resolved preimage hashes to ${preimageHash}, UTXO reports ${datumHash}`,
    );
  }

  const input = read.input();
  console.warn(
    `[realfi-sdk] singleton ${nftAssetId} read at ${input.transactionId()}#${input.index()} ` +
      `reported datum hash ${datumHash} instead of its inline datum; reattaching the resolved preimage inline`,
  );
  return { utxo: withInlineDatum(read, resolved), datum: resolved };
}

/**
 * Get datum from a UTxO containing a specific NFT, optionally parsed under
 * `datumSchema`. Datum-hash reads are repaired by {@link readSingletonDatum}.
 */
export async function getDatumFromNFT<
  P extends Provider,
  W extends Wallet,
  T = unknown,
>(
  blaze: Blaze<P, W>,
  nftAssetId: Core.AssetId,
  datumSchema?: TSchema,
): Promise<{
  utxo: Core.TransactionUnspentOutput;
  datum: Core.PlutusData;
  parsedDatum: T;
}> {
  const { utxo, datum } = await readSingletonDatum(blaze.provider, nftAssetId);

  if (datumSchema) {
    const parsedDatum = parse(datumSchema, datum) as T;
    return { utxo, datum, parsedDatum };
  }

  return { utxo, datum, parsedDatum: undefined as T };
}

/**
 * Get script reference inputs, using cached values when available.
 *
 * When `address` is provided, each script is resolved at that address first
 * (a fast, dedicated query) and only falls back to Blaze's burn-address
 * default if it isn't found there. This keeps previously burn-address-deployed
 * scripts resolvable while migrating to a specified deployment address.
 */
export async function getReferenceInputs<P extends Provider, W extends Wallet>(
  blaze: Blaze<P, W>,
  scriptHashes: Record<string, Core.Hash28ByteBase16>,
  cachedInputs?: Partial<Record<string, Core.TransactionUnspentOutput>>,
  address?: Core.Address,
): Promise<Record<string, Core.TransactionUnspentOutput>> {
  const referenceInputs: Record<string, Core.TransactionUnspentOutput> = {};
  const hydrate = address ? shareHydration(blaze, address) : undefined;

  for (const [name, hash] of Object.entries(scriptHashes)) {
    if (cachedInputs?.[name]) {
      referenceInputs[name] = cachedInputs[name];
      continue;
    }

    const refInput =
      (address &&
        (await resolveScriptRefAtAddress(blaze, hash, address, hydrate))) ||
      (await blaze.provider.resolveScriptRef(hash));
    if (!refInput) {
      throw new Error(
        `No reference input found for ${name} script (${hash}). Make sure it is deployed.`,
      );
    }
    referenceInputs[name] = refInput;
  }

  return referenceInputs;
}

/**
 * Extract signature key hashes from a multisig script
 */
export const getSignatureKeyHashesFromMultisigScript = (
  multisig: TMultisigScript,
): string[] => {
  const result: string[] = [];

  if ("Signature" in multisig) {
    result.push(multisig.Signature.key_hash);
  } else if ("AtLeast" in multisig) {
    multisig.AtLeast.scripts
      .map((s) => getSignatureKeyHashesFromMultisigScript(s))
      .flat()
      .forEach((s) => {
        result.push(s);
      });
  } else if ("AllOf" in multisig) {
    multisig.AllOf.scripts
      .map((s) => getSignatureKeyHashesFromMultisigScript(s))
      .flat()
      .forEach((s) => {
        result.push(s);
      });
  } else if ("AnyOf" in multisig) {
    multisig.AnyOf.scripts
      .map((s) => getSignatureKeyHashesFromMultisigScript(s))
      .flat()
      .forEach((s) => {
        result.push(s);
      });
  }

  return [...new Set(result).values()];
};

/**
 * Extract script key hashes from a multisig script
 */
export const getScriptKeyHashesFromMultisigScript = (
  multisig: TMultisigScript,
): string[] => {
  const result: string[] = [];

  if ("Script" in multisig) {
    result.push(multisig.Script.script_hash);
  } else if ("AtLeast" in multisig) {
    multisig.AtLeast.scripts
      .map((s) => getScriptKeyHashesFromMultisigScript(s))
      .flat()
      .forEach((s) => {
        result.push(s);
      });
  } else if ("AllOf" in multisig) {
    multisig.AllOf.scripts
      .map((s) => getScriptKeyHashesFromMultisigScript(s))
      .flat()
      .forEach((s) => {
        result.push(s);
      });
  } else if ("AnyOf" in multisig) {
    multisig.AnyOf.scripts
      .map((s) => getScriptKeyHashesFromMultisigScript(s))
      .flat()
      .forEach((s) => {
        result.push(s);
      });
  }

  return [...new Set(result).values()];
};

/**
 * Extract all key hashes (signature + script) from a multisig script
 */
export const getAllKeyHashesFromMultisigScript = (
  multisig: TMultisigScript,
): string[] => {
  const keyHashes = getSignatureKeyHashesFromMultisigScript(multisig);
  const scriptHashes = getScriptKeyHashesFromMultisigScript(multisig);
  return [...new Set([...keyHashes, ...scriptHashes]).values()];
};

// ─────────────────────────────────────────────────────────────────────────────
// Order Input Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Sort order inputs by txHash and outputIndex for deterministic ordering.
 * This ensures consistent payload generation across all signers.
 */
export const sortOrderInputs = (
  orderInputs: Core.TransactionInput[],
): Core.TransactionInput[] => {
  return [...orderInputs].sort((a, b) => {
    const txHashA = a.transactionId().toString();
    const txHashB = b.transactionId().toString();
    if (txHashA < txHashB) return -1;
    if (txHashA > txHashB) return 1;
    const indexA = a.index();
    const indexB = b.index();
    return indexA < indexB ? -1 : indexA > indexB ? 1 : 0;
  });
};

/**
 * Build a nonce from the first order UTxO.
 */
export const buildNonceFromUtxo = (
  utxo: Core.TransactionInput,
): V0_3Types.Nonce => ({
  UTxO: [
    {
      transaction_id: utxo.transactionId().toString(),
      output_index: utxo.index(),
    },
  ],
});

/**
 * Build the origin ByteArray (CBOR-serialized OutputReference) from a UTxO.
 * Used by v0_4 SDK and shared helpers.
 */
export const buildOriginFromUtxo = (
  utxo: Core.TransactionUnspentOutput,
): string => {
  const input = utxo.input();
  const txId = input.transactionId().toString();
  const outputIndex = input.index();
  const fieldsList = new Core.PlutusList();
  fieldsList.add(Core.PlutusData.newBytes(Buffer.from(txId, "hex")));
  fieldsList.add(Core.PlutusData.newInteger(outputIndex));
  const outputRefData = Core.PlutusData.newConstrPlutusData(
    new Core.ConstrPlutusData(0n, fieldsList),
  );
  return outputRefData.toCbor();
};

/**
 * KeySignature type matching the contract's KeySignature tuple.
 * A tuple of [VerificationKey, COSESign1] where:
 * - VerificationKey: 32-byte Ed25519 public key (hex string)
 * - COSESign1: COSE signature with headers (raw CBOR bytes) and detached payload
 */
export type TKeySignature = [
  string, // VerificationKey (32-byte public key hex)
  {
    headers: {
      protected: string; // Raw CBOR hex bytes (HeaderMap = ByteArray in contract)
      unprotected: string; // Raw CBOR hex bytes (empty = "")
    };
    payload?: string; // Detached - undefined, actual payload stored separately
    signature: string;
  },
];

export const destructureCip30Signature = async (
  cip30Signature: CIP30DataSignature,
): Promise<{
  publicKey: string;
  coseSign1: {
    headers: {
      protected: string;
      unprotected: string;
    };
    signature: string;
  };
}> => {
  // Read the COSE_Sign1 with CBOR primitives from the dependency tree.
  // Async for callers that await it.
  const { protected: protectedCbor, signature } = readCoseSign1Parts(
    cip30Signature.signature.toString(),
  );
  // Extract public key from COSE_Key (at label -2)
  const publicKey = extractPublicKeyFromCoseKey(cip30Signature.key.toString());
  return {
    publicKey,
    coseSign1: {
      headers: {
        protected: protectedCbor,
        unprotected: "", // Empty ByteArray
      },
      signature,
    },
  };
};

/**
 * Produce a COSE (CIP-8) signature tuple over `payloadHash` using the connected
 * wallet's key. The reusable building block for signer callbacks — e.g. the
 * settings-governance `signAuthPayload` or an orchestrator signed redeemer —
 * that wraps `signData` + `destructureCip30Signature` into the on-chain tuple.
 */
export const signPayloadHashWithWallet = async <
  P extends Provider,
  W extends Wallet,
>(
  blaze: Blaze<P, W>,
  payloadHash: string,
): Promise<TKeySignature> => {
  const address = await blaze.wallet.getChangeAddress();
  const cip30Signature = await blaze.wallet.signData(address, payloadHash);
  const { publicKey, coseSign1 } =
    await destructureCip30Signature(cip30Signature);
  return [publicKey, coseSign1];
};

/**
 * Create a SignedRedeemer_ExtraProtocolRedeemer structure for on-chain verification.
 *
 * @param extra - The extra protocol redeemer data (e.g., request_to_outputs mapping)
 * @param payload - The SignedPayload_ProtocolRedeemer CBOR hex string (action + nonce)
 * @param signatures - Array of KeySignature tuples from each signer
 * @returns A SignedRedeemer_ExtraProtocolRedeemer ready for use in transaction
 */
export const createSignedRedeemer = (
  extra: V0_3Types.ExtraProtocolRedeemer,
  payload: string,
  signatures: SignatureList,
): V0_3Types.SignedRedeemer_ExtraProtocolRedeemer => {
  if (signatures.length === 0) {
    throw new Error("At least one signature is required");
  }

  return {
    extra,
    payload,
    signatures: signatures as SignatureList,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// CBOR Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Extract the 32-byte Ed25519 public key from a COSE_Key structure.
 * COSE_Key for Ed25519 has the key at label -2.
 * The COSE_Key CBOR structure looks like: a4 01 01 03 27 20 06 21 5820 <32 bytes>
 * Where 21 5820 indicates label -2 followed by a 32-byte bytestring.
 */
const extractPublicKeyFromCoseKey = (coseKeyHex: string): string => {
  // Parse the COSE_Key CBOR manually to find the public key
  // The key at label -2 (encoded as 0x21 in CBOR) contains the 32-byte public key
  // Look for 0x21 0x58 0x20 which indicates: label -2, bytestring, 32 bytes
  const keyBytes = Buffer.from(coseKeyHex, "hex");

  // Find the pattern: 21 58 20 (label -2, bytes, length 32)
  let pubKeyStart = -1;
  for (let i = 0; i < keyBytes.length - 34; i++) {
    if (
      keyBytes[i] === 0x21 &&
      keyBytes[i + 1] === 0x58 &&
      keyBytes[i + 2] === 0x20
    ) {
      pubKeyStart = i + 3; // Skip the 21 58 20 prefix
      break;
    }
  }

  if (pubKeyStart === -1) {
    throw new Error("Could not find public key in COSE_Key structure");
  }

  const pubKey = keyBytes.slice(pubKeyStart, pubKeyStart + 32);
  if (pubKey.length !== 32) {
    throw new Error(`Invalid public key length: ${pubKey.length}`);
  }

  return pubKey.toString("hex");
};

// ─────────────────────────────────────────────────────────────────────────────
// COSE_Sign1 (CIP-8) reader
// ─────────────────────────────────────────────────────────────────────────────

// CBOR major types used here.
const CBOR_MAJOR_BYTES = 2;
const CBOR_MAJOR_TEXT = 3;
const CBOR_MAJOR_ARRAY = 4;
const CBOR_MAJOR_MAP = 5;
const CBOR_MAJOR_TAG = 6;
const CBOR_MAJOR_SIMPLE = 7; // simple values (false/true/null) and floats

const CBOR_ADDITIONAL_INDEFINITE = 31;
const CBOR_BREAK = 0xff; // terminates an indefinite-length string/array/map
const CBOR_TAG_COSE_SIGN1 = 18; // COSE_Sign1's registered tag (encodes as d2)
const CBOR_SIMPLE_NULL = 22; // `f6`

/**
 * Read a CBOR header at `offset`, returning the major type, the argument
 * (length / value), whether the item is indefinite-length, and the offset of
 * the item's content. Supports the definite forms (0-23 inline and the
 * 1/2/4/8-byte arguments) plus indefinite-length strings, arrays, and maps.
 */
const readCborHeader = (
  bytes: Uint8Array,
  offset: number,
): {
  major: number;
  argument: number;
  indefinite: boolean;
  contentOffset: number;
} => {
  const initial = bytes[offset];
  if (initial === undefined) {
    throw new Error("COSE_Sign1 CBOR ended unexpectedly");
  }
  const major = initial >> 5;
  const additional = initial & 0x1f;

  if (additional < 24) {
    return {
      major,
      argument: additional,
      indefinite: false,
      contentOffset: offset + 1,
    };
  }

  if (additional === CBOR_ADDITIONAL_INDEFINITE) {
    // Only strings, arrays, and maps have an indefinite-length form. A break
    // byte (0xff) parses as major 7 here, so a stray break is rejected too.
    if (major < CBOR_MAJOR_BYTES || major > CBOR_MAJOR_MAP) {
      throw new Error(
        `Unsupported indefinite-length CBOR major type: ${major}`,
      );
    }
    return { major, argument: 0, indefinite: true, contentOffset: offset + 1 };
  }

  // 24/25/26/27 -> 1/2/4/8 following length bytes. 28-30 are reserved.
  if (additional > 27) {
    throw new Error(`Unsupported CBOR additional info: ${additional}`);
  }
  const lengthBytes = 1 << (additional - 24);
  let argument = 0;
  for (let i = 0; i < lengthBytes; i++) {
    const b = bytes[offset + 1 + i];
    if (b === undefined) {
      throw new Error("COSE_Sign1 CBOR length ended unexpectedly");
    }
    argument = argument * 256 + b;
  }
  return {
    major,
    argument,
    indefinite: false,
    contentOffset: offset + 1 + lengthBytes,
  };
};

/**
 * Read the definite-length chunks of an indefinite-length CBOR string whose
 * first chunk header is at `offset`, returning the concatenated content and
 * the offset just past the closing break byte.
 */
const readIndefiniteStringChunks = (
  bytes: Uint8Array,
  major: number,
  offset: number,
): { content: Uint8Array; nextOffset: number } => {
  const chunks: Uint8Array[] = [];
  let next = offset;
  while (bytes[next] !== CBOR_BREAK) {
    const chunk = readCborHeader(bytes, next);
    if (chunk.major !== major || chunk.indefinite) {
      throw new Error("Invalid chunk in an indefinite-length CBOR string");
    }
    const end = chunk.contentOffset + chunk.argument;
    if (end > bytes.length) {
      throw new Error("COSE_Sign1 CBOR ended unexpectedly");
    }
    chunks.push(bytes.slice(chunk.contentOffset, end));
    next = end;
  }
  return { content: Buffer.concat(chunks), nextOffset: next + 1 };
};

/**
 * Skip over one complete CBOR data item starting at `offset`, returning the
 * offset immediately after it. Handles the item shapes that occur inside a
 * COSE_Sign1 (byte/text strings, integers, arrays, maps, tags — definite or
 * indefinite length) recursively.
 */
const skipCborItem = (bytes: Uint8Array, offset: number): number => {
  const { major, argument, indefinite, contentOffset } = readCborHeader(
    bytes,
    offset,
  );
  if (indefinite) {
    if (major === CBOR_MAJOR_BYTES || major === CBOR_MAJOR_TEXT) {
      return readIndefiniteStringChunks(bytes, major, contentOffset).nextOffset;
    }
    // Indefinite array or map: items until the break byte.
    let next = contentOffset;
    while (bytes[next] !== CBOR_BREAK) {
      if (bytes[next] === undefined) {
        throw new Error("COSE_Sign1 CBOR ended unexpectedly");
      }
      next = skipCborItem(bytes, next); // array item / map key
      if (major === CBOR_MAJOR_MAP) {
        next = skipCborItem(bytes, next); // map value
      }
    }
    return next + 1;
  }
  switch (major) {
    case 0: // unsigned int
    case 1: // negative int
    case CBOR_MAJOR_SIMPLE: // simple value (false/true/null) or float
      // readCborHeader already consumed the value/float bytes into `argument`.
      return contentOffset;
    case CBOR_MAJOR_BYTES:
    case CBOR_MAJOR_TEXT: {
      const end = contentOffset + argument;
      if (end > bytes.length) {
        throw new Error("COSE_Sign1 CBOR ended unexpectedly");
      }
      return end;
    }
    case CBOR_MAJOR_ARRAY: {
      let next = contentOffset;
      for (let i = 0; i < argument; i++) {
        next = skipCborItem(bytes, next);
      }
      return next;
    }
    case CBOR_MAJOR_MAP: {
      let next = contentOffset;
      for (let i = 0; i < argument; i++) {
        next = skipCborItem(bytes, next); // key
        next = skipCborItem(bytes, next); // value
      }
      return next;
    }
    case CBOR_MAJOR_TAG:
      return skipCborItem(bytes, contentOffset); // tagged content
    default:
      throw new Error(`Unsupported CBOR major type in COSE_Sign1: ${major}`);
  }
};

/**
 * Read the byte-string content at `offset`, returning its hex and the offset
 * after it.
 */
const readCborByteString = (
  bytes: Uint8Array,
  offset: number,
): { hex: string; nextOffset: number } => {
  const { major, argument, indefinite, contentOffset } = readCborHeader(
    bytes,
    offset,
  );
  if (major !== CBOR_MAJOR_BYTES) {
    throw new Error(
      `Expected a CBOR byte string in COSE_Sign1, got major type ${major}`,
    );
  }
  if (indefinite) {
    const { content, nextOffset } = readIndefiniteStringChunks(
      bytes,
      major,
      contentOffset,
    );
    return { hex: Buffer.from(content).toString("hex"), nextOffset };
  }
  const end = contentOffset + argument;
  if (end > bytes.length) {
    throw new Error("COSE_Sign1 CBOR ended unexpectedly");
  }
  return {
    hex: Buffer.from(bytes.slice(contentOffset, end)).toString("hex"),
    nextOffset: end,
  };
};

/**
 * Parse a CIP-8 COSE_Sign1 and extract the pieces the on-chain KeySignature
 * tuple needs: the protected header map bytes (byte-string content, wrapper
 * removed) and the raw Ed25519 signature bytes.
 *
 * COSE_Sign1 = [ protected: bstr, unprotected: map, payload: bstr / nil,
 * signature: bstr ], optionally wrapped in CBOR tag 18. The protected element
 * is itself a byte string whose content is the serialized header map; reading
 * the byte-string content yields the raw header-map bytes the tuple stores.
 * Indefinite-length encodings of the array, the maps, and the byte strings
 * are accepted alongside the definite forms.
 */
export const readCoseSign1Parts = (
  coseSign1Hex: string,
): { protected: string; signature: string } => {
  const bytes = Buffer.from(coseSign1Hex, "hex");

  let offset = 0;
  // Optional CBOR tag: only tag 18 (COSE_Sign1's registered tag, the `d2`
  // prefix) is accepted — tagged input is accepted by design, since the
  // Ledger signing path emits d2-tagged COSE_Sign1s, but any other tag means
  // this isn't a COSE_Sign1 and must be rejected rather than silently unwrapped.
  const first = readCborHeader(bytes, offset);
  if (first.major === CBOR_MAJOR_TAG) {
    if (first.argument !== CBOR_TAG_COSE_SIGN1) {
      throw new Error(
        `COSE_Sign1 has unexpected CBOR tag ${first.argument} (expected 18)`,
      );
    }
    offset = first.contentOffset;
  }

  const array = readCborHeader(bytes, offset);
  if (array.major !== CBOR_MAJOR_ARRAY) {
    throw new Error("COSE_Sign1 is not a CBOR array");
  }
  if (!array.indefinite && array.argument !== 4) {
    throw new Error("COSE_Sign1 is not a 4-element CBOR array");
  }

  // Element 0: protected header byte string (content = serialized header map).
  const protectedRead = readCborByteString(bytes, array.contentOffset);

  // Element 1: unprotected header map — must be a CBOR map (major 5),
  // definite or indefinite. Peek the header before skipCborItem consumes it
  // so we assert on the same read the skip performs, not a second one.
  const unprotectedHeader = readCborHeader(bytes, protectedRead.nextOffset);
  if (unprotectedHeader.major !== CBOR_MAJOR_MAP) {
    throw new Error(
      `COSE_Sign1 unprotected header is not a CBOR map (got major type ${unprotectedHeader.major})`,
    );
  }
  const afterUnprotected = skipCborItem(bytes, protectedRead.nextOffset);

  // Element 2: payload — must be a byte string (major 2) or null (`f6`).
  const payloadHeader = readCborHeader(bytes, afterUnprotected);
  const isNullPayload =
    payloadHeader.major === CBOR_MAJOR_SIMPLE &&
    !payloadHeader.indefinite &&
    payloadHeader.argument === CBOR_SIMPLE_NULL;
  if (payloadHeader.major !== CBOR_MAJOR_BYTES && !isNullPayload) {
    throw new Error(
      `COSE_Sign1 payload is not a byte string or null (got major type ${payloadHeader.major})`,
    );
  }
  const afterPayload = skipCborItem(bytes, afterUnprotected);

  // Element 3: signature byte string.
  const signatureRead = readCborByteString(bytes, afterPayload);

  // An indefinite-length COSE_Sign1 array must close right after element 3.
  if (array.indefinite && bytes[signatureRead.nextOffset] !== CBOR_BREAK) {
    throw new Error("COSE_Sign1 is not a 4-element CBOR array");
  }

  return { protected: protectedRead.hex, signature: signatureRead.hex };
};

// ─────────────────────────────────────────────────────────────────────────────
// Treasury Operation Payload Helpers (Withdraw/Deposit)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build the SignedPayload_ProtocolRedeemer for a withdraw operation.
 * Uses the treasury UTxO as the nonce source.
 *
 * @param requests - Array of withdraw requests with destinations and amounts
 * @param treasuryUtxo - The treasury UTxO (consumed in tx, used as nonce)
 * @returns SignedPayload_ProtocolRedeemer CBOR hex string
 */
export const getSignedPayloadForWithdraw = (
  amount: bigint,
  treasuryUtxo: Core.TransactionUnspentOutput,
): string => {
  if (amount <= 0n) {
    throw new Error("Withdraw amount must be positive");
  }

  // Reuse existing nonce builder
  const nonce = buildNonceFromUtxo(treasuryUtxo.input());

  const action: V0_3Types.ProtocolRedeemer = {
    Withdraw: { withdraw_amount: amount },
  };

  const signedPayload: V0_3Types.SignedPayload_ProtocolRedeemer = {
    action,
    nonce,
  };
  return Data.serialize(V0_3Types.SignedPayload_ProtocolRedeemer, signedPayload)
    .toCbor()
    .toString();
};

/**
 * Build the SignedPayload_ProtocolRedeemer for a deposit operation.
 * Uses the treasury UTxO as the nonce source.
 *
 * @param amount - The amount of reserve tokens to deposit
 * @param treasuryUtxo - The treasury UTxO (consumed in tx, used as nonce)
 * @returns SignedPayload_ProtocolRedeemer CBOR hex string
 */
export const getSignedPayloadForDeposit = (
  amount: bigint,
  treasuryUtxo: Core.TransactionUnspentOutput,
): string => {
  if (amount <= 0n) {
    throw new Error("Deposit amount must be positive");
  }

  const nonce = buildNonceFromUtxo(treasuryUtxo.input());

  const action: V0_3Types.ProtocolRedeemer = {
    Deposit: { deposit_amount: amount },
  };

  const signedPayload: V0_3Types.SignedPayload_ProtocolRedeemer = {
    action,
    nonce,
  };
  return Data.serialize(V0_3Types.SignedPayload_ProtocolRedeemer, signedPayload)
    .toCbor()
    .toString();
};

// ─────────────────────────────────────────────────────────────────────────────
// Address Conversion Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Convert a Cardano address to a Destination type for order transactions.
 * Extracts payment and stake credentials from the address.
 *
 * @param address - The Cardano address to convert
 * @param datum - Optional datum for the destination (defaults to "NoDatum")
 * @returns A Destination object suitable for order transactions
 */
export function addressToDestination(
  address: Core.Address,
  datum: Destination["datum"] = "NoDatum",
): Destination {
  const props = address.getProps();
  const paymentPart = props.paymentPart;

  if (!paymentPart) {
    throw new Error("Address must have a payment part");
  }

  const paymentCredential =
    paymentPart.type === Core.CredentialType.KeyHash
      ? { VerificationKey: [paymentPart.hash] as [string] }
      : { Script: [paymentPart.hash] as [string] };

  let stakeCredential: Destination["address"]["stake_credential"] = undefined;
  if (props.delegationPart) {
    const stakeCred =
      props.delegationPart.type === Core.CredentialType.KeyHash
        ? { VerificationKey: [props.delegationPart.hash] as [string] }
        : { Script: [props.delegationPart.hash] as [string] };
    stakeCredential = { Inline: [stakeCred] };
  }

  return {
    address: {
      payment_credential: paymentCredential,
      stake_credential: stakeCredential,
    },
    datum,
  };
}

/**
 * Convert a Destination-like value into a Cardano address.
 * Supports enterprise and base addresses. Pointer credentials are ignored.
 */
export function destinationToAddress(
  network: Core.NetworkId,
  destination: TDestinationLike,
): Core.Address {
  const paymentCred = destination.address.payment_credential;
  const stakingCred = destination.address.stake_credential;
  let paymentCredCore: Core.Credential;
  let stakingCredCore: Core.Credential | undefined;

  if (
    stakingCred &&
    typeof stakingCred === "object" &&
    "Inline" in stakingCred
  ) {
    const inlineCredential = (
      stakingCred as { Inline: [TDestinationCredentialLike] }
    ).Inline[0];
    if ("VerificationKey" in inlineCredential) {
      stakingCredCore = Core.Credential.fromCore({
        type: Core.CredentialType.KeyHash,
        hash: inlineCredential.VerificationKey[0],
      });
    } else if ("Script" in inlineCredential) {
      stakingCredCore = Core.Credential.fromCore({
        type: Core.CredentialType.ScriptHash,
        hash: inlineCredential.Script[0],
      });
    }
  }

  if ("VerificationKey" in paymentCred) {
    paymentCredCore = Core.Credential.fromCore({
      type: Core.CredentialType.KeyHash,
      hash: paymentCred.VerificationKey[0],
    });
  } else {
    paymentCredCore = Core.Credential.fromCore({
      type: Core.CredentialType.ScriptHash,
      hash: paymentCred.Script[0],
    });
  }

  return addressFromCredentials(network, paymentCredCore, stakingCredCore);
}

/**
 * Add an output for a Destination, including script-payment addresses and
 * any datum metadata attached to the destination.
 *
 * Attaches the datum directly to a fresh TransactionOutput rather than
 * routing through Core.TransactionOutput.fromCore, because generated
 * TPlutusData values from @blaze-cardano/data are already Blaze
 * PlutusData instances and PlutusData.fromCore does not know how to
 * decode them (throws NotImplementedError).
 */
export function addDestinationOutput(
  tx: TxBuilder,
  network: Core.NetworkId,
  destination: TDestinationLike,
  value: Core.Value,
): void {
  const output = new Core.TransactionOutput(
    destinationToAddress(network, destination),
    value,
  );
  const { datum } = destination;
  if (datum !== "NoDatum") {
    if ("DatumHash" in datum) {
      output.setDatum(Core.Datum.newDataHash(datum.DatumHash[0]));
    } else {
      output.setDatum(
        Core.Datum.newInlineData(datum.InlineDatum[0] as Core.PlutusData),
      );
    }
  }
  tx.addOutput(output);
}

// ─────────────────────────────────────────────────────────────────────────────
// Cross-Version Cancel Helpers
// ─────────────────────────────────────────────────────────────────────────────

const NORMALIZED_PROTOCOL_VERSION_MAP: Record<string, TProtocolVersion> = {
  v0: "V0",
  v0_1: "V0_1",
  v0_2: "V0_2",
  v0_3: "V0_3",
  v0_4: "V0_4",
  v1_0: "V1_0",
  v1_0_rc1: "V1_0_Rc1",
  v1_1_rc1: "V1_1_Rc1",
};

/**
 * Normalize externally-sourced protocol/order version strings into the SDK's
 * canonical `TProtocolVersion` values.
 */
export const normalizeProtocolVersion = (
  version: string | null | undefined,
): TProtocolVersion | undefined => {
  if (!version) {
    return undefined;
  }

  return NORMALIZED_PROTOCOL_VERSION_MAP[version.trim().toLowerCase()];
};

/**
 * Alias for frontend order-version sources (GraphQL/backend strings).
 */
export const normalizeOrderVersion = normalizeProtocolVersion;

/**
 * Extract the inline datum from a UTxO.
 */
export const getInlineDatumFromUtxo = (
  utxo: Core.TransactionUnspentOutput,
  label = "Order UTXO",
): Core.PlutusData => {
  const datum = utxo.output().datum()?.asInlineData();
  if (!datum) {
    throw new Error(`${label} has no inline datum`);
  }
  return datum;
};

/**
 * Extract the payment script hash from an order UTxO's output address.
 */
export const getScriptHashFromOrderUtxo = (
  utxo: Core.TransactionUnspentOutput,
): Core.Hash28ByteBase16 => {
  const paymentPart = utxo.output().address().getProps().paymentPart;

  if (!paymentPart) {
    throw new Error("Order UTXO address has no payment credential");
  }

  if (paymentPart.type !== Core.CredentialType.ScriptHash) {
    throw new Error("Order UTXO payment credential is not a script hash");
  }

  return paymentPart.hash;
};

/**
 * Resolve one reference input per unique script hash.
 */
export async function resolveReferenceInputsByScriptHash<
  P extends Provider,
  W extends Wallet,
>(
  blaze: Blaze<P, W>,
  scriptHashes: Iterable<Core.Hash28ByteBase16>,
  cachedInputs?:
    | ReadonlyMap<Core.Hash28ByteBase16, Core.TransactionUnspentOutput>
    | Partial<Record<string, Core.TransactionUnspentOutput>>,
  address?: Core.Address,
): Promise<Map<Core.Hash28ByteBase16, Core.TransactionUnspentOutput>> {
  const referenceInputs = new Map<
    Core.Hash28ByteBase16,
    Core.TransactionUnspentOutput
  >();

  for (const hash of new Set(scriptHashes)) {
    const cachedInput =
      cachedInputs instanceof Map
        ? cachedInputs.get(hash)
        : (
            cachedInputs as
              | Partial<Record<string, Core.TransactionUnspentOutput>>
              | undefined
          )?.[hash as string];

    if (cachedInput) {
      referenceInputs.set(hash, cachedInput);
      continue;
    }

    const refInput =
      (address && (await resolveScriptRefAtAddress(blaze, hash, address))) ||
      (await blaze.provider.resolveScriptRef(hash));

    if (!refInput) {
      throw new Error(
        `Missing order reference script input for hash ${hash}. Make sure the order script is deployed.`,
      );
    }

    referenceInputs.set(hash, refInput);
  }

  return referenceInputs;
}

/**
 * Resolve the order reference inputs needed to spend a batch of order UTxOs.
 */
export async function resolveOrderReferenceInputs<
  P extends Provider,
  W extends Wallet,
>(
  blaze: Blaze<P, W>,
  orderUtxos: Iterable<Core.TransactionUnspentOutput>,
  cachedInputs?:
    | ReadonlyMap<Core.Hash28ByteBase16, Core.TransactionUnspentOutput>
    | Partial<Record<string, Core.TransactionUnspentOutput>>,
  address?: Core.Address,
): Promise<Map<Core.Hash28ByteBase16, Core.TransactionUnspentOutput>> {
  const scriptHashes: Core.Hash28ByteBase16[] = [];

  for (const utxo of orderUtxos) {
    scriptHashes.push(getScriptHashFromOrderUtxo(utxo));
  }

  return resolveReferenceInputsByScriptHash(
    blaze,
    scriptHashes,
    cachedInputs,
    address,
  );
}

/**
 * Strict owner-only parser for order datums used by cross-version cancel.
 *
 * All currently-supported order datum variants encode as:
 * Constr(0, [owner, destination, action, data]).
 */
export const parseOrderOwnerGenericFromDatum = (
  datum: Core.PlutusData,
): TMultisigScript => {
  const constr = datum.asConstrPlutusData();
  if (!constr) {
    throw new Error("Order datum is not a constructor PlutusData");
  }

  if (constr.getAlternative() !== 0n) {
    throw new Error(
      `Order datum has unexpected constructor index ${constr.getAlternative().toString()} (expected 0)`,
    );
  }

  const fields = constr.getData();
  if (fields.getLength() < 4) {
    throw new Error(
      `Order datum has ${fields.getLength().toString()} fields (expected at least 4)`,
    );
  }

  return parse(V0_3Types.MultisigScript, fields.get(0)) as TMultisigScript;
};

/**
 * Strict owner-only parser for cancel flows.
 */
export const parseOrderOwnerGeneric = (
  utxo: Core.TransactionUnspentOutput,
): TMultisigScript => {
  return parseOrderOwnerGenericFromDatum(getInlineDatumFromUtxo(utxo));
};
