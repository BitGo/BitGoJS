import { SharedObjectRef } from '../mystenlab/types';

export const WALRUS_TESTNET_CONFIG = {
  WALRUS_SYSTEM_OBJECT: {
    objectId: '0x6c2547cbbc38025cf3adac45f63cb0a8d12ecf777cdc75a4971612bf97fdf6af',
    initialSharedVersion: 400185623,
    mutable: true,
  } as SharedObjectRef,

  WALRUS_STAKING_OBJECT: {
    objectId: '0xbe46180321c30aab2f8b3501e24048377287fa708018a5b7c2792b35fe339ee3',
    initialSharedVersion: 400185623,
    mutable: true,
  } as SharedObjectRef,

  WALRUS_PKG_ID: '0x849e95d2718938d66c37fb91df76d72f78526c1864c339bac415ce8ecda2d8cc',
  WALRUS_STAKING_MODULE_NAME: 'staking',
  WALRUS_STAKE_WITH_POOL_FUN_NAME: 'stake_with_pool',

  WAL_PKG_ID: '0x8270feb7375eee355e64fdb69c50abb6b5f9393a722883c1cf45f8e26048810a',
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

  WALRUS_PKG_ID: '0x98da433aa0139512c210597b1c5e3df6cd121d8d77f8652691bb66fadfc8aa1b',
  WAL_PKG_ID: '0x356a26eb9e012a68958082340d4c4116e7f55615cf27affcff209cf0ae544f59',
};
