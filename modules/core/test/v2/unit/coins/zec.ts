import 'should';
import * as _ from 'lodash';
import * as utxolib from '@bitgo/utxo-lib';

import { TestBitGo } from '../../../lib/test_bitgo';
import { Wallet } from '../../../../src/v2/wallet';

describe('ZEC:', function () {
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

    let coin;
    let testCoin;
    before(() => {
      coin = bitgo.coin('zec');
      testCoin = bitgo.coin('tzec');
    });

    describe('Should test address generation', () => {
      it('should validate pub key', () => {
        const { pub } = coin.keychains().create();
        coin.isValidPub(pub).should.equal(true);
      });
    });

    describe('Should test transaction signing', () => {

      // TODO(BG-31309): fix this test to not use hard coded tx hex values or update consensus branch id for fixture txs
      xit('should create local prebuild', async function () {
        const fundingAddress = 't2CgWUKFKRaKzPXQF2cooNFtVZR1gTM8xxM';
        const fundingRedeemScript = '522103dc94182103c93690c2bca3fe013c19c956b940645b11b0a752e0e56b156bf4e22103b5f4aa0348bf339400ed7e16c6e960a4a46a1ea4c4cbe21abf6d0403161dc4f22103706ff6b11a8d9e3d63a455788d5d96738929ca642f1f3d8f9acedb689e759f3753ae';

        const receiveAddress = 't2HPJLxLLXLbKkfQngpwhZCGKAhHuqyqPk4';
        const unspent = {
          id: '8047839532dcfec617661120e1baa0e3b9135662ac8e1f97561e500d430dccb1:0',
          address: fundingAddress,
          value: 300000000,
          valueString: '300000000',
          blockHeight: 999999999,
          date: '2018-05-20T01:44:13.713Z',
        };
        const [txHash, vout] = unspent.id.split(':');

        const txb = utxolib.bitgo.createTransactionBuilderForNetwork(testCoin.network);
        txb.addInput(txHash, parseInt(vout, 16), 0xffffffff);
        txb.addOutput(receiveAddress, unspent.value - 50000);

        const tx = txb.buildIncomplete();

        // Individual private keys derived from keychains above at chain=1 and index=113
        // key0WIF:  cUkLnuyeKgsEaFjtXqK2yhZwzrstTftHHtqMtw4pts8iKqwj3wd8
        // key2WIF:  cNGJM3pSFpCKvnXPa8RBx58BQdoUgQ5YkVP2mVyLSU5c5tNocY7k

        const prebuild = {
          txHex: tx.toHex(),
          txInfo: {
            unspents: [
              {
                chain: 1,
                index: 113,
                redeemScript: fundingRedeemScript,
                value: 300000000,
              },
            ],
          },
        };

        // zcash testnet full node commands used with private keys and unspent above to generate test vectors:
        // $ zcash-cli createrawtransaction '[{"txid":"8047839532dcfec617661120e1baa0e3b9135662ac8e1f97561e500d430dccb1","vout":0}]' '{"t2HPJLxLLXLbKkfQngpwhZCGKAhHuqyqPk4":2.9995}' 0 0
        // $ zcash-cli  --conf=/data/zcashd.conf signrawtransaction 0400008085202f8901b1cc0d430d501e56971f8eac625613b9e3a0bae120116617c6fedc32958347800000000000ffffffff01b0dfe0110000000017a91476dce7beb23d0e0d53edf5895716d4c80dce60938700000000000000000000000000000000000000 '[{"txid":"8047839532dcfec617661120e1baa0e3b9135662ac8e1f97561e500d430dccb1", "vout":0,"scriptPubKey":"a91443457880e5e29555d6ad16bc82ef53891d6512b087","redeemScript":"522103dc94182103c93690c2bca3fe013c19c956b940645b11b0a752e0e56b156bf4e22103b5f4aa0348bf339400ed7e16c6e960a4a46a1ea4c4cbe21abf6d0403161dc4f22103706ff6b11a8d9e3d63a455788d5d96738929ca642f1f3d8f9acedb689e759f3753ae","amount":3}]' '["cUkLnuyeKgsEaFjtXqK2yhZwzrstTftHHtqMtw4pts8iKqwj3wd8"]'

        const wallet = new Wallet(bitgo, testCoin, {});
        const halfSigned: any = await wallet.signTransaction({
          txPrebuild: prebuild,
          prv: keychains[0].prv,
        });
        const halfSignedTx = utxolib.bitgo.createTransactionFromHex(halfSigned.txHex, testCoin.network) as utxolib.bitgo.ZcashTransaction;
        halfSignedTx.network.coin.should.equal('zec');
        halfSignedTx.version.should.equal(4);
        halfSignedTx.versionGroupId.should.equal(2301567109);
        halfSignedTx.overwintered.should.equal(1);
        halfSignedTx.expiryHeight.should.equal(0);
        halfSigned.txHex.should.equal('0400008085202f8901b1cc0d430d501e56971f8eac625613b9e3a0bae120116617c6fedc329583478000000000b600473044022045a9e50e154fbd696fde1b422309b7d32d73f5bf5467c6ef1066e17de4a497bd0220593cecd9e91e545470d77ff7eb932449b42f61d1a10cad7d3d8c20b76da6e7ac0100004c69522103dc94182103c93690c2bca3fe013c19c956b940645b11b0a752e0e56b156bf4e22103b5f4aa0348bf339400ed7e16c6e960a4a46a1ea4c4cbe21abf6d0403161dc4f22103706ff6b11a8d9e3d63a455788d5d96738929ca642f1f3d8f9acedb689e759f3753aeffffffff01b0dfe0110000000017a91476dce7beb23d0e0d53edf5895716d4c80dce60938700000000000000000000000000000000000000');

        // $ zcash-cli  --conf=/data/zcashd.conf signrawtransaction 0400008085202f8901b1cc0d430d501e56971f8eac625613b9e3a0bae120116617c6fedc329583478000000000b400473044022045a9e50e154fbd696fde1b422309b7d32d73f5bf5467c6ef1066e17de4a497bd0220593cecd9e91e545470d77ff7eb932449b42f61d1a10cad7d3d8c20b76da6e7ac014c69522103dc94182103c93690c2bca3fe013c19c956b940645b11b0a752e0e56b156bf4e22103b5f4aa0348bf339400ed7e16c6e960a4a46a1ea4c4cbe21abf6d0403161dc4f22103706ff6b11a8d9e3d63a455788d5d96738929ca642f1f3d8f9acedb689e759f3753aeffffffff01b0dfe0110000000017a91476dce7beb23d0e0d53edf5895716d4c80dce60938700000000000000000000000000000000000000 '[{"txid":"8047839532dcfec617661120e1baa0e3b9135662ac8e1f97561e500d430dccb1", "vout":0,"scriptPubKey":"a91443457880e5e29555d6ad16bc82ef53891d6512b087","redeemScript":"522103dc94182103c93690c2bca3fe013c19c956b940645b11b0a752e0e56b156bf4e22103b5f4aa0348bf339400ed7e16c6e960a4a46a1ea4c4cbe21abf6d0403161dc4f22103706ff6b11a8d9e3d63a455788d5d96738929ca642f1f3d8f9acedb689e759f3753ae","amount":3}]' '["cNGJM3pSFpCKvnXPa8RBx58BQdoUgQ5YkVP2mVyLSU5c5tNocY7k"]'

        const halfSignedPrebuild = _.extend({}, prebuild, halfSigned);
        const fullySigned: any = await wallet.signTransaction({
          txPrebuild: halfSignedPrebuild,
          prv: keychains[2].prv,
          isLastSignature: true,
        });
        const fullySignedTx = utxolib.bitgo.createTransactionFromHex(fullySigned.txHex, testCoin.network) as utxolib.bitgo.ZcashTransaction;
        fullySignedTx.network.coin.should.equal('zec');
        fullySignedTx.version.should.equal(4);
        fullySignedTx.versionGroupId.should.equal(2301567109);
        fullySignedTx.overwintered.should.equal(1);
        fullySignedTx.expiryHeight.should.equal(0);
        fullySignedTx.getId().should.equal('0e9563728f7595a664c02b305772898149c75c03ef462f2cbc4464476b4dcdc9');

        fullySigned.txHex.should.equal('0400008085202f8901b1cc0d430d501e56971f8eac625613b9e3a0bae120116617c6fedc329583478000000000fc00473044022045a9e50e154fbd696fde1b422309b7d32d73f5bf5467c6ef1066e17de4a497bd0220593cecd9e91e545470d77ff7eb932449b42f61d1a10cad7d3d8c20b76da6e7ac01473044022026b3ebe39a8866d10c4a349a1fb73893d434bf851af552136a98f5a969077c4102207f6d439d37ecefec3c98da1a4f1f9eaaf280243b90708f7043e463734169217f014c69522103dc94182103c93690c2bca3fe013c19c956b940645b11b0a752e0e56b156bf4e22103b5f4aa0348bf339400ed7e16c6e960a4a46a1ea4c4cbe21abf6d0403161dc4f22103706ff6b11a8d9e3d63a455788d5d96738929ca642f1f3d8f9acedb689e759f3753aeffffffff01b0dfe0110000000017a91476dce7beb23d0e0d53edf5895716d4c80dce60938700000000000000000000000000000000000000');
      });
    });
  });
});
