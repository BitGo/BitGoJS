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
  address: '0xfeffc77a7b7e4921484e9af3fd5602b5a2c9018e',
};

const getTxListResponseNonBitGoRecovery: Record<string, unknown> = {
  status: '1',
  result: [
    {
      hash: '0xede855d43d70ea1bb75db63d4f75113dae0845f0d4bdb0b2d8bda55249c70812',
      nonce: '23',
      from: '0xfeffc77a7b7e4921484e9af3fd5602b5a2c9018e',
    },
  ],
  message: 'OK',
};

const getBalanceRequestNonBitGoRecovery: Record<string, string> = {
  module: 'account',
  action: 'balance',
  address: '0xfeffc77a7b7e4921484e9af3fd5602b5a2c9018e',
};

const getBalanceResponseNonBitGoRecovery: Record<string, unknown> = {
  status: '1',
  result: '100000000000000000',
  message: 'OK',
};

export const mockDataNonBitGoRecovery = {
  recoveryDestination: '0xc97d9c8d769aefcc7c32857b5cc583f30ad68ecb',
  userKeyData:
    '{"iv":"/bk/xK76bHfCug3ko8pvKg==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"Q84QpUq1ybI=","ct":"c5LT7X2W6DQyj4OQv3IdGdaphbupQKviqHuOEr9coVoB0MNVSBbo5PuWoVWUe1CK/2GLZpXKXcpii6pUEYA+RgHKLCvNXN1jmSW/QwePQjHTKLC5yjL4huLkmxKTYBpNz2FttuvkdjNVMUMmBAyv0lWhq2hQf2VAq+7XfzXRyhm8f8CuYvFNp3M0NrxZmphMayg2WPd3ONymZKjTwxNak9DzZ0duWqeGaT+tSAbBLQp9Y3s8qVMEHj8to/gJGXxRaWYT2Zxb5OLR6qkjRYwwP8E8ywllgYxn5diSPkS/2QFLqRVoT1WxmJT2P9nwfhabiZi7U1owwvFBp27eF4efpx+bXoH89eqldSJGGOV8rwR3MUuAdLx5cNYqsC3h4biiam5cz7uuN7NVuOlE+46qqWekQlxgWmJrGi8dmbxrbcpVoerLl1ozU4DbIbrzuFfm9ncwy3tsKiALNyXmYTwOl505Knb7zCkHRFAauNSTiHvF1syPgixwNWV4J+dSFHjdWjoldwvoRsggS85u5qxk738aTc9umFVo9mOIQmHZUYZA22PocvzUW1EchSulbVDHPbQVZ1DrRDVMJ+MzhT+t+ePlXP2RBxL69zTnK+2L2Xa9doRhVnbOCFA/lEx2WMhiV2c95gakkucs0YGcwmqQZ/6ttc1wdkIKf27hsyAiUP8HczzgogwXIzSss2WilMxXV+VBmNFxuAACC6fGSKwAaqbBm5XdI51KO+A3V24ImfzZPNvnsJ21TkZQ3hlUf6Mznii/lV0bR+zG9mQ6riWyDKunMzl5zNy/eDh0vUJQrz5OxOxCghME9bem4aV4Wy4qt7L58N9Sh3GcV1CmgeQJXS3gB1YtjD8RFUG2dwGqLNhbJ4N8V6B441mF6ZdswoJcUbTqQWOL1QP20XWwhcxV97FTGsHfYZT/jqG36eFMDzLInkSYzmhgm+Cc0esqdwxJ+rFhahvKUlGxVJ9SZmu2m9Y9FwCdtMlHcETK+00iVuZfZscDfBMgGeMcBhDzu6PRCB4nBohztTZbzSjr3x2AS5Aoe9KZUxr2DzCVWmOT9LU9bQ8dnec0Dj8hgLdzPpi0XtV4UttGQnuCv7awRWmHIg=="}',
  backupKeyData:
    '{"iv":"o/6M84s9QYg6J4qBFPnT1g==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"TXOYiG8qw5A=","ct":"4u6DPzyq1G8uvsrbOcTLOPpP8ITMZkDnh/sVlneLOxjHy6TELzgL1+XmO+SLqY+BPA7lX/kmWVnyEPX/Wy+SHAufr4gA9N6GHio9wPLQ0fnN59VYgB1px9405wW+JMo2e1gtGF4Gr2rLXdbSncIfw2V5dJ4SeHlHtiQZyc2JTy+PFHsrtfHcilBlf/5P4otEhf9RY5cAL05WvyGuFiap+u9LCMCWzlSdS8qdi0Tk8ci6FQ7ku/0aOOHvG2bikeKVMraarngYIHEmEIgKdutCNqWTlqnBi+aTI8GUdwc/Gb2aKg1pfdmhqujlDfsSs4e54UqjNACo4vAtolAhPdTtZHosJ90F5BUSlxvDeMURA6LnkCZ2sMVOaegEXGfU3EnmL+92mYzlwENpjaKQaTqHWCJYm1LCOtgAItXNAfRqqENNWMsoZBd/16Rf8LjePMvUXbzBDJ7/CYPkuMusNBga9gjbp1H/YcH29oJmKQyZOh7dNzshpmiyi3B/IzgxZxD9VbJER3/0mzgAa8dIx884UUOIOEeTbomx0HIJyTnLBL8xhT/5oiWO6bINWx0Mm9dLnnQH4hKdNGpx0VKRMhAh38axiRgGg52HZ3zOatOHXfoTmY50+JWcX+nDGOdxdHsLBJvTU+FEgVtFlrGw36cdePcc8BeHFmMuOFZ3gIer+PBxtoUsfcW6Yxs0ieRSlpx6kNjX38wMBRSmOeGtLy9PmBf7Uzi1/qkPUXATkT7+t6J+E3uEcdoG2Pu+7djv7esATFXpG7dDZXKXm7B3eRRDrWehzL/y2ZHbyQwG5konCtWx+rTzjSh6veAQ1MkbNtC8RQV391KPvhcDrCy4Tb0USjLgLjstaR51EOUKK5M6bX0E0n5gLN53JE25SPLgrWQrs43wGs/zEbGzq+ZuTbQRNldJPhiln4+Q1MrxE9ZZ9sVDRDqmQ41nWn1+doEo0gsB93H9LkZCRq+zAuaWyyWmMs2tyNOXQFQL5zEV8Fd4tlPCIwjmAv6oyZlwHAU3A3lqi4Up/pBmy5UcxJ+5Q2a1Bci5wjRCNxrM1QFY10thMqFU+w6w1OzEdzCrp45VbG2fKiUkMC7ZF8Qv3qPB"}',
  walletPassphrase: 'prithvishet2503',
  walletRootAddress: '0xfeffc77a7b7e4921484e9af3fd5602b5a2c9018e',
  getTxListRequest: getTxListRequestNonBitGoRecovery,
  getTxListResponse: getTxListResponseNonBitGoRecovery,
  getBalanceRequest: getBalanceRequestNonBitGoRecovery,
  getBalanceResponse: getBalanceResponseNonBitGoRecovery,
};
