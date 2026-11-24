import { erc7984, terc7984 } from '../account';
import { UnderlyingAsset } from '../base';

/**
 * ERC-7984 confidential tokens (Zama fhEVM).
 *
 * These tokens use fully homomorphic encryption (FHE) for on-chain confidential transfers.
 * Balances are stored as encrypted ciphertexts; plaintext amounts require ACL-delegated
 * decryption via the Zama Gateway before they can be displayed.
 *
 * Wrapper↔underlying metadata (`underlyingErc20Address`, `rate`, `requiresApprovalReset`)
 * is wired for every registered shield pair (Hoodi test pairs and all mainnet pairs;
 * mainnet values verified on-chain, CHALO-2007). Allowlisting is owned by AMS.
 *
 * Testnet tokens (hteth:*) are deployed on Hoodi using Zama's cleartext FHE stack.
 *   Hoodi ACL: 0x6D3FAf6f86e1fF9F3B0831Dda920AbA1cBd5bd68  (Networks.test.hoodi.zamaAclContractAddress)
 *   Hoodi RPC: https://rpc.hoodi.ethpandaops.io  (chain ID 560048)
 */
export const erc7984Tokens = [
  // Mainnet tokens
  erc7984(
    'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    'eth:czama',
    'Confidential Zama',
    6,
    '0x80cb147fd86dc6dee3eee7e4cee33d1397d98071', // https://etherscan.io/token/0x80CB147Fd86dC6dEe3Eee7e4Cee33d1397d98071
    UnderlyingAsset['eth:czama'],
    undefined, // features: default ERC7984_TOKEN_FEATURES
    undefined, // prefix
    undefined, // suffix
    undefined, // network: Ethereum mainnet
    undefined, // primaryKeyCurve: secp256k1
    '0xa12cc123ba206d4031d1c7f6223d1c2ec249f4f3', // underlying()=ZAMA 18dp
    '1000000000000', // rate() on-chain: 18dp → 6dp
    false // standard ERC-20 approve
  ),
  erc7984(
    'c9d5d51b-15b7-4d93-b079-9af313160e66',
    'eth:cxaut',
    'Zama Confidential XAUT',
    6,
    '0x73cc9af9d6befdb3c3faf8a5e8c05cb95fdaeef1', // https://etherscan.io/token/0x73cc9aF9d6BEFdb3c3fAf8a5E8c05Cb95FdaEEf1
    UnderlyingAsset['eth:cxaut'],
    undefined, // features: default ERC7984_TOKEN_FEATURES
    undefined, // prefix
    undefined, // suffix
    undefined, // network: Ethereum mainnet
    undefined, // primaryKeyCurve: secp256k1
    '0x68749665ff8d2d112fa859aa293f07a622782f38', // underlying()=XAUt (Tether Gold) 6dp
    '1', // rate() on-chain
    false // standard ERC-20 approve
  ),
  erc7984(
    '0d1b01c8-ee4a-4ca4-a1af-2ab3132d91ee',
    'eth:ctgbp',
    'Zama Confidential TGBP',
    6,
    '0xa873750ccbafd5ec7dd13bfd5237d7129832edd9', // https://etherscan.io/token/0xa873750ccBafD5ec7Dd13bfD5237d7129832eDD9
    UnderlyingAsset['eth:ctgbp'],
    undefined, // features: default ERC7984_TOKEN_FEATURES
    undefined, // prefix
    undefined, // suffix
    undefined, // network: Ethereum mainnet
    undefined, // primaryKeyCurve: secp256k1
    '0x27f6c8289550fce67f6b50bed1f519966afe5287', // underlying()=tGBP 18dp
    '1000000000000', // rate() on-chain: 18dp → 6dp
    false // standard ERC-20 approve
  ),
  erc7984(
    '2fbf960e-9747-4d38-b93b-28029e78b5d4',
    'eth:cweth',
    'Zama Confidential WETH',
    6,
    '0xda9396b82634ea99243ce51258b6a5ae512d4893', // https://etherscan.io/token/0xda9396b82634Ea99243cE51258B6A5Ae512D4893
    UnderlyingAsset['eth:cweth'],
    undefined, // features: default ERC7984_TOKEN_FEATURES
    undefined, // prefix
    undefined, // suffix
    undefined, // network: Ethereum mainnet
    undefined, // primaryKeyCurve: secp256k1
    '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', // underlying()=WETH 18dp
    '1000000000000', // rate() on-chain: 18dp → 6dp
    false // standard ERC-20 approve
  ),
  erc7984(
    'f47ac10b-58cc-4372-a567-0e02b2c3d480',
    'eth:cusdt',
    'Zama USDT',
    6,
    '0xae0207c757aa2b4019ad96edd0092ddc63ef0c50', // https://etherscan.io/token/0xAe0207C757Aa2B4019Ad96edD0092ddc63EF0c50
    UnderlyingAsset['eth:cusdt'],
    undefined, // features: default ERC7984_TOKEN_FEATURES
    undefined, // prefix
    undefined, // suffix
    undefined, // network: Ethereum mainnet
    undefined, // primaryKeyCurve: secp256k1
    '0xdac17f958d2ee523a2206206994597c13d831ec7', // underlying()=USDT 6dp
    '1', // rate() on-chain
    true // USDT-style approve(0) reset required
  ),
  erc7984(
    'fb41ba70-858c-48e6-a513-9da1ea030853',
    'eth:cusdc',
    'Zama USDC',
    6,
    '0xe978f22157048e5db8e5d07971376e86671672b2', // https://etherscan.io/token/0xe978f22157048e5db8e5d07971376e86671672b2
    UnderlyingAsset['eth:cusdc'],
    undefined, // features: default ERC7984_TOKEN_FEATURES
    undefined, // prefix
    undefined, // suffix
    undefined, // network: Ethereum mainnet
    undefined, // primaryKeyCurve: secp256k1
    '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // underlying()=USDC 6dp
    '1', // rate() on-chain
    false // standard ERC-20 approve
  ),
  // CHALO-2158: remaining mainnet ERC-7984 pairs (addresses + rate() verified on-chain)
  erc7984(
    'b567307d-6c4a-4efc-b7f6-aaa1a530e528',
    'eth:csteakcusdc',
    'Confidential steakcUSDC',
    6,
    '0x66bf74e96900d1a19c7070d939d124f2f565c458', // https://etherscan.io/token/0x66Bf74E96900D1a19c7070D939D124f2F565C458
    UnderlyingAsset['eth:csteakcusdc'],
    undefined, // features: default ERC7984_TOKEN_FEATURES
    undefined, // prefix
    undefined, // suffix
    undefined, // network: Ethereum mainnet
    undefined, // primaryKeyCurve: secp256k1
    '0xbeef00a59b577423653a1526c7009bde103f542b', // underlying()=steakcUSDC 18dp
    '1000000000000', // rate() on-chain: 18dp → 6dp
    false // standard ERC-20 approve
  ),
  erc7984(
    'b0e8ffe3-324f-4d21-85b6-4f7b68baccb0',
    'eth:causd',
    'Confidential AUSD',
    6,
    '0xea9a15a29dd180c40442142caeefc491d37bfdb2', // https://etherscan.io/token/0xEa9A15A29DD180c40442142CaeEfC491d37bfDB2
    UnderlyingAsset['eth:causd'],
    undefined, // features: default ERC7984_TOKEN_FEATURES
    undefined, // prefix
    undefined, // suffix
    undefined, // network: Ethereum mainnet
    undefined, // primaryKeyCurve: secp256k1
    '0x00000000efe302beaa2b3e6e1b18d08d69a9012a', // underlying()=AUSD 6dp
    '1', // rate() on-chain
    false // standard ERC-20 approve
  ),
  erc7984(
    '0380a7ff-a73e-4bc5-ae3f-dce61754b6a1',
    'eth:carmusdts',
    'Confidential armUSDTs',
    6,
    '0xbac6dedf2c10d6d381f9dbd9efd69d93ffcef50b', // https://etherscan.io/token/0xbaC6DeDf2C10D6D381F9DBd9EFd69D93FfCef50B
    UnderlyingAsset['eth:carmusdts'],
    undefined, // features: default ERC7984_TOKEN_FEATURES
    undefined, // prefix
    undefined, // suffix
    undefined, // network: Ethereum mainnet
    undefined, // primaryKeyCurve: secp256k1
    '0x500ae64100d7dbdb640531085c2f5d40cdc8930d', // underlying()=armUSDTs 18dp
    '1000000000000', // rate() on-chain: 18dp → 6dp
    false // standard ERC-20 approve
  ),
  erc7984(
    '0ac9df9c-ec4d-4883-b0a9-4e04edb8db21',
    'eth:carmusdcp',
    'Confidential armUSDCp',
    6,
    '0x2ebbd099f66b0ca94dd82b4c06fe3eef6aff853c', // https://etherscan.io/token/0x2ebBd099f66b0ca94DD82B4c06fe3eEf6AFf853c
    UnderlyingAsset['eth:carmusdcp'],
    undefined, // features: default ERC7984_TOKEN_FEATURES
    undefined, // prefix
    undefined, // suffix
    undefined, // network: Ethereum mainnet
    undefined, // primaryKeyCurve: secp256k1
    '0x5dc53a23adc9f2bed98de6f59f7f309a7c71ff2b', // underlying()=armUSDCp 18dp
    '1000000000000', // rate() on-chain: 18dp → 6dp
    false // standard ERC-20 approve
  ),
  erc7984(
    '7de09795-1036-41ea-965b-33578659dcb7',
    'eth:carmusdcs',
    'Confidential armUSDCs',
    6,
    '0x77f8207ee451441336538ba07a2f425780ded8db', // https://etherscan.io/token/0x77F8207ee451441336538bA07a2F425780dED8DB
    UnderlyingAsset['eth:carmusdcs'],
    undefined, // features: default ERC7984_TOKEN_FEATURES
    undefined, // prefix
    undefined, // suffix
    undefined, // network: Ethereum mainnet
    undefined, // primaryKeyCurve: secp256k1
    '0xa2eaad0d586cf9fd73bb2c09cf6a7e3e187d68cd', // underlying()=armUSDCs 18dp
    '1000000000000', // rate() on-chain: 18dp → 6dp
    false // standard ERC-20 approve
  ),
  erc7984(
    '2d259b48-a02b-4e2f-8f77-e83fb803fede',
    'eth:cbbqusdt',
    'Confidential bbqUSDT',
    6,
    '0x80ae7dbce3c1696d3eed04ec8348c3c432322273', // https://etherscan.io/token/0x80Ae7dbCe3c1696d3eeD04Ec8348c3C432322273
    UnderlyingAsset['eth:cbbqusdt'],
    undefined, // features: default ERC7984_TOKEN_FEATURES
    undefined, // prefix
    undefined, // suffix
    undefined, // network: Ethereum mainnet
    undefined, // primaryKeyCurve: secp256k1
    '0xbeeff07d991c04cd640de9f15c08ba59c4fedeb7', // underlying()=bbqUSDT 18dp
    '1000000000000', // rate() on-chain: 18dp → 6dp
    false // standard ERC-20 approve
  ),
  erc7984(
    '829f0f3e-1aa2-458f-9e10-018d63632512',
    'eth:cbbqusdc',
    'Confidential bbqUSDC',
    6,
    '0x501b014f86a73a7199e00cb31c0e9565ac51e51b', // https://etherscan.io/token/0x501b014f86a73A7199E00cB31C0e9565Ac51e51B
    UnderlyingAsset['eth:cbbqusdc'],
    undefined, // features: default ERC7984_TOKEN_FEATURES
    undefined, // prefix
    undefined, // suffix
    undefined, // network: Ethereum mainnet
    undefined, // primaryKeyCurve: secp256k1
    '0xbeeff2c5bf38f90e3482a8b19f12e5a6d2fca757', // underlying()=bbqUSDC 18dp
    '1000000000000', // rate() on-chain: 18dp → 6dp
    false // standard ERC-20 approve
  ),
  erc7984(
    'fda0b4dc-27bc-4f97-8281-dbcb483bd983',
    'eth:carmusdtp',
    'Confidential armUSDTp',
    6,
    '0x63a60acc304b84ef829b263f28e7b636bf77d45a', // https://etherscan.io/token/0x63a60aCC304b84eF829b263f28e7b636Bf77d45A
    UnderlyingAsset['eth:carmusdtp'],
    undefined, // features: default ERC7984_TOKEN_FEATURES
    undefined, // prefix
    undefined, // suffix
    undefined, // network: Ethereum mainnet
    undefined, // primaryKeyCurve: secp256k1
    '0xbf29043164660c60a2a72cd15ffe2304e87b6838', // underlying()=armUSDTp 18dp
    '1000000000000', // rate() on-chain: 18dp → 6dp
    false // standard ERC-20 approve
  ),
  // CHALO-2158: batch-2 confidential tokens moved from the bot custody list (botTokens.ts) to
  // the proper ERC-7984 coin type — the wrapper contracts have no ERC-20 interface. UUIDs,
  // names, decimals, and addresses are unchanged from the original bot entries; underlying(),
  // rate(), and approve behavior verified on-chain.
  erc7984(
    'd3e84012-1022-4d93-af97-daf7c6e73eb2',
    'eth:cwbtc',
    'Zama Confidential WBTC',
    6,
    '0xd86ae89c089b380f064fe01899b4071f1eb6bb3d', // https://etherscan.io/token/0xd86aE89C089B380f064Fe01899B4071F1eb6Bb3d
    UnderlyingAsset['eth:cwbtc'],
    undefined, // features: default ERC7984_TOKEN_FEATURES
    undefined, // prefix
    undefined, // suffix
    undefined, // network: Ethereum mainnet
    undefined, // primaryKeyCurve: secp256k1
    '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599', // underlying()=WBTC 8dp
    '100', // rate() on-chain: 8dp → 6dp
    false // standard ERC-20 approve
  ),
  erc7984(
    '5a5e8ac5-79fc-459f-bbdb-2290fa6198d6',
    'eth:cbron',
    'Zama Confidential BRON',
    6,
    '0x85de671c3bec1aded752c3cea943521181c826bc', // https://etherscan.io/token/0x85dE671c3bec1aDeD752c3Cea943521181C826bc
    UnderlyingAsset['eth:cbron'],
    undefined, // features: default ERC7984_TOKEN_FEATURES
    undefined, // prefix
    undefined, // suffix
    undefined, // network: Ethereum mainnet
    undefined, // primaryKeyCurve: secp256k1
    '0xba2c598e11ed093079cc324fca5bbba99f616e83', // underlying()=BRON 18dp
    '1000000000000', // rate() on-chain: 18dp → 6dp
    false // standard ERC-20 approve
  ),
  erc7984(
    '2af96769-a1cd-400b-8d6e-b1cf63ad97ff',
    'eth:cpendle',
    'Confidential PENDLE',
    6,
    '0x8900123f7e17709c1d80eda1e611a9503cf1b3df', // https://etherscan.io/token/0x8900123F7e17709C1D80eda1E611A9503Cf1B3df
    UnderlyingAsset['eth:cpendle'],
    undefined, // features: default ERC7984_TOKEN_FEATURES
    undefined, // prefix
    undefined, // suffix
    undefined, // network: Ethereum mainnet
    undefined, // primaryKeyCurve: secp256k1
    '0x808507121b80c02388fad14726482e061b8da827', // underlying()=PENDLE 18dp
    '1000000000000', // rate() on-chain: 18dp → 6dp
    false // standard ERC-20 approve
  ),
  erc7984(
    'a7ee07dd-0ce1-497a-b4e9-d601ba2ff2a7',
    'eth:cbbqtgbp',
    'Zama Confidential Steakhouse tGBP',
    6,
    '0xba4cff6ed6f7cb2a58776deca4e984b498446762', // https://etherscan.io/token/0xBA4cFF6ED6F7Cb2A58776dECa4E984b498446762
    UnderlyingAsset['eth:cbbqtgbp'],
    undefined, // features: default ERC7984_TOKEN_FEATURES
    undefined, // prefix
    undefined, // suffix
    undefined, // network: Ethereum mainnet
    undefined, // primaryKeyCurve: secp256k1
    '0xbeeffabcd0db09589dd21854aa760c52ab4bf04f', // underlying()=bbqTGBP 18dp
    '1000000000000', // rate() on-chain: 18dp → 6dp
    false // standard ERC-20 approve
  ),
  erc7984(
    '2adf6b42-3c88-48ab-9d96-86e5e4d445b9',
    'eth:csteakusdt',
    'Zama Confidential Steakhouse Prime USDT',
    6,
    '0x1f6a937119c0c34db0a2c4f000386a3bfd4a9e73', // https://etherscan.io/token/0x1F6A937119c0c34Db0a2c4F000386a3BfD4A9e73
    UnderlyingAsset['eth:csteakusdt'],
    undefined, // features: default ERC7984_TOKEN_FEATURES
    undefined, // prefix
    undefined, // suffix
    undefined, // network: Ethereum mainnet
    undefined, // primaryKeyCurve: secp256k1
    '0xbeef003c68896c7d2c3c60d363e8d71a49ab2bf9', // underlying()=steakUSDT 18dp
    '1000000000000', // rate() on-chain: 18dp → 6dp
    false // standard ERC-20 approve
  ),
  erc7984(
    'dd87b3b7-67d8-4e44-861d-080417a3b6d8',
    'eth:cpendleusd',
    'Zama Confidential Pendle Ecosystem USDC',
    6,
    '0xb6e5299fc56053dd5440104fd6fd2a3cd064edbc', // https://etherscan.io/token/0xb6e5299fc56053DD5440104Fd6Fd2A3CD064edbC
    UnderlyingAsset['eth:cpendleusd'],
    undefined, // features: default ERC7984_TOKEN_FEATURES
    undefined, // prefix
    undefined, // suffix
    undefined, // network: Ethereum mainnet
    undefined, // primaryKeyCurve: secp256k1
    '0x55c1b6e461a6334b567baf0feb5d728715446f05', // underlying()=pendleUSDC 18dp
    '1000000000000', // rate() on-chain: 18dp → 6dp
    false // standard ERC-20 approve
  ),
  erc7984(
    'd4bfad6b-f802-4951-84f6-c8c23d9e7d2e',
    'eth:cpapy',
    'Zama confidential Bitwise Premium RWA AUSD',
    6,
    '0x9abb8f3dc2863b1f108ded7ea41902fef6732a8c', // https://etherscan.io/token/0x9ABb8f3dC2863B1F108DeD7ea41902fEF6732A8c
    UnderlyingAsset['eth:cpapy'],
    undefined, // features: default ERC7984_TOKEN_FEATURES
    undefined, // prefix
    undefined, // suffix
    undefined, // network: Ethereum mainnet
    undefined, // primaryKeyCurve: secp256k1
    '0xb344e331a3cda61d329fb3cca2be5942da87c418', // underlying()=PAPY 18dp
    '1000000000000', // rate() on-chain: 18dp → 6dp
    false // standard ERC-20 approve
  ),
  erc7984(
    '64f7a382-c415-4d59-9aee-9319e9337a6a',
    'eth:croxusdcy',
    'Zama Confidential RockawayX USDC Yield',
    6,
    '0x4fccf8046fb7fb7ab76321bd39c27453e396b88f', // https://etherscan.io/token/0x4FCCF8046FB7FB7AB76321BD39C27453e396B88f
    UnderlyingAsset['eth:croxusdcy'],
    undefined, // features: default ERC7984_TOKEN_FEATURES
    undefined, // prefix
    undefined, // suffix
    undefined, // network: Ethereum mainnet
    undefined, // primaryKeyCurve: secp256k1
    '0xe0181090c22579b6a217f1522cbf8c9f1f0c1965', // underlying()=roxUSDCy 18dp
    '1000000000000', // rate() on-chain: 18dp → 6dp
    false // standard ERC-20 approve
  ),
  erc7984(
    '93301e0f-0846-4027-aed4-17b3e044ee72',
    'eth:carmcwbtc',
    'Zama Confidential Wintermute CWBTC',
    6,
    '0xf921a5b0634f4236b21a4e948317abf9a2e86b6f', // https://etherscan.io/token/0xF921A5B0634f4236B21A4e948317abf9a2E86B6f
    UnderlyingAsset['eth:carmcwbtc'],
    undefined, // features: default ERC7984_TOKEN_FEATURES
    undefined, // prefix
    undefined, // suffix
    undefined, // network: Ethereum mainnet
    undefined, // primaryKeyCurve: secp256k1
    '0x3d5eccb62974178236a768a7ef14d3ce468fbe91', // underlying()=armcWBTC 18dp
    '1000000000000', // rate() on-chain: 18dp → 6dp
    false // standard ERC-20 approve
  ),
  erc7984(
    'a62b4066-16cf-40cd-8fc6-978bf5557721',
    'eth:cfausde',
    'Zama Confidential Flowdesk AUSD RWA',
    6,
    '0x76a3f985315aac9789cb5bf8a5bb83bff55fd5a6', // https://etherscan.io/token/0x76A3f985315aAc9789Cb5BF8A5bb83BFF55FD5a6
    UnderlyingAsset['eth:cfausde'],
    undefined, // features: default ERC7984_TOKEN_FEATURES
    undefined, // prefix
    undefined, // suffix
    undefined, // network: Ethereum mainnet
    undefined, // primaryKeyCurve: secp256k1
    '0x32401b9fb79065bc15949de0bd43927492f02f0c', // underlying()=fAUSDe 18dp
    '1000000000000', // rate() on-chain: 18dp → 6dp
    false // standard ERC-20 approve
  ),
  erc7984(
    'c43c62ca-7c56-4302-8649-344556435e13',
    'eth:cfcusdt',
    'Zama Confidential Flowdesk High Yield CUSDT',
    6,
    '0xa28a369df348ac232e4daf7b0ef90280d8707d7f', // https://etherscan.io/token/0xA28A369Df348ac232E4DAF7B0Ef90280d8707D7F
    UnderlyingAsset['eth:cfcusdt'],
    undefined, // features: default ERC7984_TOKEN_FEATURES
    undefined, // prefix
    undefined, // suffix
    undefined, // network: Ethereum mainnet
    undefined, // primaryKeyCurve: secp256k1
    '0xb48c056c5608ba2ee4cd94af2bf4b1f25295bd7e', // underlying()=fcUSDT 18dp
    '1000000000000', // rate() on-chain: 18dp → 6dp
    false // standard ERC-20 approve
  ),
  erc7984(
    '59ce0037-5658-4d51-bcad-9c86be078c4b',
    'eth:croxcusdc',
    'Zama Confidential RockawayX RWA USDC',
    6,
    '0xb1b18ad1f16d744c470cb6b09cb826affcc9eb30', // https://etherscan.io/token/0xB1B18Ad1F16D744c470cb6B09Cb826AfFcc9EB30
    UnderlyingAsset['eth:croxcusdc'],
    undefined, // features: default ERC7984_TOKEN_FEATURES
    undefined, // prefix
    undefined, // suffix
    undefined, // network: Ethereum mainnet
    undefined, // primaryKeyCurve: secp256k1
    '0xc207d3f66537d7f66456808379a0e560cf20da36', // underlying()=roxcUSDC 18dp
    '1000000000000', // rate() on-chain: 18dp → 6dp
    false // standard ERC-20 approve
  ),

  // Testnet tokens (hteth / Hoodi) — Zama cleartext FHE stack (chain ID 560048)
  terc7984(
    'f47ac10b-58cc-4372-a567-0e02b2c3d481',
    'hteth:ctest1',
    'Zama Token Test 1',
    6,
    '0x7b1d59bbcd291daa59cb6c8c5bc04de1afc4aba1',
    '0x7740f913dc24d4f9e1a72531372c3170452b2f87',
    '1000000000000', // 1e12
    false,
    UnderlyingAsset['hteth:ctest1']
  ),
  terc7984(
    'f47ac10b-58cc-4372-a567-0e02b2c3d482',
    'hteth:cusdt',
    'Zama USDT',
    6,
    '0x2debbe0487ef921df4457f9e36ed05be2df1ac75',
    '0x51a63b5621d78de54d2f4d098a23a5a69e76f30b',
    '1',
    false,
    UnderlyingAsset['hteth:cusdt']
  ),
];
