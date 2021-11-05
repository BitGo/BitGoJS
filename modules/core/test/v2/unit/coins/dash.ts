import 'should';

import * as _ from 'lodash';
import { TestBitGo } from '../../../lib/test_bitgo';
import { Wallet } from '../../../../src/v2/wallet';

describe('DASH:', function () {
  let bitgo;

  before(function () {
    bitgo = new TestBitGo({ env: 'test' });
    bitgo.initializeTestVars();
  });

  describe('Should test derivation-related functions', () => {

    const keychains = [
      {
        pub: 'xpub661MyMwAqRbcGiQhVk1J7cD1YodF9tc5Y1B8vpTjjB1pcB1J1m1QX8fMtYP2sYqFmW6J2ra69tNoARKjvTGo9cGUrbPbJdjwrSzGGzPzWWS',
        prv: 'xprv9s21ZrQH143K4ELEPiUHkUGGzmnkkRtEAnFY8S48AqUqjNg9UDh9yLLt3FcfATyCjbsMB9JCGHAD8MeBTAK1P7trFppkoswu5ZAsHYASfbk',
      },
      {
        pub: 'xpub661MyMwAqRbcFzLXuganogQvd7MrefQQqCcJP2ZDumnCdQecf5cw1P1nD5qBz8SNS1yCLSC9VqpNUWnQU3V6qmnPt2r21oXhicQFzPA6Lby',
        prv: 'xprv9s21ZrQH143K3WG4of3nSYUC55XNFCgZTyghae9cMSFDkcKU7YJgTahJMpdTY9CjCcjgSo2TJ635uUVx176BufUMBFpieKYVJD9J3VvrGRm',
      },
      {
        pub: 'xpub661MyMwAqRbcFHpwWrzPB61U2CgBmdD21WNVM1JKUn9rEExkoGE4yafUVFbPSd78vdX8tWcEUQWaALFkU9fUbUM4Cc49DKEJSCYGRnbzCym',
        prv: 'xprv9s21ZrQH143K2okUQqTNox4jUAqhNAVAeHStYcthvScsMSdcFiupRnLzdxzfJithak5Zs92FQJeeJ9Jiya63KfUNxawuMZDCp2cGT9cdMKs',
      },
    ];

    let testCoin;
    before(() => {
      testCoin = bitgo.coin('tdash');
    });

    describe('Should test transaction signing', () => {

      it('should sign transaction', async function () {
        const wallet = new Wallet(bitgo, testCoin, {});
        const prebuild = {
          txHex: '0100000001b382e9c5349f84400afb0417bdaa36ea32331d5b76a0ee9d250ce3691e40bb610000000000ffffffff01005cf7f10000000017a91443457880e5e29555d6ad16bc82ef53891d6512b08700000000',
          txInfo: {
            unspents: [
              {
                chain: 0,
                index: 0,
                redeemScript: '5221037acffd52bb7c39a4ac3d4c01af33ce0367afec45347e332edca63a38d1fb2e472102658831a87322b3583515ca8725841335505755ada53ee133c70a6b4b8d3978702102641ee6557561c9038242cafa7f538070d7646a969bcf6169f9950abfcfefd6b853ae',
                address: '8hBtzbNgcWpnxorvnFtCia7KEdFFLmoiFj',
              },
            ],
          },
        };

        const halfSigned = await wallet.signTransaction({
          txPrebuild: prebuild,
          prv: keychains[0].prv,
        });
        (halfSigned as any).txHex.should.equal('0100000001b382e9c5349f84400afb0417bdaa36ea32331d5b76a0ee9d250ce3691e40bb6100000000b6004730440220467c83751870257a8f152988e8363b05fdcc42addabc6c1bc763d22bd2410309022057cc7a541a408880430c8cfe9abe23bcf27964e027cdd0a63f19eda4777423190100004c695221037acffd52bb7c39a4ac3d4c01af33ce0367afec45347e332edca63a38d1fb2e472102658831a87322b3583515ca8725841335505755ada53ee133c70a6b4b8d3978702102641ee6557561c9038242cafa7f538070d7646a969bcf6169f9950abfcfefd6b853aeffffffff01005cf7f10000000017a91443457880e5e29555d6ad16bc82ef53891d6512b08700000000');

        const halfSignedPrebuild = _.extend({}, prebuild, halfSigned);
        const fullySigned = await wallet.signTransaction({
          txPrebuild: halfSignedPrebuild,
          prv: keychains[2].prv,
          isLastSignature: true,
        });

        // http://test.insight.masternode.io:3001/tx/8a69678157b312d59b19673ddbf53185c9bffdff816ab894dd81413a3c81ffbd
        (fullySigned as any).txHex.should.equal('0100000001b382e9c5349f84400afb0417bdaa36ea32331d5b76a0ee9d250ce3691e40bb6100000000fdfd00004730440220467c83751870257a8f152988e8363b05fdcc42addabc6c1bc763d22bd2410309022057cc7a541a408880430c8cfe9abe23bcf27964e027cdd0a63f19eda47774231901483045022100d61f490433b43a4c2264aef93ce9dff6a7ef05fd114a3685d882511d8a9a381802204abf5c9cd6e1ce20a4b2658310cc1740c80a1ec1ceabce48d6e45c464d1ee85a014c695221037acffd52bb7c39a4ac3d4c01af33ce0367afec45347e332edca63a38d1fb2e472102658831a87322b3583515ca8725841335505755ada53ee133c70a6b4b8d3978702102641ee6557561c9038242cafa7f538070d7646a969bcf6169f9950abfcfefd6b853aeffffffff01005cf7f10000000017a91443457880e5e29555d6ad16bc82ef53891d6512b08700000000');
      });
    });

  });

});
