/**
 * @prettier
 */
import { V1Network } from './types';

interface EnvironmentTemplate {
  uri?: string;
  network: V1Network;
  signingAddress: string;
  serverXpub: string;
  hsmXpub: string;
  btcExplorerBaseUrl: string;
  etherscanBaseUrl: string;
  etherscanApiToken?: string;
  snowtraceBaseUrl: string;
  snowtraceApiToken?: string;
  eth2ExplorerBaseUrl: string;
  ethwFullNodeRPCBaseUrl: string;
  polygonscanBaseUrl?: string;
  polygonscanApiToken?: string;
  stellarFederationServerUrl?: string;
  eosNodeUrls: string[];
  nearNodeUrls: string[];
  solNodeUrl: string;
  adaNodeUrl: string;
  hashNodeUrl: string;
  injNodeUrl: string;
  atomNodeUrl: string;
  osmoNodeUrl: string;
  tiaNodeUrl: string;
  seiNodeUrl: string;
  bldNodeUrl: string;
  beraNodeUrl: string;
  zetaNodeUrl: string;
  coreNodeUrl: string;
  islmNodeUrl: string;
  dotNodeUrls: string[];
  tronNodes: {
    full: string;
    solidity: string;
  };
  hmacVerificationEnforced: boolean;
}

export interface Environment extends EnvironmentTemplate {
  uri: string;
  stellarFederationServerUrl: string;
}

export const hardcodedPublicKeys = Object.freeze({
  serverXpub: {
    prod: 'xpub661MyMwAqRbcEtUgu9HF8ai4ipuVKKHBzUqks4jSFypW8dwwQL1zygLgQx99NmC7zJJznSiwKG6RQfVjAKMtCsx8VjR6kQW8x7HrkXFZdnQ',
    test: 'xpub661MyMwAqRbcErFqVXGiUFv9YeoPbhN72UiNCUdj9nj3T6M8h7iKNmbCYpMVWVZP7LA2ma3HWcPngz1gRTm4FPdtm9mHfrNvU93MCoszsGL',
  },
  hsmXpub: {
    prod: 'xpub661MyMwAqRbcGEtTFgMAoxMFoqsRdDaiaR63byNfZdV7cBZFvovQSNJ5bpyeoQtuKVgXBk6sFQ7TtvyWqadt41DnKwveYgM5KoU2EKYjdY2',
    test: 'xpub661MyMwAqRbcGFKe4Bqvk4Sgric4gNFC8pUbw4tUkVjZxubjCA522gPzc1YaXb3bQVmDWc7CjG8AGNWRpcdAU38RETBh8n2bnqEU4kbV4oK',
    dev: 'xpub661MyMwAqRbcFWzoz8qnYRDYEFQpPLYwxVFoG6WLy3ck5ZupRGJTG4ju6yGb7Dj3ey6GsC4kstLRER2nKzgjLtmxyPgC4zHy7kVhUt6yfGn',
  },
});

export type EnvironmentName =
  | 'prod'
  | 'staging'
  | 'test'
  | 'dev'
  | 'latest'
  | 'local'
  | 'localNonSecure'
  | 'mock'
  | 'adminProd'
  | 'adminTest'
  | 'adminDev'
  | 'adminLatest'
  | 'custom'
  | 'branch';

export type AliasEnvironmentName = 'production' | 'msProd' | 'msTest' | 'msDev' | 'msLatest';

export type Environments = { [k in EnvironmentName]: Environment };

// alias environments are environment names which are aliases of a supported environment
export const AliasEnvironments: { [k in AliasEnvironmentName]: EnvironmentName } = {
  production: 'prod',
  msProd: 'prod',
  msTest: 'test',
  msDev: 'dev',
  msLatest: 'latest',
};

