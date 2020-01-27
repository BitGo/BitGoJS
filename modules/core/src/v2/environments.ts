/**
 * @prettier
 */
import * as bitcoin from 'bitgo-utxo-lib';
import { V1Network, V1RmgNetwork } from './types';

interface EnvironmentTemplate {
  uri?: string;
  networks: {
    btc?: bitcoin.Network;
    tbtc?: bitcoin.Network;
  };
  network: V1Network;
  rmgNetwork: V1RmgNetwork;
  signingAddress: string;
  serverXpub: string;
  hsmXpub: string;
  smartBitApiBaseUrl: string;
  bchExplorerBaseUrl: string;
  bsvExplorerBaseUrl?: string;
  btgExplorerBaseUrl?: string;
  etherscanBaseUrl: string;
  ltcExplorerBaseUrl: string;
  zecExplorerBaseUrl: string;
  dashExplorerBaseUrl: string;
  stellarFederationServerUrl?: string;
  eosNodeUrls: string[];
  tronNodes: {
    full: string;
    solidity: string;
  };
}

export interface Environment extends EnvironmentTemplate {
  uri: string;
  stellarFederationServerUrl: string;
}

export const hardcodedPublicKeys = Object.freeze({
  serverXpub: {
    prod:
      'xpub661MyMwAqRbcEtUgu9HF8ai4ipuVKKHBzUqks4jSFypW8dwwQL1zygLgQx99NmC7zJJznSiwKG6RQfVjAKMtCsx8VjR6kQW8x7HrkXFZdnQ',
    test:
      'xpub661MyMwAqRbcErFqVXGiUFv9YeoPbhN72UiNCUdj9nj3T6M8h7iKNmbCYpMVWVZP7LA2ma3HWcPngz1gRTm4FPdtm9mHfrNvU93MCoszsGL',
  },
  hsmXpub: {
    prod:
      'xpub661MyMwAqRbcGEtTFgMAoxMFoqsRdDaiaR63byNfZdV7cBZFvovQSNJ5bpyeoQtuKVgXBk6sFQ7TtvyWqadt41DnKwveYgM5KoU2EKYjdY2',
    test:
      'xpub661MyMwAqRbcGFKe4Bqvk4Sgric4gNFC8pUbw4tUkVjZxubjCA522gPzc1YaXb3bQVmDWc7CjG8AGNWRpcdAU38RETBh8n2bnqEU4kbV4oK',
    dev:
      'xpub661MyMwAqRbcFWzoz8qnYRDYEFQpPLYwxVFoG6WLy3ck5ZupRGJTG4ju6yGb7Dj3ey6GsC4kstLRER2nKzgjLtmxyPgC4zHy7kVhUt6yfGn',
  },
});

export type EnvironmentName =
  | 'prod'
  | 'rmgProd'
  | 'staging'
  | 'rmgStaging'
  | 'test'
  | 'rmgTest'
  | 'dev'
  | 'latest'
  | 'rmgLatest'
  | 'rmgDev'
  | 'local'
  | 'localNonSecure'
  | 'mock'
  | 'rmgLocal'
  | 'rmglocalNonSecure'
  | 'msProd'
  | 'msTest'
  | 'msDev'
  | 'msLatest'
  | 'adminProd'
  | 'adminTest'
  | 'adminDev'
  | 'adminLatest'
  | 'custom';

export type Environments = { [k in EnvironmentName]: Environment };

const mainnetBase: EnvironmentTemplate = {
  networks: {
    btc: bitcoin.networks.bitcoin,
  },
  network: 'bitcoin' as V1Network,
  rmgNetwork: 'rmg' as V1RmgNetwork,
  signingAddress: '1BitGo3gxRZ6mQSEH52dvCKSUgVCAH4Rja',
  serverXpub: hardcodedPublicKeys.serverXpub.prod,
  hsmXpub: hardcodedPublicKeys.hsmXpub.prod,
  smartBitApiBaseUrl: 'https://api.smartbit.com.au/v1',
  bchExplorerBaseUrl: 'https://blockdozer.com/insight-api',
  btgExplorerBaseUrl: 'https://btgexplorer.com/api',
  etherscanBaseUrl: 'https://api.etherscan.io',
  ltcExplorerBaseUrl: 'https://insight.litecore.io/api',
  zecExplorerBaseUrl: 'https://zcashnetwork.info/api',
  dashExplorerBaseUrl: 'https://insight.dash.org/insight-api',
  eosNodeUrls: ['https://bp.cryptolions.io', 'https://api.eosnewyork.io', 'https://api.eosdetroit.io'],
  tronNodes: {
    full: 'https://api.trongrid.io',
    solidity: 'https://api.trongrid.io',
  },
};

