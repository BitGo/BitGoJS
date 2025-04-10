const getTxListRequestUnsignedSweep: Record<string, string> = {
  module: 'account',
  action: 'txlist',
  address: '0x7f3f0386b3e17d24e7d7b6bcfffa3d92b8bf8a68',
};

const getTxListResponseUnsignedSweep: Record<string, unknown> = {
  status: '1',
  result: [
    {
      hash: '0xede855d43d70ea1bb75db63d4f75113dae0845f0d4bdb0b2d8bda55249c70812',
      nonce: '23',
      from: '0x7f3f0386b3e17d24e7d7b6bcfffa3d92b8bf8a68',
    },
  ],
  message: 'OK',
};

const getBalanceRequestUnsignedSweep: Record<string, string> = {
  module: 'account',
  action: 'balance',
  address: '0x7f3f0386b3e17d24e7d7b6bcfffa3d92b8bf8a68',
};

const getBalanceResponseUnsignedSweep: Record<string, unknown> = {
  status: '1',
  result: '100000000000000000',
  message: 'OK',
};

export const mockDataUnsignedSweep = {
  userKey:
    '029dd2bdb90da985dc9c2c2bdf0f805ac21832462db53cd99ddf41d2f2dd2a31f2860c724001470a59b38bf67de19481e2811731d4efcd5b496de2ce3fe9baa18e',
  backupKey:
    '029dd2bdb90da985dc9c2c2bdf0f805ac21832462db53cd99ddf41d2f2dd2a31f2860c724001470a59b38bf67de19481e2811731d4efcd5b496de2ce3fe9baa18e',
  derivationPath: 'm/0',
  derivationSeed: '',
  walletBaseAddress: '0x7f3f0386b3e17d24e7d7b6bcfffa3d92b8bf8a68',
  recoveryDestination: '0xb986fd8081b8ca18cc343881bec0a70757309187',
  getTxListRequest: getTxListRequestUnsignedSweep,
  getTxListResponse: getTxListResponseUnsignedSweep,
  getBalanceRequest: getBalanceRequestUnsignedSweep,
  getBalanceResponse: getBalanceResponseUnsignedSweep,
};
