import * as utxolib from '@bitgo/utxo-lib';
import { bitgo } from '@bitgo/utxo-lib';
const { isChainCode, scriptTypeForChain } = bitgo;
type ChainCode = bitgo.ChainCode;

import { compactSize } from './scriptSizes';
import { PositiveInteger } from './types';

import { VirtualSizes } from './virtualSizes';
export { VirtualSizes };

/**
 * Apply `f` to all properties of `d`
 */
function mapDimensions(
  d: Partial<Dimensions>,
  f: <T extends keyof Dimensions>(key: T, v: Dimensions[T] | undefined) => unknown
): Dimensions {
  return new Dimensions(
    Object.fromEntries(Object.entries(d).map(([key, value]) => [key, f(key as keyof Dimensions, value)]))
  );
}

/**
 * Aggregate count and size of transaction outputs
 */
export class OutputDimensions {
  /**
   * Number of outputs
   */
  count: number;
  /**
   * Aggregate vSize
   */
  size: number;

  constructor({ count = 0, size = 0 }: OutputDimensions = { count: 0, size: 0 }) {
    if (count === 0 || size === 0) {
      if (count !== 0 || size !== 0) {
        throw new Error(`count and size must both be zero if one is zero`);
      }
    }

    this.count = count;
    this.size = size;

    Object.freeze(this);
  }
}

interface FromInputParams {
  // In cases where the input type is ambiguous, we must provide a hint about spend script type.
  assumeUnsigned?: Dimensions;
}

export interface FromUnspentParams {
  p2tr: {
    scriptPathLevel?: number;
  };
  p2trMusig2: {
    scriptPathLevel?: number;
  };
}

const defaultUnspentParams: FromUnspentParams = {
  p2tr: {
    scriptPathLevel: 1,
  },
  p2trMusig2: {
    // Default to script path spend, to make it easier for recovery case callers (WRW etc).
    // WP can explicitly pass undefined to use key path.
    scriptPathLevel: 1,
  },
};

/**
 * Dimensions of a BitGo wallet transactions.
 */
export class Dimensions {
  /** Input counts for BitGo wallet multi-signature inputs */
  public readonly nP2shInputs: number = 0;
  public readonly nP2shP2wshInputs: number = 0;
  public readonly nP2wshInputs: number = 0;
  public readonly nP2trKeypathInputs: number = 0;
  public readonly nP2trScriptPathLevel1Inputs: number = 0;
  public readonly nP2trScriptPathLevel2Inputs: number = 0;

  /* Input count for single-signature inputs (Replay Protection inputs) */
  public readonly nP2shP2pkInputs: number = 0;

  public readonly outputs: OutputDimensions = new OutputDimensions();

  constructor(d: Partial<Dimensions> = {}) {
    Object.entries(d).forEach(([key, value]) => this.setProperty(key, value));

    Object.freeze(this);
  }

  private setProperty(k: string, v: unknown): void {
    switch (k) {
      case 'nP2shInputs':
      case 'nP2shP2wshInputs':
      case 'nP2wshInputs':
      case 'nP2trKeypathInputs':
      case 'nP2trScriptPathLevel1Inputs':
      case 'nP2trScriptPathLevel2Inputs':
      case 'nP2shP2pkInputs':
        if (typeof v !== 'number') {
          throw new Error(`property ${k} must be number`);
        }
        if (!Number.isSafeInteger(v) || v < 0) {
          throw new Error(`property ${k} must be zero or positive integer`);
        }
        break;
      case 'outputs':
        if (!(v instanceof OutputDimensions)) {
          v = new OutputDimensions(v as OutputDimensions);
        }
        break;
      default:
        throw new Error(`unknown property ${k}`);
    }

    (this as any)[k] = v;
  }

  static readonly ZERO = Object.freeze(new Dimensions());

  /**
   * @deprecated use ZERO
   * @return Dimensions for an empty transaction
   */
  static zero(): Readonly<Dimensions> {
    return this.ZERO;
  }

