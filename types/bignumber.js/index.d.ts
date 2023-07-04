// this augmentatation is not correct and still results in compilation errors.
// for some reason, tsc is not merging this augmentation into the bignumber.js type defintions,
// but I'll leave it here anyway in case it can be fixed in the future
import { BigNumber } from 'bignumber.js';

declare module 'bignumber.js' {
  export declare class BigNumber implements BigNumber.Instance {
    toFormat(
      decimalPlaces: number | null,
      roundingMode: BigNumber.RoundingMode | null,
      format?: BigNumber.Format
    ): string;
  }
}
