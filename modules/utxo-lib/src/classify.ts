import { script as bscript } from './';
import * as multisig from './templates/multisig';
import * as nullData from './templates/nulldata';
import * as pubKey from './templates/pubkey';
import * as pubKeyHash from './templates/pubkeyhash';
import * as scriptHash from './templates/scripthash';
import * as taproot from './templates/taproot';
import * as taprootnofn from './templates/taprootnofn';
import * as witnessCommitment from './templates/witnesscommitment';
import * as witnessPubKeyHash from './templates/witnesspubkeyhash';
import * as witnessScriptHash from './templates/witnessscripthash';

const types = {
  P2MS: 'multisig' as string,
  NONSTANDARD: 'nonstandard' as string,
  NULLDATA: 'nulldata' as string,
  P2PK: 'pubkey' as string,
  P2PKH: 'pubkeyhash' as string,
  P2SH: 'scripthash' as string,
  P2WPKH: 'witnesspubkeyhash' as string,
  P2WSH: 'witnessscripthash' as string,
  P2TR: 'taproot' as string,
  P2TR_NS: 'taprootnofn' as string,
  WITNESS_COMMITMENT: 'witnesscommitment' as string,
};

function classifyOutput(script: Buffer): string {
  if (witnessPubKeyHash.output.check(script)) return types.P2WPKH;
  if (witnessScriptHash.output.check(script)) return types.P2WSH;
  if (taproot.output.check(script)) return types.P2TR;
  if (pubKeyHash.output.check(script)) return types.P2PKH;
  if (scriptHash.output.check(script)) return types.P2SH;

  // XXX: optimization, below functions .decompile before use
  const chunks = bscript.decompile(script);
  if (!chunks) throw new TypeError('Invalid script');

  if (taprootnofn.output.check(chunks)) return types.P2TR_NS;
  if (multisig.output.check(chunks)) return types.P2MS;
  if (pubKey.output.check(chunks)) return types.P2PK;
  if (witnessCommitment.output.check(chunks)) return types.WITNESS_COMMITMENT;
  if (nullData.output.check(chunks)) return types.NULLDATA;

  return types.NONSTANDARD;
}

function classifyInput(script: Buffer, allowIncomplete?: boolean): string {
  // XXX: optimization, below functions .decompile before use
  const chunks = bscript.decompile(script);
  if (!chunks) throw new TypeError('Invalid script');

  if (pubKeyHash.input.check(chunks)) return types.P2PKH;
  if (scriptHash.input.check(chunks, allowIncomplete)) return types.P2SH;
  if (taprootnofn.input.check(chunks, allowIncomplete)) return types.P2TR_NS;
  if (multisig.input.check(chunks, allowIncomplete)) return types.P2MS;
  if (pubKey.input.check(chunks)) return types.P2PK;

  return types.NONSTANDARD;
}

function classifyWitness(script: Buffer[], allowIncomplete?: boolean): string {
  // XXX: optimization, below functions .decompile before use
  const chunks = bscript.decompile(script);
  if (!chunks) throw new TypeError('Invalid script');

  if (witnessPubKeyHash.input.check(chunks)) return types.P2WPKH;
  if (witnessScriptHash.input.check(chunks as Buffer[], allowIncomplete)) return types.P2WSH;
  if (taproot.input.check(chunks as Buffer[])) return types.P2TR;

  return types.NONSTANDARD;
}

export { classifyInput as input, classifyOutput as output, classifyWitness as witness, types };
