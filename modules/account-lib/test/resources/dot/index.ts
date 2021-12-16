export { testnetMetadataRpc } from './testnet';

export const accounts = {
  account1: {
    secretKey: '874578010603af8e93b44bfc1d13b32830d0dbca6c89f28ccdc662afd3cdc824',
    publicKey: '61b18c6dc02ddcabdeac56cb4f21a971cc41cc97640f6f85b073480008c53a0d',
    address: '5EGoFA95omzemRssELLDjVenNZ68aXyUeqtKQScXSEBvVJkr',
  },
  account2: {
    secretKey: '6f850d17c2bf64478a2aac860fe9c23a48d322f12932c43fe90704553b7b84fd',
    publicKey: '9f7b0675db59d19b4bd9c8c72eaabba75a9863d02b30115b8b3c3ca5c20f0254',
    address: '5Ffp1wJCPu4hzVDTo7XaMLqZSvSadyUQmxWPDw74CBjECSoq',
  },
  account3: {
    secretKey: 'ff2f0c73e7e8a34ba80401efa06f16cbb3406ca1f04b4fc618bc937643eef498',
    publicKey: 'd472bd6e0f1f92297631938e30edb682208c2cd2698d80cf678c53a69979eb9f',
    address: '5GsG6P9EqkbmTrM1GE5bcQx9nsSq74KueiLa1kNZiwagFxW4',
  },
  account4: {
    secretKey: '1c096bd907cc0149661a153431004ac40743330f9f0a2d03627628e16eeda1a8',
    publicKey: '7788327c695dca4b3e649a0db45bc3e703a2c67428fce360e61800cc4248f4f7',
    address: '5EmS1nuXogd8JXCUfyMjYBZ3MNbvPSBB4uNRjKGFS6E68YbK',
  },
  default: {
    secretKey: '0000000000000000000000000000000000000000000000000000000000000000',
    publicKey: '3b6a27bcceb6a42d62a3a8d02a6f0d73653215771de243a63ac048a18b59da29',
    address: '5DQcDYQ3wwobcrJ5aE5CzGp34ZWYNeYfYZ1yLbPiU2RcSvwm',
  },
};

