import * as opcodes from 'bitcoin-ops';

export function isP2wsh(scriptPubkey: Buffer, redeemScript?: Buffer): boolean {
  const witnessProgramCandidate = redeemScript ?? scriptPubkey;
  return witnessProgramCandidate[0] === opcodes.OP_0 && witnessProgramCandidate.length === 34;
}

export function isP2wpkh(scriptPubkey: Buffer, redeemScript?: Buffer): boolean {
  const witnessProgramCandidate = redeemScript ?? scriptPubkey;
  return witnessProgramCandidate[0] === opcodes.OP_0 && witnessProgramCandidate.length === 22;
}

export function isTaproot(scriptPubkey: Buffer): boolean {
  return scriptPubkey[0] === opcodes.OP_1 && scriptPubkey.length === 34;
}

export function isSegwit(scriptPubkey: Buffer, redeemScript?: Buffer): boolean {
  return isTaproot(scriptPubkey) || isP2wsh(scriptPubkey, redeemScript) || isP2wpkh(scriptPubkey, redeemScript);
}
