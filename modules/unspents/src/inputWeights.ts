/**
 * Defines input sizes for BitGo signature scripts.
 */

import varuint from 'varuint-bitcoin';

export function varSliceSize(someScript: Sized): number {
  const length = someScript.length;

  return varuint.encodingLength(length) + length;
}

function vectorSize(someVector: Sized[]): number {
  const length = someVector.length;

  return (
    varuint.encodingLength(length) +
    someVector.reduce((sum, witness) => {
      return sum + varSliceSize(witness);
    }, 0)
  );
}

export type Sized = {
  length: number;
};

export type Input = {
  script: Sized;
  witness: Sized[];
};

export function getInputByteLength(input: Input, allowWitness: boolean): number {
  return (
    40 /* inputId(32), index(4), nSequence(4) */ +
    varSliceSize(input.script) +
    (allowWitness ? vectorSize(input.witness) : 0)
  );
}

export function getInputWeight(input: Input): number {
  return 3 * getInputByteLength(input, false) + getInputByteLength(input, true);
}

export type InputComponents = {
  script: number[];
  witness: number[];
};

export function getInputComponentsWeight(c: InputComponents): number {
  const scriptSize = c.script.reduce((a, b) => a + b, 0);
  return getInputWeight({
    script: { length: scriptSize },
    witness: c.witness.map((v) => ({ length: v })),
  });
}

const opSize = 1;
const op0Size = opSize;
const opPushSize = opSize;
const opCheckSigVerifySize = opSize;
const opCheckSigSize = opSize;
const ecdsaSignatureSize = 72;
const schnorrPubkeySize = 32;
const schnorrSignatureNoSighashSize = 64;
const p2msPubScriptSize = 105; // Note: This is valid for a compressed public key only
const p2wshPubScriptSize = 34;
const p2pkPubScriptSize = 35;

function p2trScriptSpend(level: 1 | 2): number[] {
  return [
    schnorrSignatureNoSighashSize,
    schnorrSignatureNoSighashSize,
    opPushSize + schnorrPubkeySize + opCheckSigSize + opPushSize + schnorrPubkeySize + opCheckSigVerifySize,
    /* header byte */ 1 + /* inner key */ 32 + /* inner leaf */ 32 * level,
  ];
}

function p2msSigScriptSize(witness: boolean) {
  return [
    witness ? 0 : op0Size,
    (witness ? 0 : opPushSize) + ecdsaSignatureSize,
    (witness ? 0 : opPushSize) + ecdsaSignatureSize,
    (witness ? 0 : /* OP_PUSHDATA2 */ opPushSize + 1) + p2msPubScriptSize,
  ];
}

export const inputComponentsP2sh: InputComponents = {
  script: p2msSigScriptSize(false),
  witness: [],
};

export const inputComponentsP2shP2wsh: InputComponents = {
  script: [opSize + p2wshPubScriptSize],
  witness: p2msSigScriptSize(true),
};

export const inputComponentsP2wsh: InputComponents = {
  script: [],
  witness: p2msSigScriptSize(true),
};

// See: https://murchandamus.medium.com/2-of-3-multisig-inputs-using-pay-to-taproot-d5faf2312ba3
export const inputComponentsP2trKeySpend: InputComponents = {
  script: [],
  witness: [schnorrSignatureNoSighashSize],
};

export const inputComponentsP2trScriptSpendLevel1: InputComponents = {
  script: [],
  witness: p2trScriptSpend(1),
};

export const inputComponentsP2trScriptSpendLevel2: InputComponents = {
  script: [],
  witness: p2trScriptSpend(2),
};

export const inputComponentsP2shP2pk: InputComponents = {
  script: [opPushSize + ecdsaSignatureSize, opPushSize + p2pkPubScriptSize],
  witness: [],
};
