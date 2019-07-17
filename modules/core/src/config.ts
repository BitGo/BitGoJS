import * as _ from 'lodash';
import { Environments, EnvironmentName } from './v2/environments';

export const tokens = {
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
        { type: 'zil', coin: 'eth', network: 'Mainnet', name: 'Zilliqa', tokenContractAddress: '0x05f4a42e251f2d52b8ed15e9fedaacfcef1fad27', decimalPlaces: 12 },
        { type: 'iost', coin: 'eth', network: 'Mainnet', name: 'IOSToken', tokenContractAddress: '0xfa1a856cfa3409cfa145fa4e20eb270df3eb21ab', decimalPlaces: 18 },
        { type: 'lrc', coin: 'eth', network: 'Mainnet', name: 'loopring', tokenContractAddress: '0xef68e7c694f40c8202821edf525de3782458639f', decimalPlaces: 18 },
        { type: 'kcs', coin: 'eth', network: 'Mainnet', name: 'Kucoin Shares', tokenContractAddress: '0x039b5649a59967e3e936d7471f9c3700100ee1ab', decimalPlaces: 6 },
        { type: 'wtc', coin: 'eth', network: 'Mainnet', name: 'Walton Token', tokenContractAddress: '0xb7cb1c96db6b22b0d3d9536e0108d062bd488f74', decimalPlaces: 18 },
        { type: 'cennz', coin: 'eth', network: 'Mainnet', name: 'Centrality', tokenContractAddress: '0x1122b6a0e00dce0563082b6e2953f3a943855c1f', decimalPlaces: 18 },
        { type: 'veri', coin: 'eth', network: 'Mainnet', name: 'Veritaseum', tokenContractAddress: '0x8f3470a7388c05ee4e7af3d01d8c722b0ff52374', decimalPlaces: 18 },
        { type: 'drgn', coin: 'eth', network: 'Mainnet', name: 'Dragonchain', tokenContractAddress: '0x419c4db4b9e25d6db2ad9691ccb832c8d9fda05e', decimalPlaces: 18 },
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
        { type: 'bid', coin: 'eth', network: 'Mainnet', name: 'Blockbid', tokenContractAddress: '0xdd5151da2ab25566e1d2a3c9a3e77396303f8a93', decimalPlaces: 2 },
        { type: 'trst', coin: 'eth', network: 'Mainnet', name: 'WeTrust', tokenContractAddress: '0xcb94be6f13a1182e4a4b6140cb7bf2025d28e41b', decimalPlaces: 6 },
        { type: 'bnty', coin: 'eth', network: 'Mainnet', name: 'Bounty0x', tokenContractAddress: '0xd2d6158683aee4cc838067727209a0aaf4359de3', decimalPlaces: 18 },
        { type: 'ind', coin: 'eth', network: 'Mainnet', name: 'Indorse', tokenContractAddress: '0xf8e386eda857484f5a12e4b5daa9984e06e73705', decimalPlaces: 18 },
        { type: 'tusd', coin: 'eth', network: 'Mainnet', name: 'TrueUSD', tokenContractAddress: '0x0000000000085d4780b73119b644ae5ecd22b376', decimalPlaces: 18 },
        { type: 'mfg', coin: 'eth', network: 'Mainnet', name: 'SyncFab', tokenContractAddress: '0x6710c63432a2de02954fc0f851db07146a6c0312', decimalPlaces: 18 },
        { type: 'mtl', coin: 'eth', network: 'Mainnet', name: 'Metal', tokenContractAddress: '0xf433089366899d83a9f26a773d59ec7ecf30355e', decimalPlaces: 8 },
        { type: 'neu', coin: 'eth', network: 'Mainnet', name: 'Neumark', tokenContractAddress: '0xa823e6722006afe99e91c30ff5295052fe6b8e32', decimalPlaces: 18 },
        { type: 'cdt', coin: 'eth', network: 'Mainnet', name: 'Blox', tokenContractAddress: '0x177d39ac676ed1c67a2b268ad7f1e58826e5b0af', decimalPlaces: 18 },
        { type: 'bnt', coin: 'eth', network: 'Mainnet', name: 'Bancor', tokenContractAddress: '0x1f573d6fb3f13d689ff844b4ce37794d79a7ff1c', decimalPlaces: 18 },
        { type: 'cln', coin: 'eth', network: 'Mainnet', name: 'Colu Local Network', tokenContractAddress: '0x4162178b78d6985480a308b2190ee5517460406d', decimalPlaces: 18 },
        { type: 'gen', coin: 'eth', network: 'Mainnet', name: 'DAOstack', tokenContractAddress: '0x543ff227f64aa17ea132bf9886cab5db55dcaddf', decimalPlaces: 18 },
        { type: 'storm', coin: 'eth', network: 'Mainnet', name: 'Storm', tokenContractAddress: '0xd0a4b8946cb52f0661273bfbc6fd0e0c75fc6433', decimalPlaces: 18 },
        { type: 'ten', coin: 'eth', network: 'Mainnet', name: 'Tokenomy', tokenContractAddress: '0xdd16ec0f66e54d453e6756713e533355989040e4', decimalPlaces: 18 },
        { type: 'btt', coin: 'eth', network: 'Mainnet', name: 'Blocktrade', tokenContractAddress: '0xfa456cf55250a839088b27ee32a424d7dacb54ff', decimalPlaces: 18 },
        { type: 'ukg', coin: 'eth', network: 'Mainnet', name: 'UnikoinGold', tokenContractAddress: '0x24692791bc444c5cd0b81e3cbcaba4b04acd1f3b', decimalPlaces: 18 },
        { type: 'tnt', coin: 'eth', network: 'Mainnet', name: 'Tierion', tokenContractAddress: '0x08f5a9235b08173b7569f83645d2c7fb55e8ccd8', decimalPlaces: 8 },
        { type: 'bcap', coin: 'eth', network: 'Mainnet', name: 'BCAP', tokenContractAddress: '0x1f41e42d0a9e3c0dd3ba15b527342783b43200a9', decimalPlaces: 0 },
        { type: 'cbc', coin: 'eth', network: 'Mainnet', name: 'CashBet Coin', tokenContractAddress: '0x26db5439f651caf491a87d48799da81f191bdb6b', decimalPlaces: 8 },
        { type: 'dai', coin: 'eth', network: 'Mainnet', name: 'Dai', tokenContractAddress: '0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359', decimalPlaces: 18 },
        { type: 'reb', coin: 'eth', network: 'Mainnet', name: 'Regblo', tokenContractAddress: '0x61383ac89988b498df5363050ff07fe5c52ecdda', decimalPlaces: 18 },
        { type: 'mdx', coin: 'eth', network: 'Mainnet', name: 'Mandala', tokenContractAddress: '0x9d03393d297e42c135625d450c814892505f1a84', decimalPlaces: 18 },
        { type: 'lion', coin: 'eth', network: 'Mainnet', name: 'CoinLion', tokenContractAddress: '0x2167fb82309cf76513e83b25123f8b0559d6b48f', decimalPlaces: 18 },
        { type: 'hold', coin: 'eth', network: 'Mainnet', name: 'Hold', tokenContractAddress: '0xd6e1401a079922469e9b965cb090ea6ff64c6839', decimalPlaces: 18 },
        { type: 'cpay', coin: 'eth', network: 'Mainnet', name: 'Cryptopay', tokenContractAddress: '0x0ebb614204e47c09b6c3feb9aaecad8ee060e23e', decimalPlaces: 0 },
        { type: 'fmf', coin: 'eth', network: 'Mainnet', name: 'Formosa Financial', tokenContractAddress: '0xb4d0fdfc8497aef97d3c2892ae682ee06064a2bc', decimalPlaces: 18 },
        { type: 'gno', coin: 'eth', network: 'Mainnet', name: 'Gnosis', tokenContractAddress: '0x6810e776880c02933d47db1b9fc05908e5386b96', decimalPlaces: 18 },
        { type: 'npxs', coin: 'eth', network: 'Mainnet', name: 'Pundi X', tokenContractAddress: '0xa15c7ebe1f07caf6bff097d8a589fb8ac49ae5b3', decimalPlaces: 18 },
        { type: 'dgx', coin: 'eth', network: 'Mainnet', name: 'Digix', tokenContractAddress: '0x4f3afec4e5a3f2a6a1a411def7d7dfe50ee057bf', decimalPlaces: 9 },
        { type: 'gusd', coin: 'eth', network: 'Mainnet', name: 'Gemini Dollar', tokenContractAddress: '0x056fd409e1d7a124bd7017459dfea2f387b6d5cd', decimalPlaces: 2 },
        { type: 'pax', coin: 'eth', network: 'Mainnet', name: 'Paxos', tokenContractAddress: '0x8e870d67f660d95d5be530380d0ec0bd388289e1', decimalPlaces: 18 },
        { type: 'zco', coin: 'eth', network: 'Mainnet', name: 'Zebi Coin', tokenContractAddress: '0x2008e3057bd734e10ad13c9eae45ff132abc1722', decimalPlaces: 8 },
        { type: 'incx', coin: 'eth', network: 'Mainnet', name: 'InternationalCryptoX', tokenContractAddress: '0xa984a92731c088f1ea4d53b71a2565a399f7d8d5', decimalPlaces: 18 },
        { type: 'hyb', coin: 'eth', network: 'Mainnet', name: 'Hybrid Block', tokenContractAddress: '0x6059f55751603ead7dc6d280ad83a7b33d837c90', decimalPlaces: 18 },
        { type: 'usdc', coin: 'eth', network: 'Mainnet', name: 'USD Coin', tokenContractAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', decimalPlaces: 6 },
        { type: 'rby', coin: 'eth', network: 'Mainnet', name: 'Ruby X', tokenContractAddress: '0xf7705dee19a63e0bc1a240f723c5c0f570c78572', decimalPlaces: 18 },
        { type: 'uqc', coin: 'eth', network: 'Mainnet', name: 'Uquid Coin', tokenContractAddress: '0xd01db73e047855efb414e6202098c4be4cd2423b', decimalPlaces: 18 },
        { type: 'mft', coin: 'eth', network: 'Mainnet', name: 'Mainframe', tokenContractAddress: '0xdf2c7238198ad8b389666574f2d8bc411a4b7428', decimalPlaces: 18 },
        { type: 'aoa', coin: 'eth', network: 'Mainnet', name: 'Aurora', tokenContractAddress: '0x9ab165d795019b6d8b3e971dda91071421305e5a', decimalPlaces: 18 },
        { type: 'hot', coin: 'eth', network: 'Mainnet', name: 'Holo', tokenContractAddress: '0x6c6ee5e31d828de241282b9606c8e98ea48526e2', decimalPlaces: 18 },
        { type: 'met', coin: 'eth', network: 'Mainnet', name: 'Metronome', tokenContractAddress: '0xa3d58c4e56fedcae3a7c43a725aee9a71f0ece4e', decimalPlaces: 18 },
        { type: 'drv', coin: 'eth', network: 'Mainnet', name: 'Drive', tokenContractAddress: '0x0b9d89a71bdabd231d4d497b7b7b879740d739c4', decimalPlaces: 18 },
        { type: 'mtcn', coin: 'eth', network: 'Mainnet', name: 'Multiven', tokenContractAddress: '0xf6117cc92d7247f605f11d4c942f0feda3399cb5', decimalPlaces: 18 },
        { type: 'data', coin: 'eth', network: 'Mainnet', name: 'Streamr DATAcoin', tokenContractAddress: '0x0cf0ee63788a0849fe5297f3407f701e122cc023', decimalPlaces: 18 },
        { type: 'medx', coin: 'eth', network: 'Mainnet', name: 'Medibloc', tokenContractAddress: '0xfd1e80508f243e64ce234ea88a5fd2827c71d4b7', decimalPlaces: 8 },
        { type: 'box', coin: 'eth', network: 'Mainnet', name: 'ContentBox', tokenContractAddress: '0x63f584fa56e60e4d0fe8802b27c7e6e3b33e007f', decimalPlaces: 18 },
        { type: 'mvl', coin: 'eth', network: 'Mainnet', name: 'Mass Vehicle Ledger', tokenContractAddress: '0xa849eaae994fb86afa73382e9bd88c2b6b18dc71', decimalPlaces: 18 },
        { type: 'edr', coin: 'eth', network: 'Mainnet', name: 'Endor Protocol', tokenContractAddress: '0xc528c28fec0a90c083328bc45f587ee215760a0f', decimalPlaces: 18 },
        { type: 'pma', coin: 'eth', network: 'Mainnet', name: 'PumaPay', tokenContractAddress: '0x846c66cf71c43f80403b51fe3906b3599d63336f', decimalPlaces: 18 },
        { type: 'meta', coin: 'eth', network: 'Mainnet', name: 'Metadium', tokenContractAddress: '0xde2f7766c8bf14ca67193128535e5c7454f8387c', decimalPlaces: 18 },
        { type: 'aergo', coin: 'eth', network: 'Mainnet', name: 'Aergo', tokenContractAddress: '0xae31b85bfe62747d0836b82608b4830361a3d37a', decimalPlaces: 18 },
        { type: 'fxrt', coin: 'eth', network: 'Mainnet', name: 'FXRT', tokenContractAddress: '0x506742a24c54b77c5af4065b2626ab96c641f90e', decimalPlaces: 3 },
        { type: 'bcio', coin: 'eth', network: 'Mainnet', name: 'Blockchain.io', tokenContractAddress: '0xcdc412f306e0c51e3249b88c65423cd16b322673', decimalPlaces: 18 },
        { type: 'xcd', coin: 'eth', network: 'Mainnet', name: 'CapdaxToken', tokenContractAddress: '0xca00bc15f67ebea4b20dfaaa847cace113cc5501', decimalPlaces: 18 },
        { type: 'zix', coin: 'eth', network: 'Mainnet', name: 'Zeex Token', tokenContractAddress: '0xf3c092ca8cd6d3d4ca004dc1d0f1fe8ccab53599', decimalPlaces: 18 },
        { type: 'buy', coin: 'eth', network: 'Mainnet', name: 'buying.com', tokenContractAddress: '0x0d7f0fa3a79bfedbab291da357958596c74e27d7', decimalPlaces: 18 },
        { type: 'onl', coin: 'eth', network: 'Mainnet', name: 'On.Live', tokenContractAddress: '0x6863be0e7cf7ce860a574760e9020d519a8bdc47', decimalPlaces: 18 },
        { type: 'wpx', coin: 'eth', network: 'Mainnet', name: 'WalletPlusX', tokenContractAddress: '0x4bb0a085db8cedf43344bd2fbec83c2c79c4e76b', decimalPlaces: 18 },
        { type: 'isr', coin: 'eth', network: 'Mainnet', name: 'Insureum', tokenContractAddress: '0xd4a293ae8bb9e0be12e99eb19d48239e8c83a136', decimalPlaces: 18 },
        { type: 'key', coin: 'eth', network: 'Mainnet', name: 'SelfKey', tokenContractAddress: '0x4cc19356f2d37338b9802aa8e8fc58b0373296e7', decimalPlaces: 18 },
        { type: 'bird', coin: 'eth', network: 'Mainnet', name: 'BirdCoin', tokenContractAddress: '0x026e62dded1a6ad07d93d39f96b9eabd59665e0d', decimalPlaces: 18 },
        { type: 'zoom', coin: 'eth', network: 'Mainnet', name: 'CoinZoom', tokenContractAddress: '0x69cf3091c91eb72db05e45c76e58225177dea742', decimalPlaces: 18 },
        { type: 'bnk', coin: 'eth', network: 'Mainnet', name: 'Bankera', tokenContractAddress: '0xc80c5e40220172b36adee2c951f26f2a577810c5', decimalPlaces: 8 },
        { type: 'jbc', coin: 'eth', network: 'Mainnet', name: 'Japan Brand Coin', tokenContractAddress: '0x3635e381c67252405c1c0e550973155832d5e490', decimalPlaces: 18 },
        { type: 'mcx', coin: 'eth', network: 'Mainnet', name: 'MachiX Token', tokenContractAddress: '0xd15ecdcf5ea68e3995b2d0527a0ae0a3258302f8', decimalPlaces: 18 },
        { type: 'ysey', coin: 'eth', network: 'Mainnet', name: 'YSEY Utility Token', tokenContractAddress: '0x1358efe5d9bfc2005918c0b2f220a4345c9ee7a3', decimalPlaces: 3 },
        { type: 'hedg', coin: 'eth', network: 'Mainnet', name: 'HedgeTrade', tokenContractAddress: '0xf1290473e210b2108a85237fbcd7b6eb42cc654f', decimalPlaces: 18 },
        { type: 'hqt', coin: 'eth', network: 'Mainnet', name: 'HyperQuant', tokenContractAddress: '0x3e1d5a855ad9d948373ae68e4fe1f094612b1322', decimalPlaces: 18 },
        { type: 'hlc', coin: 'eth', network: 'Mainnet', name: 'HalalChain', tokenContractAddress: '0x58c69ed6cd6887c0225d1fccecc055127843c69b', decimalPlaces: 9 },
        { type: 'wbtc', coin: 'eth', network: 'Mainnet', name: 'Wrapped Bitcoin', tokenContractAddress: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599', decimalPlaces: 8 },
        { type: 'usdt', coin: 'eth', network: 'Mainnet', name: 'Tether', tokenContractAddress: '0xdac17f958d2ee523a2206206994597c13d831ec7', decimalPlaces: 6 },
        { type: 'amon', coin: 'eth', network: 'Mainnet', name: 'AmonD', tokenContractAddress: '0x00059ae69c1622a7542edc15e8d17b060fe307b6', decimalPlaces: 18 },
        { type: 'crpt', coin: 'eth', network: 'Mainnet', name: 'Crypterium', tokenContractAddress: '0x80a7e048f37a50500351c204cb407766fa3bae7f', decimalPlaces: 18 },
        { type: 'axpr', coin: 'eth', network: 'Mainnet', name: 'aXpire', tokenContractAddress: '0xc39e626a04c5971d770e319760d7926502975e47', decimalPlaces: 18 },
        { type: 'got', coin: 'eth', network: 'Mainnet', name: 'GOExchange', tokenContractAddress: '0xf11f2550769dac4226731b7732dd4e17e72b1b01', decimalPlaces: 18 },
        { type: 'eurs', coin: 'eth', network: 'Mainnet', name: 'Stasis EURS', tokenContractAddress: '0xdb25f211ab05b1c97d595516f45794528a807ad8', decimalPlaces: 2 },
        { type: 'bax', coin: 'eth', network: 'Mainnet', name: 'BABB', tokenContractAddress: '0x9a0242b7a33dacbe40edb927834f96eb39f8fbcb', decimalPlaces: 18 },
        { type: 'hxro', coin: 'eth', network: 'Mainnet', name: 'Hxro', tokenContractAddress: '0x4bd70556ae3f8a6ec6c4080a0c327b24325438f3', decimalPlaces: 18 },
        { type: 'rfr', coin: 'eth', network: 'Mainnet', name: 'Refereum', tokenContractAddress: '0xd0929d411954c47438dc1d871dd6081f5c5e149c', decimalPlaces: 4 },
        { type: 'cplt', coin: 'eth', network: 'Mainnet', name: 'Coineru Platinum', tokenContractAddress: '0xa3f7871a4b86bcc3b6e97c8fd0745e71c55e1f82', decimalPlaces: 8 },
        { type: 'cslv', coin: 'eth', network: 'Mainnet', name: 'Coineru Silver', tokenContractAddress: '0x6dc05497f0b087c7692816e6acaa8bdda73907fc', decimalPlaces: 8 },
        { type: 'cgld', coin: 'eth', network: 'Mainnet', name: 'Coineru Gold', tokenContractAddress: '0x3f50e6cc943351f00971a9d01ac32739895df826', decimalPlaces: 8 },
        { type: 'nzdx', coin: 'eth', network: 'Mainnet', name: 'eToro New Zealand Dollar', tokenContractAddress: '0x6871799a4866bb9068b36b7a9bb93475ac77ac5d', decimalPlaces: 18 },
        { type: 'jpyx', coin: 'eth', network: 'Mainnet', name: 'eToro Japanese Yen', tokenContractAddress: '0x743c79f88dcadc6e7cfd7fa2bd8e2bfc68dae053', decimalPlaces: 18 },
        { type: 'rubx', coin: 'eth', network: 'Mainnet', name: 'eToro Russian Ruble', tokenContractAddress: '0xd6d69a3d5e51dbc2636dc332338765fcca71d5d5', decimalPlaces: 18 },
        { type: 'cnyx', coin: 'eth', network: 'Mainnet', name: 'eToro Chinese Yuan', tokenContractAddress: '0x319ad3ff82bedddb3bc85fd7943002d25cdb3cb9', decimalPlaces: 18 },
        { type: 'chfx', coin: 'eth', network: 'Mainnet', name: 'eToro Swiss Frank', tokenContractAddress: '0xe435502c85a4e7e79cfab4167af566c27a7a0784', decimalPlaces: 18 },
        { type: 'usdx', coin: 'eth', network: 'Mainnet', name: 'eToro United States Dollar', tokenContractAddress: '0x4e3856c37b2fe7ff2fe34510cda82a1dffd63cd0', decimalPlaces: 18 },
        { type: 'eurx', coin: 'eth', network: 'Mainnet', name: 'eToro Euro', tokenContractAddress: '0x05ac103f68e05da35e78f6165b9082432fe64b58', decimalPlaces: 18 },
        { type: 'gbpx', coin: 'eth', network: 'Mainnet', name: 'eToro Pound Sterling', tokenContractAddress: '0xf85ef57fcdb36d628d063fa663e61e44d35ae661', decimalPlaces: 18 },
        { type: 'audx', coin: 'eth', network: 'Mainnet', name: 'eToro Australian Dollar', tokenContractAddress: '0xdf1e9e1a218cff9888faef311d6fbb472e4175ce', decimalPlaces: 18 },
        { type: 'cadx', coin: 'eth', network: 'Mainnet', name: 'eToro Canadian Dollar', tokenContractAddress: '0x8ed876e408959643479534a21970ec023d0fb51e', decimalPlaces: 18 },
        { type: 'gldx', coin: 'eth', network: 'Mainnet', name: 'eToro Gold', tokenContractAddress: '0x7d2bebd6e41b05384f0a8eb8ff228daac6f39c96', decimalPlaces: 18 },
        { type: 'slvx', coin: 'eth', network: 'Mainnet', name: 'eToro Silver', tokenContractAddress: '0x8e4d222dbd4f8f9e7c175e77d6e71715c3da78e0', decimalPlaces: 18 },
        { type: 'slot', coin: 'eth', network: 'Mainnet', name: 'AlphaSlot', tokenContractAddress: '0xaee7474c3713ece228aa5ec43c89c708f2ec7ed2', decimalPlaces: 18 },
        { type: 'ethos', coin: 'eth', network: 'Mainnet', name: 'Ethos', tokenContractAddress: '0x5af2be193a6abca9c8817001f45744777db30756', decimalPlaces: 8 },
        { type: 'lba', coin: 'eth', network: 'Mainnet', name: 'Cred', tokenContractAddress: '0xfe5f141bf94fe84bc28ded0ab966c16b17490657', decimalPlaces: 18 },
        { type: 'cdag', coin: 'eth', network: 'Mainnet', name: 'CannDollar', tokenContractAddress: '0xf43401ea8ac4b86155b929e1a5a5e46626c23842', decimalPlaces: 18 },
        { type: 'upt', coin: 'eth', network: 'Mainnet', name: 'Universal Protocol Token', tokenContractAddress: '0x6ca88cc8d9288f5cad825053b6a1b179b05c76fc', decimalPlaces: 18 },
        { type: 'upusd', coin: 'eth', network: 'Mainnet', name: 'Universal US Dollar', tokenContractAddress: '0x86367c0e517622dacdab379f2de389c3c9524345', decimalPlaces: 2 },
        { type: 'upbtc', coin: 'eth', network: 'Mainnet', name: 'Universal Bitcoin', tokenContractAddress: '0xc7461b398005e50bcc43c8e636378c6722e76c01', decimalPlaces: 8 },
        { type: 'fet', coin: 'eth', network: 'Mainnet', name: 'Fetch', tokenContractAddress: '0x1d287cc25dad7ccaf76a26bc660c5f7c8e2a05bd', decimalPlaces: 18 },
        { type: 'nas', coin: 'eth', network: 'Mainnet', name: 'Nebulas', tokenContractAddress: '0x5d65d971895edc438f465c17db6992698a52318d', decimalPlaces: 18 },
        { type: 'ht', coin: 'eth', network: 'Mainnet', name: 'Huobi Token', tokenContractAddress: '0x6f259637dcd74c767781e37bc6133cd6a68aa161', decimalPlaces: 18 },
        { type: 'lgo', coin: 'eth', network: 'Mainnet', name: 'LGO Exchange', tokenContractAddress: '0x0a50c93c762fdd6e56d86215c24aaad43ab629aa', decimalPlaces: 8 },
        { type: 'hydro', coin: 'eth', network: 'Mainnet', name: 'Hydro', tokenContractAddress: '0xebbdf302c940c6bfd49c6b165f457fdb324649bc', decimalPlaces: 18 },
        { type: 'wht', coin: 'eth', network: 'Mainnet', name: 'Whatshalal', tokenContractAddress: '0xae8d4da01658dd0ac118dde60f5b78042d0da7f2', decimalPlaces: 18 },
        { type: 'amn', coin: 'eth', network: 'Mainnet', name: 'Amon', tokenContractAddress: '0x737f98ac8ca59f2c68ad658e3c3d8c8963e40a4c', decimalPlaces: 18 },
        { type: 'btu', coin: 'eth', network: 'Mainnet', name: 'BTU Protocol', tokenContractAddress: '0xb683d83a532e2cb7dfa5275eed3698436371cc9f', decimalPlaces: 18 },
        { type: 'taud', coin: 'eth', network: 'Mainnet', name: 'TrueAUD', tokenContractAddress: '0x00006100f7090010005f1bd7ae6122c3c2cf0090', decimalPlaces: 18 },
        { type: 'usx', coin: 'eth', network: 'Mainnet', name: 'USD Stable Token', tokenContractAddress: '0xe72f4c4ff9d294fc34829947e4371da306f90465', decimalPlaces: 18 },
        { type: 'eux', coin: 'eth', network: 'Mainnet', name: 'EUR Stable Token', tokenContractAddress: '0x1b9064207e8046ec1d8e83de79380ed31283914f', decimalPlaces: 18 },
        { type: 'plx', coin: 'eth', network: 'Mainnet', name: 'PLN Stable Token', tokenContractAddress: '0x8d682bc7ad206e54055c609ea1d4717caab665d0', decimalPlaces: 18 },
        { type: 'cqx', coin: 'eth', network: 'Mainnet', name: 'Coinquista Coin', tokenContractAddress: '0x618c29dd2d16475b2ae6244f9e8aaead68f0ca44', decimalPlaces: 18 },
        { type: 'kze', coin: 'eth', network: 'Mainnet', name: 'Almeela', tokenContractAddress: '0x8de67d55c58540807601dbf1259537bc2dffc84d', decimalPlaces: 18 },
        { type: 'tiox', coin: 'eth', network: 'Mainnet', name: 'Trade Token X', tokenContractAddress: '0xd947b0ceab2a8885866b9a04a06ae99de852a3d4', decimalPlaces: 18 },
        { type: 'spo', coin: 'eth', network: 'Mainnet', name: 'Sparrow Options', tokenContractAddress: '0x89eafa06d99f0a4d816918245266800c9a0941e0', decimalPlaces: 18 },
        { type: 'pdata', coin: 'eth', network: 'Mainnet', name: 'Opiria Token', tokenContractAddress: '0x0db03b6cde0b2d427c64a04feafd825938368f1f', decimalPlaces: 18 },
        { type: 'cro', coin: 'eth', network: 'Mainnet', name: 'Crypto.com Chain', tokenContractAddress: '0xa0b73e1ff0b80914ab6fe0444e65848c4c34450b', decimalPlaces: 8 },
        { type: 'drpu', coin: 'eth', network: 'Mainnet', name: 'DRP Utility', tokenContractAddress: '0xe30e02f049957e2a5907589e06ba646fb2c321ba', decimalPlaces: 8 },
        { type: 'prdx', coin: 'eth', network: 'Mainnet', name: 'PRDX Token', tokenContractAddress: '0xe17900f23b7ebb2791f25f1eaa63d8f5e603e9a5', decimalPlaces: 9 },
        { type: 'tenx', coin: 'eth', network: 'Mainnet', name: 'TenX Token', tokenContractAddress: '0x515ba0a2e286af10115284f151cf398688a69170', decimalPlaces: 18 },
        { type: 'roobee', coin: 'eth', network: 'Mainnet', name: 'ROOBEE', tokenContractAddress: '0xa31b1767e09f842ecfd4bc471fe44f830e3891aa', decimalPlaces: 18 },
        { type: 'orbs', coin: 'eth', network: 'Mainnet', name: 'Orbs Token', tokenContractAddress: '0xff56cc6b1e6ded347aa0b7676c85ab0b3d08b0fa', decimalPlaces: 18 },
        { type: 'vdx', coin: 'eth', network: 'Mainnet', name: 'Vodi X', tokenContractAddress: '0x91e64f39c1fe14492e8fdf5a8b0f305bd218c8a1', decimalPlaces: 18 },
        { type: 'shr', coin: 'eth', network: 'Mainnet', name: 'ShareToken', tokenContractAddress: '0xee5fe244406f35d9b4ddb488a64d51456630befc', decimalPlaces: 2 },
        { type: 'mco', coin: 'eth', network: 'Mainnet', name: 'Crypto.com', tokenContractAddress: '0xb63b606ac810a52cca15e44bb630fd42d8d1d83d', decimalPlaces: 8 },
        { type: 'leo', coin: 'eth', network: 'Mainnet', name: 'Bitfinex LEO', tokenContractAddress: '0x2af5d2ad76741191d15dfe7bf6ac92d4bd912ca3', decimalPlaces: 18 },
        { type: 'crep', coin: 'eth', network: 'Mainnet', name: 'Compound Augur', tokenContractAddress: '0x158079ee67fce2f58472a96584a73c7ab9ac95c1', decimalPlaces: 8 },
        { type: 'cbat', coin: 'eth', network: 'Mainnet', name: 'Compound BAT', tokenContractAddress: '0x6c8c6b02e7b2be14d4fa6022dfd6d75921d90e4e', decimalPlaces: 8 },
        { type: 'czrx', coin: 'eth', network: 'Mainnet', name: 'Compound ZRX', tokenContractAddress: '0xb3319f5d18bc0d84dd1b4825dcde5d5f7266d407', decimalPlaces: 8 },
        { type: 'cusdc', coin: 'eth', network: 'Mainnet', name: 'Compound USDC', tokenContractAddress: '0x39aa39c021dfbae8fac545936693ac917d5e7563', decimalPlaces: 8 },
        { type: 'cdai', coin: 'eth', network: 'Mainnet', name: 'Compound DAI', tokenContractAddress: '0xf5dce57282a584d2746faf1593d3121fcac444dc', decimalPlaces: 8 },
        { type: 'ceth', coin: 'eth', network: 'Mainnet', name: 'Compound Ether', tokenContractAddress: '0x4ddc2d193948926d02f9b1fe9e1daa0718270ed5', decimalPlaces: 8 },
        { type: 'valor', coin: 'eth', network: 'Mainnet', name: 'ValorToken', tokenContractAddress: '0x297e4e5e59ad72b1b0a2fd446929e76117be0e0a', decimalPlaces: 18 },
        { type: 'thkd', coin: 'eth', network: 'Mainnet', name: 'TrueHKD', tokenContractAddress: '0x0000852600ceb001e08e00bc008be620d60031f2', decimalPlaces: 18 },
        { type: 'tcad', coin: 'eth', network: 'Mainnet', name: 'TrueCAD', tokenContractAddress: '0x00000100f2a2bd000715001920eb70d229700085', decimalPlaces: 18 },
        { type: 'edn', coin: 'eth', network: 'Mainnet', name: 'Eden', tokenContractAddress: '0x05860d453c7974cbf46508c06cba14e211c629ce', decimalPlaces: 18 },
        { type: 'emx', coin: 'eth', network: 'Mainnet', name: 'EMX', tokenContractAddress: '0x75a29c405bd5ab2f3b35144af937ee98d390b5ee', decimalPlaces: 18 },
      ]
    },
    ofc: {
      tokens: [
        { type: 'ofcusd', coin: 'ofc', decimalPlaces: 2, name: 'Offchain USD', backingCoin: 'susd', isFiat: true },
        { type: 'ofcbtc', coin: 'ofc', decimalPlaces: 8, name: 'Offchain Bitcoin Mainnet', backingCoin: 'btc' },
        { type: 'ofceth', coin: 'ofc', decimalPlaces: 18, name: 'Offchain Ether Mainnet', backingCoin: 'eth' }
      ]
    }
  },
  // network name for test environments (testnet tokens must be added here)
  testnet: {
    eth: {
      tokens: [
        { type: 'terc', coin: 'teth', network: 'Kovan', tokenContractAddress: '0x945ac907cf021a6bcd07852bb3b8c087051706a9', decimalPlaces: 0, name: 'ERC Test Token' },
        { type: 'test', coin: 'teth', network: 'Kovan', tokenContractAddress: '0x1fb879581f31687b905653d4bbcbe3af507bed37', decimalPlaces: 18, name: 'Test Mintable ERC20 Token' },
        { type: 'tbst', coin: 'teth', network: 'Kovan', tokenContractAddress: '0xe5cdf77835ca2095881dd0803a77e844c87483cd', decimalPlaces: 0, name: 'Test BitGo Shield Token' },
        { type: 'schz', coin: 'teth', network: 'Kovan', tokenContractAddress: '0x050e25a2630b2aee94546589fd39785254de112c', decimalPlaces: 18, name: 'SchnauzerCoin' },
        { type: 'tcat', coin: 'teth', network: 'Kovan', tokenContractAddress: '0x63137319f3a14a985eb31547370e0e3bd39b03b8', decimalPlaces: 18, name: 'Test CAT-20 Token' },
        { type: 'tfmf', coin: 'teth', network: 'Kovan', tokenContractAddress: '0xd8463d2f8c5b3be9de95c63b73a0ae4c79423452', decimalPlaces: 18, name: 'Test Formosa Financial Token' }
      ]
    },
    ofc: {
      tokens: [
        { type: 'ofctusd', coin: 'ofc', decimalPlaces: 2, name: 'Offchain Test USD', backingCoin: 'tsusd', isFiat: true },
        { type: 'ofctbtc', coin: 'ofc', decimalPlaces: 8, name: 'Offchain Bitcoin Test', backingCoin: 'tbtc' },
        { type: 'ofcteth', coin: 'ofc', decimalPlaces: 18, name: 'Offchain Ether Testnet', backingCoin: 'teth' },
        { type: 'ofctltc', coin: 'ofc', decimalPlaces: 8, name: 'Offchain Litecoin Testnet', backingCoin: 'tltc' },
      ]
    }
  },
};

