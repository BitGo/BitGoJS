import * as should from 'should';
import * as Promise from 'bluebird';
const co = Promise.coroutine;
import * as _ from 'lodash';
const bitcoin = require('@bitgo/utxo-lib');
const prova = require('prova-lib');
const { Codes } = require('@bitgo/unspents');
import { TestBitGo } from '../../../lib/test_bitgo';
import { Wallet } from '../../../../src/v2/wallet';

describe('LTC:', function() {
  let bitgo;
  let ltc;
  let tltc;

  before(function() {
    bitgo = new TestBitGo({ env: 'test' });
    bitgo.initializeTestVars();
    ltc = bitgo.coin('ltc');
    tltc = bitgo.coin('tltc');
  });

  describe('Canonicalize address', function() {

    it('base58 mainnet address', function() {
      const standardBase58Address = '3GBygsGPvTdfKMbq4AKZZRu1sPMWPEsBfd';
      const litecoinBase58Address = 'MNQ7zkgMsaV67rsjA3JuP59RC5wxRXpwgE';

      // convert from new format to old
      const downgradedAddress = ltc.canonicalAddress(litecoinBase58Address, 1);
      downgradedAddress.should.equal(standardBase58Address);

      // convert from new format to new (no-op)
      const unmodifiedAddress = ltc.canonicalAddress(litecoinBase58Address, 2);
      unmodifiedAddress.should.equal(litecoinBase58Address);

      // convert from old format to new
      const upgradedAddress = ltc.canonicalAddress(standardBase58Address, 2);
      upgradedAddress.should.equal(litecoinBase58Address);
    });

    it('base58 testnet address', function() {
      const standardBase58Address = '2MsFGJvxH1kCoRp3XEYvKduAjY6eYz9PJHz';
      const litecoinBase58Address = 'QLc2RwpX2rFtZzoZrexLibcAgV6Nsg74Jn';

      // convert from new format to old
      const downgradedAddress = tltc.canonicalAddress(litecoinBase58Address, 1);
      downgradedAddress.should.equal(standardBase58Address);

      // convert from new format to new (no-op)
      const unmodifiedAddress = tltc.canonicalAddress(litecoinBase58Address, 2);
      unmodifiedAddress.should.equal(litecoinBase58Address);

      // convert from old format to new
      const upgradedAddress = tltc.canonicalAddress(standardBase58Address, 2);
      upgradedAddress.should.equal(litecoinBase58Address);
    });

    it('bech32 mainnet address', function() {
      // canonicalAddress will only lower case bech32 addresses - they are already
      // in canonical format, and the script hash version is not relevant
      const bech32Address = 'ltc1qgrl8zpndsklaa9swgd5vevyxmx5x63vcrl7dk4';
      const version1Address = ltc.canonicalAddress(bech32Address, 1);
      version1Address.should.equal(bech32Address);
      const version2Address = ltc.canonicalAddress(bech32Address, 2);
      version2Address.should.equal(bech32Address);
    });

    it('upper case bech32 mainnet address', function() {
      // bech32 addresses which are all upper case or all lower case are potentially valid,
      // but mixed case is always invalid. Canonical bech32 addresses should be all lower case however
      const bech32Address = 'LTC1QGRL8ZPNDSKLAA9SWGD5VEVYXMX5X63VCRL7DK4';
      const newAddress = ltc.canonicalAddress(bech32Address);
      newAddress.should.equal(bech32Address.toLowerCase());
    });

    it('bech32 testnet address', function() {
      const bech32Address = 'tltc1qu78xur5xnq6fjy83amy0qcjfau8m367defyhms';
      const version1Address = tltc.canonicalAddress(bech32Address, 1);
      version1Address.should.equal(bech32Address);
      const version2Address = tltc.canonicalAddress(bech32Address, 2);
      version2Address.should.equal(bech32Address);
    });
  });

  describe('should validate addresses', () => {
    it('should validate base58 addresses', () => {
      // known valid main and testnet base58 address are valid
      ltc.isValidAddress('MH6J1PzpsAfapZek7QGHv2mheUxnP8Kdek').should.be.true();
      tltc.isValidAddress('QWC1miKKHFikbwg2iyt8KZBGsTSEBKr21i').should.be.true();

      // malformed base58 addresses are invalid
      ltc.isValidAddress('MH6J1PzpsAfapZek7QGHv2mheUxnP8Kder').should.be.false();
      tltc.isValidAddress('QWC1miKKHFikbwg2iyt8KZBGsTSEBKr21l').should.be.false();
    });

    it('should validate bech32 addresses', () => {
      // all lower case is valid
      ltc.isValidAddress('ltc1qq7fzt3ek5ege3v92wh0q6wzcjr39pqswlpe36mu28f6yufark3wspfryg7').should.be.true();
      tltc.isValidAddress('tltc1qq7fzt3ek5ege3v92wh0q6wzcjr39pqswlpe36mu28f6yufark3ws2x86ht').should.be.true();

      // all upper case is also valid
      ltc.isValidAddress('LTC1QQ7FZT3EK5EGE3V92WH0Q6WZCJR39PQSWLPE36MU28F6YUFARK3WSPFRYG7').should.be.true();
      tltc.isValidAddress('TLTC1QQ7FZT3EK5EGE3V92WH0Q6WZCJR39PQSWLPE36MU28F6YUFARK3WS2X86HT').should.be.true();

      // mixed case is invalid
      ltc.isValidAddress('LTC1QQ7FZT3EK5EGE3V92WH0Q6WZCJR39PQSWLPE36MU28F6YUFARK3WSPFRYg7').should.be.false();
      tltc.isValidAddress('TLTC1QQ7FZT3EK5EGE3V92WH0Q6WZCJR39PQSWLPE36MU28F6YUFARK3WS2X86Ht').should.be.false();

      // malformed addresses are invalid
      ltc.isValidAddress('ltc1qq7fzt3ek5ege3v92wh0q6wzcjr39pqswlpe36mu28f6yufark3wspfryg9').should.be.false();
      tltc.isValidAddress('tltc1qq7fzt3ek5ege3v92wh0q6wzcjr39pqswlpe36mu28f6yufark3ws2x86hl').should.be.false();
    });
  });

  describe('Should test address generation', () => {

    const keychains = [
      {
        pub: 'xpub661MyMwAqRbcGiQhVk1J7cD1YodF9tc5Y1B8vpTjjB1pcB1J1m1QX8fMtYP2sYqFmW6J2ra69tNoARKjvTGo9cGUrbPbJdjwrSzGGzPzWWS',
        prv: 'xprv9s21ZrQH143K4ELEPiUHkUGGzmnkkRtEAnFY8S48AqUqjNg9UDh9yLLt3FcfATyCjbsMB9JCGHAD8MeBTAK1P7trFppkoswu5ZAsHYASfbk'
      },
      {
        pub: 'xpub661MyMwAqRbcFzLXuganogQvd7MrefQQqCcJP2ZDumnCdQecf5cw1P1nD5qBz8SNS1yCLSC9VqpNUWnQU3V6qmnPt2r21oXhicQFzPA6Lby',
        prv: 'xprv9s21ZrQH143K3WG4of3nSYUC55XNFCgZTyghae9cMSFDkcKU7YJgTahJMpdTY9CjCcjgSo2TJ635uUVx176BufUMBFpieKYVJD9J3VvrGRm'
      },
      {
        pub: 'xpub661MyMwAqRbcFHpwWrzPB61U2CgBmdD21WNVM1JKUn9rEExkoGE4yafUVFbPSd78vdX8tWcEUQWaALFkU9fUbUM4Cc49DKEJSCYGRnbzCym',
        prv: 'xprv9s21ZrQH143K2okUQqTNox4jUAqhNAVAeHStYcthvScsMSdcFiupRnLzdxzfJithak5Zs92FQJeeJ9Jiya63KfUNxawuMZDCp2cGT9cdMKs'
      }
    ];

    it('should generate p2sh address', () => {
      const generatedAddress = ltc.generateAddress({ keychains });
      const generatedTestAddress = tltc.generateAddress({ keychains });

      [generatedAddress, generatedTestAddress].forEach((currentAddress) => {
        currentAddress.chain.should.equal(0);
        currentAddress.index.should.equal(0);
        currentAddress.coinSpecific.outputScript.should.equal('a9141e57a925dd863a86af341037e700862bf66bf7b687');
        currentAddress.coinSpecific.redeemScript.should.equal('5221037acffd52bb7c39a4ac3d4c01af33ce0367afec45347e332edca63a38d1fb2e472102658831a87322b3583515ca8725841335505755ada53ee133c70a6b4b8d3978702102641ee6557561c9038242cafa7f538070d7646a969bcf6169f9950abfcfefd6b853ae');
      });

      generatedAddress.address.should.equal('MAfbWxccd7BxKFBcYGD5kTYhkGEVTkPv3o');
      generatedTestAddress.address.should.equal('QPNRPpzvJYtxriJJjcsddTiznJJ35u6Chk');

      ltc.verifyAddress(_.extend({}, generatedAddress, { keychains }));
      tltc.verifyAddress(_.extend({}, generatedTestAddress, { keychains }));
    });

    it('should generate custom chain p2sh address', () => {
      const generatedAddress = ltc.generateAddress({ keychains, chain: 1, index: 113 });
      const generatedTestAddress = tltc.generateAddress({ keychains, chain: 1, index: 113 });

      [generatedAddress, generatedTestAddress].forEach((currentAddress) => {
        currentAddress.chain.should.equal(1);
        currentAddress.index.should.equal(113);
        currentAddress.coinSpecific.outputScript.should.equal('a91443457880e5e29555d6ad16bc82ef53891d6512b087');
        currentAddress.coinSpecific.redeemScript.should.equal('522103dc94182103c93690c2bca3fe013c19c956b940645b11b0a752e0e56b156bf4e22103b5f4aa0348bf339400ed7e16c6e960a4a46a1ea4c4cbe21abf6d0403161dc4f22103706ff6b11a8d9e3d63a455788d5d96738929ca642f1f3d8f9acedb689e759f3753ae');
      });

      generatedAddress.address.should.equal('ME2rjC91XunT3h3WGKyyWTrLWyBsieoQuD');
      generatedTestAddress.address.should.equal('QSjgc4XKDMVTbAACTgeXPU2dZ1FRUzCVKn');

      ltc.verifyAddress(_.extend({}, generatedAddress, { keychains }));
      tltc.verifyAddress(_.extend({}, generatedTestAddress, { keychains }));
    });

    it('should generate custom chain p2wsh bech32 address', () => {
      const generatedAddress = ltc.generateAddress({ keychains, chain: 21, index: 113, addressType: Codes.UnspentTypeTcomb('p2wsh') });
      const generatedTestAddress = tltc.generateAddress({ keychains, chain: 21, index: 113, addressType: Codes.UnspentTypeTcomb('p2wsh') });
      [generatedAddress, generatedTestAddress].forEach((currentAddress) => {
        currentAddress.chain.should.equal(21);
        currentAddress.index.should.equal(113);
        currentAddress.coinSpecific.outputScript.should.equal('0020079225c736a65198b0aa75de0d385890e250820ef8731d6f8a3a744e27a3b45d');
        should.not.exist(currentAddress.coinSpecific.redeemScript);
        currentAddress.coinSpecific.witnessScript.should.equal('5221027ec22f583acba5af0a6c5ed43cffb204811cb62cc7cad0e37673ce2ae7693b492103b5324d802f60116366261abb759758629d3d7bd7f2a2d8ff0ee78bfb9e2b387121039e17f3ca6f256ae24cfa9664cf08add84a3cc39ae96c56cacf6b0f846a6d07d853ae');
      });

      generatedAddress.address.should.equal('ltc1qq7fzt3ek5ege3v92wh0q6wzcjr39pqswlpe36mu28f6yufark3wspfryg7');
      generatedTestAddress.address.should.equal('tltc1qq7fzt3ek5ege3v92wh0q6wzcjr39pqswlpe36mu28f6yufark3ws2x86ht');

      ltc.verifyAddress(_.extend({}, generatedAddress, { keychains }));
      tltc.verifyAddress(_.extend({}, generatedTestAddress, { keychains }));
    });

    it('should generate p2sh-wrapped segwit address', () => {
      const addressType = Codes.UnspentTypeTcomb('p2shP2wsh');
      const chain = Codes.forType(addressType)[Codes.PurposeTcomb('external')];
      const generatedAddress = ltc.generateAddress({ keychains, addressType, chain });
      const generatedTestAddress = tltc.generateAddress({ keychains, addressType, chain });

      [generatedAddress, generatedTestAddress].forEach((currentAddress) => {
        currentAddress.chain.should.equal(chain);
        currentAddress.index.should.equal(0);
        currentAddress.coinSpecific.outputScript.should.equal('a9147ff13f3faeba4d439ef40604f7c127951e77eb6a87');
        currentAddress.coinSpecific.redeemScript.should.equal('00207aad7d57b238a09b5daa10ff47c54483b7f2ad47f3f0c0aa230958b9df334260');
        currentAddress.coinSpecific.witnessScript.should.equal('52210304fcea3fb05f6e8a8fe91db2087bdd13b18102a0b10a77c1fdbb326b0ce7cec421028242a3ea9e20d4e6b78e3f0dde21aff86a623d48322681b203b6827e22d04a9d2102ceec88b222a55ec67d1414b523bcfc0f53eb6ac012ba91744a4ed8eb448d55f753ae');
      });

      generatedAddress.address.should.equal('MKZf3w3b2hACjfJNbqifSYPixNkZjxBTg9');
      generatedTestAddress.address.should.equal('QYGUvoRti8sDH8R4oCPDKYa1zQp7UWCfAA');

      ltc.verifyAddress(_.extend({}, generatedAddress, { keychains }));
      tltc.verifyAddress(_.extend({}, generatedTestAddress, { keychains }));
    });

    it('should generate 3/3 p2sh address', () => {
      const generatedAddress = ltc.generateAddress({ keychains, threshold: 3 });
      const generatedTestAddress = tltc.generateAddress({ keychains, threshold: 3 });

      [generatedAddress, generatedTestAddress].forEach((currentAddress) => {
        currentAddress.chain.should.equal(0);
        currentAddress.index.should.equal(0);
        currentAddress.coinSpecific.outputScript.should.equal('a91476dce7beb23d0e0d53edf5895716d4c80dce609387');
        currentAddress.coinSpecific.redeemScript.should.equal('5321037acffd52bb7c39a4ac3d4c01af33ce0367afec45347e332edca63a38d1fb2e472102658831a87322b3583515ca8725841335505755ada53ee133c70a6b4b8d3978702102641ee6557561c9038242cafa7f538070d7646a969bcf6169f9950abfcfefd6b853ae');
      });

      generatedAddress.address.should.equal('MJjebqE2dg3nQq43vY7shQEA8FU79jWWUS');
      generatedTestAddress.address.should.equal('QXSUUhcLK7knxJAk7tnRaQQTAHXerpdjV3');
    });

    it('should generate 3/3 custom chain p2sh-wrapped segwit address', () => {
      const addressType = Codes.UnspentTypeTcomb('p2shP2wsh');
      const chain = Codes.forType(addressType)[Codes.PurposeTcomb('external')];
      const generatedAddress = ltc.generateAddress({ keychains, threshold: 3, addressType, chain, index: 756 });
      const generatedTestAddress = tltc.generateAddress({
        keychains,
        threshold: 3,
        addressType,
        chain,
        index: 756
      });

      [generatedAddress, generatedTestAddress].forEach((currentAddress) => {
        currentAddress.chain.should.equal(chain);
        currentAddress.index.should.equal(756);
        currentAddress.coinSpecific.outputScript.should.equal('a914ad395d176042ce737e4f5b65c0eb5de703a4e80087');
        currentAddress.coinSpecific.redeemScript.should.equal('0020d15d8d124adb4c213905ebb2cec8517faf38ae0ec4f7b4f1cfa358e6cc06a93d');
        currentAddress.coinSpecific.witnessScript.should.equal('532102bb8096d5c12e8b0ee50dd2b14f63dd09c8494b5a0a730794a0e392a6f2a3b2a8210366dbf2135105dc65eed5173c1acf1a902fc2e9dd366b9a6fa0e682c0fb4c21a32102bf998121d4d09d4305b025b5d2de8a7e954fe96179a1dfc076ad11ad4751c99e53ae');
      });

      generatedAddress.address.should.equal('MPh5rK4numViA9uYa2soZzfeNBEA6rFUPj');
      generatedTestAddress.address.should.equal('QcPujBT6bDCihd2EmPYMSzqwQDHhpjb96x');
    });

    it('should validate pub key', () => {
      const { pub } = ltc.keychains().create();
      ltc.isValidPub(pub).should.equal(true);
    });
  });

  describe('Should correctly sign segwit transactions', () => {

    const userKeychain = {
      prv: 'xprv9s21ZrQH143K2eBAnP4BbBvdEAEN76jTtvgK5qfmwqNZVR9yr2J4BwkuYRignCKge76RuTBRwB5kzLUKyNzsPxFGmjUWc1bk3jQyJjPNfiQ',
      pub: 'xpub661MyMwAqRbcF8FdtQbBxKsMnC4rWZTKG9butE5PWAuYNDV8PZcJjk5PPiefRF3o1Wc89nTBjXucS7gobapEensmLQPLEMfw6CHoEKJ3cez',
      rawPub: '03a46e1545d607843bdced8766d5acc9ef7015842911488c56608f2589f384928c',
      rawPrv: 'aa2f1f4a63f0cb1ef71d497b1630965efb9ca863684b362dcb0dfb818d1810b7'
    };
    const backupKeychain = {
      prv: 'xprv9s21ZrQH143K2WWmrYupmGTCQdtcdZYyhvkCxkEvXX11aDYMrnrW4UCxPHHcXr2a3vqnUpg7PzcmE9qeTaRmMocVmHhqchsCmGca14dJL9x',
      pub: 'xpub661MyMwAqRbcEzbExaSq8QPvxfj732Gq59fom8eY5rXzT1sWQLAkcGXSEadoMZ94XQeUawnV1NtiRce59qZMJmwZ69LbbdGfr9D178ZQn8A',
      rawPub: '03d94ed545e6f9f0d5e0fc7aa88e4dbccc4b61daa680ab44b38a8a1a9477808b31',
      rawPrv: 'a8170fc6e98084c6514f98f7aca0bd5ca025e82470c75270502a0dc634770b07'
    };

    const bitgoKeychain = {
      pub: 'xpub661MyMwAqRbcH4GuguMES7cpmzp2ZaAd74L8FabMdcfxEfjdNktHNQtaBvWyju5WxRPEnuoKAaPskkK9UrX5eJ8GnnrCmrd2TWyiKKP1bhp'
    };

    const prebuild = {
      txHex: '0100000001ad26ff8d387cb1aff967fc76fd96c8036a5ad2f1e9aa5214bc07b019ec63b1830100000000ffffffff0200e1f5050000000017a9144b422c82fef274b72106572af74097773b7dd56587180fe0110000000017a914139de7a47eb613076c790aaaee21d8bbe28942ab8700000000',
      txInfo: {
        nP2SHInputs: 1,
        nSegwitInputs: 0,
        nOutputs: 2,
        unspents: [
          {
            chain: 10,
            index: 3,
            redeemScript: '0020c4138370d5d77d8d3ccf3dc7561d0232bc743b8d1c16074881b91556e296a9f8',
            witnessScript: '522102b4f2c26870cdd4fd6d93ac0fd89f536beaed2a4c59daeea318f7355d1b3420932102363a336031faf1506ee79c7939a44e3259b35fa25bd5ea7bcf0ce5359d8792c32103d18ae6a34e70400b303ea95cccca3e33a648f63624a52b306e2aedc6a4cfd63753ae',
            id: '83b163ec19b007bc1452aae9f1d25a6a03c896fd76fc67f9afb17c388dff26ad:1',
            address: 'QYdqqKeWRZSU1pdZX8obV9CmQtqU8LgVqj',
            value: 400000000
          }
        ],
        changeAddresses: [
          'QNPi7N8wS2JbxeygxZJwUUKefNExFekA15'
        ]
      },
      feeInfo: {
        size: 373,
        fee: 100000,
        feeRate: 100000,
        payGoFee: 0,
        payGoFeeString: '0'
      },
      walletId: '5a822e7d3df39bcf07121980decdc82c'
    };

    let basecoin;
    let wallet;

    before(() => {
      basecoin = bitgo.coin('tltc');
      wallet = new Wallet(bitgo, basecoin, {
        id: '5a822e7d3df39bcf07121980decdc82c',
        users: [
          {
            user: '543c11ed356d00cb7600000b98794503',
            permissions: [
              'admin',
              'view',
              'spend'
            ]
          }
        ],
        coin: 'tltc',
        label: 'Litecoin Segwit Test Wallet',
        m: 2,
        n: 3,
        keys: [
          '5a822e7db38993f2063dcddc8bcd1936',
          '5a822e7d033389d007fb7369a2ac298f',
          '5a822e7d524eb4d206a845914ac79f24'
        ],
        tags: [
          '5a822e7d3df39bcf07121980decdc82c'
        ],
        disableTransactionNotifications: false,
        freeze: {},
        deleted: false,
        approvalsRequired: 1,
        isCold: true,
        coinSpecific: {},
        admin: {
          policy: {
            id: '5a822e7d3df39bcf0712198142d3afb1',
            version: 0,
            date: '2018-02-13T00:17:01.373Z',
            mutableUpToDate: '2018-02-15T00:17:01.373Z',
            rules: []
          }
        },
        clientFlags: [],
        balance: 400000000,
        confirmedBalance: 400000000,
        spendableBalance: 400000000,
        balanceString: '400000000',
        confirmedBalanceString: '400000000',
        spendableBalanceString: '400000000',
        receiveAddress: {
          id: '5a8231626981c9e8078aadd6e5bfad5c',
          address: 'QTg62ARdS1CU7iaiyDhTwZZbmJ2KXA3FSP',
          chain: 0,
          index: 3,
          coin: 'tltc',
          wallet: '5a822e7d3df39bcf07121980decdc82c',
          coinSpecific: {
            redeemScript: '522102aaf588c5c91a2e019661e8090bf69c4a4a87ea55ecb54c1da51c2c3fdf39f72e21020d1b3bb7cc897fec305bbcfedb17b0bf57fe89dda627dfcfcf7b1d29886d2ca82102d2ebf18aa2a0a4813f9dc8f3c34af4aa21d0c583fdce0ab468a607fd3347f4d053ae'
          }
        },
        pendingApprovals: []
      });
    });

    it('should sign with user key and then with backup key', co(function *() {
      prebuild.txHex.should.equal('0100000001ad26ff8d387cb1aff967fc76fd96c8036a5ad2f1e9aa5214bc07b019ec63b1830100000000ffffffff0200e1f5050000000017a9144b422c82fef274b72106572af74097773b7dd56587180fe0110000000017a914139de7a47eb613076c790aaaee21d8bbe28942ab8700000000');

      // half-sign the transaction
      const halfSigned = yield wallet.signTransaction({
        txPrebuild: prebuild,
        prv: userKeychain.prv
      });
      const halfSignedPrebuild = _.extend({}, prebuild, halfSigned);
      halfSignedPrebuild.txHex.should.equal('01000000000101ad26ff8d387cb1aff967fc76fd96c8036a5ad2f1e9aa5214bc07b019ec63b1830100000023220020c4138370d5d77d8d3ccf3dc7561d0232bc743b8d1c16074881b91556e296a9f8ffffffff0200e1f5050000000017a9144b422c82fef274b72106572af74097773b7dd56587180fe0110000000017a914139de7a47eb613076c790aaaee21d8bbe28942ab870500483045022100a8ae2918d0589bfad341f2d46499c118542537ce22f5cc199d96fc949bdd445302206f56289185e6f5d81a5531632c4985847af1df20f4a078f2290e331411f35f6c01000069522102b4f2c26870cdd4fd6d93ac0fd89f536beaed2a4c59daeea318f7355d1b3420932102363a336031faf1506ee79c7939a44e3259b35fa25bd5ea7bcf0ce5359d8792c32103d18ae6a34e70400b303ea95cccca3e33a648f63624a52b306e2aedc6a4cfd63753ae00000000');

      // add the backup signature
      const fullySigned = yield wallet.signTransaction({
        txPrebuild: halfSignedPrebuild,
        prv: backupKeychain.prv,
        isLastSignature: true
      });
      fullySigned.txHex.should.equal('01000000000101ad26ff8d387cb1aff967fc76fd96c8036a5ad2f1e9aa5214bc07b019ec63b1830100000023220020c4138370d5d77d8d3ccf3dc7561d0232bc743b8d1c16074881b91556e296a9f8ffffffff0200e1f5050000000017a9144b422c82fef274b72106572af74097773b7dd56587180fe0110000000017a914139de7a47eb613076c790aaaee21d8bbe28942ab870400483045022100a8ae2918d0589bfad341f2d46499c118542537ce22f5cc199d96fc949bdd445302206f56289185e6f5d81a5531632c4985847af1df20f4a078f2290e331411f35f6c01483045022100b4b6c9e7b300f5362d82a69730983eea9de575106747fd424e179499fb78a74602206546801fb3f0f1fcc090003906020575d7b27c851e7fbea3b917480793180bb00169522102b4f2c26870cdd4fd6d93ac0fd89f536beaed2a4c59daeea318f7355d1b3420932102363a336031faf1506ee79c7939a44e3259b35fa25bd5ea7bcf0ce5359d8792c32103d18ae6a34e70400b303ea95cccca3e33a648f63624a52b306e2aedc6a4cfd63753ae00000000');
    }));

    it('should sign with backup key and then with user key', co(function *() {
      prebuild.txHex.should.equal('0100000001ad26ff8d387cb1aff967fc76fd96c8036a5ad2f1e9aa5214bc07b019ec63b1830100000000ffffffff0200e1f5050000000017a9144b422c82fef274b72106572af74097773b7dd56587180fe0110000000017a914139de7a47eb613076c790aaaee21d8bbe28942ab8700000000');

      // half-sign the transaction
      const halfSigned = yield wallet.signTransaction({
        txPrebuild: prebuild,
        prv: backupKeychain.prv
      });
      const halfSignedPrebuild = _.extend({}, prebuild, halfSigned);
      halfSignedPrebuild.txHex.should.equal('01000000000101ad26ff8d387cb1aff967fc76fd96c8036a5ad2f1e9aa5214bc07b019ec63b1830100000023220020c4138370d5d77d8d3ccf3dc7561d0232bc743b8d1c16074881b91556e296a9f8ffffffff0200e1f5050000000017a9144b422c82fef274b72106572af74097773b7dd56587180fe0110000000017a914139de7a47eb613076c790aaaee21d8bbe28942ab87050000483045022100b4b6c9e7b300f5362d82a69730983eea9de575106747fd424e179499fb78a74602206546801fb3f0f1fcc090003906020575d7b27c851e7fbea3b917480793180bb0010069522102b4f2c26870cdd4fd6d93ac0fd89f536beaed2a4c59daeea318f7355d1b3420932102363a336031faf1506ee79c7939a44e3259b35fa25bd5ea7bcf0ce5359d8792c32103d18ae6a34e70400b303ea95cccca3e33a648f63624a52b306e2aedc6a4cfd63753ae00000000');

      // add the user signature
      const fullySigned = yield wallet.signTransaction({
        txPrebuild: halfSignedPrebuild,
        prv: userKeychain.prv,
        isLastSignature: true
      });
      // end result should look the same as in the unit test above regardless of signing order
      fullySigned.txHex.should.equal('01000000000101ad26ff8d387cb1aff967fc76fd96c8036a5ad2f1e9aa5214bc07b019ec63b1830100000023220020c4138370d5d77d8d3ccf3dc7561d0232bc743b8d1c16074881b91556e296a9f8ffffffff0200e1f5050000000017a9144b422c82fef274b72106572af74097773b7dd56587180fe0110000000017a914139de7a47eb613076c790aaaee21d8bbe28942ab870400483045022100a8ae2918d0589bfad341f2d46499c118542537ce22f5cc199d96fc949bdd445302206f56289185e6f5d81a5531632c4985847af1df20f4a078f2290e331411f35f6c01483045022100b4b6c9e7b300f5362d82a69730983eea9de575106747fd424e179499fb78a74602206546801fb3f0f1fcc090003906020575d7b27c851e7fbea3b917480793180bb00169522102b4f2c26870cdd4fd6d93ac0fd89f536beaed2a4c59daeea318f7355d1b3420932102363a336031faf1506ee79c7939a44e3259b35fa25bd5ea7bcf0ce5359d8792c32103d18ae6a34e70400b303ea95cccca3e33a648f63624a52b306e2aedc6a4cfd63753ae00000000');
    }));

    it('should verify full signatures correctly', () => {
      const txHex = '01000000000101ad26ff8d387cb1aff967fc76fd96c8036a5ad2f1e9aa5214bc07b019ec63b1830100000023220020c4138370d5d77d8d3ccf3dc7561d0232bc743b8d1c16074881b91556e296a9f8ffffffff0200e1f5050000000017a9144b422c82fef274b72106572af74097773b7dd56587180fe0110000000017a914139de7a47eb613076c790aaaee21d8bbe28942ab870400483045022100a8ae2918d0589bfad341f2d46499c118542537ce22f5cc199d96fc949bdd445302206f56289185e6f5d81a5531632c4985847af1df20f4a078f2290e331411f35f6c01483045022100b4b6c9e7b300f5362d82a69730983eea9de575106747fd424e179499fb78a74602206546801fb3f0f1fcc090003906020575d7b27c851e7fbea3b917480793180bb00169522102b4f2c26870cdd4fd6d93ac0fd89f536beaed2a4c59daeea318f7355d1b3420932102363a336031faf1506ee79c7939a44e3259b35fa25bd5ea7bcf0ce5359d8792c32103d18ae6a34e70400b303ea95cccca3e33a648f63624a52b306e2aedc6a4cfd63753ae00000000';
      const tx = bitcoin.Transaction.fromHex(txHex);
      const areSignaturesValid = basecoin.verifySignature(tx, 0, prebuild.txInfo.unspents[0].value);
      areSignaturesValid.should.equal(true);

      const isFirstSignatureValid = basecoin.verifySignature(tx, 0, prebuild.txInfo.unspents[0].value, { signatureIndex: 0 });
      const isSecondSignatureValid = basecoin.verifySignature(tx, 0, prebuild.txInfo.unspents[0].value, { signatureIndex: 1 });
      isFirstSignatureValid.should.equal(true);
      isSecondSignatureValid.should.equal(true);

      const userNode = prova.HDNode.fromBase58(userKeychain.pub);
      const backupNode = prova.HDNode.fromBase58(backupKeychain.pub);
      const bitgoNode = prova.HDNode.fromBase58(bitgoKeychain.pub);
      const derivationPath = `m/0/0/${prebuild.txInfo.unspents[0].chain}/${prebuild.txInfo.unspents[0].index}`;
      const userHex = userNode.hdPath().deriveKey(derivationPath).getPublicKeyBuffer().toString('hex');
      const backupHex = backupNode.hdPath().deriveKey(derivationPath).getPublicKeyBuffer().toString('hex');
      const bitgoHex = bitgoNode.hdPath().deriveKey(derivationPath).getPublicKeyBuffer().toString('hex');

      const isUserSignatureValid = basecoin.verifySignature(tx, 0, prebuild.txInfo.unspents[0].value, { publicKey: userHex });
      const isBackupSignatureValid = basecoin.verifySignature(tx, 0, prebuild.txInfo.unspents[0].value, { publicKey: backupHex });
      const isBitgoSignatureValid = basecoin.verifySignature(tx, 0, prebuild.txInfo.unspents[0].value, { publicKey: bitgoHex });
      isUserSignatureValid.should.equal(true);
      isBackupSignatureValid.should.equal(true);
      isBitgoSignatureValid.should.equal(false);
    });

    it('should verify half signatures correctly', () => {
      // signed with the backup key
      const txHex = '01000000000101ad26ff8d387cb1aff967fc76fd96c8036a5ad2f1e9aa5214bc07b019ec63b1830100000023220020c4138370d5d77d8d3ccf3dc7561d0232bc743b8d1c16074881b91556e296a9f8ffffffff0200e1f5050000000017a9144b422c82fef274b72106572af74097773b7dd56587180fe0110000000017a914139de7a47eb613076c790aaaee21d8bbe28942ab87050000483045022100b4b6c9e7b300f5362d82a69730983eea9de575106747fd424e179499fb78a74602206546801fb3f0f1fcc090003906020575d7b27c851e7fbea3b917480793180bb0010069522102b4f2c26870cdd4fd6d93ac0fd89f536beaed2a4c59daeea318f7355d1b3420932102363a336031faf1506ee79c7939a44e3259b35fa25bd5ea7bcf0ce5359d8792c32103d18ae6a34e70400b303ea95cccca3e33a648f63624a52b306e2aedc6a4cfd63753ae00000000';
      const tx = bitcoin.Transaction.fromHex(txHex);
      const areSignaturesValid = basecoin.verifySignature(tx, 0, prebuild.txInfo.unspents[0].value);
      areSignaturesValid.should.equal(true);

      const isFirstSignatureValid = basecoin.verifySignature(tx, 0, prebuild.txInfo.unspents[0].value, { signatureIndex: 0 });
      const isSecondSignatureValid = basecoin.verifySignature(tx, 0, prebuild.txInfo.unspents[0].value, { signatureIndex: 1 });
      isFirstSignatureValid.should.equal(true);
      isSecondSignatureValid.should.equal(false);

      const userNode = prova.HDNode.fromBase58(userKeychain.pub);
      const backupNode = prova.HDNode.fromBase58(backupKeychain.pub);
      const derivationPath = `m/0/0/${prebuild.txInfo.unspents[0].chain}/${prebuild.txInfo.unspents[0].index}`;
      const userHex = userNode.hdPath().deriveKey(derivationPath).getPublicKeyBuffer().toString('hex');
      const backupHex = backupNode.hdPath().deriveKey(derivationPath).getPublicKeyBuffer().toString('hex');

      const isUserSignatureValid = basecoin.verifySignature(tx, 0, prebuild.txInfo.unspents[0].value, { publicKey: userHex });
      const isBackupSignatureValid = basecoin.verifySignature(tx, 0, prebuild.txInfo.unspents[0].value, { publicKey: backupHex });
      isUserSignatureValid.should.equal(false);
      isBackupSignatureValid.should.equal(true);
    });

  });

});
