import assert from 'assert';

import * as utxolib from '@bitgo/utxo-lib';
import { PartialSig, WitnessUtxo } from 'bip174/src/lib/interfaces';
import { Descriptor, Miniscript, ast } from '@bitgo/wasm-utxo';
import { findTapLeafScript, toUtxoPsbt, toWrappedPsbt } from '@bitgo/utxo-core/descriptor';

import { parseStakingDescriptor } from '../parseDescriptor';

/**
 * Adds covenant signatures to a PSBT input.
 */
function addCovenantSignatures(psbt: utxolib.bitgo.UtxoPsbt, inputIndex: number, signatures: PartialSig[]): void {
  const input = psbt.data.inputs[inputIndex];
  assert(input.tapLeafScript, 'Input must have tapLeafScript');
  assert(input.tapLeafScript.length === 1, 'Input must have exactly one tapLeafScript');
  const [{ controlBlock, script }] = input.tapLeafScript;
  const leafHash = utxolib.taproot.getTapleafHash(utxolib.ecc, controlBlock, script);
  psbt.updateInput(inputIndex, { tapScriptSig: signatures.map((s) => ({ ...s, leafHash })) });
}

/**
 * Asserts that the provided signatures are valid for the given PSBT input.
 */
export function assertValidSignatures(
  psbt: utxolib.bitgo.UtxoPsbt,
  inputIndex: number,
  signatures: PartialSig[]
): void {
  signatures.forEach((s) => {
    assert(
      psbt.validateTaprootSignaturesOfInput(inputIndex, s.pubkey),
      `Signature validation failed for ${s.pubkey.toString('hex')}`
    );
  });
}

function getUnbondingScript(stakingDescriptor: Descriptor): Miniscript {
  const parsedDescriptor = parseStakingDescriptor(stakingDescriptor);
  assert(parsedDescriptor, 'Invalid staking descriptor');
  return Miniscript.fromString(ast.formatNode(parsedDescriptor.unbondingMiniscriptNode), 'tap');
}

/**
 * @return unsigned PSBT for an unbonding transaction
 */
export function toUnbondingPsbt(
  tx: utxolib.bitgo.UtxoTransaction<bigint>,
  witnessUtxo: WitnessUtxo,
  stakingDescriptor: Descriptor,
  network: utxolib.Network
): utxolib.bitgo.UtxoPsbt {
  const unbondingScript = getUnbondingScript(stakingDescriptor);
  const psbt = new utxolib.Psbt({ network });
  psbt.setVersion(tx.version);
  psbt.setLocktime(tx.locktime);
  psbt.addOutputs(
    tx.outs.map((output) => ({
      script: output.script,
      value: BigInt(output.value),
    }))
  );
  assert(tx.ins.length === 1);
  const input = tx.ins[0];
  psbt.addInput({
    hash: input.hash,
    index: input.index,
    sequence: input.sequence,
    witnessUtxo,
  });
  const wrappedPsbt = toWrappedPsbt(psbt);
  wrappedPsbt.updateInputWithDescriptor(0, stakingDescriptor);
  const unwrapped = toUtxoPsbt(wrappedPsbt, network);
  assert(unwrapped.data.inputs.length === 1, 'Unbonding transaction must have exactly one input');
  const unwrappedInputData = unwrapped.data.inputs[0];
  assert(unwrappedInputData.tapLeafScript);
  const unwrappedUnbond = findTapLeafScript(unwrappedInputData.tapLeafScript, unbondingScript);
  unwrappedInputData.tapLeafScript = [unwrappedUnbond];
  return unwrapped;
}

/**
 * @return PSBT for an unbonding transaction with signatures
 */
export function toUnbondingPsbtWithSignatures(
  tx: utxolib.bitgo.UtxoTransaction<bigint>,
  witnessUtxo: WitnessUtxo,
  stakingDescriptor: Descriptor,
  signatures: PartialSig[],
  network: utxolib.Network
): utxolib.bitgo.UtxoPsbt {
  const psbt = toUnbondingPsbt(tx, witnessUtxo, stakingDescriptor, network);
  assert(psbt.data.inputs.length === 1, 'Unbonding transaction must have exactly one input');
  addCovenantSignatures(psbt, 0, signatures);
  assertValidSignatures(psbt, 0, signatures);
  return psbt;
}
