/**
 * Defines BitGo mappings between bip32 derivation path and script type.
 *
 * The scripts for a BitGo wallet address are defined by their derivation path.
 *
 * The derivation path has the format `0/0/${chain}/${index}` (in rare cases the prefix is not 0/0)
 *
 * The address script type (ScriptType2Of3) is defined by the `chain` parameter.
 *
 * This file defines the mapping between chain parameter and address type.
 */
import { ScriptType2Of3 } from '../outputScripts';

/**
 * All valid chain codes
 */
export const chainCodesP2sh = [0, 1] as const;
export const chainCodesP2shP2wsh = [10, 11] as const;
export const chainCodesP2wsh = [20, 21] as const;
export const chainCodesP2tr = [30, 31] as const;
export const chainCodesP2trMusig2 = [40, 41] as const;
export const chainCodes = [
  ...chainCodesP2sh,
  ...chainCodesP2shP2wsh,
  ...chainCodesP2wsh,
  ...chainCodesP2tr,
  ...chainCodesP2trMusig2,
];
export type ChainCode = (typeof chainCodes)[number];
export function isChainCode(n: unknown): n is ChainCode {
  return chainCodes.includes(n as ChainCode);
}

/**
 * A script type maps to two ChainCodes:
 * External addresses are intended for deposits, internal addresses are intended for change outputs.
 */
export type ChainCodePair = Readonly<[external: ChainCode, internal: ChainCode]>;

const map = new Map<ScriptType2Of3, ChainCodePair>(
  [
    ['p2sh', chainCodesP2sh],
    ['p2shP2wsh', chainCodesP2shP2wsh],
    ['p2wsh', chainCodesP2wsh],
    ['p2tr', chainCodesP2tr],
    ['p2trMusig2', chainCodesP2trMusig2],
  ].map(([k, v]) => [k as ScriptType2Of3, Object.freeze(v) as ChainCodePair])
);

const pairs = [...map.values()];

/**
 * @return ChainCodePair for input
 */
export function toChainPair(v: ChainCodePair | ChainCode | ScriptType2Of3): ChainCodePair {
  let pair;
  if (Array.isArray(v)) {
    if (pairs.includes(v as ChainCodePair)) {
      pair = v;
    }
  }
  if (typeof v === 'string') {
    pair = map.get(v);
  }
  if (typeof v === 'number') {
    pair = pairs.find((p) => p.includes(v));
  }
  if (!pair) {
    throw new Error(`no pair for input ${v}`);
  }
  return pair as ChainCodePair;
}

/**
 * @return ScriptType2Of3 for input
 */
export function scriptTypeForChain(chain: ChainCode): ScriptType2Of3 {
  for (const [scriptType, pair] of map.entries()) {
    if (pair.includes(chain)) {
      return scriptType;
    }
  }
  throw new Error(`invalid chain ${chain}`);
}

/**
 * @return chain code intended for external addresses
 */
export function getExternalChainCode(v: ChainCodePair | ScriptType2Of3 | ChainCode): ChainCode {
  return toChainPair(v)[0];
}

/**
 * @return chain code intended for change outputs
 */
export function getInternalChainCode(v: ChainCodePair | ScriptType2Of3 | ChainCode): ChainCode {
  return toChainPair(v)[1];
}

/**
 * @return true iff chain code is external
 */
export function isExternalChainCode(v: ChainCode): boolean {
  return toChainPair(v).indexOf(v) === 0;
}

/**
 * @return true iff chain code is internal
 */
export function isInternalChainCode(v: ChainCode): boolean {
  return toChainPair(v).indexOf(v) === 1;
}

/**
 * @return true iff chain code is a segwit address
 */
export function isSegwit(v: ChainCode): boolean {
  const segwitCodes: ChainCode[] = [
    ...chainCodesP2shP2wsh,
    ...chainCodesP2wsh,
    ...chainCodesP2tr,
    ...chainCodesP2trMusig2,
  ];
  return segwitCodes.includes(v);
}
