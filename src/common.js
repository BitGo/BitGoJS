const bitcoin = require('bitgo-utxo-lib');
const _ = require('lodash');

exports.Environments = {
  prod: {
    uri: 'https://www.bitgo.com',
    networks: {
      btc: bitcoin.networks.bitcoin
    },
    network: 'bitcoin',
    ethNetwork: 'ethereum',
    rmgNetwork: 'rmg',
    signingAddress: '1BitGo3gxRZ6mQSEH52dvCKSUgVCAH4Rja',
    serverXpub: 'xpub661MyMwAqRbcEtUgu9HF8ai4ipuVKKHBzUqks4jSFypW8dwwQL1zygLgQx99NmC7zJJznSiwKG6RQfVjAKMtCsx8VjR6kQW8x7HrkXFZdnQ',
    smartBitApiBaseUrl: 'https://api.smartbit.com.au/v1',
    bchExplorerBaseUrl: 'https://blockdozer.com/insight-api',
    btgExplorerBaseUrl: 'https://btgexplorer.com/api',
    etherscanBaseUrl: 'https://api.etherscan.io',
    ltcExplorerBaseUrl: 'https://insight.litecore.io/api',
    zecExplorerBaseUrl: 'https://zcash.blockexplorer.com/api'
  },
  rmgProd: {
    uri: 'https://rmg.bitgo.com',
    networks: {
      btc: bitcoin.networks.bitcoin
    },
    network: 'bitcoin',
    ethNetwork: 'ethereum',
    rmgNetwork: 'rmg',
    signingAddress: '1BitGo3gxRZ6mQSEH52dvCKSUgVCAH4Rja',
    serverXpub: 'xpub661MyMwAqRbcEtUgu9HF8ai4ipuVKKHBzUqks4jSFypW8dwwQL1zygLgQx99NmC7zJJznSiwKG6RQfVjAKMtCsx8VjR6kQW8x7HrkXFZdnQ',
    smartBitApiBaseUrl: 'https://api.smartbit.com.au/v1',
    bchExplorerBaseUrl: 'https://blockdozer.com/insight-api',
    btgExplorerBaseUrl: 'https://btgexplorer.com/api',
    etherscanBaseUrl: 'https://api.etherscan.io',
    ltcExplorerBaseUrl: 'https://insight.litecore.io/api',
    zecExplorerBaseUrl: 'https://zcash.blockexplorer.com/api'
  },
  staging: {
    uri: 'https://staging.bitgo.com',
    networks: {
      btc: bitcoin.networks.bitcoin
    },
    network: 'bitcoin',
    ethNetwork: 'ethereum',
    rmgNetwork: 'rmg',
    signingAddress: '1BitGo3gxRZ6mQSEH52dvCKSUgVCAH4Rja',
    serverXpub: 'xpub661MyMwAqRbcEtUgu9HF8ai4ipuVKKHBzUqks4jSFypW8dwwQL1zygLgQx99NmC7zJJznSiwKG6RQfVjAKMtCsx8VjR6kQW8x7HrkXFZdnQ',
    smartBitApiBaseUrl: 'https://api.smartbit.com.au/v1',
    bchExplorerBaseUrl: 'https://blockdozer.com/insight-api',
    btgExplorerBaseUrl: 'https://btgexplorer.com/api',
    etherscanBaseUrl: 'https://api.etherscan.io',
    ltcExplorerBaseUrl: 'https://insight.litecore.io/api',
    zecExplorerBaseUrl: 'https://zcash.blockexplorer.com/api'
  },
  rmgStaging: {
    uri: 'https://rmgstaging.bitgo.com',
    networks: {
      btc: bitcoin.networks.bitcoin
    },
    network: 'bitcoin',
    ethNetwork: 'ethereum',
    rmgNetwork: 'rmg',
    signingAddress: '1BitGo3gxRZ6mQSEH52dvCKSUgVCAH4Rja',
    serverXpub: 'xpub661MyMwAqRbcEtUgu9HF8ai4ipuVKKHBzUqks4jSFypW8dwwQL1zygLgQx99NmC7zJJznSiwKG6RQfVjAKMtCsx8VjR6kQW8x7HrkXFZdnQ',
    smartBitApiBaseUrl: 'https://api.smartbit.com.au/v1',
    bchExplorerBaseUrl: 'https://blockdozer.com/insight-api',
    btgExplorerBaseUrl: 'https://btgexplorer.com/api',
    etherscanBaseUrl: 'https://api.etherscan.io',
    ltcExplorerBaseUrl: 'https://insight.litecore.io/api',
    zecExplorerBaseUrl: 'https://zcash.blockexplorer.com/api'
  },
  test: {
    uri: 'https://test.bitgo.com',
    networks: {
      tbtc: bitcoin.networks.testnet
    },
    network: 'testnet',
    ethNetwork: 'ethereum',
    rmgNetwork: 'rmgTest',
    signingAddress: 'msignBdFXteehDEgB6DNm7npRt7AcEZJP3',
    serverXpub: 'xpub661MyMwAqRbcErFqVXGiUFv9YeoPbhN72UiNCUdj9nj3T6M8h7iKNmbCYpMVWVZP7LA2ma3HWcPngz1gRTm4FPdtm9mHfrNvU93MCoszsGL',
    smartBitApiBaseUrl: 'https://testnet-api.smartbit.com.au/v1',
    bchExplorerBaseUrl: 'https://test-bch-insight.bitpay.com/api',
    etherscanBaseUrl: 'https://kovan.etherscan.io',
    ltcExplorerBaseUrl: 'http://explorer.litecointools.com/api',
    zecExplorerBaseUrl: 'https://explorer.testnet.z.cash/api'
  },
  rmgTest: {
    uri: 'https://rmgtest.bitgo.com',
    networks: {
      tbtc: bitcoin.networks.testnet
    },
    network: 'testnet',
    ethNetwork: 'ethereum',
    rmgNetwork: 'rmgTest',
    signingAddress: 'msignBdFXteehDEgB6DNm7npRt7AcEZJP3',
    serverXpub: 'xpub661MyMwAqRbcErFqVXGiUFv9YeoPbhN72UiNCUdj9nj3T6M8h7iKNmbCYpMVWVZP7LA2ma3HWcPngz1gRTm4FPdtm9mHfrNvU93MCoszsGL',
    smartBitApiBaseUrl: 'https://testnet-api.smartbit.com.au/v1',
    bchExplorerBaseUrl: 'https://test-bch-insight.bitpay.com/api',
    etherscanBaseUrl: 'https://kovan.etherscan.io',
    ltcExplorerBaseUrl: 'http://explorer.litecointools.com/api',
    zecExplorerBaseUrl: 'https://explorer.testnet.z.cash/api'
  },
  dev: {
    uri: 'https://webdev.bitgo.com',
    networks: {
      tbtc: bitcoin.networks.testnet
    },
    network: 'testnet',
    ethNetwork: 'ethereum',
    rmgNetwork: 'rmgTest',
    signingAddress: 'msignBdFXteehDEgB6DNm7npRt7AcEZJP3',
    serverXpub: 'xpub661MyMwAqRbcErFqVXGiUFv9YeoPbhN72UiNCUdj9nj3T6M8h7iKNmbCYpMVWVZP7LA2ma3HWcPngz1gRTm4FPdtm9mHfrNvU93MCoszsGL',
    smartBitApiBaseUrl: 'https://testnet-api.smartbit.com.au/v1',
    bchExplorerBaseUrl: 'https://test-bch-insight.bitpay.com/api',
    etherscanBaseUrl: 'https://kovan.etherscan.io',
    ltcExplorerBaseUrl: 'http://explorer.litecointools.com/api',
    zecExplorerBaseUrl: 'https://explorer.testnet.z.cash/api'
  },
  latest: {
    uri: 'https://latest.bitgo.com',
    networks: {
      tbtc: bitcoin.networks.testnet
    },
    network: 'testnet',
    ethNetwork: 'ethereum',
    rmgNetwork: 'rmgTest',
    signingAddress: 'msignBdFXteehDEgB6DNm7npRt7AcEZJP3',
    serverXpub: 'xpub661MyMwAqRbcErFqVXGiUFv9YeoPbhN72UiNCUdj9nj3T6M8h7iKNmbCYpMVWVZP7LA2ma3HWcPngz1gRTm4FPdtm9mHfrNvU93MCoszsGL',
    smartBitApiBaseUrl: 'https://testnet-api.smartbit.com.au/v1',
    bchExplorerBaseUrl: 'https://test-bch-insight.bitpay.com/api',
    etherscanBaseUrl: 'https://kovan.etherscan.io',
    ltcExplorerBaseUrl: 'http://explorer.litecointools.com/api',
    zecExplorerBaseUrl: 'https://explorer.testnet.z.cash/api'
  },
  rmgLatest: {
    uri: 'https://rmglatest.bitgo.com',
    networks: {
      tbtc: bitcoin.networks.testnet
    },
    network: 'testnet',
    ethNetwork: 'ethereum',
    rmgNetwork: 'rmgTest',
    signingAddress: 'msignBdFXteehDEgB6DNm7npRt7AcEZJP3',
    serverXpub: 'xpub661MyMwAqRbcErFqVXGiUFv9YeoPbhN72UiNCUdj9nj3T6M8h7iKNmbCYpMVWVZP7LA2ma3HWcPngz1gRTm4FPdtm9mHfrNvU93MCoszsGL',
    smartBitApiBaseUrl: 'https://testnet-api.smartbit.com.au/v1',
    bchExplorerBaseUrl: 'https://test-bch-insight.bitpay.com/api',
    etherscanBaseUrl: 'https://kovan.etherscan.io',
    ltcExplorerBaseUrl: 'http://explorer.litecointools.com/api',
    zecExplorerBaseUrl: 'https://explorer.testnet.z.cash/api'
  },
  rmgDev: {
    uri: 'https://rmgwebdev.bitgo.com',
    networks: {
      tbtc: bitcoin.networks.testnet
    },
    network: 'testnet',
    ethNetwork: 'ethereum',
    rmgNetwork: 'rmgTest',
    signingAddress: 'msignBdFXteehDEgB6DNm7npRt7AcEZJP3',
    serverXpub: 'xpub661MyMwAqRbcErFqVXGiUFv9YeoPbhN72UiNCUdj9nj3T6M8h7iKNmbCYpMVWVZP7LA2ma3HWcPngz1gRTm4FPdtm9mHfrNvU93MCoszsGL',
    smartBitApiBaseUrl: 'https://testnet-api.smartbit.com.au/v1',
    bchExplorerBaseUrl: 'https://test-bch-insight.bitpay.com/api',
    etherscanBaseUrl: 'https://kovan.etherscan.io',
    ltcExplorerBaseUrl: 'http://explorer.litecointools.com/api',
    zecExplorerBaseUrl: 'https://explorer.testnet.z.cash/api'
  },
  local: {
    uri: 'http://localhost:3000',
    networks: {
      tbtc: bitcoin.networks.testnet
    },
    network: 'testnet',
    ethNetwork: 'ethereum',
    rmgNetwork: 'rmgTest',
    signingAddress: 'msignBdFXteehDEgB6DNm7npRt7AcEZJP3',
    serverXpub: 'xpub661MyMwAqRbcErFqVXGiUFv9YeoPbhN72UiNCUdj9nj3T6M8h7iKNmbCYpMVWVZP7LA2ma3HWcPngz1gRTm4FPdtm9mHfrNvU93MCoszsGL',
    smartBitApiBaseUrl: 'https://testnet-api.smartbit.com.au/v1',
    bchExplorerBaseUrl: 'https://test-bch-insight.bitpay.com/api',
    etherscanBaseUrl: 'https://kovan.etherscan.io',
    ltcExplorerBaseUrl: 'http://explorer.litecointools.com/api',
    zecExplorerBaseUrl: 'https://explorer.testnet.z.cash/api'
  },
  mock: {
    uri: 'https://bitgo.fakeurl',
    networks: {
      tbtc: bitcoin.networks.testnet
    },
    network: 'testnet',
    ethNetwork: 'ethereum',
    rmgNetwork: 'rmgTest',
    signingAddress: 'msignBdFXteehDEgB6DNm7npRt7AcEZJP3',
    serverXpub: 'xpub661MyMwAqRbcErFqVXGiUFv9YeoPbhN72UiNCUdj9nj3T6M8h7iKNmbCYpMVWVZP7LA2ma3HWcPngz1gRTm4FPdtm9mHfrNvU93MCoszsGL',
    smartBitApiBaseUrl: 'https://testnet-api.smartbit.fakeurl/v1',
    bchExplorerBaseUrl: 'https://test-bch-insight.bitpay.fakeurl/api',
    etherscanBaseUrl: 'https://kovan.etherscan.io',
    ltcExplorerBaseUrl: 'http://explorer.litecointools.com/api',
    zecExplorerBaseUrl: 'https://explorer.testnet.z.cash/api'
  },
  rmgLocal: {
    uri: 'http://rmglocalhost:3000',
    networks: {
      tbtc: bitcoin.networks.testnet
    },
    network: 'testnet',
    ethNetwork: 'ethereum',
    rmgNetwork: 'rmgTest',
    signingAddress: 'msignBdFXteehDEgB6DNm7npRt7AcEZJP3',
    serverXpub: 'xpub661MyMwAqRbcErFqVXGiUFv9YeoPbhN72UiNCUdj9nj3T6M8h7iKNmbCYpMVWVZP7LA2ma3HWcPngz1gRTm4FPdtm9mHfrNvU93MCoszsGL',
    smartBitApiBaseUrl: 'https://testnet-api.smartbit.com.au/v1',
    bchExplorerBaseUrl: 'https://test-bch-insight.bitpay.com/api',
    etherscanBaseUrl: 'https://kovan.etherscan.io',
    ltcExplorerBaseUrl: 'http://explorer.litecointools.com/api',
    zecExplorerBaseUrl: 'https://explorer.testnet.z.cash/api'
  },
  custom: {
    uri: process.env.BITGO_CUSTOM_ROOT_URI,
    networks: {
      btc: bitcoin.networks.bitcoin,
      tbtc: bitcoin.networks.testnet
    },
    network: process.env.BITGO_CUSTOM_BITCOIN_NETWORK || 'bitcoin',
    ethNetwork: process.env.BITGO_CUSTOM_ETHEREUM_NETWORK || 'ethereum',
    rmgNetwork: process.env.BITGO_CUSTOM_RMG_NETWORK || 'rmg',
    signingAddress: '1BitGo3gxRZ6mQSEH52dvCKSUgVCAH4Rja',
    serverXpub: 'xpub661MyMwAqRbcEtUgu9HF8ai4ipuVKKHBzUqks4jSFypW8dwwQL1zygLgQx99NmC7zJJznSiwKG6RQfVjAKMtCsx8VjR6kQW8x7HrkXFZdnQ',
    smartBitApiBaseUrl: 'https://' + (process.env.BITGO_CUSTOM_BITCOIN_NETWORK !== 'bitcoin' ? 'testnet-api' : 'api') + '.smartbit.com.au/v1',
    bchExplorerBaseUrl: process.env.BITGO_CUSTOM_BITCOIN_NETWORK !== 'bitcoin' ? 'https://test-bch-insight.bitpay.com/api' : 'https://blockdozer.com/insight-api',
    btgExplorerBaseUrl: process.env.BITGO_CUSTOM_BITCOIN_NETWORK !== 'bitcoin' ? null : 'https://btgexplorer.com/api',
    ltcExplorerBaseUrl: process.env.BITGO_CUSTOM_LITECOIN_NETWORK !== 'litecoin' ? 'http://explorer.litecointools.com/api' : 'https://insight.litecore.io/api',
    etherscanBaseUrl: process.env.BITGO_CUSTOM_ETHEREUM_NETWORK !== 'ethereum' ? 'https://kovan.etherscan.io' : 'https://api.etherscan.io',
    zecExplorerBaseUrl: process.env.BITGO_CUSTOM_ZCASH_NETWORK !== 'zcash' ? 'https://explorer.testnet.z.cash/api' : 'https://zcash.blockexplorer.com/api'
  }
};

