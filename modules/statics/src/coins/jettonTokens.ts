import { jettonToken, tjettonToken } from '../account';
import { UnderlyingAsset } from '../base';
import { TON_TOKEN_FEATURES } from '../coinFeatures';

export const jettonTokens = [
  // mainnet tokens
  jettonToken(
    'b72a1bf8-35f2-4a6e-b017-4d0121dba68a',
    'ton:usdt',
    'Tether USD',
    6,
    'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs',
    UnderlyingAsset['ton:usdt'],
    TON_TOKEN_FEATURES
  ),
  jettonToken(
    'c8e53be1-4313-40eb-a2ca-7ab92e89eb1a',
    'ton:usde',
    'Ethena USDe',
    6,
    'EQAIb6KmdfdDR7CN1GBqVJuP25iCnLKCvBlJ07Evuu2dzP5f',
    UnderlyingAsset['ton:usde'],
    TON_TOKEN_FEATURES
  ),
  jettonToken(
    '3879d8a3-5273-455e-9c9d-de6784953b34',
    'ton:not',
    'Notcoin',
    9,
    'EQAvlWFDxGF2lXm67y4yzC17wYKD9A0guwPkMs1gOsM__NOT',
    UnderlyingAsset['ton:not'],
    TON_TOKEN_FEATURES
  ),
  jettonToken(
    '819f4d1f-61d6-45be-950c-9033b8310536',
    'ton:cati',
    'Catizen',
    9,
    'EQD-cvR0Nz6XAyRBvbhz-abTrRC6sI5tvHvvpeQraV9UAAD7',
    UnderlyingAsset['ton:cati'],
    TON_TOKEN_FEATURES
  ),
  jettonToken(
    '59b2e53f-9f11-416e-b22b-2aa27397a919',
    'ton:dogs',
    'Dogs',
    9,
    'EQCvxJy4eG8hyHBFsZ7eePxrRsUQSFE_jpptRAYBmcG_DOGS',
    UnderlyingAsset['ton:dogs'],
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
