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
  avaxcNetworkBaseUrl: string;
  eth2ExplorerBaseUrl: string;
  ethwFullNodeRPCBaseUrl: string;
  polygonscanBaseUrl?: string;
  bscscanBaseUrl?: string;
  bscscanApiToken?: string;
  polygonscanApiToken?: string;
  apechainExplorerApiToken?: string;
  apechainExplorerBaseUrl?: string;
  arbiscanBaseUrl?: string;
  arbiscanApiToken?: string;
  oasExplorerApiToken?: string;
  oasExplorerBaseUrl?: string;
  optimisticEtherscanBaseUrl?: string;
  optimisticEtherscanApiToken?: string;
  zksyncExplorerBaseUrl?: string;
  zksyncExplorerApiToken?: string;
  beraExplorerBaseUrl?: string;
  beraExplorerApiToken?: string;
  baseethExplorerUrl?: string;
  baseethApiToken?: string;
  stellarFederationServerUrl?: string;
  eosNodeUrls: string[];
  nearNodeUrls: string[];
  solNodeUrl: string;
  solAlchemyNodeUrl: string;
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
  coreumNodeUrl: string;
  runeNodeUrl: string;
  babyNodeUrl: string;
  mantraNodeUrl: string;
  cronosNodeUrl: string;
  initiaNodeUrl: string;
  asiNodeUrl: string;
  islmNodeUrl: string;
  dotNodeUrls: string[];
  substrateNodeUrls: string[];
  polymeshNodeUrls: string[];
  tronNodes: {
    full: string;
    solidity: string;
  };
  hmacVerificationEnforced: boolean;
  tonNodeUrl: string;
  suiNodeUrl: string;
  etcNodeUrl: string;
  coredaoExplorerBaseUrl?: string;
  coredaoExplorerApiToken?: string;
  xdcExplorerBaseUrl?: string;
  xdcExplorerApiToken?: string;
  flrExplorerBaseUrl?: string;
  flrExplorerApiToken?: string;
  sgbExplorerBaseUrl?: string;
  sgbExplorerApiToken?: string;
  icpNodeUrl: string;
  wemixExplorerBaseUrl?: string;
  wemixExplorerApiToken?: string;
  monExplorerBaseUrl?: string;
  monExplorerApiToken?: string;
  worldExplorerBaseUrl?: string;
  worldExplorerApiToken?: string;
  somniaExplorerBaseUrl?: string;
  somniaExplorerApiToken?: string;
  soneiumExplorerBaseUrl?: string;
  soneiumExplorerApiToken?: string;
  stxNodeUrl: string;
  vetNodeUrl: string;
  // The key here is coinName and it will be same for both mainnet and testnet (eg: 'phrs')
  evm?: {
    [key: string]: {
      baseUrl: string;
      apiToken?: string;
      rpcUrl?: string;
      tokenId?: number;
      systemAddr?: string;
    };
  };
  // The key here is coinFamily and it will be same for both mainnet and testnet (eg: 'cronos')
  cosmos?: {
    [key: string]: {
      nodeUrl: string;
    };
  };
  xtzExplorerBaseUrl?: string;
  xtzRpcUrl?: string;
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
  | 'local'
  | 'localNonSecure'
  | 'mock'
  | 'adminProd'
  | 'adminTest'
  | 'adminStaging'
  | 'adminDev'
  | 'custom'
  | 'branch';

export type AliasEnvironmentName = 'production' | 'msProd' | 'msTest' | 'msDev';

export type Environments = { [k in EnvironmentName]: Environment };

// alias environments are environment names which are aliases of a supported environment
export const AliasEnvironments: { [k in AliasEnvironmentName]: EnvironmentName } = {
  production: 'prod',
  msProd: 'prod',
  msTest: 'test',
  msDev: 'dev',
};