  /**
   * @param size
   * @return Dimensions for a single output with given size
   */
  static singleOutput(size: number): Dimensions {
    return Dimensions.sum({ outputs: { count: 1, size } });
  }

  static readonly SingleOutput = Object.freeze({
    p2sh: Dimensions.singleOutput(VirtualSizes.txP2shOutputSize),
    p2shP2wsh: Dimensions.singleOutput(VirtualSizes.txP2shP2wshOutputSize),
    p2wsh: Dimensions.singleOutput(VirtualSizes.txP2wshOutputSize),
    p2tr: Dimensions.singleOutput(VirtualSizes.txP2trOutputSize),

    p2pkh: Dimensions.singleOutput(VirtualSizes.txP2pkhOutputSize),
    p2wpkh: Dimensions.singleOutput(VirtualSizes.txP2wpkhOutputSize),
  });

  /**
   * @return Number of total inputs (p2sh + p2shP2wsh + p2wsh + p2tr)
   */
  get nInputs(): number {
    return (
      this.nP2shInputs +
      this.nP2shP2wshInputs +
      this.nP2wshInputs +
      this.nP2trKeypathInputs +
      this.nP2trScriptPathLevel1Inputs +
      this.nP2trScriptPathLevel2Inputs +
      this.nP2shP2pkInputs
    );
  }

  set nInputs(_: number) {
    throw new Error('read-only property nInputs');
  }

  /**
   * @return Number of total outputs
   */
  get nOutputs(): number {
    return this.outputs.count;
  }

  set nOutputs(_: number) {
    throw new Error(`read-only property nOutputs`);
  }

  /**
   * @param args - Dimensions (can be partially defined)
   * @return {Dimensions} sum of arguments
   */
  static sum(...args: Partial<Dimensions>[]): Dimensions {
    return args.reduce((a: Dimensions, b: Partial<Dimensions>) => a.plus(b), new Dimensions());
  }

  /**
   * @param chain
   * @return {Number}
   */
  static getOutputScriptLengthForChain(chain: ChainCode): number {
    switch (scriptTypeForChain(chain)) {
      case 'p2wsh':
      case 'p2tr':
      case 'p2trMusig2':
        return 34;
      default:
        return 23;
    }
  }

  /**
   * @param scriptLength
   * @return {Number} vSize of an output with script length
   */
  static getVSizeForOutputWithScriptLength(scriptLength: number): number {
    if (!PositiveInteger.is(scriptLength)) {
      throw new TypeError(`expected positive integer for scriptLength, got ${scriptLength}`);
    }
    return scriptLength + compactSize(scriptLength) + VirtualSizes.txOutputAmountSize;
  }

  static readonly SingleInput = Object.freeze({
    p2sh: Dimensions.sum({ nP2shInputs: 1 }),
    p2shP2wsh: Dimensions.sum({ nP2shP2wshInputs: 1 }),
    p2wsh: Dimensions.sum({ nP2wshInputs: 1 }),
    p2trKeypath: Dimensions.sum({ nP2trKeypathInputs: 1 }),
    p2trScriptPathLevel1: Dimensions.sum({ nP2trScriptPathLevel1Inputs: 1 }),
    p2trScriptPathLevel2: Dimensions.sum({ nP2trScriptPathLevel2Inputs: 1 }),
    p2shP2pk: Dimensions.sum({ nP2shP2pkInputs: 1 }),
  });

