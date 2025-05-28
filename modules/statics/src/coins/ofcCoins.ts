import {
  ofc,
  tofc,
  ofcsolToken,
  tofcsolToken,
  tofcTronToken,
  ofcTronToken,
  ofcXrpToken,
  tofcXrpToken,
  ofcStxToken,
  ofcStellarToken,
  tofcStellarToken,
  ofcBscToken,
  tofcBscToken,
  ofcAvaxErc20,
  tofcAvaxErc20,
  ofcArbethErc20,
  tofcArbethErc20,
  ofcOpethErc20,
  ofcPolygonErc20,
  tofcPolygonErc20,
  ofcAlgoToken,
  tofcAlgoToken,
  ofcHederaToken,
  tofcHederaToken,
  ofcaptToken,
  tofcStxToken,
} from '../ofc';
import { UnderlyingAsset, CoinKind } from '../base';

import { SOL_TOKEN_FEATURES, SOL_OFC_TOKEN_FEATURES, APT_OFC_TOKEN_FEATURES } from '../coinFeatures';

export const ofcCoins = [
  ofc('837f0cab-cad1-4510-a8e4-f2c60e1a8760', 'ofcusd', 'USD', 2, UnderlyingAsset.USD, CoinKind.FIAT),
  ofc('798f2a7c-23fd-4e16-9fe5-6bf47ca438a0', 'ofceur', 'Euro', 2, UnderlyingAsset.EUR, CoinKind.FIAT),
  ofc('f37bbb72-adfe-4d06-90dc-afd0aa34aadd', 'ofcgbp', 'Pound Sterling', 2, UnderlyingAsset.GBP, CoinKind.FIAT),
  ofc('60778b32-3497-4e45-895a-3f0bd3a2f475', 'ofcsgd', 'Singapore Dollar', 2, UnderlyingAsset.SGD, CoinKind.FIAT),
  ofc(
    'fe742061-8838-4b32-ab64-d328ca587feb',
    'ofcaed',
    'United Arab Emirates Dirham',
    2,
    UnderlyingAsset.AED,
    CoinKind.FIAT
  ),
  ofc(
    '71c2203c-59ba-45ba-9280-ec94b9c4e44f',
    'ofcavaxc',
    'Avalanche C-Chain',
    18,
    UnderlyingAsset.AVAXC,
    CoinKind.CRYPTO
  ),
  ofc('b16e03eb-c5e9-4814-bf30-bb9c33aa5a86', 'ofccspr', 'Casper', 9, UnderlyingAsset.CSPR, CoinKind.CRYPTO),
  ofc('cbcaf7c2-9426-4448-a8ef-88ef32c8b855', 'ofcnear', 'Near', 24, UnderlyingAsset.NEAR, CoinKind.CRYPTO),
  ofc('167e2bce-a7a8-4d0e-aa14-e9fe1a63a854', 'ofcbtc', 'Bitcoin', 8, UnderlyingAsset.BTC, CoinKind.CRYPTO),
  ofc('138e7dca-2fb9-41c3-97e9-14a3fcbeb252', 'ofceth', 'Ether', 18, UnderlyingAsset.ETH, CoinKind.CRYPTO),
  ofc('044db0b9-9d8f-4b72-ad20-bdb1a4157ccd', 'ofcltc', 'Litecoin', 8, UnderlyingAsset.LTC, CoinKind.CRYPTO),
  ofc('a36fd909-3dcb-464d-bc9c-de59e4f5f9e9', 'ofcdash', 'Dash', 8, UnderlyingAsset.DASH, CoinKind.CRYPTO),
  ofc('1d4b178b-31d6-4bf2-9f70-43d16a62a1b7', 'ofczec', 'ZCash', 8, UnderlyingAsset.ZEC, CoinKind.CRYPTO),
  ofc('ab52081f-ab09-4eb5-b9a9-ebfaee92caaa', 'ofcxrp', 'Ripple', 6, UnderlyingAsset.XRP, CoinKind.CRYPTO),
  ofc('c214bc45-7540-4270-8d89-e55d541448dd', 'ofcxlm', 'Stellar', 7, UnderlyingAsset.XLM, CoinKind.CRYPTO),
  ofc('64de501c-5cac-47a7-b0e4-ec2cf6fca483', 'ofcbch', 'Bitcoin Cash', 8, UnderlyingAsset.BCH, CoinKind.CRYPTO),
  ofc('ca88f60c-1f43-466e-b529-362d8f1c3089', 'ofcalgo', 'Algorand', 6, UnderlyingAsset.ALGO, CoinKind.CRYPTO),
  ofc('5036883f-67aa-4d61-8cff-931392c4d43d', 'ofcbtg', 'Bitcoin Gold', 8, UnderlyingAsset.BTG, CoinKind.CRYPTO),
  ofc('afa494f3-a56d-4b81-991d-066b4aae181c', 'ofcbsv', 'Bitcoin SV', 8, UnderlyingAsset.BSV, CoinKind.CRYPTO),
  ofc('5b206383-7b8c-4199-8456-71e7a84527d5', 'ofcdot', 'Polkadot', 10, UnderlyingAsset.DOT, CoinKind.CRYPTO),
  ofc('f1ed2667-fed1-4db8-87f5-061282d6147b', 'ofceos', 'Eos', 4, UnderlyingAsset.EOS, CoinKind.CRYPTO),
  ofc('6c0714f3-fb74-4bb7-b17d-e34e48821890', 'ofcetc', 'Ethereum Classic', 18, UnderlyingAsset.ETC, CoinKind.CRYPTO),
  ofc('49bc92d3-3085-4124-bdb3-df86385dd9b5', 'ofcstx', 'Stacks', 6, UnderlyingAsset.STX, CoinKind.CRYPTO),
  ofc(
    '181974a6-b042-460e-acec-46733f8af941',
    'ofchbar',
    'Mainnet Hedera HBAR',
    8,
    UnderlyingAsset.HBAR,
    CoinKind.CRYPTO
  ),
  ofc('140ac16e-e39a-49d0-ae69-60019ff35727', 'ofcbld', 'Agoric', 6, UnderlyingAsset.BLD, CoinKind.CRYPTO),
  ofc('8b4f4051-b447-479b-bc3e-88e30a496599', 'ofcbaby', 'Babylon', 6, UnderlyingAsset.BABY, CoinKind.CRYPTO),
  ofc('220b2568-e996-40d1-af2c-fc4f79019069', 'ofctia', 'Celestia', 6, UnderlyingAsset.TIA, CoinKind.CRYPTO),
  ofc('3ad9a2e0-a8f4-4673-9177-35e855929eb6', 'ofcatom', 'Cosmos Hub ATOM', 6, UnderlyingAsset.ATOM, CoinKind.CRYPTO),
  ofc(
    'd7cced3c-285a-4a2c-8212-cf959fd15db3',
    'ofcinjective',
    'Injective',
    18,
    UnderlyingAsset.INJECTIVE,
    CoinKind.CRYPTO
  ),
  ofc('3977b3bd-abf2-476b-9d2a-4666d3b0aa10', 'ofcosmo', 'Osmosis', 6, UnderlyingAsset.OSMO, CoinKind.CRYPTO),
  ofc('5958e6e9-c6d7-4372-8d1d-c681f595c481', 'ofchash', 'Provenance', 9, UnderlyingAsset.HASH, CoinKind.CRYPTO),
  ofc('4616eb4e-9244-449c-a503-02cb2d715b2c', 'ofcsei', 'Sei', 6, UnderlyingAsset.SEI, CoinKind.CRYPTO),
  ofc('50a00889-47d2-44b5-8dc8-1fb3b4f47b86', 'ofczeta', 'Zeta', 18, UnderlyingAsset.ZETA, CoinKind.CRYPTO),
  ofc(
    '03df4c0c-12be-4b24-b3c3-c59be198711b',
    'ofcbsc',
    'Binance Smart Chain',
    18,
    UnderlyingAsset.BSC,
    CoinKind.CRYPTO
  ),
  ofc('7b79bc25-5497-4350-b961-4bbed2bea994', 'ofcsui', 'Sui', 9, UnderlyingAsset.SUI, CoinKind.CRYPTO),
  ofc('31bae66e-a135-42f9-b9d3-1623ab9c7ecc', 'ofctrx', 'Tron', 6, UnderlyingAsset.TRX, CoinKind.CRYPTO),
  ofc('dbbceebe-9096-4d7b-ae9e-31eb8a3dc5ca', 'ofcsol', 'Solana', 9, UnderlyingAsset.SOL, CoinKind.CRYPTO),
  ofc('07301a34-7e47-417e-a2cb-00ef609d59a1', 'ofcdoge', 'Dogecoin', 8, UnderlyingAsset.DOGE, CoinKind.CRYPTO),
  ofc('5beca519-4479-4878-8e8a-a910226438c0', 'ofcada', 'Cardano', 6, UnderlyingAsset.ADA, CoinKind.CRYPTO),
  ofc(
    'e9b7ae6f-f893-44e6-87db-1bbb1469a3d6',
    'ofcpolygon',
    'Polygon (MATIC native)',
    18,
    UnderlyingAsset.POLYGON,
    CoinKind.CRYPTO
  ),
  ofc(
    'd3c07741-d4cd-4013-9884-653f437bbfd7',
    'ofcarbeth',
    'Arbitrum Ethereum (L2 Chain)',
    18,
    UnderlyingAsset.ARBETH,
    CoinKind.CRYPTO
  ),
  ofc('8b93e788-52fa-4fd6-b499-40f13fe194fc', 'ofccoreum', 'Coreum', 6, UnderlyingAsset.COREUM, CoinKind.CRYPTO),
  ofc('a88adc55-c1c8-4a4e-8436-df3868a50daa', 'ofccelo', 'Celo Gold', 18, UnderlyingAsset.CELO, CoinKind.CRYPTO),
  ofc('9e2da785-8349-4153-8276-941319575833', 'ofcxtz', 'Tezos', 6, UnderlyingAsset.XTZ, CoinKind.CRYPTO),
  ofc(
    '283b93b5-741b-4c85-a201-097267d65097',
    'ofcopeth',
    'Optimism Ethereum (L2 Chain)',
    18,
    UnderlyingAsset.OPETH,
    CoinKind.CRYPTO
  ),
  ofc('07083ea6-74ba-4da7-8cf3-031126a130a4', 'ofcton', 'Ton', 9, UnderlyingAsset.TON, CoinKind.CRYPTO),
  ofc(
    '055691ec-f750-4349-b505-92954ca08257',
    'ofccoredao',
    'coredaochain',
    18,
    UnderlyingAsset.COREDAO,
    CoinKind.CRYPTO
  ),
  ofc('1c21ee76-2285-4bd6-855b-9fa5698ab78c', 'ofcxdc', 'XDC', 18, UnderlyingAsset.XDC, CoinKind.CRYPTO),
  tofc('a4b3776d-aea6-4c07-968e-0e698c9aea91', 'ofctxdc', 'Testnet XDC', 18, UnderlyingAsset.XDC, CoinKind.CRYPTO),
  ofc('3c85e27d-ee16-468a-bab3-f44ef1642a8b', 'ofcwemix', 'Wemix', 18, UnderlyingAsset.WEMIX, CoinKind.CRYPTO),
  tofc(
    '80f8c9ac-0855-4dd6-894f-99e45e607504',
    'ofctwemix',
    'Testnet wemix',
    18,
    UnderlyingAsset.WEMIX,
    CoinKind.CRYPTO
  ),
  ofc('1876cf96-a0b7-4b7b-9024-6bd89df9814b', 'ofcflr', 'Flare', 18, UnderlyingAsset.FLR, CoinKind.CRYPTO),
  tofc('312ff039-2473-4a11-837f-4ec896a0483d', 'ofctflr', 'Testnet flare', 18, UnderlyingAsset.FLR, CoinKind.CRYPTO),
  ofc('dd3f3d9a-8eae-4a7a-8178-88611687674d', 'ofcsgb', 'Songbird', 18, UnderlyingAsset.SGB, CoinKind.CRYPTO),
  tofc('30e8f8d8-17e7-4af0-91cf-069724e05e65', 'ofctsgb', 'Testnet songbird', 18, UnderlyingAsset.SGB, CoinKind.CRYPTO),
  ofc('4bc9d629-cff8-4f1b-bb43-5424f7ed9a19', 'ofcmon', 'Monad', 18, UnderlyingAsset.MON, CoinKind.CRYPTO),
  tofc('24f7dd79-7d03-4ce5-ac90-0572153f28f2', 'ofctmon', 'Testnet Monad', 18, UnderlyingAsset.MON, CoinKind.CRYPTO),
  ofc('bf513cc9-7b75-42d2-a585-1a7c91801605', 'ofcworld', 'World', 18, UnderlyingAsset.WORLD, CoinKind.CRYPTO),
  tofc(
    'ca1f3c70-8f80-4feb-9be7-f2b716409027',
    'ofctworld',
    'Testnet world',
    18,
    UnderlyingAsset.WORLD,
    CoinKind.CRYPTO
  ),
  ofc('0ea1175d-63a2-4dd3-b963-24020a02eab3', 'ofcstt', 'Somnia', 18, UnderlyingAsset.STT, CoinKind.CRYPTO),
  tofc('06eee147-1299-435d-843f-9eea958e2b2f', 'ofctstt', 'Testnet somnia', 18, UnderlyingAsset.STT, CoinKind.CRYPTO),
  ofc('cdc62abc-4748-48f4-8926-6ed42f6c86c9', 'ofcsoneium', 'Soneium', 18, UnderlyingAsset.SONEIUM, CoinKind.CRYPTO),
  tofc(
    '3df259c9-3b18-4611-a359-cf977c535a5f',
    'ofctsoneium',
    'Testnet soneium',
    18,
    UnderlyingAsset.SONEIUM,
    CoinKind.CRYPTO
  ),
  ofc('092cb24a-238d-4faa-bfc9-328ebb9cbcba', 'ofcicp', 'ICP', 8, UnderlyingAsset.ICP, CoinKind.CRYPTO),
  tofc('f6877057-8ac9-4325-bfa9-b6a4fab7c3ee', 'ofcticp', 'Testnet ICP', 8, UnderlyingAsset.ICP, CoinKind.CRYPTO),
  ofc('6f1f9d82-dc02-4448-b289-84e246a921f8', 'ofcbera', 'Bera', 18, UnderlyingAsset.BERA, CoinKind.CRYPTO),
  ofc('ecc046f9-eb9c-479d-943f-9fe0633ea212', 'ofcoas', 'oaschain', 18, UnderlyingAsset.OAS, CoinKind.CRYPTO),
  ofc('24c3b525-b5d3-45c0-9280-599db27c0fab', 'ofctao', 'Bittensor', 9, UnderlyingAsset.TAO, CoinKind.CRYPTO),
  ofc('77661a48-865f-48ea-bb73-875744729a69', 'ofcbera:dolo', 'Dolomite', 18, UnderlyingAsset.BERA, CoinKind.CRYPTO),
  ofc('411fd61a-3571-41f4-b632-6058a30a66a2', 'ofcapt', 'Aptos', 8, UnderlyingAsset.APT, CoinKind.CRYPTO),
  tofc('6677edac-c597-43ca-b8ff-6cdfa4e094a3', 'ofctapt', 'Testnet Aptos', 8, UnderlyingAsset.APT, CoinKind.CRYPTO),
  tofc('81bd0c13-6531-42b9-a58a-b1e65d239f6f', 'ofctoas', 'Testnet oaschain', 18, UnderlyingAsset.OAS, CoinKind.CRYPTO),
  tofc(
    '6d2fcabc-5c58-4964-a4c9-d9d5c338a88a',
    'ofctbera',
    'Testnet Berachain',
    18,
    UnderlyingAsset.BERA,
    CoinKind.CRYPTO
  ),
  tofc(
    'f17727ec-5d0b-4c5d-bbbc-cd93da537f40',
    'ofctcoredao',
    'Testnet coredao chain',
    18,
    UnderlyingAsset.COREDAO,
    CoinKind.CRYPTO
  ),
  tofc('e85d3b60-b6c8-4e29-b6db-38966125cfeb', 'ofctusd', 'Test USD', 2, UnderlyingAsset.USD, CoinKind.FIAT),
  tofc('dbac74bb-5dbc-4cdd-ad66-f71315b53a3f', 'ofcteur', 'Test Euro', 2, UnderlyingAsset.EUR, CoinKind.FIAT),
  tofc(
    'c916c733-2a4e-4b09-ab8d-38e891194016',
    'ofctsgd',
    'Testnet Singapore Dollar',
    2,
    UnderlyingAsset.SGD,
    CoinKind.FIAT
  ),
  tofc(
    'e1608f5b-6471-45a6-9987-73a131d354f4',
    'ofctaed',
    'Testnet United Arab Emirates Dirham',
    2,
    UnderlyingAsset.SGD,
    CoinKind.FIAT
  ),
  tofc(
    'd98b94c0-222f-4efe-ae88-917722ac45b4',
    'ofctgbp',
    'Test British Pound Sterling',
    2,
    UnderlyingAsset.GBP,
    CoinKind.FIAT
  ),
  tofc('e5e9dedb-4d72-4a44-a84c-32f46d275bdc', 'ofctcspr', 'Test Casper', 9, UnderlyingAsset.CSPR, CoinKind.CRYPTO),
  tofc('b84e3f27-e521-4093-9616-fc92ba352cd9', 'ofctnear', 'Test Near', 24, UnderlyingAsset.NEAR, CoinKind.CRYPTO),
  tofc('457d1c4e-5bf7-442a-90c9-dfd590f30925', 'ofctbtc', 'Test Bitcoin', 8, UnderlyingAsset.BTC, CoinKind.CRYPTO),
  tofc('b4a75a39-3fd2-4866-aaed-75b969df1d98', 'ofctbtc4', 'Testnet4 Bitcoin', 8, UnderlyingAsset.BTC, CoinKind.CRYPTO),
  tofc('4bf9d3a3-04f7-4c48-9a26-12b36bbecfb7', 'ofctdot', 'Test Polkadot', 12, UnderlyingAsset.DOT, CoinKind.CRYPTO),
  tofc('e916ff23-7521-4046-9bea-b92788acc23b', 'ofcteth', 'Test Ether', 18, UnderlyingAsset.ETH, CoinKind.CRYPTO),
  tofc(
    'a90ab5b8-e156-4d40-9cd7-b170416ba7de',
    'ofcgteth',
    'Test Goerli Ether',
    18,
    UnderlyingAsset.ETH,
    CoinKind.CRYPTO
  ),
  tofc(
    'dd7fd2c8-df50-4f8b-96ac-ff5f874c80ca',
    'ofchteth',
    'Test Holesky Ether',
    18,
    UnderlyingAsset.ETH,
    CoinKind.CRYPTO
  ),
  tofc(
    'f43d0558-8c07-4927-af7f-33947fd310c9',
    'ofctavaxc',
    'Test Avalanche C-Chain',
    18,
    UnderlyingAsset.AVAXC,
    CoinKind.CRYPTO
  ),
  tofc('96c298cb-7aaa-4beb-8edb-0f18b35fda89', 'ofctltc', 'Test Litecoin', 8, UnderlyingAsset.LTC, CoinKind.CRYPTO),
  tofc('d76b04d1-baef-4bd7-ac49-b5900f8f0b67', 'ofctdash', 'Test Dash', 8, UnderlyingAsset.DASH, CoinKind.CRYPTO),
  tofc('446a1812-d02c-47d5-b3d5-830e420fa274', 'ofctzec', 'Test ZCash', 8, UnderlyingAsset.ZEC, CoinKind.CRYPTO),
  tofc('adfc43d8-e702-465d-af01-f1583fa00a5e', 'ofctxrp', 'Test Ripple', 6, UnderlyingAsset.XRP, CoinKind.CRYPTO),
  tofc('3fb98e15-4e7d-4ab4-88cc-4a55746e6ffe', 'ofctxlm', 'Test Stellar', 7, UnderlyingAsset.XLM, CoinKind.CRYPTO),
  tofc('7c42feed-31e2-4a77-a211-ab3f24c9af90', 'ofctbch', 'Test Bitcoin Cash', 8, UnderlyingAsset.BCH, CoinKind.CRYPTO),
  tofc('4580a066-4a4b-4b6b-975f-b229170d72ba', 'ofctalgo', 'Test Algorand', 6, UnderlyingAsset.ALGO, CoinKind.CRYPTO),
  tofc('2095d445-a298-4d64-a2fb-49765a648159', 'ofctbtg', 'Test Bitcoin Gold', 8, UnderlyingAsset.BTG, CoinKind.CRYPTO),
  tofc('6162908d-9d98-4c73-a31d-d4387817e055', 'ofctbsv', 'Test Bitcoin SV', 8, UnderlyingAsset.BSV, CoinKind.CRYPTO),
  tofc('bbf5aef3-f60a-40cf-b82d-972aa8b6860a', 'ofcteos', 'Test Eos', 4, UnderlyingAsset.EOS, CoinKind.CRYPTO),
  tofc(
    '90d83653-a4b3-4b78-9a87-97f908702aa6',
    'ofctetc',
    'Test Ethereum Classic',
    18,
    UnderlyingAsset.ETC,
    CoinKind.CRYPTO
  ),
  tofc(
    'c027ff83-c74d-451a-bc1c-ac3d85a70034',
    'ofcthbar',
    'Testnet Hedera HBAR',
    8,
    UnderlyingAsset.HBAR,
    CoinKind.CRYPTO
  ),
  tofc('c2161656-219d-439a-be96-01fc67ed22a8', 'ofctstx', 'Test Stacks', 6, UnderlyingAsset.STX, CoinKind.CRYPTO),
  tofc('916488ca-3607-4c3f-96b4-e5a97edc8767', 'ofctbld', 'Testnet Agoric', 6, UnderlyingAsset.BLD, CoinKind.CRYPTO),
  tofc('ccf34023-f025-433a-8014-bda198907a3a', 'ofcttia', 'Testnet Celestia', 6, UnderlyingAsset.TIA, CoinKind.CRYPTO),
  tofc(
    'f6c23fad-16b6-4bf9-99ae-199ae8ac849d',
    'ofctatom',
    'Testnet Cosmos Hub ATOM',
    6,
    UnderlyingAsset.ATOM,
    CoinKind.CRYPTO
  ),
  tofc('db429b06-c128-461e-9401-0e9d96fe500f', 'ofctbaby', 'Testnet Babylon', 6, UnderlyingAsset.BABY, CoinKind.CRYPTO),
  tofc(
    '3b0f5716-94c3-4c5b-be70-cfd08b2f1fdf',
    'ofctinjective',
    'Testnet Injective',
    18,
    UnderlyingAsset.INJECTIVE,
    CoinKind.CRYPTO
  ),
  tofc('1573da4d-15a8-4dae-9368-84ec0507e251', 'ofctosmo', 'Testnet Osmosis', 6, UnderlyingAsset.OSMO, CoinKind.CRYPTO),
  tofc(
    '4bbb64d1-6bd2-4c53-8be0-f99229362c3d',
    'ofcthash',
    'Testnet Provenance',
    9,
    UnderlyingAsset.HASH,
    CoinKind.CRYPTO
  ),
  tofc('a7770053-4fe7-432e-a554-5d3ecc1cc4ad', 'ofctsei', 'Testnet Sei', 6, UnderlyingAsset.SEI, CoinKind.CRYPTO),
  tofc('801c0437-d4fd-4e5a-8656-a6bb596f0640', 'ofctzeta', 'Testnet Zeta', 18, UnderlyingAsset.ZETA, CoinKind.CRYPTO),
  tofc(
    '52e600bb-b006-452b-9f82-f81c20d0168d',
    'ofctbsc',
    'Testnet Binance Smart Chain',
    18,
    UnderlyingAsset.BSC,
    CoinKind.CRYPTO
  ),
  tofc('89bfad1a-97f8-46f8-bec6-3faf145f3a74', 'ofctsui', 'Testnet Sui', 9, UnderlyingAsset.SUI, CoinKind.CRYPTO),
  tofc('ac5b8544-6e98-4b74-9a60-9173ba226979', 'ofcttrx', 'Testnet Tron', 6, UnderlyingAsset.TRX, CoinKind.CRYPTO),
  tofc('bc10ac8c-7786-4ba8-b2a5-009b478d7046', 'ofctsol', 'Test Solana', 9, UnderlyingAsset.SOL, CoinKind.CRYPTO),
  tofc('b7dfb8c8-83e4-4b41-8782-49de832f9acf', 'ofctdoge', 'Test Dogecoin', 8, UnderlyingAsset.DOGE, CoinKind.CRYPTO),
  tofc('22299e37-402d-4d4d-9cf8-2146b915eac3', 'ofctada', 'Test Cardano', 6, UnderlyingAsset.ADA, CoinKind.CRYPTO),
  tofc(
    'b103d14f-1bad-49a3-afbe-418567680f02',
    'ofctpolygon',
    'Test Polygon (MATIC native)',
    18,
    UnderlyingAsset.POLYGON,
    CoinKind.CRYPTO
  ),
  tofc(
    'd4e13852-6b90-4e4c-a664-67d73137faa3',
    'ofctarbeth',
    'Testnet Arbitrum Ethereum (L2 Chain)',
    18,
    UnderlyingAsset.ARBETH,
    CoinKind.CRYPTO
  ),
  tofc('3091d79a-7737-4493-b3e6-6765998b9486', 'ofctcoreum', 'Test Coreum', 6, UnderlyingAsset.COREUM, CoinKind.CRYPTO),
  tofc(
    '90ac199d-4061-4c5f-9d48-4439c7ec2033',
    'ofctcelo',
    'Testnet Celo Gold',
    18,
    UnderlyingAsset.CELO,
    CoinKind.CRYPTO
  ),
  tofc('f5ad87e8-7c86-406b-9776-b7f6910b5e3b', 'ofctxtz', 'Testnet Tezos', 6, UnderlyingAsset.XTZ, CoinKind.CRYPTO),
  tofc(
    '3a8b240e-c8f9-48f4-9b6f-3f2ba64db07e',
    'ofctopeth',
    'Testnet Optimism Ethereum (L2 Chain)',
    18,
    UnderlyingAsset.OPETH,
    CoinKind.CRYPTO
  ),
  tofc('b364799a-e6d1-4d84-afc9-588594e850f7', 'ofctton', 'Test Ton', 9, UnderlyingAsset.TON, CoinKind.CRYPTO),
  tofc('d7ec69dc-619d-4c10-b269-75c2327bd69d', 'ofcttao', 'Testnet Bittensor', 9, UnderlyingAsset.TAO, CoinKind.CRYPTO),
  ofcsolToken(
    '7d1b17b3-d606-4ba7-82dc-3e3a0eede46a',
    'ofcsol:wsol',
    'Wrapped SOL',
    9,
    UnderlyingAsset['sol:wsol'],
    SOL_OFC_TOKEN_FEATURES
  ),
  ofcsolToken(
    '522d80ff-9588-4e56-8bb5-c2d3dce69e77',
    'ofcsol:tbill',
    'OpenEden T-Bills',
    6,
    UnderlyingAsset['sol:tbill'],
    SOL_OFC_TOKEN_FEATURES
  ),
  ofcsolToken(
    'ca2feee8-425b-4690-9294-a81911cbab42',
    'ofcsol:pnut',
    'Peanut the Squirrel',
    6,
    UnderlyingAsset['sol:pnut']
  ),
  ofcsolToken(
    'c382f3cc-c071-4ef5-89ac-bcb85d8d415f',
    'ofcsol:wec',
    'Whole Earth Coin',
    9,
    UnderlyingAsset['sol:wec'],
    SOL_OFC_TOKEN_FEATURES
  ),
  ofcsolToken(
    'fb3b730f-c2cc-4598-8165-ddd42de8cbdf',
    'ofcsol:usdt',
    'USD Tether',
    6,
    UnderlyingAsset['sol:usdt'],
    SOL_OFC_TOKEN_FEATURES
  ),
  ofcsolToken(
    '0d96e2db-d01e-4ea0-ac87-3b51d563ea91',
    'ofcsol:usdc',
    'USD Coin',
    6,
    UnderlyingAsset['sol:usdc'],
    SOL_OFC_TOKEN_FEATURES
  ),
  ofcsolToken(
    'ebbe0d38-44cb-4464-999f-68c9765e37ef',
    'ofcsol:srm',
    'Serum',
    6,
    UnderlyingAsset['sol:srm'],
    SOL_OFC_TOKEN_FEATURES
  ),
  ofcsolToken(
    '6bd37226-443b-41d3-9c5f-2f33279edffa',
    'ofcsol:slnd',
    'SOLEND',
    6,
    UnderlyingAsset['sol:slnd'],
    SOL_OFC_TOKEN_FEATURES
  ),
  ofcsolToken(
    '9e8cf6cd-19bd-440d-a73d-bfda85876008',
    'ofcsol:ray',
    'Raydium',
    6,
    UnderlyingAsset['sol:ray'],
    SOL_OFC_TOKEN_FEATURES
  ),
  ofcsolToken(
    '76bb31fc-62a6-4b45-9013-ca278a4bca3c',
    'ofcsol:qcad',
    'QCAD',
    2,
    UnderlyingAsset['sol:qcad'],
    SOL_OFC_TOKEN_FEATURES
  ),
  ofcsolToken(
    '2e567f9f-6bd8-4f2d-8b6b-e8c1bb6f619b',
    'ofcsol:pyth',
    'Pyth',
    6,
    UnderlyingAsset['sol:pyth'],
    SOL_OFC_TOKEN_FEATURES
  ),
  ofcsolToken(
    'd52d3d8b-a4c9-4f31-81a0-07fa1ca2e010',
    'ofcsol:orca',
    'ORCA',
    6,
    UnderlyingAsset['sol:orca'],
    SOL_OFC_TOKEN_FEATURES
  ),
  ofcsolToken(
    '8c7a1521-aabb-4a3d-9239-2e9b89015ed8',
    'ofcsol:veur',
    'VNX Euro',
    9,
    UnderlyingAsset['sol:veur'],
    SOL_OFC_TOKEN_FEATURES
  ),
  ofcsolToken(
    'f7c2a134-b706-4875-ac58-88132882ef64',
    'ofcsol:vchf',
    'VNX Swiss Franc',
    9,
    UnderlyingAsset['sol:vchf'],
    SOL_OFC_TOKEN_FEATURES
  ),
  ofcsolToken(
    '84b18d96-b8c3-4315-a500-fe624e3b5dfe',
    'ofcsol:kin',
    'Kin',
    5,
    UnderlyingAsset['sol:kin'],
    SOL_OFC_TOKEN_FEATURES
  ),
  ofcsolToken(
    'ee4bcc0d-7ffd-4854-b2be-21e7efe9e7c5',
    'ofcsol:jet',
    'Jet Protocol',
    9,
    UnderlyingAsset['sol:jet'],
    SOL_OFC_TOKEN_FEATURES
  ),
  ofcsolToken(
    '0f7d1c02-2f2d-4b39-b1f7-892edf9ff21a',
    'ofcsol:gmt',
    'GMT',
    9,
    UnderlyingAsset['sol:gmt'],
    SOL_OFC_TOKEN_FEATURES
  ),
  ofcsolToken(
    '8e4ec661-0ebc-46c8-afcd-1a1c4d9fdf5f',
    'ofcsol:gari',
    'GARI',
    9,
    UnderlyingAsset['sol:gari'],
    SOL_OFC_TOKEN_FEATURES
  ),
  ofcsolToken(
    '9f4dcf91-fa4a-41a3-aab9-e309d86f30b3',
    'ofcsol:crown',
    'CROWN Token',
    9,
    UnderlyingAsset['sol:crown'],
    SOL_OFC_TOKEN_FEATURES
  ),
  ofcsolToken(
    '65050658-411f-4e3c-be92-105b8c662cf6',
    'ofcsol:sbc',
    'Stable Coin',
    9,
    UnderlyingAsset['sol:sbc'],
    SOL_OFC_TOKEN_FEATURES
  ),
  ofcsolToken(
    'dfe78bd9-c67c-455b-a731-0c9dadd8078e',
    'ofcsol:bonk',
    'Bonk',
    5,
    UnderlyingAsset['sol:bonk'],
    SOL_OFC_TOKEN_FEATURES
  ),
  ofcsolToken(
    'de579e9d-c830-491e-8d5a-760c14a0be91',
    'ofcsol:honey',
    'HONEY',
    9,
    UnderlyingAsset['sol:honey'],
    SOL_OFC_TOKEN_FEATURES
  ),
  ofcsolToken(
    '8a8309b4-8587-4a95-b4a8-4e46c6206b50',
    'ofcsol:mplx',
    'Metaplex Token',
    6,
    UnderlyingAsset['sol:mplx'],
    SOL_OFC_TOKEN_FEATURES
  ),
  ofcsolToken(
    'cbc48e26-9eb9-47ea-b72f-9f8bad54ac3d',
    'ofcsol:hnt',
    'Helium Network Token',
    8,
    UnderlyingAsset['sol:hnt'],
    SOL_OFC_TOKEN_FEATURES
  ),
  ofcsolToken(
    '05a51449-e2e5-4076-991f-1d480960a6fb',
    'ofcsol:render',
    'Render Token',
    8,
    UnderlyingAsset['sol:render'],
    SOL_OFC_TOKEN_FEATURES
  ),
  ofcsolToken(
    '170b81f2-9378-44b6-8f25-4f4b7e3f4dfd',
    'ofcsol:natix',
    'NATIX Network ',
    6,
    UnderlyingAsset['sol:natix'],
    SOL_OFC_TOKEN_FEATURES
  ),
  ofcsolToken(
    'abbdcf44-ac44-46be-b4e9-8a760d44b79a',
    'ofcsol:mobile',
    'Helium Mobile',
    6,
    UnderlyingAsset['sol:mobile'],
    SOL_OFC_TOKEN_FEATURES
  ),
  ofcsolToken(
    '94e55bde-f57f-4817-9984-b461a5d6bcd0',
    'ofcsol:jup',
    'Jupiter',
    6,
    UnderlyingAsset['sol:jup'],
    SOL_OFC_TOKEN_FEATURES
  ),
  ofcsolToken(
    '989eec31-a0d5-4cdc-b4de-6fca30cde366',
    'ofcsol:popcat',
    'POPCAT',
    9,
    UnderlyingAsset['sol:popcat'],
    SOL_OFC_TOKEN_FEATURES
  ),
  ofcsolToken(
    'ca2a2bc9-ed79-426f-8378-96f9c9568526',
    'ofcsol:wif',
    'dogwifhat',
    6,
    UnderlyingAsset['sol:wif'],
    SOL_OFC_TOKEN_FEATURES
  ),
  ofcsolToken(
    'ab833723-8b40-4fc4-8dd1-f5ea9a07c76c',
    'ofcsol:goat',
    'Goatseus Maximus',
    6,
    UnderlyingAsset['sol:goat'],
    SOL_OFC_TOKEN_FEATURES
  ),
  ofcsolToken(
    'fe8e4d63-f2ed-4351-b9da-70a705444095',
    'ofcsol:mnde',
    'Marinade',
    9,
    UnderlyingAsset['sol:mnde'],
    SOL_TOKEN_FEATURES
  ),
  ofcsolToken(
    'fc7ac820-4b48-4286-8881-9b418118198e',
    'ofcsol:jto',
    'Jito',
    9,
    UnderlyingAsset['sol:jto'],
    SOL_TOKEN_FEATURES
  ),
  ofcsolToken(
    '9b6bd751-2057-4067-9e16-9a26df0e4127',
    'ofcsol:tnsr',
    'Tensor',
    9,
    UnderlyingAsset['sol:tnsr'],
    SOL_TOKEN_FEATURES
  ),
  ofcsolToken('41230415-d199-44ff-b25d-fb8fc7e7d0f8', 'ofcsol:giga', 'Gigachad', 5, UnderlyingAsset['sol:giga']),
  ofcsolToken('895df245-0030-46f0-a113-21de232399ee', 'ofcsol:bome', 'Book Of Meme', 6, UnderlyingAsset['sol:bome']),
  ofcsolToken('9ff1f4ec-d06f-4657-806c-220fb0d598e5', 'ofcsol:io', 'IONET', 8, UnderlyingAsset['sol:io']),
  ofcsolToken(
    '8c8b6013-90d2-4a61-b978-c05f655ffeb4',
    'ofcsol:trump',
    'OFFICIAL TRUMP',
    6,
    UnderlyingAsset['sol:trump']
  ),
  ofcsolToken('c22873cf-c1be-419e-865e-510c42f2943c', 'ofcsol:ai16z', 'AI16Z', 9, UnderlyingAsset['sol:ai16z']),
  ofcsolToken(
    '250a1d56-2286-4aa1-b1dd-0eb99db194ae',
    'ofcsol:melania',
    'Melania Meme',
    6,
    UnderlyingAsset['sol:melania']
  ),
  ofcsolToken('ea60791b-6ab9-4c90-b691-b669e3815c1c', 'ofcsol:matrix', 'Matrix One', 9, UnderlyingAsset['sol:matrix']),
  ofcsolToken(
    '05e3371a-db83-4e9d-9e53-cbc557fc6de9',
    'ofcsol:eurcv',
    'EUR CoinVertible',
    2,
    UnderlyingAsset['sol:eurcv']
  ),
  ofcsolToken(
    '95fdc89e-e094-44d6-a6ee-3e71b067fa17',
    'ofcsol:layer',
    'Solayer',
    9,
    UnderlyingAsset['sol:layer'],
    SOL_OFC_TOKEN_FEATURES
  ),
  ofcsolToken(
    'da103839-dd2c-44db-bc26-40df2847304f',
    'ofcsol:rock',
    'Zenrock',
    6,
    UnderlyingAsset['sol:rock'],
    SOL_TOKEN_FEATURES
  ),
  ofcsolToken(
    '78a9e2b8-40a5-4424-ae67-808248dc99cc',
    'ofcsol:dood',
    'Doodles',
    9,
    UnderlyingAsset['sol:dood'],
    SOL_TOKEN_FEATURES
  ),
  tofcsolToken(
    '24d678cf-e0f0-4cde-a338-d754289c5b27',
    'ofctsol:slnd',
    'testnet SOLEND',
    9,
    UnderlyingAsset['tsol:slnd'],
    SOL_TOKEN_FEATURES
  ),
  tofcsolToken(
    '5610a965-d046-46e2-9077-40f496be3f18',
    'ofctsol:orca',
    'testnet ORCA',
    9,
    UnderlyingAsset['tsol:orca'],
    SOL_TOKEN_FEATURES
  ),
  tofcsolToken(
    '6fd31137-ab29-441e-9136-8b4bad4f0477',
    'ofctsol:usdc',
    'testnet USD Coin',
    6,
    UnderlyingAsset['tsol:usdc'],
    SOL_TOKEN_FEATURES
  ),
  tofcsolToken(
    '431a593e-0396-4d68-9db6-901d312df47d',
    'ofctsol:ray',
    'testnet Raydium',
    9,
    UnderlyingAsset['tsol:ray'],
    SOL_TOKEN_FEATURES
  ),
  tofcsolToken(
    'ff1955c9-988d-4c9e-86e7-cf589bb3d66f',
    'ofctsol:gmt',
    'testnet GMT',
    9,
    UnderlyingAsset['tsol:gmt'],
    SOL_TOKEN_FEATURES
  ),
  tofcsolToken(
    '308d63c0-3a74-49c9-98d8-a4fe52e58226',
    'ofctsol:usdt',
    'testnet USD Tether',
    9,
    UnderlyingAsset['tsol:usdt'],
    SOL_TOKEN_FEATURES
  ),
  tofcsolToken(
    '73a332da-1abf-4c4b-b5b5-f03fe36738cb',
    'ofctsol:srm',
    'testnet Serum',
    9,
    UnderlyingAsset['tsol:srm'],
    SOL_TOKEN_FEATURES
  ),

  tofcsolToken(
    '20b20bc7-86b8-4f58-a8e9-a7cedbc2a507',
    'ofctsol:gari',
    'testnet Gari Token',
    9,
    UnderlyingAsset['tsol:gari'],
    SOL_TOKEN_FEATURES
  ),
  tofcsolToken(
    '3bca91fa-2c1a-4e7a-b1f1-b9c4402075a2',
    'ofctsol:hnt',
    'testnet Helium Network Token',
    8,
    UnderlyingAsset['sol:hnt'],
    SOL_TOKEN_FEATURES
  ),
  tofcTronToken('937efe97-a17a-4d2a-aaf2-0ffdb529a943', 'ofcttrx:usdt', 'Tether USD', 6, UnderlyingAsset['ttrx:usdt']),
  ofcTronToken('94b00b66-68a4-45ed-b772-77e5bca1e34c', 'ofctrx:usdt', 'Tether USD', 6, UnderlyingAsset['trx:usdt']),
  ofcTronToken('486dca06-5709-45ee-8b35-677e3d27509f', 'ofctrx:usd1', 'USD1 Token', 18, UnderlyingAsset['trx:usd1']),
  ofcXrpToken('6a173023-5faf-4a0a-af38-b8be98abe94f', 'ofcxrp:rlusd', 'Ripple USD', 15, UnderlyingAsset['xrp:rlusd']),
  tofcXrpToken('bd406dab-3b55-4ab5-b0a5-74b9f94268a3', 'ofctxrp:rlusd', 'RLUSD', 15, UnderlyingAsset['txrp:rlusd']),
  ofcXrpToken('eb3c02de-7221-4fde-9235-5cc576eb7c8b', 'ofcxrp:xsgd', 'XSGD', 6, UnderlyingAsset['xrp:xsgd']),
  ofcXrpToken(
    '46c75216-5498-4417-b73c-a08c11d693ad',
    'ofcxrp:tbill',
    'OpenEden T-Bills',
    15,
    UnderlyingAsset['xrp:tbill']
  ),
  ofcXrpToken('48ee9d32-9a99-4fd2-8636-021b150e6580', 'ofcxrp:veur', 'VNX Euro', 15, UnderlyingAsset['xrp:veur']),
  ofcXrpToken(
    '5b175d47-b21a-4fdd-8b84-7a6cb53697bc',
    'ofcxrp:vchf',
    'VNX Swiss Frank',
    15,
    UnderlyingAsset['xrp:vchf']
  ),
  ofcXrpToken('54c3a5df-ad9f-42a9-82fc-ef8617ec6ebf', 'ofcxrp:vgbp', 'VNX Pound', 15, UnderlyingAsset['xrp:vgbp']),
  tofcXrpToken('0c22d8ef-4c27-4088-bd3d-eb76484d5edf', 'ofctxrp:xsgd', 'XSGB', 15, UnderlyingAsset['txrp:xsgd']),
  ofcArbethErc20(
    'df2296e6-366e-4707-bab0-bf16ce592601',
    'ofcarbeth:link',
    'Chainlink Token',
    18,
    UnderlyingAsset['arbeth:link']
  ),
  ofcArbethErc20(
    '7c49e631-1fbc-4e9e-aef5-fe04c5ebeb79',
    'ofcarbeth:spxux',
    'WisdomTree 500 Digital Fund (SPXUX)',
    18,
    UnderlyingAsset['arbeth:spxux']
  ),
  ofcArbethErc20(
    '0cf9baf8-eca6-47b2-82e1-6ca0ee09f760',
    'ofcarbeth:xsgdv2',
    'XSGD (Bridged)',
    6,
    UnderlyingAsset['arbeth:xsgdv2']
  ),
  ofcArbethErc20(
    '59220e6e-d94b-40b7-8e10-2f7c691c2482',
    'ofcarbeth:usdcv2',
    'USD Coin (native)',
    6,
    UnderlyingAsset['arbeth:usdcv2']
  ),
  ofcArbethErc20(
    'eed6696c-9c38-4897-9cae-de3aa3cb6297',
    'ofcarbeth:usdc',
    'USD Coin',
    6,
    UnderlyingAsset['arbeth:usdc']
  ),
  ofcArbethErc20(
    'cb8b1d90-f1e4-45e2-b760-1d073c7edccc',
    'ofcarbeth:vchf',
    'VNX Franc',
    18,
    UnderlyingAsset['arbeth:vchf']
  ),
  ofcArbethErc20(
    '8087ff3d-3157-43b8-b6d1-a9e62a12b3ec',
    'ofcarbeth:veur',
    'VNX Euro',
    18,
    UnderlyingAsset['arbeth:veur']
  ),
  ofcArbethErc20(
    '4834e014-0282-4e27-ad9c-c4a4468ce732',
    'ofcarbeth:usdt',
    'Tether USD',
    6,
    UnderlyingAsset['arbeth:usdt']
  ),
  ofcArbethErc20(
    'e91ce545-8ace-4f12-b6d4-8c5a3e84022f',
    'ofcarbeth:arb',
    'Arbitrum',
    18,
    UnderlyingAsset['arbeth:arb']
  ),
  ofcArbethErc20(
    '1ba44303-cdf1-4322-bb82-54adbbbbd7f0',
    'ofcarbeth:tbill',
    'OpenEden T-Bills',
    6,
    UnderlyingAsset['arbeth:tbill']
  ),
  ofcArbethErc20('5be753ec-179f-4bad-8552-b3190b723779', 'ofcarbeth:xai', 'Xai', 18, UnderlyingAsset['arbeth:xai']),
  ofcArbethErc20(
    '9b9aa1f5-d7fc-40c9-a87c-e740509dd1a1',
    'ofcarbeth:flttx',
    'WisdomTree Floating Rate Treasury Digital Fund',
    18,
    UnderlyingAsset['arbeth:flttx']
  ),
  ofcArbethErc20(
    '5eba6e27-131b-42fd-b71c-c9dfeb172c11',
    'ofcarbeth:wtsix',
    'WisdomTree Short-Duration Income Digital Fund',
    18,
    UnderlyingAsset['arbeth:wtsix']
  ),
  ofcArbethErc20(
    'c3f3dd69-bc25-4420-8380-f7feafd185c7',
    'ofcarbeth:modrx',
    'WisdomTree Siegel Moderate Digital Fund',
    18,
    UnderlyingAsset['arbeth:modrx']
  ),
  ofcArbethErc20(
    '11b7ceeb-15eb-4a49-af99-ef4e7f07dd5f',
    'ofcarbeth:techx',
    'WisdomTree Technology & Innovation 100 Digital Fund',
    18,
    UnderlyingAsset['arbeth:techx']
  ),
  ofcArbethErc20(
    'fae855e2-46e2-4e7e-9a93-2765daa95dfe',
    'ofcarbeth:wtsyx',
    'WisdomTree Short-Term Treasury Digital Fund',
    18,
    UnderlyingAsset['arbeth:wtsyx']
  ),
  ofcArbethErc20(
    'a873b787-009e-483d-bc52-958a3f302510',
    'ofcarbeth:wtlgx',
    'WisdomTree Long Term Treasury Digital Fund',
    18,
    UnderlyingAsset['arbeth:wtlgx']
  ),
  ofcArbethErc20(
    '84bcab0f-d063-40b9-bdcf-41f2d5f002e4',
    'ofcarbeth:wttsx',
    'WisdomTree 3-7 Year Treasury Digital Fund',
    18,
    UnderlyingAsset['arbeth:wttsx']
  ),
  ofcArbethErc20(
    'dd79a31a-6a3d-43dd-ab3b-b9051556cf0e',
    'ofcarbeth:tipsx',
    'WisdomTree TIPS Digital Fund',
    18,
    UnderlyingAsset['arbeth:tipsx']
  ),
  ofcArbethErc20(
    '41d0448d-8623-4605-9c9b-06ce9018b4fd',
    'ofcarbeth:wtstx',
    'WisdomTree 7-10 Year Treasury Digital Fund',
    18,
    UnderlyingAsset['arbeth:wtstx']
  ),
  ofcArbethErc20(
    'aecd4e53-b15f-4626-bd66-b0cb07125d6f',
    'ofcarbeth:wtgxx',
    'WisdomTree Government Money Market Digital Fund',
    18,
    UnderlyingAsset['arbeth:wtgxx']
  ),
  ofcArbethErc20(
    '74992d6a-9c06-4048-9197-edb2adbcb455',
    'ofcarbeth:lngvx',
    'WisdomTree Siegel Longevity Digital Fund',
    18,
    UnderlyingAsset['arbeth:lngvx']
  ),
  ofcArbethErc20(
    '72557b5e-ff71-4bba-bcfb-38d0261292bc',
    'ofcarbeth:eqtyx',
    'WisdomTree Siegel Global Equity Digital Fund',
    18,
    UnderlyingAsset['arbeth:eqtyx']
  ),
  ofcAvaxErc20('2bd6201d-c46c-481e-b82d-7cf3601679cb', 'ofcavaxc:aave-e', 'Aave', 18, UnderlyingAsset['avaxc:aave']),
  ofcAvaxErc20('515a5a74-54fe-4d73-bb12-8d1130f78692', 'ofcavaxc:btc-b', 'Bitcoin', 8, UnderlyingAsset['avaxc:btc']),
  ofcAvaxErc20(
    'b8c9ea9d-4be3-4d3c-b1de-a1bb963fc03b',
    'ofcavaxc:cai',
    'Colony Avalanche Index',
    18,
    UnderlyingAsset['avaxc:cai']
  ),
  ofcAvaxErc20(
    '58d7ae4a-296c-4215-b133-01bf553f8500',
    'ofcavaxc:dai-e',
    'Dai Stablecoin',
    18,
    UnderlyingAsset['avaxc:dai']
  ),
  ofcAvaxErc20('ad7a51a1-81fb-483f-b338-9bb236ce9662', 'ofcavaxc:joe', 'Trader Joe', 18, UnderlyingAsset['avaxc:joe']),
  ofcAvaxErc20('18d60ded-bc60-48aa-a38a-6f85384ea6cc', 'ofcavaxc:klo', 'Kalao', 18, UnderlyingAsset['avaxc:klo']),
  ofcAvaxErc20('4ad0a18d-36b0-42db-ac94-938a0862ef0b', 'ofcavaxc:link', 'Chainlink', 18, UnderlyingAsset['avaxc:link']),
  ofcAvaxErc20('cf570f0c-8c17-4ba8-b658-69d38e4f37a9', 'ofcavaxc:png', 'Pangolin', 18, UnderlyingAsset['avaxc:png']),
  ofcAvaxErc20('6753faa0-7c76-4c97-ad78-667ff2416c62', 'ofcavaxc:qi', 'BenQi', 18, UnderlyingAsset['avaxc:qi']),
  ofcAvaxErc20('786e03a4-c156-48ea-8782-42ea3c63c5a3', 'ofcavaxc:sbc', 'Stable Coin', 18, UnderlyingAsset['avaxc:sbc']),
  ofcAvaxErc20('300dbac5-76a3-4ed5-96fb-1d7898da4b4e', 'ofcavaxc:usdc', 'USD Coin', 6, UnderlyingAsset['avaxc:usdc']),
  ofcAvaxErc20('974e85e7-d6ad-4a5a-9aea-cae055842f36', 'ofcavaxc:usdc-e', 'USD Coin', 6, UnderlyingAsset['avaxc:usdc']),
  ofcAvaxErc20('861e2833-90be-45ec-8c8b-a41b1b86fac3', 'ofcavaxc:usdt', 'Tether USD', 6, UnderlyingAsset['avaxc:usdt']),
  ofcAvaxErc20(
    'e56e42a8-1566-4b5b-a2f3-5439278b1e8c',
    'ofcavaxc:usdt-e',
    'Tether USD',
    6,
    UnderlyingAsset['avaxc:usdt']
  ),
  ofcAvaxErc20(
    '3986ecd8-dda6-4b30-8883-b6bf111e4624',
    'ofcavaxc:wbtc-e',
    'Wrapped BTC',
    8,
    UnderlyingAsset['avaxc:wbtc']
  ),
  ofcAvaxErc20(
    '26281e88-f83a-4b13-b69d-b8a7ce9f4598',
    'ofcavaxc:weth-e',
    'Wrapped ETH',
    18,
    UnderlyingAsset['avaxc:weth']
  ),
  ofcAvaxErc20('caeec903-4c42-4d03-8cee-91319ab708c9', 'ofcavaxc:xava', 'Avalaunch', 18, UnderlyingAsset['avaxc:xava']),
  ofcAvaxErc20('7ab1e706-8751-4e9a-b710-c56540a24c11', 'ofcavaxc:gunz', 'GUNZ', 18, UnderlyingAsset['avaxc:gunz']),
  tofcAvaxErc20(
    'e70417f4-61df-4622-a933-40a43f807923',
    'ofctavaxc:link',
    'Test Chainlink',
    18,
    UnderlyingAsset['avaxc:link']
  ),
  ofcAvaxErc20(
    '49608052-e4ea-4623-9732-595368ff053b',
    'ofcavaxc:shrap',
    'Shrapnel',
    18,
    UnderlyingAsset['avaxc:shrap']
  ),
  ofcAvaxErc20(
    'e348a290-b22b-40aa-b23f-91f2ffbdea24',
    'ofcavaxc:spxux',
    'WisdomTree 500 Digital Fund',
    18,
    UnderlyingAsset['avaxc:spxux']
  ),
  ofcAvaxErc20('9fb77e47-8916-4dcb-ac10-e11fa07172fb', 'ofcavaxc:nxpc', 'NEXPACE', 18, UnderlyingAsset['avaxc:nxpc']),
  ofcOpethErc20('10259b23-2e2e-4574-b146-b49f1119600f', 'ofcopeth:op', 'Optimism', 18, UnderlyingAsset['opeth:op']),
  ofcOpethErc20(
    'a6087e85-6c4a-40c5-83f0-3ebeabd8e39b',
    'ofcopeth:spxux',
    'Optimism',
    18,
    UnderlyingAsset['opeth:spxux']
  ),
  ofcOpethErc20(
    'f5e5e260-d97b-462a-90b3-537b26f765dd',
    'ofcopeth:flttx',
    'WisdomTree Floating Rate Treasury Digital Fund',
    18,
    UnderlyingAsset['opeth:flttx']
  ),
  ofcOpethErc20(
    '4560eaf9-c40f-41ec-8903-092392e5cd74',
    'ofcopeth:wtsix',
    'WisdomTree Short-Duration Income Digital Fund',
    18,
    UnderlyingAsset['opeth:wtsix']
  ),
  ofcOpethErc20(
    '2a533174-f66a-455c-8d0f-952d69efc37b',
    'ofcopeth:modrx',
    'WisdomTree Siegel Moderate Digital Fund',
    18,
    UnderlyingAsset['opeth:modrx']
  ),
  ofcOpethErc20(
    '059ad416-681d-41c0-86b3-24e6d7025f8a',
    'ofcopeth:techx',
    'WisdomTree Technology & Innovation 100 Digital Fund',
    18,
    UnderlyingAsset['opeth:techx']
  ),
  ofcOpethErc20(
    '71121dfa-43cf-416d-ac41-6e3237445028',
    'ofcopeth:wtsyx',
    'WisdomTree Short-Term Treasury Digital Fund',
    18,
    UnderlyingAsset['opeth:wtsyx']
  ),
  ofcOpethErc20(
    'ea0cb88d-37d7-45e5-82dd-715b8b964b55',
    'ofcopeth:wtlgx',
    'WisdomTree Long Term Treasury Digital Fund',
    18,
    UnderlyingAsset['opeth:wtlgx']
  ),
  ofcOpethErc20(
    '3c303aea-c912-494e-93cc-23e25e99abc8',
    'ofcopeth:wttsx',
    'WisdomTree 3-7 Year Treasury Digital Fund',
    18,
    UnderlyingAsset['opeth:wttsx']
  ),
  ofcOpethErc20(
    'cf048832-0311-4341-bb78-80724fa1f222',
    'ofcopeth:tipsx',
    'WisdomTree TIPS Digital Fund',
    18,
    UnderlyingAsset['opeth:tipsx']
  ),
  ofcOpethErc20(
    '324af1d2-238e-493c-9a26-eae8297d55a1',
    'ofcopeth:wtstx',
    'WisdomTree 7-10 Year Treasury Digital Fund',
    18,
    UnderlyingAsset['opeth:wtstx']
  ),
  ofcOpethErc20(
    '578c50aa-5f5c-4d81-b141-6f11ab3d9a70',
    'ofcopeth:wtgxx',
    'WisdomTree Government Money Market Digital Fund',
    18,
    UnderlyingAsset['opeth:wtgxx']
  ),
  ofcOpethErc20(
    '7a1779b4-1811-4128-a470-d7cb43eb68e3',
    'ofcopeth:lngvx',
    'WisdomTree Siegel Longevity Digital Fund',
    18,
    UnderlyingAsset['opeth:lngvx']
  ),
  ofcOpethErc20(
    '46b0e5c9-b7ea-492a-a1f7-325993dee5a4',
    'ofcopeth:eqtyx',
    'WisdomTree Siegel Global Equity Digital Fund',
    18,
    UnderlyingAsset['opeth:eqtyx']
  ),
  ofcBscToken('a79933f5-a9d2-4a29-a948-79313a569988', 'ofcbsc:cfx', 'BSC Conflux', 18, UnderlyingAsset['bsc:cfx']),
  ofcBscToken('c6f5df09-5a21-468b-89cc-f626d02d74d0', 'ofcbsc:oort', 'OORT', 18, UnderlyingAsset['bsc:oort']),
  ofcBscToken(
    '7e8cb701-0f63-4105-be1d-8b20fd42b093',
    'ofcbsc:cake',
    'PancakeSwap Token',
    18,
    UnderlyingAsset['bsc:cake']
  ),
  ofcBscToken('fae56463-dc06-42cd-ad8b-5b4f6bbabffc', 'ofcbsc:usd1', 'USD1', 18, UnderlyingAsset['bsc:usd1']),
  ofcBscToken(
    '66583648-3200-4221-a677-930973dbcd72',
    'ofcbsc:twt',
    'Trust Wallet Token',
    18,
    UnderlyingAsset['bsc:twt']
  ),
  ofcBscToken('822d85d7-f42d-40de-a14c-220a375eda3f', 'ofcbsc:sfp', 'SafePal Token', 18, UnderlyingAsset['bsc:sfp']),
  ofcBscToken('10226e82-2fac-49f4-8ee0-e0f7affeaeec', 'ofcbsc:mask', 'Mask Network', 18, UnderlyingAsset['bsc:mask']),
  ofcBscToken('a1380903-6d91-4555-b8ef-74b1bcd993d0', 'ofcbsc:usdt', 'BSC-USD', 18, UnderlyingAsset['bsc:usdt']),
  ofcBscToken('6a1e8b8c-4d7e-4f9a-9d8f-f6e72f8c7e65', 'ofcbsc:solv', 'SOLV Protocol', 9, UnderlyingAsset['bsc:solv']),
  ofcBscToken('f8c3d7b5-2d9e-4b3f-8a1e-7c6d9e3a2f4b', 'ofcbsc:brise', 'Bitrise Token', 9, UnderlyingAsset['bsc:brise']),
  ofcBscToken('2e9f4c6b-8a7d-4b2e-9d3f-7c6a5e8b1f2a', 'ofcbsc:bsw', 'Biswap', 18, UnderlyingAsset['bsc:bsw']),
  ofcBscToken(
    '7c3f2e8a-9d1f-4b6a-8e7b-1f9e4c5d2a6f',
    'ofcbsc:burger',
    'Burger Swap',
    18,
    UnderlyingAsset['bsc:burger']
  ),
  ofcBscToken('4b2e7c6a-9d8f-3f1e-8a2f-5c6d9e7b1a3f', 'ofcbsc:bnx', 'BinaryX', 18, UnderlyingAsset['bsc:bnx']),
  ofcBscToken('3f1e9d8f-7c6a-2e4b-8a5f-1b2e6c7a9d6f', 'ofcbsc:bake', 'BakeryToken', 18, UnderlyingAsset['bsc:bake']),
  ofcBscToken(
    '8a7d9f6c-5e4b-1f2a-8f7c-9d6a8e2b1c5f',
    'ofcbsc:busd',
    'Binance USD Token',
    18,
    UnderlyingAsset['bsc:busd']
  ),
  ofcBscToken('1f9d3f6a-7c4b-2a2e-9e5c-6b1e8f7a2c9d', 'ofcbsc:hook', 'Hook Token', 18, UnderlyingAsset['bsc:hook']),
  ofcBscToken(
    '5c6a9d8f-7b4e-3f2e-9a1f-2e7c1e6a9b3f',
    'ofcbsc:ksm',
    'Kusama (Binance Pegged)',
    5,
    UnderlyingAsset['bsc:ksm']
  ),
  ofcBscToken(
    '7c9a8f6a-5e4b-1f2e-af7b-9d6a1e8a2c5f',
    'ofcbsc:vet',
    'VeChain (Binance Pegged)',
    9,
    UnderlyingAsset['bsc:vet']
  ),
  ofcBscToken('9d8f6a7c-3f1e-4b2e-8a5f-1e6a9c7a2b3f', 'ofcbsc:litt', 'LitLabToken', 18, UnderlyingAsset['bsc:litt']),
  ofcBscToken('4b1e9f6c-7c3f-3a2e-9d5f-6b1a2e7c8a3f', 'ofcbsc:xvs', 'Venus', 18, UnderlyingAsset['bsc:xvs']),
  ofcBscToken('7c6a9d8f-1f2e-4b3f-8a5f-9e2b1e6a7c9d', 'ofcbsc:epx', 'Ellipsis X', 18, UnderlyingAsset['bsc:epx']),
  ofcBscToken('8a1e9d6f-7c3f-4b2e-9d5f-6b7a2c8a1e3f', 'ofcbsc:usdc', 'USDC', 18, UnderlyingAsset['bsc:usdc']),
  ofcBscToken('5c7a9d8f-4b1e-3f2e-8a9f-6a1e7c9d2b3f', 'ofcbsc:dd', 'Diment Dollar', 6, UnderlyingAsset['bsc:dd']),
  ofcBscToken(
    '7c3f9d6a-1f2e-3a5f-8b2e-9e7a1c8a9b5f',
    'ofcbsc:ltc',
    'Binance-Peg Litecoin Token',
    18,
    UnderlyingAsset['bsc:ltc']
  ),
  ofcBscToken('4b1e9d6f-7c3f-1a2e-9d5f-6b1a2e7c8a9f', 'ofcbsc:matic', 'Matic Token', 18, UnderlyingAsset['bsc:matic']),
  ofcBscToken('7c9d8f6a-5e4b-1f2e-bf7b-9e6a1e8a2c5f', 'ofcbsc:mbox', 'Mobox', 18, UnderlyingAsset['bsc:mbox']),
  ofcBscToken(
    '8a1f9d6c-7c3f-4b2e-9d5f-6b7a2c8a1e3f',
    'ofcbsc:mdt',
    'Measurable Data Token',
    18,
    UnderlyingAsset['bsc:mdt']
  ),
  ofcBscToken('5c7a8f6a-4b1e-3f2e-9d9f-6a1e7c9d2b3f', 'ofcbsc:nuls', 'Nuls', 8, UnderlyingAsset['bsc:nuls']),
  ofcBscToken(
    '7c3f9d6a-1f2e-1a5f-bb2e-9e7a1c8a9b5f',
    'ofcbsc:ont',
    'Binance-Peg Ontology Token',
    18,
    UnderlyingAsset['bsc:ont']
  ),
  ofcBscToken('9e7b8f6a-3f1d-4b2e-8c9a-5f6c1e8a2b3f', 'ofcbsc:orn', 'Orion Protocol', 8, UnderlyingAsset['bsc:orn']),
  ofcBscToken(
    '5c6a9d8f-7b4e-3f2e-8a1f-2e7c1e6a9b3f',
    'ofcbsc:porto',
    'FC Porto Fan Token',
    8,
    UnderlyingAsset['bsc:porto']
  ),
  ofcBscToken('8a2e9d6f-7c3f-4b2e-9d5f-6b7a2c8a1e3f', 'ofcbsc:reef', 'Reef.finance', 18, UnderlyingAsset['bsc:reef']),
  ofcBscToken('4e2f9b6a-1c8d-4f7b-9d3e-7a5c6b8e2f1a', 'ofcbsc:renbtc', 'renBTC', 8, UnderlyingAsset['bsc:renbtc']),
  ofcBscToken(
    '3f1e7c8a-9d6f-5b2e-ab9d-6a7c9e2f1b5a',
    'ofcbsc:snx',
    'Binance-Peg Synthetix Network Token',
    18,
    UnderlyingAsset['bsc:snx']
  ),
  ofcBscToken('7c6a8f1e-3f9d-4b2e-9e5f-1a7c9b6f2e5a', 'ofcbsc:tking', 'Tiger King', 18, UnderlyingAsset['bsc:tking']),
  ofcBscToken(
    '9d3f6a8f-7c1e-4b2e-8f9e-2a7c9b6f8e1a',
    'ofcbsc:tlm',
    'Alien Worlds Trilium',
    4,
    UnderlyingAsset['bsc:tlm']
  ),
  ofcBscToken('5c6a7f8e-4b9d-3f2e-8a9f-7c1e9b6a2f3e', 'ofcbsc:ton', 'Wrapped TON Coin', 9, UnderlyingAsset['bsc:ton']),
  ofcBscToken('3f1e8f7c-6a9d-4b2e-9e5f-7a1c9b6f2e5a', 'ofcbsc:trx', 'TRON', 6, UnderlyingAsset['bsc:trx']),
  ofcBscToken('7c9e8f1e-3f6a-4b2e-8f9d-8a7c1b6f2e5a', 'ofcbsc:wbnb', 'Wrapped BNB', 18, UnderlyingAsset['bsc:wbnb']),
  ofcBscToken('9d7f6a1e-8c3f-4b2e-8f9e-7a8c9b6f2e1a', 'ofcbsc:win', 'WINk', 18, UnderlyingAsset['bsc:win']),
  ofcBscToken('5c7a8f9e-4b1e-3f2e-9d6f-1c8a1b6f2e5a', 'ofcbsc:wrx', 'WazirX New', 18, UnderlyingAsset['bsc:wrx']),
  ofcBscToken(
    '8a9f6a7c-1e3f-4b2e-9d5f-7c8a9b6f2e1a',
    'ofcbsc:yfii',
    'Binance-Peg YFII.finance Token',
    18,
    UnderlyingAsset['bsc:yfii']
  ),
  ofcBscToken('9d6f7a1e-3f8c-4b2e-af9e-8a7c9b6f2e5a', 'ofcbsc:zil', 'Zilliqa', 12, UnderlyingAsset['bsc:zil']),
  ofcBscToken('7c3f8f1e-9d6a-4b2e-8f9e-7a8c9b6f2e1a', 'ofcbsc:1inch', '1INCH Token', 18, UnderlyingAsset['bsc:1inch']),
  ofcBscToken(
    '5c9d7f6a-4b1e-3f2e-9d8f-7c1a8b6f2e5a',
    'ofcbsc:ada',
    'Binance-Peg Cardano Token',
    18,
    UnderlyingAsset['bsc:ada']
  ),
  ofcBscToken('9e8f6a1e-3f7c-4b2e-8f9d-8a7c9b6f2e5a', 'ofcbsc:alice', 'ALICE', 6, UnderlyingAsset['bsc:alice']),
  ofcBscToken('7c1e9f8a-3f6a-4b2e-8f9d-2a8c9b6f2e1a', 'ofcbsc:ankr', 'Ankr', 18, UnderlyingAsset['bsc:ankr']),
  ofcBscToken('9d5f6a1e-8c3f-4b2e-8f9e-8a7c9b6f2e1a', 'ofcbsc:beta', 'Beta Token', 18, UnderlyingAsset['bsc:beta']),
  ofcBscToken(
    '5c7a8f9e-4b1e-3f2e-9d9f-7c8a1b6f2e5a',
    'ofcbsc:avax',
    'Binance-Peg Avalanche Token',
    18,
    UnderlyingAsset['bsc:avax']
  ),
  ofcBscToken('8a9f7c3f-1e5f-4b2e-9d6a-7c8a9b6f2e5a', 'ofcbsc:btt', 'BitTorrent', 18, UnderlyingAsset['bsc:btt']),
  ofcBscToken(
    '9d6f8a7c-3f1e-4b2e-af9e-aa7c9b6f2e5a',
    'ofcbsc:celr',
    'Binance-Peg Celer Token',
    18,
    UnderlyingAsset['bsc:celr']
  ),
  ofcBscToken('7c1e9d8f-3f6a-4b2e-af9e-7a8c9b6f2e1a', 'ofcbsc:chr', 'Chroma', 6, UnderlyingAsset['bsc:chr']),
  ofcBscToken(
    '9e8f6a7c-3f1d-4b2e-af9e-8a721b6f2e5a',
    'ofcbsc:coti',
    'Binance-Peg COTI Token',
    18,
    UnderlyingAsset['bsc:coti']
  ),
  ofcBscToken('5c9d7f66-4b1e-3f2e-9d8f-7c1e8b6f2e5a', 'ofcbsc:cream', 'Cream', 18, UnderlyingAsset['bsc:cream']),
  ofcBscToken('7c8f9d6a-1e3f-4b2e-8f9e-7a9c1b6f2e5a', 'ofcbsc:dar', 'Dalarnia', 6, UnderlyingAsset['bsc:dar']),
  ofcBscToken(
    '9e5f1a1e-3f7c-4b2e-9d8f-8a7c9b6f2e1a',
    'ofcbsc:degov2',
    'dego.finance',
    18,
    UnderlyingAsset['bsc:degov2']
  ),
  ofcBscToken('7c3f8a1e-9d6f-4b2e-9f9e-7a8c9b6f2e5a', 'ofcbsc:dodo', 'DODO bird', 18, UnderlyingAsset['bsc:dodo']),
  ofcBscToken('5c7a9f8e-4b1e-3f2e-9d6f-7c8a1b6f2e5a', 'ofcbsc:elon', 'Dogelon Mars', 18, UnderlyingAsset['bsc:elon']),
  ofcBscToken(
    '8a9f7c6a-1e3f-4b2e-9f9d-7a8c9b6f2e5a',
    'ofcbsc:etc',
    'Binance-Peg Ethereum Classic',
    18,
    UnderlyingAsset['bsc:etc']
  ),
  ofcBscToken(
    '9d628a7c-3f1e-4b2e-af9e-1a8c9b6f2e5a',
    'ofcbsc:front',
    'Frontier Token',
    18,
    UnderlyingAsset['bsc:front']
  ),
  ofcBscToken('7c1e9f8a-3f6a-4b2e-af9d-7a8c9b6f2e1a', 'ofcbsc:hft', 'Hashflow', 18, UnderlyingAsset['bsc:hft']),
  ofcBscToken(
    '9e8f6a7c-3f1d-4b2e-bf9e-8a7c1b6f2e5a',
    'ofcbsc:high',
    'Highstreet Token',
    18,
    UnderlyingAsset['bsc:high']
  ),
  ofcBscToken(
    '5c977f6a-4b1e-3f2e-9d8f-7c1e8b6f2e5a',
    'ofcbsc:inj',
    'Injective Protocol',
    18,
    UnderlyingAsset['bsc:inj']
  ),
  ofcBscToken(
    '7c8f9d6a-1e3f-4b2e-bf9e-7a9c1b6f2e5a',
    'ofcbsc:iotx',
    'Binance-Peg IoTeX Network',
    18,
    UnderlyingAsset['bsc:iotx']
  ),
  ofcBscToken('9e5f6a1e-3f7c-4b2e-9d8f-2a7c9b6f2e1a', 'ofcbsc:auto', 'AUTOv2', 18, UnderlyingAsset['bsc:auto']),
  ofcBscToken('7c3f8a1e-9d6f-4b2e-8f9e-7a8c9b6f2e5a', 'ofcbsc:fet', 'Fetch', 18, UnderlyingAsset['bsc:fet']),
  ofcBscToken('1c7a9f8e-4b1e-3f2e-9d6f-7c8a1b6f2e5a', 'ofcbsc:kas', 'Kaspa', 18, UnderlyingAsset['bsc:kas']),
  ofcBscToken('8a1f7c6a-1e3f-4b2e-8f9d-7a8c9b6f2e5a', 'ofcbsc:lit', 'Litentry', 18, UnderlyingAsset['bsc:lit']),
  ofcBscToken('936f8a7c-3f1e-4b2e-af9e-1a8c9b6f2e5a', 'ofcbsc:mana', 'Decentraland', 18, UnderlyingAsset['bsc:mana']),
  ofcBscToken(
    '7c1e9f8a-3f6a-4b2e-bf9d-7a8c9b6f2e1a',
    'ofcbsc:shib',
    'Binance-Peg SHIBA INU Token',
    18,
    UnderlyingAsset['bsc:shib']
  ),
  ofcBscToken('9e8f6a7c-3f1d-4b2e-af9e-8a7c1b6f2e5a', 'ofcbsc:sxp', 'Swipe', 18, UnderlyingAsset['bsc:sxp']),
  ofcBscToken('5c9d7f6a-4b1e-3f2e-9d8f-7c1e8b6f2e5a', 'ofcbsc:nnn', 'Novem Gold Token', 18, UnderlyingAsset['bsc:nnn']),
  ofcBscToken('7c8f9d6a-1e3f-4b2e-af9e-7a1c1b6f2e5a', 'ofcbsc:nvm', 'Novem Pro Token', 18, UnderlyingAsset['bsc:nvm']),
  ofcBscToken('9e5f6a1e-3f7c-4b2e-9d8f-8a7c9b3f2e1a', 'ofcbsc:jasmy', 'Jasmy Coin', 18, UnderlyingAsset['bsc:jasmy']),
  ofcBscToken('7c3f811e-9d6f-4b2e-af9e-7a8c9b6f2e5a', 'ofcbsc:near', 'NEAR Token', 18, UnderlyingAsset['bsc:near']),
  ofcBscToken(
    '5c7a9f2e-4b1e-3f2e-9d6f-7c8a1b6f2e5a',
    'ofcbsc:ocean',
    'Ocean Protocol',
    18,
    UnderlyingAsset['bsc:ocean']
  ),
  ofcBscToken('8a9f7c6a-1e3f-4b2e-8f9d-7a8c9b6f1e5a', 'ofcbsc:sand', 'The Sandbox', 18, UnderlyingAsset['bsc:sand']),
  ofcBscToken('9d6f8a4c-3f1e-4b2e-af9e-1a8c9b6f2e5a', 'ofcbsc:tusd', 'TrueUSD', 18, UnderlyingAsset['bsc:tusd']),
  ofcBscToken('7c1e9f8a-3f6a-4b2e-bf9d-7a8c9b1f2e1a', 'ofcbsc:wrose', 'Wrapped ROSE', 18, UnderlyingAsset['bsc:wrose']),
  ofcBscToken(
    '7c8f9d6a-1e3f-4b2e-af9e-7a9c126f2e5a',
    'ofcbsc:edu',
    'Open Campus EDU Coin',
    18,
    UnderlyingAsset['bsc:edu']
  ),
  ofcBscToken('9e5f6a1e-3f7c-4b2e-9d8f-8a7c9b4f2e1a', 'ofcbsc:mrs', 'Metars Genesis', 18, UnderlyingAsset['bsc:mrs']),
  ofcBscToken(
    '7c3f821e-9d6f-4b2e-af9e-7a8c9b6f2e5a',
    'ofcbsc:ong',
    'Ontology Gas Token',
    9,
    UnderlyingAsset['bsc:ong']
  ),
  ofcBscToken(
    '5c7a9f3e-4b1e-3f2e-9d6f-7c8a1b6f2e5a',
    'ofcbsc:ctk',
    'Shentu CertiK Token',
    6,
    UnderlyingAsset['bsc:ctk']
  ),
  ofcBscToken(
    '1a9f7c6a-1e3f-4b2e-af9d-7a8c9b6f2e5a',
    'ofcbsc:rdnt',
    'Radiant Capital',
    18,
    UnderlyingAsset['bsc:rdnt']
  ),
  ofcBscToken('9d6f8a7c-3f1e-4b2e-9f9e-1a8c9b6f2e5a', 'ofcbsc:mbx', 'MARBLEX', 18, UnderlyingAsset['bsc:mbx']),
  ofcBscToken('1c1e9f8a-3f6a-4b2e-af9d-7a8c9b6f2e1a', 'ofcbsc:mav', 'Maverick Token', 18, UnderlyingAsset['bsc:mav']),
  ofcBscToken('9e8f6a7c-311d-4b2e-8f9e-8a7c1b6f2e5a', 'ofcbsc:mct', 'MetaCraftToken', 18, UnderlyingAsset['bsc:mct']),
  ofcBscToken(
    '519d7f6a-4b1e-3f2e-9d8f-7c1e8b6f2e5a',
    'ofcbsc:thunder',
    'BSC-Peg Thunder Token',
    18,
    UnderlyingAsset['bsc:thunder']
  ),
  ofcBscToken('7c8f9d6a-1e3f-4b2e-af9e-7a9c1b3f2e5a', 'ofcbsc:atlas', 'Star Atlas', 8, UnderlyingAsset['bsc:atlas']),
  ofcBscToken('9e556a1e-3f7c-4b2e-9d8f-8a7c9b6f2e1a', 'ofcbsc:vidt', 'VIDT DAO', 18, UnderlyingAsset['bsc:vidt']),
  ofcBscToken(
    '7c3f8a1e-9d6f-4b2e-bf9e-7a8c9b6f2e5a',
    'ofcbsc:pax',
    'Binance-Peg Paxos Standard',
    18,
    UnderlyingAsset['bsc:pax']
  ),
  ofcBscToken(
    '5c7a9f84-4b1e-3f2e-9d6f-7c8a1b6f2e5a',
    'ofcbsc:unfi',
    'Unifi Protocol DAO',
    18,
    UnderlyingAsset['bsc:unfi']
  ),
  ofcBscToken('8a9f7c62-1e3f-4b2e-af9d-7a8c9b6f2e5a', 'ofcbsc:chess', 'Tranchess', 18, UnderlyingAsset['bsc:chess']),
  ofcBscToken(
    '9d6f8a7c-311e-4b2e-8f9e-1a8c9b6f2e5a',
    'ofcbsc:pols',
    'PolkastarterToken',
    18,
    UnderlyingAsset['bsc:pols']
  ),
  ofcBscToken(
    '7c119f8a-3f6a-4b2e-bf9d-7a8c9b6f2e1a',
    'ofcbsc:uft',
    'UniLend Finance Token',
    18,
    UnderlyingAsset['bsc:uft']
  ),
  ofcBscToken('9e8f6a7c-3f1d-4b2e-9f9e-8a7c1b6f2e5a', 'ofcbsc:wing', 'Wing Finance', 9, UnderlyingAsset['bsc:wing']),
  ofcBscToken(
    '529d7f6a-4b1e-3f2e-9d8f-7c1e8b6f2e5a',
    'ofcbsc:santos',
    'FC Santos Fan Token',
    8,
    UnderlyingAsset['bsc:santos']
  ),
  ofcBscToken(
    '7c8f916a-1e3f-4b2e-8f9e-7a9c1b6f2e5a',
    'ofcbsc:lazio',
    'FC Lazio Fan Token',
    8,
    UnderlyingAsset['bsc:lazio']
  ),
  ofcBscToken(
    '9e5f6a16-3f7c-4b2e-9d8f-8a7c9b6f2e1a',
    'ofcbsc:swap',
    'TrustSwap Token',
    18,
    UnderlyingAsset['bsc:swap']
  ),
  ofcBscToken('7c3f3a1e-9d6f-4b2e-af9e-7a8c9b6f2e5a', 'ofcbsc:troy', 'TROY', 18, UnderlyingAsset['bsc:troy']),
  ofcBscToken('5c7a8f9e-4b1e-3f2e-9d6f-2c8a1b6f2e5a', 'ofcbsc:volt', 'Volt Inu', 9, UnderlyingAsset['bsc:volt']),
  ofcBscToken(
    '8a9f7c63-1e3f-4b2e-af9d-7a8c9b6f2e5a',
    'ofcbsc:city',
    'Manchester City Fan Token',
    2,
    UnderlyingAsset['bsc:city']
  ),
  ofcBscToken('9d6f8a7c-3f1e-4b2e-8f9e-1a8c9b6f2e5a', 'ofcbsc:gft', 'Gifto', 18, UnderlyingAsset['bsc:gft']),
  ofcBscToken('7c1e9f8a-3f6a-4b2e-8f9d-7a8c9b6f2e1a', 'ofcbsc:glmr', 'Moonbeam', 18, UnderlyingAsset['bsc:glmr']),
  ofcBscToken(
    '9e8f6a7c-3f1d-4b2e-af9e-817c1b6f2e5a',
    'ofcbsc:gmt',
    'Green Metaverse Token',
    8,
    UnderlyingAsset['bsc:gmt']
  ),
  ofcBscToken('539d7f6a-4b1e-3f2e-9d8f-7c1e8b6f2e5a', 'ofcbsc:h2o', 'H2O DAO', 18, UnderlyingAsset['bsc:h2o']),
  ofcBscToken('7c8f9d6a-1e3f-4b2e-af9e-7a9c1b642e5a', 'ofcbsc:flux', 'Flux', 8, UnderlyingAsset['bsc:flux']),
  ofcBscToken('9e5f6a7e-3f7c-4b2e-9d8f-8a7c9b6f2e1a', 'ofcbsc:lto', 'LTO Network', 18, UnderlyingAsset['bsc:lto']),
  ofcBscToken('7c3f8a1e-9d6f-4b2e-af9e-7a8c4b6f2e5a', 'ofcbsc:kmd', 'Komodo', 18, UnderlyingAsset['bsc:kmd']),
  ofcBscToken(
    '5c7a8f9e-4b1e-3f2e-9d6f-3c8a1b6f2e5a',
    'ofcbsc:farm',
    'Harvest Finance',
    18,
    UnderlyingAsset['bsc:farm']
  ),
  ofcBscToken('8a9f4c6a-1e3f-4b2e-af9d-7a8c9b6f2e5a', 'ofcbsc:lina', 'Linear Finance', 18, UnderlyingAsset['bsc:lina']),
  ofcBscToken('721e9f8a-3f6a-4b2e-af9d-7a8c9b6f2e1a', 'ofcbsc:firo', 'Firo', 8, UnderlyingAsset['bsc:firo']),
  ofcBscToken(
    '9e8f6a7c-3f1d-4b2e-8f9e-8a7c1b6f2e5a',
    'ofcbsc:fdusd',
    'First Digital USD',
    18,
    UnderlyingAsset['bsc:fdusd']
  ),
  ofcBscToken('549d7f6a-4b1e-3f2e-9d8f-7c1e8b6f2e5a', 'ofcbsc:floki', 'FLOKI', 9, UnderlyingAsset['bsc:floki']),
  ofcBscToken('7c8f9d6a-1e3f-4b2e-8f9e-7a9c126f2e5a', 'ofcbsc:ldo', 'LIDO DAO', 18, UnderlyingAsset['bsc:ldo']),
  ofcBscToken('9e8f6a1e-3f7c-4b2e-9d8f-8a7c9b6f2e1a', 'ofcbsc:eos', 'EOS', 18, UnderlyingAsset['bsc:eos']),
  ofcBscToken('7c3f8a1e-9d1f-4b2e-bf9e-7a8c9b6f2e5a', 'ofcbsc:om', 'MANTRA DAO', 18, UnderlyingAsset['bsc:om']),
  ofcBscToken('5c7a8f9e-4b1e-3f2e-9d6f-7c8a1b6f2e5a', 'ofcbsc:usdd', 'USDD', 18, UnderlyingAsset['bsc:usdd']),
  ofcBscToken(
    '8a9f7c6a-1e3f-4b2e-bf9d-7a8c9b6f2e5a',
    'ofcbsc:alpaca',
    'Alpaca Finance',
    18,
    UnderlyingAsset['bsc:alpaca']
  ),
  ofcBscToken(
    '9d6f817c-3f1e-4b2e-af9e-1a8c9b6f2e5a',
    'ofcbsc:alpine',
    'Alpine F1 Team Fan Token',
    8,
    UnderlyingAsset['bsc:alpine']
  ),
  ofcBscToken('7c1e9f8a-3f6a-4b2e-8f9d-1a8c9b6f2e1a', 'ofcbsc:tko', 'Toko Token', 18, UnderlyingAsset['bsc:tko']),
  ofcBscToken('9e8f6a71-3f1d-4b2e-9f9e-8a7c1b6f2e5a', 'ofcbsc:vite', 'VITE', 18, UnderlyingAsset['bsc:vite']),
  ofcBscToken('5c9d5f6a-4b1e-3f2e-9d8f-7c1e8b6f2e5a', 'ofcbsc:mdx', 'Mdex', 18, UnderlyingAsset['bsc:mdx']),
  ofcBscToken('7c8f5d6a-1e3f-4b2e-af9e-7a9c1b6f2e5a', 'ofcbsc:multi', 'Multichain', 18, UnderlyingAsset['bsc:multi']),
  ofcBscToken(
    '7c3f8a1e-9d6f-4b2e-af9e-7a8c9b6f5e5a',
    'ofcbsc:psg',
    'Paris Saint-Germain Fan Token',
    2,
    UnderlyingAsset['bsc:psg']
  ),
  ofcBscToken('5c7a8f9e-4b1e-1f2e-9d6f-7c8a1b6f2e5a', 'ofcbsc:telos', 'Telos', 18, UnderlyingAsset['bsc:telos']),
  tofcBscToken(
    'bf8a52e5-f416-46ea-95c2-a920dc204233',
    'ofctbsc:usd1',
    'Test USD1 Token',
    18,
    UnderlyingAsset['tbsc:usd1']
  ),
  tofcBscToken(
    'e9174338-0d26-4f49-b111-3487b60c9912',
    'ofctbsc:stgusd1',
    'Test USD1 Token',
    18,
    UnderlyingAsset['tbsc:stgusd1']
  ),
  ofcPolygonErc20(
    '547ce68f-cb4c-4618-bef3-9a0ebe9facd2',
    'ofcpolygon:sbc',
    'Stable Coin',
    18,
    UnderlyingAsset['polygon:sbc']
  ),
  ofcPolygonErc20(
    '413cd9b9-503a-452d-b257-95a1c82ec5e4',
    'ofcpolygon:link',
    'ChainLink Token',
    18,
    UnderlyingAsset['polygon:link']
  ),
  ofcPolygonErc20(
    '42ec9712-e47b-43c2-bec3-18cbc18fd944',
    'ofcpolygon:usdcv2',
    'USD Coin (native)',
    6,
    UnderlyingAsset['polygon:usdcv2']
  ),
  ofcPolygonErc20(
    'b4381484-7f8d-4d20-aa19-5c99e9d230d6',
    'ofcpolygon:cnkt',
    'Coinnekt',
    18,
    UnderlyingAsset['polygon:cnkt']
  ),
  ofcPolygonErc20(
    'a63bf18b-3462-403c-93f5-ff1b608622c2',
    'ofcpolygon:usdc',
    'USD Coin',
    6,
    UnderlyingAsset['polygon:usdc']
  ),
  ofcPolygonErc20(
    '659e66ef-2265-48d4-a73c-f98e479944d1',
    'ofcpolygon:tusd',
    'TrueUSD',
    18,
    UnderlyingAsset['polygon:tusd']
  ),
  ofcPolygonErc20(
    '115e52f9-91bc-4e40-b1cb-046167bb4b09',
    'ofcpolygon:usdt',
    'Tether USD',
    6,
    UnderlyingAsset['polygon:usdt']
  ),
  ofcPolygonErc20(
    'c2e7a6d3-77bd-4a47-9cd5-cfa681a5bc95',
    'ofcpolygon:1inch-wormhole',
    '1INCH (Wormhole)',
    18,
    UnderlyingAsset['polygon:1inch']
  ),
  ofcPolygonErc20(
    '7957de12-d928-42ca-ad0b-624057e87065',
    'ofcpolygon:aave',
    'Aave',
    18,
    UnderlyingAsset['polygon:aave']
  ),
  ofcPolygonErc20(
    '7cdf8f51-1ade-434a-905f-882d8a8fc678',
    'ofcpolygon:sand',
    'SAND',
    18,
    UnderlyingAsset['polygon:sand']
  ),
  ofcPolygonErc20(
    'a6b29d29-412c-4dc9-9a26-edcc1339818a',
    'ofcpolygon:sol-wormhole',
    'Wrapped SOL (Wormhole)',
    9,
    UnderlyingAsset['polygon:sol']
  ),
  ofcPolygonErc20(
    '7a7e983f-44be-4692-8a94-b0c14574f96a',
    'ofcpolygon:wbtc',
    'Wrapped BTC',
    8,
    UnderlyingAsset['polygon:wbtc']
  ),
  ofcPolygonErc20(
    '6fb5df7d-95a1-47a8-b733-3bc99a82ce22',
    'ofcpolygon:mv',
    'GensoKishi Metaverse',
    18,
    UnderlyingAsset['polygon:mv']
  ),
  ofcPolygonErc20(
    '24fbf402-9446-4eee-ace1-94fef6983bfb',
    'ofcpolygon:bid',
    'BidNow',
    18,
    UnderlyingAsset['polygon:bid']
  ),
  ofcPolygonErc20(
    '6d951280-8086-41fe-bf48-7985b425dead',
    'ofcpolygon:tcs',
    'TCS Token',
    18,
    UnderlyingAsset['polygon:tcs']
  ),
  ofcPolygonErc20(
    'bde9aea4-027d-48c3-95c7-e1a74bc5aa06',
    'ofcpolygon:buidl',
    'BlackRock USD Institutional Digital Liquidity Fund',
    6,
    UnderlyingAsset['polygon:buidl']
  ),
  ofcPolygonErc20(
    '82855675-ecfa-4acb-a489-8d7b826d2783',
    'ofcpolygon:weth',
    'Wrapped Ether',
    18,
    UnderlyingAsset['polygon:weth']
  ),
  ofcPolygonErc20(
    'ea7f06d0-32b4-4f8d-b0ab-22e447e141fa',
    'ofcpolygon:dimo',
    'Dimo',
    18,
    UnderlyingAsset['polygon:dimo']
  ),
  ofcPolygonErc20(
    '16c4bfe4-5253-4491-8d7e-6d586f133443',
    'ofcpolygon:xsgd',
    'XSGD',
    6,
    UnderlyingAsset['polygon:xsgd']
  ),
  ofcPolygonErc20(
    '26eda2a9-0559-4f18-9bb7-547c2682b742',
    'ofcpolygon:treta',
    'Treta',
    18,
    UnderlyingAsset['polygon:treta']
  ),
  ofcPolygonErc20(
    'fb5952ae-514f-4b1b-a172-bf62d9c4dbf8',
    'ofcpolygon:vcnt',
    'ViciCoin',
    18,
    UnderlyingAsset['polygon:vcnt']
  ),
  ofcPolygonErc20(
    '7874696a-e285-450e-917d-369d524e2938',
    'ofcpolygon:vext',
    'Veloce',
    18,
    UnderlyingAsset['polygon:vext']
  ),
  ofcPolygonErc20(
    '62262f53-4859-427d-bcdf-62354bd1e641',
    'ofcpolygon:zed',
    'ZED RUN',
    18,
    UnderlyingAsset['polygon:zed']
  ),
  ofcPolygonErc20(
    '85b4ad95-1761-482a-8a57-ab7fdd845fb1',
    'ofcpolygon:ape',
    'ApeCoin',
    18,
    UnderlyingAsset['polygon:ape']
  ),
  ofcPolygonErc20(
    'd1ff60e6-cf15-4ef0-bf0b-a65313b3ac70',
    'ofcpolygon:cel',
    'Celsius',
    4,
    UnderlyingAsset['polygon:cel']
  ),
  ofcPolygonErc20(
    '78cdcaea-7668-41f3-bdd8-6ce7b44ea56b',
    'ofcpolygon:comp-wormhole',
    'Compound (Wormhole)',
    18,
    UnderlyingAsset['polygon:comp']
  ),
  ofcPolygonErc20('b1868a45-d1ab-43fd-8d15-55c86ba34428', 'ofcpolygon:crv', 'CRV', 18, UnderlyingAsset['polygon:crv']),
  ofcPolygonErc20(
    '4d7c8e4c-9ba8-420c-8982-29e0eb88d1e3',
    'ofcpolygon:dai',
    'Dai Stablecoin',
    18,
    UnderlyingAsset['polygon:dai']
  ),
  ofcPolygonErc20(
    'b44eba68-8c58-4323-80f0-ff699c209f3f',
    'ofcpolygon:fcd',
    'FreshCut Diamond',
    18,
    UnderlyingAsset['polygon:fcd']
  ),
  ofcPolygonErc20(
    '2cbc1c1b-dd57-4efe-94f8-cc5ca3fc4acf',
    'ofcpolygon:fly',
    'Flycoin',
    18,
    UnderlyingAsset['polygon:fly']
  ),
  ofcPolygonErc20(
    'b020d880-99a1-42bf-b471-ccbfd3a64b9d',
    'ofcpolygon:frax',
    'Frax',
    18,
    UnderlyingAsset['polygon:frax']
  ),
  ofcPolygonErc20(
    'c7d91dc9-c1c4-4a8d-883d-e9ab70c0b8b5',
    'ofcpolygon:gfc',
    'Gcoin',
    18,
    UnderlyingAsset['polygon:gfc']
  ),
  ofcPolygonErc20(
    '9d6be533-96a7-4d02-a757-4eaf38eba215',
    'ofcpolygon:rbw',
    'Rainbow Token',
    18,
    UnderlyingAsset['polygon:rbw']
  ),
  ofcPolygonErc20('b05a3d54-34ad-4dbd-aa9f-712da4bf0344', 'ofcpolygon:srm', 'Serum', 6, UnderlyingAsset['polygon:srm']),
  ofcPolygonErc20(
    '4e1f2154-cfba-4ffa-929c-aab96b9c15b6',
    'ofcpolygon:sushi',
    'Sushi',
    18,
    UnderlyingAsset['polygon:sushi']
  ),
  ofcPolygonErc20(
    '7b0679e0-7f0d-4c32-858c-e67398ad1e72',
    'ofcpolygon:wavax-wormhole',
    'Wrapped AVAX (wormhole)',
    18,
    UnderlyingAsset['polygon:wavax']
  ),
  ofcPolygonErc20(
    '43ae6089-cfd8-456e-9d22-56fde17bd22c',
    'ofcpolygon:wbnb-wormhole',
    'Wrapped BNB (Wormhole)',
    18,
    UnderlyingAsset['polygon:wbnb']
  ),
  ofcPolygonErc20(
    '7d6bb17c-2e0d-4fd3-af16-8e7d48b82c46',
    'ofcpolygon:wftm-wormhole',
    'Wrapped FTM (Wormhole)',
    18,
    UnderlyingAsset['polygon:wftm']
  ),
  ofcPolygonErc20(
    '3e68132e-ee5e-4c61-bad8-516e6a7a9d35',
    'ofcpolygon:wmatic',
    'Wrapped Matic',
    18,
    UnderlyingAsset['polygon:wmatic']
  ),
  ofcPolygonErc20(
    'd20e0df0-540c-4630-9cc1-c73705ef9df6',
    'ofcpolygon:woo',
    'Wootrade Network',
    18,
    UnderlyingAsset['polygon:woo']
  ),
  ofcPolygonErc20(
    '408a12d5-64ac-4bc1-8711-1c6546b8e2a7',
    'ofcpolygon:yfi-wormhole',
    'Wrapped YFI (Wormhole)',
    18,
    UnderlyingAsset['polygon:yfi']
  ),
  ofcPolygonErc20(
    '13d0ed50-0d6e-45cf-a90a-542103ad39d0',
    'ofcpolygon:moca',
    'Moca',
    18,
    UnderlyingAsset['polygon:moca']
  ),
  ofcPolygonErc20(
    'f534b522-2a14-43b2-95b1-a7da595a018e',
    'ofcpolygon:geod',
    'GEODNET',
    18,
    UnderlyingAsset['polygon:geod']
  ),
  ofcPolygonErc20(
    '9016007d-f142-49bc-a07d-c1351c784945',
    'ofcpolygon:copm',
    'COP Minteo',
    18,
    UnderlyingAsset['polygon:copm']
  ),
  ofcPolygonErc20(
    'e5812e67-f82d-4f9f-9018-9ed20ba2f871',
    'ofcpolygon:mask',
    'Mask Network',
    18,
    UnderlyingAsset['polygon:mask']
  ),
  tofcPolygonErc20(
    '62f4329d-11cd-4875-b91b-9ceae66c9439',
    'ofctpolygon:link',
    'Polygon Test LINK',
    18,
    UnderlyingAsset['tpolygon:link']
  ),
  tofcPolygonErc20(
    '47f2a012-400b-48c1-bad8-e6abfd5da568',
    'ofctpolygon:usdc',
    'USD Coin',
    6,
    UnderlyingAsset['tpolygon:usdc']
  ),
  tofcPolygonErc20(
    '2136098f-9949-43a9-90f2-d8e5f0855e5d',
    'ofctpolygon:usdt',
    'Tether USD',
    6,
    UnderlyingAsset['tpolygon:usdt']
  ),
  tofcPolygonErc20(
    '46100d09-4f3d-4b61-8f49-99d98b8f64c0',
    'ofctpolygon:xsgd',
    'XSGD',
    6,
    UnderlyingAsset['tpolygon:xsgd']
  ),
  tofcPolygonErc20(
    '6ea455da-2784-4717-a4f6-22b440465546',
    'ofctpolygon:testcopm',
    'TESTCOP Minteo',
    18,
    UnderlyingAsset['tpolygon:testcopm']
  ),

  ofcAlgoToken(
    'fec37305-8fb8-4c23-b42c-b4696d579eb9',
    'ofcalgo:usdc',
    'Algorand USDC',
    6,
    UnderlyingAsset['algo:USDC-31566704']
  ),

  tofcAlgoToken(
    'a4965de2-467b-45f6-9729-35f57fd6f035',
    'ofctalgo:usdc',
    'Test Algorand USDC',
    6,
    UnderlyingAsset['talgo:USDC-10458941']
  ),

  ofcHederaToken(
    'a7eceae2-145c-4d35-a8d4-3c1149c2fe06',
    'ofchbar:usdc',
    'Mainnet Hedera USD Coin',
    6,
    UnderlyingAsset.USDC
  ),
  ofcHederaToken(
    'd59935a2-e435-4ffa-b519-443310c80830',
    'ofchbar:karate',
    'Karate Combat',
    8,
    UnderlyingAsset['hbar:karate']
  ),
  ofcHederaToken(
    'f15365a0-924f-47aa-8e41-02022079a368',
    'ofchbar:sauce',
    'SaucerSwap',
    6,
    UnderlyingAsset['hbar:sauce']
  ),
  ofcHederaToken('25496b3d-0358-4f40-8ef4-2b8330e2d00c', 'ofchbar:dovu', 'DOVU', 8, UnderlyingAsset['hbar:dovu']),
  ofcHederaToken('9db9ba12-13e2-438f-a964-a853de847084', 'ofchbar:pack', 'HashPack', 6, UnderlyingAsset['hbar:pack']),
  ofcHederaToken('4b801f44-ede2-46e9-97df-89d641c0136e', 'ofchbar:jam', 'Tune.Fm', 8, UnderlyingAsset['hbar:jam']),
  ofcHederaToken('368ae3e4-edc1-496e-956d-e346c336c917', 'ofchbar:berry', 'Berry', 6, UnderlyingAsset['hbar:berry']),

  tofcHederaToken(
    'e12614d8-21de-4303-91fa-f13a44c4902a',
    'ofcthbar:usdc',
    'Testnet Hedera USD Coin',
    6,
    UnderlyingAsset.USDC
  ),

  ofcStellarToken(
    'fd90a80b-d615-434e-9821-1ef179a06071',
    'ofcxlm:usdc',
    'Stellar USDC',
    7,
    UnderlyingAsset['xlm:USDC-GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN']
  ),

  tofcStellarToken(
    '4883a062-c38c-43d9-92c6-7cec9aaef995',
    'ofctxlm:tst',
    'Test Stellar BitGo Test Token',
    7,
    UnderlyingAsset['txlm:TST-GBQTIOS3XGHB7LVYGBKQVJGCZ3R4JL5E4CBSWJ5ALIJUHBKS6263644L']
  ),
  tofcArbethErc20(
    '2489c0e2-c13f-4287-bd1f-03dcd0a8562e',
    'ofctarbeth:link',
    'Arbitrum Test LINK',
    18,
    UnderlyingAsset['tarbeth:link']
  ),
  ofcaptToken(
    '6d027643-3d96-4627-8312-1151a793d4f8',
    'ofcapt:usdc',
    'USD Coin',
    6,
    UnderlyingAsset['apt:usdc'],
    APT_OFC_TOKEN_FEATURES
  ),
  ofcaptToken(
    'd15ec98e-1c8f-4c2d-9ede-e34edb3980b5',
    'ofcapt:usdt',
    'USD Tether',
    6,
    UnderlyingAsset['apt:usdt'],
    APT_OFC_TOKEN_FEATURES
  ),
  ofcStxToken('2d2f9c7f-7d10-480e-a0ef-6893cf4d3493', 'ofcstx:sbtc', 'sBTC', 8, UnderlyingAsset['stx:sbtc']),
  ofcStxToken('cc76810a-e19c-4123-ad0c-be39ce08550a', 'ofcstx:susdh', 'sUSDH', 8, UnderlyingAsset['stx:susdh']),
  ofcStxToken('df131c24-8458-49ea-8f7d-7dcce6b13ad9', 'ofcstx:ststx', 'stSTX', 6, UnderlyingAsset['stx:ststx']),
  tofcStxToken('a7f63434-b424-4f8f-94d8-476f827e4d1b', 'ofctstx:tsbtc', 'Test sBTC', 8, UnderlyingAsset['tstx:tsbtc']),
  ofcStxToken('10210906-6701-4c25-a204-0fe7399bae83', 'ofcstx:alex', 'Alex Labs', 8, UnderlyingAsset['stx:alex']),
  ofcStxToken(
    '6eefa66f-3065-48db-b78f-3ae4e2172a41',
    'ofcstx:aeusdc',
    'Allbridge Bridged USDC',
    6,
    UnderlyingAsset['stx:aeusdc']
  ),
  ofcStxToken('b4ef967b-7aa3-4252-9366-bbcffffd1c4d', 'ofcstx:usdh', 'USDH', 8, UnderlyingAsset['stx:usdh']),
  ofcStxToken('511fc482-d962-4c29-9921-4a7d99405e64', 'ofcstx:welsh', 'Welsh', 6, UnderlyingAsset['stx:welsh']),
];
