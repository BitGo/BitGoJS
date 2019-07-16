/**
 * @prettier
 */
import * as bitcoin from 'bitgo-utxo-lib';
import { V1Network, V1RmgNetwork } from './types';

interface EnvironmentTemplate {
  uri?: string;
  networks: {
    btc?: any;
    tbtc?: any;
  };
  network: V1Network;
  rmgNetwork: V1RmgNetwork;
  signingAddress: string;
  serverXpub: string;
  hsmXpub: string;
  smartBitApiBaseUrl: string;
  bchExplorerBaseUrl: string;
  btgExplorerBaseUrl?: string;
  etherscanBaseUrl: string;
  ltcExplorerBaseUrl: string;
  zecExplorerBaseUrl: string;
  dashExplorerBaseUrl: string;
  stellarFederationServerUrl?: string;
}

export interface Environment extends EnvironmentTemplate {
  uri: string;
  stellarFederationServerUrl: string;
}

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
  | 'custom';

export type Environments = { [k in EnvironmentName]: Environment };

const mainnetBase: EnvironmentTemplate = {
  networks: {
    btc: bitcoin.networks.bitcoin,
  },
  network: 'bitcoin' as V1Network,
  rmgNetwork: 'rmg' as V1RmgNetwork,
  signingAddress: '1BitGo3gxRZ6mQSEH52dvCKSUgVCAH4Rja',
  serverXpub:
    'xpub661MyMwAqRbcEtUgu9HF8ai4ipuVKKHBzUqks4jSFypW8dwwQL1zygLgQx99NmC7zJJznSiwKG6RQfVjAKMtCsx8VjR6kQW8x7HrkXFZdnQ',
  hsmXpub:
    'xpub661MyMwAqRbcGEtTFgMAoxMFoqsRdDaiaR63byNfZdV7cBZFvovQSNJ5bpyeoQtuKVgXBk6sFQ7TtvyWqadt41DnKwveYgM5KoU2EKYjdY2',
  smartBitApiBaseUrl: 'https://api.smartbit.com.au/v1',
  bchExplorerBaseUrl: 'https://blockdozer.com/insight-api',
  btgExplorerBaseUrl: 'https://btgexplorer.com/api',
  etherscanBaseUrl: 'https://api.etherscan.io',
  ltcExplorerBaseUrl: 'https://insight.litecore.io/api',
  zecExplorerBaseUrl: 'https://zcashnetwork.info/api',
  dashExplorerBaseUrl: 'https://insight.dash.org/insight-api',
};

const testnetBase: EnvironmentTemplate = {
  networks: {
    tbtc: bitcoin.networks.testnet,
  },
  network: 'testnet' as V1Network,
  rmgNetwork: 'rmgTest' as V1RmgNetwork,
  signingAddress: 'msignBdFXteehDEgB6DNm7npRt7AcEZJP3',
  serverXpub:
    'xpub661MyMwAqRbcErFqVXGiUFv9YeoPbhN72UiNCUdj9nj3T6M8h7iKNmbCYpMVWVZP7LA2ma3HWcPngz1gRTm4FPdtm9mHfrNvU93MCoszsGL',
  hsmXpub:
    'xpub661MyMwAqRbcGFKe4Bqvk4Sgric4gNFC8pUbw4tUkVjZxubjCA522gPzc1YaXb3bQVmDWc7CjG8AGNWRpcdAU38RETBh8n2bnqEU4kbV4oK',
  smartBitApiBaseUrl: 'https://testnet-api.smartbit.com.au/v1',
  bchExplorerBaseUrl: 'https://test-bch-insight.bitpay.com/api',
  etherscanBaseUrl: 'https://kovan.etherscan.io',
  ltcExplorerBaseUrl: 'http://explorer.litecointools.com/api',
  zecExplorerBaseUrl: 'https://explorer.testnet.z.cash/api',
  dashExplorerBaseUrl: 'https://testnet-insight.dashevo.org/insight-api',
};

const devBase: EnvironmentTemplate = Object.assign(
  {
    hsmXpub:
      'xpub661MyMwAqRbcFWzoz8qnYRDYEFQpPLYwxVFoG6WLy3ck5ZupRGJTG4ju6yGb7Dj3ey6GsC4kstLRER2nKzgjLtmxyPgC4zHy7kVhUt6yfGn',
  },
  testnetBase
);