  /**
   * @return
   */
  static fromScriptType(
    scriptType: utxolib.bitgo.outputScripts.ScriptType | utxolib.bitgo.ParsedScriptType2Of3 | 'p2pkh',
    params: {
      scriptPathLevel?: number;
    } = {}
  ): Dimensions {
    switch (scriptType) {
      case 'p2sh':
      case 'p2shP2wsh':
      case 'p2wsh':
      case 'p2shP2pk':
        return Dimensions.SingleInput[scriptType];
      case 'p2tr':
      case 'taprootScriptPathSpend':
        switch (params.scriptPathLevel) {
          case 1:
            return Dimensions.SingleInput.p2trScriptPathLevel1;
          case 2:
            return Dimensions.SingleInput.p2trScriptPathLevel2;
          default:
            throw new Error(`unexpected script path level`);
        }
      case 'p2trMusig2':
        switch (params.scriptPathLevel) {
          case undefined:
            return Dimensions.SingleInput.p2trKeypath;
          case 1:
            return Dimensions.SingleInput.p2trScriptPathLevel1;
          default:
            throw new Error(`unexpected script path level`);
        }
      case 'taprootKeyPathSpend':
        return Dimensions.SingleInput.p2trKeypath;
      default:
        throw new Error(`unexpected scriptType ${scriptType}`);
    }
  }

  static readonly ASSUME_P2SH = Dimensions.SingleInput.p2sh;
  static readonly ASSUME_P2SH_P2WSH = Dimensions.SingleInput.p2shP2wsh;
  static readonly ASSUME_P2WSH = Dimensions.SingleInput.p2wsh;
  static readonly ASSUME_P2TR_KEYPATH = Dimensions.SingleInput.p2trKeypath;
  static readonly ASSUME_P2TR_SCRIPTPATH_LEVEL1 = Dimensions.SingleInput.p2trScriptPathLevel1;
  static readonly ASSUME_P2TR_SCRIPTPATH_LEVEL2 = Dimensions.SingleInput.p2trScriptPathLevel2;
  static readonly ASSUME_P2SH_P2PK_INPUT = Dimensions.SingleInput.p2shP2pk;

  private static getAssumedDimension(params: FromInputParams = {}, index: number) {
    const { assumeUnsigned } = params;
    if (!assumeUnsigned) {
      throw new Error(`illegal input ${index}: empty script and assumeUnsigned not set`);
    }
    return assumeUnsigned;
  }

  /**
   * @param input - the transaction input to count
   * @param params
   *        [param.assumeUnsigned] - default type for unsigned input
   */
  static fromInput(input: utxolib.TxInput, params: FromInputParams = {}): Dimensions {
    if (input.script?.length || input.witness?.length) {
      const parsed = utxolib.bitgo.parseSignatureScript(input);
      return Dimensions.fromScriptType(parsed.scriptType, parsed as { scriptPathLevel?: number });
    }

    return Dimensions.getAssumedDimension(params, input.index);
  }

  /**
   * Create Dimensions from psbt input
   * @param input - psbt input
   */
  static fromPsbtInput(input: bitgo.PsbtInputType): Dimensions {
    const parsed = bitgo.parsePsbtInput(input);
    return Dimensions.fromScriptType(parsed.scriptType, parsed as { scriptPathLevel?: number });
  }

  /**
   * @param inputs - Array of inputs
   * @param params - @see Dimensions.fromInput()
   * @return {Dimensions} sum of the dimensions for each input (@see Dimensions.fromInput())
   */
  static fromInputs(inputs: utxolib.TxInput[], params?: FromInputParams): Dimensions {
    if (!Array.isArray(inputs)) {
      throw new TypeError(`inputs must be array`);
    }
    return Dimensions.sum(...inputs.map((i) => Dimensions.fromInput(i, params)));
  }

  /**
   * Create Dimensions from multiple psbt inputs
   * @param inputs psbt input array
   * @return {Dimensions} sum of the dimensions for each input (@see Dimensions.fromPsbtInput())
   */
  static fromPsbtInputs(inputs: bitgo.PsbtInputType[]): Dimensions {
    if (!Array.isArray(inputs)) {
      throw new TypeError(`inputs must be array`);
    }
    return Dimensions.sum(...inputs.map((input, _) => Dimensions.fromPsbtInput(input)));
  }

  /**
   * @param scriptLength {number} - size of the output script in bytes
   * @return {Dimensions} - Dimensions of the output
   */
  static fromOutputScriptLength(scriptLength: number): Dimensions {
    return Dimensions.sum({
      outputs: {
        count: 1,
        size: Dimensions.getVSizeForOutputWithScriptLength(scriptLength),
      },
    });
  }

