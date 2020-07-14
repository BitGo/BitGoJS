/*

The values for the various fork coins can be found in these files:

property       filename             varname                           notes
------------------------------------------------------------------------------------------------------------------------
messagePrefix  src/validation.cpp   strMessageMagic                   Format `${CoinName} Signed Message`
bech32_hrp     src/chainparams.cpp  bech32_hrp                        Only for some networks
bip32.public   src/chainparams.cpp  base58Prefixes[EXT_PUBLIC_KEY]    Mainnets have same value, testnets have same value
bip32.private  src/chainparams.cpp  base58Prefixes[EXT_SECRET_KEY]    Mainnets have same value, testnets have same value
pubKeyHash     src/chainparams.cpp  base58Prefixes[PUBKEY_ADDRESS]
scriptHash     src/chainparams.cpp  base58Prefixes[SCRIPT_ADDRESS]
wif            src/chainparams.cpp  base58Prefixes[SECRET_KEY]        Testnets have same value

*/

const coins = {
  BCH: 'bch',
  BSV: 'bsv',
  BTC: 'btc',
  BTG: 'btg',
  LTC: 'ltc',
  ZEC: 'zec',
  DASH: 'dash'
}

function getDefaultBip32Mainnet () {
  return {
    // base58 'xpub'
    public: 0x0488b21e,
    // base58 'xprv'
    private: 0x0488ade4
  }
}

function getDefaultBip32Testnet () {
  return {
    // base58 'tpub'
    public: 0x043587cf,
    // base58 'tprv'
    private: 0x04358394
  }
}

module.exports = {

  // https://github.com/bitcoin/bitcoin/blob/master/src/validation.cpp
  // https://github.com/bitcoin/bitcoin/blob/master/src/chainparams.cpp
  bitcoin: {
    messagePrefix: '\x18Bitcoin Signed Message:\n',
    bech32: 'bc',
    bip32: getDefaultBip32Mainnet(),
    pubKeyHash: 0x00,
    scriptHash: 0x05,
    wif: 0x80,
    coin: coins.BTC
  },
  testnet: {
    messagePrefix: '\x18Bitcoin Signed Message:\n',
    bech32: 'tb',
    bip32: getDefaultBip32Testnet(),
    pubKeyHash: 0x6f,
    scriptHash: 0xc4,
    wif: 0xef,
    coin: coins.BTC
  },

  // https://github.com/Bitcoin-ABC/bitcoin-abc/blob/master/src/validation.cpp
  // https://github.com/Bitcoin-ABC/bitcoin-abc/blob/master/src/chainparams.cpp
  bitcoincash: {
    messagePrefix: '\x18Bitcoin Signed Message:\n',
    bip32: getDefaultBip32Mainnet(),
    pubKeyHash: 0x00,
    scriptHash: 0x05,
    wif: 0x80,
    coin: coins.BCH,
    forkId: 0x00
  },
  bitcoincashTestnet: {
    messagePrefix: '\x18Bitcoin Signed Message:\n',
    bip32: getDefaultBip32Testnet(),
    pubKeyHash: 0x6f,
    scriptHash: 0xc4,
    wif: 0xef,
    coin: coins.BCH
  },

  // https://github.com/BTCGPU/BTCGPU/blob/master/src/validation.cpp
  // https://github.com/BTCGPU/BTCGPU/blob/master/src/chainparams.cpp
  bitcoingold: {
    messagePrefix: '\x18Bitcoin Gold Signed Message:\n',
    bech32: 'btg',
    bip32: getDefaultBip32Mainnet(),
    pubKeyHash: 0x26,
    scriptHash: 0x17,
    wif: 0x80,
    coin: coins.BTG,
    forkId: 0x4F /* 79 */
  },
  // bitcoingoldTest: TODO

  // https://github.com/bitcoin-sv/bitcoin-sv/blob/master/src/validation.cpp
  // https://github.com/bitcoin-sv/bitcoin-sv/blob/master/src/chainparams.cpp
  bitcoinsv: {
    messagePrefix: '\x18Bitcoin Signed Message:\n',
    bip32: getDefaultBip32Mainnet(),
    pubKeyHash: 0x00,
    scriptHash: 0x05,
    wif: 0x80,
    coin: coins.BSV,
    forkId: 0x00
  },
  bitcoinsvTestnet: {
    messagePrefix: '\x18Bitcoin Signed Message:\n',
    bip32: getDefaultBip32Testnet(),
    pubKeyHash: 0x6f,
    scriptHash: 0xc4,
    wif: 0xef,
    coin: coins.BSV
  },

  // https://github.com/dashpay/dash/blob/master/src/validation.cpp
  // https://github.com/dashpay/dash/blob/master/src/chainparams.cpp
  dash: {
    messagePrefix: '\x19DarkCoin Signed Message:\n',
    bip32: getDefaultBip32Mainnet(),
    pubKeyHash: 0x4c,
    scriptHash: 0x10,
    wif: 0xcc,
    coin: coins.DASH
  },
  dashTest: {
    messagePrefix: '\x19DarkCoin Signed Message:\n',
    bip32: getDefaultBip32Testnet(),
    pubKeyHash: 0x8c,
    scriptHash: 0x13,
    wif: 0xef,
    coin: coins.DASH
  },

  // https://github.com/litecoin-project/litecoin/blob/master/src/validation.cpp
  // https://github.com/litecoin-project/litecoin/blob/master/src/chainparams.cpp
  litecoin: {
    messagePrefix: '\x19Litecoin Signed Message:\n',
    bech32: 'ltc',
    bip32: getDefaultBip32Mainnet(),
    pubKeyHash: 0x30,
    scriptHash: 0x32,
    wif: 0xb0,
    coin: coins.LTC
  },
  litecoinTest: {
    messagePrefix: '\x19Litecoin Signed Message:\n',
    bech32: 'tltc',
    bip32: getDefaultBip32Testnet(),
    pubKeyHash: 0x6f,
    scriptHash: 0x3a,
    wif: 0xef,
    coin: coins.LTC
  },

  // https://github.com/zcash/zcash/blob/master/src/validation.cpp
  // https://github.com/zcash/zcash/blob/master/src/chainparams.cpp
  zcash: {
    messagePrefix: '\x18ZCash Signed Message:\n',
    bip32: getDefaultBip32Mainnet(),
    pubKeyHash: 0x1cb8,
    scriptHash: 0x1cbd,
    wif: 0x80,
    // This parameter was introduced in version 3 to allow soft forks, for version 1 and 2 transactions we add a
    // dummy value.
    consensusBranchId: {
      1: 0x00,
      2: 0x00,
      3: 0x5ba81b19,
      // 4: 0x76b809bb (old Sapling branch id). Blossom branch id becomes effective after block 653600
      // 4: 0x2bb40e60
      4: 0xf5b9230b
    },
    coin: coins.ZEC
  },
  zcashTest: {
    messagePrefix: '\x18ZCash Signed Message:\n',
    bip32: getDefaultBip32Testnet(),
    pubKeyHash: 0x1d25,
    scriptHash: 0x1cba,
    wif: 0xef,
    consensusBranchId: {
      1: 0x00,
      2: 0x00,
      3: 0x5ba81b19,
      // 4: 0x76b809bb (old Sapling branch id)
      // 4: 0x2bb40e60
      4: 0xf5b9230b
    },
    coin: coins.ZEC
  }
}
