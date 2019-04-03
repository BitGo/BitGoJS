import { LongName, ShortName } from './base';
import { Network, UtxoNetwork } from './networks';

export function shortName(literals: TemplateStringsArray): ShortName {
  if (literals.length !== 1) {
    throw new Error('invalid short name literal');
  }

  return (literals[0] as unknown) as ShortName;
}

export function longName(literals: TemplateStringsArray): LongName {
  if (literals.length !== 1) {
    throw new Error('invalid long name literal');
  }

  return (literals[0] as unknown) as LongName;
}

export function network(literals: TemplateStringsArray): UtxoNetwork {
  if (literals.length !== 1) {
    throw new Error('must provide network name');
  }

  if (literals[0] in Network) {
    return Network[literals[0]];
  }

  throw new Error(`invalid network name ${literals[0]}`);
}
