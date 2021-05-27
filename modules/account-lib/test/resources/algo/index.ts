/*
 * secret/public keys are from RFC 8032
 *
 */

export const accounts = {
  account1: {
    secretKey: Buffer.from('9d61b19deffd5a60ba844af492ec2cc44449c5697b326919703bac031cae7f60', 'hex'),
    pubKey: Buffer.from('d75a980182b10ab7d54bfed3c964073a0ee172f3daa62325af021a68f707511a', 'hex'),
    address: '25NJQAMCWEFLPVKL73J4SZAHHIHOC4XT3KTCGJNPAINGR5YHKENMEF5QTE',
  },
  account2: {
    secretKey: Buffer.from('4ccd089b28ff96da9db6c346ec114e0f5b8a319f35aba624da8cf6ed4fb8a6fb', 'hex'),
    pubKey: Buffer.from('3d4017c3e843895a92b70aa74d1b7ebc9c982ccf2ec4968cc0cd55f12af4660c', 'hex'),
    address: 'HVABPQ7IIOEVVEVXBKTU2G36XSOJQLGPF3CJNDGAZVK7CKXUMYGA6EOE6Y',
  },
  account3: {
    secretKey: Buffer.from('c5aa8df43f9f837bedb7442f31dcb7b166d38535076f094b85ce3a2e0b4458f7', 'hex'),
    pubKey: Buffer.from('fc51cd8e6218a1a38da47ed00230f0580816ed13ba3303ac5deb911548908025', 'hex'),
    address: '7RI43DTCDCQ2HDNEP3IAEMHQLAEBN3ITXIZQHLC55OIRKSEQQAS52OYKJE',
  },
  default: {
    secretKey: Buffer.from('0000000000000000000000000000000000000000000000000000000000000000', 'hex'),
    pubKey: Buffer.from('3b6a27bcceb6a42d62a3a8d02a6f0d73653215771de243a63ac048a18b59da29', 'hex'),
    address: 'HNVCPPGOW2SC2YVDVDICU3YNONSTEFLXDXREHJR2YBEKDC2Z3IUZSC6YGI',
  },
} as const;

export const networks = {
  mainnet: {
    genesisID: 'mainnet-v1.0',
    genesisHash: 'wGHE2Pwdvd7S12BL5FaOP20EGYesN73ktiC1qzkkit8=',
  },
  testnet: {
    genesisID: 'testnet-v1.0',
    genesisHash: 'SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiI=',
  },
  betanet: {
    genesisID: 'betanet-v1.0',
    genesisHash: 'mFgazF+2uRS1tMiL9dsj01hJGySEmPN28B/TjjvpVW0=',
  },
} as const;
