/* eslint-disable @typescript-eslint/ban-ts-comment */
import * as should from 'should';
import { bitgo } from '@bitgo/utxo-lib';
const { chainCodes, chainCodesP2sh, chainCodesP2shP2wsh, chainCodesP2tr, chainCodesP2trMusig2, chainCodesP2wsh } =
  bitgo;
import { Dimensions, OutputDimensions, VirtualSizes } from '../src';

import { getOutputDimensionsForUnspentType, UnspentTypePubKeyHash, UnspentTypeScript2of3 } from './testutils';

describe('Dimensions Attributes', function () {
  it('has read-only nInputs and nOutputs', function () {
    should.throws(() => ((Dimensions.ZERO as any).nInputs = 1), /read-only/);
    should.throws(() => ((Dimensions.ZERO as any).nOutputs = 1), /read-only/);
  });
});

describe('Output Dimensions', function () {
  it('instantiates', function () {
    const dims = new OutputDimensions({ size: 0, count: 0 });
    should.throws(() => (dims.count += 1));
  });
});

describe('Dimensions Arithmetic', function () {
  it('sums correctly', function () {
    Dimensions.zero()
      .plus({ nP2shInputs: 1 })
      .should.eql(
        new Dimensions({
          nP2shInputs: 1,
          nP2shP2wshInputs: 0,
          nP2wshInputs: 0,
          nP2trKeypathInputs: 0,
          nP2trScriptPathLevel1Inputs: 0,
          nP2trScriptPathLevel2Inputs: 0,
          nP2shP2pkInputs: 0,
          outputs: { size: 0, count: 0 },
        })
      );

    const components = [
      { nP2shInputs: 1 },
      { nP2shP2wshInputs: 2 },
      { nP2wshInputs: 3 },
      { nP2trKeypathInputs: 4 },
      { nP2trScriptPathLevel1Inputs: 5 },
      { nP2trScriptPathLevel2Inputs: 6 },
      { outputs: { size: 23, count: 1 } },
      { outputs: { size: 44, count: 2 } },
      { outputs: { size: 0, count: 0 } },
    ];

    components.forEach((component) => should.doesNotThrow(() => Dimensions.sum(component)));

    const sum = components.reduce((a, b) => a.plus(b), Dimensions.zero());

    sum.should.eql(Dimensions.sum(...components));

    sum.should.eql(
      new Dimensions({
        nP2shInputs: 1,
        nP2shP2wshInputs: 2,
        nP2wshInputs: 3,
        nP2trKeypathInputs: 4,
        nP2trScriptPathLevel1Inputs: 5,
        nP2trScriptPathLevel2Inputs: 6,
        nP2shP2pkInputs: 0,
        outputs: { size: 67, count: 3 },
      })
    );

    sum.nOutputs.should.eql(sum.outputs.count);
  });

  it('provides some typical output sizes', function () {
    (
      [
        [Dimensions.SingleOutput.p2sh, VirtualSizes.txP2shOutputSize],
        [Dimensions.SingleOutput.p2shP2wsh, VirtualSizes.txP2shP2wshOutputSize],
        [Dimensions.SingleOutput.p2wsh, VirtualSizes.txP2wshOutputSize],
        [Dimensions.SingleOutput.p2pkh, VirtualSizes.txP2pkhOutputSize],
        [Dimensions.SingleOutput.p2wpkh, VirtualSizes.txP2wpkhOutputSize],
        [Dimensions.SingleOutput.p2tr, VirtualSizes.txP2trOutputSize],
      ] as [Dimensions, number][]
    ).forEach(([dims, size]) => {
      dims.getOutputsVSize().should.eql(size);
    });
  });

  it('prevents sum of invalid data', function () {
    should.doesNotThrow(() => Dimensions.sum({ outputs: { count: 0, size: 0 } }));
    should.doesNotThrow(() => Dimensions.sum({ outputs: { count: 1, size: 1 } }));
    should.throws(() => Dimensions.sum({ nOutputs: 1 }));
    should.throws(() => Dimensions.sum({ nOutputs: 1, outputs: { count: 2, size: 1 } }));
    // @ts-ignore
    should.throws(() => Dimensions.sum({ nP2shInputs: 1 }, { nP2shInputs: 'foo' }));
    should.throws(() => Dimensions.sum({ outputs: { count: 1, size: 0 } }));
    should.throws(() => Dimensions.sum({ outputs: { count: 0, size: 1 } }));
    should.throws(() => Dimensions.sum({ outputs: { count: 1, size: 1 } }, { outputs: { count: 1, size: 0 } }));
  });

  it('counts inputs correctly', function () {
    Object.entries(Dimensions.SingleInput).forEach(([key, value]) => {
      value.nInputs.should.eql(1, key);
    });
  });

  it('multiplies correctly', function () {
    const d = new Dimensions({
      nP2shInputs: 1,
      nP2shP2wshInputs: 2,
      nP2wshInputs: 3,
      nP2trKeypathInputs: 4,
      nP2trScriptPathLevel1Inputs: 5,
      nP2trScriptPathLevel2Inputs: 6,
      nP2shP2pkInputs: 7,
      outputs: { count: 1, size: 22 },
    }).times(3);

    d.should.eql(
      new Dimensions({
        nP2shInputs: 3,
        nP2shP2wshInputs: 6,
        nP2wshInputs: 9,
        nP2trKeypathInputs: 12,
        nP2trScriptPathLevel1Inputs: 15,
        nP2trScriptPathLevel2Inputs: 18,
        nP2shP2pkInputs: 21,
        outputs: { count: 3, size: 66 },
      })
    );

    d.getNInputs().should.eql(84);
    d.nInputs.should.eql(84);
  });
});

