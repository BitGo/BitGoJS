import * as utxolib from '@bitgo/utxo-lib';
import * as _ from 'lodash';
import * as t from 'tcomb';

import Codes, { ChainCode } from './codes';
import {
  getInputComponentsWeight,
  InputComponents,
  inputComponentsP2sh,
  inputComponentsP2shP2pk,
  inputComponentsP2shP2wsh,
  inputComponentsP2trKeySpend,
  inputComponentsP2trScriptSpendLevel1,
  inputComponentsP2trScriptSpendLevel2,
  inputComponentsP2wsh,
} from './inputWeights';
import { compactSize } from './scriptSizes';
import { PositiveInteger } from './types';

/*
This is a reference implementation for calculating weights and vSizes from bitcoinjs-lib 3.3.2.
https://github.com/bitcoinjs/bitcoinjs-lib/blob/v3.3.2/src/transaction.js#L194-L219

```
  function encodingLength (number) {
    checkUInt53(number)

    return (
      number < 0xfd ? 1
    : number <= 0xffff ? 3
    : number <= 0xffffffff ? 5
    : 9
    )
  }

  function varSliceSize (someScript) {
    var length = someScript.length

    return encodingLength(length) + length
  }

  function vectorSize (someVector) {
    var length = someVector.length

    return varuint.encodingLength(length) + someVector.reduce(function (sum, witness) {
      return sum + varSliceSize(witness)
    }, 0)
  }

  Transaction.prototype.__byteLength = function (__allowWitness) {
    var hasWitnesses = __allowWitness && this.hasWitnesses()

    return (
      (hasWitnesses ? 10 : 8) +
      varuint.encodingLength(this.ins.length) +
      varuint.encodingLength(this.outs.length) +
      this.ins.reduce(function (sum, input) { return sum + 40 + varSliceSize(input.script) }, 0) +
      this.outs.reduce(function (sum, output) { return sum + 8 + varSliceSize(output.script) }, 0) +
      (hasWitnesses ? this.ins.reduce(function (sum, input) { return sum + vectorSize(input.witness) }, 0) : 0)
    )
  }

  Transaction.prototype.weight = function () {
    var base = this.__byteLength(false)
    var total = this.__byteLength(true)
    return base * 3 + total
  }

  Transaction.prototype.virtualSize = function () {
    return Math.ceil(this.weight() / 4)
  }
```
*/

function getVirtualInputSizeFromComponents(components: InputComponents): number {
  return Math.ceil(getInputComponentsWeight(components) / 4);
}

// Constants for signed TX input and output vsizes.
// See https://bitcoincore.org/en/segwit_wallet_dev/#transaction-serialization for full description
// FIXME(BG-9233): use weight units instead
export const VirtualSizes = Object.freeze({
  // FIXME(BG-7873): add support for signature grinding

  // Size of a P2PKH input with (un)compressed key
  /** @deprecated */
  txP2pkhInputSizeCompressedKey: 148,
  /** @deprecated */
  txP2pkhInputSizeUncompressedKey: 180,

  // Input sizes
  txP2shInputSize: getVirtualInputSizeFromComponents(inputComponentsP2sh),
  txP2shP2wshInputSize: getVirtualInputSizeFromComponents(inputComponentsP2shP2wsh),
  txP2wshInputSize: getVirtualInputSizeFromComponents(inputComponentsP2wsh),
  txP2trKeypathInputSize: getVirtualInputSizeFromComponents(inputComponentsP2trKeySpend),
  txP2shP2pkInputSize: getVirtualInputSizeFromComponents(inputComponentsP2shP2pk),
  txP2trScriptPathLevel1InputSize: getVirtualInputSizeFromComponents(inputComponentsP2trScriptSpendLevel1),
  txP2trScriptPathLevel2InputSize: getVirtualInputSizeFromComponents(inputComponentsP2trScriptSpendLevel2),

  //
  // Output sizes
  //

  // The size is calculated as
  //
  //    scriptLength + compactSize(scriptLength) + txOutputAmountSize
  //
  // Since compactSize(scriptLength) is 1 for all scripts considered here, we can simplify this to
  //
  //    scriptLength + 9
  //

  // Size of single output amount
  txOutputAmountSize: 8,

  // https://github.com/bitcoinjs/bitcoinjs-lib/blob/v4.0.2/src/templates/scripthash/output.js#L9
  txP2shOutputSize: 32,
  txP2shP2wshOutputSize: 32,
  // https://github.com/bitcoinjs/bitcoinjs-lib/blob/v4.0.2/src/templates/witnessscripthash/output.js#L9
  txP2wshOutputSize: 43,
  // OP_1 OP_PUSH32 <schnorr_public_key>
  txP2trOutputSize: 43,
  // https://github.com/bitcoinjs/bitcoinjs-lib/blob/v4.0.2/src/templates/pubkeyhash/output.js#L9
  txP2pkhOutputSize: 34,
  // https://github.com/bitcoinjs/bitcoinjs-lib/blob/v4.0.2/src/templates/witnesspubkeyhash/output.js#L9
  txP2wpkhOutputSize: 31,

  /** @deprecated - use txP2pkhOutputSize instead */
  txOutputSize: 34,

  //
  // General tx size constants
  //

  txOverheadSize: 10,
  // Segwit adds one byte each for marker and flag to the witness section.
  // Thus, the vsize is only increased by one.
  txSegOverheadVSize: 11,
});