export const rawTx = {
  transfer: {
    signed:
      '0x4502840061b18c6dc02ddcabdeac56cb4f21a971cc41cc97640f6f85b073480008c53a0d0050d7217d4c3220cbda68ddce82d5669a99a181393daf391bb9e455d94d9de5da80c2066092515ce219ebe0e78098f3b64c86e7148f6663a3ef7be2e6caed4808d5012103000503009f7b0675db59d19b4bd9c8c72eaabba75a9863d02b30115b8b3c3ca5c20f0254070010a5d4e8',
    unsigned:
      '0xa40503009f7b0675db59d19b4bd9c8c72eaabba75a9863d02b30115b8b3c3ca5c20f0254070010a5d4e8d5012103008c230000070000002b8d4fdbb41f4bc15b8a7ec8ed0687f2a1ae11e0fc2dc6604fa962a9421ae349149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d',
    westendSigned:
      '0x4502840061b18c6dc02ddcabdeac56cb4f21a971cc41cc97640f6f85b073480008c53a0d0021074cd94f360122060446aec29b8d501bd4f77100efd3907d7b5cd389695e9b04943b840736a2dc8278f514b7af8f1673cb2a93701936c1edff67b0daf3e204d5012103000403009f7b0675db59d19b4bd9c8c72eaabba75a9863d02b30115b8b3c3ca5c20f02540700e40b5402',
  },
  stake: {
    signed:
      '0x4d02840061b18c6dc02ddcabdeac56cb4f21a971cc41cc97640f6f85b073480008c53a0d002f727310a5a1e2991edd4c51d723f0cdc4c065f7139a678ede2a27147953477490b50b4c5d8110ab38799e1ca1b627bb79014c9fb14c7b7733c24984ef2af90bd5012103000700009f7b0675db59d19b4bd9c8c72eaabba75a9863d02b30115b8b3c3ca5c20f02540b00203d88792d00',
    unsigned:
      '0xac0700009f7b0675db59d19b4bd9c8c72eaabba75a9863d02b30115b8b3c3ca5c20f02540b00203d88792d00d5012103008c230000070000002b8d4fdbb41f4bc15b8a7ec8ed0687f2a1ae11e0fc2dc6604fa962a9421ae349149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d',
    signedAlt:
      '0xcd02840061b18c6dc02ddcabdeac56cb4f21a971cc41cc97640f6f85b073480008c53a0d0095ee836583f76fd084920a035ff9919da6836fc14280fbda7bbc9b7096ab0f0501cd46070ba6876cbe4f46a3919da4ac99f3a65d3dd69336c12e1a6b9cae4808d5012103000700009f7b0675db59d19b4bd9c8c72eaabba75a9863d02b30115b8b3c3ca5c20f02540b00203d88792d039f7b0675db59d19b4bd9c8c72eaabba75a9863d02b30115b8b3c3ca5c20f0254',
    unsignedAlt:
      '0x2d010700009f7b0675db59d19b4bd9c8c72eaabba75a9863d02b30115b8b3c3ca5c20f02540b00203d88792d039f7b0675db59d19b4bd9c8c72eaabba75a9863d02b30115b8b3c3ca5c20f0254d5012103008c230000070000002b8d4fdbb41f4bc15b8a7ec8ed0687f2a1ae11e0fc2dc6604fa962a9421ae349149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d',
  },
  addProxy: {
    signed:
      '0x3d02840061b18c6dc02ddcabdeac56cb4f21a971cc41cc97640f6f85b073480008c53a0d00355a3264e8553e3c0c006887bbf75e22ea29eb71d1691184fb4064aab05d43ff4098231b4456559cfe93c5b7f64512d02c01f18076fb1b30a5ae39656fe7fd09d5012103001d01d472bd6e0f1f92297631938e30edb682208c2cd2698d80cf678c53a69979eb9f0000000000',
    unsigned:
      '0x9c1d01d472bd6e0f1f92297631938e30edb682208c2cd2698d80cf678c53a69979eb9f0000000000d5012103008c230000070000002b8d4fdbb41f4bc15b8a7ec8ed0687f2a1ae11e0fc2dc6604fa962a9421ae349149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d',
  },
  proxy: {
    signed:
      '0xd9028400d472bd6e0f1f92297631938e30edb682208c2cd2698d80cf678c53a69979eb9f004a31bd668659362d682c7d81af0f94455bb1469bab4828b8bfd8b5b439a3fd74bf1240f51aab104e4bfd12cff0eda68df8c01952434a9083f01f250f6e7fc30fd5012103001d0061b18c6dc02ddcabdeac56cb4f21a971cc41cc97640f6f85b073480008c53a0d01000503009f7b0675db59d19b4bd9c8c72eaabba75a9863d02b30115b8b3c3ca5c20f02540bfadb9bbae251',
    unsigned:
      '0x39011d0061b18c6dc02ddcabdeac56cb4f21a971cc41cc97640f6f85b073480008c53a0d01000503009f7b0675db59d19b4bd9c8c72eaabba75a9863d02b30115b8b3c3ca5c20f02540bfadb9bbae251d5012103008c230000070000002b8d4fdbb41f4bc15b8a7ec8ed0687f2a1ae11e0fc2dc6604fa962a9421ae349149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d',
    transferCall: '0x0503009f7b0675db59d19b4bd9c8c72eaabba75a9863d02b30115b8b3c3ca5c20f02540bfadb9bbae251',
  },
  unstake: {
    signed:
      '0xc501840061b18c6dc02ddcabdeac56cb4f21a971cc41cc97640f6f85b073480008c53a0d0082b5a2468107ed6ce4fc802df93f5e67463f4d673a6507c8cd6adc18602707beb4c394c30cd7f5ed3f390268cec91f40fb503af9cfc66a712afeddca29f7e60cd50121030007020b00203d88792d',
    unsigned:
      '0x2407020b00203d88792dd5012103008c230000070000002b8d4fdbb41f4bc15b8a7ec8ed0687f2a1ae11e0fc2dc6604fa962a9421ae349149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d',
  },
};

