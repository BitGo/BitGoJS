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
  AccountCtors.terc20(
    '4e471a53-63f3-4e6a-8ccd-249436ec03b8',
    'hteth:amslocal',
    'AMS local test',
    18,
    '0x8c7a17ef8e00f2f31cff598206d7fc5a8cb41122',
    'hteth:amslocal' as unknown as UnderlyingAsset,
    networkFeatureMapForTokens['eth'],
    undefined,
    undefined,
    Networks.test.hoodi
  ),
];
