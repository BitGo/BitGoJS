import { IBaseCoin } from './base';
import { utxo } from './utxo';
import { Networks } from './networks';

export const coins: IBaseCoin[] = [
  utxo('Bitcoin', 'BTC', Networks.main.bitcoin),
  utxo('Testnet Bitcoin', 'TBTC', Networks.test.bitcoin),
  utxo('Litecoin', 'LTC', Networks.main.litecoin),
  utxo('Testnet Litecoin', 'TLTC', Networks.test.litecoin),
];