let bitcoinNetwork;
let ethereumNetwork;
let rmgNetwork;

exports.setNetwork = function(network) {
  if (network === 'bitcoin') {
    bitcoinNetwork = 'bitcoin';
  } else {
    // test network
    bitcoinNetwork = 'testnet';
  }
};

exports.getNetwork = function() {
  return bitcoinNetwork;
};

exports.getRmgNetwork = function() {
  return rmgNetwork;
};

exports.setRmgNetwork = function(network) {
  rmgNetwork = network;
};

exports.setEthNetwork = function(network) {
  ethereumNetwork = 'ethereum';
};

exports.getEthNetwork = function() {
  return ethereumNetwork;
};

/**
 * Helper function to validate the input parameters to an SDK method.
 * Only validates for strings - if parameter is different, check that manually
 *
 * @param params {Object} dictionary of parameter key-value pairs
 * @param expectedParams {string[]} list of expected string parameters
 * @param optionalParams {string[]} list of optional string parameters
 * @param optionalCallback {Function} if callback provided, must be a function
 * @returns {boolean} true if validated, throws with reason otherwise
 */
exports.validateParams = function(params, expectedParams, optionalParams, optionalCallback) {
  if (!_.isObject(params)) {
    throw new Error('Must pass in parameters dictionary');
  }

  expectedParams = expectedParams || [];

  expectedParams.forEach(function(expectedParam) {
    if (!params[expectedParam]) {
      throw new Error('Missing parameter: ' + expectedParam);
    }
    if (!_.isString(params[expectedParam])) {
      throw new Error('Expecting parameter string: ' + expectedParam + ' but found ' + typeof(params[expectedParam]));
    }
  });

  optionalParams = optionalParams || [];
  optionalParams.forEach(function(optionalParam) {
    if (params[optionalParam] && !_.isString(params[optionalParam])) {
      throw new Error('Expecting parameter string: ' + optionalParam + ' but found ' + typeof(params[optionalParam]));
    }
  });

  if (optionalCallback && !_.isFunction(optionalCallback)) {
    throw new Error('illegal callback argument');
  }

  return true;
};
