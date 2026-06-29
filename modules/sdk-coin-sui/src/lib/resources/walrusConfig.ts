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

  WALRUS_PKG_ID: '0x98da433aa0139512c210597b1c5e3df6cd121d8d77f8652691bb66fadfc8aa1b',
  WAL_PKG_ID: '0x356a26eb9e012a68958082340d4c4116e7f55615cf27affcff209cf0ae544f59',
};
