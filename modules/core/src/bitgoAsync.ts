import { BitGoBase } from './bitgoBase';
import { BaseCoin } from './v2';

export class BitGoAsync extends BitGoBase {
  coinMap: Record<string, BaseCoin> = {};
  
  coin(coinName: string): BaseCoin {
    if (!this.coinMap[coinName]) {
      throw new Error(`Coin ${coinName} not loaded. Please call loadCoin first.`);
    }
    return this.coinMap[coinName];
  }
  loadCoin(coinName: string, coin: BaseCoin): void {
    this.coin[coinName] = coin;
  }
}
