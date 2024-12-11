import { UnderlyingAsset } from '../base';
import { erc20 } from '../account';
export const erc20Coins = [
  erc20(
    '3cdd1d41-b561-4c0c-aa82-72c52ebe69e5',
    'eth:kava',
    'Kava',
    6,
    '0x0c356b7fd36a5357e5a017ef11887ba100c9ab76',
    UnderlyingAsset['eth:kava']
  ),
  erc20(
    '0b22028a-fa33-47e3-9b4d-b32173b53ab6',
    'eth:iq',
    'IQ',
    18,
    '0x579cea1889991f68acc35ff5c3dd0621ff29b0c9',
    UnderlyingAsset['eth:iq']
  ),
  erc20(
    '04d29dd7-7167-4f5e-83ab-5a8690e2daaf',
    'eth:iris',
    'IRISnet',
    6,
    '0x76c4a2b59523eae19594c630aab43288dbb1463f',
    UnderlyingAsset['eth:iris']
  ),
  erc20(
    'a214db0d-a25b-485f-a8fc-b7970cb4d500',
    'eth:hard',
    'Kava Lend',
    6,
    '0x1c700f95df53fc31e83d89ac89e5dd778d4cd310',
    UnderlyingAsset['eth:hard']
  ),
  erc20(
    'a9fbae2c-d9c7-47b7-9602-ff6316a1ca00',
    'eth:hegic',
    'Hegic',
    18,
    '0x584bc13c7d411c00c01a62e8019472de68768430',
    UnderlyingAsset['eth:hegic']
  ),
];
