const getTxListRequestUnsignedSweep: Record<string, string> = {
  module: 'account',
  action: 'txlist',
  address: '0x1469e6e519ff8bf398b76b4be0b50701b999f14c',
};

const getTxListResponseUnsignedSweep: Record<string, unknown> = {
  status: '1',
  result: [
    {
      hash: '0xede855d43d70ea1bb75db63d4f75113dae0845f0d4bdb0b2d8bda55249c70812',
      nonce: '23',
      from: '0x1469e6e519ff8bf398b76b4be0b50701b999f14c',
    },
  ],
  message: 'OK',
};

const getBalanceRequestUnsignedSweep: Record<string, string> = {
  module: 'account',
  action: 'balance',
  address: '0x1469e6e519ff8bf398b76b4be0b50701b999f14c',
};

const getBalanceResponseUnsignedSweep: Record<string, unknown> = {
  status: '1',
  result: '100000000000000000',
  message: 'OK',
};

export const mockDataUnsignedSweep = {
  userKey:
    '038412b0e79372ca618978f2bc9fc944c504e828050a55a19fdfeca93cff5ec6562ae94f204a3f99e87334f812be8a54927ff24572bc666c5436887d2e42c0997d',
  backupKey:
    '038412b0e79372ca618978f2bc9fc944c504e828050a55a19fdfeca93cff5ec6562ae94f204a3f99e87334f812be8a54927ff24572bc666c5436887d2e42c0997d',
  derivationPath: 'm/0',
  derivationSeed: '',
  walletBaseAddress: '0x1469e6e519ff8bf398b76b4be0b50701b999f14c',
  recoveryDestination: '0x07efb1aa5e41b70b21facd3d287548ebf632a165',
  getTxListRequest: getTxListRequestUnsignedSweep,
  getTxListResponse: getTxListResponseUnsignedSweep,
  getBalanceRequest: getBalanceRequestUnsignedSweep,
  getBalanceResponse: getBalanceResponseUnsignedSweep,
};

const getTxListRequestNonBitGoRecovery: Record<string, string> = {
  module: 'account',
  action: 'txlist',
  address: '0xf0eb7b6448b4822bab6d1862f33d5b691e8af76d',
};

const getTxListResponseNonBitGoRecovery: Record<string, unknown> = {
  status: '1',
  result: [
    {
      hash: '0xede855d43d70ea1bb75db63d4f75113dae0845f0d4bdb0b2d8bda55249c70812',
      nonce: '23',
      from: '0xf0eb7b6448b4822bab6d1862f33d5b691e8af76d',
    },
  ],
  message: 'OK',
};

const getBalanceRequestNonBitGoRecovery: Record<string, string> = {
  module: 'account',
  action: 'balance',
  address: '0xf0eb7b6448b4822bab6d1862f33d5b691e8af76d',
};

const getBalanceResponseNonBitGoRecovery: Record<string, unknown> = {
  status: '1',
  result: '100000000000000000',
  message: 'OK',
};