const mainnetBase: EnvironmentTemplate = {
  network: 'bitcoin' as V1Network,
  signingAddress: '1BitGo3gxRZ6mQSEH52dvCKSUgVCAH4Rja',
  serverXpub: hardcodedPublicKeys.serverXpub.prod,
  hsmXpub: hardcodedPublicKeys.hsmXpub.prod,
  btcExplorerBaseUrl: 'https://blockstream.info/api',
  etherscanBaseUrl: 'https://api.etherscan.io',
  etherscanApiToken: process.env.ETHERSCAN_API_TOKEN,
  snowtraceBaseUrl: 'https://api.snowtrace.io',
  snowtraceApiToken: process.env.SNOWTRACE_API_TOKEN,
  eth2ExplorerBaseUrl: 'https://beaconscan.com/api',
  ethwFullNodeRPCBaseUrl: 'https://mainnet.ethereumpow.org',
  polygonscanBaseUrl: 'https://api.polygonscan.com',
  polygonscanApiToken: process.env.POLYGONSCAN_API_TOKEN,
  eosNodeUrls: ['https://bp.cryptolions.io', 'https://api.eosnewyork.io', 'https://api.eosdetroit.io'],
  nearNodeUrls: ['https://rpc.mainnet.near.org'],
  solNodeUrl: 'https://api.mainnet-beta.solana.com',
  adaNodeUrl: 'https://api.koios.rest/api/v0',
  hashNodeUrl: 'https://api.provenance.io',
  injNodeUrl: 'https://k8s.global.mainnet.lcd.injective.network',
  atomNodeUrl: 'https://rest.cosmos.directory/cosmoshub/',
  osmoNodeUrl: 'https://lcd.osmosis.zone',
  tiaNodeUrl: 'https://api-mocha.pops.one', //  TODO(BG-78997): Celestia is still only in testnet update to mainnet url when it's live
  seiNodeUrl: 'https://rest.atlantic-2.seinetwork.io', //  TODO(BG-78997): Sei is still only in testnet update to mainnet url when it's live
  bldNodeUrl: 'https://agoric-api.polkachu.com',
  beraNodeUrl: '', // TODO(WIN-693): update url when mainnet goes live
  zetaNodeUrl: 'https://zetachain-athens.blockpi.network/lcd/v1/public', // TODO(WIN-142): update to mainnet url when it's live
  coreNodeUrl: 'https://full-node.mainnet-1.coreum.dev:26657',
  islmNodeUrl: 'https://rest.cosmos.haqq.network',
  dotNodeUrls: ['wss://rpc.polkadot.io'],
  tronNodes: {
    full: 'https://api.trongrid.io',
    solidity: 'https://api.trongrid.io',
  },
  hmacVerificationEnforced: true,
};

const testnetBase: EnvironmentTemplate = {
  network: 'testnet' as V1Network,
  signingAddress: 'msignBdFXteehDEgB6DNm7npRt7AcEZJP3',
  serverXpub: hardcodedPublicKeys.serverXpub.test,
  hsmXpub: hardcodedPublicKeys.hsmXpub.test,
  btcExplorerBaseUrl: 'https://blockstream.info/testnet/api',
  etherscanBaseUrl: 'https://api-goerli.etherscan.io',
  etherscanApiToken: process.env.ETHERSCAN_API_TOKEN,
  snowtraceBaseUrl: 'https://api-testnet.snowtrace.io',
  snowtraceApiToken: process.env.SNOWTRACE_API_TOKEN,
  eth2ExplorerBaseUrl: 'https://beaconscan.com/api',
  ethwFullNodeRPCBaseUrl: 'https://mainnet.ethereumpow.org',
  polygonscanBaseUrl: 'https://api-testnet.polygonscan.com',
  polygonscanApiToken: process.env.POLYGONSCAN_API_TOKEN,
  // kylin eos endpoints found here
  // https://github.com/cryptokylin/CryptoKylin-Testnet#http-api-list
  // https://docs.liquidapps.io/liquidapps-documentation/eosio-guides/testnet-creation-guides/creating-cryptokylin-account#setup
  eosNodeUrls: ['https://kylin.eosn.io', 'https://api.kylin.alohaeos.com'],
  nearNodeUrls: ['https://rpc.testnet.near.org'],
  solNodeUrl: 'https://api.devnet.solana.com',
  adaNodeUrl: 'https://preprod.koios.rest/api/v0',
  hashNodeUrl: 'https://api.test.provenance.io',
  injNodeUrl: 'https://k8s.testnet.lcd.injective.network',
  atomNodeUrl: 'https://rest.sentry-02.theta-testnet.polypore.xyz/',
  osmoNodeUrl: 'https://lcd.osmotest5.osmosis.zone',
  tiaNodeUrl: 'https://api-mocha.pops.one',
  seiNodeUrl: 'https://rest.atlantic-2.seinetwork.io',
  bldNodeUrl: 'https://devnet.api.agoric.net',
  beraNodeUrl: '', // TODO(WIN-693): update url when testnet goes live
  zetaNodeUrl: 'https://rpc.ankr.com/http/zetachain_athens_testnet',
  coreNodeUrl: 'https://full-node.testnet-1.coreum.dev:26657',
  islmNodeUrl: 'https://rest.cosmos.testedge2.haqq.network ',
  dotNodeUrls: ['wss://westend-rpc.polkadot.io'],
  tronNodes: {
    full: 'https://api.shasta.trongrid.io',
    solidity: 'https://api.shasta.trongrid.io',
  },
  hmacVerificationEnforced: false,
};

