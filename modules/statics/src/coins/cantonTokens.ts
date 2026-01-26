import { tcantonToken } from '../account';
import { UnderlyingAsset } from '../base';
import { CANTON_TOKEN_FEATURES } from '../coinFeatures';

export const cantonTokens = [
  // testnet tokens
  tcantonToken(
    '46356790-0ac4-4c3b-8b70-39094106d772',
    'tcanton:testcoin1',
    'Test Coin 1',
    10,
    'https://api.utilities.digitalasset-dev.com/api/token-standard/v0/registrars/',
    'TestCoin1',
    'auth0_007c65f857f1c3d599cb6df73775::1220d2d732d042c281cee80f483ab80f3cbaa4782860ed5f4dc228ab03dedd2ee8f9',
    UnderlyingAsset['tcanton:testcoin1'],
    CANTON_TOKEN_FEATURES
  ),
  tcantonToken(
    '76e5e451-ce0b-481f-ba6a-79d95fb48b63',
    'tcanton:testtoken',
    'Test Token',
    10,
    'https://api.utilities.digitalasset-dev.com/api/token-standard/v0/registrars/',
    'TestToken',
    'auth0_007c65f857f1c3d599cb6df73775::1220d2d732d042c281cee80f483ab80f3cbaa4782860ed5f4dc228ab03dedd2ee8f9',
    UnderlyingAsset['tcanton:testtoken'],
    CANTON_TOKEN_FEATURES
  ),
];