export const mainnetTokens = {};
_.forEach(tokens.bitcoin.eth.tokens, function(value) {
  if (mainnetTokens[value.type]) {
    throw new Error('token : ' + value.type + ' duplicated.');
  }
  mainnetTokens[value.type] = true;

  if (value.tokenContractAddress !== _.toLower(value.tokenContractAddress)) {
    throw new Error('token contract: ' + value.type + ' is not all lower case: ' + value.tokenContractAddress);
  }
});

export const testnetTokens = {};
_.forEach(tokens.testnet.eth.tokens, function(value) {
  if (testnetTokens[value.type]) {
    throw new Error('token : ' + value.type + ' duplicated.');
  }
  testnetTokens[value.type] = true;

  if (value.tokenContractAddress !== _.toLower(value.tokenContractAddress)) {
    throw new Error('token contract: ' + value.type + ' is not all lower case: ' + value.tokenContractAddress);
  }
});

export const defaults = {
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
export const supportedCrossChainRecoveries = {
  btc: ['bch', 'ltc', 'bsv'],
  bch: ['btc', 'ltc', 'bsv'],
  ltc: ['btc', 'bch', 'bsv'],
  bsv: ['btc', 'ltc', 'bch']
};

// KRS providers and their fee structures
export const krsProviders = {
  keyternal: {
    feeType: 'flatUsd',
    feeAmount: 99,
    supportedCoins: ['btc', 'eth'],
    feeAddresses: {
      btc: '' // TODO [BG-6965] Get address from Keyternal - recovery will fail for now until Keyternal is ready
    }
  },
  bitgoKRSv2: {
    feeType: 'flatUsd',
    feeAmount: 0, // we will receive payments off-chain
    supportedCoins: ['btc', 'eth']
  },
  dai: {
    feeType: 'flatUsd',
    feeAmount: 0, // dai will receive payments off-chain
    supportedCoins: ['btc', 'eth', 'xlm', 'xrp', 'dash', 'zec', 'ltc', 'bch']
  }
};

export const bitcoinAverageBaseUrl = 'https://apiv2.bitcoinaverage.com/indices/local/ticker/';

// TODO: once server starts returning eth address keychains, remove bitgoEthAddress
/**
 * Get the default (hardcoded) constants for a particular network.
 *
 * Note that this may not be the complete set of constants, and additional constants may get fetched
 * from BitGo during the lifespan of a BitGo object.
 * @param env
 */
export const defaultConstants = (env: EnvironmentName) => {
  if (Environments[env] === undefined) {
    throw Error(`invalid environment ${env}`);
  }

  const network = Environments[env].network;
  return _.merge({}, defaults, tokens[network]);
};
