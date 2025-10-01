import { tpolyxToken, polyxToken } from '../account';
import { UnderlyingAsset } from '../base';
import { POLYX_TOKEN_FEATURES } from '../coinFeatures';

// https://polymesh.protofire.io/asset/{assetId}
export const polyxTokens = [
  polyxToken(
    '4121c583-2e0f-4d4c-95de-24b2a3f77181',
    'polyx:0xa0ce6bc4c60981e08eca6504656c99e6',
    'RAND175TM',
    6,
    '',
    '0xa0ce6bc4c60981e08eca6504656c99e6',
    UnderlyingAsset['polyx:0xa0ce6bc4c60981e08eca6504656c99e6'],
    POLYX_TOKEN_FEATURES
  ),
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

  tpolyxToken(
    '4becde65-8d44-488f-bda9-74ca2d90b3dd',
    'tpolyx:WEBINRASSET3',
    'Webinar Real Estate',
    6,
    'WEBINRASSET3',
    '0xd7298d5b89628da5ab9ba80974552c8d',
    UnderlyingAsset['tpolyx:WEBINRASSET3'],
    POLYX_TOKEN_FEATURES
  ),
  tpolyxToken(
    '6aa6cb3f-6ba8-4afc-9695-87290184d085',
    'tpolyx:WEBINRASSET4',
    'Webinar RWA',
    6,
    'WEBINRASSET4',
    '0x603f3b0e5f6d8ad399c080b496557a81',
    UnderlyingAsset['tpolyx:WEBINRASSET4'],
    POLYX_TOKEN_FEATURES
  ),
  tpolyxToken(
    'c1e01419-65ea-4b33-ae13-d80b5e0035fd',
    'tpolyx:WEBINRASSET5',
    'Webinar Fund',
    6,
    'WEBINRASSET5',
    '0x0c7371af68b281798d5ff71d870ecd82',
    UnderlyingAsset['tpolyx:WEBINRASSET5'],
    POLYX_TOKEN_FEATURES
  ),
  tpolyxToken(
    'db4ee911-642b-4a81-ba6e-2aac11d447df',
    'tpolyx:WEBINRASSET6',
    'Webinar Uranium',
    6,
    'WEBINRASSET6',
    '0x4e63130375b18444a3020aaa67d2ee3e',
    UnderlyingAsset['tpolyx:WEBINRASSET6'],
    POLYX_TOKEN_FEATURES
  ),
  tpolyxToken(
    '9d6bcc8d-21d5-4d37-b016-8673c31c9dd2',
    'tpolyx:WEBINRASSET7',
    'Webinar Gold',
    6,
    'WEBINRASSET7',
    '0x0aaf71d50bbf8f5f95b11582fb8dbb74',
    UnderlyingAsset['tpolyx:WEBINRASSET7'],
    POLYX_TOKEN_FEATURES
  ),
  tpolyxToken(
    '74f4d3f7-7b0f-457a-a4d5-bc21c8802169',
    'tpolyx:BULLRWA',
    'Bullish RWA Index',
    6,
    'BULLRWA',
    '0x17701e181aab8ba5bc5c3b56f472b340',
    UnderlyingAsset['tpolyx:BULLRWA'],
    POLYX_TOKEN_FEATURES
  ),
];
