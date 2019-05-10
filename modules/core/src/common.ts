import bitcoin = require('bitgo-utxo-lib');
const _ = require('lodash');

export const Environments = {
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
    zecExplorerBaseUrl: 'https://zcash.blockexplorer.com/api',
    dashExplorerBaseUrl: 'https://insight.dash.org/insight-api',
    stellarFederationServerUrl: 'https://www.bitgo.com/api/v2/xlm/federation'
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
    zecExplorerBaseUrl: 'https://zcash.blockexplorer.com/api',
    dashExplorerBaseUrl: 'https://insight.dash.org/insight-api',
    stellarFederationServerUrl: 'https://rmg.bitgo.com/api/v2/xlm/federation'
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
    zecExplorerBaseUrl: 'https://zcash.blockexplorer.com/api',
    dashExplorerBaseUrl: 'https://insight.dash.org/insight-api',
    stellarFederationServerUrl: 'https://staging.bitgo.com/api/v2/xlm/federation'
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
    zecExplorerBaseUrl: 'https://zcash.blockexplorer.com/api',
    dashExplorerBaseUrl: 'https://insight.dash.org/insight-api',
    stellarFederationServerUrl: 'https://rmgstaging.bitgo.com/api/v2/xlm/federation'
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
    zecExplorerBaseUrl: 'https://explorer.testnet.z.cash/api',
    dashExplorerBaseUrl: 'https://testnet-insight.dashevo.org/insight-api',
    stellarFederationServerUrl: 'https://test.bitgo.com/api/v2/txlm/federation'
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
    zecExplorerBaseUrl: 'https://explorer.testnet.z.cash/api',
    dashExplorerBaseUrl: 'https://testnet-insight.dashevo.org/insight-api',
    stellarFederationServerUrl: 'https://rmgtest.bitgo.com/api/v2/txlm/federation'
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
    zecExplorerBaseUrl: 'https://explorer.testnet.z.cash/api',
    dashExplorerBaseUrl: 'https://testnet-insight.dashevo.org/insight-api',
    stellarFederationServerUrl: 'https://webdev.bitgo.com/api/v2/txlm/federation'
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
    zecExplorerBaseUrl: 'https://explorer.testnet.z.cash/api',
    dashExplorerBaseUrl: 'https://testnet-insight.dashevo.org/insight-api',
    stellarFederationServerUrl: 'https://latest.bitgo.com/api/v2/txlm/federation'
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
    zecExplorerBaseUrl: 'https://explorer.testnet.z.cash/api',
    dashExplorerBaseUrl: 'https://testnet-insight.dashevo.org/insight-api',
    stellarFederationServerUrl: 'https://rmglatest.bitgo.com/api/v2/txlm/federation'
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
    zecExplorerBaseUrl: 'https://explorer.testnet.z.cash/api',
    dashExplorerBaseUrl: 'https://testnet-insight.dashevo.org/insight-api',
    stellarFederationServerUrl: 'https://rmgwebdev.bitgo.com/api/v2/txlm/federation'
  },
  local: {
    uri: 'https://localhost:3000',
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
    zecExplorerBaseUrl: 'https://explorer.testnet.z.cash/api',
    stellarFederationServerUrl: 'https://localhost:3000/api/v2/txlm/federation'
  },
  localNonSecure: {
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
    zecExplorerBaseUrl: 'https://explorer.testnet.z.cash/api',
    dashExplorerBaseUrl: 'https://testnet-insight.dashevo.org/insight-api',
    stellarFederationServerUrl: 'http://localhost:3000/api/v2/txlm/federation'
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
    zecExplorerBaseUrl: 'https://explorer.testnet.z.cash/api',
    dashExplorerBaseUrl: 'https://testnet-insight.dashevo.org/insight-api',
    stellarFederationServerUrl: 'https://bitgo.fakeurl/api/v2/txlm/federation'
  },
  rmgLocal: {
    uri: 'https://rmglocalhost:3000',
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
    zecExplorerBaseUrl: 'https://explorer.testnet.z.cash/api',
    stellarFederationServerUrl: 'https://rmglocalhost:3000/api/v2/txlm/federation'
  },
  rmglocalNonSecure: {
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
    zecExplorerBaseUrl: 'https://explorer.testnet.z.cash/api',
    dashExplorerBaseUrl: 'https://testnet-insight.dashevo.org/insight-api',
    stellarFederationServerUrl: 'http://rmglocalhost:3000/api/v2/txlm/federation'
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
    zecExplorerBaseUrl: process.env.BITGO_CUSTOM_ZCASH_NETWORK !== 'zcash' ? 'https://explorer.testnet.z.cash/api' : 'https://zcash.blockexplorer.com/api',
    dashExplorerBaseUrl: process.env.BITGO_CUSTOM_DASH_NETWORK !== 'dash' ? 'https://testnet-insight.dashevo.org/insight-api' : 'https://insight.dash.org/insight-api',
    stellarFederationServerUrl: process.env.BITGO_CUSTOM_STELLAR_NETWORK !== 'stellar' ?
      `https://${process.env.BITGO_CUSTOM_ROOT_URI}/api/v2/txlm/federation` :
      `https://${process.env.BITGO_CUSTOM_ROOT_URI}/api/v2/xlm/federation`
  }
};

let bitcoinNetwork: string;
let rmgNetwork: string;

export function setNetwork(network) {
  if (network === 'bitcoin') {
    bitcoinNetwork = 'bitcoin';
  } else {
    // test network
    bitcoinNetwork = 'testnet';
  }
}

export function getNetwork(): string {
  return bitcoinNetwork;
}

export function getRmgNetwork(): string {
  return rmgNetwork;
}

export function setRmgNetwork(network): void {
  rmgNetwork = network;
}

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
export function validateParams(params, expectedParams, optionalParams = [], optionalCallback = undefined): boolean {
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

  optionalParams.forEach(function(optionalParam) {
    if (params[optionalParam] && !_.isString(params[optionalParam])) {
      throw new Error('Expecting parameter string: ' + optionalParam + ' but found ' + typeof(params[optionalParam]));
    }
  });

  if (optionalCallback && !_.isFunction(optionalCallback)) {
    throw new Error('illegal callback argument');
  }

  return true;
}
