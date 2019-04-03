import { IBaseCoin } from './base';
import { longName, shortName, network } from './stringTypes';
import { utxo } from './utxo';

export const coins: IBaseCoin[] = [
  utxo(longName`Bitcoin`, shortName`BTC`, network`bitcoin`),
  utxo(longName`Testnet Bitcoin`, shortName`TBTC`, network`bitcoinTestnet`),
];
