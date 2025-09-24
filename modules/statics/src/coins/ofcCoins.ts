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
  ofcnep141Token,
  tofcnep141Token,
  ofcWorldErc20,
  tofcWorldErc20,
  ofcCoredaoErc20,
  tofcCoredaoErc20,
  ofcVetToken,
  tofcVetToken,
  ofcHashToken,
  tofcHashToken,
  tofcaptToken,
} from '../ofc';
import { UnderlyingAsset, CoinKind, CoinFeature } from '../base';

import {
  SOL_TOKEN_FEATURES,
  SOL_OFC_TOKEN_FEATURES,
  APT_OFC_TOKEN_FEATURES,
  ACCOUNT_COIN_DEFAULT_FEATURES,
} from '../coinFeatures';

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
  ofc('181974a6-b042-460e-acec-46733f8af941', 'ofchbar', 'Hedera', 8, UnderlyingAsset.HBAR, CoinKind.CRYPTO),
  ofc('140ac16e-e39a-49d0-ae69-60019ff35727', 'ofcbld', 'Agoric', 6, UnderlyingAsset.BLD, CoinKind.CRYPTO),
  ofc('8b4f4051-b447-479b-bc3e-88e30a496599', 'ofcbaby', 'Babylon', 6, UnderlyingAsset.BABY, CoinKind.CRYPTO),
  ofc('74cc3b48-25be-4477-8782-cbb1ea070eab', 'ofccronos', 'Cronos POS', 8, UnderlyingAsset.CRONOS, CoinKind.CRYPTO),
  ofc('273f9166-b72d-420f-bc10-61a36e27b909', 'ofcinitia', 'Initia', 6, UnderlyingAsset.INITIA, CoinKind.CRYPTO),
  ofc('c4f6ac74-dc03-47bd-bb47-f2008b414ea2', 'ofcasi', 'Fetch Native', 18, UnderlyingAsset.ASI, CoinKind.CRYPTO),
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
  ofc('5405ad60-40c2-4789-b6b3-79265f167669', 'ofckaia', 'Kaia', 18, UnderlyingAsset.KAIA, CoinKind.CRYPTO),
  tofc('1d41e93a-7de8-4e2e-a8bd-adc22cbe83e6', 'ofctkaia', 'Kaia Testnet', 18, UnderlyingAsset.KAIA, CoinKind.CRYPTO),
  ofc('499c7ae0-b21e-4b6d-8486-00980bb180d5', 'ofcsonic', 'Sonic', 18, UnderlyingAsset.SONIC, CoinKind.CRYPTO),
  tofc(
    '274e9430-daac-4bfa-b75a-ba4c5ec82f9d',
    'ofctsonic',
    'Sonic Testnet',
    18,
    UnderlyingAsset.SONIC,
    CoinKind.CRYPTO
  ),
  ofc(
    'ec31b18d-f034-4e84-837e-2c7d2908bbae',
    'ofchypeevm',
    'Hyperliquid EVM',
    18,
    UnderlyingAsset.HYPEEVM,
    CoinKind.CRYPTO
  ),
  tofc(
    '3eb80dc2-98bc-40ee-a27c-b4572e0d7270',
    'ofcthypeevm',
    'Hyperliquid EVM Testnet',
    18,
    UnderlyingAsset.HYPEEVM,
    CoinKind.CRYPTO
  ),
  ofc('c7350490-f1c0-4f76-8db4-832dc18a2efe', 'ofcseievm', 'Sei EVM', 18, UnderlyingAsset.SEIEVM, CoinKind.CRYPTO),
  tofc(
    '12d3f26a-dede-429b-8ba6-126293a8e02a',
    'ofctseievm',
    'Sei EVM Testnet',
    18,
    UnderlyingAsset.SEIEVM,
    CoinKind.CRYPTO
  ),
  ofc(
    '7e4fc86c-7caf-4cd3-b801-a650b0bfcf64',
    'ofcapechain',
    'Ape Chain',
    18,
    UnderlyingAsset.APECHAIN,
    CoinKind.CRYPTO
  ),
  tofc(
    '19dce006-56a3-4603-a0c8-2b1de20352a0',
    'ofctapechain',
    'Testnet Ape Chain',
    18,
    UnderlyingAsset.APECHAIN,
    CoinKind.CRYPTO
  ),
  ofc('300c6ba0-2d15-44a1-859d-76d48192e202', 'ofcsomi', 'Somnia', 18, UnderlyingAsset.SOMI, CoinKind.CRYPTO),
  tofc('06eee147-1299-435d-843f-9eea958e2b2f', 'ofctstt', 'Somnia Testnet', 18, UnderlyingAsset.STT, CoinKind.CRYPTO),
  ofc('aa8a01a7-ee09-41ad-be26-4b00342e3ae9', 'ofcctc', 'Creditcoin', 18, UnderlyingAsset.CTC, CoinKind.CRYPTO),
  tofc(
    'd67dbc97-5c8a-4935-a42c-7bee2fb1f631',
    'ofctctc',
    'Creditcoin Testnet',
    18,
    UnderlyingAsset.CTC,
    CoinKind.CRYPTO
  ),
  ofc('a2d09aaa-0aad-4d70-812a-347eb9d290ef', 'ofcphrs', 'Pharos', 18, UnderlyingAsset.PHRS, CoinKind.CRYPTO),
  tofc('2bdd4010-cc54-4794-ad64-b90e3bde7719', 'ofctphrs', 'Pharos Testnet', 18, UnderlyingAsset.PHRS, CoinKind.CRYPTO),
  ofc('6cb1c08b-ad84-4912-98fd-4cfe17c4438c', 'ofcirys', 'Irys', 18, UnderlyingAsset.IRYS, CoinKind.CRYPTO),
  tofc('5422a6f0-a3f9-41b1-937f-4d6171efed1f', 'ofctirys', 'Irys Testnet', 18, UnderlyingAsset.IRYS, CoinKind.CRYPTO),
  ofc('a7365ab8-913f-489e-9756-fe29cb2ea723', 'ofcog', 'Zero Gravity', 18, UnderlyingAsset.OG, CoinKind.CRYPTO),
  tofc(
    'b841c838-ffae-437f-9ad7-66dde05f7aba',
    'ofctog',
    'Zero Gravity Testnet',
    18,
    UnderlyingAsset.OG,
    CoinKind.CRYPTO
  ),
  ofc('b5f4efbd-d212-4547-a132-321aa39973f3', 'ofcbaseeth', 'Base Chain', 18, UnderlyingAsset.BASEETH, CoinKind.CRYPTO),
  tofc(
    'a4c8b07d-a4a5-4271-9640-01b2bb9795f8',
    'ofctbaseeth',
    'Base Sepolia Chain',
    18,
    UnderlyingAsset.BASEETH,
    CoinKind.CRYPTO
  ),
  ofc(
    'f6a05e7a-ef80-4cb4-87a0-92b3eb4025a8',
    'ofclineaeth',
    'Linea Ethereum',
    18,
    UnderlyingAsset.LINEAETH,
    CoinKind.CRYPTO
  ),
  tofc(
    'd4699953-20c9-4b3e-91ec-506a4c3efbfb',
    'ofctlineaeth',
    'Linea Ethereum Testnet',
    18,
    UnderlyingAsset.LINEAETH,
    CoinKind.CRYPTO
  ),
  ofc('aa7e956f-2d59-4bf6-aba6-2d51bd298150', 'ofcip', 'Story', 18, UnderlyingAsset.IP, CoinKind.CRYPTO),
  tofc('773b02f6-32ea-493a-bca5-13d93cb0afff', 'ofctip', 'Story Testnet', 18, UnderlyingAsset.IP, CoinKind.CRYPTO),
  ofc('32b87bea-ba5f-4cab-9516-647b1fba9ea2', 'ofcxpl', 'Plasma', 18, UnderlyingAsset.XPL, CoinKind.CRYPTO),
  tofc('7783b655-1d01-4c99-b35f-1525d9a1d191', 'ofctxpl', 'Plasma Testnet', 18, UnderlyingAsset.XPL, CoinKind.CRYPTO),
  ofc('1876cf96-a0b7-4b7b-9024-6bd89df9814b', 'ofcflr', 'Flare', 18, UnderlyingAsset.FLR, CoinKind.CRYPTO),
  tofc('312ff039-2473-4a11-837f-4ec896a0483d', 'ofctflr', 'Testnet flare', 18, UnderlyingAsset.FLR, CoinKind.CRYPTO),
  ofc('dd3f3d9a-8eae-4a7a-8178-88611687674d', 'ofcsgb', 'Songbird', 18, UnderlyingAsset.SGB, CoinKind.CRYPTO),
  tofc('30e8f8d8-17e7-4af0-91cf-069724e05e65', 'ofctsgb', 'Testnet songbird', 18, UnderlyingAsset.SGB, CoinKind.CRYPTO),
  ofc('4bc9d629-cff8-4f1b-bb43-5424f7ed9a19', 'ofcmon', 'Monad', 18, UnderlyingAsset.MON, CoinKind.CRYPTO),
  tofc('24f7dd79-7d03-4ce5-ac90-0572153f28f2', 'ofctmon', 'Testnet Monad', 18, UnderlyingAsset.MON, CoinKind.CRYPTO),
  ofc(
    'bf513cc9-7b75-42d2-a585-1a7c91801605',
    'ofcworld',
    'Worldchain Ethereum',
    18,
    UnderlyingAsset.WORLD,
    CoinKind.CRYPTO
  ),
  tofc(
    'ca1f3c70-8f80-4feb-9be7-f2b716409027',
    'ofctworld',
    'Testnet world',
    18,
    UnderlyingAsset.WORLD,
    CoinKind.CRYPTO
  ),
  ofc(
    'cdc62abc-4748-48f4-8926-6ed42f6c86c9',
    'ofcsoneium',
    'Soneium Ethereum',
    18,
    UnderlyingAsset.SONEIUM,
    CoinKind.CRYPTO
  ),
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
  ofc('deb7cd02-7c4c-4f97-bc85-40aa5405e4db', 'ofcpolyx', 'Polymesh', 6, UnderlyingAsset.POLYX, CoinKind.CRYPTO),
  tofc(
    'a1f4bfa3-c493-4f9f-bb1b-06c5f526d5b2',
    'ofctpolyx',
    'Testnet Polymesh',
    6,
    UnderlyingAsset.POLYX,
    CoinKind.CRYPTO
  ),
  ofc('77661a48-865f-48ea-bb73-875744729a69', 'ofcbera:dolo', 'Dolomite', 18, UnderlyingAsset.BERA, CoinKind.CRYPTO),
  ofc('411fd61a-3571-41f4-b632-6058a30a66a2', 'ofcapt', 'Aptos', 8, UnderlyingAsset.APT, CoinKind.CRYPTO),
  ofc('2fee34a2-cfb8-4882-953a-ac02f2c1577d', 'ofcvet', 'VeChain', 18, UnderlyingAsset.VET, CoinKind.CRYPTO),
  tofc('49ee4baa-a5a7-47f1-b660-7031be7ef310', 'ofctvet', 'Testnet VeChain', 18, UnderlyingAsset.VET, CoinKind.CRYPTO),
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
    '97f83379-a536-4977-a5e8-5a4dae5a3db7',
    'ofchooditeth',
    'Test Hoodi Ether',
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
    'c1c90357-1026-4fc1-b465-05abe0232036',
    'ofctcronos',
    'Testnet Cronos POS',
    8,
    UnderlyingAsset.CRONOS,
    CoinKind.CRYPTO
  ),
  tofc(
    '42806be8-d72b-4264-a2de-58f11ecd4d55',
    'ofctinitia',
    'Testnet Initia',
    6,
    UnderlyingAsset.INITIA,
    CoinKind.CRYPTO
  ),
  tofc(
    'f5ebd705-596d-4218-8c74-1a0d7058f111',
    'ofctasi',
    'Testnet Fetch Native',
    18,
    UnderlyingAsset.ASI,
    CoinKind.CRYPTO
  ),
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
  ofcsolToken('e792c18a-05d1-4622-a8db-192f431b70a2', 'ofcsol:usdg', 'Global Dollar', 6, UnderlyingAsset['sol:usdg'], [
    CoinFeature.STABLECOIN,
  ]),
  ofcsolToken('56b9f9c2-1a6a-4d79-aad2-2e418c3b52e0', 'ofcsol:ausd', 'Agora Dollar', 6, UnderlyingAsset['sol:ausd'], [
    CoinFeature.STABLECOIN,
  ]),
  ofcsolToken(
    'c382f3cc-c071-4ef5-89ac-bcb85d8d415f',
    'ofcsol:wec',
    'Whole Earth Coin',
    9,
    UnderlyingAsset['sol:wec'],
    SOL_OFC_TOKEN_FEATURES
  ),
  ofcsolToken('fb3b730f-c2cc-4598-8165-ddd42de8cbdf', 'ofcsol:usdt', 'USD Tether', 6, UnderlyingAsset['sol:usdt'], [
    ...SOL_OFC_TOKEN_FEATURES,
    CoinFeature.STABLECOIN,
  ]),
  ofcsolToken('0d96e2db-d01e-4ea0-ac87-3b51d563ea91', 'ofcsol:usdc', 'USD Coin', 6, UnderlyingAsset['sol:usdc'], [
    ...SOL_OFC_TOKEN_FEATURES,
    CoinFeature.STABLECOIN,
  ]),
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
    '65d92f2d-8488-4005-8eec-b8b2bfe9a4a9',
    'ofcsol:pump',
    'Pump',
    6,
    UnderlyingAsset['sol:pump'],
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
  ofcsolToken(
    'fb670b5e-1b5f-43d6-abfe-d1a19983f0aa',
    'ofcsol:sb',
    'Solbank',
    9,
    UnderlyingAsset['sol:sb'],
    SOL_TOKEN_FEATURES
  ),
  ofcsolToken(
    'db1acb26-112e-44b2-a2d5-7df402916f2a',
    'ofcsol:dfdvsol',
    'DeFi Development Corp Staked SOL',
    9,
    UnderlyingAsset['sol:dfdvsol'],
    SOL_TOKEN_FEATURES
  ),
  ofcsolToken(
    'b6980974-4d8e-403c-95f2-d56d1ea07269',
    'ofcsol:chillguy',
    'Just a chill guy',
    6,
    UnderlyingAsset['sol:chillguy'],
    SOL_TOKEN_FEATURES
  ),
  ofcsolToken(
    '8ca042ad-dc79-4241-bdc6-0095627f2d68',
    'ofcsol:grph',
    'Soul Graph',
    6,
    UnderlyingAsset['sol:grph'],
    SOL_TOKEN_FEATURES
  ),
  ofcsolToken(
    '75a572c8-a76e-4f27-a275-2ad1abe7a595',
    'ofcsol:moodeng',
    'Moo Deng',
    6,
    UnderlyingAsset['sol:moodeng'],
    SOL_TOKEN_FEATURES
  ),
  ofcsolToken(
    'd14c520f-5b02-4f19-a48d-f1a158cdf066',
    'ofcsol:hsol',
    'Helius Staked SOL',
    9,
    UnderlyingAsset['sol:hsol'],
    SOL_TOKEN_FEATURES
  ),
  ofcsolToken(
    '4074f374-2229-41f4-a79c-2cd9a3e8a56f',
    'ofcsol:superbonds',
    'SuperBonds',
    6,
    UnderlyingAsset['sol:superbonds'],
    SOL_TOKEN_FEATURES
  ),
  ofcsolToken(
    '84304532-c319-4d24-977c-63ab57330cf7',
    'ofcsol:would',
    'Would',
    6,
    UnderlyingAsset['sol:would'],
    SOL_TOKEN_FEATURES
  ),
  ofcsolToken(
    '486c6fd0-ea58-44c5-acee-7a523337faf2',
    'ofcsol:dog',
    'Dog (Bitcoin)',
    5,
    UnderlyingAsset['sol:dog'],
    SOL_TOKEN_FEATURES
  ),
  ofcsolToken(
    '3d4bfe68-49cb-4d30-aef0-d143a9e9d9a7',
    'ofcsol:saros',
    'Saros',
    6,
    UnderlyingAsset['sol:saros'],
    SOL_TOKEN_FEATURES
  ),
  ofcsolToken(
    '791dc370-17c2-4c15-80b0-649889dd5b0a',
    'ofcsol:babydoge',
    'Baby Doge',
    1,
    UnderlyingAsset['sol:babydoge'],
    SOL_TOKEN_FEATURES
  ),
  ofcsolToken(
    '3e11dbb8-99e2-46b6-8dac-5810ef90ab26',
    'ofcsol:useless',
    'Useless Coin',
    6,
    UnderlyingAsset['sol:useless'],
    SOL_TOKEN_FEATURES
  ),
  ofcsolToken(
    '4fed6bd6-884c-4ac2-8c18-ecc9cc9350cc',
    'ofcsol:gohome',
    'GOHOME',
    6,
    UnderlyingAsset['sol:gohome'],
    SOL_TOKEN_FEATURES
  ),
  ofcsolToken(
    '27f505d7-c642-478a-adef-d93df942e87d',
    'ofcsol:aura',
    'Aura',
    6,
    UnderlyingAsset['sol:aura'],
    SOL_TOKEN_FEATURES
  ),
  ofcsolToken(
    '242556a0-a792-48e0-9527-5ae6a5d9b4c1',
    'ofcsol:me',
    'Magic Eden',
    6,
    UnderlyingAsset['sol:me'],
    SOL_TOKEN_FEATURES
  ),
  ofcsolToken(
    '95e2526f-3500-42cf-8207-dab2c52de9aa',
    'ofcsol:alch',
    'Alchemist AI',
    6,
    UnderlyingAsset['sol:alch'],
    SOL_TOKEN_FEATURES
  ),
  ofcsolToken(
    'b291bc5e-374f-40b1-9f55-88f43c46079b',
    'ofcsol:launchcoin',
    'Launch Coin on Believe',
    9,
    UnderlyingAsset['sol:launchcoin'],
    SOL_TOKEN_FEATURES
  ),
  ofcsolToken(
    '5b739473-b679-47ef-8312-c63e61e2e00c',
    'ofcsol:stik',
    'Staika',
    9,
    UnderlyingAsset['sol:stik'],
    SOL_TOKEN_FEATURES
  ),
  ofcsolToken(
    '35196f56-2259-470b-9ff1-1d4271a518be',
    'ofcsol:chill',
    'Chillchat',
    9,
    UnderlyingAsset['sol:chill'],
    SOL_TOKEN_FEATURES
  ),
  ofcsolToken(
    'e7bd47d4-caf1-4308-b939-ac1a8c301b22',
    'ofcsol:zbcn',
    'Zebec Network',
    6,
    UnderlyingAsset['sol:zbcn'],
    SOL_TOKEN_FEATURES
  ),
  ofcsolToken(
    '3eb1b663-f67f-4237-8dcd-e1490d07e4ff',
    'ofcsol:benji',
    'BENJI',
    9,
    UnderlyingAsset['sol:benji'],
    SOL_TOKEN_FEATURES
  ),
  ofcsolToken('deaf138b-b1f7-476d-8de6-a268d56b8b0b', 'ofcsol:usd1', 'USD1', 6, UnderlyingAsset['sol:usd1'], [
    ...SOL_TOKEN_FEATURES,
    CoinFeature.STABLECOIN,
  ]),
  ofcsolToken(
    'b08c09fd-73fb-4b7f-8377-72225cd8c256',
    'ofcsol:dupe',
    'Dupe',
    9,
    UnderlyingAsset['sol:dupe'],
    SOL_TOKEN_FEATURES
  ),
  ofcsolToken(
    '2ffdb51c-0950-481a-b983-d8fc6f79e15d',
    'ofcsol:tank',
    'AgentTank',
    6,
    UnderlyingAsset['sol:tank'],
    SOL_TOKEN_FEATURES
  ),
  ofcsolToken(
    'a5bf88db-3b47-4c7a-8faa-89d46f533614',
    'ofcsol:grift',
    'Orbit',
    6,
    UnderlyingAsset['sol:grift'],
    SOL_TOKEN_FEATURES
  ),
  ofcsolToken('ceb01fe5-edc8-4c2b-a27a-d2d10bb5c12d', 'ofcsol:usdk', 'Kast USDK', 6, UnderlyingAsset['sol:usdk'], [
    ...SOL_TOKEN_FEATURES,
    CoinFeature.STABLECOIN,
  ]),
  ofcsolToken('6ac3b85c-0561-4ff1-a8be-12d23409c49b', 'ofcsol:usdky', 'Kast USDKY', 6, UnderlyingAsset['sol:usdky'], [
    ...SOL_TOKEN_FEATURES,
    CoinFeature.STABLECOIN,
  ]),
  ofcsolToken(
    '74c35273-927d-4ff2-8ca9-50481a1c7e43',
    'ofcsol:wave',
    'Waveform',
    6,
    UnderlyingAsset['sol:wave'],
    SOL_TOKEN_FEATURES
  ),
  ofcsolToken(
    '37fcfc49-1579-429d-b82f-cf074e21f1f1',
    'ofcsol:usdcv',
    'USD CoinVertible',
    2,
    UnderlyingAsset['sol:usdcv'],
    [...SOL_TOKEN_FEATURES, CoinFeature.STABLECOIN]
  ),
  ofcsolToken(
    '696aa26f-332c-4a1e-a0bd-e3a80f4cac9b',
    'ofcsol:2z',
    'DoubleZero',
    8,
    UnderlyingAsset['sol:2z'],
    SOL_TOKEN_FEATURES
  ),
  ofcsolToken(
    'fa0722c2-8acd-4266-95dd-ba0edc326367',
    'ofcsol:cloud',
    'Cloud',
    9,
    UnderlyingAsset['sol:cloud'],
    SOL_TOKEN_FEATURES
  ),
  ofcsolToken(
    '6a46ca44-5d92-4b18-973c-9cef3d18bf5f',
    'ofcsol:eliza',
    'Eliza',
    9,
    UnderlyingAsset['sol:eliza'],
    SOL_TOKEN_FEATURES
  ),
  ofcsolToken(
    '663123e0-8326-4d10-a362-8549f9d42321',
    'ofcsol:eurc',
    'EURC',
    6,
    UnderlyingAsset['sol:eurc'],
    SOL_TOKEN_FEATURES
  ),
  ofcsolToken(
    '90c297d2-853b-4322-9050-809254c9cfc2',
    'ofcsol:dynosol',
    'dynoSOL',
    9,
    UnderlyingAsset['sol:dynosol'],
    SOL_TOKEN_FEATURES
  ),
  ofcsolToken(
    '0c6e3dcc-9009-4f38-8895-09844dc9e81f',
    'ofcsol:cipher',
    'Cipher',
    9,
    UnderlyingAsset['sol:cipher'],
    SOL_TOKEN_FEATURES
  ),
  ofcsolToken(
    '016a4786-73bc-44c3-8a5a-1d0abc835545',
    'ofcsol:bio',
    'Bio Protocol',
    9,
    UnderlyingAsset['sol:bio'],
    SOL_TOKEN_FEATURES
  ),
  ofcsolToken(
    '7bd2ca03-7998-45f1-8b13-59574530316c',
    'ofcsol:rekt',
    'Rekt',
    4,
    UnderlyingAsset['sol:rekt'],
    SOL_TOKEN_FEATURES
  ),
  ofcsolToken(
    'ce1e7789-6684-4a50-baf0-570c9c18120c',
    'ofcsol:xyo',
    'XY Oracle',
    8,
    UnderlyingAsset['sol:xyo'],
    SOL_TOKEN_FEATURES
  ),
  ofcsolToken(
    '108f4e91-2046-46d0-9607-cd4f633ae93d',
    'ofcsol:zig',
    'ZIGChain',
    8,
    UnderlyingAsset['sol:zig'],
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
    9,
    UnderlyingAsset['tsol:usdc'],
    [...SOL_TOKEN_FEATURES, CoinFeature.STABLECOIN]
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
    [...SOL_TOKEN_FEATURES, CoinFeature.STABLECOIN]
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
  tofcsolToken(
    'fb69f06b-d5a1-4b97-b40f-736174ccb53f',
    'ofctsol:usd1',
    'Test USD1 Token',
    6,
    UnderlyingAsset['sol:usd1'],
    [...SOL_TOKEN_FEATURES, CoinFeature.STABLECOIN]
  ),
  tofcsolToken(
    '750f0e40-c5b9-464f-874f-dc455cf1494b',
    'ofctsol:stgusd1',
    'Test USD1 Token',
    6,
    UnderlyingAsset['sol:usd1'],
    [...SOL_TOKEN_FEATURES, CoinFeature.STABLECOIN]
  ),
  tofcsolToken(
    'ad6d7d4e-894b-4cf9-bb66-e4341717969a',
    'ofctsol:txsgd',
    'Test StraitsX SGD',
    6,
    UnderlyingAsset['tsol:txsgd'],
    SOL_TOKEN_FEATURES
  ),
  tofcsolToken(
    'ca0fb21b-d75d-40c2-b7fe-18a451b81bd5',
    'ofctsol:txusd',
    'Test StraitsX USD',
    6,
    UnderlyingAsset['tsol:txusd'],
    SOL_TOKEN_FEATURES
  ),

  tofcTronToken('937efe97-a17a-4d2a-aaf2-0ffdb529a943', 'ofcttrx:usdt', 'Tether USD', 6, UnderlyingAsset['ttrx:usdt']),
  tofcTronToken(
    '26d82f2c-47fd-474f-be79-246117214e0e',
    'ofcttrx:usd1',
    'Test USD1 Token',
    18,
    UnderlyingAsset['ttrx:usd1'],
    undefined,
    [CoinFeature.STABLECOIN]
  ),
  tofcTronToken(
    '8e2ca812-2dee-4264-b5da-20d52a9194c8',
    'ofcttrx:stgusd1',
    'Test USD1 Token',
    18,
    UnderlyingAsset['ttrx:stgusd1'],
    undefined,
    [CoinFeature.STABLECOIN]
  ),
  ofcTronToken(
    '94b00b66-68a4-45ed-b772-77e5bca1e34c',
    'ofctrx:usdt',
    'Tether USD',
    6,
    UnderlyingAsset['trx:usdt'],
    undefined,
    [CoinFeature.STABLECOIN]
  ),
  ofcTronToken(
    '486dca06-5709-45ee-8b35-677e3d27509f',
    'ofctrx:usd1',
    'USD1 Token',
    18,
    UnderlyingAsset['trx:usd1'],
    undefined,
    [CoinFeature.STABLECOIN]
  ),
  ofcTronToken('d953a72b-b7b9-4c8d-97bd-f03394e30608', 'ofctrx:trxs', 'Staked TRX', 18, UnderlyingAsset['trx:trxs']),
  ofcTronToken('d1f624a6-8d53-4c59-abdb-65fc12204ea3', 'ofctrx:jst', 'Just', 18, UnderlyingAsset['trx:jst']),
  ofcXrpToken(
    '6a173023-5faf-4a0a-af38-b8be98abe94f',
    'ofcxrp:rlusd',
    'Ripple USD',
    15,
    UnderlyingAsset['xrp:rlusd'],
    undefined,
    [CoinFeature.STABLECOIN]
  ),
  tofcXrpToken(
    'bd406dab-3b55-4ab5-b0a5-74b9f94268a3',
    'ofctxrp:rlusd',
    'RLUSD',
    15,
    UnderlyingAsset['txrp:rlusd'],
    undefined,
    [CoinFeature.STABLECOIN]
  ),
  ofcXrpToken('eb3c02de-7221-4fde-9235-5cc576eb7c8b', 'ofcxrp:xsgd', 'XSGD', 15, UnderlyingAsset['xrp:xsgd']),
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
  ofcXrpToken('1813238c-8cc5-4b79-9959-793c5c220b1d', 'ofcxrp:solo', 'Sologenic', 15, UnderlyingAsset['xrp:solo']),
  ofcXrpToken('4c875336-64dc-427b-bde7-eb25e2f20272', 'ofcxrp:aau', 'Archax', 15, UnderlyingAsset['xrp:aau']),
  ofcXrpToken('2744ab2a-f7e6-4606-aed1-11d7dffca18e', 'ofcxrp:fiuaxrp', 'FIUAXRP', 15, UnderlyingAsset['xrp:fiuaxrp']),
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
  ofcArbethErc20('f4f0e2d4-9937-49a6-a6f2-80e1717a5d82', 'ofcarbeth:trn', 't3rn', 18, UnderlyingAsset['arbeth:trn']),
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
    UnderlyingAsset['arbeth:usdcv2'],
    undefined,
    [CoinFeature.STABLECOIN]
  ),
  ofcArbethErc20(
    'eed6696c-9c38-4897-9cae-de3aa3cb6297',
    'ofcarbeth:usdc',
    'USD Coin',
    6,
    UnderlyingAsset['arbeth:usdc'],
    undefined,
    [CoinFeature.STABLECOIN]
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
    UnderlyingAsset['arbeth:usdt'],
    undefined,
    [CoinFeature.STABLECOIN]
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
  ofcArbethErc20(
    'cc8afc16-5323-41d3-a8d3-6f5f73c53392',
    'ofcarbeth:anime',
    'Animecoin',
    18,
    UnderlyingAsset['arbeth:anime']
  ),
  ofcArbethErc20(
    '6929c56f-82c5-49d5-b920-28cb62f82aff',
    'ofcarbeth:benji',
    'Franklin OnChain U.S. Government Money Fund',
    18,
    UnderlyingAsset['arbeth:benji']
  ),
  ofcArbethErc20(
    '2cca89a3-788d-499b-bb41-a35ce2428d9e',
    'ofcarbeth:dolo',
    'Dolomite',
    18,
    UnderlyingAsset['arbeth:dolo']
  ),
  ofcAvaxErc20('2bd6201d-c46c-481e-b82d-7cf3601679cb', 'ofcavaxc:aave-e', 'Aave', 18, UnderlyingAsset['avaxc:aave']),
  ofcAvaxErc20(
    '515a5a74-54fe-4d73-bb12-8d1130f78692',
    'ofcavaxc:btc-b',
    'Bitcoin Avalanche Bridged',
    8,
    UnderlyingAsset['avaxc:btc']
  ),
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
  ofcAvaxErc20(
    '300dbac5-76a3-4ed5-96fb-1d7898da4b4e',
    'ofcavaxc:usdc',
    'USD Coin',
    6,
    UnderlyingAsset['avaxc:usdc'],
    undefined,
    [CoinFeature.STABLECOIN]
  ),
  ofcAvaxErc20(
    '974e85e7-d6ad-4a5a-9aea-cae055842f36',
    'ofcavaxc:usdc-e',
    'USD Coin',
    6,
    UnderlyingAsset['avaxc:usdc'],
    undefined,
    [CoinFeature.STABLECOIN]
  ),
  ofcAvaxErc20(
    '861e2833-90be-45ec-8c8b-a41b1b86fac3',
    'ofcavaxc:usdt',
    'Tether USD',
    6,
    UnderlyingAsset['avaxc:usdt'],
    undefined,
    [CoinFeature.STABLECOIN]
  ),
  ofcAvaxErc20(
    'e56e42a8-1566-4b5b-a2f3-5439278b1e8c',
    'ofcavaxc:usdt-e',
    'Tether USD',
    6,
    UnderlyingAsset['avaxc:usdt'],
    undefined,
    [CoinFeature.STABLECOIN]
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
  ofcAvaxErc20(
    '2147a7e1-0dd5-4ef4-b6bc-1d5c7270b050',
    'ofcavaxc:benji',
    'Franklin OnChain U.S. Government Money Fund',
    18,
    UnderlyingAsset['avaxc:benji']
  ),
  ofcAvaxErc20('bdfcfb36-ded1-495f-a1d4-37b645bdc091', 'ofcavaxc:emdx', 'EMDX', 18, UnderlyingAsset['avaxc:emdx']),
  ofcAvaxErc20(
    '7a52f3b4-ccdd-4362-b6bb-0d81b8e7c7c5',
    'ofcavaxc:eurc',
    'Circle: EURC',
    6,
    UnderlyingAsset['avaxc:eurc']
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
  ofcBscToken(
    'fae56463-dc06-42cd-ad8b-5b4f6bbabffc',
    'ofcbsc:usd1',
    'USD1',
    18,
    UnderlyingAsset['bsc:usd1'],
    undefined,
    [CoinFeature.STABLECOIN]
  ),
  ofcBscToken(
    '66583648-3200-4221-a677-930973dbcd72',
    'ofcbsc:twt',
    'Trust Wallet Token',
    18,
    UnderlyingAsset['bsc:twt']
  ),
  ofcBscToken('822d85d7-f42d-40de-a14c-220a375eda3f', 'ofcbsc:sfp', 'SafePal Token', 18, UnderlyingAsset['bsc:sfp']),
  ofcBscToken('10226e82-2fac-49f4-8ee0-e0f7affeaeec', 'ofcbsc:mask', 'Mask Network', 18, UnderlyingAsset['bsc:mask']),
  ofcBscToken(
    'a1380903-6d91-4555-b8ef-74b1bcd993d0',
    'ofcbsc:usdt',
    'BSC-USD',
    18,
    UnderlyingAsset['bsc:usdt'],
    undefined,
    [CoinFeature.STABLECOIN]
  ),
  ofcBscToken('6a1e8b8c-4d7e-4f9a-9d8f-f6e72f8c7e65', 'ofcbsc:solv', 'SOLV Protocol', 9, UnderlyingAsset['bsc:solv']),
  ofcBscToken('f8c3d7b5-2d9e-4b3f-8a1e-7c6d9e3a2f4b', 'ofcbsc:brise', 'Bitrise Token', 9, UnderlyingAsset['bsc:brise']),
  ofcBscToken('2e9f4c6b-8a7d-4b2e-9d3f-7c6a5e8b1f2a', 'ofcbsc:bsw', 'Biswap', 18, UnderlyingAsset['bsc:bsw']),
  ofcBscToken(
    '89dfd19c-d241-45e2-94b1-8a9bcdb9c09b',
    'ofcbsc:parti',
    'Particle Network',
    18,
    UnderlyingAsset['bsc:parti']
  ),
  ofcBscToken('8d250ad4-775f-4435-9c4c-cf0f77b26f7e', 'ofcbsc:form', 'Four', 18, UnderlyingAsset['bsc:form']),
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
    UnderlyingAsset['bsc:busd'],
    undefined,
    [CoinFeature.STABLECOIN]
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
  ofcBscToken(
    '8a1e9d6f-7c3f-4b2e-9d5f-6b7a2c8a1e3f',
    'ofcbsc:usdc',
    'USDC',
    18,
    UnderlyingAsset['bsc:usdc'],
    undefined,
    [CoinFeature.STABLECOIN]
  ),
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
  ofcBscToken(
    '9d6f8a4c-3f1e-4b2e-af9e-1a8c9b6f2e5a',
    'ofcbsc:tusd',
    'TrueUSD',
    18,
    UnderlyingAsset['bsc:tusd'],
    undefined,
    [CoinFeature.STABLECOIN]
  ),
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
    UnderlyingAsset['bsc:fdusd'],
    undefined,
    [CoinFeature.STABLECOIN]
  ),
  ofcBscToken('549d7f6a-4b1e-3f2e-9d8f-7c1e8b6f2e5a', 'ofcbsc:floki', 'FLOKI', 9, UnderlyingAsset['bsc:floki']),
  ofcBscToken('7c8f9d6a-1e3f-4b2e-8f9e-7a9c126f2e5a', 'ofcbsc:ldo', 'LIDO DAO', 18, UnderlyingAsset['bsc:ldo']),
  ofcBscToken('9e8f6a1e-3f7c-4b2e-9d8f-8a7c9b6f2e1a', 'ofcbsc:eos', 'EOS', 18, UnderlyingAsset['bsc:eos']),
  ofcBscToken('7c3f8a1e-9d1f-4b2e-bf9e-7a8c9b6f2e5a', 'ofcbsc:om', 'MANTRA DAO', 18, UnderlyingAsset['bsc:om']),
  ofcBscToken(
    '5c7a8f9e-4b1e-3f2e-9d6f-7c8a1b6f2e5a',
    'ofcbsc:usdd',
    'USDD',
    18,
    UnderlyingAsset['bsc:usdd'],
    undefined,
    [CoinFeature.STABLECOIN]
  ),
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
  ofcBscToken('9ab9cf5e-71a5-407f-8233-8495a79e45dc', 'ofcbsc:fil', 'Filecoin', 18, UnderlyingAsset['bsc:fil']),
  ofcBscToken('1b227f23-8729-4b49-8c98-ed1470b6c82c', 'ofcbsc:ftm', 'Fantom', 18, UnderlyingAsset['bsc:ftm']),
  ofcBscToken('0c37610d-29b2-484e-b29a-7c744fa36d79', 'ofcbsc:comp', 'Compound', 18, UnderlyingAsset['bsc:comp']),
  ofcBscToken('ec88372f-33c1-4553-842c-0ccbc7cd2358', 'ofcbsc:uni', 'Uniswap', 18, UnderlyingAsset['bsc:uni']),
  ofcBscToken('1076917e-06d3-4c28-b26b-8f351ba74f2e', 'ofcbsc:yfi', 'yearn.finance', 18, UnderlyingAsset['bsc:yfi']),
  ofcBscToken('7982c847-0e57-4215-808e-8ea488b24515', 'ofcbsc:link', 'Chainlink', 18, UnderlyingAsset['bsc:link']),
  ofcBscToken(
    '5af23514-1f09-45cc-9a2d-305dd8de7c30',
    'ofcbsc:aitech',
    'Solidus Ai Tech',
    18,
    UnderlyingAsset['bsc:aitech']
  ),
  ofcBscToken('16b3a242-d500-4930-884a-183aa9038609', 'ofcbsc:sol', 'Solana', 18, UnderlyingAsset['bsc:sol']),
  ofcBscToken(
    '5a8a03a2-2013-4096-92f7-80ab7a6b430d',
    'ofcbsc:cusdo',
    'Compounding Open Dollar',
    18,
    UnderlyingAsset['bsc:cusdo']
  ),
  ofcBscToken('a7ac1127-84c8-4634-89ed-8d985b707e18', 'ofcbsc:unx', 'Unchain X', 18, UnderlyingAsset['bsc:unx']),
  ofcBscToken(
    '1db5b688-ff72-4835-8a7a-8071ee9e0fe5',
    'ofcbsc:usdo',
    'OpenEden Open Dollar',
    18,
    UnderlyingAsset['bsc:usdo']
  ),
  ofcBscToken('eb9280a5-2781-450b-945f-7fe13d170433', 'ofcbsc:slay', 'SatLayer', 6, UnderlyingAsset['bsc:slay']),
  ofcBscToken('91442391-12ed-4361-947f-eed60000329f', 'ofcbsc:prove', 'Succinct', 18, UnderlyingAsset['bsc:prove']),
  ofcBscToken('bca017c3-4326-48f8-809b-bd6df7538286', 'ofcbsc:rekt', 'Rekt', 18, UnderlyingAsset['bsc:rekt']),
  tofcBscToken(
    'bf8a52e5-f416-46ea-95c2-a920dc204233',
    'ofctbsc:usd1',
    'Test USD1 Token',
    18,
    UnderlyingAsset['tbsc:usd1'],
    undefined,
    [CoinFeature.STABLECOIN]
  ),
  ofcBscToken('21da2589-8494-4f2e-ad95-431f86fa85ff', 'ofcbsc:zig', 'ZIGChain', 18, UnderlyingAsset['bsc:zig']),
  ofcBscToken('0c23da3a-bbd5-4ff9-867a-62a71e8f2b75', 'ofcbsc:eden', 'OpenEden', 18, UnderlyingAsset['bsc:eden']),
  ofcBscToken('26a641a4-076a-4306-a325-6ce426c6932e', 'ofcbsc:m', 'MemeCore', 18, UnderlyingAsset['bsc:m']),
  ofcBscToken(
    'e2c46423-6bae-4a28-8df5-717535be86c5',
    'ofcbsc:cashplus',
    'CashPlus',
    18,
    UnderlyingAsset['bsc:cashplus']
  ),
  ofcBscToken('08974cb2-8081-4248-89d5-c74af0edf4bb', 'ofcbsc:aster', 'Aster', 18, UnderlyingAsset['bsc:aster']),

  tofcBscToken(
    'e9174338-0d26-4f49-b111-3487b60c9912',
    'ofctbsc:stgusd1',
    'Test USD1 Token',
    18,
    UnderlyingAsset['tbsc:stgusd1'],
    undefined,
    [CoinFeature.STABLECOIN]
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
    UnderlyingAsset['polygon:usdcv2'],
    undefined,
    [CoinFeature.STABLECOIN]
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
    UnderlyingAsset['polygon:usdc'],
    undefined,
    [CoinFeature.STABLECOIN]
  ),
  ofcPolygonErc20(
    '659e66ef-2265-48d4-a73c-f98e479944d1',
    'ofcpolygon:tusd',
    'TrueUSD',
    18,
    UnderlyingAsset['polygon:tusd'],
    undefined,
    [CoinFeature.STABLECOIN]
  ),
  ofcPolygonErc20(
    '115e52f9-91bc-4e40-b1cb-046167bb4b09',
    'ofcpolygon:usdt',
    'Tether USD',
    6,
    UnderlyingAsset['polygon:usdt'],
    undefined,
    [CoinFeature.STABLECOIN]
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
    '8bec43b8-62e2-4695-96ac-cd60751e0539',
    'ofcpolygon:benji',
    'Franklin OnChain U.S. Government Money Fund',
    18,
    UnderlyingAsset['polygon:benji']
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
  ofcPolygonErc20(
    'b910d91a-da77-4602-91f4-a9be4d20e7aa',
    'ofcpolygon:agix',
    'SingularityNET Token',
    18,
    UnderlyingAsset['polygon:agix']
  ),
  ofcPolygonErc20(
    '81d6d44e-53b0-45ad-b62e-3f8b8c529784',
    'ofcpolygon:ali',
    'Artificial Liquid Intelligence Token',
    18,
    UnderlyingAsset['polygon:ali']
  ),
  ofcPolygonErc20(
    '049fc94e-1c7e-443f-a0de-444fd21af4e7',
    'ofcpolygon:avax',
    'Avalanche Token',
    18,
    UnderlyingAsset['polygon:avax']
  ),
  ofcPolygonErc20(
    'a917ef65-8856-45f2-bfb2-e1174eff95cb',
    'ofcpolygon:bal',
    'Balancer',
    18,
    UnderlyingAsset['polygon:bal']
  ),
  ofcPolygonErc20(
    '4806a71e-a6d0-4e5d-91d5-feec51f7a6ae',
    'ofcpolygon:band',
    'BandToken',
    18,
    UnderlyingAsset['polygon:band']
  ),
  ofcPolygonErc20(
    '4be0804d-ec11-41a7-8873-0f24d0122254',
    'ofcpolygon:bcut',
    'bitsCrunch Token',
    18,
    UnderlyingAsset['polygon:bcut']
  ),
  ofcPolygonErc20(
    '674c9a89-abb4-48a3-a88c-0c9bce518c7b',
    'ofcpolygon:blz',
    'Bluzelle',
    18,
    UnderlyingAsset['polygon:blz']
  ),
  ofcPolygonErc20('2ab92e0a-5012-4f76-ae9b-a34a2b8adb71', 'ofcpolygon:bnb', 'BNB', 18, UnderlyingAsset['polygon:bnb']),
  ofcPolygonErc20(
    'e6da6d36-4914-407d-9c3b-7dd7a4d66af8',
    'ofcpolygon:bnt',
    'Bancor',
    18,
    UnderlyingAsset['polygon:bnt']
  ),
  ofcPolygonErc20(
    'fa08f0a2-ef30-4b40-939e-43459910f66f',
    'ofcpolygon:busd',
    'BUSD Token',
    18,
    UnderlyingAsset['polygon:busd'],
    undefined,
    [CoinFeature.STABLECOIN]
  ),
  ofcPolygonErc20(
    'b12a9d51-3067-47d2-945e-65b3cd414532',
    'ofcpolygon:chz',
    'chiliZ',
    18,
    UnderlyingAsset['polygon:chz']
  ),
  ofcPolygonErc20(
    '257a2ea2-3487-465b-b417-5a80d1a38341',
    'ofcpolygon:dipe',
    'DIPE',
    6,
    UnderlyingAsset['polygon:dipe']
  ),
  ofcPolygonErc20(
    '72192c10-d060-4b23-a722-374c6ff14be1',
    'ofcpolygon:elon',
    'Dogelon',
    18,
    UnderlyingAsset['polygon:elon']
  ),
  ofcPolygonErc20(
    '631b954f-9a45-41e3-8841-d2fe49484151',
    'ofcpolygon:enj',
    'EnjinCoin',
    18,
    UnderlyingAsset['polygon:enj']
  ),
  ofcPolygonErc20(
    '173ecd0d-c73b-4322-aee2-50d0dc791e23',
    'ofcpolygon:euroe',
    'EUROe Stablecoin',
    6,
    UnderlyingAsset['polygon:euroe']
  ),
  ofcPolygonErc20(
    '0ea61c1a-7588-4ea0-9ca5-6b8be1c46366',
    'ofcpolygon:fet',
    'Fetch',
    18,
    UnderlyingAsset['polygon:fet']
  ),
  ofcPolygonErc20(
    '15f301e0-431c-4410-972d-6e45c3937492',
    'ofcpolygon:forth',
    'Ampleforth Governance',
    18,
    UnderlyingAsset['polygon:forth']
  ),
  ofcPolygonErc20(
    '430d99c2-2baa-425e-8ea9-c7c8f92a6fe9',
    'ofcpolygon:glm',
    'Golem Network Token',
    18,
    UnderlyingAsset['polygon:glm']
  ),
  ofcPolygonErc20('9b748e49-e91d-4297-8f35-e6000187276b', 'ofcpolygon:gmt', 'GMT', 8, UnderlyingAsset['polygon:gmt']),
  ofcPolygonErc20(
    '39ea8a85-a0b8-4c44-bc68-fa6cda29c6c4',
    'ofcpolygon:gno',
    'Gnosis',
    18,
    UnderlyingAsset['polygon:gno']
  ),
  ofcPolygonErc20(
    '95457f51-01ed-47ba-9110-627bfaa6eb04',
    'ofcpolygon:gohm',
    'Governance OHM',
    18,
    UnderlyingAsset['polygon:gohm']
  ),
  ofcPolygonErc20(
    'b4ccb201-c80f-4295-8cc6-596d4f4be0f4',
    'ofcpolygon:grt',
    'Graph',
    18,
    UnderlyingAsset['polygon:grt']
  ),
  ofcPolygonErc20(
    'cc3e949c-720b-46b9-bde2-d7306e393b60',
    'ofcpolygon:gtc',
    'Gitcoin (PoS)',
    18,
    UnderlyingAsset['polygon:gtc']
  ),
  ofcPolygonErc20(
    '485022f8-1930-453b-909e-1aa5f406e824',
    'ofcpolygon:gusd',
    'Gemini dollar',
    2,
    UnderlyingAsset['polygon:gusd'],
    undefined,
    [CoinFeature.STABLECOIN]
  ),
  ofcPolygonErc20(
    'a6eb179c-c5e5-429d-8cfe-6d01ddf3c9cb',
    'ofcpolygon:heth',
    'ETH Hop Token',
    18,
    UnderlyingAsset['polygon:heth']
  ),
  ofcPolygonErc20('5a6976af-0546-48ee-b451-7c8abb93e892', 'ofcpolygon:hex', 'HEX', 8, UnderlyingAsset['polygon:hex']),
  ofcPolygonErc20(
    '5d428183-398c-42de-ae71-a42f1b4f941f',
    'ofcpolygon:hot',
    'HoloToken',
    18,
    UnderlyingAsset['polygon:hot']
  ),
  ofcPolygonErc20(
    'adceecd9-0e84-4abb-b6fd-dadf2f1f4a4a',
    'ofcpolygon:inj',
    'Injective Token',
    18,
    UnderlyingAsset['polygon:inj']
  ),
  ofcPolygonErc20(
    '9c3d5127-72a6-4b44-8932-ffcc733532e9',
    'ofcpolygon:iotx',
    'IoTeX Network',
    18,
    UnderlyingAsset['polygon:iotx']
  ),
  ofcPolygonErc20(
    '62ece06c-e202-4bcf-8a08-7d321ab9e634',
    'ofcpolygon:l3usd',
    'L3USD',
    18,
    UnderlyingAsset['polygon:l3usd']
  ),
  ofcPolygonErc20(
    '1774f7fb-e6e6-436a-850f-a824bc6d5e72',
    'ofcpolygon:lif3',
    'LIF3',
    18,
    UnderlyingAsset['polygon:lif3']
  ),
  ofcPolygonErc20(
    '0303974a-c9cb-4dee-bb55-3f1e3da41893',
    'ofcpolygon:lit',
    'Litentry',
    18,
    UnderlyingAsset['polygon:lit']
  ),
  ofcPolygonErc20(
    '0dbdb1ad-f959-42a8-97de-d96a8f1be944',
    'ofcpolygon:lrc',
    'LoopringCoin V2',
    18,
    UnderlyingAsset['polygon:lrc']
  ),
  ofcPolygonErc20(
    '33cea60a-3106-4b02-b718-0eef8afda6be',
    'ofcpolygon:mana',
    'Decentraland',
    18,
    UnderlyingAsset['polygon:mana']
  ),
  ofcPolygonErc20(
    'cf8f2170-1b96-411c-831b-7ea0c065064f',
    'ofcpolygon:mkr',
    'Maker',
    18,
    UnderlyingAsset['polygon:mkr']
  ),
  ofcPolygonErc20(
    '92ddee49-4409-4aab-b7dc-f8b9bb956cd1',
    'ofcpolygon:nexo',
    'Nexo',
    18,
    UnderlyingAsset['polygon:nexo']
  ),
  ofcPolygonErc20(
    '858ddcbc-2bfd-4183-8271-d95c12e27bd7',
    'ofcpolygon:npt',
    'NEOPIN Token',
    18,
    UnderlyingAsset['polygon:npt']
  ),
  ofcPolygonErc20(
    'b03c1ff4-4fb1-4e94-9c6b-f9c50717203c',
    'ofcpolygon:om',
    'MANTRA DAO',
    18,
    UnderlyingAsset['polygon:om']
  ),
  ofcPolygonErc20(
    'e48b7abf-f409-4709-b5bb-0f97d917cf6f',
    'ofcpolygon:ont',
    'Poly-Peg Ontology Token',
    9,
    UnderlyingAsset['polygon:ont']
  ),
  ofcPolygonErc20(
    '734a0b5f-f6ee-4073-a480-e1f15e225767',
    'ofcpolygon:ooki',
    'Ooki Protocol',
    18,
    UnderlyingAsset['polygon:ooki']
  ),
  ofcPolygonErc20(
    'bf17ae96-72ee-49d5-9c31-758bc102dad1',
    'ofcpolygon:orb',
    'OrbCity (ORB)',
    18,
    UnderlyingAsset['polygon:orb']
  ),
  ofcPolygonErc20(
    '5c217564-07d9-47e8-87af-1ca0ebf30d26',
    'ofcpolygon:oxt',
    'Orchid',
    18,
    UnderlyingAsset['polygon:oxt']
  ),
  ofcPolygonErc20(
    'e4d5929c-4c52-430a-a4d6-aca61997b833',
    'ofcpolygon:pax',
    'Paxos Standard',
    18,
    UnderlyingAsset['polygon:pax']
  ),
  ofcPolygonErc20(
    '07998da1-b196-4b52-948a-85a086f9e08f',
    'ofcpolygon:paxg',
    'Paxos Gold',
    18,
    UnderlyingAsset['polygon:paxg']
  ),
  ofcPolygonErc20('8a74539f-471e-4cee-930a-fe238af01871', 'ofcpolygon:pme', 'PME', 0, UnderlyingAsset['polygon:pme']),
  ofcPolygonErc20(
    'e356c3c0-ba8b-4a66-8e4e-c3e5d203f435',
    'ofcpolygon:powr',
    'PowerLedger',
    18,
    UnderlyingAsset['polygon:powr']
  ),
  ofcPolygonErc20(
    'd21259f1-f7a6-44fc-b9b5-2333ba34cdcf',
    'ofcpolygon:pyr',
    'PYR Token',
    18,
    UnderlyingAsset['polygon:pyr']
  ),
  ofcPolygonErc20(
    'd094bef1-1773-406a-96dd-e8da0bd0dd71',
    'ofcpolygon:renbtc',
    'renBTC',
    8,
    UnderlyingAsset['polygon:renbtc']
  ),
  ofcPolygonErc20(
    '9f4010d5-50b7-4a63-8e72-c019b537acab',
    'ofcpolygon:req',
    'Request',
    18,
    UnderlyingAsset['polygon:req']
  ),
  ofcPolygonErc20(
    'f47fc78d-05d5-4df9-b9dc-fc9bee0b5da2',
    'ofcpolygon:rndr',
    'Render Token',
    18,
    UnderlyingAsset['polygon:rndr']
  ),
  ofcPolygonErc20(
    '5c17b285-4c8f-4a1e-a10f-98624956a719',
    'ofcpolygon:route',
    'Route (ROUTE)',
    18,
    UnderlyingAsset['polygon:route']
  ),
  ofcPolygonErc20(
    '9ee3afa7-d644-4a3d-8459-7679c0c5dbfd',
    'ofcpolygon:shib',
    'SHIBA INU (PoS)',
    18,
    UnderlyingAsset['polygon:shib']
  ),
  ofcPolygonErc20(
    '0e61469e-745b-4453-9da2-a384b636e634',
    'ofcpolygon:snx',
    'Synthetix Network Token (PoS)',
    18,
    UnderlyingAsset['polygon:snx']
  ),
  ofcPolygonErc20(
    '9c50b095-bde1-41cd-aafd-2c8d4c309a51',
    'ofcpolygon:super',
    'SuperFarm',
    18,
    UnderlyingAsset['polygon:super']
  ),
  ofcPolygonErc20(
    '9121803e-0473-42d3-b55d-f2ab92b0a159',
    'ofcpolygon:swap',
    'TrustSwap Token',
    18,
    UnderlyingAsset['polygon:swap']
  ),
  ofcPolygonErc20(
    '1b244d52-6b4c-4f5e-9b52-78d4ba29d75c',
    'ofcpolygon:sxp',
    'Swipe',
    18,
    UnderlyingAsset['polygon:sxp']
  ),
  ofcPolygonErc20(
    'd564f196-2a6d-4c25-88b9-7768b01dbd4a',
    'ofcpolygon:trb',
    'Tellor Tributes',
    18,
    UnderlyingAsset['polygon:trb']
  ),
  ofcPolygonErc20(
    '8b2904a0-4e6e-456e-beaa-ca0ee07decde',
    'ofcpolygon:uft',
    'UniLend Finance Token',
    18,
    UnderlyingAsset['polygon:uft']
  ),
  ofcPolygonErc20('3e4652c4-8122-448d-8cf6-1efea18cd963', 'ofcpolygon:uhu', 'Uhu', 18, UnderlyingAsset['polygon:uhu']),
  ofcPolygonErc20(
    '2e31da22-1824-4f3e-86f2-51f15971e4f0',
    'ofcpolygon:uma',
    'UMA Voting Token (v1)',
    18,
    UnderlyingAsset['polygon:uma']
  ),
  ofcPolygonErc20(
    'ad4a98a9-096a-4743-9881-2ac66eff214b',
    'ofcpolygon:uni',
    'Uniswap',
    18,
    UnderlyingAsset['polygon:uni']
  ),
  ofcPolygonErc20(
    'c6e1880d-eed5-4729-9128-5a71e47b2681',
    'ofcpolygon:vanry',
    'Vanar Chain Token',
    18,
    UnderlyingAsset['polygon:vanry']
  ),
  ofcPolygonErc20(
    '1d5f140f-bc72-47b6-a80e-332e54f3c8dc',
    'ofcpolygon:naka',
    'Nakamoto Games',
    18,
    UnderlyingAsset['polygon:naka']
  ),
  ofcPolygonErc20(
    '54c8d334-e87c-445d-abe1-9cf6741534ba',
    'ofcpolygon:volt',
    'Volt Inu',
    9,
    UnderlyingAsset['polygon:volt']
  ),
  ofcPolygonErc20(
    '37d33ab5-7a28-4823-bfbb-86cb616180d2',
    'ofcpolygon:voxel',
    'VOXEL Token',
    18,
    UnderlyingAsset['polygon:voxel']
  ),
  ofcPolygonErc20(
    '4b37fd1c-23c4-46fe-bbc1-bad036a9b6d0',
    'ofcpolygon:wrx',
    'Wazirx (PoS)',
    8,
    UnderlyingAsset['polygon:wrx']
  ),
  ofcPolygonErc20('c0556aae-6646-4160-b4cc-db361af3019c', 'ofcpolygon:zrx', 'ZRX', 18, UnderlyingAsset['polygon:zrx']),
  ofcPolygonErc20(
    'aad4471b-6949-432f-814a-d888e50bb957',
    'ofcpolygon:xusd',
    'StraitsX USD',
    6,
    UnderlyingAsset['polygon:xusd'],
    undefined,
    [CoinFeature.STABLECOIN]
  ),
  ofcPolygonErc20(
    '06a9c149-4834-4173-be46-1c78cd624140',
    'ofcpolygon:zig',
    'ZIGChain',
    18,
    UnderlyingAsset['polygon:zig']
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
    UnderlyingAsset['tpolygon:usdc'],
    undefined,
    [CoinFeature.STABLECOIN]
  ),
  tofcPolygonErc20(
    '2136098f-9949-43a9-90f2-d8e5f0855e5d',
    'ofctpolygon:usdt',
    'Tether USD',
    6,
    UnderlyingAsset['tpolygon:usdt'],
    undefined,
    [CoinFeature.STABLECOIN]
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
  tofcPolygonErc20(
    'af1a275c-cfa8-4137-ad9a-1e79c0e3a8f7',
    'ofctpolygon:txusd',
    'Test StraitsX USD',
    6,
    UnderlyingAsset['polygon:txusd']
  ),

  ofcAlgoToken(
    'fec37305-8fb8-4c23-b42c-b4696d579eb9',
    'ofcalgo:usdc',
    'Algorand USDC',
    6,
    UnderlyingAsset['algo:USDC-31566704'],
    undefined,
    [...ACCOUNT_COIN_DEFAULT_FEATURES, CoinFeature.STABLECOIN]
  ),

  tofcAlgoToken(
    'a4965de2-467b-45f6-9729-35f57fd6f035',
    'ofctalgo:usdc',
    'Test Algorand USDC',
    6,
    UnderlyingAsset['talgo:USDC-10458941'],
    undefined,
    [...ACCOUNT_COIN_DEFAULT_FEATURES, CoinFeature.STABLECOIN]
  ),

  ofcHederaToken(
    'a7eceae2-145c-4d35-a8d4-3c1149c2fe06',
    'ofchbar:usdc',
    'Mainnet Hedera USD Coin',
    6,
    UnderlyingAsset.USDC,
    undefined,
    [CoinFeature.STABLECOIN]
  ),
  ofcHederaToken(
    'd59935a2-e435-4ffa-b519-443310c80830',
    'ofchbar:karate',
    'Karate Combat',
    8,
    UnderlyingAsset['hbar:karate']
  ),
  ofcHederaToken(
    '0e2b2946-3e4f-4fc1-a3a0-650850e37207',
    'ofchbar:co2e',
    'OrbexCO2-dAluminium',
    3,
    UnderlyingAsset['hbar:co2e']
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
  ofcHederaToken(
    '7fef72fa-01bf-452e-952d-4d403475ca76',
    'ofchbar:bonzo',
    'Bonzo Finance',
    8,
    UnderlyingAsset['hbar:bonzo']
  ),
  ofcHederaToken(
    '3294e3f7-8996-4de8-8b56-fd0303080bbf',
    'ofchbar:hsuite',
    'HbarSuite',
    4,
    UnderlyingAsset['hbar:hsuite']
  ),

  tofcHederaToken(
    'e12614d8-21de-4303-91fa-f13a44c4902a',
    'ofcthbar:usdc',
    'Testnet Hedera USD Coin',
    6,
    UnderlyingAsset.USDC,
    undefined,
    [CoinFeature.STABLECOIN]
  ),

  ofcStellarToken(
    'fd90a80b-d615-434e-9821-1ef179a06071',
    'ofcxlm:usdc',
    'Stellar USDC',
    7,
    UnderlyingAsset['xlm:USDC-GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN'],
    undefined,
    [...ACCOUNT_COIN_DEFAULT_FEATURES, CoinFeature.STABLECOIN]
  ),

  ofcStellarToken(
    '612c9f4e-3c0d-496b-97cb-b4035ded678d',
    'ofcxlm:benji',
    'Benji',
    7,
    UnderlyingAsset['xlm:BENJI-GBHNGLLIE3KWGKCHIKMHJ5HVZHYIK7WTBE4QF5PLAKL4CJGSEU7HZIW5']
  ),

  ofcStellarToken(
    '0b731a87-9ed2-4a5b-a7ac-59c3a6d37ea6',
    'ofcxlm:gbenji',
    'Gbenji',
    7,
    UnderlyingAsset['xlm:gBENJI-GD5J73EKK5IYL5XS3FBTHHX7CZIYRP7QXDL57XFWGC2WVYWT326OBXRP']
  ),
  ofcStellarToken(
    'fef22a7c-6599-4a9c-8283-a5bdae883023',
    'ofcxlm:shx',
    'Stronghold SHx',
    7,
    UnderlyingAsset['xlm:SHX-GDSTRSHXHGJ7ZIVRBXEYE5Q74XUVCUSEKEBR7UCHEUUEK72N7I7KJ6JH']
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
  tofcArbethErc20(
    '52048169-4cb3-4a7c-9d7e-c0a1cabe2a47',
    'ofctarbeth:bull',
    'Test BULL',
    18,
    UnderlyingAsset['arbeth:bull']
  ),
  ofcaptToken('6d027643-3d96-4627-8312-1151a793d4f8', 'ofcapt:usdc', 'USD Coin', 6, UnderlyingAsset['apt:usdc'], [
    ...APT_OFC_TOKEN_FEATURES,
    CoinFeature.STABLECOIN,
  ]),
  ofcaptToken(
    '5d781823-37b5-4e50-bc3b-d078420f2972',
    'ofcapt:benji',
    'Frk OnChain US Gov Mon Fd',
    9,
    UnderlyingAsset['apt:benji'],
    APT_OFC_TOKEN_FEATURES
  ),
  ofcaptToken(
    'f859a05e-8c4b-4e43-bc0c-f6444c44c8e3',
    'ofcapt:pact',
    'PACT',
    8,
    UnderlyingAsset['apt:pact'],
    APT_OFC_TOKEN_FEATURES
  ),
  ofcaptToken('8dbee739-3a5e-4113-b823-5d7cdc23471a', 'ofcapt:usd1', 'USD1', 6, UnderlyingAsset['apt:usd1'], [
    ...APT_OFC_TOKEN_FEATURES,
    CoinFeature.STABLECOIN,
  ]),
  ofcaptToken('d15ec98e-1c8f-4c2d-9ede-e34edb3980b5', 'ofcapt:usdt', 'USD Tether', 6, UnderlyingAsset['apt:usdt'], [
    ...APT_OFC_TOKEN_FEATURES,
    CoinFeature.STABLECOIN,
  ]),
  ofcaptToken(
    '5ee043c0-d843-4ffa-920c-3099e9891f81',
    'ofcapt:lsd',
    'Pontem Liquidswap',
    8,
    UnderlyingAsset['apt:lsd'],
    APT_OFC_TOKEN_FEATURES
  ),
  ofcaptToken(
    'bf846ec7-5a8b-46aa-a3f8-23123fdc0b06',
    'ofcapt:kgen',
    'KGEN',
    8,
    UnderlyingAsset['apt:kgen'],
    APT_OFC_TOKEN_FEATURES
  ),
  tofcaptToken(
    '3f49b498-f273-4237-9668-1987c420a258',
    'ofctapt:stgusd1',
    'Test USD1 Token',
    6,
    UnderlyingAsset['tapt:stgusd1'],
    [...APT_OFC_TOKEN_FEATURES, CoinFeature.STABLECOIN]
  ),
  tofcaptToken(
    '63a0addc-4c8c-45a6-9d68-e306c839b10c',
    'ofctapt:usd1',
    'Test USD1 Token',
    6,
    UnderlyingAsset['tapt:usd1'],
    [...APT_OFC_TOKEN_FEATURES, CoinFeature.STABLECOIN]
  ),
  ofcStxToken('2d2f9c7f-7d10-480e-a0ef-6893cf4d3493', 'ofcstx:sbtc', 'sBTC', 8, UnderlyingAsset['stx:sbtc']),
  ofcStxToken(
    'cc76810a-e19c-4123-ad0c-be39ce08550a',
    'ofcstx:susdh',
    'sUSDH',
    8,
    UnderlyingAsset['stx:susdh'],
    undefined,
    [CoinFeature.STABLECOIN]
  ),
  ofcStxToken('df131c24-8458-49ea-8f7d-7dcce6b13ad9', 'ofcstx:ststx', 'stSTX', 6, UnderlyingAsset['stx:ststx']),
  tofcStxToken('a7f63434-b424-4f8f-94d8-476f827e4d1b', 'ofctstx:tsbtc', 'Test sBTC', 8, UnderlyingAsset['tstx:tsbtc']),
  ofcStxToken('10210906-6701-4c25-a204-0fe7399bae83', 'ofcstx:alex', 'Alex Labs', 8, UnderlyingAsset['stx:alex']),
  ofcStxToken(
    '6eefa66f-3065-48db-b78f-3ae4e2172a41',
    'ofcstx:aeusdc',
    'Allbridge Bridged USDC',
    6,
    UnderlyingAsset['stx:aeusdc'],
    undefined,
    [CoinFeature.STABLECOIN]
  ),
  ofcStxToken(
    'b4ef967b-7aa3-4252-9366-bbcffffd1c4d',
    'ofcstx:usdh',
    'USDH',
    8,
    UnderlyingAsset['stx:usdh'],
    undefined,
    [CoinFeature.STABLECOIN]
  ),
  ofcStxToken('511fc482-d962-4c29-9921-4a7d99405e64', 'ofcstx:welsh', 'Welsh', 6, UnderlyingAsset['stx:welsh']),

  //Nep141
  ofcnep141Token('ae7413e9-147d-4f72-a180-e9d1ed4bb885', 'ofcnear:usdc', 'USD Coin', 6, UnderlyingAsset['near:usdc'], [
    CoinFeature.STABLECOIN,
  ]),
  ofcnep141Token(
    '8e2467c9-f261-4e2e-abc6-cf08655359f8',
    'ofcnear:usdt',
    'Tether USD',
    6,
    UnderlyingAsset['near:usdt'],
    [CoinFeature.STABLECOIN]
  ),
  tofcnep141Token(
    'a3a47204-c114-42d7-b673-0a5f60ca0d9e',
    'ofctnear:tnep24dp',
    'Test NEP141 Token 24 Decimals',
    24,
    UnderlyingAsset['tnear:tnep24dp']
  ),
  tofcnep141Token(
    '09ebe08e-8b56-4d28-bf51-7c328e903aff',
    'ofctnear:usdc',
    'USD Coin',
    6,
    UnderlyingAsset['tnear:usdc'],
    [CoinFeature.STABLECOIN]
  ),
  ofcWorldErc20('809418f2-d9e7-4604-bc17-e7dc881324c3', 'ofcworld:wld', 'Worldcoin', 18, UnderlyingAsset['world:wld']),
  ofcWorldErc20(
    'b37a7ce1-3be3-4df1-808d-8cc9065c7ed7',
    'ofcworld:usdc',
    'USDC',
    6,
    UnderlyingAsset['world:usdc'],
    undefined,
    [CoinFeature.STABLECOIN]
  ),
  tofcWorldErc20(
    'ed63bc0a-f979-4abb-953b-edb17cf9efd0',
    'ofctworld:wld',
    'Worldcoin Testnet',
    18,
    UnderlyingAsset['tworld:wld']
  ),
  tofcWorldErc20(
    'c377fb3f-06fb-41bb-b875-13f92fde8875',
    'ofctworld:usdc',
    'USDC Testnet',
    6,
    UnderlyingAsset['tworld:usdc'],
    undefined,
    [CoinFeature.STABLECOIN]
  ),
  ofcCoredaoErc20(
    '5bca7dee-35e6-46bc-8bb3-b53edd67c817',
    'ofccoredao:stcore',
    'stCore Token',
    18,
    UnderlyingAsset['coredao:stcore']
  ),
  tofcCoredaoErc20(
    'db4127bd-7c90-47c5-a9d8-7ca0d7ee1d2c',
    'ofctcoredao:stcore',
    'Testnet stCore token',
    18,
    UnderlyingAsset['tcoredao:stcore']
  ),
  ofcVetToken('6a41f407-c05c-4038-9175-67ffe7a26410', 'ofcvet:vtho', 'VeThor', 18, UnderlyingAsset['vet:vtho']),
  tofcVetToken(
    '60966c89-d54a-40fb-abf5-08b7b0b1bb79',
    'ofctvet:vtho',
    'Testnet VeThor',
    18,
    UnderlyingAsset['tvet:vtho']
  ),
  ofcHashToken('705402cb-b92f-4b32-8899-1f3f4dec1406', 'ofchash:ylds', 'YLDS Token', 6, UnderlyingAsset['hash:ylds']),
  tofcHashToken(
    'd2277bf2-0f95-4ede-9b38-aebac7ae9962',
    'ofcthash:ylds',
    'Testnet YLDS Token',
    6,
    UnderlyingAsset['thash:ylds']
  ),
];