export const Environments: Environments = {
  prod: Object.assign(
    {
      uri: 'https://www.bitgo.com',
      stellarFederationServerUrl: 'https://www.bitgo.com/api/v2/xlm/federation',
    },
    mainnetBase
  ),
  rmgProd: Object.assign(
    {
      uri: 'https://rmg.bitgo.com',
      stellarFederationServerUrl: 'https://rmg.bitgo.com/api/v2/xlm/federation',
    },
    mainnetBase
  ),
  staging: Object.assign(
    {
      uri: 'https://staging.bitgo.com',
      stellarFederationServerUrl: 'https://staging.bitgo.com/api/v2/xlm/federation',
    },
    mainnetBase
  ),
  rmgStaging: Object.assign(
    {
      uri: 'https://rmgstaging.bitgo.com',
      stellarFederationServerUrl: 'https://rmgstaging.bitgo.com/api/v2/xlm/federation',
    },
    mainnetBase
  ),
  test: Object.assign(
    {
      uri: 'https://test.bitgo.com',
      stellarFederationServerUrl: 'https://test.bitgo.com/api/v2/txlm/federation',
    },
    testnetBase
  ),
  rmgTest: Object.assign(
    {
      uri: 'https://rmgtest.bitgo.com',
      stellarFederationServerUrl: 'https://rmgtest.bitgo.com/api/v2/txlm/federation',
    },
    testnetBase
  ),
  dev: Object.assign(
    {
      uri: 'https://webdev.bitgo.com',
      stellarFederationServerUrl: 'https://webdev.bitgo.com/api/v2/txlm/federation',
    },
    devBase
  ),
  latest: Object.assign(
    {
      uri: 'https://latest.bitgo.com',
      stellarFederationServerUrl: 'https://latest.bitgo.com/api/v2/txlm/federation',
    },
    devBase
  ),
  rmgLatest: Object.assign(
    {
      uri: 'https://rmglatest.bitgo.com',
      stellarFederationServerUrl: 'https://rmglatest.bitgo.com/api/v2/txlm/federation',
    },
    devBase
  ),
  rmgDev: Object.assign(
    {
      uri: 'https://rmgwebdev.bitgo.com',
      stellarFederationServerUrl: 'https://rmgwebdev.bitgo.com/api/v2/txlm/federation',
    },
    devBase
  ),
  local: Object.assign(
    {
      uri: 'https://localhost:3000',
      stellarFederationServerUrl: 'https://localhost:3000/api/v2/txlm/federation',
    },
    devBase
  ),
  localNonSecure: Object.assign(
    {
      uri: 'http://localhost:3000',
      stellarFederationServerUrl: 'http://localhost:3000/api/v2/txlm/federation',
    },
    devBase
  ),
  mock: Object.assign(
    {
      uri: 'https://bitgo.fakeurl',
      smartBitApiBaseUrl: 'https://testnet-api.smartbit.fakeurl/v1',
      bchExplorerBaseUrl: 'https://test-bch-insight.bitpay.fakeurl/api',
      stellarFederationServerUrl: 'https://bitgo.fakeurl/api/v2/txlm/federation',
      etherscanBaseUrl: 'https://kovan.etherscan.fakeurl',
      ltcExplorerBaseUrl: 'http://explorer.litecointools.fakeurl/api',
      zecExplorerBaseUrl: 'https://explorer.testnet.z.fakeurl/api',
      dashExplorerBaseUrl: 'https://testnet-insight.dashevo.fakeurl/insight-api',
    },
    devBase
  ),
  rmgLocal: Object.assign(
    {
      uri: 'https://rmglocalhost:3000',
      stellarFederationServerUrl: 'https://rmglocalhost:3000/api/v2/txlm/federation',
    },
    devBase
  ),
  rmglocalNonSecure: Object.assign(
    {
      uri: 'http://rmglocalhost:3000',
      stellarFederationServerUrl: 'http://rmglocalhost:3000/api/v2/txlm/federation',
    },
    devBase
  ),
  custom: Object.assign(
    {
      uri: process.env.BITGO_CUSTOM_ROOT_URI,
      networks: {
        btc: bitcoin.networks.bitcoin,
        tbtc: bitcoin.networks.testnet,
      },
      network: process.env.BITGO_CUSTOM_BITCOIN_NETWORK as V1Network,
      rmgNetwork: process.env.BITGO_CUSTOM_RMG_NETWORK as V1RmgNetwork,
      hsmXpub:
        'xpub661MyMwAqRbcFWzoz8qnYRDYEFQpPLYwxVFoG6WLy3ck5ZupRGJTG4ju6yGb7Dj3ey6GsC4kstLRER2nKzgjLtmxyPgC4zHy7kVhUt6yfGn',
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
    },
    mainnetBase
  ),
};
