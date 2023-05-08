import { Network, bitgo, address } from '@bitgo/utxo-lib';
import { Dimensions, VirtualSizes } from '@bitgo/unspents';

import { OrdOutput } from './OrdOutput';
import { parseSatPoint, SatPoint } from './SatPoint';
import { SatRange } from './SatRange';
import { getOrdOutputsForLayout, OutputLayout, toArray, findOutputLayout } from './OutputLayout';
import { powerset } from './combinations';

type WalletUnspent = bitgo.WalletUnspent<bigint>;

export type WalletOutputPath = {
  chain: bitgo.ChainCode;
  index: number;
};

export type WalletInputBuilder = {
  walletKeys: bitgo.RootWalletKeys;
  signer: bitgo.KeyName;
  cosigner: bitgo.KeyName;
};

/**
 * Describes all outputs of an inscription transaction
 */
export type InscriptionTransactionOutputs = {
  inscriptionRecipient: string | Buffer;
  changeOutputs: [WalletOutputPath, WalletOutputPath];
};

/** @deprecated */
export type InscriptionOutputs = InscriptionTransactionOutputs;

export type InscriptionTransactionConstraints = {
  feeRateSatKB: number;
  minChangeOutput?: bigint;
  minInscriptionOutput?: bigint;
  maxInscriptionOutput?: bigint;
};

export const DefaultInscriptionConstraints = {
  minChangeOutput: BigInt(10_000),
  minInscriptionOutput: BigInt(10_000),
  maxInscriptionOutput: BigInt(20_000),
};

export function createPsbtFromOutputLayout(
  network: Network,
  inputBuilder: WalletInputBuilder,
  unspents: WalletUnspent[],
  outputs: InscriptionTransactionOutputs,
  outputLayout: OutputLayout
): bitgo.UtxoPsbt {
  const psbt = bitgo.createPsbtForNetwork({ network: network });
  if (unspents.length === 0) {
    throw new Error(`must provide at least one unspent`);
  }
  unspents.forEach((u) =>
    bitgo.addWalletUnspentToPsbt(
      psbt,
      u,
      inputBuilder.walletKeys,
      inputBuilder.signer,
      inputBuilder.cosigner,
      psbt.network
    )
  );
  const ordInput = OrdOutput.joinAll(unspents.map((u) => new OrdOutput(u.value)));
  const ordOutputs = getOrdOutputsForLayout(ordInput, outputLayout);
  toArray(ordOutputs).forEach((ordOutput) => {
    if (ordOutput === null) {
      return;
    }
    switch (ordOutput) {
      // skip padding outputs and fee output (virtual)
      case null:
      case ordOutputs.feeOutput:
        return;
      // add padding outputs
      case ordOutputs.firstChangeOutput:
      case ordOutputs.secondChangeOutput:
        const { chain, index } =
          ordOutput === ordOutputs.firstChangeOutput ? outputs.changeOutputs[0] : outputs.changeOutputs[1];
        bitgo.addWalletOutputToPsbt(psbt, inputBuilder.walletKeys, chain, index, ordOutput.value);
        break;
      // add actual inscription output
      case ordOutputs.inscriptionOutput:
        let { inscriptionRecipient } = outputs;
        if (typeof inscriptionRecipient === 'string') {
          inscriptionRecipient = address.toOutputScript(inscriptionRecipient, network);
        }
        psbt.addOutput({
          script: inscriptionRecipient,
          value: ordOutput.value,
        });
        break;
    }
  });
  return psbt;
}

function toSatRange(p: SatPoint) {
  const { offset } = parseSatPoint(p);
  return new SatRange(offset, offset);
}

function getFee(vsize: number, rateSatPerKB: number): bigint {
  return BigInt(Math.ceil((vsize * rateSatPerKB) / 1000));
}

/**
 * @param inputs - inscription input must come first
 * @param satPoint - location of the inscription
 * @param outputs
 * @param constraints
 * @param minimizeInputs
 */
