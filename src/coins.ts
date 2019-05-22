import { account, erc20, terc20 } from './account';
import { CoinKind, UnderlyingAsset } from './base';
import { CoinMap } from './map';
import { Networks } from './networks';
import { ofc, tofc } from './ofc';
import { utxo } from './utxo';

export const coins = CoinMap.fromCoins([
  utxo('bch', 'Bitcoin Cash', Networks.main.bitcoinCash, UnderlyingAsset.BCH),
  utxo('tbch', 'Testnet Bitcoin Cash', Networks.test.bitcoinCash, UnderlyingAsset.BCH),
  utxo('bsv', 'Bitcoin SV', Networks.main.bitcoinSV, UnderlyingAsset.BSV),
  utxo('tbsv', 'Testnet Bitcoin SV', Networks.test.bitcoinSV, UnderlyingAsset.BSV),
  utxo('btc', 'Bitcoin', Networks.main.bitcoin, UnderlyingAsset.BTC),
  utxo('tbtc', 'Testnet Bitcoin', Networks.test.bitcoin, UnderlyingAsset.BTC),
  utxo('btg', 'Bitcoin Gold', Networks.main.bitcoinGold, UnderlyingAsset.BTG),
  utxo('ltc', 'Litecoin', Networks.main.litecoin, UnderlyingAsset.LTC),
  utxo('tltc', 'Testnet Litecoin', Networks.test.litecoin, UnderlyingAsset.LTC),
  account('eth', 'Ethereum', Networks.main.ethereum, 18, UnderlyingAsset.ETH),
  account('teth', 'Testnet Ethereum', Networks.test.kovan, 18, UnderlyingAsset.ETH),
  account('xrp', 'Ripple', Networks.main.xrp, 6, UnderlyingAsset.XRP),
  account('txrp', 'Testnet Ripple', Networks.test.xrp, 6, UnderlyingAsset.XRP),
  account('xlm', 'Stellar', Networks.main.stellar, 7, UnderlyingAsset.XLM),
  account('txlm', 'Testnet Stellar', Networks.test.stellar, 7, UnderlyingAsset.XLM),
  utxo('zec', 'ZCash', Networks.main.zCash, UnderlyingAsset.ZEC),
  utxo('tzec', 'Testnet ZCash', Networks.test.zCash, UnderlyingAsset.ZEC),
  erc20('erc', 'ERC Token', 0, '0x8e35d374594fa07d0de5c5e6563766cd24336251', UnderlyingAsset.ERC),
  erc20('omg', 'OmiseGo Token', 18, '0xd26114cd6ee289accf82350c8d8487fedb8a0c07', UnderlyingAsset.OMG),
  terc20('terc', 'ERC Test Token', 0, '0x945ac907cf021a6bcd07852bb3b8c087051706a9', UnderlyingAsset.ERC),
  terc20('test', 'Test Mintable ERC20 Token', 18, '0x1fb879581f31687b905653d4bbcbe3af507bed37', UnderlyingAsset.TEST),
  ofc('ofcusd', 'Offchain USD', 2, UnderlyingAsset.USD, CoinKind.FIAT),
  ofc('ofcbtc', 'Offchain Bitcoin Mainnet', 8, UnderlyingAsset.BTC, CoinKind.CRYPTO),
  ofc('ofceth', 'Offchain Ether Mainnet', 18, UnderlyingAsset.ETH, CoinKind.CRYPTO),
  tofc('ofctusd', 'Offchain Test USD', 2, UnderlyingAsset.USD, CoinKind.FIAT),
  tofc('ofctbtc', 'Offchain Bitcoin Test', 8, UnderlyingAsset.BTC, CoinKind.CRYPTO),
  tofc('ofcteth', 'Offchain Ether Testnet', 18, UnderlyingAsset.ETH, CoinKind.CRYPTO),
]);
