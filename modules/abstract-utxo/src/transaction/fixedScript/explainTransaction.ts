import * as utxolib from '@bitgo/utxo-lib';
import { bip322 } from '@bitgo/utxo-core';
import { BIP32Interface, bip32 } from '@bitgo/secp256k1';
import { bitgo } from '@bitgo/utxo-lib';
import { ITransactionExplanation as BaseTransactionExplanation, Triple } from '@bitgo/sdk-core';
import * as utxocore from '@bitgo/utxo-core';

import type { Bip322Message } from '../../abstractUtxoCoin';
import type { Output, FixedScriptWalletOutput } from '../types';
import type { Unspent } from '../../unspent';
import { toExtendedAddressFormat } from '../recipient';
import { getPayGoVerificationPubkey } from '../getPayGoVerificationPubkey';
import { toBip32Triple } from '../../keychains';
import { getNetworkFromCoinName, UtxoCoinName } from '../../names';

// ===== Transaction Explanation Type Definitions =====

export interface AbstractUtxoTransactionExplanation<TFee = string, TChangeOutput extends Output = Output>
  extends BaseTransactionExplanation<TFee, string> {
  /** NOTE: this actually only captures external outputs */
  outputs: Output[];
  changeOutputs: TChangeOutput[];
  customChangeOutputs?: TChangeOutput[];
  customChangeAmount?: string;

  /**
   * BIP322 messages extracted from the transaction inputs.
   * These messages are used for verifying the transaction against the BIP322 standard.
   */
  messages?: Bip322Message[];
}

/** @deprecated - the signature fields are not very useful */
interface TransactionExplanationWithSignatures<TFee = string, TChangeOutput extends Output = Output>
  extends AbstractUtxoTransactionExplanation<TFee, TChangeOutput> {
  /** @deprecated - unused outside of tests */
  locktime?: number;

  /**
   * Number of input signatures per input.
   * @deprecated - this is not very useful without knowing who signed each input.
   */
  inputSignatures: number[];

  /**
   * Highest input signature count for the transaction
   * @deprecated - this is not very useful without knowing who signed each input.
   */
  signatures: number;
}

/** For our wasm backend, we do not return the deprecated fields. We set TFee to string for backwards compatibility. */
export type TransactionExplanationWasm = AbstractUtxoTransactionExplanation<string, FixedScriptWalletOutput>;

/** When parsing the legacy transaction format, we cannot always infer the fee so we set it to string | undefined */
export type TransactionExplanationUtxolibLegacy = TransactionExplanationWithSignatures<string | undefined>;

/** When parsing a PSBT, we can infer the fee so we set TFee to string. */
export type TransactionExplanationUtxolibPsbt = TransactionExplanationWithSignatures<string>;

export type TransactionExplanationDescriptor = TransactionExplanationWithSignatures<string, Output>;

export type TransactionExplanation =
  | TransactionExplanationUtxolibLegacy
  | TransactionExplanationUtxolibPsbt
  | TransactionExplanationWasm;

export type ChangeAddressInfo = {
  address: string;
  chain: number;
  index: number;
};

function toChangeOutput(
  txOutput: utxolib.TxOutput<number | bigint>,
  coinName: UtxoCoinName,
  changeInfo: ChangeAddressInfo[] | undefined
): FixedScriptWalletOutput | undefined {
  if (!changeInfo) {
    return undefined;
  }
  const address = toExtendedAddressFormat(txOutput.script, coinName);
  const change = changeInfo.find((change) => change.address === address);
  if (!change) {
    return undefined;
  }
  return {
    address,
    amount: txOutput.value.toString(),
    chain: change.chain,
    index: change.index,
    external: false,
  };
}

function outputSum(outputs: { amount: string | number }[]): bigint {
  return outputs.reduce((sum, output) => sum + BigInt(output.amount), BigInt(0));
}

