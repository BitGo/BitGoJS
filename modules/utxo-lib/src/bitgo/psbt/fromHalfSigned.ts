import { PsbtInputUpdate, PartialSig } from 'bip174/src/lib/interfaces';
import { ecc as eccLib, TxOutput, taproot } from '../..';
import { UtxoTransaction } from '../UtxoTransaction';
import { parseSignatureScript } from '../parseInput';
import { getSignaturesWithPublicKeys } from '../signature';
import { hasWitnessData } from '../outputScripts';

function omitUndefined<T extends Record<string, unknown>>(v: Record<string, unknown>): T {
  return Object.fromEntries(Object.entries(v).filter(([k, v]) => v !== undefined)) as T;
}

export function getInputUpdate(
  tx: UtxoTransaction<bigint>,
  vin: number,
  prevOuts: (TxOutput<bigint> & { prevTx?: Buffer })[]
): PsbtInputUpdate {
  const nonWitnessUtxo = prevOuts[vin].prevTx;
  const { script, witness } = tx.ins[vin];
  if (script.length === 0 && witness.length === 0) {
    return nonWitnessUtxo ? { nonWitnessUtxo } : {};
  }

  const parsed = parseSignatureScript(tx.ins[vin]);

  function getPartialSigs(): PartialSig[] {
    return getSignaturesWithPublicKeys(tx, vin, prevOuts, parsed.publicKeys).flatMap((signature, i) =>
      signature
        ? [
            {
              pubkey: parsed.publicKeys[i],
              signature,
            },
          ]
        : []
    );
  }

  if (!hasWitnessData(parsed.scriptType) && !nonWitnessUtxo) {
    throw new Error(`scriptType ${parsed.scriptType} requires prevTx Buffer`);
  }

  switch (parsed.scriptType) {
    case 'p2shP2pk':
      return {
        nonWitnessUtxo,
        partialSig: [{ pubkey: parsed.publicKeys[0], signature: parsed.signatures[0] }],
      };
    case 'p2sh':
    case 'p2wsh':
    case 'p2shP2wsh':
      return omitUndefined({
        nonWitnessUtxo,
        partialSig: getPartialSigs(),
        redeemScript: parsed.redeemScript,
        witnessScript: parsed.witnessScript,
      });
    case 'p2tr':
      if (!('controlBlock' in parsed)) {
        throw new Error(`keypath not implemented`);
      }
      return {
        tapLeafScript: [
          {
            controlBlock: parsed.controlBlock,
            script: parsed.pubScript,
            leafVersion: parsed.leafVersion,
          },
        ],
        tapScriptSig: getPartialSigs().map((obj) => ({
          ...obj,
          leafHash: taproot.getTapleafHash(eccLib, parsed.controlBlock, parsed.pubScript),
        })),
      };
  }
}

/**
 * Takes a partially signed transaction and removes the scripts and signatures.
 *
 * Inputs must be one of:
 *  - p2shP2pk
 *  - p2sh 2-of-3
 *  - p2shP2wsh 2-of-3
 *  - p2wsh 2-of-3
 *  - p2tr script path 2-of-2
 *
 * @param tx the partially signed transaction
 * @param prevOuts
 *
 * @return the removed scripts and signatures, ready to be added to a PSBT
 */
export function unsign(tx: UtxoTransaction<bigint>, prevOuts: TxOutput<bigint>[]): PsbtInputUpdate[] {
  return tx.ins.map((input, vin) => {
    const update = getInputUpdate(tx, vin, prevOuts);
    input.witness = [];
    input.script = Buffer.alloc(0);
    return update;
  });
}