export const jsonTransactions = {
  transfer:
    '{"id":"0xecb860905342cf985b39276a07d6e6696746de4623c07df863f69cba153f939a","sender":"5EGoFA95omzemRssELLDjVenNZ68aXyUeqtKQScXSEBvVJkr","referenceBlock":"0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d","blockNumber":3933,"genesisHash":"0x2b8d4fdbb41f4bc15b8a7ec8ed0687f2a1ae11e0fc2dc6604fa962a9421ae349","nonce":200,"specVersion":9100,"transactionVersion":7,"eraPeriod":64,"chainName":"Polkadot","tip":0,"to":"5Ffp1wJCPu4hzVDTo7XaMLqZSvSadyUQmxWPDw74CBjECSoq","amount":"1000000000000"}',
  proxyTransfer:
    '{"id":"0x31ce82eb3d76a2d9814ad2f9499195a3bd9d2b16489834f8fd1c5615d9f1897f","sender":"5GsG6P9EqkbmTrM1GE5bcQx9nsSq74KueiLa1kNZiwagFxW4","referenceBlock":"0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d","blockNumber":3933,"genesisHash":"0x2b8d4fdbb41f4bc15b8a7ec8ed0687f2a1ae11e0fc2dc6604fa962a9421ae349","nonce":200,"specVersion":9100,"transactionVersion":7,"eraPeriod":64,"chainName":"Polkadot","tip":0,"owner":"5EGoFA95omzemRssELLDjVenNZ68aXyUeqtKQScXSEBvVJkr","forceProxyType":"Any","to":"5Ffp1wJCPu4hzVDTo7XaMLqZSvSadyUQmxWPDw74CBjECSoq","amount":90034235235322}',
  walletInitialization:
    '{"id":"0x181d71aa09c861b88b44c6252f8c68bf66d5bbad3b6ec551bbb1e715b6f8bc28","sender":"5EGoFA95omzemRssELLDjVenNZ68aXyUeqtKQScXSEBvVJkr","referenceBlock":"0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d","blockNumber":3933,"genesisHash":"0x2b8d4fdbb41f4bc15b8a7ec8ed0687f2a1ae11e0fc2dc6604fa962a9421ae349","nonce":200,"specVersion":9100,"transactionVersion":7,"eraPeriod":64,"chainName":"Polkadot","tip":0,"owner":"5GsG6P9EqkbmTrM1GE5bcQx9nsSq74KueiLa1kNZiwagFxW4","proxyType":"Any","delay":"0"}',
  staking:
    '{"id":"0xd95bb6cef42b931e0ee45b87a57dac7d42108e3b6798fd3788758482bbd69ff1","sender":"5EGoFA95omzemRssELLDjVenNZ68aXyUeqtKQScXSEBvVJkr","referenceBlock":"0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d","blockNumber":3933,"genesisHash":"0x2b8d4fdbb41f4bc15b8a7ec8ed0687f2a1ae11e0fc2dc6604fa962a9421ae349","nonce":200,"specVersion":9100,"transactionVersion":7,"eraPeriod":64,"chainName":"Polkadot","tip":0,"controller":"5Ffp1wJCPu4hzVDTo7XaMLqZSvSadyUQmxWPDw74CBjECSoq","amount":"50000000000000","payee":"Staked"}',
  stakingPayee:
    '{"id":"0x5e308428590cd19f576d7a3836b9f661633dd3a19025a7f0d26ed27cbf73b408","sender":"5EGoFA95omzemRssELLDjVenNZ68aXyUeqtKQScXSEBvVJkr","referenceBlock":"0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d","blockNumber":3933,"genesisHash":"0x2b8d4fdbb41f4bc15b8a7ec8ed0687f2a1ae11e0fc2dc6604fa962a9421ae349","nonce":200,"specVersion":9100,"transactionVersion":7,"eraPeriod":64,"chainName":"Polkadot","tip":0,"controller":"5Ffp1wJCPu4hzVDTo7XaMLqZSvSadyUQmxWPDw74CBjECSoq","amount":"50000000000000","payee":"5Ffp1wJCPu4hzVDTo7XaMLqZSvSadyUQmxWPDw74CBjECSoq"}',
  unstaking:
    '{"id":"0xcfc19a1c80041f807c321d381579bbfddbf0a76713d6d631e27d4ddda89f3699","sender":"5EGoFA95omzemRssELLDjVenNZ68aXyUeqtKQScXSEBvVJkr","referenceBlock":"0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d","blockNumber":3933,"genesisHash":"0x2b8d4fdbb41f4bc15b8a7ec8ed0687f2a1ae11e0fc2dc6604fa962a9421ae349","nonce":200,"specVersion":9100,"transactionVersion":7,"eraPeriod":64,"chainName":"Polkadot","tip":0,"amount":"50000000000000"}',
};

export const blockHash = {
  block1: '0xc5e877848888006015ac403bbdaf84a2da0d79f88798b8239df19a3d471b6a8e',
  block2: '0xc5e877848888006015ac403bbdaf84a2da0d79f88798b8239df19a3d471b6a8e',
};

export const signatures = {
  signature1:
    '0xaf8312fa0d261c003fc3779559ac914c91bd062f249ef8d49911c40aa8b71b4d289a75a7860cd31046a125fa286368c6cfb7c3ca246072f18b31b88965485708',
  signature2:
    '0xaf8312fa0d261c003fc3779559ac914c91bd062f249ef8d49911c40aa8b71b4d289a75a7860cd31046a125fa286368c6cfb7c3ca246072f18b31b88965485708ff',
  signature3:
    '0xaf8312fa0d261c003fc3779559ac914c91bd062f249ef8d49911c40aa8b71b4d289a75a7860cd31046a125fa286368c6cfb7c3ca246072f18b31b88965485708ffff',
};

export const txIds = {
  id1: '0x1cbf1722ad5c3dcb981d48fd97f0520c7e5683d02a03a8a696208d8fe950299f',
  id2: '0xd95bb6cef42b931e0ee45b87a57dac7d42108e3b6798fd3788758482bbd69ff1',
};
