//
// BitGo JavaScript SDK
//
// Copyright 2014, BitGo, Inc.  All Rights Reserved.
//
import pjson = require('../package.json');
import * as _ from 'lodash';

import GlobalCoinFactory from './v2/coinFactory';
import { BaseCoin, common } from '@bitgo/sdk-core';
import { BitGoAPI, BitGoAPIOptions } from '@bitgo/sdk-api';

export type BitGoOptions = BitGoAPIOptions;

export class BitGo extends BitGoAPI {
  /**
   * Constructor for BitGo Object
   */
  constructor(params: BitGoAPIOptions = {}) {
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
      (params.useProduction && !_.isBoolean(params.useProduction))
    ) {
      throw new Error('invalid argument');
    }

    if (!params.clientId !== !params.clientSecret) {
      throw new Error('invalid argument - must provide both client id and secret');
    }

    this._version = pjson.version;
    this._userAgent = params.userAgent || 'BitGoJS/' + this.version();
  }

  /**
   * Create a basecoin object
   * @param coinName
   */
  coin(coinName: string): BaseCoin {
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
