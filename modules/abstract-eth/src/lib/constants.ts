import { CoinFamily } from '@bitgo/statics';

/** L2 coin families that incur L1 data fees during recovery transactions */
export const coinFamiliesWithL1Fees: ReadonlyArray<CoinFamily> = [
  CoinFamily.OPETH,
  CoinFamily.DOGEOS,
  CoinFamily.MORPHETH,
];
