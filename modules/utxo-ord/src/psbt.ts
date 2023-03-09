import { Network, bitgo, address } from '@bitgo/utxo-lib';
import { Dimensions, VirtualSizes } from '@bitgo/unspents';

import { OrdOutput } from './OrdOutput';
import { parseSatPoint, SatPoint } from './SatPoint';
import { SatRange } from './SatRange';
import { getOrdOutputsForLayout, OutputLayout, toArray, findOutputLayout } from './OutputLayout';

export type WalletOutputPath = {
  chain: bitgo.ChainCode;
  index: number;
};

export type WalletInputBuilder = {
  walletKeys: bitgo.RootWalletKeys;
  signer: bitgo.KeyName;
  cosigner: bitgo.KeyName;
};

export type InscriptionTransactionOutputs = {
  inscriptionRecipient: string | Buffer;
  changeOutputs: [WalletOutputPath, WalletOutputPath];
};

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
  unspents: bitgo.WalletUnspent<bigint>[],
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
 */
export function findOutputLayoutForWalletUnspents(
  inputs: bitgo.WalletUnspent<bigint>[],
  satPoint: SatPoint,
  outputs: InscriptionTransactionOutputs,
  constraints: InscriptionTransactionConstraints
): OutputLayout | undefined {
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
  return findOutputLayout(inscriptionOutput, {
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
}

export function createPsbtForSingleInscriptionPassingTransaction(
  network: Network,
  inputBuilder: WalletInputBuilder,
  unspents: bitgo.WalletUnspent<bigint>[],
  satPoint: SatPoint,
  outputs: InscriptionTransactionOutputs,
  constraints: InscriptionTransactionConstraints
): bitgo.UtxoPsbt {
  const layout = findOutputLayoutForWalletUnspents(unspents, satPoint, outputs, constraints);
  if (!layout) {
    throw new Error(`could not output layout for inscription passing transaction`);
  }
  return createPsbtFromOutputLayout(network, inputBuilder, unspents, outputs, layout);
}