const testnetBase: EnvironmentTemplate = {
  networks: {
    tbtc: bitcoin.networks.testnet,
  },
  network: 'testnet' as V1Network,
  rmgNetwork: 'rmgTest' as V1RmgNetwork,
  signingAddress: 'msignBdFXteehDEgB6DNm7npRt7AcEZJP3',
  serverXpub: hardcodedPublicKeys.serverXpub.test,
  hsmXpub: hardcodedPublicKeys.hsmXpub.test,
  smartBitApiBaseUrl: 'https://testnet-api.smartbit.com.au/v1',
  bchExplorerBaseUrl: 'https://test-bch-insight.bitpay.com/api',
  etherscanBaseUrl: 'https://kovan.etherscan.io',
  ltcExplorerBaseUrl: 'http://explorer.litecointools.com/api',
  zecExplorerBaseUrl: 'https://explorer.testnet.z.cash/api',
  dashExplorerBaseUrl: 'https://testnet-insight.dashevo.org/insight-api',
  eosNodeUrls: [
    'https://jungle2.cryptolions.io',
    'https://eos-jungle.eosblocksmith.io',
    'https://api.jungle.alohaeos.com',
  ],
  tronNodes: {
    full: 'http://47.252.81.135:8090',
    solidity: 'http://47.252.81.135:8091',
  },
};

const devBase: EnvironmentTemplate = Object.assign({}, testnetBase, {
  hsmXpub: hardcodedPublicKeys.hsmXpub.dev,
});

