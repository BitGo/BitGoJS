import { BitGoBase } from './bitgoBase';
import { BaseCoin } from './v2';
import { GlobalCoinFactory } from './v2/coinFactory';

export class BitGo extends BitGoBase {
  
  coin(coinName: string): BaseCoin {
    return GlobalCoinFactory.getInstance(this, coinName);
  }
  loadCoin(coinName: string, coin: BaseCoin): void {
    throw new Error('Method not implemented. Please use BitGoAsync for this feature.');
  }
}