const devBase: EnvironmentTemplate = Object.assign({}, testnetBase, {
  hsmXpub: hardcodedPublicKeys.hsmXpub.dev,
  hmacVerificationEnforced: false,
});

// eslint-disable-next-line no-redeclare
export const Environments: Environments = {
  prod: Object.assign({}, mainnetBase, {
    uri: 'https://app.bitgo.com',
    stellarFederationServerUrl: 'https://app.bitgo.com/api/v2/xlm/federation',
  }),
  test: Object.assign({}, testnetBase, {
    uri: 'https://app.bitgo-test.com',
    stellarFederationServerUrl: 'https://app.bitgo-test.com/api/v2/txlm/federation',
  }),
  dev: Object.assign({}, devBase, {
    uri: 'https://app.bitgo-dev.com',
    stellarFederationServerUrl: 'https://app.bitgo-dev.com/api/v2/txlm/federation',
  }),
  latest: Object.assign({}, devBase, {
    uri: 'https://app.bitgo-latest.com',
    stellarFederationServerUrl: 'https://app.bitgo-latest.com/api/v2/xlm/federation',
  }),
  staging: Object.assign({}, testnetBase, {
    uri: 'https://app.bitgo-staging.com',
    stellarFederationServerUrl: 'https://app.bitgo-staging.com/api/v2/txlm/federation',
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
    stellarFederationServerUrl: 'https://bitgo.fakeurl/api/v2/txlm/federation',
    etherscanBaseUrl: 'https://api-goerli.etherscan.fakeurl',
    etherscanApiToken: process.env.ETHERSCAN_API_TOKEN,
    snowtraceApiToken: process.env.SNOWTRACE_API_TOKEN,
    snowtraceBaseUrl: 'https://api-testnet.snowtrace.fakeurl',
    eth2ExplorerBaseUrl: 'https://beaconscan.com/api',
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
    network: process.env.BITGO_CUSTOM_BITCOIN_NETWORK as V1Network,
    hsmXpub:
      process.env.NODE_ENV === 'production' ? hardcodedPublicKeys.hsmXpub.prod : hardcodedPublicKeys.hsmXpub.test,
    btcExplorerBaseUrl:
      process.env.BITGO_CUSTOM_BITCOIN_NETWORK !== 'bitcoin'
        ? 'https://blockstream.info/testnet/api'
        : 'https://blockstream.info/api',
    etherscanBaseUrl:
      process.env.BITGO_CUSTOM_ETHEREUM_NETWORK !== 'ethereum'
        ? 'https://api-goerli.etherscan.io'
        : 'https://api.etherscan.io',
    stellarFederationServerUrl:
      process.env.BITGO_CUSTOM_STELLAR_NETWORK !== 'stellar'
        ? `https://${process.env.BITGO_CUSTOM_ROOT_URI}/api/v2/txlm/federation`
        : `https://${process.env.BITGO_CUSTOM_ROOT_URI}/api/v2/xlm/federation`,
    serverXpub:
      process.env.BITGO_CUSTOM_BITCOIN_NETWORK !== 'bitcoin'
        ? hardcodedPublicKeys.serverXpub.test
        : hardcodedPublicKeys.serverXpub.prod,
  }),
  branch: Object.assign({}, devBase, {
    uri: 'https://app.bitgo-dev.com',
    stellarFederationServerUrl: 'https://app.bitgo-dev.com/api/v2/txlm/federation',
  }),
};
