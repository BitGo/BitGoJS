import * as utxolib from '@bitgo/utxo-lib';
import { bip322 } from '@bitgo/utxo-core';
import { bip32, BIP32Interface, bitgo } from '@bitgo/utxo-lib';
import { Triple } from '@bitgo/sdk-core';
import * as utxocore from '@bitgo/utxo-core';

import { Output, TransactionExplanation, Bip322Message, FixedScriptWalletOutput } from '../../abstractUtxoCoin';
import { toExtendedAddressFormat } from '../recipient';
import { getPayGoVerificationPubkey } from '../getPayGoVerificationPubkey';

export type ChangeAddressInfo = {
  address: string;
  chain: number;
  index: number;
};

function explainCommon<TNumber extends number | bigint>(
  tx: bitgo.UtxoTransaction<TNumber>,
  params: {
    changeInfo?: ChangeAddressInfo[];
    feeInfo?: string;
  },
  network: utxolib.Network
) {
  const displayOrder = ['id', 'outputAmount', 'changeAmount', 'outputs', 'changeOutputs'];
  let spendAmount = BigInt(0);
  let changeAmount = BigInt(0);
  const changeOutputs: FixedScriptWalletOutput[] = [];
  const outputs: Output[] = [];

  const { changeInfo } = params;
  const changeAddresses = changeInfo?.map((info) => info.address) ?? [];

  tx.outs.forEach((currentOutput) => {
    // Try to encode the script pubkey with an address. If it fails, try to parse it as an OP_RETURN output with the prefix.
    // If that fails, then it is an unrecognized scriptPubkey and should fail
    const currentAddress = toExtendedAddressFormat(currentOutput.script, network);
    const currentAmount = BigInt(currentOutput.value);

    if (changeAddresses.includes(currentAddress)) {
      // this is change
      changeAmount += currentAmount;
      const change = changeInfo?.find((change) => change.address === currentAddress);

      if (!change) {
        throw new Error('changeInfo must have change information for all change outputs');
      }
      changeOutputs.push({
        address: currentAddress,
        amount: currentAmount.toString(),
        chain: change.chain,
        index: change.index,
        external: false,
      });
      return;
    }

    spendAmount += currentAmount;
    outputs.push({
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
    outputAmount: spendAmount.toString(),
    changeAmount: changeAmount.toString(),
    outputs,
    changeOutputs,
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

function getRootWalletKeys(params: { pubs?: string[] }) {
  const keys = params.pubs?.map((xpub) => bip32.fromBase58(xpub));
  return keys && keys.length === 3 ? new bitgo.RootWalletKeys(keys as Triple<BIP32Interface>) : undefined;
}

function getPsbtInputSignaturesCount(
  psbt: bitgo.UtxoPsbt,
  params: {
    pubs?: string[];
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
    txInfo?: { unspents?: bitgo.Unspent<TNumber>[] };
    pubs?: string[];
  },
  network: utxolib.Network
) {
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

/**
 * Decompose a raw psbt into useful information, such as the total amounts,
 * change amounts, and transaction outputs.
 */
export function explainPsbt<TNumber extends number | bigint, Tx extends bitgo.UtxoTransaction<bigint>>(
  psbt: bitgo.UtxoPsbt<Tx>,
  params: {
    pubs?: string[];
    txInfo?: { unspents?: bitgo.Unspent<TNumber>[] };
  },
  network: utxolib.Network,
  { strict = false }: { strict?: boolean } = {}
): TransactionExplanation {
  const txOutputs = psbt.txOutputs;
  const txInputs = psbt.txInputs;

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

  function getChangeInfo() {
    try {
      return utxolib.bitgo.findInternalOutputIndices(psbt).map((i) => {
        const derivationInformation = getChainAndIndexFromBip32Derivations(psbt.data.outputs[i]);
        if (!derivationInformation) {
          throw new Error('could not find derivation information on bip32Derivation or tapBip32Derivation');
        }
        return {
          address: utxolib.address.fromOutputScript(txOutputs[i].script, network),
          external: false,
          ...derivationInformation,
        };
      });
    } catch (e) {
      if (e instanceof utxolib.bitgo.ErrorNoMultiSigInputFound) {
        return undefined;
      }
      throw e;
    }
  }

  /**
   * Extract PayGo address proof information from the PSBT if present
   * @returns Information about the PayGo proof, including the output index and address
   */
  function getPayGoVerificationInfo(): { outputIndex: number; verificationPubkey: string } | undefined {
    let outputIndex: number | undefined = undefined;
    let address: string | undefined = undefined;
    // Check if this PSBT has any PayGo address proofs
    if (!utxocore.paygo.psbtOutputIncludesPaygoAddressProof(psbt)) {
      return undefined;
    }

    // This pulls the pubkey depending on given network
    const verificationPubkey = getPayGoVerificationPubkey(network);
    // find which output index that contains the PayGo proof
    outputIndex = utxocore.paygo.getPayGoAddressProofOutputIndex(psbt);
    if (outputIndex === undefined || !verificationPubkey) {
      return undefined;
    }
    const output = txOutputs[outputIndex];
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
  function getBip322MessageInfoAndVerify(): Bip322Message[] | undefined {
    const bip322Messages: { message: string; address: string }[] = [];
    for (let i = 0; i < psbt.data.inputs.length; i++) {
      const message = bip322.getBip322ProofMessageAtIndex(psbt, i);
      if (message) {
        const input = psbt.data.inputs[i];
        if (!input.witnessUtxo) {
          throw new Error(`Missing witnessUtxo for input index ${i}`);
        }
        if (!input.nonWitnessUtxo) {
          throw new Error(`Missing nonWitnessUtxo for input index ${i}`);
        }
        const scriptPubKey = input.witnessUtxo.script;

        // Verify that the toSpend transaction can be recreated in the PSBT and is encoded correctly in the nonWitnessUtxo
        const toSpend = bip322.buildToSpendTransaction(scriptPubKey, message);
        const toSpendB64 = toSpend.toBuffer().toString('base64');
        if (input.nonWitnessUtxo.toString('base64') !== toSpendB64) {
          throw new Error(`Non-witness UTXO does not match the expected toSpend transaction at input index ${i}`);
        }

        // Verify that the toSpend transaction ID matches the input's referenced transaction ID
        if (toSpend.getId() !== utxolib.bitgo.getOutputIdForInput(txInputs[i]).txid) {
          throw new Error(`ToSpend transaction ID does not match the input at index ${i}`);
        }

        // Verify the input specifics
        if (txInputs[i].sequence !== 0) {
          throw new Error(`Unexpected sequence number at input index ${i}: ${txInputs[i].sequence}. Expected 0.`);
        }
        if (txInputs[i].index !== 0) {
          throw new Error(`Unexpected input index at position ${i}: ${txInputs[i].index}. Expected 0.`);
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
      if (psbt.data.outputs.length !== 1 || txOutputs[0].script.toString('hex') !== '6a' || txOutputs[0].value !== 0n) {
        throw new Error(`Invalid PSBT outputs for BIP322. Expected exactly one OP_RETURN output with zero value.`);
      }

      return bip322Messages;
    }

    return undefined;
  }

  const payGoVerificationInfo = getPayGoVerificationInfo();
  if (payGoVerificationInfo) {
    try {
      utxocore.paygo.verifyPayGoAddressProof(
        psbt,
        payGoVerificationInfo.outputIndex,
        utxolib.bip32.fromBase58(payGoVerificationInfo.verificationPubkey, utxolib.networks.bitcoin).publicKey
      );
    } catch (e) {
      if (strict) {
        throw e;
      }
      console.error(e);
    }
  }

  const messages = getBip322MessageInfoAndVerify();
  const changeInfo = getChangeInfo();
  const tx = psbt.getUnsignedTx() as bitgo.UtxoTransaction<TNumber>;
  const common = explainCommon(tx, { ...params, changeInfo }, network);
  const inputSignaturesCount = getPsbtInputSignaturesCount(psbt, params);

  // Set fee from subtracting inputs from outputs
  const outputAmount = txOutputs.reduce((cumulative, curr) => cumulative + BigInt(curr.value), BigInt(0));
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
  } as TransactionExplanation;
}

export function explainLegacyTx<TNumber extends number | bigint>(
  tx: bitgo.UtxoTransaction<TNumber>,
  params: {
    pubs?: string[];
    txInfo?: { unspents?: bitgo.Unspent<TNumber>[] };
    changeInfo?: { address: string; chain: number; index: number }[];
  },
  network: utxolib.Network
): TransactionExplanation {
  const common = explainCommon(tx, params, network);
  const inputSignaturesCount = getTxInputSignaturesCount(tx, params, network);
  return {
    ...common,
    inputSignatures: inputSignaturesCount,
    signatures: inputSignaturesCount.reduce((prev, curr) => (curr > prev ? curr : prev), 0),
  } as TransactionExplanation;
}