function explainCommon<TNumber extends number | bigint>(
  tx: bitgo.UtxoTransaction<TNumber>,
  params: {
    changeInfo?: ChangeAddressInfo[];
    customChangeInfo?: ChangeAddressInfo[];
    feeInfo?: string;
  },
  coinName: UtxoCoinName
) {
  const displayOrder = ['id', 'outputAmount', 'changeAmount', 'outputs', 'changeOutputs'];
  const changeOutputs: FixedScriptWalletOutput[] = [];
  const customChangeOutputs: FixedScriptWalletOutput[] = [];
  const externalOutputs: Output[] = [];

  const { changeInfo, customChangeInfo } = params;

  tx.outs.forEach((currentOutput) => {
    // Try to encode the script pubkey with an address. If it fails, try to parse it as an OP_RETURN output with the prefix.
    // If that fails, then it is an unrecognized scriptPubkey and should fail
    const currentAddress = toExtendedAddressFormat(currentOutput.script, coinName);
    const currentAmount = BigInt(currentOutput.value);

    const changeOutput = toChangeOutput(currentOutput, coinName, changeInfo);
    if (changeOutput) {
      changeOutputs.push(changeOutput);
      return;
    }

    const customChangeOutput = toChangeOutput(currentOutput, coinName, customChangeInfo);
    if (customChangeOutput) {
      customChangeOutputs.push(customChangeOutput);
      return;
    }

    externalOutputs.push({
      address: currentAddress,
      amount: currentAmount.toString(),
      // If changeInfo has a length greater than or equal to zero, it means that the change information
      // was provided to the function but the output was not identified as change. In this case,
      // the output is external, and we can set it as so. If changeInfo is undefined, it means we were
      // given no information about change outputs, so we can't determine anything about the output,
      // so we leave it undefined.
      external: changeInfo ? true : undefined,
    });
  });

  const outputDetails = {
    outputs: externalOutputs,
    outputAmount: outputSum(externalOutputs).toString(),

    changeOutputs,
    changeAmount: outputSum(changeOutputs).toString(),

    customChangeAmount: outputSum(customChangeOutputs).toString(),
    customChangeOutputs,
  };

  let fee: string | undefined;
  let locktime: number | undefined;

  if (params.feeInfo) {
    displayOrder.push('fee');
    fee = params.feeInfo;
  }

  if (Number.isInteger(tx.locktime) && tx.locktime > 0) {
    displayOrder.push('locktime');
    locktime = tx.locktime;
  }

  return { displayOrder, id: tx.getId(), ...outputDetails, fee, locktime };
}

function getRootWalletKeys(params: { pubs?: bitgo.RootWalletKeys | string[] }): bitgo.RootWalletKeys | undefined {
  if (params.pubs instanceof bitgo.RootWalletKeys) {
    return params.pubs;
  }
  const keys = params.pubs?.map((xpub) => bip32.fromBase58(xpub));
  return keys && keys.length === 3 ? new bitgo.RootWalletKeys(keys as Triple<BIP32Interface>) : undefined;
}

function getPsbtInputSignaturesCount(
  psbt: bitgo.UtxoPsbt,
  params: {
    pubs?: bitgo.RootWalletKeys | string[];
  }
) {
  const rootWalletKeys = getRootWalletKeys(params);
  return rootWalletKeys
    ? bitgo.getSignatureValidationArrayPsbt(psbt, rootWalletKeys).map((sv) => sv[1].filter((v) => v).length)
    : (Array(psbt.data.inputs.length) as number[]).fill(0);
}

function getTxInputSignaturesCount<TNumber extends number | bigint>(
  tx: bitgo.UtxoTransaction<TNumber>,
  params: {
    txInfo?: { unspents?: Unspent<TNumber>[] };
    pubs?: bitgo.RootWalletKeys | string[];
  },
  coinName: UtxoCoinName
) {
  const network = getNetworkFromCoinName(coinName);
  const prevOutputs = params.txInfo?.unspents?.map((u) => bitgo.toOutput<TNumber>(u, network));
  const rootWalletKeys = getRootWalletKeys(params);
  const { unspents = [] } = params.txInfo ?? {};

  // get the number of signatures per input
  return tx.ins.map((input, idx): number => {
    if (unspents.length !== tx.ins.length) {
      return 0;
    }
    if (!prevOutputs) {
      throw new Error(`invalid state`);
    }
    if (!rootWalletKeys) {
      // no pub keys or incorrect number of pub keys
      return 0;
    }
    try {
      return bitgo.verifySignatureWithUnspent<TNumber>(tx, idx, unspents, rootWalletKeys).filter((v) => v).length;
    } catch (e) {
      // some other error occurred and we can't validate the signatures
      return 0;
    }
  });
}

function getChainAndIndexFromBip32Derivations(output: bitgo.PsbtOutput) {
  const derivations = output.bip32Derivation ?? output.tapBip32Derivation ?? undefined;
  if (!derivations) {
    return undefined;
  }
  const paths = derivations.map((d) => d.path);
  if (!paths || paths.length !== 3) {
    throw new Error('expected 3 paths in bip32Derivation or tapBip32Derivation');
  }
  if (!paths.every((p) => paths[0] === p)) {
    throw new Error('expected all paths to be the same');
  }

  paths.forEach((path) => {
    if (paths[0] !== path) {
      throw new Error(
        'Unable to get a single chain and index on the output because there are different paths for different keys'
      );
    }
  });
  return utxolib.bitgo.getChainAndIndexFromPath(paths[0]);
}

