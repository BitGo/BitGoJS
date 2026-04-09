import * as assert from 'assert';
import { PsbtInputUpdate, PartialSig } from 'bip174/src/lib/interfaces';
import { ecc as eccLib, TxOutput, taproot, getMainnet, networks } from '../..';
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

  const parsedInput = parseSignatureScript(tx.ins[vin]);
  assert.ok(parsedInput.scriptType !== 'taprootKeyPathSpend');

  function getPartialSigs(): PartialSig[] {
    assert.ok(parsedInput.scriptType !== 'taprootKeyPathSpend');
    return getSignaturesWithPublicKeys(tx, vin, prevOuts, parsedInput.publicKeys).flatMap((signature, i) =>
      signature
        ? [
            {
              pubkey: parsedInput.publicKeys[i],
              signature,
            },
          ]
        : []
    );
  }
  // Because Zcash directly hashes the value for non-segwit transactions, we do not need to check indirectly
  // with the previous transaction. Therefore, we can treat Zcash non-segwit transactions as Bitcoin
  // segwit transactions
  if (
    parsedInput.scriptType !== 'taprootScriptPathSpend' &&
    !hasWitnessData(parsedInput.scriptType) &&
    !nonWitnessUtxo &&
    getMainnet(tx.network) !== networks.zcash
  ) {
    throw new Error(`scriptType ${parsedInput.scriptType} requires prevTx Buffer`);
  }

  switch (parsedInput.scriptType) {
    case 'p2shP2pk':
      return {
        nonWitnessUtxo,
        partialSig: [{ pubkey: parsedInput.publicKeys[0], signature: parsedInput.signatures[0] }],
      };
    case 'p2sh':
    case 'p2wsh':
    case 'p2shP2wsh':
      return omitUndefined({
        nonWitnessUtxo,
        partialSig: getPartialSigs(),
        redeemScript: parsedInput.redeemScript,
        witnessScript: parsedInput.witnessScript,
      });
    case 'taprootScriptPathSpend':
      const leafHash = taproot.getTapleafHash(eccLib, parsedInput.controlBlock, parsedInput.pubScript);
      return {
        tapLeafScript: [
          {
            controlBlock: parsedInput.controlBlock,
            script: parsedInput.pubScript,
            leafVersion: parsedInput.leafVersion,
          },
        ],
        tapScriptSig: getPartialSigs().map((obj) => ({ ...obj, leafHash })),
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