export interface IOutputDimensions {
  count: number;
  size: number;
}

/**
 * A collection of outputs is represented as their count and aggregate vsize
 */
export const OutputDimensions = t.refinement<IOutputDimensions>(
  t.struct<IOutputDimensions>({
    count: PositiveInteger, // number of outputs
    size: PositiveInteger, // aggregate vsize
  }),
  /* predicate: count is zero iff size is zero */
  ({ count, size }: { count: number; size: number }) => (count === 0) === (size === 0),
  /* name */
  'Outputs'
);

export interface IBaseDimensions {
  // Multisig
  nP2shInputs: number;
  nP2shP2wshInputs: number;
  nP2wshInputs: number;
  nP2trKeypathInputs: number;
  nP2trScriptPathLevel1Inputs: number;
  nP2trScriptPathLevel2Inputs: number;
  // Single-Signature
  nP2shP2pkInputs: number;
  outputs: IOutputDimensions;
}

export interface IDimensions extends IBaseDimensions {
  nInputs: number;
  nOutputs: number;

  plus(v: Partial<IDimensions>): IDimensions;
  times(n: number): IDimensions;

  isSegwit(): boolean;
  getNInputs(): number;
  getOverheadVSize(): number;
  getInputsVSize(): number;
  getOutputsVSize(): number;
  getVSize(): number;
}

interface IFromInputParams {
  // In cases where the input type is ambiguous, we must provide a hint about spend script type.
  assumeUnsigned?: symbol;
}

export interface IFromUnspentParams {
  // The p2tr output type has multiple spend options and thus different weights per spend path.
  p2trSpendType: 'keypath' | 'scriptpath-level1' | 'scriptpath-level2';
}

export interface IDimensionsStruct extends t.Struct<IDimensions> {
  (v: IBaseDimensions): IDimensions;
  ASSUME_P2SH: symbol;
  ASSUME_P2SH_P2WSH: symbol;
  ASSUME_P2WSH: symbol;
  ASSUME_P2TR_KEYPATH: symbol;
  ASSUME_P2TR_SCRIPTPATH_LEVEL1: symbol;
  ASSUME_P2TR_SCRIPTPATH_LEVEL2: symbol;

  SingleOutput: {
    p2sh: IDimensions;
    p2shP2wsh: IDimensions;
    p2wsh: IDimensions;
    p2tr: IDimensions;
    p2pkh: IDimensions;
    p2wpkh: IDimensions;
  };
  new (v: IBaseDimensions): IDimensions;

  zero(): IDimensions;
  sum(...args: Array<Partial<IDimensions>>): IDimensions;

  getOutputScriptLengthForChain(chain: ChainCode): number;
  getVSizeForOutputWithScriptLength(length: number): number;

  fromInput(input: utxolib.TxInput, params?: IFromInputParams): IDimensions;
  fromInputs(input: utxolib.TxInput[], params?: IFromInputParams): IDimensions;

