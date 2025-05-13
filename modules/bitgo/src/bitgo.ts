//
// BitGo JavaScript SDK
//
// Copyright 2014, BitGo, Inc.  All Rights Reserved.
//
import pjson = require('../package.json');
import * as _ from 'lodash';

import { BaseCoin, CoinFactory, common } from '@bitgo/sdk-core';
import { BitGoAPI, BitGoAPIOptions } from '@bitgo/sdk-api';
import { createTokenMapUsingTrimmedConfigDetails, TrimmedAmsTokenConfig } from '@bitgo/statics';
import { GlobalCoinFactory, registerCoinConstructors } from './v2/coinFactory';

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

  initCoinFactory(tokenConfigMap: Record<string, TrimmedAmsTokenConfig[]>): void {
    // TODO(WIN-5057): use AMS endpoint to fetch config details
    const coinMap = createTokenMapUsingTrimmedConfigDetails(tokenConfigMap);
    this._coinFactory = new CoinFactory();
    registerCoinConstructors(this._coinFactory, coinMap);
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
   * Create a basecoin object for a virtual token
   * @param tokenName
   */
  async token(tokenName: string): Promise<BaseCoin> {
    await this.fetchConstants();
    return this.coin(tokenName);
  }
}
