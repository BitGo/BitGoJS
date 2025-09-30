import type { UnderlyingAsset } from '@bitgo-beta/statics';
import * as AccountCtors from '../ofc';
export const botOfcTokens = [
  AccountCtors.tofcerc20(
    '6430cc83-077f-4927-b7cf-222db880bb58',
    'ofchteth:ams',
    'AMS Token v2',
    1,
    'hteth:ams' as unknown as UnderlyingAsset,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined
  ),
];