describe('Dimensions from unspent types', function () {
  it('determines unspent size according to chain', function () {
    chainCodesP2sh.forEach((chain) => Dimensions.fromUnspent({ chain }).should.eql(Dimensions.sum({ nP2shInputs: 1 })));

    chainCodesP2shP2wsh.forEach((chain) =>
      Dimensions.fromUnspent({ chain }).should.eql(Dimensions.sum({ nP2shP2wshInputs: 1 }))
    );

    chainCodesP2wsh.forEach((chain) =>
      Dimensions.fromUnspent({ chain }).should.eql(Dimensions.sum({ nP2wshInputs: 1 }))
    );

    chainCodesP2tr.forEach((chain) => {
      Dimensions.fromUnspent({ chain }).should.eql(Dimensions.sum({ nP2trScriptPathLevel1Inputs: 1 }));
      Dimensions.fromUnspent(
        { chain },
        { p2tr: { scriptPathLevel: 2 }, p2trMusig2: { scriptPathLevel: undefined } }
      ).should.eql(Dimensions.sum({ nP2trScriptPathLevel2Inputs: 1 }));
    });

    chainCodesP2trMusig2.forEach((chain) => {
      Dimensions.fromUnspent({ chain }).should.eql(Dimensions.sum({ nP2trScriptPathLevel1Inputs: 1 }));
      Dimensions.fromUnspent(
        { chain },
        { p2tr: { scriptPathLevel: undefined }, p2trMusig2: { scriptPathLevel: undefined } }
      ).should.eql(Dimensions.sum({ nP2trKeypathInputs: 1 }));
    });

    Dimensions.fromUnspents(chainCodes.map((chain) => ({ chain }))).should.eql(
      new Dimensions({
        nP2shP2wshInputs: 2,
        nP2shInputs: 2,
        nP2wshInputs: 2,
        nP2trKeypathInputs: 0,
        nP2trScriptPathLevel1Inputs: 4,
        nP2trScriptPathLevel2Inputs: 0,
        nP2shP2pkInputs: 0,
        outputs: { count: 0, size: 0 },
      })
    );
  });

  it('calculates output dimensions dynamically', function () {
    const expectedSizes = new Map([
      [UnspentTypeScript2of3.p2sh, VirtualSizes.txP2shOutputSize],
      [UnspentTypeScript2of3.p2shP2wsh, VirtualSizes.txP2shP2wshOutputSize],
      [UnspentTypeScript2of3.p2wsh, VirtualSizes.txP2wshOutputSize],
      [UnspentTypeScript2of3.p2tr, VirtualSizes.txP2trOutputSize],
      [UnspentTypeScript2of3.p2trMusig2, VirtualSizes.txP2trOutputSize],
      [UnspentTypeScript2of3.taprootKeyPathSpend, VirtualSizes.txP2trOutputSize],
      [UnspentTypePubKeyHash.p2pkh, VirtualSizes.txP2pkhOutputSize],
      [UnspentTypePubKeyHash.p2wpkh, VirtualSizes.txP2wpkhOutputSize],
    ]);

    [...Object.keys(UnspentTypeScript2of3), ...Object.keys(UnspentTypePubKeyHash)].forEach((type) =>
      getOutputDimensionsForUnspentType(type).outputs.size.should.eql(expectedSizes.get(type as any))
    );
  });
});

describe('Dimensions estimates', function () {
  it('calculates vsizes', function () {
    function dim(nP2shInputs: number, nP2shP2wshInputs: number, nP2wshInputs: number, nOutputs: number): Dimensions {
      return Dimensions.sum(
        {
          nP2shInputs,
          nP2shP2wshInputs,
          nP2wshInputs,
        },
        getOutputDimensionsForUnspentType(UnspentTypePubKeyHash.p2pkh).times(nOutputs)
      );
    }

    function dimP2tr(
      nP2trKeypathInputs: number,
      nP2trScriptPathLevel1Inputs: number,
      nP2trScriptPathLevel2Inputs: number,
      nOutputs: number
    ): Dimensions {
      return Dimensions.sum(
        {
          nP2trKeypathInputs,
          nP2trScriptPathLevel1Inputs,
          nP2trScriptPathLevel2Inputs,
        },
        getOutputDimensionsForUnspentType(UnspentTypePubKeyHash.p2pkh).times(nOutputs)
      );
    }

    const vectors: [Dimensions, unknown[]][] = [
      [dim(1, 0, 0, 1), [false, 10, 298, 34, 342]],
      [dim(0, 1, 0, 1), [true, 11, 140, 34, 185]],
      [dim(0, 0, 1, 1), [true, 11, 105, 34, 150]],
      [dim(2, 0, 0, 1), [false, 10, 596, 34, 640]],
      [dim(0, 2, 0, 1), [true, 11, 280, 34, 325]],
      [dim(0, 0, 2, 1), [true, 11, 210, 34, 255]],
      [dim(1, 1, 1, 1), [true, 11, 543, 34, 588]],
      [dim(1, 1, 1, 2), [true, 11, 543, 68, 622]],

      [dimP2tr(1, 0, 0, 1), [true, 11, 58, 34, 103]],
      [dimP2tr(0, 1, 0, 1), [true, 11, 108, 34, 153]],
      [dimP2tr(0, 0, 1, 1), [true, 11, 116, 34, 161]],
    ];

    vectors.forEach(([dimensions, props]) => {
      [
        dimensions.isSegwit(),
        dimensions.getOverheadVSize(),
        dimensions.getInputsVSize(),
        dimensions.getOutputsVSize(),
        dimensions.getVSize(),
      ].should.eql(props);
    });
  });
});
