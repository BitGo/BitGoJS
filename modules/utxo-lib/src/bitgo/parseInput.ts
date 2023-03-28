import * as opcodes from 'bitcoin-ops';
import { TxInput, script as bscript } from 'bitcoinjs-lib';

import {
  ScriptTypeP2msBased,
  ScriptTypeTaprootVirtual,
  ScriptTypeVirtual2Of3,
  ScriptTypeP2shP2pk,
  isScriptTypeTaprootVirtual,
  isScriptTypeP2msBased,
} from './outputScripts';
import { isTriple } from './types';

export function isPlaceholderSignature(v: number | Buffer): boolean {
  if (Buffer.isBuffer(v)) {
    return v.length === 0;
  }
  return v === 0;
}

/**
 * @return true iff P2TR script path's control block matches BitGo's need
 */
export function isValidControlBock(controlBlock: Buffer): boolean {
  // The last stack element is called the control block c, and must have length 33 + 32m
  return Buffer.isBuffer(controlBlock) && 33 <= controlBlock.length && controlBlock.length % 32 === 1;
}

/**
 * @return script path level for P2TR control block
 */
export function calculateScriptPathLevel(controlBlock: Buffer): number {
  if (!Buffer.isBuffer(controlBlock)) {
    throw new Error('Invalid control block type.');
  }
  if (controlBlock.length === 65) {
    return 1;
  }
  if (controlBlock.length === 97) {
    return 2;
  }
  throw new Error('unexpected control block length.');
}

/**
 * @return leaf version for P2TR control block.
 */
export function getLeafVersion(controlBlock: Buffer): number {
  if (Buffer.isBuffer(controlBlock) && controlBlock.length > 0) {
    return controlBlock[0] & 0xfe;
  }
  throw new Error('unexpected leafVersion.');
}

interface ParsedScript {
  scriptType: ScriptTypeP2shP2pk | ScriptTypeP2msBased | ScriptTypeTaprootVirtual;
}

export type ParsedSignatureScript = ParsedScript;

export interface ParsedSignatureScriptP2shP2pk extends ParsedSignatureScript {
  scriptType: 'p2shP2pk';
  publicKeys: [Buffer];
  signatures: [Buffer];
}

export interface ParsedSignatureScriptP2msBased extends ParsedSignatureScript {
  scriptType: 'p2sh' | 'p2shP2wsh' | 'p2wsh';
  publicKeys: [Buffer, Buffer, Buffer];
  signatures:
    | [Buffer, Buffer] // fully-signed transactions with signatures
    /* Partially signed transactions with placeholder signatures.
       For p2sh, the placeholder is OP_0 (number 0) */
    | [Buffer | 0, Buffer | 0, Buffer | 0];
  pubScript: Buffer;
  redeemScript: Buffer | undefined;
  witnessScript: Buffer | undefined;
}

/**
 * To hold parsed data from taproot key path witness (only a 64/65 bytes signature).
 * Virtual script type p2trMusig2Kp is used to hint unambiguous key path spending type for p2trMusig2.
 */
export interface ParsedSignatureScriptTaprootKeyPath extends ParsedSignatureScript {
  scriptType: 'p2trMusig2Kp';
  signatures: [Buffer];
}

/**
 * Taproot script path spends are more similar to regular p2ms spends and have two public keys and
 * two signatures.
 * To hold parsed data from taproot script path spend witness for both p2tr or p2trMusig2 script path.
 * Virtual script type p2trOrP2trMusig2Sp is used as it is not possible to find actual type from leaf script.
 */
export interface ParsedSignatureScriptTaprootScriptPath extends ParsedSignatureScript {
  scriptType: 'p2trOrP2trMusig2Sp';
  publicKeys: [Buffer, Buffer];
  signatures: [Buffer, Buffer];
  controlBlock: Buffer;
  leafVersion: number;
  /** Indicates the level inside the taptree. */
  scriptPathLevel: number;
  pubScript: Buffer;
}

export type ParsedSignatureScriptTaproot = ParsedSignatureScriptTaprootKeyPath | ParsedSignatureScriptTaprootScriptPath;

interface ParsedPubScript {
  scriptType: ScriptTypeVirtual2Of3;
}

