import { Descriptor, Miniscript } from '@bitgo/wasm-utxo';
import * as utxolib from '@bitgo/utxo-lib';

import {
  PsbtParams,
  createPsbt,
  createScriptPubKeyFromDescriptor,
  DerivedDescriptorTransactionInput,
} from '../../descriptor';

import { DescriptorTemplate, getDefaultXPubs, getDescriptor } from './descriptors';

type MockOutputIdParams = { hash?: string; vout?: number };

type BaseMockDescriptorOutputParams = {
  id?: MockOutputIdParams;
  index?: number;
  value?: bigint;
  sequence?: number;
  selectTapLeafScript?: Miniscript;
};

function mockOutputId(id?: MockOutputIdParams): {
  hash: string;
  vout: number;
} {
  const hash = id?.hash ?? Buffer.alloc(32, 1).toString('hex');
  const vout = id?.vout ?? 0;
  return { hash, vout };
}

export function mockDerivedDescriptorWalletOutput(
  descriptor: Descriptor,
  outputParams: BaseMockDescriptorOutputParams = {}
): DerivedDescriptorTransactionInput {
  const { value = BigInt(1e6) } = outputParams;
  const { hash, vout } = mockOutputId(outputParams.id);
  return {
    hash,
    index: vout,
    witnessUtxo: {
      script: createScriptPubKeyFromDescriptor(descriptor, undefined),
      value,
    },
    descriptor,
    selectTapLeafScript: outputParams.selectTapLeafScript,
    sequence: outputParams.sequence,
  };
}

type MockInput = BaseMockDescriptorOutputParams & {
  index: number;
  descriptor: Descriptor;
  selectTapLeafScript?: Miniscript;
};

type MockOutput = {
  descriptor: Descriptor;
  index: number;
  value: bigint;
  external?: boolean;
};

function tryDeriveAtIndex(descriptor: Descriptor, index: number): Descriptor {
  return descriptor.hasWildcard() ? descriptor.atDerivationIndex(index) : descriptor;
}

export function mockPsbt(
  inputs: MockInput[],
  outputs: MockOutput[],
  params: Partial<PsbtParams> = {}
): utxolib.bitgo.UtxoPsbt {
  return createPsbt(
    { ...params, network: params.network ?? utxolib.networks.bitcoin },
    inputs.map((i) => mockDerivedDescriptorWalletOutput(tryDeriveAtIndex(i.descriptor, i.index), i)),
    outputs.map((o) => {
      const derivedDescriptor = tryDeriveAtIndex(o.descriptor, o.index);
      return {
        script: createScriptPubKeyFromDescriptor(derivedDescriptor, undefined),
        value: o.value,
        descriptor: o.external ? undefined : derivedDescriptor,
      };
    })
  );
}

export function mockPsbtDefault({
  descriptorSelf = getDescriptor('Wsh2Of3', getDefaultXPubs('a')),
  descriptorOther = getDescriptor('Wsh2Of3', getDefaultXPubs('b')),
  params = {},
}: {
  descriptorSelf?: Descriptor;
  descriptorOther?: Descriptor;
  params?: Partial<PsbtParams>;
} = {}): utxolib.bitgo.UtxoPsbt {
  return mockPsbt(
    [
      { descriptor: descriptorSelf, index: 0 },
      { descriptor: descriptorSelf, index: 1, id: { vout: 1 } },
    ],
    [
      { descriptor: descriptorOther, index: 0, value: BigInt(4e5), external: true },
      { descriptor: descriptorSelf, index: 0, value: BigInt(4e5) },
    ],
    params
  );
}

export function mockPsbtDefaultWithDescriptorTemplate(
  t: DescriptorTemplate,
  params: Partial<PsbtParams> = {}
): utxolib.bitgo.UtxoPsbt {
  return mockPsbtDefault({
    descriptorSelf: getDescriptor(t, getDefaultXPubs('a')),
    descriptorOther: getDescriptor(t, getDefaultXPubs('b')),
    params,
  });
}