  fromOutputScriptLength(scriptLength: number): IDimensions;
  fromOutput(output: { script: Buffer }): IDimensions;
  fromOutputs(outputs: Array<{ script: Buffer }>): IDimensions;
  fromOutputOnChain(chain: ChainCode): IDimensions;
  fromUnspent(unspent: { chain: ChainCode }, params?: IFromUnspentParams): IDimensions;
  fromUnspents(unspents: Array<{ chain: ChainCode }>): IDimensions;

  fromTransaction(tx: utxolib.Transaction, params?: { assumeUnsigned?: symbol }): IDimensions;
}

/**
 * The transaction parameters required for vsize estimation.
 * The total vsize of a transaction (`getVSize()`) is the sum of:
 * - the overhead vsize (`getOverheadVSize()`),
 * - the inputs vsize (`getInputsVSize()`)
 * - the outputs vsize (`getOutputsVSize()`)
 * See https://bitcoincore.org/en/segwit_wallet_dev/#transaction-serialization
 * for explanation of the different components.
 */
export const Dimensions = t.struct<IDimensions>(
  {
    nP2shInputs: PositiveInteger,
    nP2shP2wshInputs: PositiveInteger,
    nP2wshInputs: PositiveInteger,
    nP2trKeypathInputs: PositiveInteger,
    nP2trScriptPathLevel1Inputs: PositiveInteger,
    nP2trScriptPathLevel2Inputs: PositiveInteger,
    nP2shP2pkInputs: PositiveInteger,
    outputs: OutputDimensions,
  },
  { name: 'Dimensions' }
) as IDimensionsStruct;

const zero = Object.freeze(
  Dimensions({
    nP2shInputs: 0,
    nP2shP2wshInputs: 0,
    nP2wshInputs: 0,
    nP2trKeypathInputs: 0,
    nP2trScriptPathLevel1Inputs: 0,
    nP2trScriptPathLevel2Inputs: 0,
    nP2shP2pkInputs: 0,
    outputs: { count: 0, size: 0 },
  })
) as IDimensions;

/**
 * Dimensions object where all properties are 0
 * @return {any}
 */
Dimensions.zero = function (): IDimensions {
  return zero;
};

Object.defineProperty(Dimensions.prototype, 'nInputs', {
  /**
   * @return Number of total inputs (p2sh + p2shP2wsh + p2wsh + p2tr)
   */
  get() {
    return (
      this.nP2shInputs +
      this.nP2shP2wshInputs +
      this.nP2wshInputs +
      this.nP2trKeypathInputs +
      this.nP2trScriptPathLevel1Inputs +
      this.nP2trScriptPathLevel2Inputs
    );
  },

  set(v) {
    throw new Error('read-only property nInputs');
  },
});

Object.defineProperty(Dimensions.prototype, 'nOutputs', {
  /**
   * @return Number of total outputs
   */
  get() {
    return this.outputs.count;
  },

  set(v) {
    throw new Error('read-only property nOutputs');
  },
});

type DimProperty = number | IOutputDimensions;

type DimPropertyConstructor = (v: any) => DimProperty;

type MapFunc = (value: DimProperty, key: keyof IDimensions, prop: DimPropertyConstructor) => DimProperty;

/**
 * Return new Dimensions with all properties mapped by func
 * @param dim - Dimensions to be mapped
 * @param func - takes (value, key, prop)
 * @return {Dimensions} new dimensions
 */
const mapDimensions = (dim: IDimensions, func: MapFunc) => {
  return Dimensions(
    _.fromPairs(
      _.map(Dimensions.meta.props, (prop, key) => [
        key,
        func((dim as any)[key], key as keyof IDimensions, prop as DimPropertyConstructor),
      ])
    ) as any
  );
};

Dimensions.ASSUME_P2SH = Symbol('assume-p2sh');
Dimensions.ASSUME_P2SH_P2WSH = Symbol('assume-p2sh-p2wsh');
Dimensions.ASSUME_P2WSH = Symbol('assume-p2wsh');
Dimensions.ASSUME_P2TR_KEYPATH = Symbol('assume-p2tr-keypath');
Dimensions.ASSUME_P2TR_SCRIPTPATH_LEVEL1 = Symbol('assume-p2tr-scriptpath-level1');
Dimensions.ASSUME_P2TR_SCRIPTPATH_LEVEL2 = Symbol('assume-p2tr-scriptpath-level2');

