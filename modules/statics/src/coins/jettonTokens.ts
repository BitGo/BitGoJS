import { jettonToken, tjettonToken } from '../account';
import { UnderlyingAsset } from '../base';
import { TON_TOKEN_FEATURES } from '../coinFeatures';

export const jettonTokens = [
  // mainnet tokens
  jettonToken(
    'b72a1bf8-35f2-4a6e-b017-4d0121dba68a',
    'ton:usdt',
    'Ton USDT',
    6,
    'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs',
    UnderlyingAsset['ton:usdt'],
    TON_TOKEN_FEATURES
  ),

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
