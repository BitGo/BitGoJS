import assert from 'assert';

import * as utxolib from '@bitgo/utxo-lib';
import { BIP32Interface, ECPair, ECPairInterface } from '@bitgo/utxo-lib';
import { Descriptor, Miniscript } from '@bitgo/wasm-miniscript';

import { PsbtParams, parse, toUtxoPsbt, toWrappedPsbt, ParsedDescriptorTransaction } from '../../../src/descriptor';
import { getFixture, getKeyTriple } from '../../../src/testutil';
import {
  containsKey,
  DescriptorTemplate,
  getDescriptor,
  getPsbtParams,
  getTapLeafScripts,
  mockPsbt,
  mockPsbtDefault,
  toPlainObjectFromPsbt,
  toPlainObjectFromTx,
} from '../../../src/testutil/descriptor';
import { getNewSignatureCount, signWithKey } from '../../../src/descriptor/psbt/sign';

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

function toPlain(k: BIP32Interface): ECPairInterface {
  assert.ok(k.privateKey);
  return ECPair.fromPrivateKey(k.privateKey);
}

type PsbtStage = {
  name: string;
  keys: (BIP32Interface | ECPairInterface)[];
  final?: boolean;
};

type FixtureStage = {
  psbt: utxolib.bitgo.UtxoPsbt;
  networkTx?: utxolib.Transaction<bigint>;
  networkTxBuffer?: Buffer;
};

function getStages(
  psbt: utxolib.bitgo.UtxoPsbt,
  parsed: ParsedDescriptorTransaction,
  stages: PsbtStage[]
): Record<string, FixtureStage> {
  return Object.fromEntries(
    stages.map((stage) => {
      const psbtStageWrapped = toWrappedPsbt(psbt);
      for (const key of stage.keys) {
        assert(getNewSignatureCount(signWithKey(psbtStageWrapped, key)) > 0, 'No new signatures were created');
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
          parsed,
          psbtFinal,
          networkTx,
          networkTxBuffer,
        },
      ];
    })
  );
}

type TestParams = {
  descriptorSelf: Descriptor;
  stages: PsbtStage[];
} & (
  | {
      psbtParams: Partial<PsbtParams>;
    }
  | {
      psbt: utxolib.bitgo.UtxoPsbt;
    }
);

function describeCreatePsbt(name: string, testParams: TestParams) {
  describe(`createPsbt ${name}`, function () {
    it('creates psbt with expected properties', async function () {
      const psbtUnsigned =
        'psbt' in testParams
          ? testParams.psbt
          : mockPsbtDefault({
              descriptorSelf: testParams.descriptorSelf,
              descriptorOther: getDescriptor('Wsh2Of3', otherKeys),
              params: testParams.psbtParams,
            });
      const descriptorMap = new Map([['self', testParams.descriptorSelf]]);
      const parsed = parse(psbtUnsigned, descriptorMap, utxolib.networks.bitcoin);
      assert.strictEqual(parsed.spendAmount, psbtUnsigned.txOutputs[1].value);
      await assertEqualsFixture(name, 'psbtStages.json', getStages(psbtUnsigned, parsed, testParams.stages));
    });
  });
}

const defaultStagesCombinedAB: PsbtStage[] = [
  { name: 'unsigned', keys: [] },
  { name: 'signedA', keys: selfKeys.slice(0, 1) },
  { name: 'signedAB', keys: selfKeys.slice(0, 2), final: true },
];

function getDefaultStagesSeparateAB({ plain = false } = {}): PsbtStage[] {
  const keys = plain ? selfKeys.map(toPlain) : selfKeys;
  return [
    { name: 'unsigned', keys: [] },
    { name: 'signedA', keys: keys.slice(0, 1) },
    { name: 'signedB', keys: keys.slice(1, 2), final: true },
  ];
}

function describeCreatePsbt2Of3(t: DescriptorTemplate) {
  describeCreatePsbt(t, {
    descriptorSelf: getDescriptor(t, selfKeys),
    psbtParams: getPsbtParams(t),
    stages: defaultStagesCombinedAB,
  });
}

function describeCreatePsbtSelectTapLeafScript(
  t: DescriptorTemplate,
  selfDescriptor: Descriptor,
  selectTapLeafScript: Miniscript,
  tapLeafName: string
) {
  const otherDescriptor = getDescriptor('Wsh2Of3', otherKeys);
  const signKeys = selfKeys.filter((k) => containsKey(selectTapLeafScript, k)).map((k) => toPlain(k));
  assert(signKeys.length === 1);
  describeCreatePsbt(`${t}-${tapLeafName}`, {
    descriptorSelf: selfDescriptor,
    psbt: mockPsbt(
      [
        { descriptor: selfDescriptor, index: 0, selectTapLeafScript },
        { descriptor: selfDescriptor, index: 1, id: { vout: 1 }, selectTapLeafScript },
      ],
      [
        {
          descriptor: otherDescriptor,
          index: 0,
          value: BigInt(4e5),
          external: true,
        },
        { descriptor: selfDescriptor, index: 0, value: BigInt(4e5) },
      ]
    ),
    stages: [
      { name: 'unsigned', keys: [] },
      { name: 'signed', keys: signKeys },
    ],
  });
}

describeCreatePsbt2Of3('Wsh2Of3');
describeCreatePsbt2Of3('Wsh2Of3CltvDrop');
describeCreatePsbt2Of3('Tr2Of3-NoKeyPath');
describeCreatePsbt('Tr1Of3-NoKeyPath-Tree', {
  descriptorSelf: getDescriptor('Tr1Of3-NoKeyPath-Tree', selfKeys),
  psbtParams: {},
  stages: getDefaultStagesSeparateAB(),
});

{
  const t: DescriptorTemplate = 'Tr1Of3-NoKeyPath-Tree-Plain';
  const selfDescriptor = getDescriptor(t, selfKeys);
  getTapLeafScripts(selfDescriptor).forEach((selectTapLeafScript, i) => {
    describeCreatePsbtSelectTapLeafScript(
      t,
      selfDescriptor,
      Miniscript.fromString(selectTapLeafScript, 'tap'),
      `TapLeafScript${i}`
    );
  });
}

describeCreatePsbt('Tr1Of3-NoKeyPath-Tree-PlainKeys', {
  descriptorSelf: getDescriptor('Tr1Of3-NoKeyPath-Tree-Plain', selfKeys),
  psbtParams: {},
  stages: getDefaultStagesSeparateAB({ plain: true }),
});

{
  const descriptorSelf = getDescriptor('Wsh2Of3', selfKeys);
  const descriptorOther = getDescriptor('Wsh2Of3', otherKeys);
  describeCreatePsbt('Wsh2Of3-CustomInputSequence', {
    descriptorSelf,
    psbt: mockPsbt(
      [
        { descriptor: descriptorSelf, index: 0 },
        { descriptor: descriptorSelf, index: 1, id: { vout: 1 }, sequence: 123 },
      ],
      [
        {
          descriptor: descriptorOther,
          index: 0,
          value: BigInt(4e5),
          external: true,
        },
        { descriptor: descriptorSelf, index: 0, value: BigInt(4e5) },
      ]
    ),
    stages: defaultStagesCombinedAB,
  });
}
