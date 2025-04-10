const getTxListRequestUnsignedSweep: Record<string, string> = {
  module: 'account',
  action: 'txlist',
  address: '0x742838193c4169f6b2ba7b0e03f723c3ba0928e1',
};

const getTxListResponseUnsignedSweep: Record<string, unknown> = {
  status: '1',
  result: [
    {
      hash: '0xede855d43d70ea1bb75db63d4f75113dae0845f0d4bdb0b2d8bda55249c70812',
      nonce: '23',
      from: '0x742838193c4169f6b2ba7b0e03f723c3ba0928e1',
    },
  ],
  message: 'OK',
};

const getBalanceRequestUnsignedSweep: Record<string, string> = {
  module: 'account',
  action: 'balance',
  address: '0x742838193c4169f6b2ba7b0e03f723c3ba0928e1',
};

const getBalanceResponseUnsignedSweep: Record<string, unknown> = {
  status: '1',
  result: '100000000000000000',
  message: 'OK',
};

export const mockDataUnsignedSweep = {
  userKey:
    '029d2ded2d39ee7cd8d8bbba8b25e4c60bb09297936fa6b223de1f495b5ee20dcaf762367f9691f7719cb5e13e59d725669a18aad1e2522dd141fa4c7fd3d25c17',
  backupKey:
    '029d2ded2d39ee7cd8d8bbba8b25e4c60bb09297936fa6b223de1f495b5ee20dcaf762367f9691f7719cb5e13e59d725669a18aad1e2522dd141fa4c7fd3d25c17',
  derivationPath: 'm/0',
  derivationSeed: '',
  walletBaseAddress: '0x742838193c4169f6b2ba7b0e03f723c3ba0928e1',
  recoveryDestination: '0xd76b586901850f2c656db0cbef795c0851bbec35',
  getTxListRequest: getTxListRequestUnsignedSweep,
  getTxListResponse: getTxListResponseUnsignedSweep,
  getBalanceRequest: getBalanceRequestUnsignedSweep,
  getBalanceResponse: getBalanceResponseUnsignedSweep,
};
