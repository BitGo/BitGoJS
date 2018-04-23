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
        { type: 'rep', coin: 'eth', network: 'Mainnet', name: 'Augur', tokenContractAddress: '0xe94327d07fc17907b4db788e5adf2ed424addff6', decimalPlaces: 18 },
        { type: 'pay', coin: 'eth', network: 'Mainnet', name: 'TenX', tokenContractAddress: '0xb97048628db6b661d4c2aa833e95dbe1a905b280', decimalPlaces: 18 },
        { type: 'bst', coin: 'eth', network: 'Mainnet', name: 'BitGo Shield Token', tokenContractAddress: '0x18ad17ff2dfcfd647db497b1e2cbd76de4da40fc', decimalPlaces: 0 },
        { type: 'gnt', coin: 'eth', network: 'Mainnet', name: 'Golem', tokenContractAddress: '0xa74476443119a942de498590fe1f2454d7d4ac0d', decimalPlaces: 18 },
        { type: 'bat', coin: 'eth', network: 'Mainnet', name: 'Basic Attention Token', tokenContractAddress: '0x0d8775f648430679a709e98d2b0cb6250d2887ef', decimalPlaces: 18 },
        { type: 'knc', coin: 'eth', network: 'Mainnet', name: 'Kyber Network', tokenContractAddress: '0xdd974d5c2e2928dea5f71b9825b8b646686bd200', decimalPlaces: 18 },
        { type: 'zrx', coin: 'eth', network: 'Mainnet', name: '0x Token', tokenContractAddress: '0xe41d2489571d322189246dafa5ebde1f4699f498', decimalPlaces: 18 },
        { type: 'fun', coin: 'eth', network: 'Mainnet', name: 'FunFair', tokenContractAddress: '0x419d0d8bdd9af5e606ae2232ed285aff190e711b', decimalPlaces: 8 },
        { type: 'cvc', coin: 'eth', network: 'Mainnet', name: 'Civic', tokenContractAddress: '0x41e5560054824ea6b0732e656e3ad64e20e94e45', decimalPlaces: 8 },
        { type: 'eos', coin: 'eth', network: 'Mainnet', name: 'Eos', tokenContractAddress: '0x86fa049857e0209aa7d9e616f7eb3b3b78ecfdb0', decimalPlaces: 18 },
        { type: 'qrl', coin: 'eth', network: 'Mainnet', name: 'Qrl', tokenContractAddress: '0x697beac28b09e122c4332d163985e8a73121b97f', decimalPlaces: 8 },
        { type: 'nmr', coin: 'eth', network: 'Mainnet', name: 'Numeraire', tokenContractAddress: '0x1776e1f26f98b1a5df9cd347953a26dd3cb46671', decimalPlaces: 18 },
        { type: 'brd', coin: 'eth', network: 'Mainnet', name: 'Bread', tokenContractAddress: '0x558ec3152e2eb2174905cd19aea4e34a23de9ad6', decimalPlaces: 18 },
        { type: 'trx', coin: 'eth', network: 'Mainnet', name: 'Tron', tokenContractAddress: '0xf230b790e05390fc8295f4d3f60332c93bed42e2', decimalPlaces: 6 },
        { type: 'wax', coin: 'eth', network: 'Mainnet', name: 'Wax', tokenContractAddress: '0x39bb259f66e1c59d5abef88375979b4d20d98022', decimalPlaces: 8 },
        { type: 'mkr', coin: 'eth', network: 'Mainnet', name: 'Maker', tokenContractAddress: '0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2', decimalPlaces: 18 }
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

const defaults = {
  maxFee: 0.1e8,
  maxFeeRate: 1000000,
  minFeeRate: 5000,
  fallbackFeeRate: 50000,
  minOutputSize: 2730,
  minInstantFeeRate: 10000,
  bitgoEthAddress: '0x0f47ea803926926f299b7f1afc8460888d850f47'
};

// TODO: once server starts returning eth address keychains, remove bitgoEthAddress
exports.defaultConstants = (env) => {

  if (common.Environments[env] === undefined) {
    throw Error(`invalid environment ${env}`);
  }

  const network = common.Environments[env].network;
  return _.merge({}, defaults, exports.tokens[network]);
};