  /**
   * @param output - a tx output
   * @return Dimensions - the dimensions of the given output
   */
  static fromOutput({ script }: { script: Buffer }): Dimensions {
    if (!script) {
      throw new Error('expected output script to be defined');
    }
    if (!Buffer.isBuffer(script)) {
      throw new TypeError('expected script to be buffer, got ' + typeof script);
    }
    return Dimensions.fromOutputScriptLength(script.length);
  }

  /**
   * @param outputs - Array of outputs
   * @return {Dimensions} sum of the dimensions for each output (@see Dimensions.fromOutput())
   */
  static fromOutputs(outputs: { script: Buffer }[]): Dimensions {
    if (!Array.isArray(outputs)) {
      throw new TypeError(`outputs must be array`);
    }
    return Dimensions.sum(...outputs.map(Dimensions.fromOutput));
  }

  /**
   * Returns the dimensions of an output that will be created on a specific chain.
   * Currently, this simply adds a default output.
   *
   * @param chain - Chain code as defined by utxolib.bitgo
   * @return {Dimensions} - Dimensions for a single output on the given chain.
   */
  static fromOutputOnChain(chain: ChainCode): Dimensions {
    return Dimensions.fromOutputScriptLength(Dimensions.getOutputScriptLengthForChain(chain));
  }

  /**
   * Return dimensions of an unspent according to `chain` parameter
   * @param chain - Chain code as defined by utxo.chain
   * @param params - Hint for unspents with variable input sizes (p2tr).
   * @return {Dimensions} of the unspent
   * @throws if the chain code is invalid or unsupported
   */
  static fromUnspent({ chain }: { chain: number }, params: FromUnspentParams = defaultUnspentParams): Dimensions {
    if (!isChainCode(chain)) {
      throw new TypeError('invalid chain code');
    }

    const scriptType = scriptTypeForChain(chain);

    return Dimensions.fromScriptType(
      scriptType,
      scriptType === 'p2tr' ? params.p2tr : scriptType === 'p2trMusig2' ? params.p2trMusig2 : {}
    );
  }

  /**
   * @param unspents
   * @return {Dimensions} sum of the dimensions for each unspent (@see Dimensions.fromUnspent())
   */
  static fromUnspents(unspents: { chain: ChainCode }[]): Dimensions {
    if (!Array.isArray(unspents)) {
      throw new TypeError(`unspents must be array`);
    }
    // Convert the individual unspents into dimensions and sum them up
    return Dimensions.sum(...unspents.map((u) => Dimensions.fromUnspent(u)));
  }

  /**
   * @param transaction - bitcoin-like transaction
   * @param [param.assumeUnsigned] - default type for unsigned inputs
   * @return {Dimensions}
   */
  static fromTransaction(
    {
      ins,
      outs,
    }: {
      ins: utxolib.TxInput[];
      outs: utxolib.TxOutput[];
    },
    params?: FromInputParams
  ): Dimensions {
    return Dimensions.fromInputs(ins, params).plus(Dimensions.fromOutputs(outs));
  }

  /**
   * Create Dimensions from psbt inputs and outputs
   * @param psbt
   * @return {Dimensions}
   */
  static fromPsbt(psbt: bitgo.UtxoPsbt): Dimensions {
    return Dimensions.fromPsbtInputs(psbt.data.inputs).plus(Dimensions.fromOutputs(psbt.getUnsignedTx().outs));
  }

