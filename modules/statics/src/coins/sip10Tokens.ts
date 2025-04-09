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
  sip10Token(
    '596a5d6a-aa5f-45e9-bb82-5b4249fcb1de',
    'stx:ststx',
    'stSTX',
    6,
    'SP4SZE494VC2YC5JYG7AYFQ44F5Q4PYV7DVMDPBG.ststx-token::ststx-token',
    UnderlyingAsset['stx:ststx'],
    STX_TOKEN_FEATURES
  ),
  sip10Token(
    '610cd0fb-7b3a-4ab6-a172-c8a4eed34c89',
    'stx:alex',
    'Alex Labs',
    8,
    'SP102V8P0F7JX67ARQ77WEA3D3CFB5XW39REDT0AM.token-alex::token-alex',
    UnderlyingAsset['stx:alex'],
    STX_TOKEN_FEATURES
  ),
  sip10Token(
    '4613525b-3ac5-4d8c-a7ab-b9b2c36d3ed2',
    'stx:aeusdc',
    'Allbridge Bridged USDC',
    6,
    'SP3Y2ZSH8P7D50B0VBTSX11S7XSG24M1VB9YFQA4K.token-aeusdc::token-aeusdc',
    UnderlyingAsset['stx:aeusdc'],
    STX_TOKEN_FEATURES
  ),
  sip10Token(
    'baaf7ebe-b931-4a5e-a173-ab514688df73',
    'stx:susdh',
    'sUSDH',
    6,
    'SPN5AKG35QZSK2M8GAMR4AFX45659RJHDW353HSG.susdh-token-v1::susdh-token-v1',
    UnderlyingAsset['stx:susdh'],
    STX_TOKEN_FEATURES
  ),
  sip10Token(
    '83fbaa8a-eeda-496a-9c38-98ef592a008b',
    'stx:usdh',
    'USDH',
    8,
    'SPN5AKG35QZSK2M8GAMR4AFX45659RJHDW353HSG.usdh-token-v1::usdh-token-v1',
    UnderlyingAsset['stx:usdh'],
    STX_TOKEN_FEATURES
  ),
  sip10Token(
    'c52dd53f-6db4-4fda-ba5f-0c0900e23caf',
    'stx:welsh',
    'Welshcorgicoin',
    6,
    'SP3NE50GEXFG9SZGTT51P40X2CKYSZ5CC4ZTZ7A2G.welshcorgicoin-token::welshcorgicoin-token',
    UnderlyingAsset['stx:welsh'],
    STX_TOKEN_FEATURES
  ),
  // testnet tokens
  tsip10Token(
    '74b5f05c-9cfa-45bf-b6a4-bc7f6dde37f9',
    'tstx:tsbtc',
    'Test sBTC',
    8,
    'ST1F7QA2MDF17S807EPA36TSS8AMEFY4KA9TVGWXT.sbtc-token::sbtc-token',
    UnderlyingAsset['tstx:tsbtc'],
    STX_TOKEN_FEATURES
  ),
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