/**
 * @param args - Dimensions (can be partially defined)
 * @return {Dimensions} sum of arguments
 */
Dimensions.sum = function (...args: Array<Partial<IDimensions>>): IDimensions {
  return args.reduce((a: IDimensions, b: Partial<IDimensions>) => Dimensions(a).plus(b), zero);
};

/**
 * @param chain
 * @return {Number}
 */
Dimensions.getOutputScriptLengthForChain = function (chain: ChainCode): number {
  if (!Codes.isValid(chain)) {
    throw new TypeError('invalid chain code');
  }
  return Codes.isP2wsh(chain) || Codes.isP2tr(chain) ? 34 : 23;
};

/**
 * @param scriptLength
 * @return {Number} vSize of an output with script length
 */
Dimensions.getVSizeForOutputWithScriptLength = function (scriptLength: number): number {
  if (!PositiveInteger.is(scriptLength)) {
    throw new TypeError(`expected positive integer for scriptLength, got ${scriptLength}`);
  }
  return scriptLength + compactSize(scriptLength) + VirtualSizes.txOutputAmountSize;
};

/**
 * @param input - the transaction input to count
 * @param params
 *        [param.assumeUnsigned] - default type for unsigned input
 */
Dimensions.fromInput = function (input: utxolib.TxInput, params = {}) {
  const p2shInput = Dimensions.sum({ nP2shInputs: 1 });
  const p2shP2wshInput = Dimensions.sum({ nP2shP2wshInputs: 1 });
  const p2wshInput = Dimensions.sum({ nP2wshInputs: 1 });
  const p2trKeypathInput = Dimensions.sum({ nP2trKeypathInputs: 1 });
  const p2trScriptPathLevel1Input = Dimensions.sum({ nP2trScriptPathLevel1Inputs: 1 });
  const p2trScriptPathLevel2Input = Dimensions.sum({ nP2trScriptPathLevel2Inputs: 1 });
  const p2shP2pkInput = Dimensions.sum({ nP2shP2pkInputs: 1 });

  if (input.script?.length || input.witness?.length) {
    const parsed = utxolib.bitgo.parseSignatureScript(input);
    switch (parsed.scriptType) {
      case undefined:
        // unknown script type, continue with `assumeUnsigned`
        break;
      case 'p2shP2pk':
        return p2shP2pkInput;
      case 'p2sh':
        return p2shInput;
      case 'p2shP2wsh':
        return p2shP2wshInput;
      case 'p2wsh':
        return p2wshInput;
      case 'p2tr':
        if (parsed.controlBlock.length === 65) {
          // 33 bytes + 32 bytes for depth 1
          return p2trScriptPathLevel1Input;
        } else if (parsed.controlBlock.length === 97) {
          // 33 bytes + 64 bytes for depth 2
          return p2trScriptPathLevel2Input;
        } else {
          throw new Error(`unexpected control block length: ${parsed.scriptType}`);
        }
      default:
        throw new Error(`unexpected script type ${parsed.scriptType}`);
    }
  }

  const { assumeUnsigned } = params;
  switch (assumeUnsigned) {
    case undefined:
      throw new Error(`illegal input ${input.index}: empty script and assumeUnsigned not set`);
    case Dimensions.ASSUME_P2SH:
      return p2shInput;
    case Dimensions.ASSUME_P2SH_P2WSH:
      return p2shP2wshInput;
    case Dimensions.ASSUME_P2WSH:
      return p2wshInput;
    case Dimensions.ASSUME_P2TR_KEYPATH:
      return p2trKeypathInput;
    case Dimensions.ASSUME_P2TR_SCRIPTPATH_LEVEL1:
      return p2trScriptPathLevel1Input;
    case Dimensions.ASSUME_P2TR_SCRIPTPATH_LEVEL2:
      return p2trScriptPathLevel2Input;
    default:
      throw new TypeError(`illegal value for assumeUnsigned: ${String(assumeUnsigned)}`);
  }
};

/**
 * @param inputs - Array of inputs
 * @param params - @see Dimensions.fromInput()
 * @return {Dimensions} sum of the dimensions for each input (@see Dimensions.fromInput())
 */
