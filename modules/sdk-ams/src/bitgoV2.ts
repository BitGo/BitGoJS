import { BitGo } from 'bitgo';
import { BaseCoin } from '@bitgo/sdk-core';
import { BitGoAPIOptions } from '@bitgo/sdk-api';
import { createTokenMapUsingConfigDetails, AmsTokenConfig } from '@bitgo/statics';
import { GlobalCoinFactoryV2 } from './globalCoinFactoryV2';
import { CoinFactoryV2 } from './coinFactoryV2';

export class BitGoV2 extends BitGo {
  protected coinFactory: CoinFactoryV2;

  /**
   * Constructor for BitGoV2 Object
   * @param params - BitGoAPIOptions
   */
  constructor(params: BitGoAPIOptions = {}) {
    super(params);
    this.coinFactory = new CoinFactoryV2();
  }

  /**
   * Initialize the coin factory with token configurations
   * @param tokenConfigMap - Map of token configurations received from AMS
   */
  public async initCoinFactory(tokenConfigMap: Record<string, AmsTokenConfig[]>): Promise<void> {
    // TODO(WIN-5057): use AMS endpoint to fetch config details
    const coinMap = createTokenMapUsingConfigDetails(tokenConfigMap);
    this.coinFactory = GlobalCoinFactoryV2(coinMap);
  }

  /**
   * Get the BaseCoin instance from the coin factory
   * @param coinName
   */
  public coin(coin: string): BaseCoin {
    // TODO(WIN-5057): use AMS endpoint to fetch the token details and add it in coin map as well as coin factory
    return this.coinFactory.getInstance(this, coin);
  }
}
