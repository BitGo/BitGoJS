import { nightToken, tnightToken } from '../account';
import { UnderlyingAsset } from '../base';
import { NIGHT_TOKEN_FEATURES } from '../coinFeatures';

/**
 * DUST tokens on the Midnight Network
 * DUST is the native fee token used to pay for transactions on Midnight
 */
export const nightTokens = [
  nightToken(
    'f8a9b2c1-3d4e-5f6a-7b8c-9d0e1f2a3b4c', // UUID for night:dust
    'night:dust',
    'Midnight Dust',
    8, // 8 decimal places like NIGHT
    'dust',
    UnderlyingAsset['night:dust'],
    NIGHT_TOKEN_FEATURES
  ),
  tnightToken(
    'a1b2c3d4-5e6f-7a8b-9c0d-e1f2a3b4c5d6', // UUID for tnight:tdust
    'tnight:tdust',
    'Testnet Midnight Dust',
    8, // 8 decimal places like NIGHT
    'tdust',
    UnderlyingAsset['tnight:tdust'],
    NIGHT_TOKEN_FEATURES
  ),
];
