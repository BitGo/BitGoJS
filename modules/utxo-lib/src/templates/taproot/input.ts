// key path spend - {signature}
// script path spend - [...stack elements] {tapscript} {control block}
// https://github.com/bitcoin/bips/blob/master/bip-0341.mediawiki

import { taproot } from '../../';

export function check(chunks: Buffer[]): boolean {
  try {
    // check whether parsing the witness as a taproot witness fails
    // this indicates whether `chunks` is a valid taproot input
    taproot.parseTaprootWitness(chunks);
    return true;
  } catch {
    return false;
  }
}
check.toJSON = (): string => {
  return 'taproot input';
};