/**
 * To hold parsed data from p2ms pub script - p2sh, p2wsh and p2shP2wsh.
 * Virtual script type p2ms is used as it is not possible to find actual type from pub script.
 */
export interface ParsedPubScriptP2ms extends ParsedPubScript {
  scriptType: 'p2ms';
  publicKeys: [Buffer, Buffer, Buffer];
  pubScript: Buffer;
}

/**
 * To hold parsed data from taproot pub script (34-byte scriptPubkey).
 * Virtual script type p2trMusig2Kp is used to hint unambiguous key path spending type for p2trMusig2.
 */
export interface ParsedPubScriptTaprootKeyPath extends ParsedPubScript {
  scriptType: 'p2trMusig2Kp';
  // tapOutputKey
  publicKeys: [Buffer];
  pubScript: Buffer;
}

/**
 * To hold parsed data from taproot leaf script of both p2tr or p2trMusig2 script path.
 * Virtual script type p2trOrP2trMusig2Sp is used as it is not possible to find actual type from leaf script.
 */
export interface ParsedPubScriptTaprootScriptPath extends ParsedPubScript {
  scriptType: 'p2trOrP2trMusig2Sp';
  publicKeys: [Buffer, Buffer];
  pubScript: Buffer;
}

export type ParsedPubScriptTaproot = ParsedPubScriptTaprootKeyPath | ParsedPubScriptTaprootScriptPath;

type DecompiledScript = Array<Buffer | number>;

/**
 * Static script elements
 */
type ScriptPatternConstant =
  | 'OP_0'
  | 'OP_1'
  | 'OP_2'
  | 'OP_3'
  | 'OP_CHECKMULTISIG'
  | 'OP_CHECKSIG'
  | 'OP_CHECKSIGVERIFY';

/**
 * Script elements that can be captured
 */
type ScriptPatternCapture =
  | ':pubkey'
  | ':pubkey-xonly'
  | ':signature'
  | ':control-block'
  | { ':script': ScriptPatternElement[] };

type ScriptPatternElement = ScriptPatternConstant | ScriptPatternCapture;

/**
 * Result for a successful script match
 */
type MatchResult = {
  ':pubkey': Buffer[];
  ':pubkey-xonly': Buffer[];
  ':control-block': Buffer[];
  ':signature': (Buffer | 0)[];
  ':script': { buffer: Buffer; match: MatchResult }[];
};

function emptyMatchResult(): MatchResult {
  return {
    ':pubkey': [],
    ':pubkey-xonly': [],
    ':control-block': [],
    ':signature': [],
    ':script': [],
  };
}

class MatchError extends Error {
  // this property is required to prohibit `return new Error()` when the return type demands `MatchError`
  __type = 'MatchError';
  constructor(message: string) {
    super(message);
  }

  static forPatternElement(p: ScriptPatternElement): MatchError {
    if (typeof p === 'object' && ':script' in p) {
      return new MatchError(`error matching nested script`);
    }
    return new MatchError(`error matching ${p}`);
  }
}

/**
 * @param script
 * @param pattern
 * @return MatchResult if script matches pattern. The result will contain the matched values.
 */