const mainnetBase: EnvironmentTemplate = {
  network: 'bitcoin' as V1Network,
  signingAddress: '1BitGo3gxRZ6mQSEH52dvCKSUgVCAH4Rja',
  serverXpub: hardcodedPublicKeys.serverXpub.prod,
  hsmXpub: hardcodedPublicKeys.hsmXpub.prod,
  btcExplorerBaseUrl: 'https://blockstream.info/api',
  etherscanBaseUrl: 'https://api.etherscan.io/v2',
  etherscanApiToken: process.env.ETHERSCAN_API_TOKEN,
  avaxcNetworkBaseUrl: 'https://api.avax.network',
  eth2ExplorerBaseUrl: 'https://beaconscan.com/api',
  ethwFullNodeRPCBaseUrl: 'https://mainnet.ethereumpow.org',
  bscscanBaseUrl: 'https://api.etherscan.io/v2',
  bscscanApiToken: process.env.BSC_API_TOKEN,
  polygonscanBaseUrl: 'https://api.etherscan.io/v2',
  polygonscanApiToken: process.env.POLYGONSCAN_API_TOKEN,
  arbiscanBaseUrl: 'https://api.etherscan.io/v2',
  arbiscanApiToken: process.env.ARBISCAN_API_TOKEN,
  optimisticEtherscanBaseUrl: 'https://api.etherscan.io/v2',
  optimisticEtherscanApiToken: process.env.OPTIMISTIC_ETHERSCAN_API_TOKEN,
  zksyncExplorerBaseUrl: 'https://block-explorer-api.mainnet.zksync.io',
  zksyncExplorerApiToken: process.env.ZKSYNC_EXPLORER_API_TOKEN,
  baseethExplorerUrl: 'https://api.basescan.org', //BaseETH explorer api url
  baseethApiToken: process.env.BASESCAN_API_TOKEN,
  eosNodeUrls: ['https://bp.cryptolions.io', 'https://api.eosnewyork.io', 'https://api.eosdetroit.io'],
  nearNodeUrls: ['https://api.fastnear.com'],
  solNodeUrl: 'https://api.mainnet-beta.solana.com',
  solAlchemyNodeUrl: 'https://solana-mainnet.g.alchemy.com/v2',
  adaNodeUrl: 'https://api.koios.rest/api/v1',
  hashNodeUrl: 'https://api.provenance.io',
  injNodeUrl: 'https://sentry.lcd.injective.network', // reference https://docs.injective.network/develop/public-endpoints/
  atomNodeUrl: 'https://rest.cosmos.directory/cosmoshub/',
  osmoNodeUrl: 'https://lcd.osmosis.zone',
  tiaNodeUrl: 'https://public-celestia-lcd.numia.xyz', // reference https://docs.celestia.org/nodes/mainnet#api-endpoints
  seiNodeUrl: 'https://sei-api.polkachu.com',
  bldNodeUrl: 'https://agoric-api.polkachu.com',
  beraNodeUrl: '', // TODO(WIN-693): update url when mainnet goes live
  zetaNodeUrl: 'https://zetachain.blockpi.network', // reference https://www.zetachain.com/docs/reference/api/
  coreumNodeUrl: 'https://full-node.mainnet-1.coreum.dev:1317',
  runeNodeUrl: 'https://thornode.ninerealms.com',
  babyNodeUrl: 'https://babylon.nodes.guru/api/',
  islmNodeUrl: 'https://rest.cosmos.haqq.network',
  mantraNodeUrl: 'https://mantra-rest.publicnode.com/',
  cronosNodeUrl: 'https://cronos-pos-rest.publicnode.com/',
  initiaNodeUrl: 'https://rest.initia.xyz/',
  asiNodeUrl: 'https://rest-fetchhub.fetch.ai/',
  dotNodeUrls: ['wss://asset-hub-polkadot-rpc.n.dwellir.com'],
  substrateNodeUrls: ['wss://entrypoint-finney.opentensor.ai'],
  polymeshNodeUrls: ['wss://mainnet-rpc.polymesh.network'],
  tronNodes: {
    full: 'https://api.trongrid.io',
    solidity: 'https://api.trongrid.io',
  },
  hmacVerificationEnforced: true,
  tonNodeUrl: 'https://toncenter.com/api/v2/jsonRPC',
  suiNodeUrl: 'https://fullnode.mainnet.sui.io',
  etcNodeUrl: 'https://etc.blockscout.com',
  coredaoExplorerBaseUrl: 'https://openapi.coredao.org',
  oasExplorerBaseUrl: 'https://explorer.oasys.games',
  flrExplorerBaseUrl: 'https://flare-explorer.flare.network',
  xdcExplorerBaseUrl: 'https://api.etherscan.io/v2',
  wemixExplorerBaseUrl: 'https://api.etherscan.io/v2',
  sgbExplorerBaseUrl: 'https://songbird-explorer.flare.network',
  evm: {
    apechain: {
      baseUrl: 'https://api.etherscan.io/v2',
    },
    chiliz: {
      baseUrl: 'https://api.chiliscan.com',
    },
    phrs: {
      baseUrl: 'https://testnet.dplabs-internal.com', // TODO: WIN-5787 add mainnet url when its available
    },
    ctc: {
      baseUrl: 'https://creditcoin.blockscout.com',
    },
    hypeevm: {
      baseUrl: 'https://api.etherscan.io/v2',
      // These are used for Bridging assets on hype chain.
      tokenId: 150,
      systemAddr: '0x2222222222222222222222222222222222222222',
    },
    og: {
      baseUrl: 'https://chainscan.0g.ai/open',
    },
    xpl: {
      baseUrl: 'https://api.routescan.io/v2/network/mainnet/evm/9745/etherscan',
    },
    sonic: {
      baseUrl: 'https://api.etherscan.io/v2',
    },
    seievm: {
      baseUrl: 'https://api.etherscan.io/v2',
    },
    kaia: {
      baseUrl: 'https://mainnet-oapi.kaiascan.io',
    },
    kavaevm: {
      baseUrl: 'https://api.verify.mintscan.io/evm/api/0x8ae',
    },
    irys: {
      baseUrl: 'https://evm-explorer.irys.xyz/api',
    },
    mon: {
      baseUrl: 'https://api.etherscan.io/v2',
    },
    lineaeth: {
      baseUrl: 'https://api.etherscan.io/v2',
    },
    ip: {
      baseUrl: 'https://www.storyscan.io',
    },
    somi: {
      baseUrl: 'https://mainnet.somnia.w3us.site',
    },
    baseeth: {
      baseUrl: 'https://api.etherscan.io/v2',
    },
    opbnb: {
      baseUrl: 'https://api.etherscan.io/v2',
      apiToken: process.env.ETHERSCAN_API_TOKEN,
    },
    fantom: {
      baseUrl: 'https://explorer.fantom.network',
      rpcUrl: 'https://rpcapi.fantom.network/',
    },
    flow: {
      baseUrl: 'https://evm.flowscan.io',
    },
    plume: {
      baseUrl: 'https://explorer.plume.org',
    },
    megaeth: {
      baseUrl: 'https://mainnet.megaeth.com/rpc',
    },
    hbarevm: {
      baseUrl: 'https://mainnet.mirrornode.hedera.com/api/v1',
      rpcUrl: 'https://mainnet.hashio.io/api',
    },
    hemi: {
      baseUrl: 'https://explorer.hemi.xyz/api',
    },
    fluenteth: {
      baseUrl: 'https://testnet.fluentscan.xyz/api/', //TODO: COIN-6478: add mainnet url when available
    },
    mantle: {
      baseUrl: 'https://api.mantlescan.xyz/api',
    },
    jovayeth: {
      baseUrl: 'https://api.zan.top/node/v1/jovay/mainnet/',
    },
    okbxlayer: {
      baseUrl: 'https://www.oklink.com/api/v5/explorer/block/block-list?chainShortName=xlayer',
    },
    morph: {
      baseUrl: 'https://explorer-api-hoodi.morphl2.io', // TODO: WIN-8134 add mainnet url when available
    },
    morpheth: {
      baseUrl: 'https://explorer.morph.network/',
    },
    dogeos: {
      baseUrl: 'https://blockscout.testnet.dogeos.com', //TODO: WIN-8082 => add mainnet url when available
    },
    arcusdc: {
      baseUrl: 'https://testnet.arcscan.app/api/v2', // WIN-8039 => add mainnet url when available
    },
    xdc: {
      baseUrl: 'https://api.etherscan.io/v2',
    },
    zksyncera: {
      baseUrl: 'https://api.etherscan.io/v2',
    },
  },
  icpNodeUrl: 'https://ic0.app',
  worldExplorerBaseUrl: 'https://worldscan.org/',
  somniaExplorerBaseUrl: 'https://mainnet.somnia.w3us.site/',
  soneiumExplorerBaseUrl: 'https://soneium.blockscout.com',
  monExplorerBaseUrl: 'https://api.etherscan.io/v2',
  stxNodeUrl: 'https://api.hiro.so',
  vetNodeUrl: 'https://sync-mainnet.vechain.org',
  xtzExplorerBaseUrl: 'https://api.tzkt.io',
  xtzRpcUrl: 'https://rpc.tzkt.io/mainnet',
};