export const mockDataNonBitGoRecovery = {
  recoveryDestination: '0x07efb1aa5e41b70b21facd3d287548ebf632a165',
  userKeyData:
    '{"iv":"6aXzf67jGhzF9DETi5fSYA==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"GH7WVWtq29w=","ct":"7Q4XFo963IJDtxbSUl/GQMSESIh8G7Wnlp6cj4aTNdSrPgvXKauP/ZdyeRogniIIw6fs3Xv7q09rBpv5r3vLiAURWHqoUmzEvl2Qs0XqFHT5X5qsf/neax7Bs53PgUvAxQNIq+OkAKANDYrF7MgehyPrws4lbraOXeN2kmTfxDuJK4r8ptcZzI+v+4iASLxfelXhfVz95lOi+9yhlfZjEmC6j0B7So+QTFtszeCESA93Wy3bZA0TnCSdl16i3JdRX5ZdAe+Dc+OSX8wVmOXRG7mf+IQDgB4MJSLkhlGM1AOrbTCuOLbZcUy8EqZoEwFZBoTFhAASpROwVyNgz/kjVVNiMaMCh+Lhmofb2arOg+OftBKgxF0cY4gXZ/bE+vGHjxRfA6HbeGHubo6nQev/QbWYS1TlSzGSuY4/XPvpuEvYWJW6FX8pi+u7X3yBBuQ2xzo8gA8pS0v2cTVdnxmRRXjKHZrRiAeWv1iMGK6lqkWmRZDp7xKJ69Yi07OHX/wSA9ZGTeUYxmNkAgg2WSC5CUIXrDjGrvwY9+Gf08HILOKIKdghwnO1P5nGr7Wa2/frnUafPWiR92FeDjS3/bYQQroD4+n2QFpL78lltn6O60ybQJG9y8wXG3bK1howSuIkxPJW7vsFl+/7gfEGxeTm47I6ug1ILIAkzgN8EdhvJ6wtaZ+imqoQO++YWMnI7ZaKnD/F1g10euVmujW8pYqR83m6/OzwunM7bwltEhCEc8RmUXB3imGpQgJz9jjSVBpckVV7EsUeU8RIA0ArhgOWEjtZjB7VgGD8pG1CnDNfxaP89ZEG1D8jq96L+xTwm8Lht2pf0XLzcJgsXaDFbSbKUSxdDbBWqiyXqPbQM+baaGSmuuTgIRtG5YDzRVuLfSZ8Jwk3vjQRgnEjaesI4TIzDvlCtB8qFRUzoOFQUdbyRTyu1MfURms6F0g/SZbe1VUQ67JytNcqqsdUVkjgrS29KhhXy4vfux3RBGkZh6iKQ9FDBmFYCXmo1cKHkusuBNDSnh5yCEWjsivAnjWc0qHjvOv79BaF/cUqbiHj7bZXoszNAyOn4prXVvAOVQQVun5OL83VH2DHQIM="}',
  backupKeyData:
    '{"iv":"IITI4f9oCjp4dgo4h6aL5Q==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"0dEc0kZi+3E=","ct":"hf8s5Se1rdb1lh0gXyanqAP4TrQTxK7TJtgJfZ/naN75yWwF5cC/vyFfJ4FNudXaFZ7yw0aFN+VUpp2HczFuPspw3yBpejfqjFZSijD1p2VZnNEIVZE7i+KVR0f3V+Oah+KQXCpWucT2eXSTSXAGxT3FtuS5Ro9FzltNj2xz0SM8OcunXb/0h69tisjZYOGSjSLgWFHIkhc46qukD+Ay2A1u/kSTC9l7/UTG1PncbRTlHM+Rx3I9bmCgbrNxqXpEEm2Uz3q+xQRTeC1q46sMnCfNz82GEntp5Z6SeMhlq63tZR2VIDC1lPR9ZIz1eygtK+ibT6yzFpRhBBy3QOSJPL7c9NYGGSQcNsjxsynghYBeL/K/qcPGQn18cDmGSFQmAAmUpHqPU68tQgbT6YF83Wsu5oHjDBQufdJeNH+rfWrj/qQNmwmpMkrm6EKD0tLK/8Dx4YdvvjfmB3kkniO6OFz1pQXTHn3esBL7PctjMyslNCOAP/yKFEQbUdSoGfWTIiJ1bJ8CZquCQGiRgmSE6Xv/uU81xW8BmVmmddaI0kfUTL8Uyhevbi4h8WWL15yi21fhMu0ioXmMtAfm26yubGojlMSkspVKyyDtvHzypSEde+MGp2OgTPm6JntDKzGu29MQSveTH4Y0Sz7oeocTDOfnY63xV+hKZI4C0xI6cNNDh1JyJHzO1srDrG8RfXk0o+d0vD7m/tSvsC2DnnT5kEQK+Mvs88fbi/32wu20DZYk/p3+7ZDeynGsmdzNVjPVDpI5Au4zoI4skFwzjQ/wk1HYRWK6SJizeiMgvtTubJsCFWGWdKs07CtBkaJwqxeHiVUdjYZ50hpRpiZ8SkCzQjJsiAnS8mMplBVw2zEUyIOxRbbOjzLDAI+tbrPk/SqLxFcS9DAA+mXzmmGCR4pSfJx15G0d7RlNu8wcjjCSj/f8imGkW6R2EiFlPvKgKjaqUmO+Wfe2A5ek0TxyHe2cDEKuHO4Oum/yFzCgGNGntgvT6qzybunLSM0XBMvqTEOClpcuZS/DPbk4F7w6DMCR5Yg6zEw58wDWqZjOpWP7s/j5F5TFZBfvNzGakgTYRNxg"}',
  walletPassphrase: 'prithvishet2503',
  walletRootAddress: '0xf0eb7b6448b4822bab6d1862f33d5b691e8af76d',
  getTxListRequest: getTxListRequestNonBitGoRecovery,
  getTxListResponse: getTxListResponseNonBitGoRecovery,
  getBalanceRequest: getBalanceRequestNonBitGoRecovery,
  getBalanceResponse: getBalanceResponseNonBitGoRecovery,
};
