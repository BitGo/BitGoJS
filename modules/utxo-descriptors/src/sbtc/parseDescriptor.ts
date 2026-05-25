import { BIP32, Descriptor, ast } from '@bitgo/wasm-utxo';
import { PatternMatcher, Pattern } from '@bitgo/utxo-core/descriptor';

import { MAX_FEE_BYTE_LENGTH, STACKS_RECIPIENT_BYTE_LENGTH, UNSPENDABLE_INTERNAL_KEY } from './constants';

/**
 * Parsed components of an sBTC peg-in deposit descriptor.
 *
 * The parser returns both the high-level
 * fields callers usually need (keys, lockTime, fee, recipient) and the raw
 * miniscript AST nodes so the leaves can be re-compiled into a
 * `Miniscript` via `ast.formatNode` + `Miniscript.fromString`.
 */
export type ParsedSbtcDepositDescriptor = {
  /** 32-byte x-only signers aggregate key from the deposit leaf. */
  signersAggregateKey: Buffer;
  /** Max signer fee parsed from the first 8 bytes of the payload_drop value. */
  maxFee: bigint;
  /** 22-byte Stacks recipient parsed from the trailing bytes of the payload. */
  stacksRecipient: Buffer;
  /** Reclaim-leaf relative timelock (number of Bitcoin blocks, OP_CSV argument). */
  lockTime: number;
  /**
   * The three concrete x-only reclaim keys from the reclaim-leaf `multi_a`,
   * in the order they appear inside the leaf (descriptor library sorts by hex).
   * Only present when the descriptor is in its derived/definite form — for
   * derivable descriptors the multi_a entries are xpub strings (e.g.
   * `xpub.../*`), which can't be turned into 32-byte buffers without picking
   * a derivation index. Callers that need raw key bytes MUST pass the
   * derived descriptor (see `deriveReclaimKeys` for derivable inputs).
   */
  reclaimKeys: [Buffer, Buffer, Buffer] | undefined;
  /** Raw miniscript AST for the deposit leaf (first tap-tree leaf). */
  depositMiniscriptNode: ast.MiniscriptNode;
  /** Raw miniscript AST for the reclaim leaf (second tap-tree leaf). */
  reclaimMiniscriptNode: ast.MiniscriptNode;
};

function asString(v: unknown, field: string): string {
  if (typeof v !== 'string') {
    throw new Error(`${field} must be a string`);
  }
  return v;
}

function asNumber(v: unknown, field: string): number {
  if (typeof v !== 'number') {
    throw new Error(`${field} must be a number`);
  }
  return v;
}

/**
 * Pull `[threshold, ...keys]` out of a `multi_a` AST node value, validating
 * each element. The descriptor's `multi_a` is rendered with keys either as
 * concrete hex (definite descriptor) or as xpub strings ending in `/*`
 * (derivable descriptor) — both are strings here, so we don't try to convert
 * to Buffer at this level.
 */
function parseMulti(multi: unknown): [number, string[]] {
  if (!Array.isArray(multi) || multi.length < 1) {
    throw new Error('Invalid multi_a structure: not an array or empty');
  }
  const [threshold, ...keys] = multi;
  if (typeof threshold !== 'number') {
    throw new Error('Invalid multi_a structure: threshold is not a number');
  }
  if (!keys.every((k) => typeof k === 'string')) {
    throw new Error('Invalid multi_a structure: not all keys are strings');
  }
  return [threshold, keys];
}

function parseDepositLeaf(
  depositNode: ast.MiniscriptNode,
  matcher: PatternMatcher
): { signersAggregateKey: Buffer; maxFee: bigint; stacksRecipient: Buffer } {
  const depositPattern: Pattern = {
    and_v: [{ payload_drop: { $var: 'payloadHex' } }, { pk: { $var: 'signersKey' } }],
  };
  const match = matcher.match(depositNode, depositPattern);
  if (!match) {
    throw new Error('Deposit leaf does not match expected pattern');
  }

  const payloadHex = asString(match.payloadHex, 'payload_drop value');
  const signersKeyHex = asString(match.signersKey, 'pk_k key');

  const expectedPayloadLength = MAX_FEE_BYTE_LENGTH + STACKS_RECIPIENT_BYTE_LENGTH;
  const payload = Buffer.from(payloadHex, 'hex');
  if (payload.length !== expectedPayloadLength) {
    throw new Error(
      `payload_drop value must be ${expectedPayloadLength} bytes (${expectedPayloadLength * 2} hex chars), got ${
        payload.length
      } bytes`
    );
  }

  const maxFee = payload.readBigUInt64BE(0);
  const stacksRecipient = payload.subarray(MAX_FEE_BYTE_LENGTH);

  const signersAggregateKey = Buffer.from(signersKeyHex, 'hex');
  if (signersAggregateKey.length !== 32) {
    throw new Error(`signersAggregateKey must be 32 bytes x-only, got ${signersAggregateKey.length}`);
  }

  return { signersAggregateKey, maxFee, stacksRecipient };
}