function getChangeInfo(psbt: bitgo.UtxoPsbt, walletKeys?: Triple<BIP32Interface>): ChangeAddressInfo[] | undefined {
  try {
    walletKeys = walletKeys ?? utxolib.bitgo.getSortedRootNodes(psbt);
  } catch (e) {
    if (e instanceof utxolib.bitgo.ErrorNoMultiSigInputFound) {
      return undefined;
    }
    throw e;
  }

  return utxolib.bitgo.findWalletOutputIndices(psbt, walletKeys).map((i) => {
    const derivationInformation = getChainAndIndexFromBip32Derivations(psbt.data.outputs[i]);
    if (!derivationInformation) {
      throw new Error('could not find derivation information on bip32Derivation or tapBip32Derivation');
    }
    return {
      address: utxolib.address.fromOutputScript(psbt.txOutputs[i].script, psbt.network),
      external: false,
      ...derivationInformation,
    };
  });
}

/**
 * Extract PayGo address proof information from the PSBT if present
 * @returns Information about the PayGo proof, including the output index and address
 */
function getPayGoVerificationInfo(
  psbt: bitgo.UtxoPsbt,
  coinName: UtxoCoinName
): { outputIndex: number; verificationPubkey: string } | undefined {
  let outputIndex: number | undefined = undefined;
  let address: string | undefined = undefined;
  // Check if this PSBT has any PayGo address proofs
  if (!utxocore.paygo.psbtOutputIncludesPaygoAddressProof(psbt)) {
    return undefined;
  }

  // This pulls the pubkey depending on given network
  const verificationPubkey = getPayGoVerificationPubkey(coinName);
  // find which output index that contains the PayGo proof
  outputIndex = utxocore.paygo.getPayGoAddressProofOutputIndex(psbt);
  if (outputIndex === undefined || !verificationPubkey) {
    return undefined;
  }
  const network = getNetworkFromCoinName(coinName);
  const output = psbt.txOutputs[outputIndex];
  address = utxolib.address.fromOutputScript(output.script, network);
  if (!address) {
    throw new Error(`Can not derive address ${address} Pay Go Attestation.`);
  }

  return { outputIndex, verificationPubkey };
}

/**
 * Extract the BIP322 messages and addresses from the PSBT inputs and perform
 * verification on the transaction to ensure that it meets the BIP322 requirements.
 * @returns An array of objects containing the message and address for each input,
 *          or undefined if no BIP322 messages are found.
 */
function getBip322MessageInfoAndVerify(psbt: bitgo.UtxoPsbt, coinName: UtxoCoinName): Bip322Message[] | undefined {
  const network = getNetworkFromCoinName(coinName);
  const bip322Messages: { message: string; address: string }[] = [];
  for (let i = 0; i < psbt.data.inputs.length; i++) {
    const message = bip322.getBip322ProofMessageAtIndex(psbt, i);
    if (message) {
      const input = psbt.data.inputs[i];
      if (!input.witnessUtxo) {
        throw new Error(`Missing witnessUtxo for input index ${i}`);
      }
      const scriptPubKey = input.witnessUtxo.script;

      // Verify that the toSpend transaction can be recreated in the PSBT and is encoded correctly in the nonWitnessUtxo
      const toSpend = bip322.buildToSpendTransaction(scriptPubKey, message);

      // Verify that the toSpend transaction ID matches the input's referenced transaction ID
      if (toSpend.getId() !== utxolib.bitgo.getOutputIdForInput(psbt.txInputs[i]).txid) {
        throw new Error(`ToSpend transaction ID does not match the input at index ${i}`);
      }

      // Verify the input specifics
      if (psbt.txInputs[i].sequence !== 0) {
        throw new Error(`Unexpected sequence number at input index ${i}: ${psbt.txInputs[i].sequence}. Expected 0.`);
      }
      if (psbt.txInputs[i].index !== 0) {
        throw new Error(`Unexpected input index at position ${i}: ${psbt.txInputs[i].index}. Expected 0.`);
      }

      bip322Messages.push({
        message: message.toString('utf8'),
        address: utxolib.address.fromOutputScript(scriptPubKey, network),
      });
    }
  }

  if (bip322Messages.length > 0) {
    // If there is a BIP322 message in any input, all inputs must have one.
    if (bip322Messages.length !== psbt.data.inputs.length) {
      throw new Error('Inconsistent BIP322 messages across inputs.');
    }

    // Verify the transaction specifics for BIP322
    if (psbt.version !== 0 && psbt.version !== 2) {
      throw new Error(`Unsupported PSBT version for BIP322: ${psbt.version}. Expected 0 `);
    }
    if (
      psbt.data.outputs.length !== 1 ||
      psbt.txOutputs[0].script.toString('hex') !== '6a' ||
      psbt.txOutputs[0].value !== 0n
    ) {
      throw new Error(`Invalid PSBT outputs for BIP322. Expected exactly one OP_RETURN output with zero value.`);
    }

    return bip322Messages;
  }

  return undefined;
}

