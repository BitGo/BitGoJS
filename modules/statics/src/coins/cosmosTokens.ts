import { cosmosToken } from '../account';
import { UnderlyingAsset, BaseUnit } from '../base';
import { COSMOS_TOKEN_FEATURES, COSMOS_TOKEN_FEATURES_WITH_STAKING } from '../coinFeatures';
import { Networks } from '../networks';

export const cosmosTokens = [
  cosmosToken(
    '4c215052-be4b-4d10-9c05-63eac29cd953',
    'hash:ylds',
    'YLDS Token',
    'uylds.fcc',
    6,
    Networks.main.hash,
    BaseUnit.HASH,
    UnderlyingAsset['hash:ylds'],
    COSMOS_TOKEN_FEATURES_WITH_STAKING
  ),
  cosmosToken(
    '252dd264-a189-48e3-96e0-27802fc11b8d',
    'thash:ylds',
    'Testnet YLDS Token',
    'uylds.fcc',
    6,
    Networks.test.hash,
    BaseUnit.HASH,
    UnderlyingAsset['thash:ylds'],
    COSMOS_TOKEN_FEATURES_WITH_STAKING
  ),
  cosmosToken(
    '7cc5ddcf-f919-480c-b413-77f667ebc65c',
    'thash:tfigr',
    'Testnet Figure',
    'nfigr.d',
    9,
    Networks.test.hash,
    BaseUnit.HASH,
    UnderlyingAsset['thash:tfigr'],
    COSMOS_TOKEN_FEATURES
  ),
];