function matchScript(script: DecompiledScript, pattern: ScriptPatternElement[]): MatchResult | MatchError {
  /**
   * Match a single script element with a ScriptPatternElement
   */
  function matchElement(e: Buffer | number, p: ScriptPatternElement): MatchResult | boolean {
    switch (p) {
      case 'OP_0':
        return e === opcodes.OP_0 || (Buffer.isBuffer(e) && e.length === 0);
      case 'OP_1':
      case 'OP_2':
      case 'OP_3':
      case 'OP_CHECKMULTISIG':
      case 'OP_CHECKSIG':
      case 'OP_CHECKSIGVERIFY':
        return e === opcodes[p];
      case ':pubkey':
        return Buffer.isBuffer(e) && e.length === 33;
      case ':pubkey-xonly':
        return Buffer.isBuffer(e) && e.length === 32;
      case ':signature':
        return Buffer.isBuffer(e) || isPlaceholderSignature(e);
      case ':control-block':
        return Buffer.isBuffer(e) && isValidControlBock(e);
      default:
        throw new Error(`unknown pattern element ${p}`);
    }
  }

  if (script.length !== pattern.length) {
    return new MatchError(`length mismatch`);
  }

  // Go over each pattern element.
  // Collect captures into a result object.
  return pattern.reduce((obj: MatchResult | MatchError, p, i): MatchResult | MatchError => {
    // if we had a previous mismatch, short-circuit
    if (obj instanceof MatchError) {
      return obj;
    }

    const e = script[i];

    // for ':script' pattern elements, decompile script element and recurse
    if (typeof p === 'object' && ':script' in p) {
      if (!Buffer.isBuffer(e)) {
        return new MatchError(`expected buffer for :script`);
      }
      const dec = bscript.decompile(e);
      if (!dec) {
        return new MatchError(`error decompiling nested script`);
      }
      const match = matchScript(dec, p[':script']);
      if (match instanceof MatchError) {
        return match;
      }
      obj[':script'].push({
        buffer: e,
        match,
      });
      return obj;
    }

    const match = matchElement(e, p);
    if (!match) {
      return MatchError.forPatternElement(p);
    }

    // if pattern element is a capture, add it to the result obj
    if (p === ':signature' && e === 0) {
      obj[p].push(e);
    } else if (p in obj) {
      if (!Buffer.isBuffer(e)) {
        throw new Error(`invalid capture value`);
      }
      obj[p].push(e);
    }

    return obj;
  }, emptyMatchResult());
}

/**
 * @param script
 * @param patterns
 * @return first match
 */
function matchScriptSome(script: DecompiledScript, patterns: ScriptPatternElement[][]): MatchResult | MatchError {
  for (const p of patterns) {
    const m = matchScript(script, p);
    if (m instanceof MatchError) {
      continue;
    }
    return m;
  }
  return new MatchError(`no match for script`);
}

type InputScripts<TScript, TWitness> = {
  script: TScript;
  witness: TWitness;
};

type InputScriptsLegacy = InputScripts<DecompiledScript, null>;
type InputScriptsWrappedSegwit = InputScripts<DecompiledScript, Buffer[]>;
type InputScriptsNativeSegwit = InputScripts<null, Buffer[]>;

type InputScriptsUnknown = InputScripts<DecompiledScript | null, Buffer[] | null>;

type InputParser<
  T extends ParsedSignatureScriptP2shP2pk | ParsedSignatureScriptP2msBased | ParsedSignatureScriptTaproot
> = (p: InputScriptsUnknown) => T | MatchError;

export type InputPubScript = Buffer;

type PubScriptParser<T extends ParsedPubScriptP2ms | ParsedPubScriptTaproot> = (p: InputPubScript) => T | MatchError;

function isLegacy(p: InputScriptsUnknown): p is InputScriptsLegacy {
  return Boolean(p.script && !p.witness);
}

function isWrappedSegwit(p: InputScriptsUnknown): p is InputScriptsWrappedSegwit {
  return Boolean(p.script && p.witness);
}

function isNativeSegwit(p: InputScriptsUnknown): p is InputScriptsNativeSegwit {
  return Boolean(!p.script && p.witness);
}

const parseP2shP2pk: InputParser<ParsedSignatureScriptP2shP2pk> = (p) => {
  if (!isLegacy(p)) {
    return new MatchError(`expected legacy input`);
  }
  const match = matchScript(p.script, [':signature', { ':script': [':pubkey', 'OP_CHECKSIG'] }]);
  if (match instanceof MatchError) {
    return match;
  }
  return {
    scriptType: 'p2shP2pk',
    publicKeys: match[':script'][0].match[':pubkey'] as [Buffer],
    signatures: match[':signature'] as [Buffer],
  };
};

const parseTaprootKeyPath: InputParser<ParsedSignatureScriptTaprootKeyPath> = (p) => {
  if (!isNativeSegwit(p)) {
    return new MatchError(`expected native segwit`);
  }
  const match = matchScript(p.witness, [':signature']);
  if (match instanceof MatchError) {
    return match;
  }
  const signatures = match[':signature'] as [Buffer];
  if (isPlaceholderSignature(signatures[0])) {
    throw new Error(`invalid p2trMusig2 key path signature`);
  }
  return {
    scriptType: 'p2trMusig2Kp',
    signatures,
  };
};

