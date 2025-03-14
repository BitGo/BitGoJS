import { SharedObjectRef } from '../mystenlab/types';

export const WALRUS_TESTNET_CONFIG = {
  WALRUS_SYSTEM_OBJECT: {
    objectId: '0x98ebc47370603fe81d9e15491b2f1443d619d1dab720d586e429ed233e1255c1',
    initialSharedVersion: 1,
    mutable: true,
  } as SharedObjectRef,

  WALRUS_STAKING_OBJECT: {
    objectId: '0x20266a17b4f1a216727f3eef5772f8d486a9e3b5e319af80a5b75809c035561d',
    initialSharedVersion: 334023834,
    mutable: true,
  } as SharedObjectRef,

  WALRUS_PKG_ID: '0x261b2e46428a152570f9ac08972d67f7c12d62469ccd381a51774c1df7a829ca',
  WALRUS_STAKING_MODULE_NAME: 'staking',
  WALRUS_STAKE_WITH_POOL_FUN_NAME: 'stake_with_pool',

  WAL_PKG_ID: '0x8190b041122eb492bf63cb464476bd68c6b7e570a4079645a8b28732b6197a82',
  WAL_COIN_MODULE_NAME: 'wal',
  WAL_COIN_NAME: 'WAL',
};

export const WALRUS_PROD_CONFIG = {
  ...WALRUS_TESTNET_CONFIG,

  WALRUS_SYSTEM_OBJECT: {
    objectId: '0x2134d52768ea07e8c43570ef975eb3e4c27a39fa6396bef985b5abc58d03ddd2',
    initialSharedVersion: 1,
    mutable: true,
  } as SharedObjectRef,

  WALRUS_STAKING_OBJECT: {
    objectId: '0x10b9d30c28448939ce6c4d6c6e0ffce4a7f8a4ada8248bdad09ef8b70e4a3904',
    initialSharedVersion: 317862159,
    mutable: true,
  } as SharedObjectRef,

  WALRUS_PKG_ID: '0xfdc88f7d7cf30afab2f82e8380d11ee8f70efb90e863d1de8616fae1bb09ea77',
  WAL_PKG_ID: '0x356a26eb9e012a68958082340d4c4116e7f55615cf27affcff209cf0ae544f59',
};
