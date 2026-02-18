import { OfcCoin, ofcerc20, tofcerc20 } from '../ofc';
import { CoinFeature, UnderlyingAsset } from '../base';
import { AccountCoin } from '../account';

export const ofcErc20Coins = [
  ofcerc20('a6b6dd56-c25e-45a3-83e5-5da0f95d27d2', 'ofcpol', 'Polygon Ecosystem Token', 18, UnderlyingAsset.POL),
  ofcerc20('3ed9ccb5-7dc9-46fe-8003-d19a12ffd258', 'ofcgods', 'Gods Unchained', 18, UnderlyingAsset.GODS),
  ofcerc20('36af444a-7829-4d78-8b34-7197ce4a34b9', 'ofcplanet', 'Planet', 18, UnderlyingAsset.PLANET),
  ofcerc20('20274306-7e40-43ac-ae91-d7744352f4e0', 'ofcbadger', 'Badger', 18, UnderlyingAsset.BADGER),
  ofcerc20('162eff5b-36e0-4b7e-b844-381d49b9aaaa', 'ofcmpl', 'Maple Token', 18, UnderlyingAsset.MPL),
  ofcerc20('c8dbdc91-4fff-4548-8238-9fa7948b51b9', 'ofcuqc', 'Uquid Coin', 18, UnderlyingAsset.UQC),
  ofcerc20('df7e1b01-b813-43ef-8ca4-e9d23652f976', 'ofcreq', 'Request', 18, UnderlyingAsset.REQ),
  ofcerc20('a6696c8c-44b3-4a6f-bf6c-9ac1cb4ac8e1', 'ofcrare', 'SuperRare', 18, UnderlyingAsset.RARE),
  ofcerc20('cd568cfc-ca69-4714-b8ba-a274a633f139', 'ofcboba', 'Boba Token', 18, UnderlyingAsset.BOBA),
  ofcerc20('3dd7a8b9-01d4-4ca3-9d18-0128a70333ef', 'ofcwild', 'Wilder World', 18, UnderlyingAsset.WILD),
  ofcerc20('2f23fc77-132b-4a30-a8ff-9320f9e7a57d', 'ofcdodo', 'DODO', 18, UnderlyingAsset.DODO),
  ofcerc20('1fa78af9-e888-4863-a11c-576cc611fc3c', 'ofcflip', 'Chainflip', 18, UnderlyingAsset.FLIP),
  ofcerc20('104a71f2-4edf-4c27-82fd-83cea89aa6cd', 'ofcach', 'Alchemy Pay', 8, UnderlyingAsset.ACH),
  ofcerc20('d92d739a-73a1-49ae-a906-47a53f3ee956', 'ofcgog', 'Guild of Guardians', 18, UnderlyingAsset.GOG),
  ofcerc20('5564f688-af13-4a14-9b15-7058ca3d9bf2', 'ofcstg', 'StargateToken', 18, UnderlyingAsset.STG),
  ofcerc20('2eb92d2b-c869-4137-b5ba-c18d7bc5f4c0', 'ofcloom', 'Loom Network', 18, UnderlyingAsset.LOOM),
  ofcerc20('cfbd695a-b963-4c05-8b3c-622368beab42', 'ofcsyn', 'Synapse', 18, UnderlyingAsset.SYN),
  ofcerc20('f39fcfdc-0714-48c7-b84c-42db804cdac4', 'ofcnym', 'NYM', 6, UnderlyingAsset.NYM),
  ofcerc20('6ce29837-96cf-466a-acd8-9be929de3e56', 'ofcorai', 'Orai Token', 18, UnderlyingAsset.ORAI),
  ofcerc20('e3614075-c617-4202-8558-5584ca41d931', 'ofcpyr', 'Pyr Token', 18, UnderlyingAsset.PYR),
  ofcerc20('0c988abe-9ec4-4620-8cde-2a2861846259', 'ofccqt', 'Covalent', 18, UnderlyingAsset.CQT),
  ofcerc20('8ff11c4c-e2e6-4594-b470-7db06309f6a9', 'ofcabt', 'ArcBlock', 18, UnderlyingAsset.ABT),
  ofcerc20(
    '13932184-363f-4602-9573-c2d56b33bacd',
    'ofcali',
    'Artificial Liquid Intelligence Token',
    18,
    UnderlyingAsset.ALI
  ),
  ofcerc20('bd61426f-87d8-4c52-b47d-2dc5eed84f64', 'ofcnmr', 'Numeraire', 18, UnderlyingAsset.NMR),
  ofcerc20('3db3b895-756c-4c95-9dea-08d283f09a7a', 'ofcmeme', 'Meme', 8, UnderlyingAsset.MEME),
  ofcerc20('acf1a5a3-4555-4aa2-8c80-4e2cd4cdb61c', 'ofceth:meme', 'meme', 18, underlyingAssetForSymbol('eth:meme')),

  ofcerc20('8a73d170-28c1-48c9-8d3c-c7ea374f4414', 'ofcband', 'Band Protocol', 18, UnderlyingAsset.BAND),
  ofcerc20('ad5d8cf4-59b5-4b82-b1ee-d5d0d6ba5944', 'ofcant', 'Aragon', 18, UnderlyingAsset.ANT),
  ofcerc20('2092c0cc-19cf-42b2-90a0-123b1904d901', 'ofcpyusd', 'PayPal USD', 6, UnderlyingAsset.PYUSD, undefined, [
    CoinFeature.STABLECOIN,
  ]),
  ofcerc20('8304c497-523d-4f3f-8744-65e2e5ebd5a5', 'ofc1inch', '1Inch Token', 18, UnderlyingAsset['1INCH']),
  ofcerc20('28024a59-6fbb-4156-96e4-2ba7747e8581', 'ofcusdc', 'USD Coin', 6, UnderlyingAsset.USDC, undefined, [
    CoinFeature.STABLECOIN,
  ]),
  ofcerc20(
    'ee579200-2f43-41f3-ba2e-365bcb20ff21',
    'ofcusdm1',
    'USDM1',
    18,
    underlyingAssetForSymbol('eth:usdm1'),
    undefined,
    [...OfcCoin.DEFAULT_FEATURES, CoinFeature.STABLECOIN]
  ),
  ofcerc20('f790e63d-9785-4e98-b323-897fdc489613', 'ofcaave', 'Aave', 18, UnderlyingAsset.AAVE),
  ofcerc20('a3b0e98b-3a50-4ee7-a290-696b4cbce666', 'ofcape', 'ApeCoin', 18, UnderlyingAsset.APE),
  ofcerc20('15c3f5fb-255c-4ef6-9df3-767b3aa2b36d', 'ofcaudio', 'Audio', 18, UnderlyingAsset.AUDIO),
  ofcerc20('2ea24af7-8b2e-400f-afee-9b11aeef141e', 'ofcaxs', 'Axie Infinity Shards', 18, UnderlyingAsset.AXS),
  ofcerc20('eaa20cea-78fe-46f5-a5f8-d29f69f5a543', 'ofcaxsv2', 'Axie Infinity Shards V2', 18, UnderlyingAsset.AXSV2),
  ofcerc20('d8811a30-e948-44fc-b636-8a250fd86fae', 'ofcakro', 'Akropolis', 18, UnderlyingAsset.AKRO),
  ofcerc20('6f28e645-9f4c-4825-b97f-20e65708d464', 'ofcbat', 'Basic Attention Token', 18, UnderlyingAsset.BAT),
  ofcerc20('ae72248b-19fb-4736-9430-caf68615a751', 'ofcbal', 'Balancer', 18, UnderlyingAsset.BAL),
  ofcerc20('8541eeed-0478-45fe-bff9-4bcc63ef3f67', 'ofcbico', 'Biconomy', 18, UnderlyingAsset.BICO),
  ofcerc20('48e33478-36b0-4332-a792-6b4d629c2376', 'ofcbit', 'BitDAO', 18, UnderlyingAsset.BIT),
  ofcerc20('4bc691c4-dcdd-4b78-be96-1e87269c3caf', 'ofcbnb', 'BNB Token (ETH Network)', 18, UnderlyingAsset.BNB),
  ofcerc20('7a76184c-b4b2-4c87-81bc-0c496c605488', 'ofcbnt', 'Bancor', 18, UnderlyingAsset.BNT),
  ofcerc20('f142074d-8d94-442b-a0e3-3f09c98acaeb', 'ofcbtrst', 'Braintrust', 18, UnderlyingAsset.BTRST),
  ofcerc20('779e9fa5-e4f2-4c74-947a-5b5df61e66df', 'ofcbusd', 'Binance USD', 18, UnderlyingAsset.BUSD, undefined, [
    CoinFeature.STABLECOIN,
  ]),
  ofcerc20('50dab286-6071-4298-893b-fb6c38e3442b', 'ofccel', 'Celsius', 4, UnderlyingAsset.CEL),
  ofcerc20('94ea31eb-f35d-4075-a9fe-90a91a6b03f8', 'ofccelr', 'Celer Network', 18, UnderlyingAsset.CELR),
  ofcerc20('f019a286-14bb-4e27-9c08-3c6216a59851', 'ofccfx', 'Conflux', 18, UnderlyingAsset.CFX),
  ofcerc20('37e74937-5392-423b-a3d5-d46dfb15251c', 'ofcchsb', 'SwissBorg', 8, UnderlyingAsset.CHSB),
  ofcerc20('e20ad46f-91ca-4bed-9484-74d1b4808672', 'ofccomp', 'Compound Token', 18, UnderlyingAsset.COMP),
  ofcerc20('3a0ae54e-223c-42c9-918f-effdd297db65', 'ofccro', 'Crypto.com Chain', 8, UnderlyingAsset.CRO),
  ofcerc20('78f617b7-67a5-44e1-9748-b3590ee3b067', 'ofccrv', 'Curve DAO Token', 18, UnderlyingAsset.CRV),
  ofcerc20('a0eb6fcf-584c-4b9d-8872-e0c6d0e31635', 'ofcctsi', 'Cartesi', 18, UnderlyingAsset.CTSI),
  ofcerc20('65d62bc2-da9a-4cf4-8055-950c30cf7007', 'ofccvc', 'Civic', 8, UnderlyingAsset.CVC),
  ofcerc20('a9da25db-54b2-4747-b689-dff98b53914b', 'ofccvx', 'Convex Finance', 18, UnderlyingAsset.CVX),
  ofcerc20('847caaf2-f113-4bea-84cd-b381f0b3a0f4', 'ofcdai', 'Dai', 18, UnderlyingAsset.DAI),
  ofcerc20('3ffbfd6d-adf6-499e-a6ba-b1888b7f08db', 'ofcdao', 'DAO Maker', 18, UnderlyingAsset.DAO),
  ofcerc20('5b5f980a-d38f-431a-bfdf-0378881c0bcd', 'ofcdent', 'Dent', 8, UnderlyingAsset.DENT),
  ofcerc20('8a2e92c4-4808-44a0-860b-4fbfbd8ffdcb', 'ofcdep', 'Deap Coin', 18, UnderlyingAsset.DEP),
  ofcerc20('801e7818-722a-4c47-81af-69ed982c1f16', 'ofcdfi', 'DeFiChain', 8, UnderlyingAsset.DFI),
  ofcerc20('8933c68b-3171-4e35-8818-7d70bca263f1', 'ofcdydx', 'dYdX', 18, UnderlyingAsset.DYDX),
  ofcerc20('66be30f3-4a5d-44fb-b5b9-633dee857479', 'ofcelf', 'Aelf', 18, UnderlyingAsset.ELF),
  ofcerc20('7c80fbda-ef76-4424-b52f-07b0c4a25dcb', 'ofcens', 'Ethereum Name Service', 18, UnderlyingAsset.ENS),
  ofcerc20('544687ae-0df4-4d5a-89a3-bcf2199077d8', 'ofceurs', 'Stasis EURS', 2, UnderlyingAsset.EURS),
  ofcerc20('47ba857c-07f9-41c1-a0ea-1258ae0dfdac', 'ofcftt', 'FTX Token', 18, UnderlyingAsset.FTT),
  ofcerc20('222c71b9-0731-49d5-988e-0fbe1a799901', 'ofcfun', 'FunFair', 8, UnderlyingAsset.FUN),
  ofcerc20('d559fab8-c9f2-4468-a573-f4d29d4e4d30', 'ofcfxs', 'Frax Share', 18, UnderlyingAsset.FXS),
  ofcerc20('5fcfaf16-39c1-4a33-9a35-6d1d782fa515', 'ofcgbpt', 'Poundtoken', 18, UnderlyingAsset.GBPT),
  ofcerc20('91c416ad-bf1d-4949-afa6-e081bc55abd1', 'ofcgrt', 'The Graph', 18, UnderlyingAsset.GRT),
  ofcerc20('90007187-b079-4613-91b8-02b0eb90bc1e', 'ofcgfi', 'Goldfinch', 18, UnderlyingAsset.GFI),
  ofcerc20('c9ae628a-55e2-41b8-945a-dc297badc2ac', 'ofcgtc', 'Gitcoin', 18, UnderlyingAsset.GTC),
  ofcerc20('35bd0f1e-ca2c-4bba-9541-7d9f5d1b0a92', 'ofchum', 'HumanScape', 18, UnderlyingAsset.HUM),
  ofcerc20('dfd3425a-f8c8-47f9-896c-9f2fa8dd5a7c', 'ofchxro', 'Hxro', 18, UnderlyingAsset.HXRO),
  ofcerc20('dd29dc35-a569-4c20-a116-e70bfaaa8619', 'ofcimx', 'Immutable X', 18, UnderlyingAsset.IMX),
  ofcerc20('3b4082ef-4061-495a-95f9-c405e3cb9866', 'ofcimxv2', 'Immutable X', 18, UnderlyingAsset.IMXV2),
  ofcerc20('9a412bff-2dc2-43a0-bde3-bf6df401f16b', 'ofcinj', 'Injective Token', 18, UnderlyingAsset.INJV2),
  ofcerc20('e1997001-ae6a-4ef4-8dc5-708d06b360e9', 'ofckeep', 'Keep', 18, UnderlyingAsset.KEEP),
  ofcerc20('c7196c54-a262-49dd-9690-839ad1d14d9d', 'ofcknc', 'Kyber Network', 18, UnderlyingAsset.KNC2),
  ofcerc20('b20a48eb-a9b5-4bc7-b5a1-3b6317c542f8', 'ofclink', 'ChainLink', 18, UnderlyingAsset.LINK),
  ofcerc20('733c97e2-60ba-4b00-b897-4b0c8d49367d', 'ofclooks', 'LooksRare', 18, UnderlyingAsset.LOOKS),
  ofcerc20('785debb3-cd34-4043-92c4-8d777c2a803b', 'ofclrc', 'loopring', 18, UnderlyingAsset.LRC),
  ofcerc20('851febfa-1b5c-4220-bf23-356debeb13fe', 'ofclrcv2', 'loopring V2', 18, UnderlyingAsset.LRCV2),
  ofcerc20('7febf4f7-02e8-4d3d-bdef-98e44d2cab14', 'ofcmana', 'Decentraland', 18, UnderlyingAsset.MANA),
  ofcerc20('c1db2b60-7bc2-4503-89d5-4d73f83e49ea', 'ofcmatic', 'Matic Token', 18, UnderlyingAsset.MATIC),
  ofcerc20('a41c3d2e-d0b3-4f9e-bebc-33f7343e51ac', 'ofcmcdai', 'Dai', 18, UnderlyingAsset.MCDAI),
  ofcerc20('ca3187fa-c9f1-4d18-8556-16b9b202ce55', 'ofcmkr', 'Maker', 18, UnderlyingAsset.MKR),
  ofcerc20('a67fc93e-d136-4d39-8bdb-1d786076536b', 'ofcomg', 'OmiseGO Token', 18, UnderlyingAsset.OMG),
  ofcerc20('30ed53e1-aed6-48a6-bfc8-7045876c7d86', 'ofcop', 'Optimism', 18, UnderlyingAsset.OP),
  ofcerc20('d352ad2c-11a5-4816-9b88-af8ee1e4a8e7', 'ofcperp', 'Perpetual Protocol', 18, UnderlyingAsset.PERP),
  ofcerc20('40cee5b1-8930-4fb1-9390-5483e0732649', 'ofcsand', 'Sand', 18, UnderlyingAsset.SAND),
  ofcerc20('51a45c2d-5949-46b7-a87a-a67ec5afd98d', 'ofcshib', 'Shiba Inu', 18, UnderlyingAsset.SHIB),
  ofcerc20('f3cfe483-3aab-4d9f-8990-08c2910c3f17', 'ofcsnx', 'Synthetix Network', 18, UnderlyingAsset.SNX),
  ofcerc20('7f591fea-dcaa-46de-88dd-7173537f4433', 'ofcsushi', 'SushiToken', 18, UnderlyingAsset.SUSHI),
  ofcerc20('f15ddadd-5b35-4fa0-bcf6-68e3254d3bb1', 'ofcuni', 'Uniswap Token', 18, UnderlyingAsset.UNI),
  ofcerc20('e30203cd-99c0-4b98-b101-e0cd95a455a9', 'ofcusdt', 'Tether', 6, UnderlyingAsset.USDT, undefined, [
    CoinFeature.STABLECOIN,
  ]),
  ofcerc20('b73b5bc1-1738-439b-a0d4-2c1880898ac5', 'ofcweth', 'Wrapped Ether', 18, UnderlyingAsset.WETH),
  ofcerc20('442030fc-5b0d-4678-8c7f-d266f363e31a', 'ofcwoo', 'Wootrade Network', 18, UnderlyingAsset.WOO),
  ofcerc20('08da24cf-1420-4361-b10f-5060673ab949', 'ofcxsushi', 'xSUSHI', 18, UnderlyingAsset.XSUSHI),
  ofcerc20('9e836a7c-cbe5-4671-885f-a11a8d66a47e', 'ofcyfi', 'Yearn.Finance', 18, UnderlyingAsset.YFI),
  ofcerc20('1985c77f-e2f2-4d83-956f-dd5846a663c4', 'ofcamp', 'Amp Token', 18, UnderlyingAsset.AMP),
  ofcerc20('9857d17e-dac4-4f18-9cd6-4d2cea6b4df2', 'ofcbtt', 'BitTorrent Token', 18, UnderlyingAsset.BTT),
  ofcerc20('603e60b6-a12b-4e8a-8a8c-44a7fe9ed613', 'ofcchz', 'ChiliZ Token', 18, UnderlyingAsset.CHZ),
  ofcerc20('f4fed641-f2e2-4fc7-b55b-62c0477b1301', 'ofcegld', 'Elrond Gold', 18, UnderlyingAsset.EGLD),
  ofcerc20('7b9b62ad-fa00-468f-9b15-fe0d6db04c97', 'ofcenj', 'EnjinCoin', 18, UnderlyingAsset.ENJ),
  ofcerc20('b930e9f3-4476-499c-82f9-f11a3f774f41', 'ofcever', 'Everscale', 9, UnderlyingAsset.EVER),
  ofcerc20('9e713b54-f46f-41a6-9792-a58964011d6b', 'ofcfei', 'Fei USD', 18, UnderlyingAsset.FEI, undefined, [
    CoinFeature.STABLECOIN,
  ]),
  ofcerc20('15caf3bc-1d2e-440a-8954-1f1f8a52ac71', 'ofcftm', 'Fantom Token', 18, UnderlyingAsset.FTM),
  ofcerc20('c3dac821-88cc-4080-8417-bed0f48cc651', 'ofcgala', 'Gala', 8, UnderlyingAsset.GALA),
  ofcerc20('af0b8e78-a821-4542-958a-5c1d3ac687b1', 'ofcgno', 'Gnosis', 18, UnderlyingAsset.GNO),
  ofcerc20('efa472d4-7e80-4232-9a92-4b301cb4fdb7', 'ofchot', 'Holo Token', 18, UnderlyingAsset.HOT),
  ofcerc20('ecf9c0b3-fac4-4da6-93c6-2968c1d69742', 'ofcht', 'Huobi Token', 18, UnderlyingAsset.HT),
  ofcerc20('98af4163-68df-4877-b7a5-6c9ec00b991e', 'ofcleo', 'Bitfinex LEO Token', 18, UnderlyingAsset.LEO),
  ofcerc20('d43b01f7-3f87-4e75-b587-e3162c087b16', 'ofcqnt', 'Quant', 18, UnderlyingAsset.QNT),
  ofcerc20('e05ffecf-2384-4728-af20-2d31c3abf509', 'ofczil', 'Zilliqa', 12, UnderlyingAsset.ZIL),
  ofcerc20('11c7e95c-fb0b-438c-963d-74b55ca04492', 'ofcnexo', 'Nexo', 18, UnderlyingAsset.NEXO),
  ofcerc20('75c02300-0602-4dcc-a0e8-1137962f17e7', 'ofcmdx', 'Mandala', 18, UnderlyingAsset.MDX),
  ofcerc20('8e1b08d6-db2f-477f-8e49-58976849638e', 'ofcmtl', 'Metal', 8, UnderlyingAsset.MTL),
  ofcerc20('a56ce939-2af2-408d-80a2-c890f2b495e3', 'ofcmvl', 'Mass Vehicle Ledger', 18, UnderlyingAsset.MVL),
  ofcerc20('1008e03a-61b2-4920-8efd-df2929249220', 'ofcnu', 'NuCypher', 18, UnderlyingAsset.NU),
  ofcerc20('f403394e-835e-44b9-86b4-198e920e7bb3', 'ofcocean', 'Ocean Token', 18, UnderlyingAsset.OCEAN),
  ofcerc20('a2ef041c-8da0-444b-b41a-7b505240c84a', 'ofcogn', 'Origin Token', 18, UnderlyingAsset.OGN),
  ofcerc20('dec81c2a-f38c-43f9-9a3d-bbdaceaeafe6', 'ofcorbs', 'Orbs Token', 18, UnderlyingAsset.ORBS),
  ofcerc20('609fdb17-c9ee-4867-878f-d97d5acda748', 'ofcoxt', 'Orchid', 18, UnderlyingAsset.OXT),
  ofcerc20('c2f78c20-8835-480a-aa0e-3244e2114f6c', 'ofcpaxg', 'Paxos Gold', 18, UnderlyingAsset.PAXG),
  ofcerc20('8a427c2e-4c6a-4c9b-aa61-ecb7aebb6b7c', 'ofcpoly', 'Polymath', 18, UnderlyingAsset.POLY),
  ofcerc20('4acfd8f7-d1c0-4c49-bf80-1dd8865b8015', 'ofcpowr', 'Power Ledger', 6, UnderlyingAsset.POWR),
  ofcerc20('5f936db2-6014-4afa-b997-4e7c6b34e814', 'ofcpro', 'Propy', 18, UnderlyingAsset.PRO),
  ofcerc20('65055519-d950-466a-b713-f88d9b1bde7c', 'ofcpundix', 'Pundi X2', 18, UnderlyingAsset.PUNDIX),
  ofcerc20('fb602049-f477-43ea-b938-95c2484eda31', 'ofcray', 'Raydium', 6, UnderlyingAsset.RAY),
  ofcerc20('1c3eec6c-c1be-4ca9-b044-6e4379be0287', 'ofcreef', 'REEF', 18, UnderlyingAsset.REEF),
  ofcerc20('220aa19a-7b62-4132-aef2-475bbb83827d', 'ofcrep', 'Augur', 18, UnderlyingAsset.REP),
  ofcerc20('845f503b-66ce-4f4e-b841-163578b26d41', 'ofcrly', 'Rally', 18, UnderlyingAsset.RLY),
  ofcerc20('aee33f6d-ae42-4356-86a8-35d9b26633fa', 'ofcrndr', 'Render Token', 18, UnderlyingAsset.RNDR),
  ofcerc20('4d4edcab-aeac-4c22-a003-b02744da1a35', 'ofcslp', 'Smooth Love Potion', 0, UnderlyingAsset.SLP),
  ofcerc20('f2511305-0f5e-493d-93bc-f06962458b57', 'ofcsnt', 'Status Network Token', 18, UnderlyingAsset.SNT),
  ofcerc20('3c35a09e-2cf2-475c-a5e3-a4757dca7b36', 'ofcstorj', 'Storj', 8, UnderlyingAsset.STORJ),
  ofcerc20('cc429744-58ca-4c3b-abe7-1761320b76ce', 'ofcsxp', 'Swipe', 18, UnderlyingAsset.SXP),
  ofcerc20('764937cd-464b-4a49-88a4-836e39f8e7d3', 'ofctribe', 'Tribe', 18, UnderlyingAsset.TRIBE),
  ofcerc20('dbaf70b2-e159-4c67-9dd9-39ef886a2390', 'ofctrueusd', 'TrueUSD', 18, UnderlyingAsset.TUSD, undefined, [
    ...AccountCoin.DEFAULT_FEATURES,
    CoinFeature.STABLECOIN,
  ]),
  ofcerc20('2566f816-47de-481c-b4b9-f31989861388', 'ofcuma', 'UMA Voting Token V1', 18, UnderlyingAsset.UMA),
  ofcerc20('c6a7a05d-c4bf-44e6-b8e8-21ee1c0d2aa7', 'ofcwxt', 'Wirex', 18, UnderlyingAsset.WXT),
  ofcerc20('d46dc5ab-9c36-4591-b973-0175c2f4cdb5', 'ofcwsteth', 'Wrapped stETH', 18, UnderlyingAsset.WSTETH),
  ofcerc20('5ad50deb-a5ae-4fd9-b838-805542074cb1', 'ofcxsgd', 'StraitsX', 6, UnderlyingAsset.XSGD),
  ofcerc20('dff24bf9-5999-4093-bfe4-24e74eb5ff2f', 'ofctel', 'Telcoin', 2, UnderlyingAsset.TEL),
  ofcerc20('6e11614a-e393-45fb-aa95-30251229a0d6', 'ofcygg', 'Yield Guild Games', 18, UnderlyingAsset.YGG),
  ofcerc20('d7568822-87a9-475a-8228-479e0efeca41', 'ofczrx', '0x Token', 18, UnderlyingAsset.ZRX),
  ofcerc20('c4b061d3-fe27-47b1-a524-f4e9cd2355fc', 'ofcthreshold', 'Threshold', 18, UnderlyingAsset.THRESHOLD),
  ofcerc20('3635900a-d77b-4725-8385-909245c60b35', 'ofctrac', 'OriginTrails', 18, UnderlyingAsset.TRAC),
  ofcerc20('e75640dd-d7b4-4f2d-8e6e-dab4d4dc0c4a', 'ofcmco2', 'Moss Carbon Credit', 18, UnderlyingAsset.MCO2),
  ofcerc20('f4daaf08-25bf-4863-b781-10096833f9d7', 'ofcsuper', 'SuperFarm', 18, UnderlyingAsset.SUPER),
  ofcerc20('146206c1-be45-4293-9fa1-f313bd4171dc', 'ofcsis', 'Symbiosis', 18, UnderlyingAsset.SIS),
  ofcerc20('85aa8d06-1d85-4409-a421-99a2609a3106', 'ofccra', 'Crabada', 18, UnderlyingAsset.CRA),
  ofcerc20('a4271420-4e1d-46f2-b237-542c7720027d', 'ofcstmx', 'StormX', 18, UnderlyingAsset.STMX),
  ofcerc20('d37c6a8b-ddc8-4984-b2c0-317c18a8e4e1', 'ofccoti', 'Coti Token', 18, UnderlyingAsset.COTI),
  ofcerc20('640b14f3-3c4d-4d9c-8139-73e68ec0db14', 'ofchusd', 'Husd Token', 8, UnderlyingAsset.HUSD, undefined, [
    CoinFeature.STABLECOIN,
  ]),
  ofcerc20('2b8c197e-b7ce-4069-8ab2-d75d1ba770ae', 'ofcqkc', 'QuarkChain', 18, UnderlyingAsset.QKC),
  ofcerc20('c11bbf5d-49ca-4678-8909-2599b60f80be', 'ofcrsr', 'Reserve Rights', 18, UnderlyingAsset.RSR),
  ofcerc20('41af8bf9-19a5-4975-9192-7e9f87718516', 'ofcspell', 'Spell Token', 18, UnderlyingAsset.SPELL),
  ofcerc20('1929aa30-ca37-4510-8502-2b3eddda97d4', 'ofcron', 'Ronin', 18, UnderlyingAsset.RON),
  ofcerc20('a968151e-db16-4eec-b1d4-b4b69221f3fb', 'ofcjcr', 'JustCarbon Removal Token', 18, UnderlyingAsset.JCR),
  ofcerc20('12cf7971-fba7-4858-b530-03ff5addf11d', 'ofcjcg', 'JustCarbon Goverance Token', 18, UnderlyingAsset.JCG),
  ofcerc20('2e291978-8710-4f82-bd69-c55e9f9fef83', 'ofcbpt', 'BlackPool Token', 18, UnderlyingAsset.BPT),
  ofcerc20('e763e6ef-17e4-4326-b532-c3ddac300811', 'ofcseth-h', 'Staked ETH Harbour', 18, UnderlyingAsset['SETH-H']),
  ofcerc20('7654c1c4-bca5-4067-a004-661609e6b57a', 'ofcreth-h', 'Reward ETH Harbour', 18, UnderlyingAsset['RETH-H']),
  ofcerc20('67fb4a6f-ba00-41fd-972d-728d2226a3d5', 'ofccho', 'Choise.com', 18, UnderlyingAsset.CHO),
  ofcerc20('af198c54-53d5-42b3-9e69-7fcc5887c0a0', 'ofcdia', 'DIA Token', 18, UnderlyingAsset.DIA),
  ofcerc20('4da7f6a6-9c56-44f7-a9b2-07ae7c669e42', 'ofcldo', 'Lido DAO Token', 18, UnderlyingAsset.LDO),
  ofcerc20('c7ac234f-5fb7-4ee3-b1e9-5479ccaab28c', 'ofcsbc', 'Sustainable Bitcoin Certificate', 8, UnderlyingAsset.SBC),
  ofcerc20('1bc9f8be-81ea-4d1f-b55d-80c1986743f9', 'ofcusdglo', 'Glo Dollar', 18, UnderlyingAsset.USDGLO, undefined, [
    CoinFeature.STABLECOIN,
  ]),
  ofcerc20('dec90842-ca08-417e-9cb0-89723cc50b77', 'ofcwbtc', 'Wrapped Bitcoin', 8, UnderlyingAsset.WBTC),
  ofcerc20('8f01bcec-f576-49f8-b925-274566954017', 'ofcokb', 'OKB', 18, UnderlyingAsset.OKB),
  ofcerc20('37e7d659-c3a4-4761-8f42-76fb7bc5032c', 'ofcmnt', 'Mantle', 18, UnderlyingAsset.MNT),
  ofcerc20('688725ff-e582-44bc-b42e-0de600426594', 'ofcstrk', 'StarkNet Token', 18, UnderlyingAsset.STRK),
  ofcerc20('d6d6ee90-05c1-4fdd-8621-bfaefaa703ae', 'ofctkx', 'Tokenize', 8, UnderlyingAsset.TKX),
  ofcerc20('1181f8b6-1bb6-4555-a6eb-29944ad4877b', 'ofcfet', 'Fetch', 18, UnderlyingAsset.FET),
  ofcerc20('b15ff97c-3153-4aa0-8d72-ecc21e7b80cb', 'ofcfet1', 'Fetch', 18, UnderlyingAsset.FET1),
  ofcerc20('b5bfe73b-9b60-4961-914e-245c7e0dd7c3', 'ofcblur', 'Blur', 18, UnderlyingAsset.BLUR),
  ofcerc20('c93ded62-7a1a-4dd1-8398-0e68106f5009', 'ofcwld', 'Worldcoin', 18, UnderlyingAsset.WLD),
  ofcerc20('afe60408-a2cd-4b4c-b4b2-5610faa8e4dd', 'ofcjasmy', 'JasmyCoin', 18, UnderlyingAsset.JASMY),
  ofcerc20('fb5f8f3a-339a-45fc-abed-d58e9d1d10a7', 'ofcaxlv2', 'Axelar', 6, UnderlyingAsset.AXLV2),
  ofcerc20('fa9b68a2-9d09-40a9-a1d1-db5ef44a75c2', 'ofcfrax', 'Frax', 18, UnderlyingAsset.FRAX),
  ofcerc20('acf53a01-3357-4095-93a2-2112a4acdcd4', 'ofcondo', 'Ondo', 18, UnderlyingAsset.ONDO),
  ofcerc20('c06fb78f-a2d8-43ef-b367-8ad18c63e0a2', 'ofcrpl', 'Rocket Pool', 18, UnderlyingAsset.RPL),
  ofcerc20('bb36fbf3-ec3a-4233-80c1-18091d215756', 'ofcxaut', 'Tether Gold', 6, UnderlyingAsset.XAUT),
  ofcerc20('9af2377d-40a4-4fd7-9253-f659286d0636', 'ofcpepe', 'Pepe', 18, UnderlyingAsset.PEPE),
  ofcerc20('6a0189d7-92b0-402a-b9bf-29e2e445e090', 'ofccwbtc', 'Compound WBTC', 8, UnderlyingAsset.CWBTC),
  ofcerc20('3c79156b-97aa-4a25-aafe-87a8abf71eac', 'ofcceth', 'Compound Ether', 8, UnderlyingAsset.CETH),
  ofcerc20('8b4c7e30-40f0-44fc-927f-4e265ffc3c9d', 'ofcethx', 'Stader ETHx', 18, UnderlyingAsset.ETHX),
  ofcerc20('691197b6-d2e7-45ec-ae91-346eb62b9b54', 'ofcmagic', 'Magic', 18, UnderlyingAsset.MAGIC),
  ofcerc20('ced76323-8aa0-4dfc-a2c9-eee788615963', 'ofcfloki', 'FLOKI', 9, UnderlyingAsset.FLOKI),
  ofcerc20('784b50ab-a42e-4e7e-a796-867d19b4e5ac', 'ofcglm', 'Golem', 18, UnderlyingAsset.GLM),
  ofcerc20('b009d5c3-b5f2-4f0e-bbe2-7ef61410db93', 'ofcchr', 'Chroma', 6, UnderlyingAsset.CHR),
  ofcerc20(
    'd45e7c2c-bd1f-4586-8a87-2a715824d665',
    'ofcbuidl',
    'BlackRock USD Institutional Digital Liquidity Fund',
    6,
    UnderlyingAsset.BUIDL
  ),
  ofcerc20('ee9a090d-d67e-4ec5-99da-257da77f0cfd', 'ofcankr', 'Ankr Network', 18, UnderlyingAsset.ANKR),
  ofcerc20('d0efbafb-f9c7-4eb9-83b2-cf137f49e458', 'ofcpendle', 'Pendle', 18, UnderlyingAsset.PENDLE),
  ofcerc20('4efe4036-6528-45f8-9a3f-d4175103da72', 'ofcom', 'Om Token', 18, UnderlyingAsset.OM),
  ofcerc20('f60e2aa4-0b99-40df-a316-bc1a41912ffd', 'ofcoceanv2', 'Ocean Token V2', 18, UnderlyingAsset.OCEANV2),
  ofcerc20('0ee531d4-6df5-437d-aec5-aa72e33ac775', 'ofceigen', 'Eigen', 18, UnderlyingAsset.EIGEN),
  ofcerc20(
    'bbe911d8-c900-401c-8dfb-febd98256e75',
    'ofcusdy',
    'Ondo U.S. Dollar Yield',
    18,
    UnderlyingAsset.USDY,
    undefined,
    [CoinFeature.STABLECOIN]
  ),
  ofcerc20('017c87e8-db41-41f6-8382-c61ad8ced64b', 'ofcfold', 'Manifold Finance', 18, UnderlyingAsset.FOLD),
  ofcerc20('94fcd19b-6dd6-4a8c-8fea-11c73ba9fa48', 'ofcacx', 'Across Protocol', 18, UnderlyingAsset.ACX),
  ofcerc20('b5f3afea-f69a-4a05-87f9-965476ad77de', 'ofclpt', 'Livepeer Token', 18, UnderlyingAsset.LPT),
  ofcerc20('567b571f-6f79-40e4-adff-3e0e3c6ba959', 'ofcethfi', 'ether.fi governance token', 18, UnderlyingAsset.ETHFI),
  ofcerc20('cba66dc6-31eb-46c4-b73f-8cb77eb7ef5b', 'ofcgal', 'Project Galaxy', 18, UnderlyingAsset.GAL),
  ofcerc20(
    '0c6e4b19-d748-477c-9507-6c0f51142b07',
    'ofcfdusd',
    'First Digital USD',
    18,
    UnderlyingAsset.FDUSD,
    undefined,
    [CoinFeature.STABLECOIN]
  ),
  ofcerc20('80c3e860-f589-4227-a0f5-2aa6b18293c5', 'ofcrune', 'THORChain ETH.RUNE', 18, UnderlyingAsset.RUNE),
  ofcerc20('db35feb4-9cdb-447a-a698-e0e944ca6869', 'ofckcs', 'KuCoin', 6, UnderlyingAsset.KCS),
  ofcerc20('519ab013-f634-41f4-9d31-6f9368de5b09', 'ofcbeam', 'Beam', 18, UnderlyingAsset.BEAM),
  ofcerc20('4030e0fa-fa80-4e30-8c0f-9168ec65c731', 'ofcmog', 'Mog Coin', 18, UnderlyingAsset.MOG),
  ofcerc20('1a7fdcc6-8a6c-4780-b483-c6aaf990e461', 'ofcgt', 'GateChainToken', 18, UnderlyingAsset.GT),
  ofcerc20('969180cc-5af9-49c5-ad19-d8e8de755467', 'ofckas', 'Kaspa', 8, UnderlyingAsset.KAS),
  ofcerc20('eb54ecb6-7312-42c0-926a-1600d61a50dc', 'ofcbgb', 'Bitget', 18, UnderlyingAsset.BGB),
  ofcerc20('a4e0613e-1d1b-477c-9da5-7c553ff787b7', 'ofcmew', 'MEW coin', 18, UnderlyingAsset.MEW),
  ofcerc20('ba2c8abb-6375-4207-9262-8b907a1dbf1b', 'ofcusdd', 'USDD', 18, UnderlyingAsset.USDD, undefined, [
    CoinFeature.STABLECOIN,
  ]),
  ofcerc20('cbb73d46-ce0d-4045-822b-8aa0d6fb8ad4', 'ofcw', 'Wormhole Token', 18, UnderlyingAsset.W),
  ofcerc20(
    '03a02e79-f604-4b79-96da-fb4a21456566',
    'ofceth:virtual',
    'Virtual Protocol',
    18,
    UnderlyingAsset['eth:virtual']
  ),
  ofcerc20('8f0d3af0-8f99-4860-88db-e9b52855262f', 'ofccore', 'cVault.finance', 18, UnderlyingAsset.CORE),
  ofcerc20('6135770b-d8a6-4998-85f4-5efc7379695c', 'ofcena', 'Ethena', 18, UnderlyingAsset.ENA),
  ofcerc20('fb61c76b-ee66-48b6-a0a2-6ec37d03c542', 'ofcusde', 'USDe', 18, UnderlyingAsset.USDE, undefined, [
    CoinFeature.STABLECOIN,
  ]),
  ofcerc20('4419a432-b655-4941-92f6-a8a8a405ee97', 'ofczro', 'LayerZero', 18, UnderlyingAsset.ZRO),
  ofcerc20('799795f1-0294-4bb7-9ed1-d5d43fd03e8b', 'ofcsafe', 'SAFE', 18, UnderlyingAsset.SAFE),
  ofcerc20('5d0f9251-58e1-44fa-b1d6-b87ed23586da', 'ofcmoca', 'Moca', 18, UnderlyingAsset.MOCA),
  ofcerc20('309379dd-9a5a-47e4-b491-fdba4305b60f', 'ofciotx', 'IoTeX Network', 18, UnderlyingAsset.IOTX),
  ofcerc20('68a59406-9c61-497e-9aaf-8d3312ff233a', 'ofcath', 'Aethir Token', 18, UnderlyingAsset.ATH),
  ofcerc20('cfe9cf73-0212-4ebb-96a9-e3c01a9d9360', 'ofczbuv2', 'Zeebu (v2)', 18, UnderlyingAsset.ZBUV2),
  ofcerc20('8c25dc2a-e8ee-4f7a-ab71-1f2dfc4d139a', 'ofcpeaq', 'peaq', 18, UnderlyingAsset.PEAQ),
  ofcerc20('72e958a1-a36c-4c77-ad1e-008f6044b09c', 'ofcarkm', 'Arkham', 18, UnderlyingAsset.ARKM),
  ofcerc20('e145b8b0-e16b-4691-a20b-b154c23bbf7a', 'ofcpha', 'Phala', 18, UnderlyingAsset.PHA),
  ofcerc20('f2e783d0-3278-4660-be43-82b7961c21df', 'ofcgas', 'Gas DAO', 18, UnderlyingAsset.GAS),
  ofcerc20('cf195e88-d5eb-4e20-aeca-6a02e845a561', 'ofcmask', 'Mask Network', 18, UnderlyingAsset.MASK),
  ofcerc20('d3f81454-874d-44a2-96e9-2fa37b5311b3', 'ofceth:turbo', 'Turbo', 18, UnderlyingAsset['eth:turbo']),
  ofcerc20('509e7614-4134-4f4a-b107-cd3b4783a558', 'ofceth:spx', 'SPX6900', 8, UnderlyingAsset['eth:spx']),
  ofcerc20('2c863d38-6d3b-438a-983d-79f20aff030a', 'ofceth:kava', 'Kava', 6, UnderlyingAsset['eth:kava']),
  ofcerc20(
    '53a414b4-cefa-4a81-936c-9ecbb2da22cc',
    'ofceth:gousd',
    'goUSD',
    6,
    UnderlyingAsset['eth:gousd'],
    undefined,
    [CoinFeature.STABLECOIN]
  ),
  ofcerc20('42e30f8e-0e75-4e3f-bb9c-c4f8ec6d819e', 'ofceth:ryt', 'Real Yield Token', 18, UnderlyingAsset['eth:ryt']),
  ofcerc20('0bdaaf36-bd01-4cce-96b5-60a9d2c82c36', 'ofceth:guild', 'BlockchainSpace', 18, UnderlyingAsset['eth:guild']),
  ofcerc20('f9bb204c-cfc7-406a-8e4e-6205efb9b187', 'ofceth:rdo', 'Reddio', 18, UnderlyingAsset['eth:rdo']),
  ofcerc20('3a9b6f94-b3a5-4375-a2ad-2a53057e5c89', 'ofceth:h', 'Humanity Protocol', 18, UnderlyingAsset['eth:h']),
  ofcerc20('a1d91c70-7c7d-4b79-8729-9be52f2dd144', 'ofceth:wbt', 'WhiteBIT Coin', 8, UnderlyingAsset['eth:wbt']),
  ofcerc20('f60b1ac2-2b25-4097-8679-ef746498ea86', 'ofceth:ftn', 'Fasttoken', 18, UnderlyingAsset['eth:ftn']),
  ofcerc20(
    'baded9c2-d530-4188-b35d-2fd00cf6ee2e',
    'ofcustb',
    'Superstate Short Duration US Government Securities Fund',
    6,
    UnderlyingAsset.USTB
  ),
  ofcerc20('fb5ba281-b060-4e68-86c8-55da5c7e7fe9', 'ofctbill', 'OpenEden T-Bills', 6, UnderlyingAsset.TBILL),
  ofcerc20('fcc0e550-ff67-4c0a-9d28-4a6e8ee32d93', 'ofcmasa', 'Masa Token', 18, UnderlyingAsset.MASA),
  ofcerc20('d8859661-8695-4645-a519-24063019ab82', 'ofceth:iq', 'IQ', 18, underlyingAssetForSymbol('eth:iq')),
  ofcerc20('cb202cff-d8de-4e1c-9b4f-c096fd888f72', 'ofceth:iris', 'IRISnet', 6, underlyingAssetForSymbol('eth:iris')),
  ofcerc20('6f9c8419-182f-4fe4-a82c-bd99939eb3b6', 'ofceth:hard', 'Kava Lend', 6, underlyingAssetForSymbol('eth:hard')),
  ofcerc20('8ee9f243-5192-43e0-a1ea-3b6b329b1bbc', 'ofceth:hegic', 'Hegic', 18, underlyingAssetForSymbol('eth:hegic')),
  ofcerc20(
    'f3a87df7-c341-4e36-a53d-cc71e32fb552',
    'ofceth:xprism',
    'Staked Portfolio of Risk-adjusted Investment Strategy',
    18,
    UnderlyingAsset['eth:xprism']
  ),
  ofcerc20(
    '9321cc5f-623e-428c-a831-43cd381bdcda',
    'ofceth:xreth',
    'Constellation Staked ETH',
    18,
    underlyingAssetForSymbol('eth:xreth')
  ),
  ofcerc20('c02ba49a-045d-4c11-92e0-6639dbfb639d', 'ofceth:xy', 'XY Finance', 18, underlyingAssetForSymbol('eth:xy')),
  ofcerc20('7d38fd01-00e8-493b-9c52-cde9b65ec274', 'ofceth:exrd', 'e-RADIX', 18, underlyingAssetForSymbol('eth:exrd')),
  ofcerc20(
    '3b0efa6b-5f86-4547-9b3b-de2ab4d4194c',
    'ofceth:icnt',
    'Impossible Cloud Network Token',
    18,
    underlyingAssetForSymbol('eth:icnt')
  ),
  ofcerc20(
    '7e3813c1-cc3f-416f-94e3-5f62a098a59d',
    'ofceth:audu',
    'Ubiquity Stablecoin AUD',
    18,
    underlyingAssetForSymbol('eth:audu')
  ),
  ofcerc20(
    '4e6fd93c-a3ae-4367-9b7f-4d8343e6a05b',
    'ofceth:wlfi',
    'World Liberty Financial',
    18,
    underlyingAssetForSymbol('eth:wlfi')
  ),
  ofcerc20('2447d4d4-0bff-4d8b-abde-6787aaff7b41', 'ofc1up', 'Uptrennd Token', 18, underlyingAssetForSymbol('1up')),
  ofcerc20('a1c32b93-fe10-4be4-8765-d8206131403a', 'ofcace', 'Ace Token', 6, underlyingAssetForSymbol('ace')),
  ofcerc20(
    'c37aae15-6107-4be9-8768-08ebb7e7209a',
    'ofcacxt',
    'Ac Exchange Token',
    18,
    underlyingAssetForSymbol('acxt')
  ),
  ofcerc20('84f17eb8-0b28-44b0-b372-30002a88ca39', 'ofcadx', 'AdEx Network', 18, underlyingAssetForSymbol('adx')),
  ofcerc20('48f00374-522b-4474-a9b0-759ebb90bb07', 'ofcae', 'Aeternity', 18, underlyingAssetForSymbol('ae')),
  ofcerc20('41f2cf41-3064-462b-90eb-2455461abcfd', 'ofcaergo', 'Aergo', 18, underlyingAssetForSymbol('aergo')),
  ofcerc20('5b60498b-2eff-469d-81d9-31dd5995762c', 'ofcaergo1', 'Aergo1', 18, underlyingAssetForSymbol('aergo1')),
  ofcerc20('1f8de530-b026-482a-a841-f53653b0b3fb', 'ofcagi', 'AGI Token', 18, underlyingAssetForSymbol('agi')),
  ofcerc20(
    '6d8075ba-688b-4984-8f1b-f186fb099e68',
    'ofcagix',
    'SingularityNET Token',
    8,
    underlyingAssetForSymbol('agix')
  ),
  ofcerc20('5503225e-18cc-4030-8a1d-0fbb1088e745', 'ofcagld', 'Adventure Gold', 18, underlyingAssetForSymbol('agld')),
  ofcerc20('615f0297-eeeb-4853-8b8c-d48ee793321e', 'ofcagwd', 'AGARWOOD', 18, underlyingAssetForSymbol('agwd')),
  ofcerc20('0ccbc4fd-b205-412f-a84d-ed0fec2ebff9', 'ofcaion', 'AION', 8, underlyingAssetForSymbol('aion')),
  ofcerc20('f6a09b84-e373-4118-961d-8609f3805262', 'ofcajna', 'AjnaToken', 18, underlyingAssetForSymbol('ajna')),
  ofcerc20('dc89a150-fc26-49b4-b0bf-8b9812380e99', 'ofcalcx', 'Alchemix', 18, underlyingAssetForSymbol('alcx')),
  ofcerc20('4fc8ce84-f1a2-49b7-9fe5-00d8f12bfd07', 'ofcaleph', 'aleph.im v2', 18, underlyingAssetForSymbol('aleph')),
  ofcerc20('47d13a91-1930-463c-b8c8-48c7284d3d72', 'ofcalice', 'ALICE', 6, underlyingAssetForSymbol('alice')),
  ofcerc20('3e6956da-28b9-4ddd-be1f-507ef76706c4', 'ofcalpha', 'Alpha Finance', 18, underlyingAssetForSymbol('alpha')),
  ofcerc20('f32e05a8-d3f2-4831-829f-32be3ed5168e', 'ofcapi3', 'API3', 18, underlyingAssetForSymbol('api3')),
  ofcerc20(
    '2f130a46-fbfb-4320-b116-0bc5192706ea',
    'ofcaltbull',
    '3X Long Altcoin Index Token',
    18,
    underlyingAssetForSymbol('altbull')
  ),
  ofcerc20(
    '685b24ae-d2da-4a38-a2f2-7f427aed6052',
    'ofcamkt',
    'Alongside Crypto Market Index',
    18,
    underlyingAssetForSymbol('amkt')
  ),
  ofcerc20('b7fd4957-0c57-43ca-8a49-e6ea1c71b89f', 'ofcamn', 'Amon', 18, underlyingAssetForSymbol('amn')),
  ofcerc20('06568c9d-f99e-4d82-a099-5102ce11458e', 'ofcamo', 'AMO Token', 18, underlyingAssetForSymbol('amo')),
  ofcerc20('15c13ca9-65e2-4d71-9507-36d1683d7566', 'ofcamon', 'AmonD', 18, underlyingAssetForSymbol('amon')),
  ofcerc20('a3987afe-b988-4943-9a50-a249f960316d', 'ofcampx', 'Amplify Exchange', 18, underlyingAssetForSymbol('ampx')),
  ofcerc20('221caa1d-72a4-4751-af88-36c5ae5f3398', 'ofcampl', 'Ampleforth', 9, underlyingAssetForSymbol('ampl')),
  ofcerc20('3dc94d52-cfbe-40a9-af62-64e3dab921d3', 'ofcana', 'ANA', 18, underlyingAssetForSymbol('ana')),
  ofcerc20('2fee1c3e-cd7c-490e-8a75-7f550f31f5cf', 'ofcanc', 'Anchor Protocol', 18, underlyingAssetForSymbol('anc')),
  ofcerc20(
    '2df04477-af4f-4300-8c06-c6e8a6c732c5',
    'ofcankreth',
    'Ankr Staked ETH',
    18,
    underlyingAssetForSymbol('ankreth')
  ),
  ofcerc20('3108fcb7-e5b8-484b-9e80-2b03b0da7895', 'ofcantv2', 'Antv2', 18, underlyingAssetForSymbol('antv2')),
  ofcerc20('a1faaea6-9718-454c-bb8c-01242ba9abed', 'ofcaoa', 'Aurora', 18, underlyingAssetForSymbol('aoa')),
  ofcerc20('18c71263-c1fe-4534-a85e-9d6c17d6a02b', 'ofcappc', 'AppCoins', 18, underlyingAssetForSymbol('appc')),
  ofcerc20('ac7aa2d5-8073-4eca-a737-3c64af0c79fc', 'ofcaqt', 'Alpha Quark Token', 18, underlyingAssetForSymbol('aqt')),
  ofcerc20(
    '029cdb6d-f369-41ee-813c-00e4b8ff2a3b',
    'ofcarct',
    'ArCoin US Treasury',
    18,
    underlyingAssetForSymbol('arct')
  ),
  ofcerc20(
    '2d2ec540-c0b9-4c81-86cf-64b80f4f33fe',
    'ofcarcx',
    'ARCx Governance Token',
    18,
    underlyingAssetForSymbol('arcx')
  ),
  ofcerc20(
    '6ba1b4e1-6047-4694-a90c-f3181dc6afd2',
    'ofcarteq',
    'arteQ NFT Investment Fund',
    0,
    underlyingAssetForSymbol('arteq')
  ),
  ofcerc20('7b439ef5-66ef-4ec8-9571-67b302d43be1', 'ofcast', 'AirSwap', 4, underlyingAssetForSymbol('ast')),
  ofcerc20(
    '8f0a4e46-5659-4f27-a5c4-88864f04ea50',
    'ofcasto',
    'Altered State Token',
    18,
    underlyingAssetForSymbol('asto')
  ),
  ofcerc20('65542086-c1a9-42d9-a496-11bf06052dec', 'ofcatri', 'Atari Token', 0, underlyingAssetForSymbol('atri')),
  ofcerc20('67845151-456b-4545-9bbf-29452777daf0', 'ofcaudd', 'AUDD', 6, underlyingAssetForSymbol('audd')),
  ofcerc20('8e38727e-0bc7-4545-b586-468ee0d99391', 'ofcaudf', 'Forte AUD', 6, underlyingAssetForSymbol('audf')),
  ofcerc20(
    '823712a8-59a8-4b4f-ae17-d2a89ffb5f65',
    'ofcaudx',
    'eToro Australian Dollar',
    18,
    underlyingAssetForSymbol('audx')
  ),
  ofcerc20(
    'b86296b0-e594-4f59-8a53-149f8d16c298',
    'ofcaust',
    'Wrapped Anchor UST Token',
    18,
    underlyingAssetForSymbol('aust')
  ),
  ofcerc20('7ef82330-af3b-488e-9c26-ea03f34aafb7', 'ofcaxl', 'Axelar', 6, underlyingAssetForSymbol('AXL')),
  ofcerc20('cf929cdc-abc9-45ac-bdb6-c91af26473e0', 'ofcaxpr', 'aXpire', 18, underlyingAssetForSymbol('axpr')),
  ofcerc20('0849ccd4-e529-4cb3-97fe-87960982c3a7', 'ofcbao', 'BaoToken', 18, underlyingAssetForSymbol('bao')),
  ofcerc20('9d4ab86e-15de-47c4-91f9-660f093cc319', 'ofcbasic', 'BASIC Token', 18, underlyingAssetForSymbol('basic')),
  ofcerc20('3666c6ee-61b1-4f1c-943c-fec7c975584d', 'ofcbax', 'BABB', 18, underlyingAssetForSymbol('bax')),
  ofcerc20(
    'e849fbdc-e8ef-4847-b85b-6814ff94aec7',
    'ofcbbtc',
    'Binance Wrapped BTC',
    8,
    underlyingAssetForSymbol('BBTC')
  ),
  ofcerc20('e1911280-a3d6-4422-bf14-d233c801848f', 'ofcbbx', 'BBX', 18, underlyingAssetForSymbol('bbx')),
  ofcerc20('3667e048-ddf7-4e71-ab8c-a01c07551a1e', 'ofcbcap', 'BCAP', 0, underlyingAssetForSymbol('bcap')),
  ofcerc20('de878b8c-ebda-4135-9272-57be07a56851', 'ofcbcc', 'Basiscoin Cash', 18, underlyingAssetForSymbol('bcc')),
  ofcerc20('db8f7baf-dab6-474e-8d27-1e144d021900', 'ofcbcio', 'Blockchain.io', 18, underlyingAssetForSymbol('bcio')),
  ofcerc20('5ae8c334-d003-4126-97cb-aeaadebed9e5', 'ofcbcut', 'bitsCrunch Token', 18, underlyingAssetForSymbol('bcut')),
  ofcerc20('8ce37630-f2fc-426f-8f99-110c6fd496eb', 'ofcbct', 'Bitcarbon Coin', 0, underlyingAssetForSymbol('bct')),
  ofcerc20('148bef88-25ad-4e2b-85da-eb2be52a8df8', 'ofcbdxn', 'Bondex Token', 18, underlyingAssetForSymbol('bdxn')),
  ofcerc20('efd21406-8308-4467-8abe-a3fe26f1d925', 'ofcbed', 'Bankless BED Index', 18, underlyingAssetForSymbol('bed')),
  ofcerc20('0022a095-a2a2-4ea5-ae97-e863bf260491', 'ofcbepro', 'BetProtocol', 18, underlyingAssetForSymbol('bepro')),
  ofcerc20('693a4de3-a1bf-48ca-a1ad-59a51ef6d2a1', 'ofcbid', 'Blockbid', 2, underlyingAssetForSymbol('bid')),
  ofcerc20(
    '6d8e4e7f-4eb9-4095-97e8-bc657e336249',
    'ofcbidl',
    'Blockbid Liquidity',
    2,
    underlyingAssetForSymbol('bidl')
  ),
  ofcerc20('aa193169-1e01-424b-a987-2863c00212f0', 'ofcbird', 'BirdCoin', 18, underlyingAssetForSymbol('bird')),
  ofcerc20('8897ec44-aa10-48ce-8c4c-5870459b3c15', 'ofcblz', 'Bluzelle', 18, underlyingAssetForSymbol('blz')),
  ofcerc20('61636213-7817-47f3-b790-a2fb25b904f9', 'ofcbnk', 'Bankera', 8, underlyingAssetForSymbol('bnk')),
  ofcerc20('3933d3e4-9202-40b6-a15f-d6a7283a4af5', 'ofcbnl', 'BitNational', 18, underlyingAssetForSymbol('bnl')),
  ofcerc20('4f06257b-0439-4586-a304-c955d6d6b3e3', 'ofcbnty', 'Bounty0x', 18, underlyingAssetForSymbol('bnty')),
  ofcerc20('e0916d17-2038-4bd6-bb43-3f7e602b9c2b', 'ofcbob', 'Bob', 18, underlyingAssetForSymbol('bob')),
  ofcerc20('41d74a1e-bead-46fa-914d-58e735e53825', 'ofcbox', 'ContentBox', 18, underlyingAssetForSymbol('box')),
  ofcerc20('877e7ee6-2794-44b0-ac81-df6ca20d786e', 'ofcbond', 'BarnBridge', 18, underlyingAssetForSymbol('bond')),
  ofcerc20('8d4b6c0d-180c-413b-82ec-ee52810f38e3', 'ofcbonk', 'BONK', 5, underlyingAssetForSymbol('bonk')),
  ofcerc20('179e6735-b0a8-4ca7-bd3d-04874fac907c', 'ofcborg', 'SwissBorg Token', 18, underlyingAssetForSymbol('borg')),
  ofcerc20('d484050e-66b3-4761-9a55-a8f4e7c9d099', 'ofcbotto', 'BOTTO', 18, underlyingAssetForSymbol('botto')),
  ofcerc20('0d77619b-38cd-4f63-aae1-9f78bc8424a5', 'ofcblocks', 'BLOCKS ', 18, underlyingAssetForSymbol('blocks')),
  ofcerc20('dc7aee1b-cb45-4d55-b1e5-0e155604e7c8', 'ofcbrd', 'Bread', 18, underlyingAssetForSymbol('brd')),
  ofcerc20(
    '86e90ab8-8bc5-45da-b887-f5a7e73b493a',
    'ofcbrz',
    'Brazilian Digital Token',
    4,
    underlyingAssetForSymbol('brz')
  ),
  ofcerc20('9ca258ea-147a-4fef-8308-7b0373f910bc', 'ofcbsgg', 'Betswap.gg', 18, underlyingAssetForSymbol('bsgg')),
  ofcerc20(
    'fd8543f1-8b0f-4ae2-a5fd-ec313a9d415d',
    'ofcbsx',
    'Bistox Exchange Token',
    18,
    underlyingAssetForSymbol('bsx')
  ),
  ofcerc20('637b3596-5775-4bbd-93b1-21d970511ea5', 'ofcbkt', 'Blocktrade', 18, underlyingAssetForSymbol('bkt')),
  ofcerc20('94092f73-cf17-4ef2-a5fd-aba6f5b7d71d', 'ofcbtu', 'BTU Protocol', 18, underlyingAssetForSymbol('btu')),
  ofcerc20(
    'fb209277-7c5c-45a6-9e16-8aa94f481e14',
    'ofcbull',
    '3X Long Bitcoin Token',
    18,
    underlyingAssetForSymbol('bull')
  ),
  ofcerc20('03ff6079-6ab3-405f-9268-1bfd62a82d3a', 'ofcburp', 'Big Town Chef', 18, underlyingAssetForSymbol('burp')),
  ofcerc20('a18cad7d-f8e8-46d1-bd50-24ae9ce06645', 'ofcbuy', 'buying.com', 18, underlyingAssetForSymbol('buy')),
  ofcerc20(
    '3be6cc4a-9bc7-4fdc-ac4e-3f8e1e644f63',
    'ofcbnvda',
    'Backed NVIDIA Corp',
    18,
    underlyingAssetForSymbol('bnvda')
  ),
  ofcerc20('f806fdf8-53f5-437d-a98a-615dbb5fe492', 'ofcbxx', 'Baanx', 18, underlyingAssetForSymbol('bxx')),
  ofcerc20('be8b87fe-70f9-4650-a2c1-918e56a560ca', 'ofcbxxv1', 'Baanxv1', 18, underlyingAssetForSymbol('bxxv1')),
  ofcerc20('cb9309fa-257e-4bd1-b582-2005da706e63', 'ofcbzz', 'BZZ', 16, underlyingAssetForSymbol('bzz')),
  ofcerc20('834c8fde-8569-4413-b027-0bd71115d4eb', 'ofcc8p', 'C8 Plus', 6, underlyingAssetForSymbol('c8p')),
  ofcerc20('313b9a7c-8e6e-4706-842e-47a8c1407509', 'ofcc98', 'Coin98', 18, underlyingAssetForSymbol('c98')),
  ofcerc20('1aef7077-425c-40fa-a006-8d52b99225b0', 'ofccacxt', 'Cacxt', 18, underlyingAssetForSymbol('cacxt')),
  ofcerc20(
    'd918bdf9-1173-4981-8a96-c23256e82bb5',
    'ofccadx',
    'eToro Canadian Dollar',
    18,
    underlyingAssetForSymbol('cadx')
  ),
  ofcerc20('ce9dd20d-37c8-4166-8702-b3d6a36b42c4', 'ofccag', 'Change', 18, underlyingAssetForSymbol('cag')),
  ofcerc20('c44f8cfa-a040-4fc4-a13a-a5826be94371', 'ofccbat', 'Compound BAT', 8, underlyingAssetForSymbol('cbat')),
  ofcerc20('ec94eafb-ad87-4883-b973-defa7b420153', 'ofccbrl', 'Crypto BRL', 6, underlyingAssetForSymbol('cbrl')),
  ofcerc20('a72fa274-c9c3-4f21-9c25-52be0c115af3', 'ofccbc', 'CashBet Coin', 8, underlyingAssetForSymbol('cbc')),
  ofcerc20('2c796e59-0b65-48e1-a6a6-52a351c382ab', 'ofccct', 'Cyber Credit Token', 0, underlyingAssetForSymbol('cct')),
  ofcerc20('9ce18e4c-a37e-4ac1-a13b-260162b970c7', 'ofccdag', 'CannDollar', 18, underlyingAssetForSymbol('cdag')),
  ofcerc20('3bc8af6b-7173-4f61-a8db-a0356fd956c0', 'ofccdai', 'Compound DAI', 8, underlyingAssetForSymbol('cdai')),
  ofcerc20('b06b8e98-359a-4382-939b-2d515b09d771', 'ofccdt', 'Blox', 18, underlyingAssetForSymbol('cdt')),
  ofcerc20(
    '52565945-376c-4ffd-8544-9638adbf9e1b',
    'ofcchfx',
    'eToro Swiss Frank',
    18,
    underlyingAssetForSymbol('chfx')
  ),
  ofcerc20('747ade2c-4b74-4de6-b687-4f508ae23458', 'ofccibo', 'Cibola', 18, underlyingAssetForSymbol('cibo')),
  ofcerc20(
    '783d06f0-45ee-48bb-abb7-2c34f561eabe',
    'ofccix100',
    'Cryptoindex 100',
    18,
    underlyingAssetForSymbol('cix100')
  ),
  ofcerc20('9560d12b-b0a8-4bc9-afa3-1b87ba3d00b6', 'ofccliq', 'DefiCliq', 18, underlyingAssetForSymbol('cliq')),
  ofcerc20('e43626e5-23e9-4fa2-8c1e-14a244c8174b', 'ofccln', 'Colu Local Network', 18, underlyingAssetForSymbol('cln')),
  ofcerc20('8acb9d6e-9f29-40e3-9b07-2305bb79ec58', 'ofcclt', 'CoinLoan Token', 8, underlyingAssetForSymbol('clt')),
  ofcerc20('95cfffad-9c22-4033-a588-426db31578b2', 'ofcclv', 'Clover Token', 18, underlyingAssetForSymbol('clv')),
  ofcerc20('730fcb90-75f1-4d65-9aed-8064eef0a20f', 'ofccng', 'Changer', 18, underlyingAssetForSymbol('cng')),
  ofcerc20(
    '8047f346-0775-4be8-b276-d344456c6c8d',
    'ofccnyx',
    'eToro Chinese Yuan',
    18,
    underlyingAssetForSymbol('cnyx')
  ),
  ofcerc20('2936e10e-19f1-4b05-aaec-ff0865d17c6b', 'ofcconv', 'Convergence', 18, underlyingAssetForSymbol('conv')),
  ofcerc20('4999dfa6-e8e4-4df6-b985-4e9f0ae2f970', 'ofccover', 'Cover', 18, underlyingAssetForSymbol('cover')),
  ofcerc20('f93dc8ab-068d-4ab1-bb28-28e29ef10d9e', 'ofccpay', 'Cryptopay', 0, underlyingAssetForSymbol('cpay')),
  ofcerc20('21b8d4e2-bf3b-4b21-bcaf-2a5f00da571a', 'ofccplt', 'Coineru Platinum', 8, underlyingAssetForSymbol('cplt')),
  ofcerc20('4b27c0d9-c64c-4b83-b5e3-d4ad44ca45a5', 'ofccqx', 'Coinquista Coin', 18, underlyingAssetForSymbol('cqx')),
  ofcerc20(
    'f8b86eab-46a2-45f5-8028-495c4d213b96',
    'ofccrdt',
    'Crypto Daily Token',
    18,
    underlyingAssetForSymbol('crdt')
  ),
  ofcerc20('40f86be7-2cc3-474a-9629-c69fdbc73f0d', 'ofccre', 'CarryToken', 18, underlyingAssetForSymbol('cre')),
  ofcerc20('008e7158-3a4d-465f-922a-ec3cef6d93ca', 'ofccream', 'Cream', 18, underlyingAssetForSymbol('cream')),
  ofcerc20('f42c6152-5c91-4405-b5bf-9f4326774b60', 'ofccrep', 'Compound Augur', 8, underlyingAssetForSymbol('crep')),
  ofcerc20('a89c17c5-c666-411d-9f2d-840e201016ce', 'ofccrpt', 'Crypterium', 18, underlyingAssetForSymbol('crpt')),
  ofcerc20('04b9042e-11b3-45f1-814a-379789dcc038', 'ofccrpt1', 'CRPT Token', 18, underlyingAssetForSymbol('crpt1')),
  ofcerc20('5de47952-2e15-4bf9-9d5e-cb986f376d6f', 'ofccslv', 'Coineru Silver', 8, underlyingAssetForSymbol('cslv')),
  ofcerc20('e7adf292-dd01-4d55-aff1-66917e1c491b', 'ofccsp', 'Caspian Token', 18, underlyingAssetForSymbol('csp')),
  ofcerc20('0120c3bd-01a5-40d5-9eb5-f0f5473ad67e', 'ofcctx', 'Cryptex', 18, underlyingAssetForSymbol('ctx')),
  ofcerc20('02e928aa-0141-4846-9ca1-a123db50da63', 'ofccusdc', 'Compound USDC', 8, underlyingAssetForSymbol('cusdc')),
  ofcerc20('5a2f5c86-2e19-4f6f-961d-6b0c1e1a41c2', 'ofccxt', 'Covalent X Token', 18, underlyingAssetForSymbol('cxt')),
  ofcerc20('b3663f6e-a208-403e-99c6-c69ddcfe6f16', 'ofccyber', 'Cyber', 18, underlyingAssetForSymbol('cyber')),
  ofcerc20('81952130-ce4b-4fa6-be12-36298dda9879', 'ofcczrx', 'Compound ZRX', 8, underlyingAssetForSymbol('czrx')),
  ofcerc20('8bc56736-ec18-4502-b1ec-4e4502648029', 'ofcdacxi', 'Dacxi Coin', 18, underlyingAssetForSymbol('dacxi')),
  ofcerc20('04bf9bfb-bab1-4b35-8dee-d81aa61efc1d', 'ofcdata', 'Streamr DATAcoin', 18, underlyingAssetForSymbol('data')),
  ofcerc20('ac2618f0-70d0-4e18-ab9b-2c542e04414d', 'ofcdatav2', 'Streamr Data', 18, underlyingAssetForSymbol('datav2')),
  ofcerc20('2c699f9c-ac37-4d16-8a1b-fbf40b7c4187', 'ofcdataecon', 'DATAECON', 18, underlyingAssetForSymbol('dataecon')),
  ofcerc20('485ec940-c8e2-4f44-a5df-c2d619e43a9e', 'ofcdawn', 'Dawn', 18, underlyingAssetForSymbol('dawn')),
  ofcerc20(
    'ae565f9d-bbdf-4548-968b-12b5b52bc851',
    'ofcdec',
    'Dark Energy Crystals',
    3,
    underlyingAssetForSymbol('dec')
  ),
  ofcerc20('635c0868-c8ee-4df4-8437-605e0b0c939b', 'ofcdego', 'Dego Finance', 18, underlyingAssetForSymbol('dego')),
  ofcerc20('2f46e598-49d0-49af-a2ed-d79239457508', 'ofcdexa', 'Dexa Coin', 18, underlyingAssetForSymbol('dexa')),
  ofcerc20('0054e435-3baa-4360-b4e8-e2f6ecb51bb9', 'ofcdexe', 'DeXe', 18, underlyingAssetForSymbol('dexe')),
  ofcerc20('95ba6b46-f91b-4d1f-8a43-d9a4aa755d93', 'ofcdfd', 'DeFiDollar DAO', 18, underlyingAssetForSymbol('dfd')),
  ofcerc20('e37eda5c-ba46-4f05-b0c0-17aadce3a608', 'ofcdfx', 'DFX Token', 18, underlyingAssetForSymbol('dfx')),
  ofcerc20('509fbf1e-133f-494b-9e00-cb75175ea5e5', 'ofcdgcl', 'Dgcl', 18, underlyingAssetForSymbol('dgcl')),
  ofcerc20('fe318b24-fb28-4cd4-a7d6-f009c9ddc206', 'ofcdgd', 'Digix DAO', 9, underlyingAssetForSymbol('dgd')),
  ofcerc20('e4650916-fb5e-4dd7-8650-0762e76f822a', 'ofcdgld', 'Digital Gold', 18, underlyingAssetForSymbol('dgld')),
  ofcerc20('186c3507-fdc5-4813-abdc-9e3a73d68419', 'ofcdgx', 'Digix', 9, underlyingAssetForSymbol('dgx')),
  ofcerc20('93faed38-9923-46a6-952d-011f06102075', 'ofcdigg', 'Digg', 9, underlyingAssetForSymbol('digg')),
  ofcerc20('ea150c4b-4384-45ce-963c-68ef5959facd', 'ofcdipe', 'DIPE', 6, underlyingAssetForSymbol('dipe')),
  ofcerc20('49bf3174-4b13-49e2-bdea-33491779b11c', 'ofcdmg', 'DMM: Governance', 18, underlyingAssetForSymbol('dmg')),
  ofcerc20('c9301b06-3bd2-4de3-8977-831c168328a7', 'ofcdmt', 'DMarket', 8, underlyingAssetForSymbol('dmt')),
  ofcerc20('1be8da1d-c4de-4e18-8e70-9bc8fceb3ba0', 'ofcdpi', 'DeFi Pulse Index', 18, underlyingAssetForSymbol('dpi')),
  ofcerc20('4fac9127-a1c2-4f74-8de0-f399dcadc3a0', 'ofcdrpu', 'DRP Utility', 8, underlyingAssetForSymbol('drpu')),
  ofcerc20('2b70aed2-de74-4c59-b14e-342c38d3c4d3', 'ofcdrv', 'Drive', 18, underlyingAssetForSymbol('drv')),
  ofcerc20('a935832c-9098-44fd-8fd8-4d13c87a04b6', 'ofcduc', 'DUING COIN', 18, underlyingAssetForSymbol('duc')),
  ofcerc20('ef7d1333-8de5-4523-85cd-6e4ee924fa83', 'ofcdust', 'DUST Protocol', 9, underlyingAssetForSymbol('dust')),
  ofcerc20('492bd833-1a19-46b6-849e-a2423fdb901a', 'ofcdx1u', 'Dx1u', 8, underlyingAssetForSymbol('dx1u')),
  ofcerc20('f8e82f95-01b2-4bc7-9651-cfcc489c86ff', 'ofcdxgt', 'Dacxi Gold Token', 18, underlyingAssetForSymbol('dxgt')),
  ofcerc20('876183d1-e0d7-4c1a-b9cf-bf128771daeb', 'ofcdxo', 'DeepSpace', 18, underlyingAssetForSymbol('dxo')),
  ofcerc20(
    'b17b369f-0720-49dc-9902-ee251fc4db11',
    'ofcdxpt',
    'Dacxi Platinum Token',
    18,
    underlyingAssetForSymbol('dxpt')
  ),
  ofcerc20(
    '90fc6735-200c-4f82-ac8b-4b735bd0456e',
    'ofcdxst',
    'Dacxi Silver Token',
    18,
    underlyingAssetForSymbol('dxst')
  ),
  ofcerc20('729e9861-4729-40c8-a20d-b1afbfb10c31', 'ofcdyn', 'DYN Token', 18, underlyingAssetForSymbol('dyn')),
  ofcerc20('abddec03-0e38-450d-80ce-ca6d8739be69', 'ofceasy', 'Easy', 18, underlyingAssetForSymbol('easy')),
  ofcerc20('3aeb268d-6b1f-4ba5-8a90-54d93b7f74fa', 'ofcebtcq', 'EmberBTCQuant', 18, underlyingAssetForSymbol('ebtcq')),
  ofcerc20('3dfdc742-72b7-4a68-8700-01c10c02a22c', 'ofcecht', 'eChat', 0, underlyingAssetForSymbol('echt')),
  ofcerc20('9ceddd4e-41a1-467f-b29a-703a9822561c', 'ofcecox', 'ECOx', 18, underlyingAssetForSymbol('ecox')),
  ofcerc20('bea5c16a-c03c-4282-b9ab-d96c6eca98b3', 'ofceden', 'Eden', 18, underlyingAssetForSymbol('eden')),
  ofcerc20('d81b203d-5c0b-4764-84ba-20ce85b9d41e', 'ofcedison', 'Edison', 8, underlyingAssetForSymbol('edison')),
  ofcerc20('926988f8-6923-4ca5-9bd6-a40eed8dc968', 'ofcedlc', 'Edelcoin', 6, underlyingAssetForSymbol('edlc')),
  ofcerc20('df3446d9-4e69-41ed-9ce1-fc75d1be8ef0', 'ofcedn', 'Eden', 18, underlyingAssetForSymbol('edn')),
  ofcerc20('81d817b5-da65-41aa-983a-ec9619a6a46f', 'ofcedr', 'Endor Protocol', 18, underlyingAssetForSymbol('edr')),
  ofcerc20('c74b96eb-2b24-43a6-a718-936526651f3a', 'ofcefi', 'Efinity', 18, underlyingAssetForSymbol('efi')),
  ofcerc20('e925c83f-bcbd-42a6-90f0-40cc8eae54bd', 'ofcegold', 'eGold', 4, underlyingAssetForSymbol('egold')),
  ofcerc20(
    '570832c1-4e4f-4a68-8c0b-3085e065cd9f',
    'ofceth:ecash',
    'Ethereum Cash',
    18,
    underlyingAssetForSymbol('eth:ecash')
  ),
  ofcerc20('ac3f2b43-0ea1-4692-994c-4adac50bb86a', 'ofceth:oort', 'OORT', 18, underlyingAssetForSymbol('eth:oort')),
  ofcerc20('8ca8c8ac-fba8-48f4-8615-5413017937f0', 'ofcegl', 'Ethereum Eagle', 18, underlyingAssetForSymbol('egl')),
  ofcerc20('9b8af64f-7fe5-4e86-838c-27344322a709', 'ofcerd', 'Elrond', 18, underlyingAssetForSymbol('erd')),
  ofcerc20('f08fa2d8-ef9a-4ce2-a1c3-80349758282e', 'ofcese', 'Eesee', 18, underlyingAssetForSymbol('ese')),
  ofcerc20('8f0a792f-0961-4896-a177-d93288542342', 'ofcemaid', 'MaidSafeCoin', 18, underlyingAssetForSymbol('emaid')),
  ofcerc20('46b24bdf-9124-48cf-b120-0e457015f839', 'ofcemb', 'Emblem', 8, underlyingAssetForSymbol('emb')),
  ofcerc20('a5f459e7-6429-4ad7-b850-0f50cc67f295', 'ofcemx', 'EMX', 18, underlyingAssetForSymbol('emx')),
  ofcerc20('fda9d697-6e28-4836-ab73-9e3ffde73016', 'ofceng', 'Enigma', 8, underlyingAssetForSymbol('eng')),
  ofcerc20('e5659707-ebd3-463a-b294-2861d6b54f19', 'ofceqo', 'EQUOS Origin', 18, underlyingAssetForSymbol('eqo')),
  ofcerc20('a74ee355-7782-4bfd-a42a-b7baef40e247', 'ofceta', 'ETA Token', 18, underlyingAssetForSymbol('eta')),
  ofcerc20(
    'e2bc068f-e8a8-450b-b7f9-5a73f05fb362',
    'ofcethbull',
    '3X Long Ethereum Token',
    18,
    underlyingAssetForSymbol('ethbull')
  ),
  ofcerc20('9a0d00c0-7f56-46f9-9707-4d1e14b2d5a8', 'ofcethos', 'Ethos', 8, underlyingAssetForSymbol('ethos')),
  ofcerc20('57a41ed6-a2a3-4a53-bff8-a4537be5ac87', 'ofcetv', 'Ecotech Visions', 18, underlyingAssetForSymbol('etv')),
  ofcerc20('7c5568e3-85cf-4a48-9160-336f7de7c3ab', 'ofceul', 'Euler', 18, underlyingAssetForSymbol('eul')),
  ofcerc20(
    '07471422-ef06-4db7-842b-129cf0df3096',
    'ofceure',
    'Monerium EUR emoney',
    18,
    underlyingAssetForSymbol('eure')
  ),
  ofcerc20('3aef80a6-3847-4ac3-ae79-774818e726fa', 'ofceurl', 'LUGH', 6, underlyingAssetForSymbol('eurl')),
  ofcerc20(
    '8a6b45ea-8b4b-4b66-b2a6-160c2c49bb45',
    'ofceuroe',
    'EUROe Stablecoin',
    6,
    underlyingAssetForSymbol('euroe')
  ),
  ofcerc20('b954eac7-89c9-40ba-8cd3-876208c9544a', 'ofceurop', 'EURØP', 6, underlyingAssetForSymbol('europ')),
  ofcerc20('df5cce48-2064-47fa-892c-4a999f1d4faa', 'ofceurst', 'EURST', 18, underlyingAssetForSymbol('eurst')),
  ofcerc20('5ba4f405-56df-48c7-aeb0-cac214226a29', 'ofceurt', 'Tether EUR', 6, underlyingAssetForSymbol('eurt')),
  ofcerc20('e22f1683-925a-4cd0-ba18-57c67ed8014a', 'ofceurx', 'eToro Euro', 18, underlyingAssetForSymbol('eurx')),
  ofcerc20(
    '4e56668f-ade6-4481-a9af-8a7e99677e33',
    'ofceurcvv0',
    'EUR Coinvertible',
    18,
    underlyingAssetForSymbol('eurcvv0')
  ),
  ofcerc20(
    '000ffab9-b903-47fd-8e1e-edfe1fe9295b',
    'ofceurcv',
    'EUR CoinVertible',
    18,
    underlyingAssetForSymbol('eurcv')
  ),
  ofcerc20('29e77c67-7c04-4c74-96c0-011df462850b', 'ofceuroc', 'Euro Coin', 6, underlyingAssetForSymbol('euroc')),
  ofcerc20('c3f12ab1-ab46-4804-9fbf-2d33c5774361', 'ofceurr', 'StablR Euro', 6, underlyingAssetForSymbol('eurr')),
  ofcerc20('1f23826a-22e5-4c5c-a734-aa7aef8e2b95', 'ofceux', 'EUR Stable Token', 18, underlyingAssetForSymbol('eux')),
  ofcerc20('fd671b92-7f66-40ba-98e9-59c776c94463', 'ofcevery', 'Everyworld', 18, underlyingAssetForSymbol('every')),
  ofcerc20('c99d5339-b79b-46c9-81a3-f694ef190986', 'ofcevry', 'EvrynetToken', 18, underlyingAssetForSymbol('evry')),
  ofcerc20('960b3691-c881-4976-a0ba-51d4be751a54', 'ofcevx', 'Everex', 4, underlyingAssetForSymbol('evx')),
  ofcerc20('79d2905c-a12d-4046-b409-5ba16a4d2f65', 'ofcexe', 'EXE Token', 8, underlyingAssetForSymbol('exe')),
  ofcerc20(
    '552a6d6c-9fc8-4b3c-bdab-fef3ac31bb98',
    'ofcfarm',
    'FARM Reward Token',
    18,
    underlyingAssetForSymbol('farm')
  ),
  ofcerc20('9ac0a862-28c4-4a0c-95f0-2d4c863b4bb5', 'ofcfdt', 'Fiat DAO', 18, underlyingAssetForSymbol('fdt')),
  ofcerc20('1dff5071-fc2a-419a-afe6-9a79418eb2ae', 'ofcff1', 'Two Prime FF1', 18, underlyingAssetForSymbol('ff1')),
  ofcerc20(
    '4801a671-00f2-49d6-83c5-9b39815c8a78',
    'ofcfft',
    'Fight to Fame Token',
    18,
    underlyingAssetForSymbol('fft')
  ),
  ofcerc20('7e62c1e5-62dc-4e7c-aec5-7ac0cd440136', 'ofcfida', 'Bonfida Token', 6, underlyingAssetForSymbol('fida')),
  ofcerc20('1ba80514-c5c3-47be-b3e6-4c11d0ab25d3', 'ofcfire', 'Ceramic Token', 18, underlyingAssetForSymbol('fire')),
  ofcerc20('432c0f0c-3bbf-440c-885e-047b1ea75aee', 'ofcflux', 'Flux', 8, underlyingAssetForSymbol('flux')),
  ofcerc20('69a4d87c-bcc2-43b6-a66e-c5d3fdb40771', 'ofcfly', 'FlyCoin', 18, underlyingAssetForSymbol('fly')),
  ofcerc20('e0e67b63-2cd4-4906-b749-1d8b61cf2755', 'ofcfmf', 'Formosa Financial', 18, underlyingAssetForSymbol('fmf')),
  ofcerc20('f84d0115-451a-4ee9-a16c-93066b3922f6', 'ofcfor', 'ForTube', 18, underlyingAssetForSymbol('for')),
  ofcerc20('16249ef2-eeb1-4f25-93d7-de4dc8ee5459', 'ofcfort', 'Forta', 18, underlyingAssetForSymbol('fort')),
  ofcerc20(
    'e5238da7-b453-4234-aa77-8b9b57595b6a',
    'ofcforth',
    'Ampleforth Governance Token',
    18,
    underlyingAssetForSymbol('forth')
  ),
  ofcerc20('12678b72-a5a9-41c9-af04-d536b3197b86', 'ofcfront', 'Frontier Token', 18, underlyingAssetForSymbol('front')),
  ofcerc20(
    '5c0a84b9-32b8-43ab-bdaa-26c0f2dcca44',
    'ofcfwb',
    'Friends With Benefits Pro',
    18,
    underlyingAssetForSymbol('fwb')
  ),
  ofcerc20('36609e72-76d7-448b-9289-9862a6a7e333', 'ofcfxrt', 'FXRT', 3, underlyingAssetForSymbol('fxrt')),
  ofcerc20('89d2a9b0-ecab-4e41-a746-c845cac36396', 'ofcg', 'Gravity', 18, underlyingAssetForSymbol('g')),
  ofcerc20('513b4670-ea9b-44f3-859d-96973e252af8', 'ofcgalav2', 'galav2', 8, underlyingAssetForSymbol('galav2')),
  ofcerc20('c7e65955-0917-4b08-84d9-cb3d4fed116c', 'ofcgamma', 'Gamma', 18, underlyingAssetForSymbol('gamma')),
  ofcerc20(
    '4fbe62ee-8220-49ef-bc51-2c936c480ec8',
    'ofcgbpx',
    'eToro Pound Sterling',
    18,
    underlyingAssetForSymbol('gbpx')
  ),
  ofcerc20('8d954e16-a665-40df-89b9-fe7326ceebaa', 'ofcgdt', 'GDT', 8, underlyingAssetForSymbol('gdt')),
  ofcerc20('c8925dc5-e828-43b0-98dc-b0e14e8256e8', 'ofcgen', 'DAOstack', 18, underlyingAssetForSymbol('gen')),
  ofcerc20(
    '1721b8cf-45d8-437e-90b3-5c7c2d414620',
    'ofcgel',
    'Gelato Network Token',
    18,
    underlyingAssetForSymbol('gel')
  ),
  ofcerc20('6a24f072-91bd-47e5-ae58-5f8a3b3d5cb0', 'ofcgldx', 'eToro Gold', 18, underlyingAssetForSymbol('gldx')),
  ofcerc20('b24068a3-360f-49f5-b6a6-8057afa36c65', 'ofcgec', 'GECoin', 18, underlyingAssetForSymbol('gec')),
  ofcerc20('cdbe237b-ff28-4e84-954d-64d38a38cd00', 'ofcgenie', 'GenieSwap', 18, underlyingAssetForSymbol('genie')),
  ofcerc20('19f3e6f6-74be-463e-a9e1-3b5346a803af', 'ofcghub', 'Genohub', 8, underlyingAssetForSymbol('ghub')),
  ofcerc20('b1e02bcb-187c-4e5f-9a79-61c3464629e3', 'ofcghst', 'aavegotchi', 18, underlyingAssetForSymbol('ghst')),
  ofcerc20(
    'aab13fa5-19a1-48a2-bd5d-19d7b2ebab6d',
    'ofcgigdrop',
    'GIG-POOL-DROP',
    18,
    underlyingAssetForSymbol('gigdrop')
  ),
  ofcerc20('27942d31-cf89-46bd-ab2a-9e1690ce7d7b', 'ofcgmt', 'GreenMetaverseToken', 8, underlyingAssetForSymbol('gmt')),
  ofcerc20('b124edc2-c227-4068-8a6c-687d2be1570d', 'ofcgnt', 'Golem', 18, underlyingAssetForSymbol('gnt')),
  ofcerc20('ca7e5745-af28-432a-8411-b8e3aaf38416', 'ofcgold', 'XBullion Token', 8, underlyingAssetForSymbol('gold')),
  ofcerc20('0330cfb6-43be-4cc6-b905-a09706a5e9ae', 'ofcgot', 'GOExchange', 18, underlyingAssetForSymbol('got')),
  ofcerc20('cccb78f7-8d8a-4b73-b915-a3754ac3d75b', 'ofcgto', 'Gifto', 5, underlyingAssetForSymbol('gto')),
  ofcerc20(
    '87290914-5a67-46a1-a2d6-26ba243dae33',
    'ofcgusd',
    'Gemini Dollar',
    2,
    underlyingAssetForSymbol('gusd'),
    undefined,
    [CoinFeature.STABLECOIN]
  ),
  ofcerc20('c0089eb1-92d9-4775-bbf7-a0a60434c23f', 'ofcgxc', 'Game X Coin', 18, underlyingAssetForSymbol('gxc')),
  ofcerc20('a9bc71ef-b85e-4b3a-9949-7de54626258b', 'ofcgyen', 'Gmo JPY', 6, underlyingAssetForSymbol('gyen')),
  ofcerc20('0081146a-bde1-4bf4-abe7-703d90d5e1ec', 'ofchcn', 'Himalaya Coin', 18, underlyingAssetForSymbol('hcn')),
  ofcerc20('6385614f-940d-4469-b748-e21d3eda580d', 'ofchdo', 'Himalaya Dollar', 18, underlyingAssetForSymbol('hdo')),
  ofcerc20('9ed2d55e-2b97-4b6f-8d68-72cb63e0cd5d', 'ofchedg', 'HedgeTrade', 18, underlyingAssetForSymbol('hedg')),
  ofcerc20('f227c0b5-a6ac-4353-96e8-2f2dca57fc5f', 'ofchget', 'Hedget', 6, underlyingAssetForSymbol('hget')),
  ofcerc20('1ff62f9c-4bd8-46a9-8e18-733ac1599b3c', 'ofchigh', 'Highstreet', 18, underlyingAssetForSymbol('high')),
  ofcerc20('d21321bd-1457-4e81-bb39-003ab2bdc627', 'ofchifi', 'Hifi Finance', 18, underlyingAssetForSymbol('hifi')),
  ofcerc20(
    '9c232330-ba0c-4411-925d-f3273f70865f',
    'ofchkdx',
    'eToro Hong Kong Dollar',
    18,
    underlyingAssetForSymbol('hkdx')
  ),
  ofcerc20('28f78878-5230-4b59-be47-c2cfb03f56a9', 'ofchlc', 'HalalChain', 9, underlyingAssetForSymbol('hlc')),
  ofcerc20('1422774f-adbb-4054-96ad-35b0d4e3fcce', 'ofchmt', 'HUMAN Token', 18, underlyingAssetForSymbol('hmt')),
  ofcerc20('3d9749b2-4f30-454c-b731-0dc6e31a34ab', 'ofchold', 'Hold', 18, underlyingAssetForSymbol('hold')),
  ofcerc20('52196e54-2f54-4389-85b3-5e2aaa03ca2a', 'ofchqt', 'HyperQuant', 18, underlyingAssetForSymbol('hqt')),
  ofcerc20('1e429bcb-28da-4893-b65a-4eb6ae76b902', 'ofchst', 'Decision Token', 18, underlyingAssetForSymbol('hst')),
  ofcerc20('20b3f26c-fcbf-4cc7-9ce5-195892b5db75', 'ofchyb', 'Hybrid Block', 18, underlyingAssetForSymbol('hyb')),
  ofcerc20('2c236ab8-6412-4359-b315-25366b6be662', 'ofchydro', 'Hydro', 18, underlyingAssetForSymbol('hydro')),
  ofcerc20('9b9269cf-9e89-4bf0-a37e-6b9e4e249c54', 'ofci8', 'i8 Exchange Token', 18, underlyingAssetForSymbol('i8')),
  ofcerc20(
    '778aa6db-7403-435d-bd01-8d6b8087843a',
    'ofciceth',
    'Interest Compounding ETH Index',
    18,
    underlyingAssetForSymbol('iceth')
  ),
  ofcerc20('403498f6-1913-4d94-9b62-feb7dbc1aa7f', 'ofcid', 'SPACE ID', 18, underlyingAssetForSymbol('id')),
  ofcerc20('e4abb499-771c-4971-8720-9920f6f0213b', 'ofcidex', 'IDEX', 18, underlyingAssetForSymbol('idex')),
  ofcerc20('aa2f15e8-a860-4a7c-acfb-bcb9e950fee6', 'ofcidrc', 'Rupiah Coin', 18, underlyingAssetForSymbol('idrc')),
  ofcerc20('b7dfeff1-e50a-4e56-9e9b-5d972dcd2c89', 'ofcidrt', 'Rupiah Token', 2, underlyingAssetForSymbol('idrt')),
  ofcerc20(
    '937db4e7-3000-4869-9666-88c1014b8a77',
    'ofcincx',
    'InternationalCryptoX',
    18,
    underlyingAssetForSymbol('incx')
  ),
  ofcerc20('70be1dd9-c37a-4504-a1e4-b603e347c793', 'ofcind', 'Indorse', 18, underlyingAssetForSymbol('ind')),
  ofcerc20('39733723-aa3b-4dea-8cc9-5b5393f59444', 'ofcindex', 'Index Coop', 18, underlyingAssetForSymbol('index')),
  ofcerc20('d4c77d83-ea49-4ad0-8a4e-00641d54a265', 'ofcindi', 'IndiGG', 18, underlyingAssetForSymbol('indi')),
  ofcerc20('d1c27020-e4a0-4535-a3ce-56605fd1662b', 'ofcinf', 'Infinitus Token', 18, underlyingAssetForSymbol('inf')),
  ofcerc20('6aa0fa86-ae88-408b-a79c-5a244d95ec0c', 'ofcinst', 'Instadapp', 18, underlyingAssetForSymbol('inst')),
  ofcerc20('db221db1-227a-438e-90ed-4e23c2c67927', 'ofcinx', 'INX Token', 18, underlyingAssetForSymbol('inx')),
  ofcerc20('a304fb43-d234-4cf2-9269-2848b2531b0b', 'ofciost', 'IOSToken', 18, underlyingAssetForSymbol('iost')),
  ofcerc20('ae4e755c-2f68-4e66-a9ed-2fc995568a6f', 'ofcisf', 'Susnova', 18, underlyingAssetForSymbol('isf')),
  ofcerc20('71249e4f-f5c6-42f8-9a5d-8e93be9557d6', 'ofcisr', 'Insureum', 18, underlyingAssetForSymbol('isr')),
  ofcerc20('84e84732-c59f-49ca-bf68-c1451871fce0', 'ofcivo', 'INVAO Token', 18, underlyingAssetForSymbol('ivo')),
  ofcerc20('c677e2fc-7b1e-4302-8d46-c95c506ad391', 'ofcivy', 'Ivy Koin', 18, underlyingAssetForSymbol('ivy')),
  ofcerc20('01e85c61-2e1f-42cd-a382-5a0fc454fda9', 'ofcjbc', 'Japan Brand Coin', 18, underlyingAssetForSymbol('jbc')),
  ofcerc20('56d14e3a-f438-4d14-a8f2-26f84b0c7959', 'ofcjfin', 'JFIN Coin', 18, underlyingAssetForSymbol('jfin')),
  ofcerc20(
    '68eb1c4f-bec3-44fc-9042-f9f239482b25',
    'ofcjpyx',
    'eToro Japanese Yen',
    18,
    underlyingAssetForSymbol('jpyx')
  ),
  ofcerc20('ad622157-71af-4eb9-b4cc-00c5c0e8195e', 'ofckarate', 'Karate', 18, underlyingAssetForSymbol('karate')),
  ofcerc20('d9299514-9dfd-4dfd-8fae-726c407b20ef', 'ofckey', 'SelfKey', 18, underlyingAssetForSymbol('key')),
  ofcerc20('c3f1ef74-8170-4c7d-afef-ac29ba32a309', 'ofckin', 'Kin', 18, underlyingAssetForSymbol('kin')),
  ofcerc20(
    'c1317f3c-3fc4-4078-b271-ca8060632618',
    'ofckine',
    'Kine Governance Token',
    18,
    underlyingAssetForSymbol('kine')
  ),
  ofcerc20('96f40627-8677-4d97-adb4-8f8e7736117a', 'ofcking', 'KING', 18, underlyingAssetForSymbol('king')),
  ofcerc20('1d54c16e-91de-448d-af33-fd85fd4f3a3b', 'ofckinto', 'Kinto Token', 18, underlyingAssetForSymbol('kinto')),
  ofcerc20('594c14ed-f146-476b-a460-2776f65ccfe6', 'ofckiro', 'Kirobo', 18, underlyingAssetForSymbol('kiro')),
  ofcerc20('bb37e133-93b9-4526-830f-af441205d5fa', 'ofckoin', 'Koin', 18, underlyingAssetForSymbol('koin')),
  ofcerc20('428f86e5-af04-41d8-8ac5-779bcc948a27', 'ofckoz', 'KOZJIN Token', 18, underlyingAssetForSymbol('koz')),
  ofcerc20('bbf31494-0178-4107-9a63-b5d3f5c39e15', 'ofckp3r', 'Kp3r', 18, underlyingAssetForSymbol('kp3r')),
  ofcerc20('a6144bdc-4331-412b-8cfd-0d80cc935adc', 'ofckro', 'Kroma', 18, underlyingAssetForSymbol('kro')),
  ofcerc20('31d6e17f-79ac-45cd-84ac-69cab4ff8f22', 'ofckrom', 'Kromatika', 18, underlyingAssetForSymbol('krom')),
  ofcerc20('007ea976-856c-4dca-bd42-ae49cb575f28', 'ofckze', 'Almeela', 18, underlyingAssetForSymbol('kze')),
  ofcerc20('4a26763d-e97e-495f-8254-c815b99fd3ae', 'ofcl3', 'Layer3', 18, underlyingAssetForSymbol('l3')),
  ofcerc20('4e6fc42b-a1a4-41f8-9bf6-09324083231c', 'ofclayer', 'Unilayer', 18, underlyingAssetForSymbol('layer')),
  ofcerc20('bf01525d-3466-4827-953d-25e98cd6505b', 'ofclba', 'Cred', 18, underlyingAssetForSymbol('lba')),
  ofcerc20('d90617c8-69dd-4d94-bfb8-5722fff9c0d2', 'ofclend', 'EthLend', 18, underlyingAssetForSymbol('lend')),
  ofcerc20('2a422650-e7e8-4f03-914b-b23b04681a0e', 'ofclgo', 'LGO Exchange', 8, underlyingAssetForSymbol('lgo')),
  ofcerc20('835beb77-44e1-4c46-abb0-e11a21c170c0', 'ofclina', 'Linear Token', 18, underlyingAssetForSymbol('lina')),
  ofcerc20('45ad85cc-96e3-4f88-a8c9-358c563e0fe8', 'ofclion', 'CoinLion', 18, underlyingAssetForSymbol('lion')),
  ofcerc20('093c7404-3f67-421e-87b2-15ee4cd0adf6', 'ofclit', 'Litentry', 18, underlyingAssetForSymbol('lit')),
  ofcerc20('3fb41ea5-d475-4131-91f3-d0ec743fcf8a', 'ofclmwr', 'LimeWire Token', 18, underlyingAssetForSymbol('lmwr')),
  ofcerc20('de4dc6c3-4beb-4f83-a0d7-8ad7f09d28bd', 'ofclnc', 'Linker Coin', 18, underlyingAssetForSymbol('lnc')),
  ofcerc20(
    'c228fc8d-4a95-4e10-be96-826dbfb8aa0f',
    'ofcloka',
    'League of Kingdoms',
    18,
    underlyingAssetForSymbol('loka')
  ),
  ofcerc20('77506c23-b1ba-44e7-b8e3-4d288b553644', 'ofcloom1', 'Loom Token', 18, underlyingAssetForSymbol('loom1')),
  ofcerc20(
    '6010e752-a14c-4aa4-908f-b2339dc64b7e',
    'ofclseth',
    'Liquid Staked ETH',
    18,
    underlyingAssetForSymbol('lseth')
  ),
  ofcerc20('61c9dbe3-7609-4a36-a781-c057bd3ae88a', 'ofclsk', 'Lisk', 18, underlyingAssetForSymbol('lsk')),
  ofcerc20(
    '96917c5f-b397-4701-b009-1d496e7e27c0',
    'ofcltcbull',
    '3X Long Litecoin Token',
    18,
    underlyingAssetForSymbol('ltcbull')
  ),
  ofcerc20('c6ed9180-a457-4225-8f70-daaa5604c7ae', 'ofclua', 'LuaToken', 18, underlyingAssetForSymbol('lua')),
  ofcerc20('10608d21-a42a-4247-95d0-8547b55faae1', 'ofclyn', 'Lynchpin', 18, underlyingAssetForSymbol('lyn')),
  ofcerc20('70a49938-6321-4034-8c43-b3da631cf5ff', 'ofcmaps', 'Maps', 6, underlyingAssetForSymbol('maps')),
  ofcerc20('1a66a1f7-ad86-4959-aa9b-19891ea0e256', 'ofcmath', 'MATH Token', 18, underlyingAssetForSymbol('math')),
  ofcerc20('3ef360cc-3ab6-4cfa-aa9d-f51678dbe1eb', 'ofcmcb', 'MCDEX Token', 18, underlyingAssetForSymbol('mcb')),
  ofcerc20('c54e7e11-8e2e-493b-9119-8e2bf359aa92', 'ofcmco', 'Crypto.com', 8, underlyingAssetForSymbol('mco')),
  ofcerc20('60de27b9-4767-43ba-8828-aa408fd98f1a', 'ofcmcs', 'MCS Token', 18, underlyingAssetForSymbol('mcs')),
  ofcerc20('97613a25-37f5-447f-87dd-b67b7b52c000', 'ofcmcx', 'MachiX Token', 18, underlyingAssetForSymbol('mcx')),
  ofcerc20('4ac19bd5-fb36-4b73-8d38-c1f6b7d14e3b', 'ofcmdfc', 'MDFC', 18, underlyingAssetForSymbol('mdfc')),
  ofcerc20(
    '11110753-1c19-414b-bf5c-fb236a40be61',
    'ofcmdt',
    'Measurable Data Token',
    18,
    underlyingAssetForSymbol('mdt')
  ),
  ofcerc20('16467423-4acd-40fd-92cb-45a4f96c75b7', 'ofcmedx', 'Medibloc', 8, underlyingAssetForSymbol('medx')),
  ofcerc20('51d39caa-26b4-4763-9314-3d1a39450815', 'ofcmeow', 'MEOW', 18, underlyingAssetForSymbol('meow')),
  ofcerc20('b77fe6b3-c5d1-4f12-a8e4-841d16fa95fc', 'ofcmet', 'Metronome', 18, underlyingAssetForSymbol('met')),
  ofcerc20('06094bcc-f0a9-46ef-a96c-0e2f94e1cd54', 'ofcmeta', 'Metadium', 18, underlyingAssetForSymbol('meta')),
  ofcerc20('f91ed73e-ca4c-4a44-b038-e365cc0f39fa', 'ofcmfg', 'SyncFab', 18, underlyingAssetForSymbol('mfg')),
  ofcerc20('40ff7ca9-63e1-4d7c-b1db-54f3666db965', 'ofcmfph', 'MFPH Token', 18, underlyingAssetForSymbol('mfph')),
  ofcerc20('7eb5c190-9751-4024-8e97-c8915e7b1aeb', 'ofcmft', 'Mainframe', 18, underlyingAssetForSymbol('mft')),
  ofcerc20(
    'c3f1eb1c-4d42-4767-a0f7-16c02fc3eaf8',
    'ofcmidbull',
    '3X Long Midcap Index Token',
    18,
    underlyingAssetForSymbol('midbull')
  ),
  ofcerc20('f7f9cb6b-48e5-407d-9ece-78f9c4038e63', 'ofcmilkv2', 'Milkv2', 18, underlyingAssetForSymbol('milkv2')),
  ofcerc20('cef83c03-801b-4fd8-8947-bc060c8fa6ea', 'ofcmir', 'Mirror Protocol', 18, underlyingAssetForSymbol('mir')),
  ofcerc20('1b323a6e-eb6b-44d1-b6f4-5e50fd12e5e3', 'ofcmith', 'Mithril', 18, underlyingAssetForSymbol('mith')),
  ofcerc20('2c592feb-b052-4a08-bd42-9c0c8a8b8611', 'ofcmix', 'MixMarvel Token', 18, underlyingAssetForSymbol('mix')),
  ofcerc20('2e6f9527-d720-4079-b376-04fdcdd4c9e9', 'ofcmizn', 'Miznettk', 18, underlyingAssetForSymbol('mizn')),
  ofcerc20('6174ddda-b240-4623-b391-50219c0ddc9e', 'ofcmns', 'Monnos Token', 18, underlyingAssetForSymbol('mns')),
  ofcerc20('f3655b59-17b2-4e9e-914b-771d9ea1078c', 'ofcmln', 'Enzyme', 18, underlyingAssetForSymbol('mln')),
  ofcerc20('aa31a241-3e24-4a17-95db-ee74a6843b70', 'ofcmoc', 'Moss Coin', 18, underlyingAssetForSymbol('moc')),
  ofcerc20('97ebe992-de04-4917-b808-2c867fa380a0', 'ofcmof', 'Molecular Future', 16, underlyingAssetForSymbol('mof')),
  ofcerc20('9a4e4778-5188-4fbc-8365-9dc0ec667692', 'ofcmpay', 'MenaPay', 18, underlyingAssetForSymbol('mpay')),
  ofcerc20('b6211763-0265-4b62-b611-8ed352c97516', 'ofcmtcn', 'Multiven', 18, underlyingAssetForSymbol('mtcn')),
  ofcerc20('a880c391-4c5a-4748-9bc7-1f36334562ec', 'ofcmta', 'Meta', 18, underlyingAssetForSymbol('mta')),
  ofcerc20(
    'a34f03a4-6e4f-45db-b00b-936f07127359',
    'ofcmusd',
    'mStable USD',
    18,
    underlyingAssetForSymbol('musd'),
    undefined,
    [CoinFeature.STABLECOIN]
  ),
  ofcerc20('8cbe862a-ce3e-4d0d-ab77-e854422d7a94', 'ofcmvi', 'Metaverse Index', 18, underlyingAssetForSymbol('mvi')),
  ofcerc20(
    '6213e9f1-19eb-4464-8353-308d0fe2c4a0',
    'ofcmwt',
    'Mountain Wolf Token',
    18,
    underlyingAssetForSymbol('mwt')
  ),
  ofcerc20('2f014965-fc19-4fd8-85ef-c3a66c2ad798', 'ofcmyrc', 'MYRC', 18, underlyingAssetForSymbol('myrc')),
  ofcerc20('fd98b935-39a2-497a-a7a1-3d2f24bc23e1', 'ofcmyth', 'Mythos', 18, underlyingAssetForSymbol('myth')),
  ofcerc20('8d773bb5-75ec-437d-aa9f-d3203ba1fdd1', 'ofcnas', 'Nebulas', 18, underlyingAssetForSymbol('nas')),
  ofcerc20('11b74e48-dcc0-4126-99f5-2f4e794a23e5', 'ofcnct', 'Polyswarm', 18, underlyingAssetForSymbol('nct')),
  ofcerc20('6b25d8bb-0a4e-49c8-a96c-d970b73fdddb', 'ofcndx', 'Indexed Finance', 18, underlyingAssetForSymbol('ndx')),
  ofcerc20('659398a6-8bae-439b-879d-4175da781bf0', 'ofcneu', 'Neumark', 18, underlyingAssetForSymbol('neu')),
  ofcerc20('ec2b2093-f737-4304-a638-bdc9fda53c6e', 'ofcnftfi', 'NFTfi', 18, underlyingAssetForSymbol('nftfi')),
  ofcerc20('4bedacaf-41de-46a0-8181-cd1265bffb55', 'ofcnftx', 'NFTX', 18, underlyingAssetForSymbol('nftx')),
  ofcerc20('22e60d45-012a-4eb4-829d-18f6392bacf0', 'ofcngnt', 'Naira Token', 2, underlyingAssetForSymbol('ngnt')),
  ofcerc20('0c14caa8-6cf5-4a0e-a114-533cdc88d2b6', 'ofcniax', 'IONIAX Token', 18, underlyingAssetForSymbol('niax')),
  ofcerc20('a801fdf0-e80d-439d-bdac-ec2d4ca0f353', 'ofcnosana', 'Nosana', 18, underlyingAssetForSymbol('nosana')),
  ofcerc20(
    '9d11cee7-c2e1-4681-9569-dd21059799d4',
    'ofcnzdx',
    'eToro New Zealand Dollar',
    18,
    underlyingAssetForSymbol('nzdx')
  ),
  ofcerc20('1d355ee6-6de5-4c0d-9403-63a0d2ad99df', 'ofcomold', 'Om Token', 18, underlyingAssetForSymbol('omold')),
  ofcerc20('deb87ec4-0ae0-43fb-95bd-bd2ddf6a77a7', 'ofcomni', 'Omni Network', 18, underlyingAssetForSymbol('omni')),
  ofcerc20('5d66b4c4-e9b0-4e1f-9abf-c6742ab38304', 'ofcomnia', 'OMNIA Protocol', 18, underlyingAssetForSymbol('omnia')),
  ofcerc20('a1bcbc74-64b4-41ef-b1bb-f4ac089763ff', 'ofconl', 'On.Live', 18, underlyingAssetForSymbol('onl')),
  ofcerc20('1f5432f6-6693-43ff-95ea-e411600a31ab', 'ofcont', 'Ontology Token', 9, underlyingAssetForSymbol('ont')),
  ofcerc20('a13c7aaf-e497-4850-9422-63d3355afb7e', 'ofcooki', 'Ooki Protocol', 18, underlyingAssetForSymbol('ooki')),
  ofcerc20('24da1a34-2584-4ac7-a847-9d4391cdf67c', 'ofcopt', 'OPTin Token', 18, underlyingAssetForSymbol('opt')),
  ofcerc20('9e2b6d1f-d58f-4dd7-aa44-1606b1cb50ca', 'ofcoseth', 'Staked ETH', 18, underlyingAssetForSymbol('oseth')),
  ofcerc20(
    '49988981-5543-4614-9c17-6b2da51f4d69',
    'ofcousg',
    'Ondo Short-Term U.S. Government Bond Fund',
    18,
    underlyingAssetForSymbol('ousg')
  ),
  ofcerc20('8ddb3c5a-55ef-4b6f-aae2-6c0242625acb', 'ofcown', 'OwnFund DAO', 18, underlyingAssetForSymbol('own')),
  ofcerc20(
    '8fadf255-1e5b-4c3d-b08d-4708f53107e9',
    'ofcoxy',
    'Oxygen Prime Brokerage',
    6,
    underlyingAssetForSymbol('oxy')
  ),
  ofcerc20('e0519042-d5cb-4bc7-bd7b-e649c17d6149', 'ofcohm', 'Olympus', 9, underlyingAssetForSymbol('ohm')),
  ofcerc20('afd3104a-e182-4800-909d-5cc44df1db7e', 'ofcsd', 'Stader', 18, underlyingAssetForSymbol('sd')),
  ofcerc20('c3d0c8e3-2cb7-4b93-9b17-5d0f301932dc', 'ofcsohm', 'Staked OHM', 9, underlyingAssetForSymbol('sohm')),
  ofcerc20('962e225a-5f64-4a18-8700-d1f7f567c304', 'ofcgohm', 'Governance OHM', 18, underlyingAssetForSymbol('gohm')),
  ofcerc20(
    '97cea203-5c86-4db8-960c-bbc7a50d1fdf',
    'ofcpact',
    'PACT community token',
    18,
    underlyingAssetForSymbol('pact')
  ),
  ofcerc20('9b615c0a-09d8-428c-b5ac-6e9fe5d7344e', 'ofcpar', 'PAR Stable Coin', 18, underlyingAssetForSymbol('par')),
  ofcerc20('3d454310-c962-4bac-9413-3c6c97fab4ba', 'ofcpass', 'Blockpass', 6, underlyingAssetForSymbol('pass')),
  ofcerc20('9ead6ee7-0cbc-4d7f-a680-9d61815444f9', 'ofcpau', 'PegGold Token', 8, underlyingAssetForSymbol('pau')),
  ofcerc20('55033e2e-d863-4c87-a384-298b3637ad3a', 'ofcpax', 'Paxos', 18, underlyingAssetForSymbol('pax')),
  ofcerc20('0d876c7a-f5df-4cc1-b8f7-23c3e497de92', 'ofcpay', 'TenX', 18, underlyingAssetForSymbol('pay')),
  ofcerc20(
    '35047e27-3bcf-4d55-9ec1-08f8180d795a',
    'ofcpbch',
    'PegBitcoin Cash Token',
    8,
    underlyingAssetForSymbol('pbch')
  ),
  ofcerc20('0a91df22-b1c6-4509-87af-d6c2a33ea467', 'ofcpdata', 'Opiria Token', 18, underlyingAssetForSymbol('pdata')),
  ofcerc20('d042eb01-57c6-4466-8db4-72b4a69372cc', 'ofcpdi', 'Phuture DeFi Index', 18, underlyingAssetForSymbol('pdi')),
  ofcerc20('46431192-35c9-4740-a9f1-cb5611aff4a1', 'ofcpbtc', 'PegBitcoin Token', 8, underlyingAssetForSymbol('pbtc')),
  ofcerc20('7ff378b8-748c-4202-a2f7-80445603de05', 'ofcpda', 'PlayDapp', 18, underlyingAssetForSymbol('PDA')),
  ofcerc20('80077ec2-76e0-48d7-b675-6b9b0d8a0a06', 'ofcpeg', 'PegNet', 8, underlyingAssetForSymbol('peg')),
  ofcerc20(
    'c8588e7e-0fde-4b23-be33-991d835cd728',
    'ofcpeople',
    'ConstitutionDAO',
    18,
    underlyingAssetForSymbol('people')
  ),
  ofcerc20('23eb28e6-9fa2-418f-a738-97efd2f223df', 'ofcperl', 'Perlin', 18, underlyingAssetForSymbol('perl')),
  ofcerc20('78cee9d1-4a39-4182-9c4c-4ae06a259d62', 'ofcpeth', 'PegEthereum Token', 8, underlyingAssetForSymbol('peth')),
  ofcerc20('7f425eae-d6ae-4d1c-8034-970b4962fbc9', 'ofcphnx', 'Pheonix Dao', 18, underlyingAssetForSymbol('phnx')),
  ofcerc20('27314860-35b3-4c7b-b3e6-2acc0027523a', 'ofcpie', 'DeFiPie', 18, underlyingAssetForSymbol('pie')),
  ofcerc20('b341b3cb-e10d-431c-ad19-f85d7f2a857e', 'ofcplc', 'PlusCoin', 18, underlyingAssetForSymbol('plc')),
  ofcerc20('bc93bc9e-38b5-4f4c-a72d-39e529819084', 'ofcpfct', 'PegFactom Token', 8, underlyingAssetForSymbol('pfct')),
  ofcerc20(
    'a90f18e2-9fcd-4468-b799-650f53050208',
    'ofcplnx',
    'eToro Polish Zloty',
    18,
    underlyingAssetForSymbol('plnx')
  ),
  ofcerc20('25d8358b-b25b-4f33-86fa-9b693983c1fa', 'ofcplx', 'PLN Stable Token', 18, underlyingAssetForSymbol('plx')),
  ofcerc20('22149508-6114-422e-9c6f-735f57779a80', 'ofcpma', 'PumaPay', 18, underlyingAssetForSymbol('pma')),
  ofcerc20('4083d1de-5dfb-4cfd-9f61-1b2443da5db9', 'ofcpnt', 'pNetwork', 18, underlyingAssetForSymbol('pnt')),
  ofcerc20('fa7b5df5-d559-4a1d-bdf6-6470a746cd51', 'ofcppt', 'Populous Platform', 8, underlyingAssetForSymbol('ppt')),
  ofcerc20('f37ecda3-82e0-44ac-9e91-1d2085fe3ef3', 'ofcprdx', 'PRDX Token', 9, underlyingAssetForSymbol('prdx')),
  ofcerc20(
    'a2aa3e45-ed23-4c96-9df9-dd76263eb2a6',
    'ofcprints',
    'FingerprintsDAO',
    18,
    underlyingAssetForSymbol('prints')
  ),
  ofcerc20(
    'cc6270f3-5464-4dc0-a2c9-d1a3fa190785',
    'ofcprom',
    'Token Prometeus Network',
    18,
    underlyingAssetForSymbol('prom')
  ),
  ofcerc20('ab6b7ad5-37e2-4dab-8fd4-12f98f63c65a', 'ofcprts', 'Protos', 0, underlyingAssetForSymbol('prts')),
  ofcerc20(
    '3fda894f-b9fe-4a32-be0c-a06c122c488f',
    'ofcpstake',
    'PSTAKE Finance',
    18,
    underlyingAssetForSymbol('pstake')
  ),
  ofcerc20('c6774213-1a40-44f6-81d0-053ffad5e9c5', 'ofcnpxs', 'Pundi X', 18, underlyingAssetForSymbol('npxs')),
  ofcerc20(
    '90f6631d-953a-4618-ba93-7c4374ee16ad',
    'ofcns2drp',
    'New Silver Series 2 DROP',
    18,
    underlyingAssetForSymbol('ns2drp')
  ),
  ofcerc20(
    'a48c13d4-387f-48f9-8ac6-add674f2dc60',
    'ofcpusd',
    'PegUSD Token',
    8,
    underlyingAssetForSymbol('pusd'),
    undefined,
    [CoinFeature.STABLECOIN]
  ),
  ofcerc20('3ed1f00c-be87-45f4-b393-4a423422361f', 'ofcpush', 'Push Protocol', 18, underlyingAssetForSymbol('push')),
  ofcerc20('188194de-9728-4e29-997f-00dba0c224b4', 'ofcpv01', 'PV01', 18, underlyingAssetForSymbol('pv01')),
  ofcerc20(
    'dd9820ec-b26e-4f04-abf3-ae620e579185',
    'ofcpxp',
    'PointPay Crypto Banking Token V2',
    18,
    underlyingAssetForSymbol('pxp')
  ),
  ofcerc20('0b2c5575-d93a-46e8-bfdc-fd6ca2d247b5', 'ofcqash', 'QASH', 6, underlyingAssetForSymbol('qash')),
  ofcerc20('69fd8354-0c30-4ca1-b78f-ee16cf9f3fa3', 'ofcqcad', 'QCAD', 2, underlyingAssetForSymbol('qcad')),
  ofcerc20('8a43e704-02af-4735-b381-6a2ddd86767d', 'ofcquick', 'QuickSwap', 18, underlyingAssetForSymbol('quick')),
  ofcerc20('0824c7eb-b650-4388-b620-9f3911bc144d', 'ofcqdt', 'Quadrans Token', 18, underlyingAssetForSymbol('qdt')),
  ofcerc20('12c299e5-6e70-4ff5-813d-36e5ab205a99', 'ofcqrdo', 'Qredo', 8, underlyingAssetForSymbol('qrdo')),
  ofcerc20('fb8cfff7-d9fc-4c8a-a92c-4773608d2846', 'ofcqrl', 'Qrl', 8, underlyingAssetForSymbol('qrl')),
  ofcerc20('62e70343-9c49-4997-adb4-772bfcbf2c52', 'ofcqsp', 'Quantstamp', 18, underlyingAssetForSymbol('qsp')),
  ofcerc20(
    '0915fd18-3203-423e-821b-7686d423f1fd',
    'ofcqlindo',
    'Qlindo Realestate Investment Token',
    0,
    underlyingAssetForSymbol('qlindo')
  ),
  ofcerc20('efcb83c0-cb2b-4c49-b95f-85849b96be11', 'ofcqvt', 'Qvolta', 18, underlyingAssetForSymbol('qvt')),
  ofcerc20('5d068733-c632-40dd-965e-bbf1cd4f8500', 'ofcrad', 'Radicle', 18, underlyingAssetForSymbol('rad')),
  ofcerc20('68a45e56-657e-423b-b1db-f808b9628ffe', 'ofcradar', 'DappRadar', 18, underlyingAssetForSymbol('radar')),
  ofcerc20('45477ce9-baf7-4d35-a2f3-ed88236b67c3', 'ofcrain', 'Rainmaker Games', 18, underlyingAssetForSymbol('rain')),
  ofcerc20('2f504a2b-e14d-497b-8261-fea185e74d0b', 'ofcrcoin', 'ArCoin', 8, underlyingAssetForSymbol('rcoin')),
  ofcerc20('bbd11732-6c74-479b-9aac-2c66a9a23f3c', 'ofcramp', 'RAMP DEFI', 18, underlyingAssetForSymbol('ramp')),
  ofcerc20('32d333f8-363c-490e-8d4c-38ddf8ede123', 'ofcrari', 'Rarible', 18, underlyingAssetForSymbol('rari')),
  ofcerc20('f5da5a80-2eb4-47d5-97a7-3fad6861d8b5', 'ofcrbx', 'RBX', 18, underlyingAssetForSymbol('rbx')),
  ofcerc20('3515497c-afd6-45f8-98c6-efa5a29cf0c3', 'ofcrby', 'Ruby X', 18, underlyingAssetForSymbol('rby')),
  ofcerc20('20c1673f-8cac-43da-bd1c-51e0ada2a996', 'ofcrdn', 'Raiden Network', 18, underlyingAssetForSymbol('rdn')),
  ofcerc20('aaec773c-bd5b-4262-abd9-a7136c20fc59', 'ofcrdnt', 'Radiant Capital', 18, underlyingAssetForSymbol('rdnt')),
  ofcerc20('81091169-e882-485d-8d49-861691a15b9e', 'ofcreb', 'Regblo', 18, underlyingAssetForSymbol('reb')),
  ofcerc20('9dccbb13-c971-4e64-8319-42535fcc9de4', 'ofcrebl', 'Rebellious', 18, underlyingAssetForSymbol('rebl')),
  ofcerc20('84572a60-87ee-4a70-b0d6-cd5fd7616214', 'ofcren', 'Republic', 18, underlyingAssetForSymbol('ren')),
  ofcerc20('eabd5fbb-b844-4991-9a71-29068a99b178', 'ofcrepv2', 'Augur V2 Token', 18, underlyingAssetForSymbol('repv2')),
  ofcerc20(
    '3836aea4-2019-4b8e-b7fd-1da1571edac2',
    'ofcreth2',
    'StakeWise Reward ETH2',
    18,
    underlyingAssetForSymbol('reth2')
  ),
  ofcerc20('d258ccc1-37c3-4503-a4ab-d817573a6d18', 'ofcrfr', 'Refereum', 4, underlyingAssetForSymbol('rfr')),
  ofcerc20('2696285b-db75-4a6a-a38f-2170ea61125f', 'ofcrfuel', 'RioDeFi', 18, underlyingAssetForSymbol('rfuel')),
  ofcerc20(
    'cd656612-ce29-4452-8c97-4e0995622b48',
    'ofcrgt',
    'Rari Governance Token',
    18,
    underlyingAssetForSymbol('rgt')
  ),
  ofcerc20('235f4026-d56a-4388-b0e8-643e06d5f25b', 'ofcrif', 'RIF Token', 18, underlyingAssetForSymbol('rif')),
  ofcerc20('a808f5a1-fd21-40ef-8be0-ffd1c9c61015', 'ofcringx', 'Ringx Token', 18, underlyingAssetForSymbol('ringx')),
  ofcerc20('07268667-86cc-4ae6-a986-2c39523ad2b8', 'ofcrio', 'Realio Network', 18, underlyingAssetForSymbol('rio')),
  ofcerc20('e6adc9cf-8125-4ff8-b34d-1a412060d88a', 'ofcrlc', 'Iexec Rlc', 9, underlyingAssetForSymbol('rlc')),
  ofcerc20(
    'fd56e938-5f94-4b19-b2c5-f15a2af50595',
    'ofcrlusd',
    'Ripple USD',
    18,
    underlyingAssetForSymbol('rlusd'),
    undefined,
    [CoinFeature.STABLECOIN]
  ),
  ofcerc20('8728409f-5e31-4fb1-a63e-e42a4fdd950a', 'ofcrook', 'KeeperDAO', 18, underlyingAssetForSymbol('rook')),
  ofcerc20('31f7b2ab-a7bc-463f-ac87-930cf8f3e203', 'ofcronc', 'RONCoin', 18, underlyingAssetForSymbol('ronc')),
  ofcerc20('8f5135de-5f0c-4a1c-8158-ccede1d39c30', 'ofcroobee', 'ROOBEE', 18, underlyingAssetForSymbol('roobee')),
  ofcerc20('42552693-c29a-4f4a-9a40-54b698cd77d4', 'ofcrpk', 'RepubliK', 18, underlyingAssetForSymbol('rpk')),
  ofcerc20(
    '255d08aa-fdb7-461c-8e7f-57948d1d2aba',
    'ofcrsweth',
    'Restaked Swell Ethereum',
    18,
    underlyingAssetForSymbol('rsweth')
  ),
  ofcerc20(
    '4811d25e-aa8b-40d0-a106-cd701b37e6b9',
    'ofcrubx',
    'eToro Russian Ruble',
    18,
    underlyingAssetForSymbol('rubx')
  ),
  ofcerc20('d7f60f08-8e15-4487-af08-9b5ab94cb440', 'ofcruedatk', 'Ruedacoin', 6, underlyingAssetForSymbol('ruedatk')),
  ofcerc20('11a90f39-42f4-4ec6-b396-8259c81c1c36', 'ofcsail', 'SAIL Token', 18, underlyingAssetForSymbol('sail')),
  ofcerc20('bd4f37cb-e3d8-4768-a246-1d35d9b8d3d6', 'ofcsalt', 'Salt', 8, underlyingAssetForSymbol('salt')),
  ofcerc20(
    '9cb97296-3daa-48c0-946f-9d6c08eb40e7',
    'ofcseth2',
    'StakeWise Staked ETH2',
    18,
    underlyingAssetForSymbol('seth2')
  ),
  ofcerc20(
    'e03ab8b2-d4ed-4480-ada5-215abd62d745',
    'ofcsashimi',
    'SashimiToken',
    18,
    underlyingAssetForSymbol('sashimi')
  ),
  ofcerc20('8abe87c4-6799-4233-811c-00fe8738c4c3', 'ofcsfi', 'Spice', 18, underlyingAssetForSymbol('sfi')),
  ofcerc20('af62d674-4cfe-489a-be4c-58b42ea959e1', 'ofcsga', 'Saga', 18, underlyingAssetForSymbol('sga')),
  ofcerc20(
    'b67ce598-3473-4760-b04c-4020460eb65c',
    'ofcsgdx',
    'eToro Singapore Dollar',
    18,
    underlyingAssetForSymbol('sgdx')
  ),
  ofcerc20('c063c4e9-4e1b-49b4-8a9e-4e537aebb65d', 'ofcsgr', 'Sogur', 18, underlyingAssetForSymbol('sgr')),
  ofcerc20(
    'a035abb7-f6ff-437e-8d1b-5aae58c08efa',
    'ofcsgt',
    'Suzu Governance Token',
    8,
    underlyingAssetForSymbol('sgt')
  ),
  ofcerc20('b07efb89-d404-4b0b-903f-eeeec4f939b3', 'ofcshk', 'iShook', 18, underlyingAssetForSymbol('shk')),
  ofcerc20(
    'c2ad3467-54ff-4389-908f-02571801c005',
    'ofcshopx',
    'Splyt Core Token',
    18,
    underlyingAssetForSymbol('shopx')
  ),
  ofcerc20('eb697fb6-f266-48b9-956c-c7cbad404b59', 'ofcshr', 'ShareToken', 2, underlyingAssetForSymbol('shr')),
  ofcerc20('51ea2cfb-4fd5-4450-8126-80df51079318', 'ofcsih', 'Sih', 18, underlyingAssetForSymbol('sih')),
  ofcerc20('c4b09ebc-8891-4cde-be18-f623b6c51f53', 'ofcsilv', 'XBullion Silver', 8, underlyingAssetForSymbol('silv')),
  ofcerc20('5d75dc0a-f398-473d-8e8d-fc9423fdb7fa', 'ofcsipher', 'Sipher Token', 18, underlyingAssetForSymbol('sipher')),
  ofcerc20('a437b417-d955-4dc6-b15e-44dbb9da933f', 'ofcskale', 'SKALE Network', 18, underlyingAssetForSymbol('skale')),
  ofcerc20('6a309f51-32ec-4387-a23f-255000a1af20', 'ofcslab', 'SLAB', 18, underlyingAssetForSymbol('slab')),
  ofcerc20('13d80ad2-e777-41ad-b905-82f7e93ba236', 'ofcslot', 'AlphaSlot', 18, underlyingAssetForSymbol('slot')),
  ofcerc20('732478cd-119f-44b0-9378-7e9663715ca9', 'ofcslvx', 'eToro Silver', 18, underlyingAssetForSymbol('slvx')),
  ofcerc20('07181ffb-884e-46a3-ad2b-ade72b67678b', 'ofcsmt', 'Swarm Markets', 18, underlyingAssetForSymbol('smt')),
  ofcerc20('22c6e509-c91f-4513-8475-220ef29e306f', 'ofcsnc', 'SunContract', 18, underlyingAssetForSymbol('snc')),
  ofcerc20('dc0282eb-5fd1-42db-90fc-04f4bbd4dbfc', 'ofcsnov', 'Snovio', 18, underlyingAssetForSymbol('snov')),
  ofcerc20('2937b6c0-9d19-4d7d-b228-3de3072aea2e', 'ofcsoc', 'SODACoin', 18, underlyingAssetForSymbol('soc')),
  ofcerc20('5714d4a6-4ec6-47b5-94e3-07bf979b5789', 'ofcspo', 'Sparrow Options', 18, underlyingAssetForSymbol('spo')),
  ofcerc20('cf99b22b-8389-4ab2-b3c7-acf3627d9d32', 'ofcsolve', 'Solve Token', 8, underlyingAssetForSymbol('solve')),
  ofcerc20('e8aef706-ad2d-4be5-8a4a-95ebcedc6e92', 'ofcsrm', 'Serum', 6, underlyingAssetForSymbol('srm')),
  ofcerc20('9f376a33-a113-4473-99f5-a38f36c64461', 'ofcssv', 'SSV Network', 18, underlyingAssetForSymbol('ssv')),
  ofcerc20('f749a2b5-b700-4f40-9e97-f2b6da6c1d15', 'ofcsrnt', 'Serenity', 18, underlyingAssetForSymbol('srnt')),
  ofcerc20('021addfe-43c3-4e3e-b170-08d033684de1', 'ofcstrong', 'Strong', 18, underlyingAssetForSymbol('strong')),
  ofcerc20('9e0addab-1919-4d3f-a433-fda079523fdc', 'ofcstbu', 'Stobox Token', 18, underlyingAssetForSymbol('stbu')),
  ofcerc20('64ea6c88-89b6-4af8-a082-d141214910e0', 'ofcstc', 'Student Coin', 2, underlyingAssetForSymbol('stc')),
  ofcerc20(
    '02f39f25-45df-431a-8860-031d832f76ea',
    'ofcstcv2',
    'Student Coin V2',
    18,
    underlyingAssetForSymbol('stcv2')
  ),
  ofcerc20(
    '40b38fb3-9795-40ec-8061-0da13b28ab12',
    'ofcstkaave',
    'Staked Aave',
    18,
    underlyingAssetForSymbol('stkaave')
  ),
  ofcerc20('b5078f0f-13a0-422a-b0e7-2e17d3b6e935', 'ofcstore', 'Store', 8, underlyingAssetForSymbol('store')),
  ofcerc20('71cbdcc4-2f1b-4dc6-ad99-9749d1c5edbc', 'ofcstorm', 'Storm', 18, underlyingAssetForSymbol('storm')),
  ofcerc20('b02ee214-497c-4e2c-bcd4-90db2005cf76', 'ofcstpt', 'STPT', 18, underlyingAssetForSymbol('stpt')),
  ofcerc20('8e083ed9-f053-4c1c-9aaa-37cc30656686', 'ofcstzen', 'stakedZEN', 8, underlyingAssetForSymbol('stzen')),
  ofcerc20('9027a8e2-5189-4b93-bd13-e0ae5b8f7cbd', 'ofcsquig', 'Squiggle', 4, underlyingAssetForSymbol('squig')),
  ofcerc20('87d0fbae-6cd1-4c6c-bea3-01b1bb05fe1c', 'ofctaud', 'TrueAUD', 18, underlyingAssetForSymbol('taud')),
  ofcerc20('79274c02-67ca-4274-b7e5-8283ef933c2d', 'ofctbtc1', 'Tbtc1', 18, underlyingAssetForSymbol('tbtc1')),
  ofcerc20('5553bb85-c514-4e7d-8bb3-2edd2195e0fc', 'ofctbtc2', 'Tbtc2', 18, underlyingAssetForSymbol('tbtc2')),
  ofcerc20('379ec9d9-a4b1-4aec-b95d-fd8342cbc427', 'ofctcad', 'TrueCAD', 18, underlyingAssetForSymbol('tcad')),
  ofcerc20('3c178445-68a2-499d-8aac-9278516fae03', 'ofctco', 'Think Coin', 18, underlyingAssetForSymbol('tco')),
  ofcerc20('e8f1a380-5fd3-4cf0-91ca-a3a354d4ff3d', 'ofcten', 'Tokenomy', 18, underlyingAssetForSymbol('ten')),
  ofcerc20('4d6c5a88-c622-4482-8bc3-bba2892dd85e', 'ofctenx', 'TenX Token', 18, underlyingAssetForSymbol('tenx')),
  ofcerc20('d9dbdb3e-2a44-4502-8b3a-43a60d9723e7', 'ofcthkd', 'TrueHKD', 18, underlyingAssetForSymbol('thkd')),
  ofcerc20(
    '3048586e-02ac-409c-b1ad-f5f7bbe60c76',
    'ofcthunder',
    'ETH-Peg Thunder Token',
    18,
    underlyingAssetForSymbol('thunder')
  ),
  ofcerc20('7c1ebee3-e879-4613-86a5-6a9f542bda0e', 'ofctiox', 'Trade Token X', 18, underlyingAssetForSymbol('tiox')),
  ofcerc20('b00af0a4-3d38-4231-b88f-405623647b22', 'ofctknt', 'Tknt', 18, underlyingAssetForSymbol('tknt')),
  ofcerc20('1a159648-8ca0-4bfd-979c-979f9882c2b0', 'ofctko', 'Taiko Token', 18, underlyingAssetForSymbol('tko')),
  ofcerc20('cd30cfdb-df74-47ff-b032-e38456a171f0', 'ofctlab', 'TLAB', 18, underlyingAssetForSymbol('tlab')),
  ofcerc20(
    '76c7f6bd-acdf-4435-876a-a036faef7a36',
    'ofctlm',
    'Alien Worlds Trilium',
    4,
    underlyingAssetForSymbol('tlm')
  ),
  ofcerc20('cab4b113-ac50-46b7-a987-072ef35bcd5a', 'ofctlos', 'pTokens TLOS', 18, underlyingAssetForSymbol('tlos')),
  ofcerc20('de62e920-0e75-4255-8c07-be8eb983ff98', 'ofctnt', 'Tierion', 8, underlyingAssetForSymbol('tnt')),
  ofcerc20('bb8e6cba-220f-4c9f-b6f0-6917e2dcb0ef', 'ofctok', 'Tokenplace', 8, underlyingAssetForSymbol('tok')),
  ofcerc20(
    '0e825a82-ebc6-4f03-936f-edf2c09aea3e',
    'ofctoncoin',
    'Wrapped TON Coin',
    9,
    underlyingAssetForSymbol('toncoin')
  ),
  ofcerc20('9aea30d3-fa87-4831-80c1-09dee2c0a112', 'ofctraxx', 'TokenTrax', 18, underlyingAssetForSymbol('traxx')),
  ofcerc20('1542131e-e86c-47a5-b425-c71d777a73ee', 'ofctrb', 'Tellor', 18, underlyingAssetForSymbol('trb')),
  ofcerc20('de1e5df2-b206-4146-9f8b-fee26d51f49c', 'ofctribl', 'Tribal Finance', 18, underlyingAssetForSymbol('tribl')),
  ofcerc20('1dbb1a1b-2980-43d0-aab5-be1dcc24a504', 'ofctrl', 'Triall Token', 18, underlyingAssetForSymbol('trl')),
  ofcerc20('8ff7bccb-0d19-46d6-9137-21a7bd8c4281', 'ofctroy', 'TROY', 18, underlyingAssetForSymbol('troy')),
  ofcerc20('72508452-eb6f-40c9-b326-662b324071f4', 'ofctrst', 'WeTrust', 6, underlyingAssetForSymbol('trst')),
  ofcerc20('3c0f5c3b-3bac-4cfb-8732-986dbd0636e3', 'ofctru', 'Tru', 8, underlyingAssetForSymbol('tru')),
  ofcerc20('ac7ab00a-3e9f-4338-aa7e-2d477c0ecfb3', 'ofctruf', 'Truflation', 18, underlyingAssetForSymbol('truf')),
  ofcerc20(
    'fb11d6c3-49b2-4b22-8a23-b153b43ac305',
    'ofctrufv2',
    'Truflation (v2)',
    18,
    underlyingAssetForSymbol('trufv2')
  ),
  ofcerc20('afd07a2d-4833-4fef-99b1-e27d70f9f5ae', 'ofctryb', 'Bilira Token', 6, underlyingAssetForSymbol('tryb')),
  ofcerc20(
    '0c9b6d42-dc5f-4d65-83dd-29b8e36a192e',
    'ofctryx',
    'eToro Turkish Lira',
    18,
    underlyingAssetForSymbol('tryx')
  ),
  ofcerc20(
    'c559b7ca-121b-44fc-be68-eba8f81e0c99',
    'ofctst',
    'Teleport System Token',
    18,
    underlyingAssetForSymbol('tst')
  ),
  ofcerc20('c8dc3f1e-c5ea-469d-b90a-24ad6ffc9bad', 'ofctxl', 'Tixl', 18, underlyingAssetForSymbol('txl')),
  ofcerc20(
    'e718022f-3646-49d5-b48b-db48131d174e',
    'ofcuair',
    'Unicorn AIR Security Token',
    0,
    underlyingAssetForSymbol('uair')
  ),
  ofcerc20('e9f9fa6c-899b-4394-b06e-33d857fbbc5a', 'ofcubxt', 'UpBots', 18, underlyingAssetForSymbol('ubxt')),
  ofcerc20('82f9a021-0c10-47d4-8096-c63b948ba663', 'ofcuco', 'UnirisToken', 18, underlyingAssetForSymbol('uco')),
  ofcerc20(
    '127119dd-e4f8-48c5-a094-be883599ac00',
    'ofcuft',
    'UniLend Finance Token',
    18,
    underlyingAssetForSymbol('uft')
  ),
  ofcerc20('77b5490c-a164-4c67-9588-21e50a51906e', 'ofcukg', 'UnikoinGold', 18, underlyingAssetForSymbol('ukg')),
  ofcerc20('04b86e42-ba9b-4575-b2d8-081e0e8f787e', 'ofcumee', 'Umee', 6, underlyingAssetForSymbol('umee')),
  ofcerc20('c7b8491e-27b2-4a43-bfd3-fd99d78c934a', 'ofcunb', 'Unbound Protocol', 18, underlyingAssetForSymbol('unb')),
  ofcerc20('c3460889-b529-470b-a1db-10a186960f48', 'ofcup', 'UpToken', 8, underlyingAssetForSymbol('up')),
  ofcerc20(
    '72e1b2fd-e4e3-4c76-ad23-6435fa68c087',
    'ofcupbtc',
    'Universal Bitcoin',
    8,
    underlyingAssetForSymbol('upbtc')
  ),
  ofcerc20('14fc5da9-af5d-456a-893c-d7faa7395fd1', 'ofcupp', 'Sentinel Protocol', 18, underlyingAssetForSymbol('upp')),
  ofcerc20(
    'a2dd5984-3b5e-471d-9e0c-097dbfe15d1f',
    'ofcupt',
    'Universal Protocol Token',
    18,
    underlyingAssetForSymbol('upt')
  ),
  ofcerc20(
    '2b18fff0-9981-4762-866e-d8be9c6ecc00',
    'ofcupusd',
    'Universal US Dollar',
    2,
    underlyingAssetForSymbol('upusd'),
    undefined,
    [CoinFeature.STABLECOIN]
  ),
  ofcerc20(
    '24415d14-0397-45b7-87c8-1aa680d11b79',
    'ofcurhd',
    'Unicorn Tokenization Robinhood Shares',
    0,
    underlyingAssetForSymbol('urhd')
  ),
  ofcerc20(
    '64167d0d-e8a5-4f2a-9a0b-98632bcd8816',
    'ofcusdx',
    'eToro United States Dollar',
    18,
    underlyingAssetForSymbol('usdx'),
    undefined,
    [CoinFeature.STABLECOIN]
  ),
  ofcerc20('fd6f7e4e-3a5e-4868-91af-399b8e4d76dd', 'ofcusg', 'US Gold', 9, underlyingAssetForSymbol('usg')),
  ofcerc20('7e1bc370-f226-4111-b51b-a3dd8ed54fb7', 'ofcuspx', 'USPX Token', 0, underlyingAssetForSymbol('uspx')),
  ofcerc20(
    'd5b18be0-8263-4729-84fe-57501c848e29',
    'ofcust',
    'TerraUSD',
    18,
    underlyingAssetForSymbol('ust'),
    undefined,
    [CoinFeature.STABLECOIN]
  ),
  ofcerc20(
    'f55ca795-c8ed-4e8f-b137-bf74b5868503',
    'ofcusx',
    'USD Stable Token',
    18,
    underlyingAssetForSymbol('usx'),
    undefined,
    [CoinFeature.STABLECOIN]
  ),
  ofcerc20('e0142e63-a344-49df-a671-bca12013d88c', 'ofcusyc', 'US Yield Coin', 6, underlyingAssetForSymbol('usyc')),
  ofcerc20('c7f9e986-8eb8-445f-b2d2-b029428024c5', 'ofcutk', 'UTrust', 18, underlyingAssetForSymbol('utk')),
  ofcerc20('59815a51-0298-43bf-9e7c-8aa58ba4d725', 'ofcutk1', 'UTrust Token', 18, underlyingAssetForSymbol('utk1')),
  ofcerc20('2291a3a1-5dff-4009-9315-f1ba8ae55c8e', 'ofcvcore', 'VCORE', 18, underlyingAssetForSymbol('vcore')),
  ofcerc20('6a6e8f2b-4656-4ec8-9ebb-2b11c5cc065a', 'ofcvalor', 'ValorToken', 18, underlyingAssetForSymbol('valor')),
  ofcerc20(
    'bdf9f83a-a062-46ef-9a7e-fcc595b9840e',
    'ofcvanry',
    'Vanar Chain Token',
    18,
    underlyingAssetForSymbol('vanry')
  ),
  ofcerc20('fa37f138-e9c7-480a-8fe6-97f1fdee3c37', 'ofcvdx', 'Vodi X', 18, underlyingAssetForSymbol('vdx')),
  ofcerc20('3f539d23-cb30-46f7-9e4a-43abd107473b', 'ofcvec', 'Vector', 9, underlyingAssetForSymbol('vec')),
  ofcerc20('5ba751a3-23c1-47d7-a8c1-0f5a94866fc8', 'ofcvega', 'Vega Protocol', 18, underlyingAssetForSymbol('vega')),
  ofcerc20('29122cf0-be81-407c-87bc-8b323928cb22', 'ofcvext', 'Veloce', 18, underlyingAssetForSymbol('vext')),
  ofcerc20('9e95f66e-9cc8-4f0e-9e7b-efd9d16e3ea9', 'ofcvgx', 'Voyager Token', 8, underlyingAssetForSymbol('vgx')),
  ofcerc20('ff6abefd-3d65-46e8-b9e7-68041f528aaa', 'ofcvib', 'VIB', 18, underlyingAssetForSymbol('vib')),
  ofcerc20('f287d703-f0a1-436b-a273-324937cf78ba', 'ofcvic', 'Viction', 18, underlyingAssetForSymbol('vic')),
  ofcerc20('89cc6c4a-f33a-4c49-bf14-68d324f105e1', 'ofcvidt', 'VIDT DAO', 18, underlyingAssetForSymbol('vidt')),
  ofcerc20('e38da79f-1e7c-441b-a6ff-08a489230a02', 'ofcvisr', 'Visor.Finance', 18, underlyingAssetForSymbol('visr')),
  ofcerc20('a74faf6f-8639-4b4b-860d-37116b1b7db6', 'ofcvrgx', 'VroomGo', 8, underlyingAssetForSymbol('vrgx')),
  ofcerc20('bc97ec5a-cdba-48aa-a76b-911830a39ab1', 'ofcvrtx', 'Vertex Protocol', 18, underlyingAssetForSymbol('vrtx')),
  ofcerc20('6a8cef77-6375-4dfa-aba9-9ef10c1cc98f', 'ofcvxc', 'Vinx Coin', 18, underlyingAssetForSymbol('vxc')),
  ofcerc20('7a7813eb-7b28-4942-bf8d-1075c2b9b3b1', 'ofcvsp', 'Vesper Token', 18, underlyingAssetForSymbol('vsp')),
  ofcerc20('bd372f7d-04a1-44ee-b52b-3abef056d439', 'ofcwafl', 'Wafl Token', 18, underlyingAssetForSymbol('wafl')),
  ofcerc20('598eee5a-d3ce-4196-aa7f-6637da58a22a', 'ofcwax', 'Wax', 8, underlyingAssetForSymbol('wax')),
  ofcerc20('d3688a11-e089-4304-838c-187add59ab14', 'ofcwabi', 'Tael Token', 18, underlyingAssetForSymbol('wabi')),
  ofcerc20('803d6e89-510f-4cca-b501-135fd4494574', 'ofcwaves', 'WAVES', 18, underlyingAssetForSymbol('waves')),
  ofcerc20('3338c016-91bc-494a-ab32-152ed5198e1b', 'ofcwtk', 'WadzPay Token', 18, underlyingAssetForSymbol('wtk')),
  ofcerc20('363db052-19c5-4d6c-95bf-c3ef0eee2ee0', 'ofcwbnb', 'Wrapped BNB', 18, underlyingAssetForSymbol('wbnb')),
  ofcerc20('15f874d0-6d1d-471d-9a43-f1a899c28d20', 'ofcwecan', 'Wecan Group', 18, underlyingAssetForSymbol('wecan')),
  ofcerc20('614455ea-8188-4060-a422-0e5d48cec391', 'ofcwdoge', 'Wrapped DOGE', 8, underlyingAssetForSymbol('wdoge')),
  ofcerc20(
    '0d1b2c19-140b-4d5c-876d-985641b35665',
    'ofcwcfg',
    'Wrapped Centrifuge',
    18,
    underlyingAssetForSymbol('wcfg')
  ),
  ofcerc20('616d4bcf-1b88-4da0-a810-ddb8ec0f5c40', 'ofcwec', 'Whole Earth Coin ', 18, underlyingAssetForSymbol('wec')),
  ofcerc20('18fcc015-544d-4d6a-967f-0f97796e82ec', 'ofcwet', 'We Show Token', 18, underlyingAssetForSymbol('wet')),
  ofcerc20('ac9dbbca-a180-48f1-9c01-afc5446bd7f0', 'ofcweeth', 'Wrapped eETH', 18, underlyingAssetForSymbol('weeth')),
  ofcerc20('4bf68602-cbba-41a8-bdbc-6db4fc1b66a6', 'ofcwflow', 'Wrapped Flow', 18, underlyingAssetForSymbol('wflow')),
  ofcerc20('6f31d5d3-8707-4262-b46d-aeafce299053', 'ofcwhale', 'WHALE', 4, underlyingAssetForSymbol('whale')),
  ofcerc20('a26f71d5-1c28-4b5d-adc0-a1f18fdea0f6', 'ofcwht', 'Whatshalal', 18, underlyingAssetForSymbol('wht')),
  ofcerc20('bc77ca4c-d207-48a9-9910-2f82a616b7d6', 'ofcwing', 'Wing Finance', 9, underlyingAssetForSymbol('wing')),
  ofcerc20('1794e700-4c78-4f84-a421-dc0efe2b8505', 'ofcwnxm', 'Wrapped NXM', 18, underlyingAssetForSymbol('wnxm')),
  ofcerc20('46605bd9-b8ec-43ef-ba20-d4637cf87081', 'ofcwluna', 'Wrapped Luna', 18, underlyingAssetForSymbol('wluna')),
  ofcerc20('c07fbda0-c47e-4311-a918-e58450569e32', 'ofcwlxt', 'Wallex Token', 18, underlyingAssetForSymbol('wlxt')),
  ofcerc20(
    '89bcb9b8-5f24-404a-8172-361af081f786',
    'ofcwrose',
    'Wrapped ROSE (Wormhole)',
    18,
    underlyingAssetForSymbol('wrose')
  ),
  ofcerc20('f770ed88-ae62-4af2-a995-ed11ee078e7b', 'ofcwpx', 'WalletPlusX', 18, underlyingAssetForSymbol('wpx')),
  ofcerc20('adee2169-99da-4092-aa07-04090b2dbb83', 'ofcwtao', 'Wrapped BitTensor', 9, underlyingAssetForSymbol('wtao')),
  ofcerc20('04446d12-fae2-4312-81f4-b3ada702bd04', 'ofcwtc', 'Walton Token', 18, underlyingAssetForSymbol('wtc')),
  ofcerc20(
    '11fcfe02-bb25-4900-9600-6749dffb1f60',
    'ofcwtgxx',
    'WisdomTree Government Money Market Digital Fund',
    18,
    underlyingAssetForSymbol('wtgxx')
  ),
  ofcerc20(
    'b0206d79-8113-4d3a-a72f-0a50117aa628',
    'ofcwusdm',
    'Wrapped Mountain USD',
    18,
    underlyingAssetForSymbol('wusdm')
  ),
  ofcerc20('1dfdd971-82b3-42c9-a552-219a81d8ea8b', 'ofcwxrpv0', 'Wrapped XRP', 6, underlyingAssetForSymbol('wxrpv0')),
  ofcerc20('8b4910cd-ea72-498d-88f9-f1859f818d24', 'ofcwxrp', 'Wrapped XRP', 18, underlyingAssetForSymbol('wxrp')),
  ofcerc20('2c6403f7-098d-40f8-8643-928597974c29', 'ofcxaud', 'XAUD Token', 5, underlyingAssetForSymbol('xaud')),
  ofcerc20(
    '9b700833-b6eb-4d7f-9b78-2a79783a8c7c',
    'ofcxbgold',
    'XBullion Token',
    8,
    underlyingAssetForSymbol('xbgold')
  ),
  ofcerc20('c0813fc1-8921-4746-ac1d-460cdaad4529', 'ofcxcd', 'CapdaxToken', 18, underlyingAssetForSymbol('xcd')),
  ofcerc20('84640b02-7ee6-4015-85f6-2439b9e1401e', 'ofcxchng', 'Chainge', 18, underlyingAssetForSymbol('xchng')),
  ofcerc20(
    'f6daf404-8e26-49bd-aca1-fd7a1c8aff6e',
    'ofcxex',
    'Cross Exchange Token',
    18,
    underlyingAssetForSymbol('xex')
  ),
  ofcerc20('5e76958b-e2d0-4016-adb7-edb4760e1e06', 'ofcxrl', 'Rialto', 9, underlyingAssetForSymbol('xrl')),
  ofcerc20('178dd1b9-5c3e-4f86-8997-1ad19cabc41b', 'ofcxtp', 'Tap', 18, underlyingAssetForSymbol('xtp')),
  ofcerc20('ecabb76e-d990-4ce4-bc19-d6261f47fa34', 'ofcyfdai', 'Yfdai.Finance', 18, underlyingAssetForSymbol('yfdai')),
  ofcerc20('56949b83-235e-4791-a9e6-524e0187c777', 'ofcyfii', 'YFII.Finance', 18, underlyingAssetForSymbol('yfii')),
  ofcerc20('7ddee7dc-e6ad-45d6-bdd7-194394c389ff', 'ofcyld', 'Yld', 18, underlyingAssetForSymbol('yld')),
  ofcerc20('7aeba7c3-4a3f-44d4-9b5e-a329869a892f', 'ofcyng', 'Young Token', 18, underlyingAssetForSymbol('yng')),
  ofcerc20(
    '2bea9868-d2fb-4dab-b072-302f63964bc4',
    'ofcysey',
    'YSEY Utility Token',
    3,
    underlyingAssetForSymbol('ysey')
  ),
  ofcerc20(
    '9ece8154-166e-482e-8bb2-47eb5af48bb9',
    'ofczarx',
    'eToro South African Rand',
    18,
    underlyingAssetForSymbol('zarx')
  ),
  ofcerc20('04888613-b8e8-4b41-a274-4795eb7b6ce2', 'ofczbu', 'ZEEBU', 18, underlyingAssetForSymbol('zbu')),
  ofcerc20('8892c6d4-dcd8-4087-abb7-24790f69583e', 'ofczco', 'Zebi Coin', 8, underlyingAssetForSymbol('zco')),
  ofcerc20('f959717e-8626-4ca4-8c03-6ee0ad6bb364', 'ofczix', 'Zeex Token', 18, underlyingAssetForSymbol('zix')),
  ofcerc20('6ed057ff-a065-444a-931e-f0ff2ecaeac6', 'ofczkl', 'ZKLink', 18, underlyingAssetForSymbol('zkl')),
  ofcerc20('a528f520-dc66-4154-a368-904c9914ff3f', 'ofczlw', 'Zelwin', 18, underlyingAssetForSymbol('zlw')),
  ofcerc20('e669308b-14c0-4c3e-8c3a-4e12ac9701cf', 'ofczmt', 'Zipmex Token', 18, underlyingAssetForSymbol('zmt')),
  ofcerc20('d1ef8829-7f82-4697-8f5e-4430e1c3c851', 'ofczoom', 'CoinZoom', 18, underlyingAssetForSymbol('zoom')),
  ofcerc20(
    '41930258-22df-4edb-80db-912b097c92ec',
    'ofczusd',
    'Z.com Usd',
    6,
    underlyingAssetForSymbol('zusd'),
    undefined,
    [CoinFeature.STABLECOIN]
  ),
  ofcerc20(
    '5246d956-3dfb-4de2-a5e4-f5d683c451ab',
    'ofcadabear',
    '3X Short Cardano Token',
    18,
    underlyingAssetForSymbol('adabear')
  ),
  ofcerc20(
    'b7f28fc4-68dd-44f5-a9df-98285cd98dba',
    'ofcadabull',
    '3X Long Cardano Token',
    18,
    underlyingAssetForSymbol('adabull')
  ),
  ofcerc20(
    '118308e2-df1c-4f11-92cb-71e552c010ff',
    'ofcalgobear',
    '3X Short Algorand Token',
    18,
    underlyingAssetForSymbol('algobear')
  ),
  ofcerc20(
    'a47bf413-921b-4c39-ace1-7699efe23812',
    'ofcalgobull',
    '3X Long Algorand Token',
    18,
    underlyingAssetForSymbol('algobull')
  ),
  ofcerc20(
    'a1215b18-643d-4bc2-affa-f948ab96de05',
    'ofcalgohedge',
    '1X Short Algorand Token',
    18,
    underlyingAssetForSymbol('algohedge')
  ),
  ofcerc20(
    '7b653610-f239-44d3-862f-01667fc9a791',
    'ofcaltbear',
    '3X Short Altcoin Index Token',
    18,
    underlyingAssetForSymbol('altbear')
  ),
  ofcerc20(
    'c1485ecf-8cbe-48cb-875b-b7c21013ad70',
    'ofcalthedge',
    '1X Short Altcoin Index Token',
    18,
    underlyingAssetForSymbol('althedge')
  ),
  ofcerc20('b8bd240f-cd53-4a43-a59c-7d0c7b56fd3e', 'ofcasd', 'AscendEX token', 18, underlyingAssetForSymbol('asd')),
  ofcerc20(
    'e3de348e-16a3-434b-a7f5-1a15cb7a5cdb',
    'ofcatombear',
    '3X Short Cosmos Token',
    18,
    underlyingAssetForSymbol('atombear')
  ),
  ofcerc20(
    '1f13cd60-9625-4abc-af2a-37a563c32f23',
    'ofcatombull',
    '3X Long Cosmos Token',
    18,
    underlyingAssetForSymbol('atombull')
  ),
  ofcerc20(
    '827b42c5-7409-4438-9e7e-213abba39978',
    'ofcbchbear',
    '3X Short Bitcoin Cash Token',
    18,
    underlyingAssetForSymbol('bchbear')
  ),
  ofcerc20(
    '8d5d75b3-a6b6-41e4-b5f0-4de84720589a',
    'ofcbchbull',
    '3X Long Bitcoin Cash Token',
    18,
    underlyingAssetForSymbol('bchbull')
  ),
  ofcerc20(
    'a46b8b9c-156b-4a42-895a-53878384370f',
    'ofcbchhedge',
    '1X Short Bitcoin Cash Token',
    18,
    underlyingAssetForSymbol('bchhedge')
  ),
  ofcerc20(
    'b3465abb-51db-4d6c-999d-9a8a227c7432',
    'ofcbear',
    '3X Short Bitcoin Token',
    18,
    underlyingAssetForSymbol('bear')
  ),
  ofcerc20(
    '88f19f23-1b6f-4986-9991-be44997940c1',
    'ofcbnbbear',
    '3X Short BNB Token',
    18,
    underlyingAssetForSymbol('bnbbear')
  ),
  ofcerc20(
    'b4ef7e18-2c41-4558-8f5d-035f72c06df1',
    'ofcbnbbull',
    '3X Long BNB Token',
    18,
    underlyingAssetForSymbol('bnbbull')
  ),
  ofcerc20(
    '42a11724-d052-4413-93cf-63533a81b975',
    'ofcbnbhedge',
    '1X Short BNB Token',
    18,
    underlyingAssetForSymbol('bnbhedge')
  ),
  ofcerc20(
    '40adcad7-8b67-45d1-a7a0-0a46a00b7bc0',
    'ofcbsvbear',
    '3X Short Bitcoin SV Token',
    18,
    underlyingAssetForSymbol('bsvbear')
  ),
  ofcerc20(
    '755117a4-6715-4a98-a6ad-4ba406be30e4',
    'ofcbsvbull',
    '3X Long Bitcoin SV Token',
    18,
    underlyingAssetForSymbol('bsvbull')
  ),
  ofcerc20(
    '248ffe68-acf9-4263-814b-d18e0eb08a51',
    'ofcbsvhedge',
    '1X Short Bitcoin SV Token',
    18,
    underlyingAssetForSymbol('bsvhedge')
  ),
  ofcerc20(
    '5d187437-9b2c-44f9-a11c-8817c73abebb',
    'ofcbtmxbear',
    '3X Short BitMax Token Token',
    18,
    underlyingAssetForSymbol('btmxbear')
  ),
  ofcerc20(
    '59db6c39-0f40-4990-83c6-1d8fa043d80d',
    'ofcbvol',
    'Bitcoin Volatility Token',
    18,
    underlyingAssetForSymbol('bvol')
  ),
  ofcerc20(
    'b42e553f-3d64-4c42-806b-73057778cdca',
    'ofcdogebear',
    '3X Short Dogecoin Token',
    18,
    underlyingAssetForSymbol('dogebear')
  ),
  ofcerc20(
    'f19be6f1-2bde-4245-8c7a-5e7b06142962',
    'ofcdogebull',
    '3X Long Dogecoin Token',
    18,
    underlyingAssetForSymbol('dogebull')
  ),
  ofcerc20('499d9972-3f3e-4355-b62d-985fb2c7f939', 'ofcdram', 'DRAM', 18, underlyingAssetForSymbol('dram')),
  ofcerc20(
    '946f2cd3-e188-4a2c-919e-816b4a880746',
    'ofcdrgnbear',
    '3X Short Dragon Index Token',
    18,
    underlyingAssetForSymbol('drgnbear')
  ),
  ofcerc20(
    '980a995a-0393-4c68-9b25-5ef2870c10b6',
    'ofcdrgnbull',
    '3X Long Dragon Index Token',
    18,
    underlyingAssetForSymbol('drgnbull')
  ),
  ofcerc20(
    '06c266d3-de33-438d-a9c5-b610b4a1de7d',
    'ofceth:block',
    'Block Protocol',
    18,
    underlyingAssetForSymbol('eth:block')
  ),
  ofcerc20(
    '3ffe3b72-6493-4d63-b483-19ff7a59ca53',
    'ofceth:dragonx',
    'DragonX',
    18,
    underlyingAssetForSymbol('eth:dragonx')
  ),
  ofcerc20('bdb004b5-4ec7-479e-905b-ee34bc8f6bea', 'ofceth:usual', 'Usual', 18, underlyingAssetForSymbol('eth:usual')),
  ofcerc20(
    '03fc7083-15c1-4a9f-9029-5b5342f2f11e',
    'ofceth:uco',
    'Archethic Universal Coin',
    8,
    underlyingAssetForSymbol('eth:uco')
  ),
  ofcerc20(
    '593ae9a1-ab69-423a-b9a2-1980a0c50f97',
    'ofceth:bito',
    'BitoPro Coin',
    18,
    underlyingAssetForSymbol('eth:bito')
  ),
  ofcerc20('29a9b457-bead-43db-86e4-2ae58ac9c9bb', 'ofceth:ultra', 'Ultra', 6, underlyingAssetForSymbol('eth:ultra')),
  ofcerc20(
    '80ea04b1-fc40-4938-bd88-322abad68a98',
    'ofceosbear',
    '3X Short EOS Token',
    18,
    underlyingAssetForSymbol('eosbear')
  ),
  ofcerc20(
    '3bcafe53-72b8-4ef2-a4f7-67ec2e752947',
    'ofceosbull',
    '3X Long EOS Token',
    18,
    underlyingAssetForSymbol('eosbull')
  ),
  ofcerc20(
    '9658ce33-7bd0-47b0-aff0-ffed61a74145',
    'ofceoshedge',
    '1X Short EOS Token',
    18,
    underlyingAssetForSymbol('eoshedge')
  ),
  ofcerc20(
    '6bad0ee5-c484-4258-b21f-5d3eae9915ba',
    'ofcetcbear',
    '3X Short Ethereum Classic Token',
    18,
    underlyingAssetForSymbol('etcbear')
  ),
  ofcerc20(
    '6859568c-20a4-4da3-b30a-ec90173e2a44',
    'ofcetcbull',
    '3X Long Ethereum Classic Token',
    18,
    underlyingAssetForSymbol('etcbull')
  ),
  ofcerc20(
    '353f2c2d-f8e9-40b0-be8f-3374a2ee740c',
    'ofcethbear',
    '3X Short Ethereum Token',
    18,
    underlyingAssetForSymbol('ethbear')
  ),
  ofcerc20(
    'd4edd7d8-749b-4f1a-8ba2-c4d125ecad27',
    'ofcethhedge',
    '1X Short Ethereum Token',
    18,
    underlyingAssetForSymbol('ethhedge')
  ),
  ofcerc20(
    '3d6d4ccd-ffe3-4744-84e0-4d79aca6b431',
    'ofchedge',
    '1X Short Bitcoin Token',
    18,
    underlyingAssetForSymbol('hedge')
  ),
  ofcerc20(
    'd8cc2ee1-3f93-4794-ac95-f037cdf8c738',
    'ofchtbull',
    '3X Long Huobi Token Token',
    18,
    underlyingAssetForSymbol('htbull')
  ),
  ofcerc20(
    '34af91bc-61f5-499a-9c1c-d9109c445de1',
    'ofcibvol',
    'Inverse Bitcoin Volatility Token',
    18,
    underlyingAssetForSymbol('ibvol')
  ),
  ofcerc20(
    'fdca8e6e-8aeb-4a92-862c-a4a435439c99',
    'ofclinkbear',
    '3X Short Chainlink Token',
    18,
    underlyingAssetForSymbol('linkbear')
  ),
  ofcerc20(
    'f46fcb60-7b30-4db1-867d-c63e9881e1b9',
    'ofclinkbull',
    '3X Long Chainlink Token',
    18,
    underlyingAssetForSymbol('linkbull')
  ),
  ofcerc20('4a83402c-0861-4c48-bc8b-876a8ef84332', 'ofclowb', 'loser coin', 18, underlyingAssetForSymbol('lowb')),
  ofcerc20(
    'e9efb231-f41b-4c9c-a00e-00e959861ad2',
    'ofcltcbear',
    '3X Short Litecoin Token',
    18,
    underlyingAssetForSymbol('ltcbear')
  ),
  ofcerc20(
    'f010cee9-f591-4aaf-95a9-9f1df286bc43',
    'ofcmaticbear',
    '3X Short Matic Token',
    18,
    underlyingAssetForSymbol('maticbear')
  ),
  ofcerc20(
    'c6568b05-2f30-4773-a556-9925559f78fc',
    'ofcmaticbull',
    '3X Long Matic Token',
    18,
    underlyingAssetForSymbol('maticbull')
  ),
  ofcerc20(
    '653d5e25-3b21-405f-9402-e60dc890605f',
    'ofcokbbull',
    '3X Long OKB Token',
    18,
    underlyingAssetForSymbol('okbbull')
  ),
  ofcerc20('9d9a0656-15ab-4f8b-9b46-86e5ce49eec0', 'ofcptu', 'Pintu Token', 18, underlyingAssetForSymbol('ptu')),
  ofcerc20('e88792dc-47ad-4afb-9114-cd2968c7c81c', 'ofcsos', 'SOS', 18, underlyingAssetForSymbol('sos')),
  ofcerc20(
    '90429a33-02a0-4902-ac95-79f5dbac0174',
    'ofctomobear',
    '3X Short TomoChain Token',
    18,
    underlyingAssetForSymbol('tomobear')
  ),
  ofcerc20(
    '21715b3e-c1b0-4cfc-81c1-f67f2d2a0fca',
    'ofctomobull',
    '3X Long TomoChain Token',
    18,
    underlyingAssetForSymbol('tomobull')
  ),
  ofcerc20(
    '271815b0-57ad-4b5d-a9d3-319b06c6b148',
    'ofctrxbear',
    '3X Short TRX Token',
    18,
    underlyingAssetForSymbol('trxbear')
  ),
  ofcerc20(
    '7835c3bd-95d4-4aa3-ad9b-1dde140cd9ba',
    'ofctrxbull',
    '3X Long TRX Token',
    18,
    underlyingAssetForSymbol('trxbull')
  ),
  ofcerc20(
    '21d4f559-8c8a-480c-bdd4-ac7eac3c3ab9',
    'ofctrxhedge',
    '1X Short TRX Token',
    18,
    underlyingAssetForSymbol('trxhedge')
  ),
  ofcerc20(
    '46387ca7-8a96-46e9-89fe-70c21f67e5bf',
    'ofcxautbear',
    '3X Short Tether Gold Token',
    18,
    underlyingAssetForSymbol('xautbear')
  ),
  ofcerc20(
    '6a5e41e2-68f1-4426-b152-4f60cb084287',
    'ofcxautbull',
    '3X Long Tether Gold Token',
    18,
    underlyingAssetForSymbol('xautbull')
  ),
  ofcerc20(
    'e607980b-00f9-45a1-b01d-d85bd8d22769',
    'ofcxlmbear',
    '3X Short Stellar Token',
    18,
    underlyingAssetForSymbol('xlmbear')
  ),
  ofcerc20(
    'c0fc1437-7d5b-436b-b61b-2e796bb1bee4',
    'ofcxlmbull',
    '3X Long Stellar Token',
    18,
    underlyingAssetForSymbol('xlmbull')
  ),
  ofcerc20(
    '4cecb06b-507e-4faf-afc3-346f3258a428',
    'ofcxrpbear',
    '3X Short XRP Token',
    18,
    underlyingAssetForSymbol('xrpbear')
  ),
  ofcerc20(
    '6ebae74d-7081-4445-945e-a134067fdd68',
    'ofcxrpbull',
    '3X Long XRP Token',
    18,
    underlyingAssetForSymbol('xrpbull')
  ),
  ofcerc20(
    'cc19efd0-8bc6-4efa-8b97-cf1073d3c1b5',
    'ofcxrphedge',
    '1X Short XRP Token',
    18,
    underlyingAssetForSymbol('xrphedge')
  ),
  ofcerc20(
    '5f60d431-d48e-4ad9-8ab7-b89ae36d91c3',
    'ofcxtzbear',
    '3X Short Tezos Token',
    18,
    underlyingAssetForSymbol('xtzbear')
  ),
  ofcerc20(
    'a32b8b2e-965c-418c-bfad-e461aec5346d',
    'ofcxtzbull',
    '3X Long Tezos Token',
    18,
    underlyingAssetForSymbol('xtzbull')
  ),
  ofcerc20('0844dddc-d125-460d-b23b-e098d7d4ed98', 'ofcxusd', 'XUSD', 6, underlyingAssetForSymbol('xusd'), undefined, [
    CoinFeature.STABLECOIN,
  ]),
  ofcerc20('22e95bde-0569-4cc0-991d-275fa548e792', 'ofcxvs', 'Venus XVS', 18, underlyingAssetForSymbol('xvs')),
  ofcerc20('522523cd-0716-4a10-a785-06d424286bed', 'ofcxzk', 'Mystiko Token', 18, underlyingAssetForSymbol('xzk')),
  ofcerc20(
    '1fb6c586-3b97-4570-b3e9-48546dc10be6',
    'ofczecbear',
    '3X Short Zcash Token',
    18,
    underlyingAssetForSymbol('zecbear')
  ),
  ofcerc20(
    '85f446a4-af2f-4614-9cc6-9e917977d49a',
    'ofczecbull',
    '3X Long Zcash Token',
    18,
    underlyingAssetForSymbol('zecbull')
  ),
  ofcerc20(
    'd55a47fe-364e-45d4-a759-d0b2c4294d62',
    'ofczetaevm',
    'Zeta (ERC20)',
    18,
    underlyingAssetForSymbol('zetaevm')
  ),
  ofcerc20('4fb1262d-ae7e-4348-b1ae-53eb8a7f5dbe', 'ofccow', 'CoW Protocol Token', 18, underlyingAssetForSymbol('cow')),
  ofcerc20('be43e360-e946-43ff-9b7a-a7d2f524146e', 'ofccpool', 'Clearpool', 18, underlyingAssetForSymbol('cpool')),
  ofcerc20('74fbfefb-c542-4c1e-bc09-ce26d72176e4', 'ofcinv', 'Inverse DAO', 18, underlyingAssetForSymbol('inv')),
  ofcerc20(
    '24dfabb9-7544-4e6c-b856-53a3d261f376',
    'ofcmatter',
    'Antimatter.Finance Governance Token',
    18,
    underlyingAssetForSymbol('matter')
  ),
  ofcerc20('4780ed58-0b21-4cd8-8c68-84b1d8dca83b', 'ofcmav', 'Maverick Token', 18, underlyingAssetForSymbol('mav')),
  ofcerc20('635c75f9-9c8d-402a-98c3-b71271f5bb29', 'ofcmetis', 'Metis Token', 18, underlyingAssetForSymbol('metis')),
  ofcerc20(
    '5e4fc04d-f0af-46ad-aa26-b214d469555e',
    'ofcmim',
    'Magic Internet Money',
    18,
    underlyingAssetForSymbol('mim')
  ),
  ofcerc20('a5ca3a15-c832-4b37-9f35-e0060fc2df2e', 'ofcsteth', 'stETH', 18, underlyingAssetForSymbol('steth')),
  ofcerc20(
    '204aa3b7-8281-44ac-a239-7a6293b934fa',
    'ofcsynth-susd',
    'Synth sUSD',
    18,
    underlyingAssetForSymbol('synth-susd'),
    undefined,
    [CoinFeature.STABLECOIN]
  ),
  ofcerc20('2c14c22a-cdc9-4f5e-b6a4-6201f4fc48d9', 'ofcsusde', 'Staked USDe', 18, underlyingAssetForSymbol('susde')),
  ofcerc20('39a6d9e6-9f64-4c66-b6d2-22c4982cb488', 'ofcswag', 'Swag Token', 18, underlyingAssetForSymbol('swag')),
  ofcerc20('14236918-1dd1-4597-9bc7-2e819c859cc8', 'ofcswap', 'TrustSwap Token', 18, underlyingAssetForSymbol('SWAP')),
  ofcerc20('4296793d-bb5a-4156-8fa3-de065d2b3d94', 'ofcuos', 'Ultra Token', 4, underlyingAssetForSymbol('uos')),
  ofcerc20('53c43c96-4622-4459-91df-1e80bea7ba7d', 'ofcxcn', 'Onyxcoin', 18, underlyingAssetForSymbol('xcn')),
  ofcerc20('94f3e140-6652-4c4a-8b18-b8e56a28258c', 'ofcxdefi', 'XDEFI', 18, underlyingAssetForSymbol('xdefi')),
  ofcerc20('db12970d-9be6-4399-9657-705a984661a6', 'ofcgate', 'GATENet', 18, underlyingAssetForSymbol('gate')),
  ofcerc20('7949daf7-305c-47bd-9e08-f85a4972b002', 'ofclcx', 'LCX', 18, underlyingAssetForSymbol('lcx')),
  ofcerc20('a2872b71-b5d1-4ac9-bcaa-5a0c18062b44', 'ofcrfox', 'RFOX', 18, underlyingAssetForSymbol('rfox')),
  ofcerc20('8dfdb813-b1e7-4975-9b14-a862906563b5', 'ofcswise', 'StakeWise', 18, underlyingAssetForSymbol('swise')),
  ofcerc20('c8224deb-4439-4fa1-8472-bb84c9852736', 'ofcdamm', 'dAMM', 18, underlyingAssetForSymbol('damm')),
  ofcerc20('8303eadb-7732-4b60-9c5e-2699aed58111', 'ofccere', 'CERE Network', 10, underlyingAssetForSymbol('cere')),
  ofcerc20(
    '06365fb8-6b98-4388-9f9d-84df93bf8234',
    'ofcdpx',
    'Dopex Governance Token',
    18,
    underlyingAssetForSymbol('dpx')
  ),
  ofcerc20('6039533d-152a-4ae1-8408-50397e35f638', 'ofcyfl', 'YFLink', 18, underlyingAssetForSymbol('yfl')),
  ofcerc20('8e0876a0-5edb-4985-80d2-eab09d91d790', 'ofchft', 'Hashflow', 18, underlyingAssetForSymbol('hft')),
  ofcerc20(
    'd3eece51-f4ab-471b-838a-cb5ccd3be112',
    'ofcalk',
    'Alkemi_Network_DAO_Tokenhflow',
    18,
    underlyingAssetForSymbol('alk')
  ),
  ofcerc20('f0fcb47a-57df-40fc-b12d-97a6b4f5c92b', 'ofcfox', 'FOX', 18, underlyingAssetForSymbol('fox')),
  ofcerc20('656b5c53-33e4-4e23-81f2-639e348e114b', 'ofccube', 'CUBE', 18, underlyingAssetForSymbol('cube')),
  ofcerc20('33fb3e94-ca61-447d-87a1-f606982f5c5a', 'ofcxx', 'XX', 8, underlyingAssetForSymbol('xx')),
  ofcerc20('1851e4ac-167c-4d87-97f6-460d720b8172', 'ofclitv2', 'LIT', 18, underlyingAssetForSymbol('litv2')),
  ofcerc20(
    '231650ab-f6ad-4ee3-8044-d4846c0c792c',
    'ofcmediav2',
    'Media Network Token',
    6,
    underlyingAssetForSymbol('mediav2')
  ),
  ofcerc20('db20f471-cf6d-4eae-8a89-a909b87902bc', 'ofcblur0xb93', 'BLUR', 18, underlyingAssetForSymbol('blur0xb93')),
  ofcerc20('5a52abec-85b9-4c99-ab0d-2e1f707cf4c8', 'ofcft', 'FriendTech', 8, underlyingAssetForSymbol('ft')),
  ofcerc20('d459f96e-9e88-4686-b395-521e239968af', 'ofcgf', 'GuildFi Token', 18, underlyingAssetForSymbol('gf')),
  ofcerc20('7c96e702-a5c4-4871-a399-4b40e8b551aa', 'ofclqty', 'LQTY', 18, underlyingAssetForSymbol('lqty')),
  ofcerc20(
    'af2406b0-2fef-42b2-a5f8-2360a574c2b8',
    'ofcevmosia',
    'Evmosia.com',
    0,
    underlyingAssetForSymbol('$evmosia.com')
  ),
  ofcerc20('3a30bf45-3550-47dd-8512-0407484da501', 'ofc0xreview', '0xREVIEW', 9, underlyingAssetForSymbol('0xreview')),
  ofcerc20(
    '86f0ea16-69fc-4417-addc-73fd65c22147',
    'ofc3crv',
    'Curve.fi DAI/USDC/USDT',
    18,
    underlyingAssetForSymbol('3crv')
  ),
  ofcerc20('db8759b9-8ba1-4b47-91ea-c3919707e42f', 'ofcacev2', 'ACE', 0, underlyingAssetForSymbol('acev2')),
  ofcerc20('db4dfde5-d3f7-4deb-9b70-72aaeb8ce02b', 'ofcageur', 'agEUR', 18, underlyingAssetForSymbol('ageur')),
  ofcerc20('78bd5573-a13b-4dc9-8b06-a8d49c365a10', 'ofcald', 'AladdinDAO', 18, underlyingAssetForSymbol('ald')),
  ofcerc20(
    'fae2a567-c995-4dce-83a8-e8fea72214ba',
    'ofcalgodoom',
    '10X Short Algo token',
    18,
    underlyingAssetForSymbol('algodoom')
  ),
  ofcerc20(
    '3f4b7d5c-d35a-4de7-8cfc-5fae65ca2825',
    'ofcalgomoon',
    '10X Long Algo Token',
    18,
    underlyingAssetForSymbol('algomoon')
  ),
  ofcerc20(
    '11de7fe4-bd6c-4b51-84af-78122bbe2548',
    'ofcaltdoom',
    '10X Short Altcoin index token',
    18,
    underlyingAssetForSymbol('altdoom')
  ),
  ofcerc20(
    'a03cbf9f-de8e-477c-8591-aa289e7b024e',
    'ofcaltmoon',
    '10X Long Altcoin index token',
    18,
    underlyingAssetForSymbol('altmoon')
  ),
  ofcerc20('9e1e4f99-75c9-4d00-95c5-fe983c47fcc6', 'ofcangle', 'ANGLE', 18, underlyingAssetForSymbol('angle')),
  ofcerc20(
    'dcff3ec9-8d3a-4759-bc01-008657e2dffc',
    'ofcanml',
    'Animal Concerts Token',
    18,
    underlyingAssetForSymbol('anml')
  ),
  ofcerc20('798aa07a-5956-46e7-a5bb-01a6712d34e2', 'ofcarmor', 'Armor', 18, underlyingAssetForSymbol('armor')),
  ofcerc20('8eadb31e-2323-42fa-988c-a0a6ac71e512', 'ofcarpa', 'ARPA Token', 18, underlyingAssetForSymbol('arpa')),
  ofcerc20('f30ade9f-aeba-4c67-8c13-be5411cd0853', 'ofcata', 'Automata', 18, underlyingAssetForSymbol('ata')),
  ofcerc20('947b3b4e-280b-45be-9455-aabd7138c075', 'ofcatf', 'AntFarm Finance', 9, underlyingAssetForSymbol('atf')),
  ofcerc20('c8428197-606c-4950-89fc-97e8adcd74a5', 'ofcatl', 'ATLANT', 18, underlyingAssetForSymbol('atl')),
  ofcerc20('a368ec29-3204-4699-9815-c0d7a8683d50', 'ofcatlas', 'Star Atlas', 8, underlyingAssetForSymbol('atlas')),
  ofcerc20('ad394bb6-3c1e-4c0d-9502-a13b23f69fc1', 'ofcausd', 'AUSD₮', 6, underlyingAssetForSymbol('ausd'), undefined, [
    CoinFeature.STABLECOIN,
  ]),
  ofcerc20(
    'a7a5e765-af73-4769-a10b-88379386656b',
    'ofcausdt',
    'Aave Interest bearing USDT',
    6,
    underlyingAssetForSymbol('ausdt')
  ),
  ofcerc20('288fd300-0fdd-4581-a079-7d58a82c6e94', 'ofcavt', 'AVT', 18, underlyingAssetForSymbol('avt')),
  ofcerc20(
    'f72222f3-09f6-447d-8c32-c9126efbeab1',
    'ofcawbtc',
    'Aave interest bearing WBTC',
    8,
    underlyingAssetForSymbol('awbtc')
  ),
  ofcerc20(
    '3f93cbbc-93bd-4d21-9ef8-198083e20ce1',
    'ofcayfi',
    'Aave interest bearing YFI',
    18,
    underlyingAssetForSymbol('ayfi')
  ),
  ofcerc20('2cfc4c4b-f4c5-459b-a23b-ed3ee75f673c', 'ofcazuki', 'AzukiDAO.org', 18, underlyingAssetForSymbol('azuki')),
  ofcerc20('38e77523-d6d6-4386-aa51-a3b611cb4f97', 'ofcazuki2', 'AZUKI 2.0', 18, underlyingAssetForSymbol('azuki2')),
  ofcerc20(
    'f4821408-ca60-40af-8c2b-2afef30e08f2',
    'ofcazukipepe',
    'AZUKI PEPE',
    18,
    underlyingAssetForSymbol('azukipepe')
  ),
  ofcerc20('46a059a2-983d-469d-947b-35d3e23b5ec3', 'ofcbai', 'BodyAi', 9, underlyingAssetForSymbol('bai')),
  ofcerc20('38bc2c0f-6de8-4308-a164-8ce929e2dcdd', 'ofcbank', 'First Crypto Bank', 9, underlyingAssetForSymbol('bank')),
  ofcerc20('7ee61945-c1ff-4d25-afce-2e5c542b643e', 'ofcbbank', 'BlockBank', 18, underlyingAssetForSymbol('bbank')),
  ofcerc20(
    'cae2e0c3-9872-4816-b996-7b47dda082c1',
    'ofcbchdoom',
    '10X Short BCH Token',
    18,
    underlyingAssetForSymbol('bchdoom')
  ),
  ofcerc20(
    '3dad463a-cde2-4e06-a1ef-0261ae44ec35',
    'ofcbchmoon',
    '10X Long BCH Token',
    18,
    underlyingAssetForSymbol('bchmoon')
  ),
  ofcerc20(
    'da8987e8-7caa-42a9-a204-248051aae946',
    'ofcbearshit',
    '3X Short Shitcoin Index Token',
    18,
    underlyingAssetForSymbol('bearshit')
  ),
  ofcerc20('8a825f77-ec44-473b-9f04-12897f70bae0', 'ofcbend', 'Bend Token', 18, underlyingAssetForSymbol('bend')),
  ofcerc20('1da178e5-ffcc-48a0-a7e6-8e8e0f4db2e9', 'ofcbgbg', 'BigMouthFrog', 18, underlyingAssetForSymbol('bgbg')),
  ofcerc20('edb7043a-fe38-47cd-bae9-63ad70f10480', 'ofcbkx', 'BANKEX', 18, underlyingAssetForSymbol('bkx')),
  ofcerc20(
    'a79cb684-3d97-4a7e-aced-57e6cf47fe09',
    'ofcblct',
    'Bloomzed Loyalty Club Ticket',
    18,
    underlyingAssetForSymbol('blct')
  ),
  ofcerc20('0831bf9e-6812-4e98-9cd9-9ce4790d8628', 'ofcblur-0x083', 'Blur', 18, underlyingAssetForSymbol('blur0x083')),
  ofcerc20(
    'dc7aba12-8f28-49c4-9123-ba139faa10ba',
    'ofcbnbdoom',
    '10X Short BNB Token',
    18,
    underlyingAssetForSymbol('bnbdoom')
  ),
  ofcerc20(
    'a27dd0bf-09ae-4b92-aa8b-dbd1776d45fa',
    'ofcbnbmoon',
    '10X Long BNB Token',
    18,
    underlyingAssetForSymbol('bnbmoon')
  ),
  ofcerc20('ff51feb3-7531-4fda-93d2-c8a5f8941dcd', 'ofcbone', 'BONE SHIBASWAP', 18, underlyingAssetForSymbol('bone')),
  ofcerc20('d8eaf965-c69b-4928-9382-d3ad1fcf13c9', 'ofcbribe', 'Bribe Token', 18, underlyingAssetForSymbol('bribe')),
  ofcerc20(
    '9d4ff7dd-a602-40c8-aedf-206c74e4aaef',
    'ofcbsvdoom',
    '10X Short Bitcoin SV Token',
    18,
    underlyingAssetForSymbol('bsvdoom')
  ),
  ofcerc20(
    '99991b04-fb1a-48a8-ba00-e81d3fec3db2',
    'ofcbsvmoon',
    '10X Long Bitcoin SV Token',
    18,
    underlyingAssetForSymbol('bsvmoon')
  ),
  ofcerc20(
    '8a460a17-2c18-42b5-b845-de2f59c53919',
    'ofcbtc2x-fli',
    'BTC 2x Flexible Leverage Index',
    18,
    underlyingAssetForSymbol('btc2xfli')
  ),
  ofcerc20(
    '0688653e-b1b8-4bb5-8277-15d22e62a3f7',
    'ofcbtmxbull',
    '3X Long BTMX Token',
    18,
    underlyingAssetForSymbol('btmxbull')
  ),
  ofcerc20('8d5b4517-82ca-410c-ba45-68cb1cb4d595', 'ofcbtsg', 'BitSong', 18, underlyingAssetForSymbol('btsg')),
  ofcerc20(
    'a36573fc-c050-4362-acf1-7bc773e18ae4',
    'ofcbullshit',
    '3X Long Shitcoin Index Token',
    18,
    underlyingAssetForSymbol('bullshit')
  ),
  ofcerc20('43109998-f801-43b7-ba0b-7db10537d127', 'ofcc3', 'C3 Finance', 9, underlyingAssetForSymbol('c3')),
  ofcerc20('9f307ab4-e400-4d33-ac64-1cbfd59bfcf2', 'ofcc6p', 'C6Protocol', 9, underlyingAssetForSymbol('c6p')),
  ofcerc20('a8ee55a0-205d-4c6a-bbf2-b7c35074211e', 'ofccanto', 'CANTO', 18, underlyingAssetForSymbol('canto')),
  ofcerc20('239c5fae-14b2-478b-93c1-ee72f2e12f26', 'ofccaps', 'Capsule Coin', 18, underlyingAssetForSymbol('caps')),
  ofcerc20('4d7ed89a-f7ef-4ccd-9fa8-3e7b6e68f1ab', 'ofccarv', 'CARV', 18, underlyingAssetForSymbol('carv')),
  ofcerc20(
    '4e3fbedd-36f1-4670-8a62-fde56ffcf91e',
    'ofccbeth',
    'Coinbase Wrapped ETH',
    18,
    underlyingAssetForSymbol('cbeth')
  ),
  ofcerc20('95449ee1-23c6-4fe0-839a-10ad3d96c5e4', 'ofccdaiv2', 'Compound Dai', 8, underlyingAssetForSymbol('cdaiV2')),
  ofcerc20('097a1f2e-3514-406e-87bc-3b4ffdf365b1', 'ofccells', 'Dead Cells', 18, underlyingAssetForSymbol('cells')),
  ofcerc20(
    '5c3738af-0741-4fc1-b132-be262597a8fd',
    'ofcchainlink',
    'ChainLink Token',
    18,
    underlyingAssetForSymbol('chainlink')
  ),
  ofcerc20('ae1e9792-7cc8-4f79-aeb6-b0ac8331f814', 'ofcchart', 'ChartEx', 18, underlyingAssetForSymbol('chart')),
  ofcerc20('74c70236-33ce-4f28-a437-a748e090339f', 'ofccnfi', 'Connect Finance', 18, underlyingAssetForSymbol('cnfi')),
  ofcerc20('8dcefa77-fe16-4b8e-8396-1dcf28e74abb', 'ofccollar', 'DOG COLLAR', 18, underlyingAssetForSymbol('collar')),
  ofcerc20('0adac8a6-33a9-4b6f-be55-65ca17ea5086', 'ofccombo', 'Combo', 18, underlyingAssetForSymbol('combo')),
  ofcerc20('d7721a78-95be-44fc-b0c0-9b008c9f822e', 'ofccos', 'Contentos', 18, underlyingAssetForSymbol('cos')),
  ofcerc20('51fa985a-0c14-48b0-af3d-a4bba0468187', 'ofccoval', 'CircuitsOfValue', 8, underlyingAssetForSymbol('coval')),
  ofcerc20(
    'c105d8df-69d5-46b4-9cbd-b3f9d46149b0',
    'ofccover-protocol',
    'Cover Protocol Governance Token',
    18,
    underlyingAssetForSymbol('coverprotocol')
  ),
  ofcerc20(
    '94e72805-f3a2-440a-9934-d2d91330ca46',
    'ofccri',
    'Crypto International',
    18,
    underlyingAssetForSymbol('cri')
  ),
  ofcerc20('b63fa39b-e000-4419-a04c-fb22d87c098f', 'ofccvxfxs', 'Convex FXS', 18, underlyingAssetForSymbol('cvxfxs')),
  ofcerc20('7c9996c1-aa2e-447f-98f7-b4a2ac05800e', 'ofcdadi', 'DADI', 18, underlyingAssetForSymbol('dadi')),
  ofcerc20(
    'fd5d35ee-5e15-4e5a-8d3c-bcb67a6e2b78',
    'ofcdaolang',
    'Daolang Coin',
    8,
    underlyingAssetForSymbol('daolang')
  ),
  ofcerc20('c8783afd-f756-4095-bac9-6feb26be20b4', 'ofcdar', 'Dalarnia', 6, underlyingAssetForSymbol('dar')),
  ofcerc20('f19703bc-860e-4b01-8987-0029a19f6b4a', 'ofcdepay', 'DePay', 18, underlyingAssetForSymbol('depay')),
  ofcerc20('9d1a8b7a-92e6-4e97-83d4-b6381b5cc132', 'ofcdht', 'dHedge DAO Token', 18, underlyingAssetForSymbol('dht')),
  ofcerc20('7976bf1b-6629-4870-ad71-e956678de8a4', 'ofcdna', 'DNA', 18, underlyingAssetForSymbol('dna')),
  ofcerc20('dada1b8f-7d32-49c7-abdc-7884d11fa242', 'ofcdnt', 'district0x', 18, underlyingAssetForSymbol('dnt')),
  ofcerc20('b973f3ee-9de5-40f0-99e4-684ea954eb21', 'ofcdog', 'The Doge NFT', 18, underlyingAssetForSymbol('dog')),
  ofcerc20(
    '953bc747-9b4f-42a7-af86-0a32ad3405bd',
    'ofcdogebear2021',
    '3X Short Doge Coin',
    18,
    underlyingAssetForSymbol('dogebear2021')
  ),
  ofcerc20('b995b167-698e-4ed6-b201-1853e0b0c8ca', 'ofcdomi', 'Domi Online', 18, underlyingAssetForSymbol('domi')),
  ofcerc20(
    '9c75fc66-00b3-4e86-ab2f-2b062007d517',
    'ofcdoom',
    '10X Short Bitcoin',
    18,
    underlyingAssetForSymbol('doom')
  ),
  ofcerc20(
    '5116180f-56af-4173-8e76-70f26a38c19a',
    'ofcdoomshit',
    '10X Short Shitcoin Index Token',
    18,
    underlyingAssetForSymbol('doomshit')
  ),
  ofcerc20('5335744a-6e3b-460e-bbcf-04428cb499e6', 'ofcdose', 'DOSE', 18, underlyingAssetForSymbol('dose')),
  ofcerc20('9c9df6ab-9def-4beb-9174-d4f1384b647a', 'ofcdotk', 'DOTK', 10, underlyingAssetForSymbol('dotk')),
  ofcerc20('d784d184-4b55-4f37-aa71-437987f8d06e', 'ofcdpay', 'Devour', 18, underlyingAssetForSymbol('dpay')),
  ofcerc20('102f8abb-9056-4054-839e-55d428df50b0', 'ofcdpy', 'Delphy Token', 18, underlyingAssetForSymbol('dpy')),
  ofcerc20('4d47235c-36d5-4930-931a-7ab830d23dd8', 'ofcduck', 'Unit Protocol', 18, underlyingAssetForSymbol('duck')),
  ofcerc20('25b6d6b9-9f82-43ca-b245-c578c9dbac87', 'ofcdusd', 'DefiDollar', 18, underlyingAssetForSymbol('dusd')),
  ofcerc20('7ef5b16b-27e7-40d6-9a46-6a293c980551', 'ofcdusk', 'Dusk Network', 18, underlyingAssetForSymbol('dusk')),
  ofcerc20('3fe3222f-e6b1-4268-b2ee-9829c869b2cf', 'ofcedo', 'Eidoo', 18, underlyingAssetForSymbol('edo')),
  ofcerc20('3f73b96f-78f9-4856-8998-0438521a7c72', 'ofcelon', 'Dogelon', 18, underlyingAssetForSymbol('elon')),
  ofcerc20('16cf118f-512d-4a04-ad7c-65b76592fbd8', 'ofceon', 'EOS Network', 18, underlyingAssetForSymbol('eon')),
  ofcerc20('367188a4-31c0-4018-9a06-4660f9a99014', 'ofceop', 'EOSpace', 18, underlyingAssetForSymbol('eop')),
  ofcerc20(
    '213cc554-b7b0-4f3e-b854-35da400e0865',
    'ofceosdoom',
    '10X Short EOS Token',
    18,
    underlyingAssetForSymbol('eosdoom')
  ),
  ofcerc20(
    '547cae62-dd52-446a-a652-3ed3eb02934d',
    'ofceosmoon',
    '10X Long EOS Token',
    18,
    underlyingAssetForSymbol('eosmoon')
  ),
  ofcerc20(
    '6709186d-b36d-466e-a6ef-94a4a3f002d2',
    'ofcetcdoom',
    '10X Short ETC Token',
    18,
    underlyingAssetForSymbol('etcdoom')
  ),
  ofcerc20(
    '8b0a3edd-65f6-44a4-8000-3f275b1f83c6',
    'ofcetchedoom',
    '1X Short Ethereum Classic Token',
    18,
    underlyingAssetForSymbol('etchedoom')
  ),
  ofcerc20(
    '049f582c-7252-4e92-9e78-6e0e0644748b',
    'ofcetcmoon',
    '10X Long ETC token',
    18,
    underlyingAssetForSymbol('etcmoon')
  ),
  ofcerc20(
    'f2ab1638-e5be-435a-a180-996ef866d0d7',
    'ofcethdoom',
    '10X Short ETH',
    18,
    underlyingAssetForSymbol('ethdoom')
  ),
  ofcerc20(
    '257eba8c-259e-4555-bd6b-e3a1555db7f0',
    'ofcethmoon',
    '10X Long ETH',
    18,
    underlyingAssetForSymbol('ethmoon')
  ),
  ofcerc20('67d4cc4d-8dae-451c-8fd4-7aba83e10d07', 'ofcethopt', 'ethopt.io', 18, underlyingAssetForSymbol('ethopt')),
  ofcerc20('bf0f703c-8077-4846-9464-3c9395da4808', 'ofcethton', 'TON Token', 18, underlyingAssetForSymbol('ethton')),
  ofcerc20('fa082195-e23f-44d2-ac9e-b6180c32de31', 'ofcetx', 'Ethereum Dex', 18, underlyingAssetForSymbol('etx')),
  ofcerc20(
    '4a9e364c-4604-47d0-9844-8cb829b3bfe1',
    'ofcexchbear',
    '3X Short Exchange Token Index Token',
    18,
    underlyingAssetForSymbol('exchbear')
  ),
  ofcerc20(
    'b5451294-582b-4253-bfd7-caf5564c46b8',
    'ofcexchbull',
    '3X Long Exchange Token Index Token',
    18,
    underlyingAssetForSymbol('exchbull')
  ),
  ofcerc20(
    'ec224f9b-e704-482d-8992-bd786b63b788',
    'ofcexchdoom',
    '10X Short Exchange Token Index Token',
    18,
    underlyingAssetForSymbol('exchdoom')
  ),
  ofcerc20(
    'ffc366d0-5c5a-4691-b2b5-42554f0e119f',
    'ofcexchhedge',
    '1X Short Exchange Token Index Token',
    18,
    underlyingAssetForSymbol('exchhedge')
  ),
  ofcerc20(
    'ce59ab28-9689-4490-ac1c-8aa5d8a46aeb',
    'ofcexchmoon',
    '10X Long EXCH token',
    18,
    underlyingAssetForSymbol('exchmoon')
  ),
  ofcerc20('dfca5ed5-1d12-44de-a6b0-e4df5368a7f0', 'ofcff6000', 'FF6000', 18, underlyingAssetForSymbol('ff6000')),
  ofcerc20('eaa0432b-5bb5-4345-8d19-1656cf435082', 'ofcfidu', 'Fidu', 18, underlyingAssetForSymbol('fidu')),
  ofcerc20('9bda5e25-eb04-4c73-8d3f-4393a05202f4', 'ofcfin', 'DeFiner Protocol', 9, underlyingAssetForSymbol('fin')),
  ofcerc20(
    '4df2cac6-ed03-4cf9-9e2d-405c40820532',
    'ofcfirstblood',
    'FirstBlood',
    18,
    underlyingAssetForSymbol('firstblood')
  ),
  ofcerc20('07630bd3-db0c-4d32-b4b8-989cde82ccde', 'ofcfis', 'StaFi', 18, underlyingAssetForSymbol('fis')),
  ofcerc20('f6a3c08a-7cdb-4ff3-9b7b-d204bb56d557', 'ofcforex', 'handleFOREX', 18, underlyingAssetForSymbol('forex')),
  ofcerc20(
    'ad155975-4cda-47cd-916d-61a317a5cc51',
    'ofcfpis',
    'Frax Price Index Share',
    18,
    underlyingAssetForSymbol('fpis')
  ),
  ofcerc20('de9d8cc3-f406-4eec-983b-c6ecaf8427c3', 'ofcfttv2', 'FTX Token v2.0', 18, underlyingAssetForSymbol('ftt20')),
  ofcerc20('132ba088-3411-4ca8-bde2-c1a5a27c6a1f', 'ofcftx2', 'FTX 2.0', 18, underlyingAssetForSymbol('ftx2')),
  ofcerc20('312072c2-f6fc-41eb-8fb8-330148808dc9', 'ofcfuckftx', 'Fuck FTX', 9, underlyingAssetForSymbol('fuckftx')),
  ofcerc20('21b88fd9-fc2a-4a4e-8b97-b715b6c2ec06', 'ofcfx', 'Function X', 18, underlyingAssetForSymbol('fx')),
  ofcerc20(
    '4953faac-8882-4ff2-b184-95fd7d233b6d',
    'ofcgamecom',
    'Game.com Token',
    18,
    underlyingAssetForSymbol('game.com')
  ),
  ofcerc20('067355ca-f43a-4c42-832b-c90e787c8e9a', 'ofcgear', 'Gearbox', 18, underlyingAssetForSymbol('gear')),
  ofcerc20('b7fd3d04-6d35-4b65-8053-73570f827d8a', 'ofcgiv', 'GIVToken', 8, underlyingAssetForSymbol('giv')),
  ofcerc20('db0701be-d754-4c1a-a13a-91bed2ebe6e3', 'ofcgom', 'Gomics', 18, underlyingAssetForSymbol('gom')),
  ofcerc20(
    '67fddb3a-4330-47e4-9204-437bc7579607',
    'ofcgomining',
    'GoMining Token',
    18,
    underlyingAssetForSymbol('gomining')
  ),
  ofcerc20('b0722ade-d88a-4982-b2aa-17069641482d', 'ofcgrid', 'GRID', 12, underlyingAssetForSymbol('grid')),
  ofcerc20('7e4b8f6d-0d10-4303-9fc8-b6eb69c99cfa', 'ofcgxt', 'Gem Exchange', 18, underlyingAssetForSymbol('gxt')),
  ofcerc20('33e34da9-c892-42c0-b62a-21e87aa5c31a', 'ofchbtc', 'Huobi BTC', 18, underlyingAssetForSymbol('hbtc')),
  ofcerc20(
    '44926a26-1866-46b8-91ff-6e9e2d02bafb',
    'ofchedgeshit',
    '1X Short Shitcoin Index Token',
    18,
    underlyingAssetForSymbol('hedgeshit')
  ),
  ofcerc20('80e70941-c7c4-4680-b6c5-43b589825ee5', 'ofchex', 'HEX', 8, underlyingAssetForSymbol('hex')),
  ofcerc20('6c70feed-ae27-4f75-ae54-3c52209ef01c', 'ofchit', 'HitchainCoin', 6, underlyingAssetForSymbol('hit')),
  ofcerc20('599e6f14-858d-4b3a-9991-ddd56bac2706', 'ofchop', 'Hop', 18, underlyingAssetForSymbol('hop')),
  ofcerc20('92c79140-aa46-4be0-9a72-9fc0dfdbb717', 'ofchpo', 'Hippocrat', 18, underlyingAssetForSymbol('hpo')),
  ofcerc20('5cbfbde5-960a-499e-b3e8-f36c133afcd8', 'ofchqg', 'HQG', 6, underlyingAssetForSymbol('hqg')),
  ofcerc20(
    '16835e11-04cf-40a2-b9c3-317621762e56',
    'ofchtbear',
    '3X Short HT token',
    18,
    underlyingAssetForSymbol('htbear')
  ),
  ofcerc20(
    '973f849d-12bb-4f42-a508-508817920887',
    'ofchtdoom',
    '10X Short HT token',
    18,
    underlyingAssetForSymbol('htdoom')
  ),
  ofcerc20(
    '03f480c9-d674-40f6-83d0-d469c5a51ab2',
    'ofchthedge',
    '1X Short HT token',
    18,
    underlyingAssetForSymbol('hthedge')
  ),
  ofcerc20(
    'de8921be-3ac5-4281-af50-4713c30bb348',
    'ofchtmoon',
    '10X Long HT token',
    18,
    underlyingAssetForSymbol('htmoon')
  ),
  ofcerc20('99c606be-05af-4a13-afeb-04d602917abf', 'ofchumv2', 'Humanscape', 18, underlyingAssetForSymbol('humv2')),
  ofcerc20(
    '51c6dce1-2cb6-4583-9d84-da64a71a0998',
    'ofchydroprotocol',
    'Hydro Protocol',
    18,
    underlyingAssetForSymbol('hydroprotocol')
  ),
  ofcerc20('dfaf28d5-68fc-465f-85f9-bec29fe4ecf3', 'ofcibeur', 'Iron Bank EUR', 18, underlyingAssetForSymbol('ibeur')),
  ofcerc20('2b8a5f56-38a9-4a55-b68f-3a38b76847d6', 'ofcibox', 'IBOX TOKEN', 18, underlyingAssetForSymbol('ibox')),
  ofcerc20('a9a34973-5399-4fd6-93c2-8407d2875490', 'ofcilv', 'Illuvium', 18, underlyingAssetForSymbol('ilv')),
  ofcerc20('a86e9f45-af3f-4df0-bd2b-9d7958e88dd8', 'ofcinsur', 'InsurChain2', 18, underlyingAssetForSymbol('insur')),
  ofcerc20('d47cfa7b-5e71-4cae-b490-8b1ec396b892', 'ofckarma', 'Karma', 4, underlyingAssetForSymbol('karma')),
  ofcerc20('f19236e7-5c84-459d-9a07-086a05b9acbd', 'ofckcash', 'Kcash', 18, underlyingAssetForSymbol('kcash')),
  ofcerc20('85d36477-3bb2-436f-926e-fcbe55ee920b', 'ofckill0', 'Killerof0', 18, underlyingAssetForSymbol('kill0')),
  ofcerc20('1f0c355d-f7d7-4417-9005-7a3cd912ba9e', 'ofckishui', 'Kishui.org', 0, underlyingAssetForSymbol('kishui')),
  ofcerc20('7d7bfcc5-5bf5-4521-af6d-7af2c0401439', 'ofckol', 'Kollect', 18, underlyingAssetForSymbol('kol')),
  ofcerc20('cfa9a270-9b9c-4a71-b54e-5b2d5e6cdbc1', 'ofcl3usd', 'L3USD', 18, underlyingAssetForSymbol('l3usd')),
  ofcerc20('28c47c8a-3c81-499a-91b3-6a6b1537d02a', 'ofcla', 'LAtoken', 18, underlyingAssetForSymbol('la')),
  ofcerc20('af6189bc-20c4-4f67-a5bb-50914d9b06db', 'ofcladys', 'Milady', 18, underlyingAssetForSymbol('ladys')),
  ofcerc20(
    '5965b592-cd81-4a26-8766-7f252b8b2e12',
    'ofclayerzero',
    'LAYER ZERO',
    18,
    underlyingAssetForSymbol('layerzero')
  ),
  ofcerc20(
    '62877ac5-c89c-459c-a596-def8916e330f',
    'ofcleobear',
    '3X Short LEO token',
    18,
    underlyingAssetForSymbol('leobear')
  ),
  ofcerc20(
    'c69021f4-d1f2-47b7-87e3-c3addf9b1046',
    'ofcleobull',
    '3X Long LEO Token',
    18,
    underlyingAssetForSymbol('leobull')
  ),
  ofcerc20(
    'b3703a05-74ba-4fe8-b01c-385d6d712ec2',
    'ofcleodoom',
    '10X Short LEO Token',
    18,
    underlyingAssetForSymbol('leodoom')
  ),
  ofcerc20(
    '1424b32b-95f3-4ad7-be10-941cbc1cbaaa',
    'ofcleohedge',
    '1X Short LEO Token',
    18,
    underlyingAssetForSymbol('leohedge')
  ),
  ofcerc20(
    'e38d065c-c4b8-4fd3-b3d1-b61dc3236c4a',
    'ofcleomoon',
    '10X Long LEO Token',
    18,
    underlyingAssetForSymbol('leomoon')
  ),
  ofcerc20('2d67faee-64d4-4c3f-a623-1d53ecf20ecf', 'ofclev', 'Leverj', 9, underlyingAssetForSymbol('lev')),
  ofcerc20('424dca0a-2737-43a6-bbc6-a09cca601939', 'ofclever', 'LeverFI', 18, underlyingAssetForSymbol('lever')),
  ofcerc20('ef6f38b5-3784-45f8-85a3-bbfd429ee505', 'ofclien', 'lien', 8, underlyingAssetForSymbol('lien')),
  ofcerc20('9a47c704-e7ec-42a5-95a2-617962f810c9', 'ofclif3', 'LIF3', 18, underlyingAssetForSymbol('lif3')),
  ofcerc20('63064105-8d4f-4bbb-b487-4ec3a1b95c3b', 'ofclith', 'Lithium', 18, underlyingAssetForSymbol('lith')),
  ofcerc20('a77e443b-c26b-416e-8860-55568cda396c', 'ofclkr', 'Polkalokr', 18, underlyingAssetForSymbol('lkr')),
  ofcerc20('c78971f4-5e16-4c8a-bb64-98b18e3327de', 'ofclove', 'UkraineDAO Flag', 18, underlyingAssetForSymbol('love')),
  ofcerc20(
    'ed06b792-9a30-4b5e-b216-5f1b7a6a7b85',
    'ofclovely',
    'Lovely Finance',
    18,
    underlyingAssetForSymbol('lovely')
  ),
  ofcerc20(
    '25c35d3f-4967-4b4d-9d21-198a7dc87cde',
    'ofcltcdoom',
    '10X Short Litecoin',
    18,
    underlyingAssetForSymbol('ltcdoom')
  ),
  ofcerc20(
    '782254af-f786-4eb1-82d9-b445b1b27855',
    'ofcltchedge',
    '1X Short Litecoin',
    18,
    underlyingAssetForSymbol('ltchedge')
  ),
  ofcerc20(
    '4aa4d02e-5213-48c5-8efc-2f3530a87f91',
    'ofcltcmoon',
    '10X Long Litecoin token',
    18,
    underlyingAssetForSymbol('ltcmoon')
  ),
  ofcerc20('7d17265c-3f19-483f-a1bb-1bf0369bb7ad', 'ofclto', 'LTO Network', 8, underlyingAssetForSymbol('lto')),
  ofcerc20(
    '12139488-d699-4008-8af4-30231d7faa55',
    'ofcluna-wormhole',
    'LUNA (Wormhole)',
    6,
    underlyingAssetForSymbol('lunawormhole')
  ),
  ofcerc20('e3b13702-c295-4fc6-ae1c-2fa73d7b0969', 'ofclyxe', 'LUKSO', 18, underlyingAssetForSymbol('lyxe')),
  ofcerc20(
    'b4e5a6cc-a62d-4a00-995f-8965ccb435e6',
    'ofcmaticbear2021',
    '3X Short Matic Token',
    18,
    underlyingAssetForSymbol('maticbear2021')
  ),
  ofcerc20(
    '3125a295-1693-4232-9f4b-3a413c863409',
    'ofcmidbear',
    '3X Short Midcap Index Token',
    18,
    underlyingAssetForSymbol('midbear')
  ),
  ofcerc20(
    '88138033-1060-4580-ab6a-c3b5484aaaa7',
    'ofcmiddoom',
    '10X Short Midcap Index Token',
    18,
    underlyingAssetForSymbol('middoom')
  ),
  ofcerc20(
    'fa1ac4ee-449d-4524-9465-f622ae860105',
    'ofcmidhedge',
    '1X Short Midcap Index Token',
    18,
    underlyingAssetForSymbol('midhedge')
  ),
  ofcerc20(
    '3557841d-32f3-4b98-a3c6-dfa71d0d64ff',
    'ofcmidmoon',
    '10X Long Midcap Index Token',
    18,
    underlyingAssetForSymbol('midmoon')
  ),
  ofcerc20('87f46300-26b2-484c-a10a-2015ff4c91ab', 'ofcmochi', 'Mochi Inu', 18, underlyingAssetForSymbol('mochi')),
  ofcerc20('375cfaa9-b651-4b12-90df-ca121d73231e', 'ofcmoh', 'Medal of Honour', 18, underlyingAssetForSymbol('moh')),
  ofcerc20(
    '068f9fee-b2ec-462a-996f-dbc4432a0e60',
    'ofcmoon',
    '10X Long Bitcoin Token',
    18,
    underlyingAssetForSymbol('moon')
  ),
  ofcerc20(
    'c572f556-2abb-4b1a-9e80-b9cca7e60684',
    'ofcmoonshit',
    '10X Long Shitcoin Index Token',
    18,
    underlyingAssetForSymbol('moonshit')
  ),
  ofcerc20('d3b061d2-5d0a-41fb-9f4d-8c196c353c52', 'ofcmother', 'MOTHER IGGY', 9, underlyingAssetForSymbol('mother')),
  ofcerc20('86a71a82-77cc-40cb-a426-f2d84c8b9ae6', 'ofcmrtweet', 'Mr. Tweet', 18, underlyingAssetForSymbol('mrtweet')),
  ofcerc20('9c8763ec-fb2a-4365-ae7c-1725f574b7aa', 'ofcmsn', 'meson.network', 18, underlyingAssetForSymbol('msn')),
  ofcerc20('6d3e9aa1-f067-437e-b174-1720d8fd9d80', 'ofcmth', 'Monetha', 5, underlyingAssetForSymbol('mth')),
  ofcerc20('532864a9-1ffc-409f-a769-fc259719409b', 'ofcmtv', 'MultiVAC', 18, underlyingAssetForSymbol('mtv')),
  ofcerc20('54d3ebd3-6c3d-4519-8eef-9cee96d80c71', 'ofcnaai', 'NeoAudit AI', 9, underlyingAssetForSymbol('naai')),
  ofcerc20(
    '4a59c525-9998-4a55-9563-0086ab95e252',
    'ofcnear-erc20',
    'NEAR (ERC20 token)',
    24,
    underlyingAssetForSymbol('near-erc20')
  ),
  ofcerc20('01541544-0977-4e3e-ba36-addf7709dd8e', 'ofcnewo', 'New Order', 18, underlyingAssetForSymbol('newo')),
  ofcerc20(
    '2aa68545-8b42-4781-af4c-e1a15261b4cf',
    'ofcnfcwin-sb-2021',
    'National Football Conference Wins Superbowl 2021',
    18,
    underlyingAssetForSymbol('nfcwin-sb-2021')
  ),
  ofcerc20('0421a05c-2d3d-4216-a18e-073aa5dede7f', 'ofcnkn', 'NKN', 18, underlyingAssetForSymbol('nkn')),
  ofcerc20('bcdb48b5-05b0-4e89-ba5c-83a063ea24ae', 'ofcnote', 'Notional', 18, underlyingAssetForSymbol('note')),
  ofcerc20('66c1eac0-fe4d-46ff-bfa9-e4afc591202e', 'ofcnpt', 'NEOPIN Token', 18, underlyingAssetForSymbol('npt')),
  ofcerc20('1d44a2ca-4bb2-4622-96cd-d833683ef0b2', 'ofcnuls', 'Nuls', 8, underlyingAssetForSymbol('nuls')),
  ofcerc20('92f9e35f-b2b4-4211-9165-8e0157914785', 'ofcnuts', 'NutsDAO', 18, underlyingAssetForSymbol('nuts')),
  ofcerc20('d5ca1da1-8632-42f2-8cf9-4d7ec43ddd61', 'ofcnxm', 'Nexus Mutual', 18, underlyingAssetForSymbol('nxm')),
  ofcerc20('9bfaa103-e53b-4697-8927-6234661de55c', 'ofcoax', 'OpenANX', 18, underlyingAssetForSymbol('oax')),
  ofcerc20('62af8c1d-877f-4469-9b6d-e6ccd62129d9', 'ofcoctav', 'Octav', 9, underlyingAssetForSymbol('octav')),
  ofcerc20('3650c561-0cf3-425d-bd1a-d30ae3098f92', 'ofcogv', 'Origin Dollar', 18, underlyingAssetForSymbol('ogv')),
  ofcerc20(
    'a953fe3e-ccd1-4950-8edc-f24797ad6d29',
    'ofcokbbear',
    '3X Short OKB token',
    18,
    underlyingAssetForSymbol('okbbear')
  ),
  ofcerc20(
    'cac5236f-5903-497f-95eb-2b5febe99b2b',
    'ofcokbdoom',
    '10X Short OKB token',
    18,
    underlyingAssetForSymbol('okbdoom')
  ),
  ofcerc20(
    '4632a9c1-8408-4f64-8424-4cc4e48a62c0',
    'ofcokbhedge',
    '1X Short OKB token',
    18,
    underlyingAssetForSymbol('okbhedge')
  ),
  ofcerc20(
    'f410342f-4136-4fd1-b232-93d92036d5ab',
    'ofcokbmoon',
    '10X Long OKB Token',
    18,
    underlyingAssetForSymbol('okbmoon')
  ),
  ofcerc20(
    'cb2a8ead-03e7-41be-b504-6d494d71f4be',
    'ofcopium',
    'Opium Governance Token',
    18,
    underlyingAssetForSymbol('opium')
  ),
  ofcerc20('dce641ae-8a76-4212-9dfc-a5ba981259c8', 'ofcorc', 'Orbit Chain', 18, underlyingAssetForSymbol('orc')),
  ofcerc20('8c5c434b-3ffa-46fc-8fb9-bc88d73a9363', 'ofcorn', 'Orion Protocol', 8, underlyingAssetForSymbol('orn')),
  ofcerc20('9d4c639f-29f1-4941-be3e-dfc23291b379', 'ofcos', 'OpenSea', 18, underlyingAssetForSymbol('os')),
  ofcerc20(
    '24daf055-c62a-43dc-844d-cb85361294e1',
    'ofcousd',
    'OpenSea',
    18,
    underlyingAssetForSymbol('ousd'),
    undefined,
    [CoinFeature.STABLECOIN]
  ),
  ofcerc20(
    '015fe891-e2b9-4f89-949e-7b0682e0c163',
    'ofcpaxgbear',
    '3X Short PAX Gold Token',
    18,
    underlyingAssetForSymbol('paxgbear')
  ),
  ofcerc20(
    '71fe58df-3f44-4d03-91db-6d5e1347456f',
    'ofcpaxgbull',
    '3X Long PAX Gold Token',
    18,
    underlyingAssetForSymbol('paxgbull')
  ),
  ofcerc20(
    '1b89904f-3d83-426f-92ab-1e5e9c2bf36e',
    'ofcpebble',
    'Etherrock #72',
    18,
    underlyingAssetForSymbol('pebble')
  ),
  ofcerc20('ed74c5d6-5112-44f6-acfe-61e9fbfeaf27', 'ofcpick', 'PICK', 18, underlyingAssetForSymbol('pick')),
  ofcerc20('c0a90971-296a-4108-9e8e-360fa8a96033', 'ofcpickle', 'PickleToken', 18, underlyingAssetForSymbol('pickle')),
  ofcerc20('3d1ab8f5-187b-4e2c-997d-c4b658eabb28', 'ofcpine', 'Pine Token', 18, underlyingAssetForSymbol('pine')),
  ofcerc20('615704c8-5f15-4ac9-9767-6dfc48b376ef', 'ofcpixel', 'Pixels', 18, underlyingAssetForSymbol('pixel')),
  ofcerc20(
    '04fd8ad3-228e-49c6-bcd0-09a0fd0b8e0f',
    'ofcpirate',
    'Pirate Nation Token',
    18,
    underlyingAssetForSymbol('pirate')
  ),
  ofcerc20('7e972fa6-ea28-4f82-9bcf-e4f3585b35da', 'ofcplay', 'PLAY', 18, underlyingAssetForSymbol('play')),
  ofcerc20('35584c00-814f-47ee-82cd-fffe218c0fa3', 'ofcpols', 'Polkastarter', 18, underlyingAssetForSymbol('pols')),
  ofcerc20('3a49ad66-92c3-417b-a590-1aaa1b46afa0', 'ofcpond', 'Marlin POND', 18, underlyingAssetForSymbol('pond')),
  ofcerc20('658fa66e-262b-4eb9-b88d-4100f5e17c61', 'ofcponys', 'My Little Pony', 9, underlyingAssetForSymbol('ponys')),
  ofcerc20('fc28f6a4-0a4a-41bf-af8c-908f19f97c61', 'ofcpros', 'Prosper', 18, underlyingAssetForSymbol('pros')),
  ofcerc20('87f17a44-a6cc-447f-80a7-b05a97ec3bca', 'ofcpsp', 'ParaSwap', 18, underlyingAssetForSymbol('psp')),
  ofcerc20('caf682e1-6e61-4fc8-ac2a-e3f5fe94f881', 'ofcqom', 'Shiba Predator', 18, underlyingAssetForSymbol('qom')),
  ofcerc20('e07efdb0-45af-4b50-bf06-eca4c2b84709', 'ofcralph', 'Rekt Ralph', 18, underlyingAssetForSymbol('ralph')),
  ofcerc20('e3b7d68d-5444-4638-98f0-af05dc121311', 'ofcrazor', 'RAZOR', 18, underlyingAssetForSymbol('razor')),
  ofcerc20('d91e97f9-0c2c-4ce5-840f-791ba907c427', 'ofcrbank', 'Rural Bank', 9, underlyingAssetForSymbol('rbank')),
  ofcerc20('9998869a-b403-45e7-b522-1459d9f73e3c', 'ofcrbn', 'Ribbon', 18, underlyingAssetForSymbol('rbn')),
  ofcerc20('3d0d4f0e-4837-42e9-a62c-1e14dfa78a11', 'ofcrct', 'realchain', 18, underlyingAssetForSymbol('rct')),
  ofcerc20('c317ea90-3bad-4179-ae65-f1575c00add7', 'ofcref', 'RefToken', 8, underlyingAssetForSymbol('ref')),
  ofcerc20('439d353b-65c9-4513-85cf-cb8e2a73bc62', 'ofcrekttoken', '$REKT', 18, underlyingAssetForSymbol('rekttoken')),
  ofcerc20('786786a2-98cb-425a-8746-9c16a9f46d33', 'ofcrektgame', 'RektGAME', 18, underlyingAssetForSymbol('rektgame')),
  ofcerc20('fb6b9335-680a-4c7f-afd3-aed4dd63e9ca', 'ofcrenbtc', 'renBTC', 8, underlyingAssetForSymbol('renbtc')),
  ofcerc20(
    'd1025ac5-2adb-41cb-a611-80faff84c344',
    'ofcreth-rocket',
    'Rocket Pool ETH',
    18,
    underlyingAssetForSymbol('reth-rocket')
  ),
  ofcerc20(
    '5d83bf9b-febd-463b-884d-4866501eef62',
    'ofcreth-stafi',
    'StaFi (rETH)',
    18,
    underlyingAssetForSymbol('reth-stafi')
  ),
  ofcerc20('b27bb221-9086-414c-b2da-9b8d53c20fbf', 'ofcrevv', 'REVV', 18, underlyingAssetForSymbol('revv')),
  ofcerc20('31dc2bdd-31c3-4977-884c-20d035796e17', 'ofcrez', 'Renzo', 18, underlyingAssetForSymbol('rez')),
  ofcerc20('2ef897cc-735f-45ec-97fc-b3859c17ee1d', 'ofcrn', 'Rio Network', 18, underlyingAssetForSymbol('rn')),
  ofcerc20('7a49dfac-1943-420a-aa20-7649f48eb73f', 'ofcrnd', 'random', 18, underlyingAssetForSymbol('rnd')),
  ofcerc20('d9a34606-691c-4c8e-b549-045f019f3eb8', 'ofcrvr', 'River', 18, underlyingAssetForSymbol('rvr')),
  ofcerc20(
    'bb6e751e-17c8-425e-a3e0-8cb34b12a633',
    'ofcryoshi',
    'Ryoshis Vision',
    18,
    underlyingAssetForSymbol('ryoshi')
  ),
  ofcerc20('ddbdb518-73f4-4cd9-988b-0ee0e3482aec', 'ofcsaitabit', 'SAITABIT', 18, underlyingAssetForSymbol('saitabit')),
  ofcerc20('d230143b-f052-4b50-9194-2bfd216ad795', 'ofcsbf', 'SAM BANKMAN FRAUD', 18, underlyingAssetForSymbol('sbf')),
  ofcerc20('a00ed57b-e421-45f9-a7dd-99e09073f8eb', 'ofcsdl', 'Saddle DAO', 18, underlyingAssetForSymbol('sdl')),
  ofcerc20('e63a3788-05c5-43aa-a996-a7521c1b302c', 'ofcseth', 'Shethereum Coin', 9, underlyingAssetForSymbol('seth')),
  ofcerc20(
    'acb0b8ce-1e68-48af-a0bd-c30cf6e47739',
    'ofcsewercoin',
    'SewerCoin',
    18,
    underlyingAssetForSymbol('sewercoin')
  ),
  ofcerc20(
    'fbbe28fe-03d7-4adf-bf9e-d9b310470517',
    'ofcsheesh',
    'Sheesha Finance',
    18,
    underlyingAssetForSymbol('sheesh')
  ),
  ofcerc20('a951ccaa-af2f-44f2-8898-4b64a5560581', 'ofcshido', 'Shido', 18, underlyingAssetForSymbol('shido')),
  ofcerc20('1a99998b-5446-46e5-90b9-69cb3e221288', 'ofcshow', 'ShowCoin2.0', 18, underlyingAssetForSymbol('show')),
  ofcerc20('1f4c9655-0cbb-4f22-82c7-c68a06d1a80a', 'ofcsnm', 'SONM', 18, underlyingAssetForSymbol('snm')),
  ofcerc20('1e2c0fe3-f890-4e47-ad72-d9777e4c2367', 'ofcsomm', 'somm', 6, underlyingAssetForSymbol('somm')),
  ofcerc20('0c7c1a61-3618-4273-a0e5-610f0da518fe', 'ofcspa', 'Sperax', 18, underlyingAssetForSymbol('spa')),
  ofcerc20('672330fd-69ef-4a67-af85-18ecec643d2b', 'ofcspf', 'SPF', 18, underlyingAssetForSymbol('spf')),
  ofcerc20(
    '5898f30a-f352-46bb-b903-04126db323c6',
    'ofcsquidv2',
    'Squid Game 2.0',
    18,
    underlyingAssetForSymbol('squid2.0')
  ),
  ofcerc20(
    '6cba0b10-355b-4374-99e7-740d2d9911a7',
    'ofcstate',
    'ParaState Governance Token',
    18,
    underlyingAssetForSymbol('state')
  ),
  ofcerc20('5e480856-9469-4b9d-a4f6-197a2b319327', 'ofcstrike', 'Strike Token', 18, underlyingAssetForSymbol('strike')),
  ofcerc20(
    '8379fcca-6014-4fd0-bf6e-5977a54f18f6',
    'ofcsui-erc20',
    'Sui (ERC20 token)',
    18,
    underlyingAssetForSymbol('sui-erc20')
  ),
  ofcerc20(
    'e452a225-5699-49e4-b01a-deebb9a29138',
    'ofcsuperperio',
    'SUPER PERIO',
    9,
    underlyingAssetForSymbol('superperio')
  ),
  ofcerc20('9071d758-55c3-4aea-b0ce-6ffdb9368c46', 'ofcsweat', 'SWEAT', 18, underlyingAssetForSymbol('sweat')),
  ofcerc20('d64580ff-c720-4f84-8625-f1df825fc507', 'ofcsweth', 'Swell Ethereum', 18, underlyingAssetForSymbol('sweth')),
  ofcerc20('ca808dbd-aec7-4f16-b6fe-a851daed5d34', 'ofcswitch', 'Switch', 8, underlyingAssetForSymbol('switch')),
  ofcerc20('030491f3-0f3c-4726-b13c-5f7c0b0a18d9', 'ofcswrv', 'Swerve DAO', 18, underlyingAssetForSymbol('swrv')),
  ofcerc20('8c827f97-b076-4bc3-b6c7-35689f488d0f', 'ofcsynch', 'Synapse Chain', 18, underlyingAssetForSymbol('synch')),
  ofcerc20('9f0dc3ae-3a8a-4b81-aef6-ba41fd9530bb', 'ofcsyrup', 'Syrup', 18, underlyingAssetForSymbol('syrup')),
  ofcerc20(
    '015436ee-9dce-4e7a-99be-c79e0d156160',
    'ofctelegramdao',
    'Telegram Dao',
    18,
    underlyingAssetForSymbol('telegramdao')
  ),
  ofcerc20('80ebeef2-36f7-4dc4-a868-0f9c575a1374', 'ofcterm', 'Term Finance', 18, underlyingAssetForSymbol('term')),
  ofcerc20('fd7fc0ef-e53c-44fd-bbbc-9d61922c50a9', 'ofctio', 'Trade', 18, underlyingAssetForSymbol('tio')),
  ofcerc20(
    'ad9a68f5-fc6f-4335-9a17-142091deb488',
    'ofctokamak',
    'Tokamak Network Token',
    18,
    underlyingAssetForSymbol('tokamak')
  ),
  ofcerc20('b8e243c4-0116-4f4b-a78e-4479a84277e1', 'ofctoke', 'Tokemak', 18, underlyingAssetForSymbol('toke')),
  ofcerc20('b2fbba50-e18f-40b1-a0cf-747ad284f39d', 'ofctoken', 'TokenFi', 9, underlyingAssetForSymbol('token')),
  ofcerc20('9e6923a4-2183-44eb-b758-c748bbc5778c', 'ofctomi', 'tomi Token', 18, underlyingAssetForSymbol('tomi')),
  ofcerc20(
    'c8bb5f7c-c670-4ba2-9fd1-be12a41f6624',
    'ofctomobear2',
    '3X Short TomoChain Token',
    18,
    underlyingAssetForSymbol('tomobear2')
  ),
  ofcerc20(
    '5dc64bcf-5f16-483e-ac53-d840a49ddc7f',
    'ofctrumplose',
    'Trump Loses Token',
    18,
    underlyingAssetForSymbol('trumplose')
  ),
  ofcerc20(
    '0d8bbab0-0faa-4654-b9d1-e2dd5c203036',
    'ofctrumpwin',
    'Trump Wins Token',
    18,
    underlyingAssetForSymbol('trumpwin')
  ),
  ofcerc20(
    '29edb007-079c-4f45-997b-d320ecc19c43',
    'ofctrx-erc20',
    'Tron (ERC20 token)',
    6,
    underlyingAssetForSymbol('TRX-ERC20')
  ),
  ofcerc20(
    '0662519b-d563-4b43-a0b1-168239718e00',
    'ofctrxdoom',
    '10X Short TRX Token',
    18,
    underlyingAssetForSymbol('trxdoom')
  ),
  ofcerc20(
    '1de3597a-21c5-4d3b-9249-27d1ff379a01',
    'ofctrxmoon',
    '10X Long TRX Token',
    18,
    underlyingAssetForSymbol('trxmoon')
  ),
  ofcerc20(
    'c501e2e3-5a5c-445a-bbc3-b42c8c8c8e52',
    'ofctrybbear',
    '3X Short BiLira Token',
    18,
    underlyingAssetForSymbol('trybbear')
  ),
  ofcerc20(
    '86adc424-5f18-48fb-b21c-5de69c17b5d5',
    'ofctrybbull',
    '3X Long BiLira Token',
    18,
    underlyingAssetForSymbol('trybbull')
  ),
  ofcerc20('35cca048-0ad4-42f8-8a67-dc423ed99c6b', 'ofctsuka', 'Dejitaru Tsuka', 9, underlyingAssetForSymbol('tsuka')),
  ofcerc20(
    'fe098f77-ef5a-4ea8-b85f-1e813b60d9fd',
    'ofcusdc-pos-wormhole',
    'USD Coin (PoS) (Wormhole) (USDC)',
    6,
    underlyingAssetForSymbol('usdc-pos-wormhole')
  ),
  ofcerc20('6eea1886-280f-4fef-b392-8d0299437dfd', 'ofcuscc', 'USCC', 8, underlyingAssetForSymbol('uscc')),
  ofcerc20('930506e9-5672-4a26-bc09-58df72267cac', 'ofcusdk', 'USDK', 18, underlyingAssetForSymbol('usdk'), undefined, [
    CoinFeature.STABLECOIN,
  ]),
  ofcerc20(
    '1c891223-1ffb-409d-89b9-52e57c7fc02a',
    'ofcusdtbear',
    '3X Short Tether Token',
    18,
    underlyingAssetForSymbol('usdtbear')
  ),
  ofcerc20(
    '6a8aadfe-1f75-4a62-9b17-980cd4712bfa',
    'ofcusdtbull',
    '3X Long Tether token',
    18,
    underlyingAssetForSymbol('usdtbull')
  ),
  ofcerc20(
    '476af32f-614f-405c-a5e8-060922cd3190',
    'ofcusdtdoom',
    '10X Short Tether Token',
    18,
    underlyingAssetForSymbol('usdtdoom')
  ),
  ofcerc20(
    '0b89f0e8-8c9e-405e-8ede-51a8ef5aa012',
    'ofcusdthedge',
    '1X Short Tether Token',
    18,
    underlyingAssetForSymbol('usdthedge')
  ),
  ofcerc20(
    '21bdd40f-f401-4180-8054-3587053e7aed',
    'ofcusdtmoon',
    '10X Long Tether Token',
    18,
    underlyingAssetForSymbol('usdtmoon')
  ),
  ofcerc20(
    '9f390b5e-8c96-4cea-92d4-98b7805a6d35',
    'ofcust-wormhole',
    'UST (Wormhole)',
    6,
    underlyingAssetForSymbol('ust-wormhole')
  ),
  ofcerc20(
    'b2a31271-1178-4ee3-80a8-962a0d07b722',
    'ofcvbnt',
    'Bancor Governance Token',
    18,
    underlyingAssetForSymbol('vbnt')
  ),
  ofcerc20('9432e2e7-44c0-409f-bc9f-f2b6aaef0ec7', 'ofcvee', 'BLOCKv', 18, underlyingAssetForSymbol('vee')),
  ofcerc20('b006f6f1-9ce1-42f5-8b85-2af5e5d3898d', 'ofcviu', 'VIU', 18, underlyingAssetForSymbol('viu')),
  ofcerc20('2b092ac7-690a-4d1a-b361-7efb0c6eb23f', 'ofcvolt', 'Volt Inu', 9, underlyingAssetForSymbol('volt')),
  ofcerc20('24a6e11b-b944-408c-82bb-0ce5b9fb5ba8', 'ofcvra', 'VERA', 18, underlyingAssetForSymbol('vra')),
  ofcerc20('502741b0-5215-450f-bc32-e44c65d7795c', 'ofcvxv', 'VectorspaceAI', 18, underlyingAssetForSymbol('vxv')),
  ofcerc20('f5bd9bff-64ea-4922-9cec-0f6ddfb27689', 'ofcwagmi', 'WAGMI GAMES', 18, underlyingAssetForSymbol('wagmi')),
  ofcerc20(
    '579c6c11-07a5-465d-a773-ed07000eda44',
    'ofcwavax',
    'Wrapped AVAX (Wormhole)',
    18,
    underlyingAssetForSymbol('wavax')
  ),
  ofcerc20('e2645598-d669-4c47-a51d-8e6b71d7fa3f', 'ofcwaxp', 'WAXP Token', 8, underlyingAssetForSymbol('waxp')),
  ofcerc20('d51457b6-2608-45cf-a4b2-8c51f9f711e7', 'ofcwfee', 'WFee', 18, underlyingAssetForSymbol('wfee')),
  ofcerc20('b8f4ad6c-0937-46d4-b094-a56e3d7e5ebe', 'ofcwhat', 'What', 18, underlyingAssetForSymbol('what')),
  ofcerc20('c6ec2c4e-9069-49f1-ade3-87d4efb928b2', 'ofcxdoge', 'XDoge', 18, underlyingAssetForSymbol('xdoge')),
  ofcerc20(
    '6c76b3c0-7ad9-42cb-aade-ce3c431bfec9',
    'ofcxrpdoom',
    '10X Short XRP Token',
    18,
    underlyingAssetForSymbol('xrpdoom')
  ),
  ofcerc20(
    '6c513005-5a49-4d8b-bc54-2089b4bb0fdd',
    'ofcxrpmoon',
    '10X Long XRP Token',
    18,
    underlyingAssetForSymbol('xrpmoon')
  ),
  ofcerc20('92f47bc9-4575-4c75-b83e-2b7ccdd8f53a', 'ofcyamv2', 'YAMv2', 24, underlyingAssetForSymbol('yamv2')),
  ofcerc20('9e642e16-960c-4229-8ceb-18675800639d', 'ofczip', 'Zipper', 18, underlyingAssetForSymbol('zip')),
  ofcerc20('5398d0d2-5241-4946-b67a-5b39d6815c83', 'ofczks', 'Zks', 18, underlyingAssetForSymbol('zks')),
  ofcerc20(
    '961291d9-6ed8-4f7e-8c67-f8a24763e076',
    'ofczro-0x320',
    'LayerZero',
    18,
    underlyingAssetForSymbol('zro-0x320')
  ),
  ofcerc20(
    'a259fa17-57f7-45bb-93f5-ec1c384ce408',
    'ofczro-0xfcf',
    'LayerZero',
    18,
    underlyingAssetForSymbol('zro-0xfcf')
  ),
  ofcerc20(
    '5758aed7-9e32-4ed4-9d47-4eb41556ea14',
    'ofczro-0xe5c',
    'LayerZero',
    18,
    underlyingAssetForSymbol('zro-0xe5c')
  ),
  ofcerc20(
    '60627e77-87a8-49bb-aaaf-069e6630640b',
    'ofcauction',
    'Bounce Token',
    18,
    underlyingAssetForSymbol('auction')
  ),
  ofcerc20('9a997c54-90e3-4cd0-a79f-5f5de0aed3d1', 'ofcava', 'AVA', 18, underlyingAssetForSymbol('ava')),
  ofcerc20('b63364df-1fef-43a8-84b8-1f1202377ee6', 'ofcbeta', 'Beta Token', 18, underlyingAssetForSymbol('beta')),
  ofcerc20('242d03f9-34b9-4ed6-8fd3-de343b1c532e', 'ofcbigtime', 'Big Time', 18, underlyingAssetForSymbol('bigtime')),
  ofcerc20('c98091ab-9744-4705-9567-cc15f383c573', 'ofceth:aevo', 'Aevo', 18, underlyingAssetForSymbol('eth:aevo')),
  ofcerc20('b3590232-8360-4c0b-ab0e-c48c4e541d49', 'ofceth:alt', 'AltLayer', 18, underlyingAssetForSymbol('eth:alt')),
  ofcerc20('45824966-9b29-4805-8c98-f0f21b63668f', 'ofceth:eco', 'ECO', 18, underlyingAssetForSymbol('eth:eco')),
  ofcerc20(
    'b75bff33-9720-469c-9ad7-f9f3c7b27f4d',
    'ofceth:rtbl',
    'Rolling T-bill',
    6,
    underlyingAssetForSymbol('eth:rtbl')
  ),
  ofcerc20(
    '2bd66ef0-5767-4739-baf4-0eb862e5675e',
    'ofceth:usd1',
    'USD1',
    18,
    underlyingAssetForSymbol('eth:usd1'),
    undefined,
    [CoinFeature.STABLECOIN]
  ),
  ofcerc20(
    'dc5d090c-6677-4e6c-9b2c-da42ed1cf3fb',
    'ofceth:sofid',
    'SoFiUSD',
    6,
    underlyingAssetForSymbol('eth:sofid'),
    undefined,
    [CoinFeature.STABLECOIN]
  ),
  ofcerc20(
    '43e6a63a-2014-493d-b98c-b5ab10c6e5bb',
    'ofceth:cusd',
    'Catholic USD',
    6,
    underlyingAssetForSymbol('eth:cusd'),
    undefined,
    [CoinFeature.STABLECOIN]
  ),
  ofcerc20(
    'e518b37f-a24a-454c-bbbf-eddc75de68f0',
    'ofceth:fyusd',
    'FYUSD',
    6,
    underlyingAssetForSymbol('eth:fyusd'),
    undefined,
    [CoinFeature.STABLECOIN]
  ),
  ofcerc20(
    '80bfa43e-f01c-42bd-bd14-269b88948bbf',
    'ofceth:usdg',
    'Global Dollar',
    6,
    underlyingAssetForSymbol('eth:usdg'),
    undefined,
    [CoinFeature.STABLECOIN]
  ),
  ofcerc20(
    '597fa9d6-2cc5-451e-b964-c18ca41ef3df',
    'ofceth:cake',
    'PancakeSwap Token',
    18,
    underlyingAssetForSymbol('eth:cake')
  ),
  ofcerc20('82276898-2553-4cc7-b656-63d65ce72276', 'ofceth:nft', 'APENFT', 6, underlyingAssetForSymbol('eth:nft')),
  ofcerc20(
    '6ee6e08d-4bf3-4f6e-9505-9fd1a7931858',
    'ofceth:morpho',
    'Morpho Token',
    18,
    underlyingAssetForSymbol('eth:morpho')
  ),
  ofcerc20(
    'c60b56e8-68ea-4b4c-83a5-4c18116c66fa',
    'ofceth:usdd',
    'Decentralized USD',
    18,
    underlyingAssetForSymbol('eth:usdd'),
    undefined,
    [CoinFeature.STABLECOIN]
  ),
  ofcerc20('2732c732-1c77-4638-92a2-b2a6771e584b', 'ofceth:mx', 'MX Token', 18, underlyingAssetForSymbol('eth:mx')),
  ofcerc20(
    '46b59c47-1d86-4532-a1a3-c1f144219665',
    'ofceth:flz',
    'Fellaz Token',
    18,
    underlyingAssetForSymbol('eth:flz')
  ),
  ofcerc20(
    '58fbf8bd-21c0-471e-9fea-738c74f876ea',
    'ofceth:usd0',
    'Usual USD',
    18,
    underlyingAssetForSymbol('eth:usd0'),
    undefined,
    [CoinFeature.STABLECOIN]
  ),
  ofcerc20(
    'f0c97bb2-a778-4605-94d6-e3c82bf68821',
    'ofceth:white',
    'WhiteRock',
    18,
    underlyingAssetForSymbol('eth:white')
  ),
  ofcerc20('1e6d4305-17fa-4384-90c8-2ead39487fa1', 'ofceth:upc', 'UPCX', 5, underlyingAssetForSymbol('eth:upc')),
  ofcerc20(
    'ea9767c2-c853-40e3-9c13-996e9ba08773',
    'ofceth:lgct',
    'Legacy Token',
    18,
    underlyingAssetForSymbol('eth:lgct')
  ),
  ofcerc20(
    '291d2479-dfc5-4b20-bc64-bfeb8678e2e2',
    'ofceth:usdtb',
    'Ethena Labs USDtb',
    18,
    underlyingAssetForSymbol('eth:usdtb')
  ),
  ofcerc20(
    '4f5f7e1e-b595-4fab-897b-a9293e9578e6',
    'ofceth:deusd',
    'Elixir deUSD',
    18,
    underlyingAssetForSymbol('eth:deusd')
  ),
  ofcerc20(
    '62f1cd68-6ded-4bc8-8741-d15714f8d3c6',
    'ofceth:neiro',
    'Neiro (First Neiro On Ethereum)',
    9,
    underlyingAssetForSymbol('eth:neiro')
  ),
  ofcerc20('390fe96c-4b5c-4420-85d7-2dcfa9613bd5', 'ofceth:vana', 'Vana', 18, underlyingAssetForSymbol('eth:vana')),
  ofcerc20(
    '2af4bdb7-18eb-46d5-a31a-22e297f12de9',
    'ofceth:spxux',
    'WisdomTree 500 Digital Fund',
    18,
    underlyingAssetForSymbol('eth:spxux')
  ),
  ofcerc20('830c6c0f-b601-406b-a853-3a88ff85533d', 'ofceth:aleo', 'Aleo', 3, underlyingAssetForSymbol('eth:aleo')),
  ofcerc20(
    'c35c457f-2741-41aa-9c33-3a41f5ce6b1b',
    'ofceth:dbusd',
    'Deep Blue USD',
    6,
    underlyingAssetForSymbol('eth:dbusd')
  ),
  ofcerc20(
    'fe2f5c57-90e4-49e0-a635-b6f1cec0c750',
    'ofceth:edu',
    'Open Campus',
    18,
    underlyingAssetForSymbol('eth:edu')
  ),
  ofcerc20('b1466e8d-179e-491e-a25f-d6af291f0ee2', 'ofceth:telos', 'Telos', 18, underlyingAssetForSymbol('eth:telos')),
  ofcerc20(
    '7ed9a25b-86e8-49a8-932f-3c6b38ad2d42',
    'ofceth:cusdo',
    'Compounding Open Dollar',
    18,
    underlyingAssetForSymbol('eth:cusdo')
  ),
  ofcerc20('48851a8f-ed7b-4623-af1a-5c3c44258484', 'ofceth:vice', 'VICE', 18, underlyingAssetForSymbol('eth:vice')),
  ofcerc20('b9ba422b-d02a-4722-8b35-140cccb28ab0', 'ofceth:god', 'GOD Coin', 18, underlyingAssetForSymbol('eth:god')),
  ofcerc20('6d34cd07-5676-4d5e-b117-f7d152cf7131', 'ofceth:sky', 'Sky', 18, underlyingAssetForSymbol('eth:sky')),
  ofcerc20(
    '393b3e93-e9d1-4c86-bf00-9d453be41758',
    'ofceth:move',
    'Movement Network',
    8,
    underlyingAssetForSymbol('eth:move')
  ),
  ofcerc20('098c9adb-469b-44e8-a327-b7099797888e', 'ofceth:fuel', 'Fuel', 9, underlyingAssetForSymbol('eth:fuel')),
  ofcerc20('12ef69e3-a6a2-484b-9977-615c7dab9ef3', 'ofceth:pyr', 'PYR', 18, underlyingAssetForSymbol('eth:pyr')),
  ofcerc20('f93561d5-8e67-4165-bf92-34d97d6f96a5', 'ofceth:ibtc', 'iBTC', 8, underlyingAssetForSymbol('eth:ibtc')),
  ofcerc20(
    'a696dd96-77e2-483e-b8ff-057bc3332ff9',
    'ofceth:una',
    'Unagi Token',
    18,
    underlyingAssetForSymbol('eth:una')
  ),
  ofcerc20('5a894d9e-6b32-4b61-992b-cc684dcc01dd', 'ofceth:ads', 'Alkimi', 18, underlyingAssetForSymbol('eth:ads')),
  ofcerc20(
    '223902a4-2c32-4366-9164-6bd8dc338569',
    'ofceth:fuelv1',
    'Fuel v1',
    18,
    underlyingAssetForSymbol('eth:fuelv1')
  ),
  ofcerc20(
    '26fbd57c-e0f9-4cbe-a31a-68cfd0e341ae',
    'ofceth:cet',
    'CoinEx Token',
    18,
    underlyingAssetForSymbol('eth:cet')
  ),
  ofcerc20(
    'e6d51d14-edd1-4fe3-9a6a-4ccc8f76f1ad',
    'ofceth:unio',
    'UNIO Coin',
    18,
    underlyingAssetForSymbol('eth:unio')
  ),
  ofcerc20(
    '07c75048-fc9a-4d5f-841e-6d9c40fcc8ba',
    'ofceth:flttx',
    'WisdomTree Floating Rate Treasury Digital Fund',
    18,
    underlyingAssetForSymbol('eth:flttx')
  ),
  ofcerc20(
    'b6b2477c-0b79-413e-8669-3c999715fef8',
    'ofceth:wtsix',
    'WisdomTree Short-Duration Income Digital Fund',
    18,
    underlyingAssetForSymbol('eth:wtsix')
  ),
  ofcerc20(
    '08411905-993b-4c48-b206-bdfb6f022eb3',
    'ofceth:modrx',
    'WisdomTree Siegel Moderate Digital Fund',
    18,
    underlyingAssetForSymbol('eth:modrx')
  ),
  ofcerc20(
    '77696898-511c-43eb-9dac-094fd6009b4b',
    'ofceth:techx',
    'WisdomTree Technology & Innovation 100 Digital Fund',
    18,
    underlyingAssetForSymbol('eth:techx')
  ),
  ofcerc20(
    '7baa22a4-909c-49b1-a81e-d462a5b2d787',
    'ofceth:wtsyx',
    'WisdomTree Short-Term Treasury Digital Fund',
    18,
    underlyingAssetForSymbol('eth:wtsyx')
  ),
  ofcerc20(
    'dfd5e05b-c2ed-4d2f-bb57-b0ab8da7e11f',
    'ofceth:wtlgx',
    'WisdomTree Long Term Treasury Digital Fund',
    18,
    underlyingAssetForSymbol('eth:wtlgx')
  ),
  ofcerc20(
    '2a630a07-4208-42b6-bd93-d5c81e4dfaed',
    'ofceth:wttsx',
    'WisdomTree 3-7 Year Treasury Digital Fund',
    18,
    underlyingAssetForSymbol('eth:wttsx')
  ),
  ofcerc20(
    '2738802a-3d4f-43bf-9b33-e57f4ee80502',
    'ofceth:tipsx',
    'WisdomTree TIPS Digital Fund',
    18,
    underlyingAssetForSymbol('eth:tipsx')
  ),
  ofcerc20(
    '036bc1fa-211a-40b4-bbbf-0441fe2a9818',
    'ofceth:wtstx',
    'WisdomTree 7-10 Year Treasury Digital Fund',
    18,
    underlyingAssetForSymbol('eth:wtstx')
  ),
  ofcerc20(
    '6a713449-fbdd-423c-8bb1-f73d2ca4c23f',
    'ofceth:lngvx',
    'WisdomTree Siegel Longevity Digital Fund',
    18,
    underlyingAssetForSymbol('eth:lngvx')
  ),
  ofcerc20(
    '21a84f93-d828-423b-8644-432e0e49f2e7',
    'ofceth:eqtyx',
    'WisdomTree Siegel Global Equity Digital Fund',
    18,
    underlyingAssetForSymbol('eth:eqtyx')
  ),
  ofcerc20(
    'd3f1c5b2-8a6e-4c9b-9f3e-7d2a4e5b6c8d',
    'ofceth:deuro',
    'DecentralizedEURO',
    18,
    underlyingAssetForSymbol('eth:deuro')
  ),
  ofcerc20('a2159d62-1b1c-4e8b-ba43-332959015dbc', 'ofceth:usat', 'Tether America USD', 6, UnderlyingAsset['eth:usat']),
  ofcerc20(
    'e7b1c5d2-9e6e-4c9b-9f3e-2d2a4e5b6c8d',
    'ofceth:usdf',
    'Falcon USD',
    18,
    underlyingAssetForSymbol('eth:usdf')
  ),
  ofcerc20(
    'f9d2c5d2-8a6e-4c9b-9f3e-3d2a4e5b6c8d',
    'ofceth:ausd',
    'Agora Dollar',
    6,
    underlyingAssetForSymbol('eth:ausd')
  ),
  ofcerc20(
    'fd4cfe16-5228-4d92-9d87-5b8eaa1f89eb',
    'ofceth:ags',
    'Silver Standard',
    4,
    underlyingAssetForSymbol('eth:ags')
  ),
  ofcerc20(
    '54eff6b7-6db0-4ad3-9757-e232efc78d89',
    'ofceth:aus',
    'Gold Standard',
    4,
    underlyingAssetForSymbol('eth:aus')
  ),
  ofcerc20(
    'a1e3c5d2-7b6e-4c9b-9f3e-4d2a4e5b6c8d',
    'ofceth:gaia',
    'Gaia Token',
    18,
    underlyingAssetForSymbol('eth:gaia')
  ),
  ofcerc20(
    '282045b5-9394-4995-990d-a14b08931ea6',
    'ofceth:benji',
    'Franklin OnChain U.S. Government Money Fund',
    18,
    underlyingAssetForSymbol('eth:benji')
  ),
  ofcerc20(
    '6d17f939-52f6-4aee-9f2d-201fa4464f4c',
    'ofceth:ibenji',
    'Franklin OnChain Institutional Liquidity Fund Ltd.',
    18,
    underlyingAssetForSymbol('eth:ibenji')
  ),
  ofcerc20(
    'c3a5c5d2-5d6e-4c9b-9f3e-6d2a4e5b6c8d',
    'ofceth:usds',
    'USDS',
    18,
    underlyingAssetForSymbol('eth:usds'),
    undefined,
    [CoinFeature.STABLECOIN]
  ),
  ofcerc20('b4aed05b-b667-4b1e-b88e-19219989c1e4', 'ofceth:perc', 'Perion', 18, underlyingAssetForSymbol('eth:perc')),
  ofcerc20('d6ba9776-1b5b-4364-8afd-594363a01ec1', 'ofceth:cfg', 'Centrifuge', 18, underlyingAssetForSymbol('eth:cfg')),
  ofcerc20('d3ec2f84-fa4d-42a7-85f2-7d0e932b3bb0', 'ofceth:plume', 'Plume', 18, underlyingAssetForSymbol('eth:plume')),
  ofcerc20(
    'c9d7345b-11e7-40df-9795-942149b393bd',
    'ofceth:vbill',
    'VanEck Treasury Fund',
    6,
    underlyingAssetForSymbol('eth:vbill')
  ),
  ofcerc20('cfac6025-2aa2-429a-b144-9ea5c952a93a', 'ofceth:la', 'Lagrange', 18, underlyingAssetForSymbol('eth:la')),
  ofcerc20('395fa727-b5eb-4fd8-ba91-1c257b94624d', 'ofceth:es', 'Eclipse', 6, underlyingAssetForSymbol('eth:es')),
  ofcerc20(
    '2270befd-a97d-4e6e-a540-6d19bd0a08e7',
    'ofceth:ctrl',
    'Ctrl Wallet',
    18,
    underlyingAssetForSymbol('eth:ctrl')
  ),
  ofcerc20('4d2f98ef-557c-42d6-bf60-8831a0221a5c', 'ofceth:towns', 'Towns', 18, underlyingAssetForSymbol('eth:towns')),
  ofcerc20(
    'f87db929-734f-4482-8c4c-eddcdf25ac59',
    'ofceth:chex',
    'Chintai Exchange Token',
    18,
    underlyingAssetForSymbol('eth:chex')
  ),
  ofcerc20('0c2aab6d-ae2b-45a0-920e-5daa17951d62', 'ofceth:gho', 'GHO', 18, underlyingAssetForSymbol('eth:gho')),
  ofcerc20(
    'bacfffac-926a-41e9-95e2-23f354548dea',
    'ofceth:npc',
    'Non-Playable Coin',
    18,
    underlyingAssetForSymbol('eth:npc')
  ),
  ofcerc20(
    '9081e77f-ccca-48b6-8b51-de73849042dc',
    'ofceth:umint',
    'UBS uMINT',
    18,
    underlyingAssetForSymbol('eth:umint')
  ),
  ofcerc20('f89abeb4-6566-4a16-9cb6-54c607467602', 'ofceth:arb', 'Arbitrum', 18, underlyingAssetForSymbol('eth:arb')),
  ofcerc20('6aa08f88-50ef-4fd9-b386-bd9cf10a12c7', 'ofceth:ez', 'EasyFi', 18, underlyingAssetForSymbol('eth:ez')),
  ofcerc20(
    '76c39793-f54e-427c-b7f7-0be1cf0960d9',
    'ofceth:ncash',
    'Nucleus Vision',
    18,
    underlyingAssetForSymbol('eth:ncash')
  ),
  ofcerc20('490d7928-cb00-4b38-81ce-99778e0c1e15', 'ofceth:sub', 'Substratum', 18, underlyingAssetForSymbol('eth:sub')),
  ofcerc20('109574cf-0eba-40c8-a988-0d990e2d1936', 'ofceth:poe', 'Po.et', 8, underlyingAssetForSymbol('eth:poe')),
  ofcerc20('0cb66151-195b-4e3e-b6f8-e9fa953fb5dc', 'ofceth:ocn', 'Odyssey', 18, underlyingAssetForSymbol('eth:ocn')),
  ofcerc20('1d5bea63-7976-48be-b557-7644631e13d3', 'ofceth:banca', 'Banca', 18, underlyingAssetForSymbol('eth:banca')),
  ofcerc20('a5f7e552-54b6-4dde-b070-b3c42ce09d5d', 'ofceth:stq', 'Storiqa', 18, underlyingAssetForSymbol('eth:stq')),
  ofcerc20(
    'd91868c4-f7c3-42ca-a954-06e4fb69b26c',
    'ofceth:route',
    'Router Protocol (New)',
    18,
    underlyingAssetForSymbol('eth:route')
  ),
  ofcerc20('8d778a3b-7537-4333-97b4-9244078ae37c', 'ofceth:sc', 'SteelCoin', 18, underlyingAssetForSymbol('eth:sc')),
  ofcerc20('827a39b3-0124-4667-b1ed-f939dc7bb86f', 'ofceth:lf', 'LF labs', 18, underlyingAssetForSymbol('eth:lf')),
  ofcerc20(
    '6386ef1a-db83-419b-be2f-0a7a3626e259',
    'ofceth:usdcv',
    'USD CoinVertible',
    18,
    underlyingAssetForSymbol('eth:usdcv')
  ),
  ofcerc20(
    'a3c19279-9fb5-41b5-ad01-4562fdbd6d33',
    'ofceth:eurau',
    'AllUnity EUR',
    6,
    underlyingAssetForSymbol('eth:eurau')
  ),
  ofcerc20(
    '650f3a39-cbee-48e7-8aeb-eaa181d3f11c',
    'ofceth:insur',
    'InsurAce',
    18,
    underlyingAssetForSymbol('eth:insur')
  ),
  ofcerc20('c425f078-b338-454c-90bb-b0221df909db', 'ofceth:xyo', 'XY Oracle', 18, underlyingAssetForSymbol('eth:xyo')),
  ofcerc20('54852e5b-e999-42e1-a912-ecd38bf98462', 'ofceth:zig', 'ZigChain', 18, underlyingAssetForSymbol('eth:zig')),
  ofcerc20(
    'ff192a0b-98b5-426c-98eb-f37f0ae1be55',
    'ofceth:swftc',
    'SwftCoin',
    8,
    underlyingAssetForSymbol('eth:swftc')
  ),
  ofcerc20(
    '53616a73-ad08-489d-89be-836db39241d9',
    'ofceth:dsync',
    'Destra Network',
    18,
    underlyingAssetForSymbol('eth:dsync')
  ),
  ofcerc20('06e2e41d-999e-4875-bcb0-023720be67b3', 'ofceth:orbr', 'Orbler', 18, underlyingAssetForSymbol('eth:orbr')),
  ofcerc20(
    '2b60bae4-3f71-4f8f-8013-9c2f18128e7f',
    'ofceth:sxt',
    'Space and Time',
    18,
    underlyingAssetForSymbol('eth:sxt')
  ),
  ofcerc20('47325d7e-bb7f-44fe-8153-6754b7aac296', 'ofceth:paal', 'PAAL AI', 9, underlyingAssetForSymbol('eth:paal')),
  ofcerc20(
    '76ca0cbc-8fef-4214-8376-f18142bd9ba7',
    'ofceth:wmtx',
    'WorldMobile Token',
    6,
    underlyingAssetForSymbol('eth:wmtx')
  ),
  ofcerc20(
    'cbf90de8-530b-4844-b443-6017e5b03868',
    'ofceth:anime',
    'Animecoin',
    18,
    underlyingAssetForSymbol('eth:anime')
  ),
  ofcerc20('7b243fe0-983b-4c6c-a781-b1cc4ad410cc', 'ofceth:newt', 'Newton', 18, underlyingAssetForSymbol('eth:newt')),
  ofcerc20(
    '12bad7a8-28d4-4d5d-9481-eeb90d9b08a2',
    'ofceth:hsk',
    'HashKey Platform Token',
    18,
    underlyingAssetForSymbol('eth:hsk')
  ),
  ofcerc20('a96cc1dd-59ea-464f-9530-64cc5fc2af34', 'ofceth:rog', 'ROGIN.AI', 18, underlyingAssetForSymbol('eth:rog')),
  ofcerc20(
    'ff07a861-2241-46e5-ae71-3507750ba6a7',
    'ofceth:xaum',
    'Matrixdock Gold',
    18,
    underlyingAssetForSymbol('eth:xaum')
  ),
  ofcerc20('4dc35e5d-2f92-49de-a873-f61b0712290a', 'ofceth:dolo', 'Dolomite', 18, underlyingAssetForSymbol('eth:dolo')),
  ofcerc20('a820df78-51fd-4918-b155-2518b7c21409', 'ofceth:avail', 'Avail', 18, underlyingAssetForSymbol('eth:avail')),
  ofcerc20('0ca74cc5-fc6f-4119-9678-bbed45f5040d', 'ofceth:era', 'Caldera', 18, underlyingAssetForSymbol('eth:era')),
  ofcerc20(
    '281ef8e9-d67f-4a53-9d43-88dd9c812803',
    'ofceth:usdo',
    'OpenEden Open Dollar',
    18,
    underlyingAssetForSymbol('eth:usdo')
  ),
  ofcerc20('c099e464-f464-4d7c-8e6b-3dee55d95837', 'ofceth:vsn', 'Vision', 18, underlyingAssetForSymbol('eth:vsn')),
  ofcerc20(
    '42f3a70b-2070-45d4-ac52-9fb676d3337b',
    'ofceth:shx',
    'Stronghold SHx',
    7,
    underlyingAssetForSymbol('eth:shx')
  ),
  ofcerc20('6ad8cc28-3c63-4d77-9488-87c6935b3cf8', 'ofceth:slay', 'SatLayer', 6, underlyingAssetForSymbol('eth:slay')),
  ofcerc20('e1a2fff8-5a33-4873-9231-6289eec23a9d', 'ofceth:mxnb', 'MXNB', 6, underlyingAssetForSymbol('eth:mxnb')),
  ofcerc20(
    '7ea68985-aaff-4094-affa-4a421f7734fb',
    'ofceth:hwhlp',
    'Hyperwave HLP',
    6,
    underlyingAssetForSymbol('eth:hwhlp')
  ),
  ofcerc20(
    '9af2408f-111a-4876-83be-49e46863b7b5',
    'ofceth:mxnd',
    'Mexican Digital Peso',
    6,
    underlyingAssetForSymbol('eth:mxnd')
  ),
  ofcerc20(
    'e77c2162-3927-4194-b525-fe79895dd314',
    'ofceth:bio',
    'Bio Protocol',
    18,
    underlyingAssetForSymbol('eth:bio')
  ),
  ofcerc20(
    'e2f6955d-7c74-4459-9e8d-738d692fa3d1',
    'ofceth:prove',
    'Succinct',
    18,
    underlyingAssetForSymbol('eth:prove')
  ),
  ofcerc20('bbe4893d-be4d-4126-b5e7-21bee4341c3b', 'ofceth:zrc', 'Zircuit', 18, underlyingAssetForSymbol('eth:zrc')),
  ofcerc20(
    '8da43f86-4bf5-48ef-bf80-3c81b604c3e4',
    'ofceth:open',
    'OpenLedger',
    18,
    underlyingAssetForSymbol('eth:open')
  ),
  ofcerc20(
    '8ab7252f-a586-4d18-8631-d5dedf2a8024',
    'ofceth:mbg',
    'MultiBank Group',
    18,
    underlyingAssetForSymbol('eth:mbg')
  ),
  ofcerc20('c2b381d1-795f-4c27-bc3a-322757dd7938', 'ofceth:rekt', 'Rekt', 18, underlyingAssetForSymbol('eth:rekt')),

  // Mantle Network tokens
  ofcerc20(
    '93c6e145-9c35-4ef9-aa28-5498b9e23c9d',
    'ofcmantle:usdt',
    'USDT',
    6,
    underlyingAssetForSymbol('mantle:usdt')
  ),
  ofcerc20(
    '058cb406-168d-4d76-9393-2d010ff7600e',
    'ofcmantle:usdc',
    'USDC',
    6,
    underlyingAssetForSymbol('mantle:usdc')
  ),
  ofcerc20(
    '2b0ecf3d-fe95-4c95-bf53-bc4bb8f6265b',
    'ofcmantle:usde',
    'USDe',
    18,
    underlyingAssetForSymbol('mantle:usde')
  ),
  ofcerc20(
    '48cf8c79-d8e3-4889-be2d-2419ce85eabf',
    'ofcmantle:usdt0',
    'USDT0',
    6,
    underlyingAssetForSymbol('mantle:usdt0')
  ),
  ofcerc20(
    '93264efe-c5c3-4f53-91d4-6871ecb579d8',
    'ofcmantle:ausd',
    'AUSD',
    6,
    underlyingAssetForSymbol('mantle:ausd')
  ),
  ofcerc20(
    'e304dde3-8782-4e54-b6e7-c0080d1ea485',
    'ofcmantle:usd1',
    'USD1',
    18,
    underlyingAssetForSymbol('mantle:usd1')
  ),
  // New ETH OFC tokens
  ofcerc20('a5357ba2-5a2a-4d73-8f65-e01b9158ea9c', 'ofceth:resolv', 'Resolv', 18, UnderlyingAsset['eth:resolv']),
  ofcerc20('5485e380-c3df-49ab-98f2-9c4d3f37f2fb', 'ofceth:spec', 'Spectral', 18, UnderlyingAsset['eth:spec']),
  ofcerc20('8e52ca73-1860-43e5-98d6-49c5f34b8da2', 'ofceth:prompt', 'Wayfinder', 18, UnderlyingAsset['eth:prompt']),
  ofcerc20('44a386ad-a9d4-4cb5-8f30-72128e618286', 'ofceth:reya', 'Reya', 18, underlyingAssetForSymbol('eth:reya')),
  ofcerc20('0edacb3a-b48a-4a6e-ae28-69f8b7a84bfa', 'ofceth:yb', 'YieldBasis', 18, UnderlyingAsset['eth:yb']),
  ofcerc20(
    'ff16374d-c3c8-4f1f-9cd2-5dab15c1f895',
    'ofceth:usdp',
    'USDP Stablecoin',
    18,
    underlyingAssetForSymbol('eth:usdp'),
    undefined,
    [CoinFeature.STABLECOIN]
  ),
  ofcerc20('dd95c7b9-2be8-4471-920d-40e1fd583bf3', 'ofceth:grtx', 'GreatX', 6, underlyingAssetForSymbol('eth:grtx')),
  // New Base OFC tokens
  ofcerc20(
    'b096690d-92fd-4f02-83d6-e26a1ff393f3',
    'ofcbaseeth:b3',
    'B3',
    18,
    UnderlyingAsset['baseeth:b3'],
    undefined,
    undefined,
    '',
    undefined,
    undefined,
    true,
    'baseeth'
  ),
  ofcerc20(
    '24f6d6b1-524b-4945-8a36-15f60c3bad75',
    'ofcbaseeth:kaito',
    'Kaito',
    18,
    UnderlyingAsset['baseeth:kaito'],
    undefined,
    undefined,
    '',
    undefined,
    undefined,
    true,
    'baseeth'
  ),
];

export const tOfcErc20Coins = [
  tofcerc20('055ebe86-72cc-4f0e-b46f-c517d8e3687a', 'ofcterc', 'Test ERC Token', 18, UnderlyingAsset.TERC),
  tofcerc20('ac822eb1-4aa0-40d2-836d-7a24db24d47a', 'ofctest', 'Test Mintable ERC20 Token', 18, UnderlyingAsset.TEST),
  tofcerc20(
    '67b3f68b-a0bd-4bd7-b67e-36e8220bf67e',
    'ofcterc18dp13',
    'Test ERC Token 18 decimals',
    18,
    UnderlyingAsset.TERC18DP13,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    'gteth'
  ),
  tofcerc20(
    '3abd55f9-c3c7-4810-8ff4-bc31a3d0fc69',
    'ofcterc18dp14',
    'Test ERC Token 18 decimals',
    18,
    UnderlyingAsset.TERC18DP14,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    'gteth'
  ),
  tofcerc20(
    'bffc55db-1f40-4e9e-857e-b591ac86d9b3',
    'ofcterc18dp15',
    'Test ERC Token 18 decimals',
    18,
    UnderlyingAsset.TERC18DP15,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    'gteth'
  ),
  tofcerc20(
    '4144a64f-eacd-4df1-a482-72e9c0d976ff',
    'ofchterc18dp',
    'Test ERC Token 18 decimals',
    18,
    UnderlyingAsset.TERC18DP,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    'hteth'
  ),
  tofcerc20(
    'e34cd75e-62dc-4453-a282-577e407bdb95',
    'ofchterc6dp',
    'Test ERC Token 6 decimals',
    6,
    UnderlyingAsset.TERC6DP,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    'hteth'
  ),
  tofcerc20(
    '5f83eaf5-9ba2-4aee-8d6a-b97bf2669edb',
    'ofctusds',
    'Holesky Testnet USD Standard',
    6,
    UnderlyingAsset.TUSDS,
    undefined,
    [CoinFeature.STABLECOIN],
    undefined,
    undefined,
    undefined,
    undefined,
    'hteth'
  ),
  tofcerc20(
    '0c90af13-2b65-4c13-ae1f-101531aa8e9b',
    'ofctgousd',
    'Hoodi Testnet GoUSD',
    6,
    UnderlyingAsset.TGOUSD,
    undefined,
    [CoinFeature.STABLECOIN],
    undefined,
    undefined,
    undefined,
    undefined,
    'hteth'
  ),
  tofcerc20(
    'c1d2c09d-ac71-4cf6-9683-90d93b6afa09',
    'ofchteth:stgusd1',
    'Test USD1 Token',
    18,
    UnderlyingAsset['hteth:stgusd1'],
    undefined,
    [CoinFeature.STABLECOIN],
    undefined,
    undefined,
    undefined,
    undefined,
    'hteth'
  ),
  tofcerc20(
    '145b2e09-453d-4861-8f54-5791d295bd96',
    'ofchteth:stgsofid',
    'Test SoFiUSD',
    6,
    UnderlyingAsset['hteth:stgsofid'],
    undefined,
    [CoinFeature.STABLECOIN],
    undefined,
    undefined,
    undefined,
    undefined,
    'hteth'
  ),
  tofcerc20(
    '72358644-ece4-41fd-9269-8d0bce6ff8cd',
    'ofchteth:tsteth',
    'Hoodi Testnet STETH',
    18,
    UnderlyingAsset['hteth:tsteth'],
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    'hteth'
  ),
  tofcerc20(
    'f0fdaaaa-7587-4cc4-a2b3-875085d81ac8',
    'ofchteth:gousd',
    'Hoodi Testnet GoUSD',
    6,
    UnderlyingAsset['hteth:gousd'],
    undefined,
    [CoinFeature.STABLECOIN],
    undefined,
    undefined,
    undefined,
    undefined,
    'hteth'
  ),
  tofcerc20(
    '10c3d10e-d725-4a1c-9485-d467cc171b56',
    'ofchteth:grtx',
    'GreatX Token',
    6,
    UnderlyingAsset['hteth:grtx'],
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    'hteth'
  ),
  tofcerc20(
    '4dc4534c-72b8-4a68-a914-210dae1e5d4d',
    'ofchteth:usd1',
    'Test USD1 Token',
    18,
    UnderlyingAsset['hteth:usd1'],
    undefined,
    [CoinFeature.STABLECOIN],
    undefined,
    undefined,
    undefined,
    undefined,
    'hteth'
  ),
  tofcerc20(
    '8e8028cb-855e-4cd7-8f7e-a00c63f0727c',
    'ofchteth:sofid',
    'Test SoFiUSD',
    6,
    UnderlyingAsset['hteth:sofid'],
    undefined,
    [CoinFeature.STABLECOIN],
    undefined,
    undefined,
    undefined,
    undefined,
    'hteth'
  ),
  tofcerc20(
    '7a14ba73-dfce-4f76-b0ff-563f2d3c47a8',
    'ofchteth:cusd',
    'Test Catholic USD',
    6,
    UnderlyingAsset['hteth:cusd'],
    undefined,
    [CoinFeature.STABLECOIN],
    undefined,
    undefined,
    undefined,
    undefined,
    'hteth'
  ),
  tofcerc20(
    'a7c586b2-6471-4874-9856-e24cb56db132',
    'ofchteth:fyusd',
    'Test FYUSD',
    6,
    UnderlyingAsset['hteth:fyusd'],
    undefined,
    [CoinFeature.STABLECOIN],
    undefined,
    undefined,
    undefined,
    undefined,
    'hteth'
  ),
  tofcerc20(
    'befb8fc3-03e8-4d63-8da6-d4013f346149',
    'ofchteth:stgcusd',
    'Test Catholic USD',
    6,
    UnderlyingAsset['hteth:stgcusd'],
    undefined,
    [CoinFeature.STABLECOIN],
    undefined,
    undefined,
    undefined,
    undefined,
    'hteth'
  ),
  tofcerc20(
    '9a56cdc4-25bd-47e9-93f6-0e8f463c4afd',
    'ofchteth:stgfyusd',
    'Test FYUSD',
    6,
    UnderlyingAsset['hteth:stgfyusd'],
    undefined,
    [CoinFeature.STABLECOIN],
    undefined,
    undefined,
    undefined,
    undefined,
    'hteth'
  ),
  tofcerc20(
    'bf6a1c7b-eed7-46af-85ec-0adc09aa72d6',
    'ofchteth:aut',
    'Holesky Testnet AllUnity',
    6,
    UnderlyingAsset['hteth:aut'],
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    'hteth'
  ),

  ofcerc20(
    'cc2a92cf-d799-463b-b08c-e9a4d5e87934',
    'ofceth:0x0',
    'Wrapped 0x0.ai',
    9,
    underlyingAssetForSymbol('eth:0x0')
  ),

  ofcerc20(
    '007227e5-8762-4f9c-b152-85caf62e34a7',
    'ofceth:vvs',
    'Wrapped VVS',
    18,
    underlyingAssetForSymbol('eth:vvs')
  ),

  ofcerc20(
    '509f5815-1db1-4a59-8cc2-da4d5a1eabee',
    'ofceth:bmx',
    'Wrapped BitMart Token',
    18,
    underlyingAssetForSymbol('eth:bmx')
  ),

  ofcerc20(
    '3aa503a5-d559-4b87-b6b9-defc277e8e33',
    'ofceth:pro',
    'Wrapped Propy',
    8,
    underlyingAssetForSymbol('eth:pro')
  ),

  ofcerc20(
    '8865c4a5-a4a6-4256-b0a0-71e0fb25ee32',
    'ofceth:prime',
    'Wrapped Echelon Prime',
    18,
    underlyingAssetForSymbol('eth:prime')
  ),

  ofcerc20(
    '2c4ec5c2-9403-486d-b389-c2d034650653',
    'ofceth:pokt',
    'Wrapped Pocket Network',
    6,
    underlyingAssetForSymbol('eth:pokt')
  ),

  ofcerc20(
    '9284c8a3-e1bd-4b34-ad08-1366af0ba57b',
    'ofceth:prism',
    'Portfolio of Risk-adjusted Investment Strategy Mix',
    18,
    UnderlyingAsset['eth:prism']
  ),

  ofcerc20(
    'de8fe485-c227-4ee3-a7c4-09ddea2ee81b',
    'ofceth:lon',
    'Wrapped Tokenlon Network',
    18,
    underlyingAssetForSymbol('eth:lon')
  ),

  ofcerc20(
    '5397b444-803e-4344-9556-c8ab5305994e',
    'ofceth:rlb',
    'Wrapped Rollbit Coin',
    18,
    underlyingAssetForSymbol('eth:rlb')
  ),

  ofcerc20(
    '6e606723-cf78-4a5c-90c0-c1925dc88094',
    'ofceth:neiro2',
    'Wrapped Neiro Ethereum',
    9,
    underlyingAssetForSymbol('eth:neiro2')
  ),

  ofcerc20(
    '20011fd9-162a-4534-b4be-f0088f4b51a0',
    'ofceth:sign',
    'Wrapped Sign',
    18,
    underlyingAssetForSymbol('eth:sign')
  ),

  // Ondo Tokenized Assets
  ofcerc20(
    'e92a9558-f1d8-4293-9fc6-449d7e5a4e3e',
    'ofceth:qqqon',
    'Invesco QQQ (Ondo Tokenized)',
    18,
    underlyingAssetForSymbol('eth:qqqon')
  ),

  ofcerc20(
    'a485d7b9-21c6-4d2f-8c1a-9bc123b6d742',
    'ofceth:spyon',
    'SPDR S&P 500 ETF (Ondo Tokenized)',
    18,
    underlyingAssetForSymbol('eth:spyon')
  ),

  ofcerc20(
    '37b8f45c-6e9d-4821-a938-2d765b6fecd3',
    'ofceth:nvdaon',
    'NVIDIA (Ondo Tokenized)',
    18,
    underlyingAssetForSymbol('eth:nvdaon')
  ),

  ofcerc20(
    'c3a1e8d7-5f4b-412c-8a8d-7b9c4e3f2d1a',
    'ofceth:tslaon',
    'Tesla (Ondo Tokenized)',
    18,
    underlyingAssetForSymbol('eth:tslaon')
  ),

  ofcerc20(
    'f8a7e6d5-c4b3-4a1d-8e8f-7b6c5a4d3e2b',
    'ofceth:aaplon',
    'Apple (Ondo Tokenized)',
    18,
    underlyingAssetForSymbol('eth:aaplon')
  ),

  ofcerc20(
    '9e8d7c6b-5a4f-42cd-9b0a-9c8f7e6d5a4b',
    'ofceth:mstron',
    'MicroStrategy (Ondo Tokenized)',
    18,
    underlyingAssetForSymbol('eth:mstron')
  ),

  ofcerc20(
    'b1a9c8d7-e6f5-43ab-8c1d-0e9f8a7b6c5d',
    'ofceth:pltron',
    'Palantir Technologies (Ondo Tokenized)',
    18,
    underlyingAssetForSymbol('eth:pltron')
  ),

  ofcerc20(
    'd7c6b5a4-3e2f-40db-8a8c-7e6f5d4c3b2a',
    'ofceth:hoodon',
    'Robinhood Markets (Ondo Tokenized)',
    18,
    underlyingAssetForSymbol('eth:hoodon')
  ),

  ofcerc20(
    '7f6e5d4c-3b2a-40fe-8d8c-7b6a5f4e3d2c',
    'ofceth:crclon',
    'Circle Internet Group (Ondo Tokenized)',
    18,
    underlyingAssetForSymbol('eth:crclon')
  ),

  ofcerc20(
    'a9b8c7d6-e5f4-4d2c-8b0a-9e8d7f6c5b4a',
    'ofceth:coinon',
    'Coinbase (Ondo Tokenized)',
    18,
    underlyingAssetForSymbol('eth:coinon')
  ),

  ofcerc20(
    '5d4c3b2a-1f0e-4d8c-8b6a-5f4e3d2c1b0a',
    'ofceth:amznon',
    'Amazon (Ondo Tokenized)',
    18,
    underlyingAssetForSymbol('eth:amznon')
  ),

  ofcerc20(
    'e3d2c1b0-a9f8-46ed-8c4b-3a2f1d0e9c8b',
    'ofceth:googlon',
    'Alphabet Class A (Ondo Tokenized)',
    18,
    underlyingAssetForSymbol('eth:googlon')
  ),

  ofcerc20(
    '2c1b0a9e-8d7f-45ed-9c3b-2a1f0e9d8c7b',
    'ofceth:metaon',
    'Meta Platforms (Ondo Tokenized)',
    18,
    underlyingAssetForSymbol('eth:metaon')
  ),

  ofcerc20(
    'c7b6a5f4-e3d2-41b0-a9e8-d7f6e5d4c3b2',
    'ofceth:babaon',
    'Alibaba (Ondo Tokenized)',
    18,
    underlyingAssetForSymbol('eth:babaon')
  ),

  ofcerc20(
    '1b0a9e8d-7f6e-4d4c-8b2a-1f0e9d8c7b6a',
    'ofceth:msfton',
    'Microsoft (Ondo Tokenized)',
    18,
    underlyingAssetForSymbol('eth:msfton')
  ),

  ofcerc20(
    'f4e3d2c1-b0a9-48d7-96e5-d4c3b2a1f0e9',
    'ofceth:spgion',
    'S&P Global (Ondo Tokenized)',
    18,
    underlyingAssetForSymbol('eth:spgion')
  ),

  ofcerc20(
    'a1f0e9d8-c7b6-45f4-93d2-c1b0a9e8d7f6',
    'ofceth:tsmon',
    'Taiwan Semiconductor Manufacturing (Ondo Tokenized)',
    18,
    underlyingAssetForSymbol('eth:tsmon')
  ),

  ofcerc20(
    '3b2a1f0e-9d8c-4b6a-8f4e-3d2c1b0a9e8d',
    'ofceth:amdon',
    'AMD (Ondo Tokenized)',
    18,
    underlyingAssetForSymbol('eth:amdon')
  ),

  ofcerc20(
    'd7f6e5d4-c3b2-41f0-99d8-c7b6a5f4e3d2',
    'ofceth:unhon',
    'UnitedHealth (Ondo Tokenized)',
    18,
    underlyingAssetForSymbol('eth:unhon')
  ),

  ofcerc20(
    '5f4e3d2c-1b0a-4e8d-8f6e-5d4c3b2a1f0e',
    'ofceth:jpmon',
    'JPMorgan Chase (Ondo Tokenized)',
    18,
    underlyingAssetForSymbol('eth:jpmon')
  ),

  ofcerc20(
    'e5d4c3b2-a1f0-49d8-87b6-a5f4e3d2c1b0',
    'ofceth:orclon',
    'Oracle (Ondo Tokenized)',
    18,
    underlyingAssetForSymbol('eth:orclon')
  ),

  ofcerc20(
    '9e8d7f6e-5d4c-4b2a-8f0e-9d8c7b6a5f4e',
    'ofceth:von',
    'Visa (Ondo Tokenized)',
    18,
    underlyingAssetForSymbol('eth:von')
  ),

  ofcerc20(
    '7b6a5f4e-3d2c-40ba-8e8d-7f6e5d4c3b2a',
    'ofceth:maon',
    'Mastercard (Ondo Tokenized)',
    18,
    underlyingAssetForSymbol('eth:maon')
  ),

  ofcerc20(
    'c1b0a9e8-d7f6-45d4-83b2-a1f0e9d8c7b6',
    'ofceth:llyon',
    'Eli Lilly (Ondo Tokenized)',
    18,
    underlyingAssetForSymbol('eth:llyon')
  ),

  ofcerc20(
    '3d2c1b0a-9e8d-46fe-8d4c-3b2a1f0e9d8c',
    'ofceth:nflxon',
    'Netflix (Ondo Tokenized)',
    18,
    underlyingAssetForSymbol('eth:nflxon')
  ),

  ofcerc20(
    'a5f4e3d2-c1b0-49e8-87f6-e5d4c3b2a1f0',
    'ofceth:coston',
    'Costco (Ondo Tokenized)',
    18,
    underlyingAssetForSymbol('eth:coston')
  ),

  ofcerc20(
    'f0e9d8c7-b6a5-44e3-82c1-b0a9e8d7f6e5',
    'ofceth:iauon',
    'iShares Gold Trust (Ondo Tokenized)',
    18,
    underlyingAssetForSymbol('eth:iauon')
  ),

  ofcerc20(
    'd4c3b2a1-f0e9-48c7-86a5-f4e3d2c1b0a9',
    'ofceth:ivvon',
    'iShares Core S&P 500 ETF (Ondo Tokenized)',
    18,
    underlyingAssetForSymbol('eth:ivvon')
  ),

  ofcerc20(
    '8c7b6a5f-4e3d-4c1b-9a9e-8d7f6e5d4c3b',
    'ofceth:slvon',
    'iShares Silver Trust (Ondo Tokenized)',
    18,
    underlyingAssetForSymbol('eth:slvon')
  ),

  ofcerc20(
    '4139c3f1-31ff-44b8-b503-893ee4d76242',
    'ofceth:ugold',
    'UGOLD Inc.',
    18,
    underlyingAssetForSymbol('eth:ugold')
  ),

  ofcerc20(
    'e6765d71-3200-45a4-9314-354e67443dfa',
    'ofceth:seda',
    'SEDA Protocol',
    18,
    underlyingAssetForSymbol('eth:seda')
  ),

  ofcerc20('2c3f951e-952e-4ed1-8f09-0af36092b29e', 'ofceth:enso', 'Enso', 18, underlyingAssetForSymbol('eth:enso')),

  ofcerc20(
    '1ffe161e-0388-4e6b-9f4e-84a855349563',
    'ofceth:hpp',
    'House Party Protocol',
    18,
    underlyingAssetForSymbol('eth:hpp')
  ),
  ofcerc20('e638abf5-a930-4f75-81b2-f82680bb2db6', 'ofceth:iwnon', 'iwnon', 18, underlyingAssetForSymbol('eth:iwnon')),
  ofcerc20(
    '4d1766ca-13c8-4eb3-afcf-a63d9123bec1',
    'ofceth:qbtson',
    'qbtson',
    18,
    underlyingAssetForSymbol('eth:qbtson')
  ),
  ofcerc20('059109b6-0f62-46d0-b28a-951c7ff67834', 'ofceth:tipon', 'tipon', 18, underlyingAssetForSymbol('eth:tipon')),
  ofcerc20('09c745df-8cc6-42bc-9599-237fd8adfc93', 'ofceth:ulon', 'ulon', 18, underlyingAssetForSymbol('eth:ulon')),
  ofcerc20(
    '4ac0b4ca-2475-429d-b268-53925969190a',
    'ofceth:itoton',
    'itoton',
    18,
    underlyingAssetForSymbol('eth:itoton')
  ),
  ofcerc20('07bb44b2-7f40-45d1-8af6-e02f504f098c', 'ofceth:hygon', 'hygon', 18, underlyingAssetForSymbol('eth:hygon')),
  ofcerc20('ade4c12f-b822-4f4c-91ce-2bf30b7f1781', 'ofceth:gmeon', 'gmeon', 18, underlyingAssetForSymbol('eth:gmeon')),
  ofcerc20('5c660285-f305-4d1e-b024-1f63bb0839b4', 'ofceth:pbron', 'pbron', 18, underlyingAssetForSymbol('eth:pbron')),
  ofcerc20(
    '4a056743-f3c6-422b-8dd7-b50bbe7594bf',
    'ofceth:eqixon',
    'eqixon',
    18,
    underlyingAssetForSymbol('eth:eqixon')
  ),
  ofcerc20(
    '97b8b652-1309-4a30-ac19-82f6d699b993',
    'ofceth:rioton',
    'rioton',
    18,
    underlyingAssetForSymbol('eth:rioton')
  ),
  ofcerc20(
    '4240efd6-92f8-4c33-9fec-e59d5a333468',
    'ofceth:maraon',
    'maraon',
    18,
    underlyingAssetForSymbol('eth:maraon')
  ),
  ofcerc20('5e83f933-dad9-48b0-8a01-88a9bd9cf384', 'ofceth:pfeon', 'pfeon', 18, underlyingAssetForSymbol('eth:pfeon')),
  ofcerc20('98b73768-2337-42a9-8211-f4af6f56f42c', 'ofceth:eemon', 'eemon', 18, underlyingAssetForSymbol('eth:eemon')),
  ofcerc20(
    '90daae9b-bd26-4e65-a77e-8bdcb59e3024',
    'ofceth:cmcsaon',
    'cmcsaon',
    18,
    underlyingAssetForSymbol('eth:cmcsaon')
  ),
  ofcerc20(
    '55e52e9c-23e7-44f6-8b92-df96e8efc719',
    'ofceth:sonyon',
    'sonyon',
    18,
    underlyingAssetForSymbol('eth:sonyon')
  ),
  ofcerc20(
    'e29d537b-7494-414c-b21e-ec0ef6c67190',
    'ofceth:pyplon',
    'pyplon',
    18,
    underlyingAssetForSymbol('eth:pyplon')
  ),
  ofcerc20(
    '61e9a3be-9d3f-409e-9d97-21b9cc7a575d',
    'ofceth:himson',
    'himson',
    18,
    underlyingAssetForSymbol('eth:himson')
  ),
  ofcerc20('65c4a6a8-d833-4f56-9c6d-16f0bea34a24', 'ofceth:abton', 'abton', 18, underlyingAssetForSymbol('eth:abton')),
  ofcerc20('4ece3a34-6067-405c-9eab-a6f856766630', 'ofceth:nvoon', 'nvoon', 18, underlyingAssetForSymbol('eth:nvoon')),
  ofcerc20('1abe3ec2-ed00-4409-8338-e73482e235fa', 'ofceth:efaon', 'efaon', 18, underlyingAssetForSymbol('eth:efaon')),
  ofcerc20('b7e9dd59-8c38-4150-a78f-ce326a93e833', 'ofceth:nkeon', 'nkeon', 18, underlyingAssetForSymbol('eth:nkeon')),
  ofcerc20(
    '8f12c91a-aebc-40fc-a419-e2566c7286da',
    'ofceth:intcon',
    'intcon',
    18,
    underlyingAssetForSymbol('eth:intcon')
  ),
  ofcerc20(
    '6acba325-02bf-427e-bcc3-8c5ab2475a8a',
    'ofceth:iefaon',
    'iefaon',
    18,
    underlyingAssetForSymbol('eth:iefaon')
  ),
  ofcerc20(
    '17ccb3f4-5274-4e1d-9cfc-4422870e4bf6',
    'ofceth:smcion',
    'smcion',
    18,
    underlyingAssetForSymbol('eth:smcion')
  ),
  ofcerc20(
    'd7cc3111-8b74-4e24-9af0-2bb64d423dda',
    'ofceth:mrvlon',
    'mrvlon',
    18,
    underlyingAssetForSymbol('eth:mrvlon')
  ),
  ofcerc20('e7cf3596-e6b7-417e-b5b8-8d30abff31b4', 'ofceth:aggon', 'aggon', 18, underlyingAssetForSymbol('eth:aggon')),
  ofcerc20(
    'b7e1369f-0491-42c3-9734-5a3fac89fd45',
    'ofceth:sbuxon',
    'sbuxon',
    18,
    underlyingAssetForSymbol('eth:sbuxon')
  ),
  ofcerc20(
    'c267fc24-7996-42f0-831e-cd9ebf9ea401',
    'ofceth:uberon',
    'uberon',
    18,
    underlyingAssetForSymbol('eth:uberon')
  ),
  ofcerc20(
    '570b96f3-aec0-4b8c-9915-325adb9a1f1c',
    'ofceth:abnbon',
    'abnbon',
    18,
    underlyingAssetForSymbol('eth:abnbon')
  ),
  ofcerc20(
    'd73c922d-9b73-4299-b5bc-618ac1f26ec4',
    'ofceth:qcomon',
    'qcomon',
    18,
    underlyingAssetForSymbol('eth:qcomon')
  ),
  ofcerc20(
    'b5a5153a-f3a8-428a-9934-1d87e4175dcc',
    'ofceth:cscoon',
    'cscoon',
    18,
    underlyingAssetForSymbol('eth:cscoon')
  ),
  ofcerc20(
    '8ddc4745-10a5-4d22-a604-ffe50605b70a',
    'ofceth:futuon',
    'futuon',
    18,
    underlyingAssetForSymbol('eth:futuon')
  ),
  ofcerc20('623afdd7-f270-466c-b363-dfd4679f7fde', 'ofceth:cmgon', 'cmgon', 18, underlyingAssetForSymbol('eth:cmgon')),
  ofcerc20('e9158ed1-f4a0-48ed-b84d-79e906f89fbe', 'ofceth:iwfon', 'iwfon', 18, underlyingAssetForSymbol('eth:iwfon')),
  ofcerc20('a04afcd4-14b2-47e6-8fa8-38043e55c5e0', 'ofceth:koon', 'koon', 18, underlyingAssetForSymbol('eth:koon')),
  ofcerc20('aa74a050-a8e0-4cd6-aa64-18468f7560d3', 'ofceth:linon', 'linon', 18, underlyingAssetForSymbol('eth:linon')),
  ofcerc20('1ba451ea-c9b5-401d-b161-87cd18fb2419', 'ofceth:armon', 'armon', 18, underlyingAssetForSymbol('eth:armon')),
  ofcerc20('2e57c654-fb08-4869-b545-bcb50d4431e4', 'ofceth:jdon', 'jdon', 18, underlyingAssetForSymbol('eth:jdon')),
  ofcerc20('e60e89f0-7d14-4815-9501-6720e67a04a7', 'ofceth:muon', 'muon', 18, underlyingAssetForSymbol('eth:muon')),
  ofcerc20('661c66fe-eb3b-4f43-b440-216e10a7bc38', 'ofceth:wmton', 'wmton', 18, underlyingAssetForSymbol('eth:wmton')),
  ofcerc20('3970ce50-fea4-4635-803a-6aa63b2a662a', 'ofceth:tmon', 'tmon', 18, underlyingAssetForSymbol('eth:tmon')),
  ofcerc20(
    'b1e56388-b03c-409a-8a77-74dba67ce079',
    'ofceth:shopon',
    'shopon',
    18,
    underlyingAssetForSymbol('eth:shopon')
  ),
  ofcerc20(
    '619804f7-9c43-444a-81a1-91832344f2d3',
    'ofceth:rddton',
    'rddton',
    18,
    underlyingAssetForSymbol('eth:rddton')
  ),
  ofcerc20('ea02c6fe-ded0-4da9-bc7b-684c97e21321', 'ofceth:dison', 'dison', 18, underlyingAssetForSymbol('eth:dison')),
  ofcerc20('d531c9c3-54de-4fa6-b317-6128492b771d', 'ofceth:apoon', 'apoon', 18, underlyingAssetForSymbol('eth:apoon')),
  ofcerc20('e7f18334-7e08-46a4-88f0-db5848d2b831', 'ofceth:pepon', 'pepon', 18, underlyingAssetForSymbol('eth:pepon')),
  ofcerc20('e82d49b1-f4dd-4edc-9a2b-0a2e6e75691e', 'ofceth:wfcon', 'wfcon', 18, underlyingAssetForSymbol('eth:wfcon')),
  ofcerc20(
    'a67c4f0a-71b8-4cf9-8060-ed5180cae497',
    'ofceth:biduon',
    'biduon',
    18,
    underlyingAssetForSymbol('eth:biduon')
  ),
  ofcerc20('1d1928f4-5ec8-414c-9820-abcb870d0a8e', 'ofceth:mson', 'mson', 18, underlyingAssetForSymbol('eth:mson')),
  ofcerc20('60fbfe73-555c-4f0e-8d94-ffd01ba448b9', 'ofceth:pgon', 'pgon', 18, underlyingAssetForSymbol('eth:pgon')),
  ofcerc20('2f45e033-f268-434b-b36b-fef009693803', 'ofceth:cvxon', 'cvxon', 18, underlyingAssetForSymbol('eth:cvxon')),
  ofcerc20(
    '0b6b3fb7-3756-4dad-80c1-581f7ae68f29',
    'ofceth:panwon',
    'panwon',
    18,
    underlyingAssetForSymbol('eth:panwon')
  ),
  ofcerc20(
    'd387be04-c260-47ca-b9c4-dad2dc343dab',
    'ofceth:avgoon',
    'avgoon',
    18,
    underlyingAssetForSymbol('eth:avgoon')
  ),
  ofcerc20('1532bd6c-2a38-429f-b834-d93329ffd3b3', 'ofceth:crmon', 'crmon', 18, underlyingAssetForSymbol('eth:crmon')),
  ofcerc20(
    'e7905f90-f2c7-4887-a5e4-d494c450332d',
    'ofceth:snowon',
    'snowon',
    18,
    underlyingAssetForSymbol('eth:snowon')
  ),
  ofcerc20('2be0986b-ccf7-4d2e-a010-120007e48484', 'ofceth:axpon', 'axpon', 18, underlyingAssetForSymbol('eth:axpon')),
  ofcerc20('36123a80-cf03-4a09-a316-a5aefb0f2b33', 'ofceth:ibmon', 'ibmon', 18, underlyingAssetForSymbol('eth:ibmon')),
  ofcerc20(
    'ba298da8-7595-4a3b-8854-ac0681c13a65',
    'ofceth:dashon',
    'dashon',
    18,
    underlyingAssetForSymbol('eth:dashon')
  ),
  ofcerc20('0d7b9f0e-cc0b-4d58-bed6-32d26c04a2f8', 'ofceth:acnon', 'acnon', 18, underlyingAssetForSymbol('eth:acnon')),
  ofcerc20('5c93f80e-c39d-4d0e-bb45-0c9c6158232f', 'ofceth:ijhon', 'ijhon', 18, underlyingAssetForSymbol('eth:ijhon')),
  ofcerc20('d668c146-c055-47a9-ae95-b73d529e72d4', 'ofceth:baon', 'baon', 18, underlyingAssetForSymbol('eth:baon')),
  ofcerc20('6244ebde-d917-4a86-b783-c07212613032', 'ofceth:geon', 'geon', 18, underlyingAssetForSymbol('eth:geon')),
  ofcerc20('5ec5f233-52df-40b2-bee4-23da396344e4', 'ofceth:appon', 'appon', 18, underlyingAssetForSymbol('eth:appon')),
  ofcerc20('9c19f271-f66c-4892-809d-38566043a06d', 'ofceth:lmton', 'lmton', 18, underlyingAssetForSymbol('eth:lmton')),
  ofcerc20(
    'b76c6d3d-952c-432e-94b0-2fd47fdb5191',
    'ofceth:intuon',
    'intuon',
    18,
    underlyingAssetForSymbol('eth:intuon')
  ),
  ofcerc20('978ae967-2911-4cf9-b086-62a2e3faaa21', 'ofceth:mcdon', 'mcdon', 18, underlyingAssetForSymbol('eth:mcdon')),
  ofcerc20('24552561-2fb5-4b17-9afa-9755826390dc', 'ofceth:gson', 'gson', 18, underlyingAssetForSymbol('eth:gson')),
  ofcerc20(
    '94ead874-a4d4-4453-a5aa-cdb5d6bb50d7',
    'ofceth:adbeon',
    'adbeon',
    18,
    underlyingAssetForSymbol('eth:adbeon')
  ),
  ofcerc20(
    '11506e59-d46b-4115-bd3d-f74405acb85a',
    'ofceth:spoton',
    'spoton',
    18,
    underlyingAssetForSymbol('eth:spoton')
  ),
  ofcerc20('05897dcf-f29c-47c7-8de1-5ed010b704e4', 'ofceth:blkon', 'blkon', 18, underlyingAssetForSymbol('eth:blkon')),
  ofcerc20(
    'e1e741ff-290d-4551-9a73-c6a445207dc9',
    'ofceth:asmlon',
    'asmlon',
    18,
    underlyingAssetForSymbol('eth:asmlon')
  ),
  ofcerc20('288e693a-741b-4798-9bb5-22a97419a605', 'ofceth:nowon', 'nowon', 18, underlyingAssetForSymbol('eth:nowon')),
  ofcerc20('10ae4d3b-eb79-47ac-a232-15fbd9d2661b', 'ofceth:iwmon', 'iwmon', 18, underlyingAssetForSymbol('eth:iwmon')),
  ofcerc20(
    'ebdce5e2-5f30-4d09-9df2-e42d799165bf',
    'ofceth:melion',
    'melion',
    18,
    underlyingAssetForSymbol('eth:melion')
  ),
  ofcerc20('63baa5b0-79f2-480e-8cf3-6f869fd250b6', 'ofceth:tlton', 'tlton', 18, underlyingAssetForSymbol('eth:tlton')),
  ofcerc20(
    'b3b4286f-98b0-4d40-8658-c79222ed0482',
    'ofceth:grndon',
    'grndon',
    18,
    underlyingAssetForSymbol('eth:grndon')
  ),
  ofcerc20('2b881a22-4137-4240-ba6d-ebf29973d081', 'ofceth:figon', 'figon', 18, underlyingAssetForSymbol('eth:figon')),
  ofcerc20(
    '3ec95730-e1b5-4636-9045-d1e339472160',
    'ofceth:iemgon',
    'iemgon',
    18,
    underlyingAssetForSymbol('eth:iemgon')
  ),
  ofcerc20(
    'e8657df3-8052-440d-ad01-715ae8dc007c',
    'ofceth:sbeton',
    'sbeton',
    18,
    underlyingAssetForSymbol('eth:sbeton')
  ),
  ofcerc20('5994291e-2d1b-4334-b7ae-0e361be85503', 'ofceth:six', 'SIX Token', 18, underlyingAssetForSymbol('eth:six')),
  ofcerc20('5cbbbf49-81ba-44cb-b317-05e2b5489ec3', 'ofceth:eden', 'OpenEden', 18, underlyingAssetForSymbol('eth:eden')),
  ofcerc20(
    'cbc6cf70-7f40-46e1-bbe9-86e181714da8',
    'ofceth:xeden',
    'Staked Eden',
    18,
    underlyingAssetForSymbol('eth:xeden')
  ),
  ofcerc20('40a579f5-f630-4898-82de-9fc3fd555747', 'ofceth:linea', 'linea', 18, underlyingAssetForSymbol('eth:linea')),
  ofcerc20('1bf5a8c6-fad7-47ff-87a1-56129d3b4c15', 'ofceth:ff', 'ff', 18, underlyingAssetForSymbol('eth:ff')),
  ofcerc20('9cfc5cf7-0a6b-40ec-936c-04be24e196c0', 'ofceth:mavia', 'mavia', 18, underlyingAssetForSymbol('eth:mavia')),
  ofcerc20('9ec6f38f-ce0e-4f8c-94f8-69d182f9c25e', 'ofceth:lm', 'lm', 18, underlyingAssetForSymbol('eth:lm')),
  ofcerc20('259c73b2-7c63-4522-96ee-9711442b45c8', 'ofceth:kub', 'kub', 18, underlyingAssetForSymbol('eth:kub')),
  ofcerc20(
    'c1776148-7f04-43b4-9ec9-74ea082111bd',
    'ofceth:frxusd',
    'frxusd',
    18,
    underlyingAssetForSymbol('eth:frxusd')
  ),
  ofcerc20('47f8db6a-d983-4a4b-b43a-fcd83d473a52', 'ofceth:red', 'red', 18, underlyingAssetForSymbol('eth:red')),
  ofcerc20('1eb11077-5b2d-4f17-9da7-93df043c1bd6', 'ofceth:dka', 'dka', 18, underlyingAssetForSymbol('eth:dka')),
  ofcerc20('5a3e3177-e3ee-43cb-bd39-567bb9022a16', 'ofceth:cgpt', 'cgpt', 18, underlyingAssetForSymbol('eth:cgpt')),
  ofcerc20('2e1671ee-1306-483b-b330-dbf52167121f', 'ofceth:apu', 'apu', 18, underlyingAssetForSymbol('eth:apu')),
  ofcerc20('9ce1f6d0-6a9a-45ec-b4ea-2e8d94d0b76d', 'ofceth:shfl', 'shfl', 18, underlyingAssetForSymbol('eth:shfl')),
  ofcerc20(
    '6b77a796-cb3b-4654-bd93-0d28db22e641',
    'ofceth:banana',
    'banana',
    18,
    underlyingAssetForSymbol('eth:banana')
  ),
  ofcerc20('768025b4-e38d-435c-af69-799522cda202', 'ofceth:aioz', 'aioz', 18, UnderlyingAsset['eth:aioz']),
  ofcerc20('d1fa53cb-7868-4699-9e86-853d9e017bfd', 'ofceth:lit', 'lighter', 18, UnderlyingAsset['eth:lit']),
  ofcerc20('a5d0e9f4-1b6c-4a7e-b2f8-3c9d5e0b7a6f', 'ofceth:aedz', 'zand aed', 6, UnderlyingAsset['eth:aedz']),
  ofcerc20(
    'b6e1f0a5-2c7d-4b8f-83a9-4d0e6f1c8b7a',
    'ofceth:arm-susde-usde',
    'ethena staked usde arm',
    18,
    UnderlyingAsset['eth:arm-susde-usde']
  ),
  ofcerc20(
    'c7f2a1b6-3d8e-4c9a-a4b0-5e1f7a2d9c8b',
    'ofceth:arm-weth-eeth',
    'ether.fi arm',
    18,
    UnderlyingAsset['eth:arm-weth-eeth']
  ),
  ofcerc20('63f1d5de-5729-4a71-ba6e-dcd7095c20da', 'ofceth:job', 'jobchain', 8, UnderlyingAsset['eth:job']),
  ofcerc20('90169666-a3ee-4ff6-b447-0553a1a4cbb8', 'ofceth:irys', 'irys', 18, UnderlyingAsset['eth:irys']),
  ofcerc20('42fc787e-bd51-4ba0-915f-14b7cdae1bf3', 'ofceth:kpk', 'kpk', 18, UnderlyingAsset['eth:kpk']),
  ofcerc20('20e090cf-d2ca-404d-9e14-2f8795b9fed6', 'ofceth:devve', 'devve', 18, UnderlyingAsset['eth:devve']),
  ofcerc20('0d6a51be-34d0-4e91-b8a6-b79004c44bc3', 'ofceth:zkj', 'zkj', 18, underlyingAssetForSymbol('eth:zkj')),
  ofcerc20('42da0317-adf3-4645-99d5-e731ccc0070d', 'ofceth:spk', 'spk', 18, underlyingAssetForSymbol('eth:spk')),
  ofcerc20('4383dfcc-35b9-4754-aeda-120a36637cb9', 'ofceth:merl', 'merl', 18, underlyingAssetForSymbol('eth:merl')),
  ofcerc20('e5449864-d826-4369-83e0-e46ffc6bc4fd', 'ofceth:aeur', 'aeur', 18, underlyingAssetForSymbol('eth:aeur')),
  ofcerc20('405d2275-a38f-4172-bf7b-e055ff4d5871', 'ofceth:soso', 'soso', 18, underlyingAssetForSymbol('eth:soso')),
  ofcerc20('44875f8c-c9fb-4af5-a3d2-79c25b3504d6', 'ofceth:bfc', 'bfc', 18, underlyingAssetForSymbol('eth:bfc')),
  ofcerc20('3caa6640-e667-49c0-904c-a08deb1d6f03', 'ofceth:osak', 'osak', 18, underlyingAssetForSymbol('eth:osak')),
  ofcerc20('8088356c-ea7f-40ce-8984-c23adca25ed7', 'ofceth:uds', 'uds', 18, underlyingAssetForSymbol('eth:uds')),
  ofcerc20('34f3593c-07bc-4b92-8ed4-33b5a5f01762', 'ofceth:zent', 'zent', 18, underlyingAssetForSymbol('eth:zent')),
  ofcerc20('cad5301f-d294-41eb-84fc-1e9a1b3592c7', 'ofceth:euri', 'euri', 18, underlyingAssetForSymbol('eth:euri')),
  ofcerc20('6dd31724-eab3-4667-8748-04da88349e17', 'ofceth:al', 'al', 18, underlyingAssetForSymbol('eth:al')),
  ofcerc20('c9d9f397-2fda-4418-8362-0c4f9a6d1aad', 'ofceth:wct', 'wct', 18, underlyingAssetForSymbol('eth:wct')),
  ofcerc20(
    '8125e1e5-8305-4fc2-834f-f859b81b918c',
    'ofceth:pundiai',
    'pundiai',
    18,
    underlyingAssetForSymbol('eth:pundiai')
  ),
  ofcerc20('17251954-61a5-4f5a-a594-a287b6864a25', 'ofceth:anon', 'anon', 18, underlyingAssetForSymbol('eth:anon')),
  ofcerc20('3ad9b598-11bd-4dba-9a42-a74eae4c6b43', 'ofceth:omi', 'omi', 18, underlyingAssetForSymbol('eth:omi')),
  ofcerc20('bf7b99fe-d666-4db7-a775-c05e5bff98ce', 'ofceth:andy', 'andy', 18, underlyingAssetForSymbol('eth:andy')),

  ofcerc20(
    'd2b5f3e4-3c4e-4f1e-9f0a-1b2c3d4e5f6a',
    'ofcbaseeth:spec',
    'Spectral',
    18,
    UnderlyingAsset['baseeth:spec'],
    undefined,
    undefined,
    '',
    undefined,
    undefined,
    true,
    'baseeth'
  ),
  ofcerc20(
    'bc7be60b-7eb8-4512-9675-d804f540962a',
    'ofcbaseeth:soon',
    'Soon Token',
    18,
    UnderlyingAsset['baseeth:soon'],
    undefined,
    undefined,
    '',
    undefined,
    undefined,
    true,
    'baseeth'
  ),

  ofcerc20(
    'c2c6b14c-62e8-4dc1-9b8e-63e8fc5c7ab6',
    'ofcbaseeth:wave',
    'Waveform',
    18,
    UnderlyingAsset['baseeth:wave'],
    undefined,
    undefined,
    '',
    undefined,
    undefined,
    true,
    'baseeth'
  ),

  ofcerc20(
    'd20cc76e-1384-4261-9d90-df2d6a87b3d0',
    'ofchypeevm:hwhype',
    'Hyperwave HYPE',
    18,
    UnderlyingAsset['hypeevm:hwhype']
  ),

  ofcerc20(
    'e3c6f4e5-4d5e-4f2e-8f1a-2c3d4e5f6a7b',
    'ofcbaseeth:tig',
    'The Innovation Game',
    18,
    UnderlyingAsset['baseeth:tig'],
    undefined,
    undefined,
    '',
    undefined,
    undefined,
    true,
    'baseeth'
  ),

  ofcerc20(
    'f4d7f5e6-5e6f-4f3f-8f2b-3d4e5f6a7b8c',
    'ofcbaseeth:virtual',
    'Virtual Protocol',
    18,
    UnderlyingAsset['baseeth:virtual'],
    undefined,
    undefined,
    '',
    undefined,
    undefined,
    true,
    'baseeth'
  ),

  ofcerc20(
    'a5e8f6e7-6f7a-4f4a-8f3c-4e5f6a7b8c9d',
    'ofcbaseeth:zora',
    'Zora',
    18,
    UnderlyingAsset['baseeth:zora'],
    undefined,
    undefined,
    '',
    undefined,
    undefined,
    true,
    'baseeth'
  ),

  ofcerc20(
    'b6f9f7e8-7a8b-4f5b-8f4d-5f6a7b8c9dae',
    'ofcbaseeth:toshi',
    'Toshi',
    18,
    UnderlyingAsset['baseeth:toshi'],
    undefined,
    undefined,
    '',
    undefined,
    undefined,
    true,
    'baseeth'
  ),

  ofcerc20(
    'c7aaf8e9-8b9c-4f6c-8f5e-6a7b8c9daebf',
    'ofcbaseeth:creator',
    'CreatorDAO',
    18,
    UnderlyingAsset['baseeth:creator'],
    undefined,
    undefined,
    '',
    undefined,
    undefined,
    true,
    'baseeth'
  ),

  ofcerc20(
    'd8bbf9ea-9cad-4f7d-8f6f-7b8c9daebfca',
    'ofcbaseeth:avnt',
    'Avantis',
    18,
    UnderlyingAsset['baseeth:avnt'],
    undefined,
    undefined,
    '',
    undefined,
    undefined,
    true,
    'baseeth'
  ),

  ofcerc20(
    'e9ccfaeb-adbe-4f8e-8f7a-8c9daebfcadb',
    'ofcbaseeth:mira',
    'Mira Network',
    18,
    UnderlyingAsset['baseeth:mira'],
    undefined,
    undefined,
    '',
    undefined,
    undefined,
    true,
    'baseeth'
  ),

  ofcerc20(
    '7bdb4371-8488-4395-9f91-f60abf561f47',
    'ofcbaseeth:cfi',
    'ConsumerFI',
    18,
    UnderlyingAsset['baseeth:cfi'],
    undefined,
    undefined,
    '',
    undefined,
    undefined,
    true,
    'baseeth'
  ),
  ofcerc20(
    'e083e24a-292c-48e1-8edb-e15ebd6c601b',
    'ofcbaseeth:mey',
    'Mey Network',
    18,
    UnderlyingAsset['baseeth:mey'],
    undefined,
    undefined,
    '',
    undefined,
    undefined,
    true,
    'baseeth'
  ),
  ofcerc20(
    '35139b9b-cbad-419c-b8d8-b9182d7b8ddb',
    'ofcbaseeth:myrc',
    'Malaysian Ringgit Coin',
    18,
    UnderlyingAsset['baseeth:myrc'],
    undefined,
    undefined,
    '',
    undefined,
    undefined,
    true,
    'baseeth'
  ),

  ofcerc20(
    'faddfbec-becf-4f9f-8f8b-9daebfcadbec',
    'ofcbaseeth:towns',
    'Towns',
    18,
    UnderlyingAsset['baseeth:towns'],
    undefined,
    undefined,
    '',
    undefined,
    undefined,
    true,
    'baseeth'
  ),

  ofcerc20(
    'f6bebafa-7934-4ca2-9195-1f4543c2ce0c',
    'ofcbaseeth:recall',
    'Recall',
    18,
    UnderlyingAsset['baseeth:recall'],
    undefined,
    undefined,
    '',
    undefined,
    undefined,
    true,
    'baseeth'
  ),

  ofcerc20(
    '088adddd-d75d-416f-94f0-05b686ffc424',
    'ofcbaseeth:brlv',
    'BRL Velocity',
    18,
    UnderlyingAsset['baseeth:brlv'],
    undefined,
    undefined,
    '',
    undefined,
    undefined,
    true,
    'baseeth'
  ),
  ofcerc20(
    '72d1eb99-3882-42db-abdd-c3a02f3829b4',
    'ofcbaseeth:wbrly',
    'Wrapped BRLY',
    24,
    UnderlyingAsset['baseeth:wbrly'],
    undefined,
    undefined,
    '',
    undefined,
    undefined,
    true,
    'baseeth'
  ),
  ofcerc20(
    'bfda6989-f5d4-4cc4-a80f-6b88e8da5198',
    'ofcbaseeth:sapien',
    'Sapien',
    18,
    UnderlyingAsset['baseeth:sapien'],
    undefined,
    undefined,
    '',
    undefined,
    undefined,
    true,
    'baseeth'
  ),
  ofcerc20(
    'bdfff799-1623-4847-93c0-c1a040c13d3f',
    'ofcbaseeth:aixbt',
    'Aixbt by Virtuals',
    18,
    UnderlyingAsset['baseeth:aixbt'],
    undefined,
    undefined,
    '',
    undefined,
    undefined,
    true,
    'baseeth'
  ),
  ofcerc20(
    '3ce0c7b4-7043-4309-8493-7809001ad410',
    'ofcbaseeth:brett',
    'Brett',
    18,
    UnderlyingAsset['baseeth:brett'],
    undefined,
    undefined,
    '',
    undefined,
    undefined,
    true,
    'baseeth'
  ),
  ofcerc20(
    'd8a3b2c7-4e9f-4d6a-95e0-6c1f7b3d8a5e',
    'ofcbaseeth:argt',
    'ARG Token',
    18,
    UnderlyingAsset['baseeth:argt'],
    undefined,
    undefined,
    '',
    undefined,
    undefined,
    true,
    'baseeth'
  ),
  ofcerc20(
    'e9b4c3d8-5f0a-4e7b-86f1-7d2a8c4e9b6f',
    'ofcbaseeth:brat',
    'BRA Token',
    18,
    UnderlyingAsset['baseeth:brat'],
    undefined,
    undefined,
    '',
    undefined,
    undefined,
    true,
    'baseeth'
  ),
  ofcerc20(
    'f0c5d4e9-6a1b-4f8c-a7a2-8e3b9d5f0c7a',
    'ofcbaseeth:mext',
    'Mexican Peso Token',
    18,
    UnderlyingAsset['baseeth:mext'],
    undefined,
    undefined,
    '',
    undefined,
    undefined,
    true,
    'baseeth'
  ),

  ofcerc20('abeefced-cfda-4afa-8f9c-aebfcadbecfd', 'ofceth:align', 'Aligned', 18, UnderlyingAsset['eth:align']),

  ofcerc20('bcfffdee-daeb-4bfb-9fad-bfcadbecfdae', 'ofceth:xan', 'Anoma', 18, UnderlyingAsset['eth:xan']),

  ofcerc20(
    'a9d3645d-4a42-4e9d-999b-83e4785b3f57',
    'ofceth:fidd',
    'Fidelity Digital Dollar',
    18,
    UnderlyingAsset['eth:fidd']
  ),
  ofcerc20('c71454e2-c51c-40df-8605-e57f2d97ed53', 'ofceth:yu', 'Yala Stablecoin', 18, UnderlyingAsset['eth:yu']),
  ofcerc20('f689a6e4-d76f-4591-afda-57e3c52fad22', 'ofceth:yprism', 'yPRISM', 18, UnderlyingAsset['eth:yprism']),
  ofcerc20('253e2858-a27b-4d39-b1fc-b8f719584d1f', 'ofceth:nvylds', 'NUVA YLDS', 12, UnderlyingAsset['eth:nvylds']),
  ofcerc20('e68260cc-3f0c-4429-9681-5a2cd46a6c87', 'ofceth:nvheloc', 'NUVA HELOC', 12, UnderlyingAsset['eth:nvheloc']),
  ofcerc20('02a7867a-754e-4132-8802-1b4aa979a441', 'ofceth:nil', 'Nillion', 6, UnderlyingAsset['eth:nil']),
  ofcerc20('14912a5e-254c-4c6f-9f9c-f9ce11b7b293', 'ofceth:bard', 'Lombard', 18, UnderlyingAsset['eth:bard']),
  ofcerc20('a31a6330-cbd6-49b0-b8b1-a7f9a48e770c', 'ofceth:sfp', 'SafePal Token', 18, UnderlyingAsset['eth:sfp']),
  ofcerc20('60f825f0-ed18-46b2-a03f-fd93b5e94f43', 'ofceth:aztec', 'Aztec', 18, UnderlyingAsset['eth:aztec']),
  ofcerc20('72427813-ec17-4100-8d6d-844a3f71f34e', 'ofceth:fbtc', 'Function Bitcoin', 8, UnderlyingAsset['eth:fbtc']),
  ofcerc20(
    'e050aeab-a9c9-4962-b42f-d350c88efb37',
    'ofceth:byzusd',
    'Byzantine Prime USD',
    18,
    UnderlyingAsset['eth:byzusd']
  ),
  ofcerc20(
    'c3bbb0f5-a0d8-4651-ac4b-3727383f59ec',
    'ofceth:audm',
    'Macropod Stablecoin',
    18,
    UnderlyingAsset['eth:audm']
  ),
  ofcerc20('884a97f2-5808-4614-814e-2cd1d17d29df', 'ofceth:usdi', 'USDi', 6, UnderlyingAsset['eth:usdi']),
  ofcerc20('f4e98148-b703-4608-b416-67cd89c8a9f0', 'ofceth:tea', 'Tea', 18, UnderlyingAsset['eth:tea']),
  ofcerc20('727298fe-56c5-477a-92af-5b4139e792ea', 'ofceth:ofc', 'OneFootball Club', 18, UnderlyingAsset['eth:ofc']),
  ofcerc20('10c41a70-8bd2-4415-af52-fefe3af01132', 'ofceth:wxm', 'WeatherXM', 18, UnderlyingAsset['eth:wxm']),
  ofcerc20('c574d2de-42be-488f-afc0-71e2691eb900', 'ofceth:jpyc', 'JPY Coin', 18, UnderlyingAsset['eth:jpyc']),
  ofcerc20('8465f646-73f8-4818-b890-c953f4423c89', 'ofceth:ten', 'TEN', 18, UnderlyingAsset['eth:ten']),
  ofcerc20('9c1aaba6-e190-4be5-a477-f7db7d0f07ef', 'ofceth:camp', 'Camp', 18, UnderlyingAsset['eth:camp']),
  ofcerc20('2c28b184-614a-427f-bf5c-37dadee8985b', 'ofceth:f', 'SynFutures', 18, UnderlyingAsset['eth:f']),
  ofcerc20('f8e6404b-2adc-4f74-b957-d9cbd7228d7e', 'ofceth:turtle', 'Turtle', 18, UnderlyingAsset['eth:turtle']),
  ofcerc20('a6e121e6-6563-4d2c-818d-91e9bd4af7ed', 'ofceth:order', 'Orderly Network', 18, UnderlyingAsset['eth:order']),
  ofcerc20('7192609e-c255-4da8-b1a5-e40cabbf4f2e', 'ofceth:puffer', 'Puffer', 18, UnderlyingAsset['eth:puffer']),

  // MON Network tokens
  ofcerc20(
    '1458bca6-e0d3-455e-81c7-55862dc5af52',
    'ofcmon:usdc',
    'MON:USDC',
    6,
    underlyingAssetForSymbol('mon:usdc'),
    undefined,
    [...OfcCoin.DEFAULT_FEATURES, CoinFeature.STABLECOIN],
    '',
    undefined,
    undefined,
    true,
    'mon'
  ),
  ofcerc20(
    '7a8631a5-deed-43c5-92a0-13e3322429ba',
    'ofcmon:wmon',
    'Wrapped MON',
    18,
    underlyingAssetForSymbol('mon:wmon'),
    undefined,
    undefined,
    '',
    undefined,
    undefined,
    true,
    'mon'
  ),

  // XDC Network tokens
  ofcerc20(
    '517ca4d1-a2c4-4606-914f-4c4b5b4943ff',
    'ofcxdc:usdc',
    'USD Coin (XDC)',
    6,
    underlyingAssetForSymbol('xdc:usdc'),
    undefined,
    [...OfcCoin.DEFAULT_FEATURES, CoinFeature.STABLECOIN],
    '',
    undefined,
    undefined,
    true,
    'xdc'
  ),
  ofcerc20(
    'b4666353-81d0-491b-a554-bdd8e677be24',
    'ofcxdc:lbt',
    'Law Block Token',
    18,
    underlyingAssetForSymbol('xdc:lbt'),
    undefined,
    undefined,
    '',
    undefined,
    undefined,
    true,
    'xdc'
  ),
  ofcerc20(
    '26dc9e5b-7bd5-4e77-859e-56e77e2582e7',
    'ofcxdc:cre',
    'Crescite',
    18,
    underlyingAssetForSymbol('xdc:cre'),
    undefined,
    undefined,
    '',
    undefined,
    undefined,
    true,
    'xdc'
  ),
  ofcerc20(
    '086883c7-f7e9-458e-a0a1-ed3ec525f9c6',
    'ofcxdc:gama',
    'Gama Token',
    18,
    underlyingAssetForSymbol('xdc:gama'),
    undefined,
    undefined,
    '',
    undefined,
    undefined,
    true,
    'xdc'
  ),
  ofcerc20(
    '0c8b533c-1929-4de8-af36-9cf4b4409c0d',
    'ofcxdc:srx',
    'STORX',
    18,
    underlyingAssetForSymbol('xdc:srx'),
    undefined,
    undefined,
    '',
    undefined,
    undefined,
    true,
    'xdc'
  ),
  ofcerc20(
    '3c7ec48a-ba51-47c9-9044-f29d9c0daf35',
    'ofcxdc:weth',
    'Wrapped Ether (XDC)',
    18,
    underlyingAssetForSymbol('xdc:weth'),
    undefined,
    undefined,
    '',
    undefined,
    undefined,
    true,
    'xdc'
  ),

  // X Layer (OKB) Mainnet tokens
  ofcerc20(
    '74624f51-a9ee-4e08-a3d8-3f59221dd782',
    'ofcokbxlayer:usdg',
    'Global Dollar',
    6,
    underlyingAssetForSymbol('okbxlayer:usdg'),
    undefined,
    undefined,
    '',
    undefined,
    undefined,
    true,
    'okbxlayer'
  ),
  ofcerc20(
    '586b6383-f965-4f6a-9d40-e135ad815147',
    'ofcokbxlayer:usdt0',
    'USDT0',
    6,
    underlyingAssetForSymbol('okbxlayer:usdt0'),
    undefined,
    undefined,
    '',
    undefined,
    undefined,
    true,
    'okbxlayer'
  ),
  ofcerc20(
    '560de5af-59c2-421c-bb60-9086a5745539',
    'ofcokbxlayer:usdt',
    'USDT',
    6,
    underlyingAssetForSymbol('okbxlayer:usdt'),
    undefined,
    undefined,
    '',
    undefined,
    undefined,
    true,
    'okbxlayer'
  ),
  ofcerc20(
    'f22e7b40-8bfb-42b7-a741-44bb36088a50',
    'ofcokbxlayer:usdc',
    'USDC',
    6,
    underlyingAssetForSymbol('okbxlayer:usdc'),
    undefined,
    undefined,
    '',
    undefined,
    undefined,
    true,
    'okbxlayer'
  ),

  // X Layer (OKB) Testnet tokens
  tofcerc20(
    '1be3bd63-04d8-43f5-a772-86292fa5631d',
    'ofctokbxlayer:tzeb',
    'Zebra testnet',
    18,
    underlyingAssetForSymbol('tokbxlayer:tzeb'),
    undefined,
    undefined,
    '',
    undefined,
    undefined,
    true,
    'tokbxlayer'
  ),

  // Jovayeth Mainnet tokens
  ofcerc20(
    '936bfaa7-2a27-4c88-8f56-3ee3b2e3060c',
    'ofcjovayeth:jft',
    'JovayFirst',
    18,
    underlyingAssetForSymbol('jovayeth:jft'),
    undefined,
    undefined,
    '',
    undefined,
    undefined,
    true,
    'jovayeth'
  ),
  ofcerc20(
    '56d130a9-b5ce-46b7-8ba3-648372dd3e9c',
    'ofcjovayeth:usdce',
    'Bridged USDC',
    6,
    underlyingAssetForSymbol('jovayeth:usdce'),
    undefined,
    undefined,
    '',
    undefined,
    undefined,
    true,
    'jovayeth'
  ),

  // Jovayeth Testnet tokens
  tofcerc20(
    'd30dcc9f-2274-48de-9289-e1801226a9cf',
    'ofctjovayeth:tcmn',
    'Common',
    18,
    underlyingAssetForSymbol('tjovayeth:tcmn'),
    undefined,
    undefined,
    '',
    undefined,
    undefined,
    true,
    'tjovayeth'
  ),
  tofcerc20(
    'e1d2c3b4-a5f6-4e7d-8c9b-0a1b2c3d4e5f',
    'ofctjovayeth:usdce',
    'Bridged USDC',
    6,
    underlyingAssetForSymbol('tjovayeth:usdce'),
    undefined,
    undefined,
    '',
    undefined,
    undefined,
    true,
    'tjovayeth'
  ),
  // Story Network tokens
  ofcerc20(
    '452cc4f6-3c77-4193-a572-4b0d0f838c3c',
    'ofcip:aria',
    'Aria',
    18,
    underlyingAssetForSymbol('ip:aria'),
    undefined,
    undefined,
    '',
    undefined,
    undefined,
    true,
    'ip'
  ),
  tofcerc20(
    '94eb6074-b01f-43b4-81ed-d53fb5c2566d',
    'ofctip:tmt',
    'TMT',
    6,
    underlyingAssetForSymbol('tip:tmt'),
    undefined,
    undefined,
    '',
    undefined,
    undefined,
    true,
    'tip'
  ),

  ofcerc20(
    'e46e4acc-5014-4dad-ba7d-660bae9299a4',
    'ofcxpl:syzusd',
    'Stake Yuzu USD',
    18,
    underlyingAssetForSymbol('xpl:syzusd'),
    undefined,
    undefined,
    '',
    undefined,
    undefined,
    true,
    'xpl'
  ),

  ofcerc20(
    '94b84642-620e-496c-b43e-d532adacedce',
    'ofcxpl:usdto',
    'USDTO',
    6,
    underlyingAssetForSymbol('xpl:usdto'),
    undefined,
    undefined,
    '',
    undefined,
    undefined,
    true,
    'xpl'
  ),

  // Mantle testnet tokens
  tofcerc20(
    '4091a920-f2bf-4026-8d81-a6361cb79278',
    'ofctmantle:bgerch',
    'BGERCH',
    18,
    underlyingAssetForSymbol('tmantle:bgerch')
  ),
  tofcerc20(
    'ca77595a-dd77-4c64-a9d5-59d70ae9ac43',
    'ofctmantle:usd1',
    'Test USD1 Token',
    18,
    underlyingAssetForSymbol('tmantle:usd1')
  ),
  tofcerc20(
    '4fc97feb-4d66-4ab7-8538-83ccf25673bb',
    'ofctmantle:stgusd1',
    'Test USD1 Token',
    18,
    underlyingAssetForSymbol('tmantle:stgusd1')
  ),

  // MegaEth Network tokens
  ofcerc20(
    '65df2f65-bb7a-4485-b725-a5fb2e6cd281',
    'ofcmegaeth:mega',
    'Mega',
    18,
    underlyingAssetForSymbol('megaeth:mega')
  ),
  ofcerc20(
    '7bcafa71-a2f3-4a9e-98e2-4d3f655281f8',
    'ofcmegaeth:weth',
    'Wrapped Ether',
    18,
    underlyingAssetForSymbol('megaeth:weth')
  ),

  // MegaEth testnet tokens
  tofcerc20(
    'c4e8f2a1-9b3d-4e5f-8a6c-7d2e1f0b9c8a',
    'ofctmegaeth:tmt',
    'Test Mintable Token',
    6,
    underlyingAssetForSymbol('tmegaeth:tmt')
  ),

  // Morph tokens
  ofcerc20(
    '4d5f4fb7-b2e2-4e63-bbda-7f315332da5b',
    'ofcmorph:usdc',
    'USD Coin',
    6,
    UnderlyingAsset['morph:usdc'],
    undefined,
    undefined,
    '',
    undefined,
    undefined,
    true,
    'morph'
  ),
  ofcerc20(
    '37f51c58-9be5-4c56-adcb-2c7f3c2cfc1a',
    'ofcmorph:usdt',
    'Tether USD',
    6,
    UnderlyingAsset['morph:usdt'],
    undefined,
    undefined,
    '',
    undefined,
    undefined,
    true,
    'morph'
  ),
  ofcerc20(
    'e499e7cc-22ae-4374-ae4b-27651565af15',
    'ofcmorph:usd1',
    'USD1',
    18,
    UnderlyingAsset['morph:usd1'],
    undefined,
    undefined,
    '',
    undefined,
    undefined,
    true,
    'morph'
  ),
  tofcerc20(
    '299efde0-9c67-44d8-ac00-44d0259d709d',
    'ofctmorph:tmt',
    'Test Mintable Token',
    6,
    underlyingAssetForSymbol('tmorph:tmt'),
    undefined,
    undefined,
    '',
    undefined,
    undefined,
    true,
    'tmorph'
  ),

  // MorphETH tokens
  ofcerc20(
    '9c28b89b-1069-4bad-bf7b-8ecea440cee2',
    'ofcmorpheth:usdc',
    'USD Coin',
    6,
    UnderlyingAsset['morpheth:usdc'],
    undefined,
    undefined,
    '',
    undefined,
    undefined,
    true,
    'morpheth'
  ),
  ofcerc20(
    '07010f84-5bc7-4715-9d19-09d694f558fb',
    'ofcmorpheth:usdt',
    'Tether USD',
    6,
    UnderlyingAsset['morpheth:usdt'],
    undefined,
    undefined,
    '',
    undefined,
    undefined,
    true,
    'morpheth'
  ),
  ofcerc20(
    '883727b5-49e3-4fb3-99f7-fefb803710e5',
    'ofcmorpheth:usd1',
    'USD1',
    18,
    UnderlyingAsset['morpheth:usd1'],
    undefined,
    undefined,
    '',
    undefined,
    undefined,
    true,
    'morpheth'
  ),
  tofcerc20(
    '34e77cee-2885-4a77-911c-b5f2bdd28cd7',
    'ofctmorpheth:tmt',
    'Test Mintable Token',
    6,
    underlyingAssetForSymbol('tmorpheth:tmt'),
    undefined,
    undefined,
    '',
    undefined,
    undefined,
    true,
    'tmorpheth'
  ),
  tofcerc20(
    '8c64311b-e288-4dd4-8f9f-25dad3418837',
    'ofctmorpheth:usd1',
    'Test USD1 Token',
    18,
    underlyingAssetForSymbol('tmorpheth:usd1'),
    undefined,
    undefined,
    '',
    undefined,
    undefined,
    true,
    'tmorpheth'
  ),
  tofcerc20(
    '15ca2074-d5bc-450c-886e-1338ffb114f8',
    'ofctmorpheth:stgusd1',
    'Test USD1 Token',
    18,
    underlyingAssetForSymbol('tmorpheth:stgusd1'),
    undefined,
    undefined,
    '',
    undefined,
    undefined,
    true,
    'tmorpheth'
  ),
];

function underlyingAssetForSymbol(underlyingAssetValue: string): UnderlyingAsset {
  return (
    Object.values(UnderlyingAsset).find((value) => value === underlyingAssetValue) || UnderlyingAsset.INVALID_UNKNOWN
  );
}
