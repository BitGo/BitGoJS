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
        const excludedKeys = {
            'AbstractUtxoCoin': 1,
            'Erc20Token': 1,
            'OfcToken': 1,
            'StellarToken': 1,
            'CeloToken': 1,
        };
        Object.keys(BitGoJS.Coin)
        .filter((coinName) => !excludedKeys[coinName])
        .forEach((coinName) => {
            const coinIdentifier = coinName.toLowerCase();
            const coin = bitgo.coin(coinIdentifier);
            expect(coin).toBeTruthy();
            expect(coin.type).toEqual(coinIdentifier);
        })
    })
});
