import { sip10Token, tsip10Token } from '../account';
import { UnderlyingAsset } from '../base';
import { STX_TOKEN_FEATURES } from '../coinFeatures';

export const sip10Tokens = [
  sip10Token(
    '6157083d-e0b5-4a77-9ace-20c4b96af9ed',
    'stx:sbtc',
    'sBTC',
    8,
    'SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token::sbtc-token',
    UnderlyingAsset['stx:sbtc'],
    STX_TOKEN_FEATURES
  ),
  // testnet tokens
  tsip10Token(
    'ffa80cb4-dd2f-4729-9635-11071b9d8496',
    'tstx:tsip6dp',
    'Test SIP10 Token 6 Decimals',
    6,
    'STAG18E45W613FZ3H4ZMF6QHH426EXM5QTSAVWYH.tsip6dp-token::tsip6dp-token',
    UnderlyingAsset['tstx:tsip6dp'],
    STX_TOKEN_FEATURES
  ),
  tsip10Token(
    '2b60173c-9615-47d6-ab83-ed9889c23dc1',
    'tstx:tsip8dp',
    'Test SIP10 Token 8 Decimals',
    8,
    'STAG18E45W613FZ3H4ZMF6QHH426EXM5QTSAVWYH.tsip8dp-token-updated::tsip8dp-token-updated',
    UnderlyingAsset['tstx:tsip8dp'],
    STX_TOKEN_FEATURES
  ),
];
