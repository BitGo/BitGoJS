const common = require('./common');
const _ = require('lodash');

// Estimate for virtual sizes of various tx inputs
exports.tx = {
  P2SH_INPUT_SIZE: 296,
  P2SH_P2WSH_INPUT_SIZE: 139,
  P2PKH_INPUT_SIZE: 160, // Uncompressed
  OUTPUT_SIZE: 34,
  TX_OVERHEAD_SIZE: 10
};

// The derivation paths of the different address chains
exports.chains = {
  CHAIN_P2SH: 0,
  CHANGE_CHAIN_P2SH: 1,
  CHAIN_SEGWIT: 10,
  CHANGE_CHAIN_SEGWIT: 11
};

exports.tokens = {
  // network name for production environments (prod tokens must be added here)
  bitcoin: {
    eth: {
      tokens: [
        { type: 'erc', coin: 'eth', network: 'Mainnet', name: 'ERC Token', tokenContractAddress: '0x8e35d374594fa07d0de5c5e6563766cd24336251', decimalPlaces: 0 },
        { type: 'omg', coin: 'eth', network: 'Mainnet', name: 'OmiseGO Token', tokenContractAddress: '0xd26114cd6ee289accf82350c8d8487fedb8a0c07', decimalPlaces: 18 },
        { type: 'rep', coin: 'eth', network: 'Mainnet', name: 'Augur', tokenContractAddress: '0x1985365e9f78359a9b6ad760e32412f4a445e862', decimalPlaces: 18 },
        { type: 'pay', coin: 'eth', network: 'Mainnet', name: 'TenX', tokenContractAddress: '0xb97048628db6b661d4c2aa833e95dbe1a905b280', decimalPlaces: 18 },
        { type: 'bst', coin: 'eth', network: 'Mainnet', name: 'BitGo Shield Token', tokenContractAddress: '0x18ad17ff2dfcfd647db497b1e2cbd76de4da40fc', decimalPlaces: 0 },
        { type: 'gnt', coin: 'eth', network: 'Mainnet', name: 'Golem', tokenContractAddress: '0xa74476443119a942de498590fe1f2454d7d4ac0d', decimalPlaces: 18 },
        { type: 'bat', coin: 'eth', network: 'Mainnet', name: 'Basic Attention Token', tokenContractAddress: '0x0d8775f648430679a709e98d2b0cb6250d2887ef', decimalPlaces: 18 },
        { type: 'knc', coin: 'eth', network: 'Mainnet', name: 'Kyber Network', tokenContractAddress: '0xdd974d5c2e2928dea5f71b9825b8b646686bd200', decimalPlaces: 18 },
        { type: 'zrx', coin: 'eth', network: 'Mainnet', name: '0x Token', tokenContractAddress: '0xe41d2489571d322189246dafa5ebde1f4699f498', decimalPlaces: 18 },
        { type: 'fun', coin: 'eth', network: 'Mainnet', name: 'FunFair', tokenContractAddress: '0x419d0d8bdd9af5e606ae2232ed285aff190e711b', decimalPlaces: 8 },
        { type: 'cvc', coin: 'eth', network: 'Mainnet', name: 'Civic', tokenContractAddress: '0x41e5560054824ea6b0732e656e3ad64e20e94e45', decimalPlaces: 8 },
        { type: 'qrl', coin: 'eth', network: 'Mainnet', name: 'Qrl', tokenContractAddress: '0x697beac28b09e122c4332d163985e8a73121b97f', decimalPlaces: 8 },
        { type: 'nmr', coin: 'eth', network: 'Mainnet', name: 'Numeraire', tokenContractAddress: '0x1776e1f26f98b1a5df9cd347953a26dd3cb46671', decimalPlaces: 18 },
        { type: 'brd', coin: 'eth', network: 'Mainnet', name: 'Bread', tokenContractAddress: '0x558ec3152e2eb2174905cd19aea4e34a23de9ad6', decimalPlaces: 18 },
        { type: 'wax', coin: 'eth', network: 'Mainnet', name: 'Wax', tokenContractAddress: '0x39bb259f66e1c59d5abef88375979b4d20d98022', decimalPlaces: 8 },
        { type: 'mkr', coin: 'eth', network: 'Mainnet', name: 'Maker', tokenContractAddress: '0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2', decimalPlaces: 18 },
        { type: 'trx', coin: 'eth', network: 'Mainnet', name: 'Tronix', tokenContractAddress: '0xf230b790e05390fc8295f4d3f60332c93bed42e2', decimalPlaces: 6 },
        { type: 'ven', coin: 'eth', network: 'Mainnet', name: 'VeChain Token', tokenContractAddress: '0xd850942ef8811f2a866692a623011bde52a462c1', decimalPlaces: 18 },
        { type: 'bnb', coin: 'eth', network: 'Mainnet', name: 'BNB', tokenContractAddress: '0xb8c77482e45f1f44de1745f52c74426c631bdd52', decimalPlaces: 18 },
        { type: 'icx', coin: 'eth', network: 'Mainnet', name: 'Icon', tokenContractAddress: '0xb5a5f22694352c15b00323844ad545abb2b11028', decimalPlaces: 18 },
        { type: 'btm', coin: 'eth', network: 'Mainnet', name: 'Bytom', tokenContractAddress: '0xcb97e65f07da24d46bcdd078ebebd7c6e6e3d750', decimalPlaces: 8 },
        { type: 'ppt', coin: 'eth', network: 'Mainnet', name: 'Populous Platform', tokenContractAddress: '0xd4fa1460f537bb9085d22c7bccb5dd450ef28e3a', decimalPlaces: 8 },
        { type: 'dgd', coin: 'eth', network: 'Mainnet', name: 'Digix DAO', tokenContractAddress: '0xe0b7927c4af23765cb51314a0e0521a9645f0e2a', decimalPlaces: 9 },
        { type: 'rhoc', coin: 'eth', network: 'Mainnet', name: 'RHOC', tokenContractAddress: '0x168296bb09e24a88805cb9c33356536b980d3fc5', decimalPlaces: 8 },
        { type: 'ae', coin: 'eth', network: 'Mainnet', name: 'Aeternity', tokenContractAddress: '0x5ca9a71b1d01849c0a95490cc00559717fcf0d1d', decimalPlaces: 18 },
        { type: 'eto', coin: 'eth', network: 'Mainnet', name: 'Ethos Coin', tokenContractAddress: '0x5af2be193a6abca9c8817001f45744777db30756', decimalPlaces: 8 },
        { type: 'zil', coin: 'eth', network: 'Mainnet', name: 'Zilliqa', tokenContractAddress: '0x05f4a42e251f2d52b8ed15e9fedaacfcef1fad27', decimalPlaces: 12 },
        { type: 'iost', coin: 'eth', network: 'Mainnet', name: 'IOSToken', tokenContractAddress: '0xfa1a856cfa3409cfa145fa4e20eb270df3eb21ab', decimalPlaces: 18 },
        { type: 'lrc', coin: 'eth', network: 'Mainnet', name: 'loopring', tokenContractAddress: '0xef68e7c694f40c8202821edf525de3782458639f', decimalPlaces: 18 },
        { type: 'AION', coin: 'eth', network: 'Mainnet', name: 'Aion', tokenContractAddress: '0x4ceda7906a5ed2179785cd3a40a69ee8bc99c466', decimalPlaces: 8 },
        { type: 'kcs', coin: 'eth', network: 'Mainnet', name: 'Kucoin Shares', tokenContractAddress: '0x039b5649a59967e3e936d7471f9c3700100ee1ab', decimalPlaces: 6 },
        { type: 'wtc', coin: 'eth', network: 'Mainnet', name: 'Walton Token', tokenContractAddress: '0xb7cb1c96db6b22b0d3d9536e0108d062bd488f74', decimalPlaces: 18 },
        { type: 'cennz', coin: 'eth', network: 'Mainnet', name: 'Centrality', tokenContractAddress: '0x1122b6a0e00dce0563082b6e2953f3a943855c1f', decimalPlaces: 18 },
        { type: 'veri', coin: 'eth', network: 'Mainnet', name: 'Veritaseum', tokenContractAddress: '0x8f3470a7388c05ee4e7af3d01d8c722b0ff52374', decimalPlaces: 18 },
        { type: 'quash', coin: 'eth', network: 'Mainnet', name: 'Qash', tokenContractAddress: '0x618e75ac90b12c6049ba3b27f5d5f8651b0037f6', decimalPlaces: 6 },
        { type: 'drgn', coin: 'eth', network: 'Mainnet', name: 'Dragonchain', tokenContractAddress: '0x419c4db4b9e25d6db2ad9691ccb832c8d9fda05e', decimalPlaces: 18 },
        { type: 'nas', coin: 'eth', network: 'Mainnet', name: 'Nebulas', tokenContractAddress: '0x5d65d971895edc438f465c17db6992698a52318d', decimalPlaces: 18 },
        { type: 'sub', coin: 'eth', network: 'Mainnet', name: 'Substratum', tokenContractAddress: '0x12480e24eb5bec1a9d4369cab6a80cad3c0a377a', decimalPlaces: 2 },
        { type: 'r', coin: 'eth', network: 'Mainnet', name: 'Revain', tokenContractAddress: '0x48f775efbe4f5ece6e0df2f7b5932df56823b990', decimalPlaces: 0 },
        { type: 'salt', coin: 'eth', network: 'Mainnet', name: 'Salt', tokenContractAddress: '0x4156d3342d5c385a87d264f90653733592000581', decimalPlaces: 8 },
        { type: 'link', coin: 'eth', network: 'Mainnet', name: 'ChainLink', tokenContractAddress: '0x514910771af9ca656af840dff83e8264ecf986ca', decimalPlaces: 18 },
        { type: 'ncash', coin: 'eth', network: 'Mainnet', name: 'Nucleus Vision', tokenContractAddress: '0x809826cceab68c387726af962713b64cb5cb3cca', decimalPlaces: 18 },
        { type: 'eng', coin: 'eth', network: 'Mainnet', name: 'Enigma', tokenContractAddress: '0xf0ee6b27b759c9893ce4f094b49ad28fd15a23e4', decimalPlaces: 8 },
        { type: 'req', coin: 'eth', network: 'Mainnet', name: 'Request Network', tokenContractAddress: '0x8f8221afbb33998d8584a2b05749ba73c37a938a', decimalPlaces: 18 },
        { type: 'dent', coin: 'eth', network: 'Mainnet', name: 'Dent', tokenContractAddress: '0x3597bfd533a99c9aa083587b074434e61eb0a258', decimalPlaces: 8 },
        { type: 'dcn', coin: 'eth', network: 'Mainnet', name: 'Dentacoin', tokenContractAddress: '0x08d32b0da63e2c3bcf8019c9c5d849d7a9d791e6', decimalPlaces: 0 },
        { type: 'hpb', coin: 'eth', network: 'Mainnet', name: 'High Performance Blockchain', tokenContractAddress: '0x38c6a68304cdefb9bec48bbfaaba5c5b47818bb2', decimalPlaces: 18 },
        { type: 'fsn', coin: 'eth', network: 'Mainnet', name: 'Fusion', tokenContractAddress: '0xd0352a019e9ab9d757776f532377aaebd36fd541', decimalPlaces: 18 },
        { type: 'cnd', coin: 'eth', network: 'Mainnet', name: 'Cindicator', tokenContractAddress: '0xd4c435f5b09f855c3317c8524cb1f586e42795fa', decimalPlaces: 18 },
        { type: 'icn', coin: 'eth', network: 'Mainnet', name: 'Iconomi', tokenContractAddress: '0x888666ca69e0f178ded6d75b5726cee99a87d698', decimalPlaces: 18 },
        { type: 'man', coin: 'eth', network: 'Mainnet', name: 'Matrix AI Network', tokenContractAddress: '0xe25bcec5d3801ce3a794079bf94adf1b8ccd802d', decimalPlaces: 18 },
        { type: 'gnx', coin: 'eth', network: 'Mainnet', name: 'Genaro Network', tokenContractAddress: '0x6ec8a24cabdc339a06a172f8223ea557055adaa5', decimalPlaces: 9 },
        { type: 'mana', coin: 'eth', network: 'Mainnet', name: 'Decentraland', tokenContractAddress: '0x0f5d2fb29fb7d3cfee444a200298f468908cc942', decimalPlaces: 18 },
        { type: 'drop', coin: 'eth', network: 'Mainnet', name: 'Dropil', tokenContractAddress: '0x4672bad527107471cb5067a887f4656d585a8a31', decimalPlaces: 18 },
        { type: 'poly', coin: 'eth', network: 'Mainnet', name: 'Polymath', tokenContractAddress: '0x9992ec3cf6a55b00978cddf2b27bc6882d88d1ec', decimalPlaces: 18 },
        { type: 'nuls', coin: 'eth', network: 'Mainnet', name: 'Nuls', tokenContractAddress: '0xb91318f35bdb262e9423bc7c7c2a3a93dd93c92c', decimalPlaces: 18 },
        { type: 'dtr', coin: 'eth', network: 'Mainnet', name: 'Dynamic Trading Rights', tokenContractAddress: '0xd234bf2410a0009df9c3c63b610c09738f18ccd7', decimalPlaces: 8 },
        { type: 'enj', coin: 'eth', network: 'Mainnet', name: 'Enjin Coin', tokenContractAddress: '0xf629cbd94d3791c9250152bd8dfbdf380e2a3b9c', decimalPlaces: 18 },
        { type: 'agi', coin: 'eth', network: 'Mainnet', name: 'SingularityNET', tokenContractAddress: '0x8eb24319393716668d768dcec29356ae9cffe285', decimalPlaces: 8 },
        { type: 'qsp', coin: 'eth', network: 'Mainnet', name: 'Quantstamp', tokenContractAddress: '0x99ea4db9ee77acd40b119bd1dc4e33e1c070b80d', decimalPlaces: 18 },
        { type: 'auto', coin: 'eth', network: 'Mainnet', name: 'Cube', tokenContractAddress: '0x622dffcc4e83c64ba959530a5a5580687a57581b', decimalPlaces: 18 },
        { type: 'tms', coin: 'eth', network: 'Mainnet', name: 'Time New Bank', tokenContractAddress: '0xf7920b0768ecb20a123fac32311d07d193381d6f', decimalPlaces: 18 },
        { type: 'rlc', coin: 'eth', network: 'Mainnet', name: 'Iexec Rlc', tokenContractAddress: '0x607f4c5bb672230e8672085532f7e901544a7375', decimalPlaces: 9 },
        { type: 'mco', coin: 'eth', network: 'Mainnet', name: 'Monaco', tokenContractAddress: '0xb63b606ac810a52cca15e44bb630fd42d8d1d83d', decimalPlaces: 8 },
        { type: 'rdn', coin: 'eth', network: 'Mainnet', name: 'Raiden Network', tokenContractAddress: '0x255aa6df07540cb5d3d297f0d0d4d84cb52bc8e6', decimalPlaces: 18 },
        { type: 'abt', coin: 'eth', network: 'Mainnet', name: 'Arcblock', tokenContractAddress: '0xb98d4c97425d9908e66e53a6fdf673acca0be986', decimalPlaces: 18 },
        { type: 'san', coin: 'eth', network: 'Mainnet', name: 'Santiment Network', tokenContractAddress: '0x7c5a0ce9267ed19b22f8cae653f198e3e8daf098', decimalPlaces: 18 },
        { type: 'srn', coin: 'eth', network: 'Mainnet', name: 'Sirin Labs', tokenContractAddress: '0x68d57c9a1c35f63e2c83ee8e49a64e9d70528d25', decimalPlaces: 18 },
        { type: 'theta', coin: 'eth', network: 'Mainnet', name: 'Theta Token', tokenContractAddress: '0x3883f5e181fccaf8410fa61e12b59bad963fb645', decimalPlaces: 18 },
        { type: 'poe', coin: 'eth', network: 'Mainnet', name: 'Po.et', tokenContractAddress: '0x0e0989b1f9b8a38983c2ba8053269ca62ec9b195', decimalPlaces: 8 },
        { type: 'cs', coin: 'eth', network: 'Mainnet', name: 'Credits', tokenContractAddress: '0x46b9ad944d1059450da1163511069c718f699d31', decimalPlaces: 6 },
        { type: 'blz', coin: 'eth', network: 'Mainnet', name: 'Bluzelle', tokenContractAddress: '0x5732046a883704404f284ce41ffadd5b007fd668', decimalPlaces: 18 },
        { type: 'ant', coin: 'eth', network: 'Mainnet', name: 'Aragon', tokenContractAddress: '0x960b236a07cf122663c4303350609a66a7b288c0', decimalPlaces: 18 },
        { type: 'gvt', coin: 'eth', network: 'Mainnet', name: 'Genesis Vision', tokenContractAddress: '0x103c3a209da59d3e7c4a89307e66521e081cfdf0', decimalPlaces: 18 },
        { type: 'xin', coin: 'eth', network: 'Mainnet', name: 'Mixin', tokenContractAddress: '0xa974c709cfb4566686553a20790685a47aceaa33', decimalPlaces: 18 },
        { type: 'mith', coin: 'eth', network: 'Mainnet', name: 'Mithril', tokenContractAddress: '0x3893b9422cd5d70a81edeffe3d5a1c6a978310bb', decimalPlaces: 18 },
        { type: 'plr', coin: 'eth', network: 'Mainnet', name: 'Pillar', tokenContractAddress: '0xe3818504c1b32bf1557b16c238b2e01fd3149c17', decimalPlaces: 18 },
        { type: 'ppp', coin: 'eth', network: 'Mainnet', name: 'PayPie', tokenContractAddress: '0xc42209accc14029c1012fb5680d95fbd6036e2a0', decimalPlaces: 18 },
        { type: 'loom', coin: 'eth', network: 'Mainnet', name: 'Loom Network', tokenContractAddress: '0xa4e8c3ec456107ea67d3075bf9e3df3a75823db0', decimalPlaces: 18 },
        { type: 'payx', coin: 'eth', network: 'Mainnet', name: 'Paypex', tokenContractAddress: '0x62a56a4a2ef4d355d34d10fbf837e747504d38d4', decimalPlaces: 2 },
        { type: 'prl', coin: 'eth', network: 'Mainnet', name: 'Oyster', tokenContractAddress: '0x1844b21593262668b7248d0f57a220caaba46ab9', decimalPlaces: 18 },
        { type: 'gto', coin: 'eth', network: 'Mainnet', name: 'Gifto', tokenContractAddress: '0xc5bbae50781be1669306b9e001eff57a2957b09d', decimalPlaces: 5 },
        { type: 'cmt', coin: 'eth', network: 'Mainnet', name: 'CyberMiles', tokenContractAddress: '0xf85feea2fdd81d51177f6b8f35f0e6734ce45f5f', decimalPlaces: 18 },
        { type: 'vee', coin: 'eth', network: 'Mainnet', name: 'Blockv', tokenContractAddress: '0x340d2bde5eb28c1eed91b2f790723e3b160613b7', decimalPlaces: 18 },
        { type: 'dew', coin: 'eth', network: 'Mainnet', name: 'Dew', tokenContractAddress: '0x20e94867794dba030ee287f1406e100d03c84cd3', decimalPlaces: 18 },
        { type: 'smt', coin: 'eth', network: 'Mainnet', name: 'SmartMesh', tokenContractAddress: '0x55f93985431fc9304077687a35a1ba103dc1e081', decimalPlaces: 18 },
        { type: 'ruff', coin: 'eth', network: 'Mainnet', name: 'Ruff', tokenContractAddress: '0xf278c1ca969095ffddded020290cf8b5c424ace2', decimalPlaces: 18 },
        { type: 'ost', coin: 'eth', network: 'Mainnet', name: 'Ost', tokenContractAddress: '0x2c4e8f2d746113d0696ce89b35f0d8bf88e0aeca', decimalPlaces: 18 },
        { type: 'tkx', coin: 'eth', network: 'Mainnet', name: 'Tokenize', tokenContractAddress: '0x667102bd3413bfeaa3dffb48fa8288819e480a88', decimalPlaces: 8 },
        { type: 'shk', coin: 'eth', network: 'Mainnet', name: 'iShook', tokenContractAddress: '0xebe4a49df7885d015329c919bf43e6460a858f1e', decimalPlaces: 18 },
        { type: 'xrl', coin: 'eth', network: 'Mainnet', name: 'Rialto', tokenContractAddress: '0xb24754be79281553dc1adc160ddf5cd9b74361a4', decimalPlaces: 9 },
        { type: 'kin', coin: 'eth', network: 'Mainnet', name: 'Kin', tokenContractAddress: '0x818fc6c2ec5986bc6e2cbf00939d90556ab12ce5', decimalPlaces: 18 },
        { type: 'qash', coin: 'eth', network: 'Mainnet', name: 'QASH', tokenContractAddress: '0x618e75ac90b12c6049ba3b27f5d5f8651b0037f6', decimalPlaces: 6 },
        { type: 'echt', coin: 'eth', network: 'Mainnet', name: 'eChat', tokenContractAddress: '0x1aadead0d2e0b6d888ae1d73b11db65a8447634a', decimalPlaces: 0 },
        { type: 'cag', coin: 'eth', network: 'Mainnet', name: 'Change', tokenContractAddress: '0x7d4b8cce0591c9044a22ee543533b72e976e36c3', decimalPlaces: 18 },
        { type: 'powr', coin: 'eth', network: 'Mainnet', name: 'Power Ledger', tokenContractAddress: '0x595832f8fc6bf59c85c527fec3740a1b7a361269', decimalPlaces: 6 },
        { type: 'appc', coin: 'eth', network: 'Mainnet', name: 'AppCoins', tokenContractAddress: '0x1a7a8bd9106f2b8d977e08582dc7d24c723ab0db', decimalPlaces: 18 },
        { type: 'rebl', coin: 'eth', network: 'Mainnet', name: 'Rebellious', tokenContractAddress: '0x5f53f7a8075614b699baad0bc2c899f4bad8fbbf', decimalPlaces: 18 },
        { type: 'egl', coin: 'eth', network: 'Mainnet', name: 'eGold', tokenContractAddress: '0x8f00458479ea850f584ed82881421f9d9eac6cb1', decimalPlaces: 4 },
        { type: 'srnt', coin: 'eth', network: 'Mainnet', name: 'Serenity', tokenContractAddress: '0xbc7942054f77b82e8a71ace170e4b00ebae67eb6', decimalPlaces: 18 },
        { type: 'plc', coin: 'eth', network: 'Mainnet', name: 'PlusCoin', tokenContractAddress: '0xdf99c7f9e0eadd71057a801055da810985df38bd', decimalPlaces: 18 },
        { type: 'lnc', coin: 'eth', network: 'Mainnet', name: 'Linker Coin', tokenContractAddress: '0x6beb418fc6e1958204ac8baddcf109b8e9694966', decimalPlaces: 18 },
        { type: 'snov', coin: 'eth', network: 'Mainnet', name: 'Snovio', tokenContractAddress: '0xbdc5bac39dbe132b1e030e898ae3830017d7d969', decimalPlaces: 18 },
        { type: 'snt', coin: 'eth', network: 'Mainnet', name: 'Status Network Token', tokenContractAddress: '0x744d70fdbe2ba4cf95131626614a1763df805b9e', decimalPlaces: 18 },
        { type: 'hst', coin: 'eth', network: 'Mainnet', name: 'Decision Token', tokenContractAddress: '0x554c20b7c486beee439277b4540a434566dc4c02', decimalPlaces: 18 },
        { type: 'nexo', coin: 'eth', network: 'Mainnet', name: 'Nexo', tokenContractAddress: '0xb62132e35a6c13ee1ee0f84dc5d40bad8d815206', decimalPlaces: 18 },
        { type: 'qvt', coin: 'eth', network: 'Mainnet', name: 'Qvolta', tokenContractAddress: '0x1183f92a5624d68e85ffb9170f16bf0443b4c242', decimalPlaces: 18 },
        { type: 'pro', coin: 'eth', network: 'Mainnet', name: 'Propy', tokenContractAddress: '0x9041fe5b3fdea0f5e4afdc17e75180738d877a01', decimalPlaces: 18 },
        { type: 'ast', coin: 'eth', network: 'Mainnet', name: 'AirSwap', tokenContractAddress: '0x27054b13b1b798b345b591a4d22e6562d47ea75a', decimalPlaces: 4 },
        { type: 'storj', coin: 'eth', network: 'Mainnet', name: 'Storj', tokenContractAddress: '0xb64ef51c888972c908cfacf59b47c1afbc0ab8ac', decimalPlaces: 8 },
        { type: 'chsb', coin: 'eth', network: 'Mainnet', name: 'SwissBorg', tokenContractAddress: '0xba9d4199fab4f26efe3551d490e3821486f135ba', decimalPlaces: 8 },
        { type: 'elf', coin: 'eth', network: 'Mainnet', name: 'Aelf', tokenContractAddress: '0xbf2179859fc6d5bee9bf9158632dc51678a4100e', decimalPlaces: 18 },
        { type: 'opt', coin: 'eth', network: 'Mainnet', name: 'OPTin Token', tokenContractAddress: '0xde8893346ce8052a02606b62d13b142648e062dd', decimalPlaces: 18 },
        { type: 'aion', coin: 'eth', network: 'Mainnet', name: 'AION', tokenContractAddress: '0x4ceda7906a5ed2179785cd3a40a69ee8bc99c466', decimalPlaces: 8 },
        { type: 'cel', coin: 'eth', network: 'Mainnet', name: 'Celsius', tokenContractAddress: '0xaaaebe6fe48e54f431b0c390cfaf0b017d09d42d', decimalPlaces: 4 },
        { type: 'upp', coin: 'eth', network: 'Mainnet', name: 'Sentinel Protocol', tokenContractAddress: '0xc86d054809623432210c107af2e3f619dcfbf652', decimalPlaces: 18 },
        { type: 'bbx', coin: 'eth', network: 'Mainnet', name: 'BBX', tokenContractAddress: '0x71529cea068e3785efd4f18aaf59a6cb82b7e5cb', decimalPlaces: 18 },
        { type: 'ana', coin: 'eth', network: 'Mainnet', name: 'ANA', tokenContractAddress: '0xfafd51641ab09dff163cd04d2eb6b7865eb83f53', decimalPlaces: 18 },
        { type: 'bid', coin: 'eth', network: 'Mainnet', name: 'Blockbid', tokenContractAddress: '0xf1f64f6b8e17dd68c1db10b0eed3d2541a6c09ab', decimalPlaces: 8 },
        { type: 'trst', coin: 'eth', network: 'Mainnet', name: 'WeTrust', tokenContractAddress: '0xcb94be6f13a1182e4a4b6140cb7bf2025d28e41b', decimalPlaces: 6 },
        { type: 'bnty', coin: 'eth', network: 'Mainnet', name: 'Bounty0x', tokenContractAddress: '0xd2d6158683aee4cc838067727209a0aaf4359de3', decimalPlaces: 18 },
        { type: 'ind', coin: 'eth', network: 'Mainnet', name: 'Indorse', tokenContractAddress: '0xf8e386eda857484f5a12e4b5daa9984e06e73705', decimalPlaces: 18 },
        { type: 'tusd', coin: 'eth', network: 'Mainnet', name: 'TrueUSD', tokenContractAddress: '0x8dd5fbce2f6a956c3022ba3663759011dd51e73e', decimalPlaces: 18 },
        { type: 'mfg', coin: 'eth', network: 'Mainnet', name: 'SyncFab', tokenContractAddress: '0x6710c63432a2de02954fc0f851db07146a6c0312', decimalPlaces: 18 },
        { type: 'mtl', coin: 'eth', network: 'Mainnet', name: 'Metal', tokenContractAddress: '0xf433089366899d83a9f26a773d59ec7ecf30355e', decimalPlaces: 8 },
        { type: 'neu', coin: 'eth', network: 'Mainnet', name: 'Neumark', tokenContractAddress: '0xa823e6722006afe99e91c30ff5295052fe6b8e32', decimalPlaces: 18 },
        { type: 'cdt', coin: 'eth', network: 'Mainnet', name: 'Blox', tokenContractAddress: '0x177d39ac676ed1c67a2b268ad7f1e58826e5b0af', decimalPlaces: 18 },
        { type: 'bnt', coin: 'eth', network: 'Mainnet', name: 'Bancor', tokenContractAddress: '0x1f573d6fb3f13d689ff844b4ce37794d79a7ff1c', decimalPlaces: 18 },
        { type: 'cln', coin: 'eth', network: 'Mainnet', name: 'Colu Local Network', tokenContractAddress: '0x4162178b78d6985480a308b2190ee5517460406d', decimalPlaces: 18 },
        { type: 'gen', coin: 'eth', network: 'Mainnet', name: 'DAOstack', tokenContractAddress: '0x543ff227f64aa17ea132bf9886cab5db55dcaddf', decimalPlaces: 18 },
        { type: 'storm', coin: 'eth', network: 'Mainnet', name: 'Storm', tokenContractAddress: '0xd0a4b8946cb52f0661273bfbc6fd0e0c75fc6433', decimalPlaces: 18 },
        { type: 'ten', coin: 'eth', network: 'Mainnet', name: 'Tokenomy', tokenContractAddress: '0xdd16ec0f66e54d453e6756713e533355989040e4', decimalPlaces: 18 },
        { type: 'btt', coin: 'eth', network: 'Mainnet', name: 'Blocktrade', tokenContractAddress: '0xfa456cf55250a839088b27ee32a424d7dacb54ff', decimalPlaces: 18 }
      ]
    }
  },
  // network name for test environments (testnet tokens must be added here)
  testnet: {
    eth: {
      tokens: [
        { type: 'terc', coin: 'teth', network: 'Kovan', tokenContractAddress: '0x945ac907cf021a6bcd07852bb3b8c087051706a9', decimalPlaces: 0, name: 'ERC Test Token' },
        { type: 'tbst', coin: 'teth', network: 'Kovan', tokenContractAddress: '0xe5cdf77835ca2095881dd0803a77e844c87483cd', decimalPlaces: 0, name: 'Test BitGo Shield Token' }
      ]
    }
  }
};

