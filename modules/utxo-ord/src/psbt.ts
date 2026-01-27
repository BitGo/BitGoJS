import { fixedScriptWallet, Dimensions, type CoinName } from '@bitgo/wasm-utxo';

import { OrdOutput } from './OrdOutput';
import { parseSatPoint, parseOutputId, SatPoint } from './SatPoint';
import { SatRange } from './SatRange';
import { getOrdOutputsForLayout, OutputLayout, toArray, findOutputLayout } from './OutputLayout';
import { powerset } from './combinations';

type WalletKeysArg = fixedScriptWallet.WalletKeysArg;
type SignPath = fixedScriptWallet.SignPath;
const { BitGoPsbt, ChainCode } = fixedScriptWallet;

/**
 * Network type from utxo-lib for backward compatibility.
 */
type UtxolibNetwork = {
  messagePrefix?: string;
  bech32?: string;
  pubKeyHash: number;
  scriptHash: number;
  wif: number;
};

/**
 * Map utxo-lib network objects to CoinName strings.
 */
function networkToCoinName(network: UtxolibNetwork): CoinName {
  // Bitcoin mainnet
  if (network.bech32 === 'bc' && network.pubKeyHash === 0) {
    return 'btc';
  }
  // Bitcoin testnet
  if (network.bech32 === 'tb' && network.pubKeyHash === 111) {
    return 'tbtc';
  }
  throw new Error(`Unknown network: ${JSON.stringify(network)}`);
}

/**
 * Normalize network parameter - accepts either CoinName string or utxo-lib Network object.
 */
function normalizeCoinName(networkOrCoinName: CoinName | UtxolibNetwork): CoinName {
  if (typeof networkOrCoinName === 'string') {
    return networkOrCoinName;
  }
  return networkToCoinName(networkOrCoinName);
}

/** Segwit transaction overhead in virtual bytes */
const TX_SEGWIT_OVERHEAD_VSIZE = 10;

export type WalletUnspent = {
  id: string; // "txid:vout"
  value: bigint;
  chain: number;
  index: number;
};

export type WalletOutputPath = {
  chain: fixedScriptWallet.ChainCode;
  index: number;
};

export type WalletInputBuilder = {
  walletKeys: WalletKeysArg;
  signer: SignPath['signer'];
  cosigner: SignPath['cosigner'];
};

/**
 * Describes all outputs of an inscription transaction
 */
export type InscriptionTransactionOutputs = {
  inscriptionRecipient: string | Uint8Array;
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
  networkOrCoinName: CoinName | UtxolibNetwork,
  inputBuilder: WalletInputBuilder,
  unspents: WalletUnspent[],
  outputs: InscriptionTransactionOutputs,
  outputLayout: OutputLayout
): fixedScriptWallet.BitGoPsbt {
  if (unspents.length === 0) {
    throw new Error(`must provide at least one unspent`);
  }

  const coinName = normalizeCoinName(networkOrCoinName);
  const psbt = BitGoPsbt.createEmpty(coinName, inputBuilder.walletKeys);

  // Add inputs
  unspents.forEach((u) => {
    const { txid, vout } = parseOutputId(u.id);
    psbt.addWalletInput({ txid, vout, value: u.value }, inputBuilder.walletKeys, {
      scriptId: { chain: u.chain, index: u.index },
      signPath: { signer: inputBuilder.signer, cosigner: inputBuilder.cosigner },
    });
  });

  // Build ord outputs from layout
  const ordInput = OrdOutput.joinAll(unspents.map((u) => new OrdOutput(u.value)));
  const ordOutputs = getOrdOutputsForLayout(ordInput, outputLayout);

  toArray(ordOutputs).forEach((ordOutput) => {
    if (ordOutput === null) {
      return;
    }
    switch (ordOutput) {
      // skip fee output (virtual)
      case ordOutputs.feeOutput:
        return;
      // add padding/change outputs
      case ordOutputs.firstChangeOutput:
      case ordOutputs.secondChangeOutput:
        const { chain, index } =
          ordOutput === ordOutputs.firstChangeOutput ? outputs.changeOutputs[0] : outputs.changeOutputs[1];
        psbt.addWalletOutput(inputBuilder.walletKeys, { chain, index, value: ordOutput.value });
        break;
      // add actual inscription output
      case ordOutputs.inscriptionOutput:
        const recipient = outputs.inscriptionRecipient;
        if (typeof recipient === 'string') {
          psbt.addOutput(recipient, ordOutput.value);
        } else if (recipient instanceof Uint8Array) {
          psbt.addOutput(recipient, ordOutput.value);
        } else {
          throw new Error('inscriptionRecipient must be a string or Uint8Array');
        }
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

  // Calculate input vsize using wasm-utxo Dimensions
  const inputDimensions = inputs.reduce(
    (dims, input) => dims.plus(Dimensions.fromInput({ chain: input.chain })),
    Dimensions.empty()
  );
  const inputsVSize = inputDimensions.getInputVSize();

  // Calculate output vsize using wasm-utxo Dimensions
  const outputDimensions = Dimensions.fromOutput({
    scriptType: ChainCode.scriptType(outputs.changeOutputs[0].chain),
  });
  const outputVSize = outputDimensions.getOutputVSize();

  // Join all the inputs into a single inscriptionOutput.
  // For the purposes of finding a layout there is no difference.
  const inscriptionOutput = OrdOutput.joinAll(
    inputs.map((i) => new OrdOutput(i.value, i === inputs[0] ? [toSatRange(satPoint)] : []))
  );
  const layout = findOutputLayout(inscriptionOutput, {
    minChangeOutput,
    minInscriptionOutput,
    maxInscriptionOutput,
    feeFixed: getFee(TX_SEGWIT_OVERHEAD_VSIZE + inputsVSize, constraints.feeRateSatKB),
    feePerOutput: getFee(outputVSize, constraints.feeRateSatKB),
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
 * @param networkOrCoinName - Coin name (e.g., "btc", "tbtc") or utxo-lib Network object
 * @param inputBuilder
 * @param unspent
 * @param satPoint
 * @param outputs
 * @param constraints
 * @param supplementaryUnspents - additional inputs to cover fee.
 * @param [minimizeInputs=true] - try to find input combination with minimal fees. Limits supplementaryUnspents to 4.
 */
export function createPsbtForSingleInscriptionPassingTransaction(
  networkOrCoinName: CoinName | UtxolibNetwork,
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
): fixedScriptWallet.BitGoPsbt {
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

  return createPsbtFromOutputLayout(networkOrCoinName, inputBuilder, result.inputs, outputs, result.layout);
}