Dimensions.fromInputs = function (inputs, params) {
  if (!Array.isArray(inputs)) {
    throw new TypeError(`inputs must be array`);
  }
  return Dimensions.sum(...inputs.map((i) => Dimensions.fromInput(i, params)));
};

/**
 * @param scriptLength {PositiveInteger} - size of the output script in bytes
 * @return {Dimensions} - Dimensions of the output
 */
Dimensions.fromOutputScriptLength = function (scriptLength) {
  return Dimensions.sum({
    outputs: {
      count: 1,
      size: Dimensions.getVSizeForOutputWithScriptLength(scriptLength),
    },
  });
};

/**
 * @param output - a tx output
 * @return Dimensions - the dimensions of the given output
 */
Dimensions.fromOutput = function ({ script }) {
  if (!script) {
    throw new Error('expected output script to be defined');
  }
  if (!Buffer.isBuffer(script)) {
    throw new TypeError('expected script to be buffer, got ' + typeof script);
  }
  return Dimensions.fromOutputScriptLength(script.length);
};

/**
 * @param outputs - Array of outputs
 * @return {Dimensions} sum of the dimensions for each output (@see Dimensions.fromOutput())
 */
Dimensions.fromOutputs = function (outputs) {
  if (!Array.isArray(outputs)) {
    throw new TypeError(`outputs must be array`);
  }
  return Dimensions.sum(...outputs.map(Dimensions.fromOutput));
};

/**
 * Returns the dimensions of an output that will be created on a specific chain.
 * Currently, this simply adds a default output.
 *
 * @param chain - Chain code as defined by utxo.chain
 * @return {Dimensions} - Dimensions for a single output on the given chain.
 */
Dimensions.fromOutputOnChain = function (chain) {
  return Dimensions.fromOutputScriptLength(Dimensions.getOutputScriptLengthForChain(chain));
};

/**
 * Return dimensions of an unspent according to `chain` parameter
 * @param chain - Chain code as defined by utxo.chain
 * @param params - Hint for unspents with variable input sizes (p2tr).
 * @return {Dimensions} of the unspent
 * @throws if the chain code is invalid or unsupported
 */
Dimensions.fromUnspent = ({ chain }, params: IFromUnspentParams = { p2trSpendType: 'scriptpath-level1' }) => {
  if (!Codes.isValid(chain)) {
    throw new TypeError('invalid chain code');
  }

  if (Codes.isP2sh(chain)) {
    return Dimensions.sum({ nP2shInputs: 1 });
  }

  if (Codes.isP2shP2wsh(chain)) {
    return Dimensions.sum({ nP2shP2wshInputs: 1 });
  }

  if (Codes.isP2wsh(chain)) {
    return Dimensions.sum({ nP2wshInputs: 1 });
  }

  if (Codes.isP2tr(chain)) {
    switch (params.p2trSpendType) {
      case 'keypath':
        return Dimensions.sum({ nP2trKeypathInputs: 1 });
      case 'scriptpath-level1':
        return Dimensions.sum({ nP2trScriptPathLevel1Inputs: 1 });
      case 'scriptpath-level2':
        return Dimensions.sum({ nP2trScriptPathLevel2Inputs: 1 });
      default:
        throw new Error(`unsupported p2trSpendType: ${params.p2trSpendType}`);
    }
  }

  throw new Error(`unsupported chain ${chain}`);
};

/**
 * @param unspents
 * @return {Dimensions} sum of the dimensions for each unspent (@see Dimensions.fromUnspent())
 */
Dimensions.fromUnspents = function (unspents) {
  if (!Array.isArray(unspents)) {
    throw new TypeError(`unspents must be array`);
  }
  // Convert the individual unspents into dimensions and sum them up
  return Dimensions.sum(...unspents.map((u) => Dimensions.fromUnspent(u)));
};

/**
 * @param transaction - bitcoin-like transaction
 * @param [param.assumeUnsigned] - default type for unsigned inputs
 * @return {Dimensions}
 */
Dimensions.fromTransaction = function ({ ins, outs }, params) {
  return Dimensions.fromInputs(ins, params).plus(Dimensions.fromOutputs(outs));
};

/**
 * @param dimensions (can be partially defined)
 * @return new dimensions with argument added
 */