function parseP2ms(
  decScript: DecompiledScript,
  scriptType: 'p2sh' | 'p2shP2wsh' | 'p2wsh'
): ParsedSignatureScriptP2msBased | MatchError {
  const pattern2Of3: ScriptPatternElement[] = ['OP_2', ':pubkey', ':pubkey', ':pubkey', 'OP_3', 'OP_CHECKMULTISIG'];

  const match = matchScriptSome(decScript, [
    /* full-signed, no placeholder signature */
    ['OP_0', ':signature', ':signature', { ':script': pattern2Of3 }],
    /* half-signed, placeholder signatures */
    ['OP_0', ':signature', ':signature', ':signature', { ':script': pattern2Of3 }],
  ]);
  if (match instanceof MatchError) {
    return match;
  }

  const [redeemScript] = match[':script'];

  if (!isTriple(redeemScript.match[':pubkey'])) {
    throw new Error(`invalid pubkey count`);
  }

  return {
    scriptType,
    publicKeys: redeemScript.match[':pubkey'],
    pubScript: redeemScript.buffer,
    signatures: match[':signature'] as ParsedSignatureScriptP2msBased['signatures'],
    redeemScript: scriptType === 'p2sh' ? redeemScript.buffer : undefined,
    witnessScript: scriptType === 'p2shP2wsh' || scriptType === 'p2wsh' ? redeemScript.buffer : undefined,
  };
}

const parseP2sh: InputParser<ParsedSignatureScriptP2msBased> = (p) => {
  if (!isLegacy(p)) {
    return new MatchError(`expected legacy input`);
  }
  return parseP2ms(p.script, 'p2sh');
};

const parseP2shP2wsh: InputParser<ParsedSignatureScriptP2msBased> = (p) => {
  if (!isWrappedSegwit(p)) {
    return new MatchError(`expected wrapped segwit input`);
  }
  return { ...parseP2ms(p.witness, 'p2shP2wsh'), redeemScript: p.script[0] as Buffer };
};

const parseP2wsh: InputParser<ParsedSignatureScriptP2msBased> = (p) => {
  if (!isNativeSegwit(p)) {
    return new MatchError(`expected native segwit`);
  }
  return parseP2ms(p.witness, 'p2wsh');
};

const parseTaprootScriptPath: InputParser<ParsedSignatureScriptTaproot> = (p) => {
  if (!isNativeSegwit(p)) {
    return new MatchError(`expected native segwit`);
  }
  // assumes no annex
  const match = matchScript(p.witness, [
    ':signature',
    ':signature',
    { ':script': [':pubkey-xonly', 'OP_CHECKSIGVERIFY', ':pubkey-xonly', 'OP_CHECKSIG'] },
    ':control-block',
  ]);
  if (match instanceof MatchError) {
    return match;
  }
  const [controlBlock] = match[':control-block'];
  const scriptPathLevel = calculateScriptPathLevel(controlBlock);

  const leafVersion = getLeafVersion(controlBlock);

  return {
    scriptType: 'p2trOrP2trMusig2Sp',
    pubScript: match[':script'][0].buffer,
    publicKeys: match[':script'][0].match[':pubkey-xonly'] as [Buffer, Buffer],
    signatures: match[':signature'] as [Buffer, Buffer],
    controlBlock,
    scriptPathLevel,
    leafVersion,
  };
};

/**
 * Parse a transaction's signature script to obtain public keys, signatures, the sig script,
 * and other properties.
 *
 * Only supports script types used in BitGo transactions.
 *
 * @param input
 * @returns ParsedSignatureScript
 */
export function parseSignatureScript(
  input: TxInput
): ParsedSignatureScriptP2shP2pk | ParsedSignatureScriptP2msBased | ParsedSignatureScriptTaproot {
  const decScript = bscript.decompile(input.script);
  const parsers = [
    parseP2shP2pk,
    parseP2sh,
    parseP2wsh,
    parseP2shP2wsh,
    parseTaprootKeyPath,
    parseTaprootScriptPath,
  ] as const;
  for (const f of parsers) {
    const parsed = f({
      script: decScript?.length === 0 ? null : decScript,
      witness: input.witness.length === 0 ? null : input.witness,
    });
    if (parsed instanceof MatchError) {
      continue;
    }
    return parsed;
  }
  throw new Error(`could not parse input`);
}