export const Environments: Environments = {
  prod: Object.assign({}, mainnetBase, {
    uri: 'https://www.bitgo.com',
    stellarFederationServerUrl: 'https://www.bitgo.com/api/v2/xlm/federation',
  }),
  rmgProd: Object.assign({}, mainnetBase, {
    uri: 'https://rmg.bitgo.com',
    stellarFederationServerUrl: 'https://rmg.bitgo.com/api/v2/xlm/federation',
  }),
  staging: Object.assign({}, mainnetBase, {
    uri: 'https://staging.bitgo.com',
    stellarFederationServerUrl: 'https://staging.bitgo.com/api/v2/xlm/federation',
  }),
  rmgStaging: Object.assign({}, mainnetBase, {
    uri: 'https://rmgstaging.bitgo.com',
    stellarFederationServerUrl: 'https://rmgstaging.bitgo.com/api/v2/xlm/federation',
  }),
  test: Object.assign({}, testnetBase, {
    uri: 'https://test.bitgo.com',
    stellarFederationServerUrl: 'https://test.bitgo.com/api/v2/txlm/federation',
  }),
  rmgTest: Object.assign({}, testnetBase, {
    uri: 'https://rmgtest.bitgo.com',
    stellarFederationServerUrl: 'https://rmgtest.bitgo.com/api/v2/txlm/federation',
  }),
  dev: Object.assign({}, devBase, {
    uri: 'https://webdev.bitgo.com',
    stellarFederationServerUrl: 'https://webdev.bitgo.com/api/v2/txlm/federation',
  }),
  latest: Object.assign({}, devBase, {
    uri: 'https://latest.bitgo.com',
    stellarFederationServerUrl: 'https://latest.bitgo.com/api/v2/txlm/federation',
  }),
  rmgLatest: Object.assign({}, devBase, {
    uri: 'https://rmglatest.bitgo.com',
    stellarFederationServerUrl: 'https://rmglatest.bitgo.com/api/v2/txlm/federation',
  }),
  rmgDev: Object.assign({}, devBase, {
    uri: 'https://rmgwebdev.bitgo.com',
    stellarFederationServerUrl: 'https://rmgwebdev.bitgo.com/api/v2/txlm/federation',
  }),
  local: Object.assign({}, devBase, {
    uri: 'https://localhost:3000',
    stellarFederationServerUrl: 'https://localhost:3000/api/v2/txlm/federation',
  }),
  localNonSecure: Object.assign({}, devBase, {
    uri: 'http://localhost:3000',
    stellarFederationServerUrl: 'http://localhost:3000/api/v2/txlm/federation',
  }),
  mock: Object.assign({}, devBase, {
    uri: 'https://bitgo.fakeurl',
    smartBitApiBaseUrl: 'https://testnet-api.smartbit.fakeurl/v1',
    bchExplorerBaseUrl: 'https://test-bch-insight.bitpay.fakeurl/api',
    stellarFederationServerUrl: 'https://bitgo.fakeurl/api/v2/txlm/federation',
    etherscanBaseUrl: 'https://kovan.etherscan.fakeurl',
    ltcExplorerBaseUrl: 'http://explorer.litecointools.fakeurl/api',
    zecExplorerBaseUrl: 'https://explorer.testnet.z.fakeurl/api',
    dashExplorerBaseUrl: 'https://testnet-insight.dashevo.fakeurl/insight-api',
  }),
  rmgLocal: Object.assign({}, devBase, {
    uri: 'https://rmglocalhost:3000',
    stellarFederationServerUrl: 'https://rmglocalhost:3000/api/v2/txlm/federation',
  }),
  rmglocalNonSecure: Object.assign({}, devBase, {
    uri: 'http://rmglocalhost:3000',
    stellarFederationServerUrl: 'http://rmglocalhost:3000/api/v2/txlm/federation',
  }),
  msProd: Object.assign({}, mainnetBase, {
    uri: 'https://app.bitgo.com',
    stellarFederationServerUrl: 'https://app.bitgo.com/api/v2/xlm/federation',
  }),
  msTest: Object.assign({}, testnetBase, {
    uri: 'https://app.bitgo-test.com',
    stellarFederationServerUrl: 'https://app.bitgo-test.com/api/v2/txlm/federation',
  }),
  msDev: Object.assign({}, devBase, {
    uri: 'https://app.bitgo-dev.com',
    stellarFederationServerUrl: 'https://app.bitgo-dev.com/api/v2/txlm/federation',
  }),
  msLatest: Object.assign({}, devBase, {
    uri: 'https://app.bitgo-latest.com',
    stellarFederationServerUrl: 'https://app.bitgo-latest.com/api/v2/xlm/federation',
  }),
  adminProd: Object.assign({}, mainnetBase, {
    uri: 'https://admin.bitgo.com',
    stellarFederationServerUrl: 'https://admin.bitgo.com/api/v2/xlm/federation',
  }),
  adminTest: Object.assign({}, testnetBase, {
    uri: 'https://admin.bitgo-test.com',
    stellarFederationServerUrl: 'https://admin.bitgo-test.com/api/v2/txlm/federation',
  }),
  adminDev: Object.assign({}, devBase, {
    uri: 'https://admin.bitgo-dev.com',
    stellarFederationServerUrl: 'https://admin.bitgo-dev.com/api/v2/txlm/federation',
  }),
  adminLatest: Object.assign({}, devBase, {
    uri: 'https://admin.bitgo-latest.com',
    stellarFederationServerUrl: 'https://admin.bitgo-latest.com/api/v2/xlm/federation',
  }),
  custom: Object.assign({}, mainnetBase, {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    uri: process.env.BITGO_CUSTOM_ROOT_URI!,
    networks: {
      btc: bitcoin.networks.bitcoin,
      tbtc: bitcoin.networks.testnet,
    },
    network: process.env.BITGO_CUSTOM_BITCOIN_NETWORK as V1Network,
    rmgNetwork: process.env.BITGO_CUSTOM_RMG_NETWORK as V1RmgNetwork,
    hsmXpub: hardcodedPublicKeys.hsmXpub.dev,
    smartBitApiBaseUrl:
      process.env.BITGO_CUSTOM_BITCOIN_NETWORK !== 'bitcoin'
        ? 'https://testnet-api.smartbit.com.au/v1'
        : 'https://api.smartbit.com.au/v1',
    bchExplorerBaseUrl:
      process.env.BITGO_CUSTOM_BITCOIN_NETWORK !== 'bitcoin'
        ? 'https://test-bch-insight.bitpay.com/api'
        : 'https://blockdozer.com/insight-api',
    btgExplorerBaseUrl: process.env.BITGO_CUSTOM_BITCOIN_NETWORK !== 'bitcoin' ? null : 'https://btgexplorer.com/api',
    ltcExplorerBaseUrl:
      process.env.BITGO_CUSTOM_LITECOIN_NETWORK !== 'litecoin'
        ? 'http://explorer.litecointools.com/api'
        : 'https://insight.litecore.io/api',
    etherscanBaseUrl:
      process.env.BITGO_CUSTOM_ETHEREUM_NETWORK !== 'ethereum'
        ? 'https://kovan.etherscan.io'
        : 'https://api.etherscan.io',
    zecExplorerBaseUrl:
      process.env.BITGO_CUSTOM_ZCASH_NETWORK !== 'zcash'
        ? 'https://explorer.testnet.z.cash/api'
        : 'https://zcashnetwork.info/api',
    dashExplorerBaseUrl:
      process.env.BITGO_CUSTOM_DASH_NETWORK !== 'dash'
        ? 'https://testnet-insight.dashevo.org/insight-api'
        : 'https://insight.dash.org/insight-api',
    stellarFederationServerUrl:
      process.env.BITGO_CUSTOM_STELLAR_NETWORK !== 'stellar'
        ? `https://${process.env.BITGO_CUSTOM_ROOT_URI}/api/v2/txlm/federation`
        : `https://${process.env.BITGO_CUSTOM_ROOT_URI}/api/v2/xlm/federation`,
    serverXpub:
      process.env.BITGO_CUSTOM_BITCOIN_NETWORK !== 'bitcoin'
        ? hardcodedPublicKeys.serverXpub.test
        : hardcodedPublicKeys.serverXpub.prod,
  }),
};
