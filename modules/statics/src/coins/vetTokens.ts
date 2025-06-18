import { tvetToken, vetToken } from '../account';
import { UnderlyingAsset } from '../base';
import { VET_TOKEN_FEATURES } from '../coinFeatures';

export const vetTokens = [
  vetToken(
    '09717591-d7be-46d3-9fe0-b638e274028f',
    'vet:vtho',
    'VeThor',
    18,
    '0x0000000000000000000000000000456e65726779',
    UnderlyingAsset['vet:vtho'],
    VET_TOKEN_FEATURES
  ),
  tvetToken(
    '27dd32d2-7311-4552-9beb-c57f76d09205',
    'tvet:vtho',
    'VeThor Testnet',
    18,
    '0x0000000000000000000000000000456e65726779',
    UnderlyingAsset['tvet:vtho'],
    VET_TOKEN_FEATURES
  ),
];
