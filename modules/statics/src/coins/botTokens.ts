import { UnderlyingAsset } from '../base';
import { networkFeatureMapForTokens } from '../networkFeatureMapForTokens';
import { Networks } from '../networks';
import * as AccountCtors from '../account';

export const botTokens = [
  AccountCtors.terc20(
    '6430cc83-077f-4927-b7cf-222db880bb58',
    'hteth:ams',
    'AMS Token v2',
    1,
    '0x8c7a17ef8e00f2f31cff598206d7fc5a8cb41111',
    'hteth:ams' as unknown as UnderlyingAsset,
    networkFeatureMapForTokens['eth'],
    undefined,
    undefined,
    Networks.test.hoodi
  ),
];
