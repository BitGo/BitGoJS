import React, { useState } from 'react';
import { BaseCoin } from '@bitgo/sdk-core';
import coinFactory from './coinFactory';
import { BitGoAPI } from '@bitgo/sdk-api';

const sdk = new BitGoAPI();

const possibleCoins = [
  'ada',
  'algo',
  'avaxc',
  'avaxp',
  'bch',
  'bcha',
  'bsc',
  'bsv',
  'btc',
  'btg',
  'celo',
  'cspr',
  'dash',
  'doge',
  'dot',
  'eos',
  'etc',
  'eth',
  'eth2',
  'ethw',
  'hbar',
  'ltc',
  'near',
  'polygon',
  'rbtc',
  'sol',
  'stx',
  'sui',
  'trx',
  'xlm',
  'xrp',
  'xtz',
  'zec',
];

const Coins = () => {
  const [selectedCoin, setSelectedCoin] = useState<string>('');
  const [currentCoin, setCurrentCoin] = useState<BaseCoin | undefined>(
    undefined,
  );
  const getCoin = async (coin: string) => {
    setSelectedCoin(coin);
    const baseCoin = await coinFactory.getCoin(coin, sdk);
    setCurrentCoin(baseCoin);
  };
  return (
    <div style={{ padding: '1rem' }}>
      <h3>Coins</h3>
      <br />
      <p>
        Open the network tab (F12) & inspect requests as you select a new coin
      </p>
      <div>
        <select
          value={selectedCoin}
          onChange={(event) => getCoin(event.target.value)}
        >
          <option value="">Select a coin</option>
          {possibleCoins.map((coin) => (
            <option value={coin} key={coin}>
              {coin}
            </option>
          ))}
        </select>
      </div>
      <div>{currentCoin && <div>{currentCoin.getFullName()} loaded!</div>}</div>
    </div>
  );
};

export default Coins;