function parseReclaimLeaf(
  reclaimNode: ast.MiniscriptNode,
  matcher: PatternMatcher
): { lockTime: number; reclaimKeyStrings: string[] } {
  // and_v(r:older(<lockTime>), multi_a(2, k1, k2, k3))
  const reclaimPattern: Pattern = {
    and_v: [{ 'r:older': { $var: 'lockTime' } }, { multi_a: { $var: 'reclaimMulti' } }],
  };
  const match = matcher.match(reclaimNode, reclaimPattern);
  if (!match) {
    throw new Error('Reclaim leaf does not match expected pattern');
  }

  const lockTime = asNumber(match.lockTime, 'r:older argument');
  if (lockTime <= 0) {
    throw new Error(`reclaim lockTime must be > 0, got ${lockTime}`);
  }

  const [threshold, reclaimKeyStrings] = parseMulti(match.reclaimMulti);
  if (threshold !== 2) {
    throw new Error(`reclaim multi_a threshold must be 2, got ${threshold}`);
  }
  if (reclaimKeyStrings.length !== 3) {
    throw new Error(`reclaim multi_a must have exactly 3 keys, got ${reclaimKeyStrings.length}`);
  }

  return { lockTime, reclaimKeyStrings };
}

const HEX_X_ONLY_KEY = /^[0-9a-fA-F]{64}$/;
const XPUB_WITH_INDEX = /^([1-9A-HJ-NP-Za-km-z]+)\/(\d+)$/;

/**
 * Resolve a single `multi_a` key entry to a 32-byte x-only public key.
 *
 * Accepts:
 *   - 64-hex-char string → returned as-is (already x-only)
 *   - `xpub.../<index>` → BIP32-derive at that index and drop the prefix byte
 *
 * Returns null for any other shape (e.g. wildcard `xpub.../*`, malformed input).
 */
function resolveReclaimKey(s: string): Buffer | null {
  if (HEX_X_ONLY_KEY.test(s)) {
    return Buffer.from(s, 'hex');
  }
  const m = s.match(XPUB_WITH_INDEX);
  if (!m) {
    return null;
  }
  const [, xpub, indexStr] = m;
  const index = Number.parseInt(indexStr, 10);
  if (!Number.isFinite(index) || index < 0) {
    return null;
  }
  let node;
  try {
    node = BIP32.fromBase58(xpub);
  } catch {
    return null;
  }
  // BIP32 public key is 33 bytes (1 prefix + 32 x-only). Drop the prefix.
  return Buffer.from(node.derive(index).publicKey.subarray(1));
}

/**
 * Convert reclaim-leaf key strings into 32-byte x-only buffers. Accepts both
 * the definite/derived form (concrete 64-hex-char x-only keys) and the form
 * produced by `Descriptor.atDerivationIndex(n)` (`xpub.../<n>`). Returns
 * undefined if any entry is still wildcard (`xpub.../*`) or otherwise
 * unresolvable.
 */
function reclaimKeysFromStrings(keyStrings: string[]): [Buffer, Buffer, Buffer] | undefined {
  const resolved = keyStrings.map(resolveReclaimKey);
  if (resolved.some((b) => b === null) || resolved.length !== 3) {
    return undefined;
  }
  return [resolved[0] as Buffer, resolved[1] as Buffer, resolved[2] as Buffer];
}

/**
 * Parse an sBTC peg-in deposit descriptor and return its components.
 *
 * Returns `null` if the descriptor does not match the expected
 * `tr(<UNSPENDABLE>, {<depositLeaf>, <reclaimLeaf>})` shape — same convention
 * as babylon's `parseStakingDescriptor`. Throws if the shape matches but a
 * sub-field is malformed (e.g. signers key isn't 32 bytes, payload isn't 30
 * bytes, threshold isn't 2).
 *
 * Accepts both the `Descriptor` WASM object (definite or derivable) and a
 * pre-extracted `ast.DescriptorNode`
 */
export function parseSbtcDepositDescriptor(
  descriptor: Descriptor | ast.DescriptorNode
): ParsedSbtcDepositDescriptor | null {
  const pattern: Pattern = {
    tr: [UNSPENDABLE_INTERNAL_KEY, [{ $var: 'depositLeaf' }, { $var: 'reclaimLeaf' }]],
  };

  const matcher = new PatternMatcher();
  const descriptorNode = descriptor instanceof Descriptor ? ast.fromDescriptor(descriptor) : descriptor;
  const result = matcher.match(descriptorNode, pattern);

  if (!result) {
    return null;
  }

  const depositMiniscriptNode = result.depositLeaf as ast.MiniscriptNode;
  let reclaimMiniscriptNode = result.reclaimLeaf as ast.MiniscriptNode;

  const { signersAggregateKey, maxFee, stacksRecipient } = parseDepositLeaf(depositMiniscriptNode, matcher);
  const { lockTime, reclaimKeyStrings } = parseReclaimLeaf(reclaimMiniscriptNode, matcher);

  const reclaimKeys = reclaimKeysFromStrings(reclaimKeyStrings);
  if (reclaimKeys) {
    // Rewrite the reclaim leaf with concrete hex keys when we can resolve
    // them — `Miniscript.fromString(..., 'tap')` only accepts x-only hex in
    // `multi_a`, not xpub-form strings. With this rewrite the formatted
    // leaf is directly compilable; without it callers must do the
    // resolution themselves.
    reclaimMiniscriptNode = {
      and_v: [{ 'r:older': lockTime }, { multi_a: [2, ...reclaimKeys.map((k) => k.toString('hex'))] }],
    };
  }

  return {
    signersAggregateKey,
    maxFee,
    stacksRecipient,
    lockTime,
    reclaimKeys,
    depositMiniscriptNode,
    reclaimMiniscriptNode,
  };
}
