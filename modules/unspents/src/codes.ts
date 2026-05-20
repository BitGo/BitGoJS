import * as tcomb from 'tcomb';

export type ChainCode = number;

export class ErrorInvalidCode extends Error {
  constructor(code: ChainCode) {
    super(`invalid code ${code}`);
  }
}

export enum UnspentType {
  p2pkh = 'p2pkh',
  p2sh = 'p2sh',
  p2shP2wsh = 'p2shP2wsh',
  p2wpkh = 'p2wpkh',
  p2wsh = 'p2wsh',
  p2tr = 'p2tr',
}

const UnspentTypeTcomb = tcomb.enums.of(Object.keys(UnspentType));

export enum Purpose {
  internal = 'internal',
  external = 'external',
}

const PurposeTcomb = tcomb.enums.of(Object.keys(Purpose));

interface ICode {
  id: ChainCode;
  type: UnspentType;
  purpose: Purpose;
}

const codeList: ReadonlyArray<Readonly<ICode>> = Object.freeze(
  (
    [
      [0, UnspentType.p2sh, Purpose.external],
      [10, UnspentType.p2shP2wsh, Purpose.external],
      [20, UnspentType.p2wsh, Purpose.external],
      [30, UnspentType.p2tr, Purpose.external],

      [1, UnspentType.p2sh, Purpose.internal],
      [11, UnspentType.p2shP2wsh, Purpose.internal],
      [21, UnspentType.p2wsh, Purpose.internal],
      [31, UnspentType.p2tr, Purpose.internal],
    ] as Array<[ChainCode, UnspentType, Purpose]>
  ).map(([id, type, purpose]) => Object.freeze({ id, type, purpose }))
);

export const ChainType = tcomb.irreducible('ChainType', (n) => isValid(n));

const forType = (u: UnspentType): CodesByPurpose => {
  // Do tcomb type checking in js projects that use this lib
  if (!UnspentTypeTcomb.is(u)) {
    throw new Error(`invalid unspent type: ${u}`);
  }

  return new CodesByPurpose(u);
};

const typeForCode = (c: ChainCode): UnspentType => {
  const code = codeList.find(({ id }) => id === c);
  if (!code) {
    throw new ErrorInvalidCode(c);
  }
  return code.type;
};

export const isValid = (c: ChainCode): boolean => codeList.some(({ id }) => id === c);

const throwIfUndefined = <T>(v: T | undefined): T => {
  if (v === undefined) {
    throw new Error(`expected value to be defined`);
  }
  return v;
};

export class CodeGroup {
  public values: ReadonlyArray<ChainCode>;
  constructor(values: Iterable<ChainCode>) {
    this.values = Object.freeze([...values]);
  }

  public has(code: ChainCode): boolean {
    if (!isValid(code)) {
      throw new ErrorInvalidCode(code);
    }
    return this.values.includes(code);
  }
}

export class CodesByPurpose extends CodeGroup {
  public internal: ChainCode;
  public external: ChainCode;

  constructor(t: UnspentType) {
    const codeMap: Map<Purpose, ChainCode> = new Map(
      codeList.filter(({ type }) => type === t).map(({ purpose, id }): [Purpose, ChainCode] => [purpose, id])
    );
    if (codeMap.size !== 2) {
      throw new Error(`unexpected number of codes for type ${t}`);
    }

    super(codeMap.values());

    this.internal = throwIfUndefined(codeMap.get(Purpose.internal));
    this.external = throwIfUndefined(codeMap.get(Purpose.external));
  }
}

export class CodesByType extends CodeGroup {
  public p2sh: ChainCode;
  public p2shP2wsh: ChainCode;
  public p2wsh: ChainCode;
  public p2tr: ChainCode;

  constructor(p: Purpose) {
    const codeMap: Map<UnspentType, ChainCode> = new Map(
      codeList.filter(({ purpose }) => purpose === p).map(({ type, id }): [UnspentType, ChainCode] => [type, id])
    );
    if (codeMap.size !== 4) {
      throw new Error(`unexpected number of codes`);
    }

    super(codeMap.values());

    this.p2sh = throwIfUndefined(codeMap.get(UnspentType.p2sh));
    this.p2shP2wsh = throwIfUndefined(codeMap.get(UnspentType.p2shP2wsh));
    this.p2wsh = throwIfUndefined(codeMap.get(UnspentType.p2wsh));
    this.p2tr = throwIfUndefined(codeMap.get(UnspentType.p2tr));
  }
}

const boundHas = (instance: CodeGroup) => instance.has.bind(instance);

const p2sh = Object.freeze(new CodesByPurpose(UnspentType.p2sh));
const p2shP2wsh = Object.freeze(new CodesByPurpose(UnspentType.p2shP2wsh));
const p2wsh = Object.freeze(new CodesByPurpose(UnspentType.p2wsh));
const p2tr = Object.freeze(new CodesByPurpose(UnspentType.p2tr));
const external = Object.freeze(new CodesByType(Purpose.external));
const internal = Object.freeze(new CodesByType(Purpose.internal));
const all = Object.freeze(codeList.map(({ id }) => id));

/** @deprecated - use utxolib.bitgo */
export default Object.freeze({
  /* @deprecated: use ChainCodeTcomb */
  ChainType,
  /** @deprecated - use utxolib.bitgo */
  ChainCodeTcomb: ChainType,
  /** @deprecated - use utxolib.bitgo */
  PurposeTcomb,
  /** @deprecated - use utxolib.bitgo */
  UnspentTypeTcomb,
  /** @deprecated - use utxolib.bitgo */
  p2sh,
  /** @deprecated - use utxolib.bitgo */
  p2shP2wsh,
  /** @deprecated - use utxolib.bitgo */
  p2wsh,
  /** @deprecated - use utxolib.bitgo */
  p2tr,
  /** @deprecated - use utxolib.bitgo */
  external,
  /** @deprecated - use utxolib.bitgo */
  internal,
  /** @deprecated - use utxolib.bitgo */
  all,
  /** @deprecated - use utxolib.bitgo */
  isP2sh: boundHas(p2sh),
  /** @deprecated - use utxolib.bitgo */
  isP2shP2wsh: boundHas(p2shP2wsh),
  /** @deprecated - use utxolib.bitgo */
  isP2wsh: boundHas(p2wsh),
  /** @deprecated - use utxolib.bitgo */
  isP2tr: boundHas(p2tr),
  /** @deprecated - use utxolib.bitgo */
  isExternal: boundHas(external),
  /** @deprecated - use utxolib.bitgo */
  isInternal: boundHas(internal),
  /** @deprecated - use utxolib.bitgo */
  isValid,
  /** @deprecated - use utxolib.bitgo */
  forType,
  /** @deprecated - use utxolib.bitgo */
  typeForCode,
});
