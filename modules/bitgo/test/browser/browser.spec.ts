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
      AbstractUtxoCoin: 1,
      AbstractLightningCoin: 1,
      Erc20Token: 1,
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

  it('UTXO bufferutils should work', () => {
    const BitGoJS = window['BitGoJS'];
    const bitgo = new BitGoJS.BitGo({ env: 'test' });

    const txHex =
      '0100000002008287fa5a4e9d393134b525ae038cbcb4c757eadaa378c33caeed294c63137f000000006b48304502204dc8131adb9420729ff1580bbbcf01f5ef879defee5225a8261b5681075b8a120221009dc3386f5301ab4a88dfd89d8927a7807242a30ee252fa864d61d0b079aaa2c20121038c4b3c81572d84ce32a2a41c5bb54d4c408b5ce3df9be451f4f57ba8bd8ebf59ffffffff17ed0cc32384bf9c410d023d4ab25f4499992824308e89c448fd570e1060fc0e000000006b48304502202c0ff069c0783c11259936307ef906b211542a01ca33cf6993ddb7b8d55b42ac02210095c4bceb1886f5bcc6ca2dbb909259c0509e768693a93fe2d01d511a57356f25012102e99ed9483d91f1fa67abd838f21afd80bf6a3732128ab5aad0ee5b975679c13dffffffff02bca2b100000000001976a914cc3aa0deca267914cbcf96f79ccd1b679d85e20188ac08c2eb0b000000001976a914380c5a7247e945a5aa242056f9b046a9366fe21788ac00000000';
    const btc = bitgo.coin('btc');
    const tx = btc.createTransactionFromHex(txHex);
    expect(tx.getId()).toEqual('4f666850ac8a54c834a90e62fc9dc50b3c99275dd1f91960e1ea89813970e444');

    const txHexBig =
      '0100000002008287fa5a4e9d393134b525ae038cbcb4c757eadaa378c33caeed294c63137f000000006b48304502204dc8131adb9420729ff1580bbbcf01f5ef879defee5225a8261b5681075b8a120221009dc3386f5301ab4a88dfd89d8927a7807242a30ee252fa864d61d0b079aaa2c20121038c4b3c81572d84ce32a2a41c5bb54d4c408b5ce3df9be451f4f57ba8bd8ebf59ffffffff17ed0cc32384bf9c410d023d4ab25f4499992824308e89c448fd570e1060fc0e000000006b48304502202c0ff069c0783c11259936307ef906b211542a01ca33cf6993ddb7b8d55b42ac02210095c4bceb1886f5bcc6ca2dbb909259c0509e768693a93fe2d01d511a57356f25012102e99ed9483d91f1fa67abd838f21afd80bf6a3732128ab5aad0ee5b975679c13dffffffff02f8ffc42ebca2b1001976a914cc3aa0deca267914cbcf96f79ccd1b679d85e20188ac08c2eb0b000000001976a914380c5a7247e945a5aa242056f9b046a9366fe21788ac00000000';
    const doge = bitgo.coin('doge');
    const txBig = doge.createTransactionFromHex(txHexBig);
    expect(txBig.outs[0].value.toString()).toEqual('49999999999999992');
  });
});
