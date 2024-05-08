import * as utxolib from '@bitgo/utxo-lib';
import { Network } from '@bitgo/utxo-lib';

/**
 * Verify a Bitcoin address is a valid address
 */
export function verifyAddress(address, network: Network): boolean {
  try {
    const script = utxolib.addressFormat.toOutputScriptTryFormats(address, network, undefined);
    return address === utxolib.address.fromOutputScript(script, network);
  } catch (e) {
    return false;
  }
}
