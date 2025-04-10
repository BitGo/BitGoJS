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