Dimensions.prototype.plus = function (dimensions: Partial<IDimensions>) {
  if (!_.isObject(dimensions)) {
    throw new TypeError(`expected argument to be object`);
  }

  // Catch instances where we try to initialize Dimensions from partial data using deprecated parameters
  // using only "nOutputs".
  if ('nOutputs' in dimensions) {
    if (!('outputs' in dimensions)) {
      throw new Error('deprecated partial addition: argument has key "nOutputs" but no "outputs"');
    }

    const { outputs, nOutputs } = dimensions as IDimensions;

    if (outputs.count !== nOutputs) {
      throw new Error('deprecated partial addition: inconsistent values for "nOutputs" and "outputs.count"');
    }
  }

  const f: MapFunc = (v, key, prop) => {
    const w = dimensions.hasOwnProperty(key) ? prop(dimensions[key]) : zero[key];
    if (key === 'outputs') {
      const vOutputs = v as IOutputDimensions;
      const wOutputs = w as IOutputDimensions;
      return {
        count: vOutputs.count + wOutputs.count,
        size: vOutputs.size + wOutputs.size,
      };
    }
    return (v as number) + (w as number);
  };

  return mapDimensions(this, f);
};

/**
 * Multiply dimensions by a given factor
 * @param factor - Positive integer
 * @return {Dimensions}
 */
Dimensions.prototype.times = function (factor: number) {
  if (!PositiveInteger.is(factor)) {
    throw new TypeError(`expected factor to be positive integer`);
  }

  return mapDimensions(this, (v, key) => {
    if (key === 'outputs') {
      const vOutputs = v as IOutputDimensions;
      return {
        count: vOutputs.count * factor,
        size: vOutputs.size * factor,
      };
    }
    return (v as number) * factor;
  });
};

/**
 * @return Number of total inputs (p2sh, p2shP2wsh and p2wsh)
 * @deprecated use `dimension.nInputs` instead
 */
Dimensions.prototype.getNInputs = function () {
  return (
    this.nP2shInputs +
    this.nP2shP2wshInputs +
    this.nP2wshInputs +
    this.nP2trKeypathInputs +
    this.nP2trScriptPathLevel1Inputs +
    this.nP2trScriptPathLevel2Inputs
  );
};

/**
 * @returns {boolean} true iff dimensions have one or more (p2sh)p2wsh inputs
 */
Dimensions.prototype.isSegwit = function () {
  return (
    this.nP2wshInputs +
      this.nP2shP2wshInputs +
      this.nP2trKeypathInputs +
      this.nP2trScriptPathLevel1Inputs +
      this.nP2trScriptPathLevel2Inputs >
    0
  );
};

/**
 * @return {Number} overhead vsize, based on result isSegwit().
 */
Dimensions.prototype.getOverheadVSize = function () {
  return this.isSegwit() ? VirtualSizes.txSegOverheadVSize : VirtualSizes.txOverheadSize;
};

/**
 * @returns {number} vsize of inputs, without transaction overhead
 */
Dimensions.prototype.getInputsVSize = function (this: IBaseDimensions) {
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
};

/**
 * @returns {number} return vsize of outputs, without overhead
 */
Dimensions.prototype.getOutputsVSize = function () {
  return this.outputs.size;
};

/**
 * Estimates the virtual size (1/4 weight) of a signed transaction as sum of
 * overhead vsize, input vsize and output vsize.
 * @returns {Number} The estimated vsize of the transaction dimensions.
 */
Dimensions.prototype.getVSize = function () {
  return this.getOverheadVSize() + this.getInputsVSize() + this.getOutputsVSize();
};

{
  const singleOutput = (size: number) => Object.freeze(Dimensions.sum({ outputs: { count: 1, size } }));

  Dimensions.SingleOutput = {
    p2sh: singleOutput(VirtualSizes.txP2shOutputSize),
    p2shP2wsh: singleOutput(VirtualSizes.txP2shP2wshOutputSize),
    p2wsh: singleOutput(VirtualSizes.txP2wshOutputSize),
    p2tr: singleOutput(VirtualSizes.txP2trOutputSize),

    p2pkh: singleOutput(VirtualSizes.txP2pkhOutputSize),
    p2wpkh: singleOutput(VirtualSizes.txP2wpkhOutputSize),
  };
}
