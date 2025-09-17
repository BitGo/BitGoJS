import { tjettonToken } from '../account';
import { UnderlyingAsset } from '../base';
import { TON_TOKEN_FEATURES } from '../coinFeatures';

export const jettonTokens = [
  // testnet tokens
  tjettonToken(
    'a442d4fc-bc65-4ef5-92eb-fbefdd1f991f',
    'tton:ukwny-us',
    'Test Unknown TokenY-US',
    9,
    'kQD8EQMavE1w6gvgMXUhN8hi7pSk4bKYM-W2dgkNqV54Y16Y',
    UnderlyingAsset['tton:ukwny-us'],
    TON_TOKEN_FEATURES
  ),
];