const mainnetTokens = {};
_.forEach(exports.tokens.bitcoin.eth.tokens, function(value) {
  if (mainnetTokens[value.type]) {
    throw new Error('token : ' + value.type + ' duplicated.');
  }
  mainnetTokens[value.type] = true;

  if (value.tokenContractAddress !== _.toLower(value.tokenContractAddress)) {
    throw new Error('token contract: ' + value.type + ' is not all lower case: ' + value.tokenContractAddress);
  }
});

const testnetTokens = {};
_.forEach(exports.tokens.testnet.eth.tokens, function(value) {
  if (testnetTokens[value.type]) {
    throw new Error('token : ' + value.type + ' duplicated.');
  }
  testnetTokens[value.type] = true;

  if (value.tokenContractAddress !== _.toLower(value.tokenContractAddress)) {
    throw new Error('token contract: ' + value.type + ' is not all lower case: ' + value.tokenContractAddress);
  }
});

const defaults = {
  maxFee: 0.1e8,
  maxFeeRate: 1000000,
  minFeeRate: 5000,
  fallbackFeeRate: 50000,
  minOutputSize: 2730,
  minInstantFeeRate: 10000,
  bitgoEthAddress: '0x0f47ea803926926f299b7f1afc8460888d850f47'
};

// Supported cross-chain recovery routes. The coin to be recovered is the index, the valid coins for recipient wallets
// are listed in the array.
exports.supportedCrossChainRecoveries = {
  btc: ['bch', 'ltc'],
  bch: ['btc', 'ltc'],
  ltc: ['btc', 'bch']
};

// TODO: once server starts returning eth address keychains, remove bitgoEthAddress
exports.defaultConstants = (env) => {

  if (common.Environments[env] === undefined) {
    throw Error(`invalid environment ${env}`);
  }

  const network = common.Environments[env].network;
  return _.merge({}, defaults, exports.tokens[network]);
};
