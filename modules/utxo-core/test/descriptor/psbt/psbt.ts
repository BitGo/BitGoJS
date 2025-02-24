import * as assert from 'assert';

import * as utxolib from '@bitgo/utxo-lib';
import { BIP32Interface } from '@bitgo/utxo-lib';
import { Descriptor } from '@bitgo/wasm-miniscript';

import { DescriptorTemplate, getDescriptor, getPsbtParams } from '../../../src/testutil/descriptor';
import { getFixture } from '../../../src/testutil/fixtures.utils';
import { PsbtParams, parse, DescriptorMap } from '../../../src/descriptor';
import { getKeyTriple } from '../../../src/testutil/key.utils';
import { mockPsbtDefault } from '../../../src/testutil/descriptor/mock.utils';
import { toPlainObjectFromPsbt, toPlainObjectFromTx } from '../../../src/testutil/descriptor/psbt.utils';
import { toUtxoPsbt, toWrappedPsbt } from '../../../src/descriptor/psbt';

function normalize(v: unknown): unknown {
  if (typeof v === 'bigint') {
    return v.toString();
  }
  if (v instanceof Descriptor) {
    return v.toString();
  }
  if (v instanceof Buffer) {
    return v.toString('hex');
  }
  if (v instanceof utxolib.Psbt) {
    return toPlainObjectFromPsbt(v);
  }
  if (v instanceof utxolib.Transaction) {
    return toPlainObjectFromTx(v);
  }
  if (Array.isArray(v)) {
    return v.map(normalize);
  }
  if (typeof v === 'object' && v !== null) {
    return Object.fromEntries(Object.entries(v).flatMap(([k, v]) => (v === undefined ? [] : [[k, normalize(v)]])));
  }
  return v;
}

async function assertEqualsFixture(t: string, filename: string, value: unknown) {
  filename = __dirname + '/fixtures/' + t + '.' + filename;
  const nv = normalize(value);
  assert.deepStrictEqual(nv, await getFixture(filename, nv));
}

const selfKeys = getKeyTriple('a');
const otherKeys = getKeyTriple('b');

type PsbtStage = { name: string; keys: BIP32Interface[]; final?: boolean };

type FixtureStage = {
  psbt: utxolib.bitgo.UtxoPsbt;
  networkTx?: utxolib.Transaction<bigint>;
  networkTxBuffer?: Buffer;
};

function getStages(
  psbt: utxolib.bitgo.UtxoPsbt,
  descriptorMap: DescriptorMap,
  stages: PsbtStage[]
): Record<string, FixtureStage> {
  return Object.fromEntries(
    stages.map((stage) => {
      const psbtStageWrapped = toWrappedPsbt(psbt);
      for (const key of stage.keys) {
        psbtStageWrapped.signWithXprv(key.toBase58());
      }
      const psbtStage = toUtxoPsbt(psbtStageWrapped, utxolib.networks.bitcoin);
      let psbtFinal: utxolib.bitgo.UtxoPsbt | undefined;
      let networkTx: utxolib.bitgo.UtxoTransaction<bigint> | undefined;
      let networkTxBuffer: Buffer | undefined;
      if (stage.final) {
        psbtStageWrapped.finalize();
        psbtFinal = toUtxoPsbt(psbtStageWrapped, utxolib.networks.bitcoin);
        networkTx = psbtFinal.extractTransaction();
        networkTxBuffer = networkTx.toBuffer();
      }
      return [
        stage.name,
        {
          psbt: psbtStage,
          parsed: parse(psbtStage, descriptorMap, utxolib.networks.bitcoin),
          psbtFinal,
          networkTx,
          networkTxBuffer,
        },
      ];
    })
  );
}

function describeCreatePsbt(
  name: string,
  {
    descriptorSelf,
    psbtParams,
    stages,
  }: {
    descriptorSelf: Descriptor;
    stages: PsbtStage[];
    psbtParams: Partial<PsbtParams>;
  }
) {
  describe(`createPsbt ${name}`, function () {
    it('creates psbt with expected properties', async function () {
      const psbtUnsigned = mockPsbtDefault({
        descriptorSelf,
        descriptorOther: getDescriptor('Wsh2Of3', otherKeys),
        params: psbtParams,
      });
      await assertEqualsFixture(
        name,
        'psbtStages.json',
        getStages(psbtUnsigned, new Map([['self', descriptorSelf]]), stages)
      );
    });
  });
}

function describeCreatePsbt2Of3(t: DescriptorTemplate) {
  describeCreatePsbt(t, {
    descriptorSelf: getDescriptor(t, selfKeys),
    psbtParams: getPsbtParams(t),
    stages: [
      { name: 'unsigned', keys: [] },
      { name: 'signedA', keys: selfKeys.slice(0, 1) },
      { name: 'signedAB', keys: selfKeys.slice(0, 2), final: true },
    ],
  });
}

describeCreatePsbt2Of3('Wsh2Of3');
describeCreatePsbt2Of3('Wsh2Of3CltvDrop');
describeCreatePsbt2Of3('Tr2Of3-NoKeyPath');
describeCreatePsbt('Tr1Of3-NoKeyPath-Tree', {
  descriptorSelf: getDescriptor('Tr1Of3-NoKeyPath-Tree', selfKeys),
  psbtParams: getPsbtParams('Tr1Of3-NoKeyPath-Tree'),
  stages: [
    { name: 'unsigned', keys: [] },
    { name: 'signedA', keys: selfKeys.slice(0, 1) },
    { name: 'signedB', keys: selfKeys.slice(1, 2), final: true },
  ],
});
