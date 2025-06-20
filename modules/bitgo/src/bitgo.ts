//
// BitGo JavaScript SDK
//
// Copyright 2014, BitGo, Inc.  All Rights Reserved.
//
import pjson = require('../package.json');
import * as _ from 'lodash';

import { BaseCoin, CoinFactory, common, UnsupportedCoinError } from '@bitgo/sdk-core';
import { BitGoAPI, BitGoAPIOptions } from '@bitgo/sdk-api';
import {
  createTokenMapUsingTrimmedConfigDetails,
  TrimmedAmsTokenConfig,
  createToken,
  getFormattedTokenConfigForCoin,
  coins,
  BaseCoin as StaticsBaseCoin,
} from '@bitgo/statics';
import { GlobalCoinFactory, registerCoinConstructors, getTokenConstructor, getCoinConstructor } from './v2/coinFactory';

// constructor params used exclusively for BitGo class
export type BitGoOptions = BitGoAPIOptions & {
  useAms?: boolean;
};

export class BitGo extends BitGoAPI {
  private _coinFactory: CoinFactory;
  private _useAms: boolean;
  /**
   * Constructor for BitGo Object
   */
  constructor(params: BitGoOptions = {}) {
    super(params);
    if (
      !common.validateParams(
        params,
        [],
        [
          'clientId',
          'clientSecret',
          'refreshToken',
          'accessToken',
          'userAgent',
          'customRootURI',
          'customBitcoinNetwork',
          'serverXpub',
          'stellarFederationServerUrl',
        ]
      ) ||
      (params.useProduction && !_.isBoolean(params.useProduction)) ||
      (params.useAms && !_.isBoolean(params.useAms))
    ) {
      throw new Error('invalid argument');
    }

    if (!params.clientId !== !params.clientSecret) {
      throw new Error('invalid argument - must provide both client id and secret');
    }

    this._useAms = !!params.useAms;
    this._version = pjson.version;
    this._userAgent = params.userAgent || 'BitGoJS/' + this.version();
    this._coinFactory = new CoinFactory();
  }

  /**
   * Initialize the coin factory with token configurations
   * @param tokenConfigMap - A map of token metadata from AMS
   */
  initCoinFactory(tokenConfigMap: Record<string, TrimmedAmsTokenConfig[]>): void {
    const coinMap = createTokenMapUsingTrimmedConfigDetails(tokenConfigMap);
    this._coinFactory = new CoinFactory();
    registerCoinConstructors(this._coinFactory, coinMap);
  }

  /**
   * Fetch all the tokens and initialize the coin factory
   */
  async registerAllTokens(): Promise<void> {
    if (!this._useAms) {
      throw new Error('registerAllTokens is only supported when useAms is set to true');
    }
    // Fetch mainnet assets for prod and adminProd environments, testnet assets for all other environments
    const assetEnvironment = ['prod', 'adminProd'].includes(this.getEnv()) ? 'mainnet' : 'testnet';
    const url = this.url(`/assets/list/${assetEnvironment}`);
    const tokenConfigMap = (await this.executeAssetRequest(url)) as Record<string, TrimmedAmsTokenConfig[]>;
    this.initCoinFactory(tokenConfigMap);
  }

  /**
   * Create a basecoin object
   * @param coinName
   */
  coin(coinName: string): BaseCoin {
    if (this._useAms) {
      return this._coinFactory.getInstance(this, coinName);
    }
    return GlobalCoinFactory.getInstance(this, coinName);
  }

  /**
   * Register a token in the coin factory
   * @param tokenConfig - The token metadata from AMS
   */
  async registerToken(tokenName: string): Promise<void> {
    if (!this._useAms) {
      throw new Error('registerToken is only supported when useAms is set to true');
    }
    //do not register a coin/token if it's already registered
    if (this._coinFactory.hasCoin(tokenName)) {
      return;
    }

    // Get the coin/token details only if it's not present in statics library
    let staticsBaseCoin: Readonly<StaticsBaseCoin> | undefined;
    if (coins.has(tokenName)) {
      staticsBaseCoin = coins.get(tokenName);
    } else {
      const url = this.url(`/assets/name/${tokenName}`);
      const tokenConfig = (await this.executeAssetRequest(url)) as TrimmedAmsTokenConfig;
      staticsBaseCoin = createToken(tokenConfig);
    }

    if (!staticsBaseCoin) {
      throw new UnsupportedCoinError(tokenName);
    }
    if (staticsBaseCoin.isToken) {
      const formattedTokenConfig = getFormattedTokenConfigForCoin(staticsBaseCoin);
      if (!formattedTokenConfig) {
        throw new UnsupportedCoinError(tokenName);
      }

      const tokenConstructor = getTokenConstructor(formattedTokenConfig);
      if (!tokenConstructor) {
        throw new UnsupportedCoinError(tokenName);
      }
      this._coinFactory.registerToken(staticsBaseCoin, tokenConstructor);
    } else {
      const coinConstructor = getCoinConstructor(tokenName);
      if (!coinConstructor) {
        throw new UnsupportedCoinError(tokenName);
      }
      this._coinFactory.registerToken(staticsBaseCoin, coinConstructor);
    }
  }

  /**
   * Create a basecoin object for a virtual token
   * @param tokenName
   */
  async token(tokenName: string): Promise<BaseCoin> {
    await this.fetchConstants();
    return this.coin(tokenName);
  }
}
