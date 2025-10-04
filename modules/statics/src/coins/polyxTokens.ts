import { tpolyxToken, polyxToken } from '../account';
import { UnderlyingAsset } from '../base';
import { POLYX_TOKEN_FEATURES } from '../coinFeatures';

// https://polymesh.protofire.io/asset/{assetId}
export const polyxTokens = [
  tpolyxToken(
    'a63b4f8d-84d6-45d3-bc67-625239e40811',
    'tpolyx:nvbitgot',
    'NVBITGOT Fungible Asset',
    6,
    'NVBITGOT',
    '0x780602887b358cf48989d0d9aa6c8d28',
    UnderlyingAsset['tpolyx:nvbitgot'],
    POLYX_TOKEN_FEATURES
  ),
  tpolyxToken(
    'd92f85d4-7d1a-4058-9972-66dbdfaddee2',
    'tpolyx:RAND176TM',
    'RAND176TM',
    6,
    'RAND176TM',
    '0x80c6b6e01589893ea70ef3d3789122d6',
    UnderlyingAsset['tpolyx:RAND176TM'],
    POLYX_TOKEN_FEATURES
  ),
  polyxToken(
    '4121c583-2e0f-4d4c-95de-24b2a3f77181',
    'tpolyx:0xa0ce6bc4c60981e08eca6504656c99e6',
    'RAND175TM',
    6,
    '',
    '0xa0ce6bc4c60981e08eca6504656c99e6',
    UnderlyingAsset['polyx:0xa0ce6bc4c60981e08eca6504656c99e6'],
    POLYX_TOKEN_FEATURES
  ),
];