  /**
   * @param dimensions (can be partially defined)
   * @return new dimensions with argument added
   */
  plus(dimensions: Partial<Dimensions>): Dimensions {
    if (typeof dimensions !== 'object') {
      throw new TypeError(`expected argument to be object`);
    }

    if (!(dimensions instanceof Dimensions)) {
      dimensions = new Dimensions(dimensions);
    }

    // Catch instances where we try to initialize Dimensions from partial data using deprecated parameters
    // using only "nOutputs".
    if ('nOutputs' in dimensions) {
      if (!('outputs' in dimensions)) {
        throw new Error('deprecated partial addition: argument has key "nOutputs" but no "outputs"');
      }

      const { outputs, nOutputs } = dimensions as Dimensions;

      if (outputs.count !== nOutputs) {
        throw new Error('deprecated partial addition: inconsistent values for "nOutputs" and "outputs.count"');
      }
    }

    return mapDimensions(this, (key, v) => {
      const w = dimensions[key] ?? Dimensions.ZERO[key];
      if (key === 'outputs') {
        const vOutputs = v as OutputDimensions;
        const wOutputs = w as OutputDimensions;
        return new OutputDimensions({
          count: vOutputs.count + wOutputs.count,
          size: vOutputs.size + wOutputs.size,
        });
      }
      return (v as number) + (w as number);
    });
  }

  /**
   * Multiply dimensions by a given factor
   * @param factor - Positive integer
   * @return {Dimensions}
   */
  times(factor: number): Dimensions {
    if (!PositiveInteger.is(factor)) {
      throw new TypeError(`expected factor to be positive integer`);
    }

    return mapDimensions(this, (key, value) => {
      if (key === 'outputs') {
        const vOutputs = value as OutputDimensions;
        return {
          count: vOutputs.count * factor,
          size: vOutputs.size * factor,
        };
      }
      return (value as number) * factor;
    });
  }

  /**
   * @return Number of total inputs (p2sh, p2shP2wsh and p2wsh)
   * @deprecated use `dimension.nInputs` instead
   */
  getNInputs(): number {
    return this.nInputs;
  }

  /**
   * @returns {boolean} true iff dimensions have one or more (p2sh)p2wsh inputs
   */
  isSegwit(): boolean {
    return (
      this.nP2wshInputs +
        this.nP2shP2wshInputs +
        this.nP2trKeypathInputs +
        this.nP2trScriptPathLevel1Inputs +
        this.nP2trScriptPathLevel2Inputs >
      0
    );
  }

  /**
   * @return {Number} overhead vsize, based on result isSegwit().
   */
  getOverheadVSize(): number {
    return this.isSegwit() ? VirtualSizes.txSegOverheadVSize : VirtualSizes.txOverheadSize;
  }

  /**
   * @returns {number} vsize of inputs, without transaction overhead
   */
  getInputsVSize(): number {
    const {
      txP2shInputSize,
      txP2shP2wshInputSize,
      txP2wshInputSize,
      txP2trKeypathInputSize,
      txP2trScriptPathLevel1InputSize,
      txP2trScriptPathLevel2InputSize,
      txP2shP2pkInputSize,
    } = VirtualSizes;

    const {
      nP2shInputs,
      nP2shP2wshInputs,
      nP2wshInputs,
      nP2trKeypathInputs,
      nP2trScriptPathLevel1Inputs,
      nP2trScriptPathLevel2Inputs,
      nP2shP2pkInputs,
    } = this;

    const size =
      nP2shInputs * txP2shInputSize +
      nP2shP2wshInputs * txP2shP2wshInputSize +
      nP2wshInputs * txP2wshInputSize +
      nP2trKeypathInputs * txP2trKeypathInputSize +
      nP2shP2pkInputs * txP2shP2pkInputSize +
      nP2trScriptPathLevel1Inputs * txP2trScriptPathLevel1InputSize +
      nP2trScriptPathLevel2Inputs * txP2trScriptPathLevel2InputSize;
    if (Number.isNaN(size)) {
      throw new Error(`invalid size`);
    }

    return size;
  }

  /**
   * @returns {number} return vsize of outputs, without overhead
   */
  getOutputsVSize(): number {
    return this.outputs.size;
  }

  /**
   * Estimates the virtual size (1/4 weight) of a signed transaction as sum of
   * overhead vsize, input vsize and output vsize.
   * @returns {Number} The estimated vsize of the transaction dimensions.
   */
  getVSize(): number {
    return this.getOverheadVSize() + this.getInputsVSize() + this.getOutputsVSize();
  }
}
