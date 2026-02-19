import { cantonToken, tcantonToken } from '../account';
import { UnderlyingAsset } from '../base';
import { CANTON_TOKEN_FEATURES } from '../coinFeatures';

export const cantonTokens = [
  cantonToken(
    '0ef822c5-2972-4087-a188-9dd48d132fc9',
    'canton:usdcx',
    'USDCx (Canton)',
    10,
    'https://api.utilities.digitalasset.com/api/token-standard/v0/registrars/',
    'decentralized-usdc-interchain-rep::12208115f1e168dd7e792320be9c4ca720c751a02a3053c7606e1c1cd3dad9bf60ef:USDCx',
    UnderlyingAsset['canton:usdcx'],
    CANTON_TOKEN_FEATURES
  ),
  cantonToken(
    '76e62c81-5cd2-4e76-9750-cfab7d58f7b2',
    'canton:cbtc',
    'CBTC (Canton)',
    10,
    'https://api.utilities.digitalasset.com/api/token-standard/v0/registrars/',
    'cbtc-network::12205af3b949a04776fc48cdcc05a060f6bda2e470632935f375d1049a8546a3b262:CBTC',
    UnderlyingAsset['canton:cbtc'],
    CANTON_TOKEN_FEATURES
  ),
  cantonToken(
    'f6a7b8c9-0d1e-4f2a-ab4c-5d6e7f8a9b0c',
    'canton:usdxlr',
    'USDXLR (Canton)',
    10,
    'https://api.utilities.digitalasset.com/api/token-standard/v0/registrars/',
    '4e667aab-9089-400b-9485-74d73732f068::1220dd489bd2242472a14015e9aebc12a48879a7e3aac60875506df30f7fce4e0f78:USDXLR',
    UnderlyingAsset['canton:usdxlr'],
    CANTON_TOKEN_FEATURES
  ),
  // testnet tokens
  tcantonToken(
    '46356790-0ac4-4c3b-8b70-39094106d772',
    'tcanton:testcoin1',
    'Test Coin 1',
    10,
    'https://api.utilities.digitalasset-dev.com/api/token-standard/v0/registrars/',
    'auth0_007c65f857f1c3d599cb6df73775::1220d2d732d042c281cee80f483ab80f3cbaa4782860ed5f4dc228ab03dedd2ee8f9:TestCoin1',
    UnderlyingAsset['tcanton:testcoin1'],
    CANTON_TOKEN_FEATURES
  ),
  tcantonToken(
    '76e5e451-ce0b-481f-ba6a-79d95fb48b63',
    'tcanton:testtoken',
    'Test Token',
    10,
    'https://api.utilities.digitalasset-dev.com/api/token-standard/v0/registrars/',
    'auth0_007c65f857f1c3d599cb6df73775::1220d2d732d042c281cee80f483ab80f3cbaa4782860ed5f4dc228ab03dedd2ee8f9:TestToken',
    UnderlyingAsset['tcanton:testtoken'],
    CANTON_TOKEN_FEATURES
  ),
];