export function parseSignatureScript2Of3(
  input: TxInput
): ParsedSignatureScriptP2msBased | ParsedSignatureScriptTaproot {
  const result = parseSignatureScript(input);

  if (!isScriptTypeP2msBased(result.scriptType) && !isScriptTypeTaprootVirtual(result.scriptType)) {
    throw new Error(`invalid script type`);
  }

  if (!result.signatures) {
    throw new Error(`missing signatures`);
  }
  if (
    result.scriptType !== 'p2trMusig2Kp' &&
    result.publicKeys.length !== 3 &&
    (result.publicKeys.length !== 2 || result.scriptType !== 'p2trOrP2trMusig2Sp')
  ) {
    throw new Error(`unexpected pubkey count`);
  }

  return result as ParsedSignatureScriptP2msBased | ParsedSignatureScriptTaproot;
}

const parsePubScriptP2ms: PubScriptParser<ParsedPubScriptP2ms> = (pubScript) => {
  const match = matchScript(
    [pubScript],
    [{ ':script': ['OP_2', ':pubkey', ':pubkey', ':pubkey', 'OP_3', 'OP_CHECKMULTISIG'] }]
  );
  if (match instanceof MatchError) {
    return match;
  }

  const [redeemScript] = match[':script'];

  if (!isTriple(redeemScript.match[':pubkey'])) {
    throw new Error('invalid pubkey count');
  }

  return {
    scriptType: 'p2ms',
    publicKeys: redeemScript.match[':pubkey'],
    pubScript: redeemScript.buffer,
  };
};

const parsePubScriptTaprootKeyPath: PubScriptParser<ParsedPubScriptTaprootKeyPath> = (pubScript) => {
  const match = matchScript([pubScript], [{ ':script': ['OP_1', ':pubkey-xonly'] }]);
  if (match instanceof MatchError) {
    return match;
  }

  const [script] = match[':script'];

  return {
    scriptType: 'p2trMusig2Kp',
    publicKeys: script.match[':pubkey-xonly'] as [Buffer],
    pubScript: pubScript,
  };
};

const parsePubScriptTaprootScriptPath: PubScriptParser<ParsedPubScriptTaprootScriptPath> = (pubScript) => {
  const match = matchScript(
    [pubScript],
    [{ ':script': [':pubkey-xonly', 'OP_CHECKSIGVERIFY', ':pubkey-xonly', 'OP_CHECKSIG'] }]
  );
  if (match instanceof MatchError) {
    return match;
  }

  const [leafScript] = match[':script'];

  return {
    scriptType: 'p2trOrP2trMusig2Sp',
    publicKeys: leafScript.match[':pubkey-xonly'] as [Buffer, Buffer],
    pubScript: leafScript.buffer,
  };
};

function parsePubScript(inputPubScript: InputPubScript): ParsedPubScriptP2ms | ParsedPubScriptTaproot {
  const parsers = [parsePubScriptP2ms, parsePubScriptTaprootScriptPath, parsePubScriptTaprootKeyPath] as const;
  for (const f of parsers) {
    const parsed = f(inputPubScript);
    if (parsed instanceof MatchError) {
      continue;
    }
    return parsed;
  }
  throw new Error(`could not parse input`);
}

/**
 * @return pubScript (scriptPubKey/redeemScript/witnessScript) is parsed.
 * P2SH => scriptType (p2ms), pubScript (redeemScript) public keys
 * PW2SH => scriptType (p2ms), pubScript (witnessScript), public keys.
 * P2SH-PW2SH => scriptType (p2ms), pubScript (witnessScript), public keys.
 * P2TR or P2trMusig2 script path => scriptType (p2trOrP2trMusig2Sp), pubScript, pub keys
 * P2trMusig2 key path => scriptType (p2trMusig2Kp), pubScript, pub key (x-only tapOutputKey)
 */
export function parsePubScript2Of3(inputPubScript: InputPubScript): ParsedPubScriptP2ms | ParsedPubScriptTaproot {
  const result = parsePubScript(inputPubScript);
  if (
    result.scriptType !== 'p2trMusig2Kp' &&
    result.publicKeys.length !== 3 &&
    (result.publicKeys.length !== 2 || result.scriptType !== 'p2trOrP2trMusig2Sp')
  ) {
    throw new Error('unexpected pubkey count');
  }
  return result;
}
