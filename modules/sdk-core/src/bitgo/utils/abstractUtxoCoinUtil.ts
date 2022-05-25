import * as utxolib from '@bitgo/utxo-lib';
import ScriptType2Of3 = utxolib.bitgo.outputScripts.ScriptType2Of3;
import { isChainCode, scriptTypeForChain } from '@bitgo/utxo-lib/dist/src/bitgo';

export function inferAddressType(addressDetails: { chain: number }): ScriptType2Of3 | null {
  return isChainCode(addressDetails.chain) ? scriptTypeForChain(addressDetails.chain) : null;
}