const testnetBase: EnvironmentTemplate = {
  network: 'testnet' as V1Network,
  signingAddress: 'msignBdFXteehDEgB6DNm7npRt7AcEZJP3',
  serverXpub: hardcodedPublicKeys.serverXpub.test,
  hsmXpub: hardcodedPublicKeys.hsmXpub.test,
  btcExplorerBaseUrl: 'https://blockstream.info/testnet/api',
  etherscanBaseUrl: 'https://api.etherscan.io/v2',
  etherscanApiToken: process.env.ETHERSCAN_API_TOKEN,
  avaxcNetworkBaseUrl: 'https://api.avax-test.network',
  eth2ExplorerBaseUrl: 'https://beaconscan.com/api',
  ethwFullNodeRPCBaseUrl: 'https://mainnet.ethereumpow.org',
  polygonscanBaseUrl: 'https://api.etherscan.io/v2',
  polygonscanApiToken: process.env.POLYGONSCAN_API_TOKEN,
  bscscanBaseUrl: 'https://api.etherscan.io/v2',
  bscscanApiToken: process.env.BSC_API_TOKEN,
  arbiscanBaseUrl: 'https://api.etherscan.io/v2',
  arbiscanApiToken: process.env.ARBISCAN_API_TOKEN,
  optimisticEtherscanBaseUrl: 'https://api.etherscan.io/v2',
  optimisticEtherscanApiToken: process.env.OPTIMISTIC_ETHERSCAN_API_TOKEN,
  zksyncExplorerBaseUrl: 'https://block-explorer-api.sepolia.zksync.dev',
  zksyncExplorerApiToken: process.env.ZKSYNC_EXPLORER_API_TOKEN,
  baseethExplorerUrl: 'https://api-sepolia.basescan.org',
  baseethApiToken: process.env.BASESCAN_API_TOKEN,
  // kylin eos endpoints found here
  // https://github.com/cryptokylin/CryptoKylin-Testnet#http-api-list
  // https://docs.liquidapps.io/liquidapps-documentation/eosio-guides/testnet-creation-guides/creating-cryptokylin-account#setup
  eosNodeUrls: ['https://kylin.eosn.io', 'https://api.kylin.alohaeos.com'],
  nearNodeUrls: ['https://test.rpc.fastnear.com'],
  solNodeUrl: 'https://api.devnet.solana.com',
  solAlchemyNodeUrl: 'https://solana-devnet.g.alchemy.com/v2',
  adaNodeUrl: 'https://preprod.koios.rest/api/v1',
  hashNodeUrl: 'https://api.test.provenance.io',
  injNodeUrl: 'https://testnet.sentry.lcd.injective.network', // COIN-1219 : reference  https://docs.injective.network/develop/public-endpoints/#testnet
  atomNodeUrl: 'https://rest.provider-sentry-02.ics-testnet.polypore.xyz/',
  osmoNodeUrl: 'https://lcd.osmotest5.osmosis.zone',
  tiaNodeUrl: 'https://api-mocha.pops.one',
  seiNodeUrl: 'https://rest.atlantic-2.seinetwork.io',
  bldNodeUrl: 'https://devnet.api.agoric.net',
  beraNodeUrl: '', // TODO(WIN-693): update url when testnet goes live
  zetaNodeUrl: 'https://rest.nodejumper.io/zetachaintestnet', // reference : https://www.zetachain.com/docs/reference/api/
  coreumNodeUrl: 'https://full-node.testnet-1.coreum.dev:1317',
  runeNodeUrl: 'https://stagenet-thornode.ninerealms.com',
  babyNodeUrl: 'https://babylon-testnet-api.nodes.guru/',
  islmNodeUrl: 'https://rest.cosmos.testedge2.haqq.network ',
  mantraNodeUrl: 'https://mantra-testnet-rest.publicnode.com/',
  cronosNodeUrl: 'https://testnet-croeseid-4.crypto.org:1317/',
  initiaNodeUrl: 'https://rest.testnet.initia.xyz/',
  asiNodeUrl: 'https://rest-dorado.fetch.ai/',
  dotNodeUrls: ['wss://asset-hub-westend-rpc.n.dwellir.com'],
  substrateNodeUrls: ['wss://test.finney.opentensor.ai'],
  polymeshNodeUrls: ['wss://testnet-rpc.polymesh.live'],
  tronNodes: {
    full: 'https://api.shasta.trongrid.io',
    solidity: 'https://api.shasta.trongrid.io',
  },
  hmacVerificationEnforced: false,
  tonNodeUrl: 'https://testnet.toncenter.com/api/v2/jsonRPC',
  suiNodeUrl: 'https://fullnode.testnet.sui.io',
  etcNodeUrl: 'https://etc-mordor.blockscout.com',
  coredaoExplorerBaseUrl: 'https://api.test2.btcs.network',
  oasExplorerBaseUrl: 'https://explorer.testnet.oasys.games',
  wemixExplorerBaseUrl: 'https://api.etherscan.io/v2',
  flrExplorerBaseUrl: 'https://coston2-explorer.flare.network',
  xdcExplorerBaseUrl: 'https://api.etherscan.io/v2',
  sgbExplorerBaseUrl: 'https://coston-explorer.flare.network',
  icpNodeUrl: 'https://ic0.app',
  monExplorerBaseUrl: 'https://api.etherscan.io/v2',
  worldExplorerBaseUrl: 'https://sepolia.worldscan.org/',
  somniaExplorerBaseUrl: 'https://shannon-explorer.somnia.network/',
  soneiumExplorerBaseUrl: 'https://soneium-minato.blockscout.com',
  evm: {
    apechain: {
      baseUrl: 'https://api.etherscan.io/v2',
    },
    chiliz: {
      baseUrl: 'https://api.testnet.chiliscan.com',
    },
    phrs: {
      baseUrl: 'https://testnet.dplabs-internal.com', // Wrong value, Not available yet
    },
    ctc: {
      baseUrl: 'https://creditcoin-testnet.blockscout.com',
    },
    hypeevm: {
      baseUrl: 'https://rpc.hyperliquid-testnet.xyz/evm', // Not Available
      // These are used for Bridging assets on hype chain.
      tokenId: 1105,
      systemAddr: '0x2222222222222222222222222222222222222222',
    },
    og: {
      baseUrl: 'https://chainscan-test.0g.ai/open',
    },
    xpl: {
      baseUrl: 'https://api.routescan.io/v2/network/testnet/evm/9746_5/etherscan',
    },
    sonic: {
      baseUrl: 'https://api.etherscan.io/v2',
    },
    seievm: {
      baseUrl: 'https://api.etherscan.io/v2',
    },
    kaia: {
      baseUrl: 'https://kairos-oapi.kaiascan.io',
    },
    kavaevm: {
      baseUrl: 'https://api.verify.mintscan.io/evm/api/0x8ad',
    },
    irys: {
      baseUrl: 'https://inst-1.cloud.blockscout.com/api',
    },
    mon: {
      baseUrl: 'https://api.etherscan.io/v2',
    },
    lineaeth: {
      baseUrl: 'https://api.etherscan.io/v2',
    },
    ip: {
      baseUrl: 'https://aeneid.storyscan.io',
    },
    tbaseeth: {
      baseUrl: 'https://api.etherscan.io/v2',
    },
    topbnb: {
      baseUrl: 'https://api.etherscan.io/v2',
      apiToken: process.env.ETHERSCAN_API_TOKEN,
    },
    flow: {
      baseUrl: 'https://evm-testnet.flowscan.io',
    },
    megaeth: {
      baseUrl: 'https://carrot.megaeth.com/rpc',
    },
    plume: {
      baseUrl: 'https://testnet-explorer.plume.org',
    },
    hbarevm: {
      baseUrl: 'https://testnet.mirrornode.hedera.com/api/v1',
      rpcUrl: 'https://testnet.hashio.io/api',
    },
    hemi: {
      baseUrl: 'https://testnet.explorer.hemi.xyz/api',
    },
    fluenteth: {
      baseUrl: 'https://testnet.fluentscan.xyz/api/',
    },
    mantle: {
      baseUrl: 'https://api-sepolia.mantlescan.xyz/api',
    },
    jovayeth: {
      baseUrl: 'https://api.zan.top/node/v1/jovay/testnet/',
    },
    okbxlayer: {
      baseUrl: 'https://www.oklink.com/api/v5/explorer/block/block-list?chainShortName=xlayer_testnet',
    },
    morph: {
      baseUrl: 'https://explorer-api-hoodi.morphl2.io',
    },
    morpheth: {
      baseUrl: 'https://explorer-hoodi.morph.network/',
    },
    dogeos: {
      baseUrl: 'https://blockscout.testnet.dogeos.com',
    },
    arcusdc: {
      baseUrl: 'https://testnet.arcscan.app/api/v2',
    },
    xdc: {
      baseUrl: 'https://api.etherscan.io/v2',
    },
    zksyncera: {
      baseUrl: 'https://api.etherscan.io/v2',
    },
  },
  stxNodeUrl: 'https://api.testnet.hiro.so',
  vetNodeUrl: 'https://sync-testnet.vechain.org',
  xtzExplorerBaseUrl: 'https://api.ghostnet.tzkt.io',
  xtzRpcUrl: 'https://rpc.tzkt.io/ghostnet',
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
    etherscanBaseUrl: 'https://api-hoodi.etherscan.fakeurl',
    etherscanApiToken: process.env.ETHERSCAN_API_TOKEN,
    avaxcNetworkBaseUrl: 'https://api.avax-test.network.fakeurl',
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
  adminStaging: Object.assign({}, testnetBase, {
    uri: 'https://admin.bitgo-staging.com',
    stellarFederationServerUrl: 'https://admin.bitgo-staging.com/api/v2/xlm/federation',
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
        ? 'https://api-hoodi.etherscan.io'
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
