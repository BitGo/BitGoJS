import * as unspents from '../src';

/**
 * makeEnum('a', 'b') returns `{ a: 'a', b: 'b' }`
 *
 * @param args
 * @return map with string keys and symbol values
 */
const makeEnum = (...args: string[]): any => args.reduce((obj, key) => Object.assign(obj, { [key]: key }), {});

export const UnspentTypeP2shP2pk = 'p2shP2pk';

const UnspentTypeScript2of3: {
  p2sh: string;
  p2shP2wsh: string;
  p2wsh: string;
  p2tr: string;
} = makeEnum('p2sh', 'p2shP2wsh', 'p2wsh', 'p2tr');

const UnspentTypePubKeyHash: {
  p2pkh: 'p2pkh';
  p2wpkh: 'p2wpkh';
} = makeEnum('p2pkh', 'p2wpkh');

export type TestUnspentType = string | UnspentTypeOpReturn;

class UnspentTypeOpReturn {
  constructor(public size: number) {}

  public toString(): string {
    return `opReturn(${this.size})`;
  }
}

/**
 * Return the input dimensions based on unspent type
 * @param unspentType - one of UnspentTypeScript2of3
 * @return Dimensions
 */
const getInputDimensionsForUnspentType = (unspentType: TestUnspentType): unspents.Dimensions => {
  switch (unspentType) {
    case UnspentTypeScript2of3.p2sh:
      return unspents.Dimensions.sum({ nP2shInputs: 1 });
    case UnspentTypeScript2of3.p2shP2wsh:
      return unspents.Dimensions.sum({ nP2shP2wshInputs: 1 });
    case UnspentTypeScript2of3.p2wsh:
      return unspents.Dimensions.sum({ nP2wshInputs: 1 });
    case UnspentTypeScript2of3.p2tr:
      return unspents.Dimensions.sum({ nP2trScriptPathLevel1Inputs: 1 });
    case UnspentTypeP2shP2pk:
      return unspents.Dimensions.sum({ nP2shP2pkInputs: 1 });
  }
  throw new Error(`no input dimensions for ${unspentType}`);
};

const getOutputDimensionsForUnspentType = (unspentType: TestUnspentType): unspents.Dimensions => {
  /* The values here are validated in the test 'calculates output dimensions dynamically' */
  switch (unspentType) {
    case UnspentTypeScript2of3.p2sh:
    case UnspentTypeScript2of3.p2shP2wsh:
    case UnspentTypeP2shP2pk:
      return unspents.Dimensions.fromOutputScriptLength(23);
    case UnspentTypeScript2of3.p2wsh:
      return unspents.Dimensions.fromOutputScriptLength(34);
    case UnspentTypeScript2of3.p2tr:
      return unspents.Dimensions.fromOutputScriptLength(34);
    case UnspentTypePubKeyHash.p2pkh:
      return unspents.Dimensions.fromOutputScriptLength(25);
    case UnspentTypePubKeyHash.p2wpkh:
      return unspents.Dimensions.fromOutputScriptLength(22);
    default:
      if (unspentType instanceof UnspentTypeOpReturn) {
        return unspents.Dimensions.fromOutputScriptLength(1 + unspentType.size);
      }
      throw new TypeError(`unknown unspentType ${unspentType}`);
  }
};

export {
  UnspentTypeScript2of3,
  UnspentTypePubKeyHash,
  UnspentTypeOpReturn,
  getInputDimensionsForUnspentType,
  getOutputDimensionsForUnspentType,
};
