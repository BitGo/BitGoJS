const getTxListRequestUnsignedSweep: Record<string, string> = {
  chainid: '114',
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
  chainid: '114',
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
  chainid: '114',
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
  chainid: '114',
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

/**
 * Test data for Export C to P transactions
 * Based on actual FlrP ExportInC transaction format
 */
export const EXPORT_C_TEST_DATA = {
  // P-chain address format for Flare (testnet uses costwo prefix)
  pAddresses: [
    'P-costwo1zt9n96hey4fsvnde35n3k4kt5pu7c784dzewzd',
    'P-costwo1cwrdtrgf4xh80ncu7palrjw7gn4mpj0n4dxghh',
    'P-costwo15msvr27szvhhpmah0c38gcml7vm29xjh7tcek8',
  ],
  // Multisig P-chain address (tilde-separated)
  pMultisigAddress:
    'P-costwo1zt9n96hey4fsvnde35n3k4kt5pu7c784dzewzd~P-costwo1cwrdtrgf4xh80ncu7palrjw7gn4mpj0n4dxghh~P-costwo15msvr27szvhhpmah0c38gcml7vm29xjh7tcek8',
  // C-chain hex address
  cHexAddress: '0x28A05933dC76e4e6c25f35D5c9b2A58769700E76',
  // Amount in nanoFLR (0.00005 FLR = 50000000 nanoFLR)
  amount: '50000000',
  // Transaction nonce
  nonce: 9,
  // Multisig threshold
  threshold: 2,
  // Fee in nanoFLR
  fee: '281750',
  // Target chain ID (P-chain)
  targetChainId: '11111111111111111111111111111111LpoYY',
  // Transaction hash
  txhash: 'KELMR2gmYpRUeXRyuimp1xLNUoHSkwNUURwBn4v1D4aKircKR',
  // Unsigned transaction hex (Export from C to P)
  unsignedTxHex:
    '0x0000000000010000007278db5c30bed04c05ce209179812850bbb3fe6d46d7eef3744d814c0da555247900000000000000000000000000000000000000000000000000000000000000000000000128a05933dc76e4e6c25f35d5c9b2a58769700e760000000002ff3d1658734f94af871c3d131b56131b6fb7a0291eacadd261e69dfb42a9cdf6f7fddd00000000000000090000000158734f94af871c3d131b56131b6fb7a0291eacadd261e69dfb42a9cdf6f7fddd000000070000000002faf0800000000000000000000000020000000312cb32eaf92553064db98d271b56cba079ec78f5a6e0c1abd0132f70efb77e2274637ff336a29a57c386d58d09a9ae77cf1cf07bf1c9de44ebb0c9f3',
  // Signed transaction hex
  fullsigntxHex:
    '0x0000000000010000007278db5c30bed04c05ce209179812850bbb3fe6d46d7eef3744d814c0da555247900000000000000000000000000000000000000000000000000000000000000000000000128a05933dc76e4e6c25f35d5c9b2a58769700e760000000002ff3d1658734f94af871c3d131b56131b6fb7a0291eacadd261e69dfb42a9cdf6f7fddd00000000000000090000000158734f94af871c3d131b56131b6fb7a0291eacadd261e69dfb42a9cdf6f7fddd000000070000000002faf0800000000000000000000000020000000312cb32eaf92553064db98d271b56cba079ec78f5a6e0c1abd0132f70efb77e2274637ff336a29a57c386d58d09a9ae77cf1cf07bf1c9de44ebb0c9f300000001000000090000000133f126dee90108c473af9513ebd9eb1591a701b5dfc69041075b303b858fee0609ca9a60208b46f6836f0baf1a9fba740d97b65d45caae10470b5fa707eb45c900',
  // Private key for signing
  privKey: '14977929a4e00e4af1c33545240a6a5a08ca3034214618f6b04b72b80883be3a',
};