/**
 * Decompose a raw psbt into useful information, such as the total amounts,
 * change amounts, and transaction outputs.
 *
 * @param psbt {bitgo.UtxoPsbt} The PSBT to explain
 * @param pubs {bitgo.RootWalletKeys | string[]} The public keys to use for the explanation
 * @param coinName {UtxoCoinName} The coin name to use for the explanation
 * @param strict {boolean} Whether to throw an error if the PayGo address proof is invalid
 */
export function explainPsbt(
  psbt: bitgo.UtxoPsbt,
  params: {
    pubs?: bitgo.RootWalletKeys | string[];
    customChangePubs?: bitgo.RootWalletKeys | string[];
  },
  coinName: UtxoCoinName,
  { strict = true }: { strict?: boolean } = {}
): TransactionExplanationUtxolibPsbt {
  const network = getNetworkFromCoinName(coinName);
  const payGoVerificationInfo = getPayGoVerificationInfo(psbt, coinName);
  if (payGoVerificationInfo) {
    try {
      utxocore.paygo.verifyPayGoAddressProof(
        psbt,
        payGoVerificationInfo.outputIndex,
        bip32.fromBase58(payGoVerificationInfo.verificationPubkey, utxolib.networks.bitcoin).publicKey
      );
    } catch (e) {
      if (strict) {
        throw e;
      }
      console.error(e);
    }
  }

  const messages = getBip322MessageInfoAndVerify(psbt, coinName);
  const changeInfo = getChangeInfo(psbt);
  const customChangeInfo = params.customChangePubs
    ? getChangeInfo(psbt, toBip32Triple(params.customChangePubs))
    : undefined;
  const tx = psbt.getUnsignedTx();
  const common = explainCommon(tx, { ...params, changeInfo, customChangeInfo }, coinName);
  const inputSignaturesCount = getPsbtInputSignaturesCount(psbt, params);

  // Set fee from subtracting inputs from outputs
  const outputAmount = psbt.txOutputs.reduce((cumulative, curr) => cumulative + BigInt(curr.value), BigInt(0));
  const inputAmount = psbt.txInputs.reduce((cumulative, txInput, i) => {
    const data = psbt.data.inputs[i];
    if (data.witnessUtxo) {
      return cumulative + BigInt(data.witnessUtxo.value);
    } else if (data.nonWitnessUtxo) {
      const tx = bitgo.createTransactionFromBuffer<bigint>(data.nonWitnessUtxo, network, { amountType: 'bigint' });
      return cumulative + BigInt(tx.outs[txInput.index].value);
    } else {
      throw new Error('could not find value on input');
    }
  }, BigInt(0));

  return {
    ...common,
    fee: (inputAmount - outputAmount).toString(),
    inputSignatures: inputSignaturesCount,
    signatures: inputSignaturesCount.reduce((prev, curr) => (curr > prev ? curr : prev), 0),
    messages,
  };
}

export function explainLegacyTx<TNumber extends number | bigint>(
  tx: bitgo.UtxoTransaction<TNumber>,
  params: {
    pubs?: string[];
    txInfo?: { unspents?: Unspent<TNumber>[] };
    changeInfo?: { address: string; chain: number; index: number }[];
  },
  coinName: UtxoCoinName
): TransactionExplanationUtxolibLegacy {
  const common = explainCommon(tx, params, coinName);
  const inputSignaturesCount = getTxInputSignaturesCount(tx, params, coinName);
  return {
    ...common,
    inputSignatures: inputSignaturesCount,
    signatures: inputSignaturesCount.reduce((prev, curr) => (curr > prev ? curr : prev), 0),
  };
}
