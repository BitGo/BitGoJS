import type { UnderlyingAsset } from '../base';
import * as AccountCtors from '../ofc';
export const botOfcTokens = [
  AccountCtors.tofcerc20(
    '647ba808-5e94-4f3a-bfd5-5c0a9bdc6d1c',
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
