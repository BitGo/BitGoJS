import * as utxolib from '@bitgo/utxo-lib';
import ScriptType2Of3 = utxolib.bitgo.outputScripts.ScriptType2Of3;

export function inferAddressType(addressDetails: { chain: number }): ScriptType2Of3 | null {
  return utxolib.bitgo.isChainCode(addressDetails.chain)
    ? utxolib.bitgo.scriptTypeForChain(addressDetails.chain)
    : null;
}
