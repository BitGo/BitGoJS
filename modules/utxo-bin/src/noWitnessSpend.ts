import * as utxolib from '@bitgo/utxo-lib';

/**
 * Users can mistakenly create wrapped segwit outputs on chains that do not support it (bitcoincash, bitcoinSV).
 * These funds can be claimed by miners that learn the hash preimage, typically by observing a spend on the bitcoin
 * chain,
 */
export type ScriptNoWitnessSpend =
  /** Wrapped Segwit Pay-To-Witness-Script-Hash */
  | { scriptType: 'p2shP2wshNoWitness' }
  /** Wrapped Segwit Pay-To-Pubkey-Hash */
  | { scriptType: 'p2shP2wpkhNoWitness' };

export function parseSignatureScriptNoWitnessSpend(
  input: utxolib.TxInput,
  network: utxolib.Network
): ScriptNoWitnessSpend | undefined {
  if (
    utxolib.getMainnet(network) !== utxolib.networks.bitcoincash &&
    utxolib.getMainnet(network) !== utxolib.networks.bitcoinsv
  ) {
    // this can only happen on the BCH/BSV forks
    return;
  }

  const type = utxolib.classify.input(input.script, true);
  if (type !== 'scripthash') {
    // this can only happen for p2sh spends
    return;
  }

  const bufs = utxolib.script.decompile(input.script);
  if (!bufs || bufs.length !== 1) {
    return;
  }

  const buf = bufs[0];
  if (typeof buf === 'number') {
    return;
  }

  const [a, b] = buf;
  if (a === 0x00 && b === 0x14 && buf.length === 22) {
    return { scriptType: 'p2shP2wpkhNoWitness' };
  }

  if (a === 0x00 && b === 0x20 && buf.length === 34) {
    return { scriptType: 'p2shP2wshNoWitness' };
  }
}