export function findOutputLayoutForWalletUnspents(
  inputs: WalletUnspent[],
  satPoint: SatPoint,
  outputs: InscriptionTransactionOutputs,
  constraints: InscriptionTransactionConstraints,
  { minimizeInputs = false } = {}
): { inputs: WalletUnspent[]; layout: OutputLayout } | undefined {
  if (minimizeInputs) {
    return findSmallestOutputLayoutForWalletUnspents(inputs, satPoint, outputs, constraints);
  }

  if (inputs.length === 0) {
    throw new Error(`must provide at least one input`);
  }

  if (outputs.changeOutputs[0].chain !== outputs.changeOutputs[1].chain) {
    // otherwise our fee calc is too complicated
    throw new Error(`wallet outputs must be on same chain`);
  }

  const {
    minChangeOutput = DefaultInscriptionConstraints.minChangeOutput,
    minInscriptionOutput = DefaultInscriptionConstraints.minInscriptionOutput,
    maxInscriptionOutput = DefaultInscriptionConstraints.maxInscriptionOutput,
  } = constraints;

  // Join all the inputs into a single inscriptionOutput.
  // For the purposes of finding a layout there is no difference.
  const inscriptionOutput = OrdOutput.joinAll(
    inputs.map((i) => new OrdOutput(i.value, i === inputs[0] ? [toSatRange(satPoint)] : []))
  );
  const layout = findOutputLayout(inscriptionOutput, {
    minChangeOutput,
    minInscriptionOutput,
    maxInscriptionOutput,
    feeFixed: getFee(
      VirtualSizes.txSegOverheadVSize + Dimensions.fromUnspents(inputs).getInputsVSize(),
      constraints.feeRateSatKB
    ),
    feePerOutput: getFee(
      Dimensions.fromOutputOnChain(outputs.changeOutputs[0].chain).getOutputsVSize(),
      constraints.feeRateSatKB
    ),
  });

  return layout ? { inputs, layout } : undefined;
}

export const MAX_UNSPENTS_FOR_OUTPUT_LAYOUT = 5;

/**
 * @param inputs - inscription input must come first
 * @param satPoint - location of the inscription
 * @param outputs
 * @param constraints
 */
function findSmallestOutputLayoutForWalletUnspents(
  inputs: WalletUnspent[],
  satPoint: SatPoint,
  outputs: InscriptionTransactionOutputs,
  constraints: InscriptionTransactionConstraints
): { inputs: WalletUnspent[]; layout: OutputLayout } | undefined {
  if (MAX_UNSPENTS_FOR_OUTPUT_LAYOUT < inputs.length) {
    throw new Error(`input array is too large`);
  }
  // create powerset of all supplementary inputs and find the cheapest result
  const inputsArr = [inputs, ...powerset(inputs.slice(1)).map((s) => [inputs[0], ...s])];
  return inputsArr
    .map((inputs) => findOutputLayoutForWalletUnspents(inputs, satPoint, outputs, constraints))
    .reduce((best, next) => {
      if (best === undefined) {
        return next;
      }
      if (next === undefined) {
        return best;
      }
      return best.layout.feeOutput < next.layout.feeOutput ? best : next;
    });
}

export class ErrorNoLayout extends Error {
  constructor() {
    super('Could not find output layout for inscription passing transaction');
  }
}

/**
 * @param network
 * @param inputBuilder
 * @param unspent
 * @param satPoint
 * @param outputs
 * @param constraints
 * @param supplementaryUnspents - additional inputs to cover fee.
 * @param [minimizeInputs=true] - try to find input combination with minimal fees. Limits supplementaryUnspents to 4.
 */
export function createPsbtForSingleInscriptionPassingTransaction(
  network: Network,
  inputBuilder: WalletInputBuilder,
  unspent: WalletUnspent | WalletUnspent[],
  satPoint: SatPoint,
  outputs: InscriptionTransactionOutputs,
  constraints: InscriptionTransactionConstraints,
  {
    supplementaryUnspents = [],
    minimizeInputs = true,
  }: {
    supplementaryUnspents?: WalletUnspent[];
    minimizeInputs?: boolean;
  } = {}
): bitgo.UtxoPsbt {
  // support for legacy call style
  if (Array.isArray(unspent)) {
    if (unspent.length !== 1) {
      throw new Error(`can only pass single unspent`);
    }
    unspent = unspent[0];
  }

  const result = findOutputLayoutForWalletUnspents(
    [unspent, ...supplementaryUnspents],
    satPoint,
    outputs,
    constraints,
    { minimizeInputs }
  );

  if (!result) {
    throw new ErrorNoLayout();
  }

  return createPsbtFromOutputLayout(network, inputBuilder, result.inputs, outputs, result.layout);
}
