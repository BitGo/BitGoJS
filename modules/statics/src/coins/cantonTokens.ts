import { cantonToken, tcantonToken } from '../account';
import { CoinFeature, UnderlyingAsset } from '../base';
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
    'excellar-issuer::12203d1e36930ee0e3fbb898add7e222a47ae9d2a5f0f6187e3a446ea32f871ce2ca:USDXLR',
    UnderlyingAsset['canton:usdxlr'],
    CANTON_TOKEN_FEATURES
  ),
  cantonToken(
    '24912f87-9de5-481a-9960-a23b53f6247b',
    'canton:cltc',
    'Canton Litecoin',
    10,
    'https://api.utilities.digitalasset.com/api/token-standard/v0/registrars/',
    'NodeYield-validator-1::12208d2a12d51b745717ee4a4011ed6088749f4c458def8ac17609e65e17e8bd0976:CLTC',
    UnderlyingAsset['canton:cltc'],
    CANTON_TOKEN_FEATURES
  ),
  cantonToken(
    '34d29e90-a5cd-4ed5-b88e-567be17733ed',
    'canton:sbc',
    'Stable Coin',
    10,
    'https://api.utilities.digitalasset.com/api/token-standard/v0/registrars/',
    'party-28dc4516-b5ca-44ff-86c7-2107e90a6807::1220b8301e18aa8a401d6e34e6c20f8b0243183c514373bca8f1b6b9270246341a9e:f29bdd7a-1469-498a-ba2a-796bf5387b31',
    UnderlyingAsset['canton:sbc'],
    CANTON_TOKEN_FEATURES
  ),
  cantonToken(
    '6369549f-c1d7-46a7-be26-592a6ac105ab',
    'canton:ibenji',
    'iBENJI',
    10,
    'https://api.utilities.digitalasset.com/api/token-standard/v0/registrars/',
    'ft::12200b5582a91686c5278999a988a8e6ae2ff7f870834fe2deccbafaefad73db4f2d:IBENJI',
    UnderlyingAsset['canton:ibenji'],
    CANTON_TOKEN_FEATURES
  ),
  cantonToken(
    '204a82d0-3043-41a5-a029-81fd6cfdcc68',
    'canton:ceth',
    'cETH',
    10,
    'https://api.utilities.digitalasset.com/api/token-standard/v0/registrars/',
    'rails-cethMain-1::12200350ba6e96e3b701c3048b5aa013a8c1c08833e8ebf54339cff581055c29003a:cETH',
    UnderlyingAsset['canton:ceth'],
    CANTON_TOKEN_FEATURES
  ),
  cantonToken(
    '9ecb4703-a612-4905-9955-83b273f6decd',
    'canton:usd1',
    'USD1',
    10,
    'https://api.utilities.digitalasset.com/api/token-standard/v0/registrars/',
    '12207::12207104d046b9339c2615aaa1ff7170eace89d1e4c657148eab5d0c2417583fa1a0:USD1',
    UnderlyingAsset['canton:usd1'],
    [...CANTON_TOKEN_FEATURES, CoinFeature.STABLECOIN]
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
  tcantonToken(
    '713b202a-d14a-4818-92d8-3505fc39b1bf',
    'tcanton:stgusd1',
    'Test USD1 Token',
    10,
    'https://api.utilities.digitalasset-dev.com/api/token-standard/v0/registrars/',
    '1220e::1220e2b2bf85aa100fe92d6089458f19a272205a3cc7fea2eb46030cdc3dff605d4a:STGUSD1',
    UnderlyingAsset['tcanton:stgusd1'],
    [...CANTON_TOKEN_FEATURES, CoinFeature.STABLECOIN]
  ),
  tcantonToken(
    '57b5236d-1660-4756-b76a-2d0ac2290936',
    'tcanton:usd1',
    'Test USD1 Token',
    10,
    'https://api.utilities.digitalasset-staging.com/api/token-standard/v0/registrars/',
    '12203::12203db723d11df3e69eb66fa9bbb5904269895ac0b284b61e3aeb03b748ca09802e:USD1',
    UnderlyingAsset['tcanton:usd1'],
    [...CANTON_TOKEN_FEATURES, CoinFeature.STABLECOIN]
  ),
];
