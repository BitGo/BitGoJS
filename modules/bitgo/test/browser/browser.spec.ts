describe('BitGoJS in the browser', () => {
  it('Should work', () => {
    const BitGoJS = window['BitGoJS'];
    expect(BitGoJS).toBeTruthy();
  });
});

describe('Coins', () => {
  it('Should work for all coins', () => {
    const BitGoJS = window['BitGoJS'];
    const bitgo = new BitGoJS.BitGo({ env: 'test' });
    // these objects are defined in BitGoJS.Coin, but are not coins in the traditional sense
    // or if statics coins name ("thorchain:rune") doesn't match with class name (Rune)
    const excludedKeys = {
      AbstractUtxoCoin: 1,
      AbstractLightningCoin: 1,
      AdaToken: 1,
      Erc20Token: 1,
      Erc721Token: 1,
      Erc7984Token: 1,
      EthLikeCoin: 1,
      TethLikeCoin: 1,
      OfcToken: 1,
      StellarToken: 1,
      CeloToken: 1,
      EosToken: 1,
      AlgoToken: 1,
      AvaxCToken: 1,
      PolygonToken: 1,
      BscToken: 1,
      ArbethToken: 1,
      OpethToken: 1,
      ZkethToken: 1,
      SuiToken: 1,
      TaoToken: 1,
      PolyxToken: 1,
      BeraToken: 1,
      XrpToken: 1,
      Rune: 1,
      Trune: 1,
      Tao: 1,
      Ttao: 1,
      AptToken: 1,
      Icp: 1,
      Ticp: 1,
      Iota: 1,
      Tiota: 1,
      Sip10Token: 1,
      SoneiumToken: 1,
      Polyx: 1,
      Tpolyx: 1,
      CoredaoToken: 1,
      EvmCoin: 1,
      Nep141Token: 1,
      WorldToken: 1,
      CosmosSharedCoin: 1,
      VetToken: 1,
      EthLikeErc20Token: 1,
      EthLikeErc721Token: 1,
      HashToken: 1,
      FlrToken: 1,
      MonToken: 1,
      XdcToken: 1,
      JettonToken: 1,
      Tip20Token: 1,
      Fiat: 1,
      allFiatCoins: 1,
      fiatCoins: 1,
      testnetFiatCoins: 1,
    };
    Object.keys(BitGoJS.Coin)
      .filter((coinName) => !excludedKeys[coinName])
      .forEach((coinName) => {
        const coinIdentifier = coinName.toLowerCase();
        const coin = bitgo.coin(coinIdentifier);
        expect(coin).toBeTruthy();
        expect(coin.type).toEqual(coinIdentifier);
      });
  });
});
