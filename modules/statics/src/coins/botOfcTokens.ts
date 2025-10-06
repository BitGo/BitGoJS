import type { UnderlyingAsset } from '../base';
import * as AccountCtors from '../ofc';
export const botOfcTokens = [
  AccountCtors.tofcerc20(
    '5c1ecdc5-9a13-42a3-b10d-eee8831e14c1',
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
