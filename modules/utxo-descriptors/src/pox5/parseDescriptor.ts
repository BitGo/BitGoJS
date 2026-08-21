import { BIP32, Descriptor, ast } from '@bitgo/wasm-utxo';
import { Pattern, PatternMatcher } from '@bitgo/utxo-core/descriptor';

export type ParsedPox5LockupDescriptor = {
  unlockHeight: number;
  stakerCommitment: Buffer;
  earlyExitKey: Buffer;
  stakerKeyStrings: [string, string, string];
  stakerKeys: [Buffer, Buffer, Buffer] | undefined;
  miniscriptNode: ast.MiniscriptNode;
};

const COMPRESSED_KEY = /^(02|03)[0-9a-fA-F]{64}$/;
const XPUB_WITH_INDEX = /^([1-9A-HJ-NP-Za-km-z]+)\/(\d+)$/;

function asNumber(value: unknown, field: string): number {
  if (typeof value !== 'number') {
    throw new Error(`${field} must be a number`);
  }
  return value;
}

function asString(value: unknown, field: string): string {
  if (typeof value !== 'string') {
    throw new Error(`${field} must be a string`);
  }
  return value;
}

function parseCompressedKey(value: string, field: string): Buffer {
  if (!COMPRESSED_KEY.test(value)) {
    throw new Error(`${field} must be a compressed public key`);
  }
  return Buffer.from(value, 'hex');
}

function resolveStakerKey(value: string): Buffer | undefined {
  if (COMPRESSED_KEY.test(value)) {
    return Buffer.from(value, 'hex');
  }
  const match = value.match(XPUB_WITH_INDEX);
  if (!match) {
    return undefined;
  }
  const [, xpub, indexString] = match;
  const index = Number.parseInt(indexString, 10);
  try {
    return Buffer.from(BIP32.fromBase58(xpub).derive(index).publicKey);
  } catch {
    return undefined;
  }
}

/**
 * Parse only the canonical PoX-5 descriptor template. Other descriptors return
 * null; malformed fields within the template throw so callers cannot finalize
 * a script under an ambiguous policy.
 */
export function parsePox5LockupDescriptor(
  descriptor: Descriptor | ast.DescriptorNode
): ParsedPox5LockupDescriptor | null {
  const matcher = new PatternMatcher();
  const descriptorNode = descriptor instanceof Descriptor ? ast.fromDescriptor(descriptor) : descriptor;
  const matched = matcher.match(descriptorNode, { wsh: { $var: 'miniscript' } });
  if (!matched) {
    return null;
  }

  const miniscriptNode = matched.miniscript as ast.MiniscriptNode;
  const pattern: Pattern = {
    and_v: [
      {
        'v:or_i': [
          { after: { $var: 'unlockHeight' } },
          { and_v: [{ 'v:sha256': { $var: 'stakerCommitment' } }, { pk: { $var: 'earlyExitKey' } }] },
        ],
      },
      { multi: { $var: 'stakerMulti' } },
    ],
  };
  const fields = matcher.match(miniscriptNode, pattern);
  if (!fields) {
    return null;
  }

  const unlockHeight = asNumber(fields.unlockHeight, 'after argument');
  if (!Number.isSafeInteger(unlockHeight) || unlockHeight <= 0 || unlockHeight >= 500_000_000) {
    throw new Error(`unlockHeight (${unlockHeight}) must be a positive block height below 500000000`);
  }
  const commitmentHex = asString(fields.stakerCommitment, 'sha256 commitment');
  if (!/^[0-9a-fA-F]{64}$/.test(commitmentHex)) {
    throw new Error('stakerCommitment must be 32 bytes');
  }
  const earlyExitKey = parseCompressedKey(asString(fields.earlyExitKey, 'early exit key'), 'earlyExitKey');

  if (!Array.isArray(fields.stakerMulti) || fields.stakerMulti.length !== 4 || fields.stakerMulti[0] !== 2) {
    throw new Error('staker multi must be a 2-of-3 multisig');
  }
  const stakerKeyStrings = fields.stakerMulti.slice(1).map((key, index) => asString(key, `staker key ${index}`));
  const resolvedKeys = stakerKeyStrings.map(resolveStakerKey);

  return {
    unlockHeight,
    stakerCommitment: Buffer.from(commitmentHex, 'hex'),
    earlyExitKey,
    stakerKeyStrings: [stakerKeyStrings[0], stakerKeyStrings[1], stakerKeyStrings[2]],
    stakerKeys: resolvedKeys.every((key): key is Buffer => key !== undefined)
      ? [resolvedKeys[0], resolvedKeys[1], resolvedKeys[2]]
      : undefined,
    miniscriptNode,
  };
}
