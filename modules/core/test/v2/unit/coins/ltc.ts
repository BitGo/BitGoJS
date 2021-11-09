import 'should';
import * as _ from 'lodash';
import * as bip32 from 'bip32';

import * as utxolib from '@bitgo/utxo-lib';

import { TestBitGo } from '../../../lib/test_bitgo';
import { Wallet } from '../../../../src';


describe('LTC:', function () {
  let bitgo;

  before(function () {
    bitgo = new TestBitGo({ env: 'test' });
    bitgo.initializeTestVars();
  });

  describe('Should correctly sign segwit transactions', () => {

    const userKeychain = {
      prv: 'xprv9s21ZrQH143K2eBAnP4BbBvdEAEN76jTtvgK5qfmwqNZVR9yr2J4BwkuYRignCKge76RuTBRwB5kzLUKyNzsPxFGmjUWc1bk3jQyJjPNfiQ',
      pub: 'xpub661MyMwAqRbcF8FdtQbBxKsMnC4rWZTKG9butE5PWAuYNDV8PZcJjk5PPiefRF3o1Wc89nTBjXucS7gobapEensmLQPLEMfw6CHoEKJ3cez',
      rawPub: '03a46e1545d607843bdced8766d5acc9ef7015842911488c56608f2589f384928c',
      rawPrv: 'aa2f1f4a63f0cb1ef71d497b1630965efb9ca863684b362dcb0dfb818d1810b7',
    };
    const backupKeychain = {
      prv: 'xprv9s21ZrQH143K2WWmrYupmGTCQdtcdZYyhvkCxkEvXX11aDYMrnrW4UCxPHHcXr2a3vqnUpg7PzcmE9qeTaRmMocVmHhqchsCmGca14dJL9x',
      pub: 'xpub661MyMwAqRbcEzbExaSq8QPvxfj732Gq59fom8eY5rXzT1sWQLAkcGXSEadoMZ94XQeUawnV1NtiRce59qZMJmwZ69LbbdGfr9D178ZQn8A',
      rawPub: '03d94ed545e6f9f0d5e0fc7aa88e4dbccc4b61daa680ab44b38a8a1a9477808b31',
      rawPrv: 'a8170fc6e98084c6514f98f7aca0bd5ca025e82470c75270502a0dc634770b07',
    };

    const bitgoKeychain = {
      pub: 'xpub661MyMwAqRbcH4GuguMES7cpmzp2ZaAd74L8FabMdcfxEfjdNktHNQtaBvWyju5WxRPEnuoKAaPskkK9UrX5eJ8GnnrCmrd2TWyiKKP1bhp',
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
            value: 400000000,
          },
        ],
        changeAddresses: [
          'QNPi7N8wS2JbxeygxZJwUUKefNExFekA15',
        ],
      },
      feeInfo: {
        size: 373,
        fee: 100000,
        feeRate: 100000,
        payGoFee: 0,
        payGoFeeString: '0',
      },
      walletId: '5a822e7d3df39bcf07121980decdc82c',
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
              'spend',
            ],
          },
        ],
        coin: 'tltc',
        label: 'Litecoin Segwit Test Wallet',
        m: 2,
        n: 3,
        keys: [
          '5a822e7db38993f2063dcddc8bcd1936',
          '5a822e7d033389d007fb7369a2ac298f',
          '5a822e7d524eb4d206a845914ac79f24',
        ],
        tags: [
          '5a822e7d3df39bcf07121980decdc82c',
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
            rules: [],
          },
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
            redeemScript: '522102aaf588c5c91a2e019661e8090bf69c4a4a87ea55ecb54c1da51c2c3fdf39f72e21020d1b3bb7cc897fec305bbcfedb17b0bf57fe89dda627dfcfcf7b1d29886d2ca82102d2ebf18aa2a0a4813f9dc8f3c34af4aa21d0c583fdce0ab468a607fd3347f4d053ae',
          },
        },
        pendingApprovals: [],
      });
    });

    it('should sign with user key and then with backup key', async function () {
      prebuild.txHex.should.equal('0100000001ad26ff8d387cb1aff967fc76fd96c8036a5ad2f1e9aa5214bc07b019ec63b1830100000000ffffffff0200e1f5050000000017a9144b422c82fef274b72106572af74097773b7dd56587180fe0110000000017a914139de7a47eb613076c790aaaee21d8bbe28942ab8700000000');

      // half-sign the transaction
      const halfSigned = await wallet.signTransaction({
        txPrebuild: prebuild,
        prv: userKeychain.prv,
      });
      const halfSignedPrebuild = _.extend({}, prebuild, halfSigned);
      halfSignedPrebuild.txHex.should.equal('01000000000101ad26ff8d387cb1aff967fc76fd96c8036a5ad2f1e9aa5214bc07b019ec63b1830100000023220020c4138370d5d77d8d3ccf3dc7561d0232bc743b8d1c16074881b91556e296a9f8ffffffff0200e1f5050000000017a9144b422c82fef274b72106572af74097773b7dd56587180fe0110000000017a914139de7a47eb613076c790aaaee21d8bbe28942ab870500483045022100a8ae2918d0589bfad341f2d46499c118542537ce22f5cc199d96fc949bdd445302206f56289185e6f5d81a5531632c4985847af1df20f4a078f2290e331411f35f6c01000069522102b4f2c26870cdd4fd6d93ac0fd89f536beaed2a4c59daeea318f7355d1b3420932102363a336031faf1506ee79c7939a44e3259b35fa25bd5ea7bcf0ce5359d8792c32103d18ae6a34e70400b303ea95cccca3e33a648f63624a52b306e2aedc6a4cfd63753ae00000000');

      // add the backup signature
      const fullySigned = await wallet.signTransaction({
        txPrebuild: halfSignedPrebuild,
        prv: backupKeychain.prv,
        isLastSignature: true,
      });
      fullySigned.txHex.should.equal('01000000000101ad26ff8d387cb1aff967fc76fd96c8036a5ad2f1e9aa5214bc07b019ec63b1830100000023220020c4138370d5d77d8d3ccf3dc7561d0232bc743b8d1c16074881b91556e296a9f8ffffffff0200e1f5050000000017a9144b422c82fef274b72106572af74097773b7dd56587180fe0110000000017a914139de7a47eb613076c790aaaee21d8bbe28942ab870400483045022100a8ae2918d0589bfad341f2d46499c118542537ce22f5cc199d96fc949bdd445302206f56289185e6f5d81a5531632c4985847af1df20f4a078f2290e331411f35f6c01483045022100b4b6c9e7b300f5362d82a69730983eea9de575106747fd424e179499fb78a74602206546801fb3f0f1fcc090003906020575d7b27c851e7fbea3b917480793180bb00169522102b4f2c26870cdd4fd6d93ac0fd89f536beaed2a4c59daeea318f7355d1b3420932102363a336031faf1506ee79c7939a44e3259b35fa25bd5ea7bcf0ce5359d8792c32103d18ae6a34e70400b303ea95cccca3e33a648f63624a52b306e2aedc6a4cfd63753ae00000000');
    });

    it('should sign with backup key and then with user key', async function () {
      prebuild.txHex.should.equal('0100000001ad26ff8d387cb1aff967fc76fd96c8036a5ad2f1e9aa5214bc07b019ec63b1830100000000ffffffff0200e1f5050000000017a9144b422c82fef274b72106572af74097773b7dd56587180fe0110000000017a914139de7a47eb613076c790aaaee21d8bbe28942ab8700000000');

      // half-sign the transaction
      const halfSigned = await wallet.signTransaction({
        txPrebuild: prebuild,
        prv: backupKeychain.prv,
      });
      const halfSignedPrebuild = _.extend({}, prebuild, halfSigned);
      halfSignedPrebuild.txHex.should.equal('01000000000101ad26ff8d387cb1aff967fc76fd96c8036a5ad2f1e9aa5214bc07b019ec63b1830100000023220020c4138370d5d77d8d3ccf3dc7561d0232bc743b8d1c16074881b91556e296a9f8ffffffff0200e1f5050000000017a9144b422c82fef274b72106572af74097773b7dd56587180fe0110000000017a914139de7a47eb613076c790aaaee21d8bbe28942ab87050000483045022100b4b6c9e7b300f5362d82a69730983eea9de575106747fd424e179499fb78a74602206546801fb3f0f1fcc090003906020575d7b27c851e7fbea3b917480793180bb0010069522102b4f2c26870cdd4fd6d93ac0fd89f536beaed2a4c59daeea318f7355d1b3420932102363a336031faf1506ee79c7939a44e3259b35fa25bd5ea7bcf0ce5359d8792c32103d18ae6a34e70400b303ea95cccca3e33a648f63624a52b306e2aedc6a4cfd63753ae00000000');

      // add the user signature
      const fullySigned = await wallet.signTransaction({
        txPrebuild: halfSignedPrebuild,
        prv: userKeychain.prv,
        isLastSignature: true,
      });
      // end result should look the same as in the unit test above regardless of signing order
      fullySigned.txHex.should.equal('01000000000101ad26ff8d387cb1aff967fc76fd96c8036a5ad2f1e9aa5214bc07b019ec63b1830100000023220020c4138370d5d77d8d3ccf3dc7561d0232bc743b8d1c16074881b91556e296a9f8ffffffff0200e1f5050000000017a9144b422c82fef274b72106572af74097773b7dd56587180fe0110000000017a914139de7a47eb613076c790aaaee21d8bbe28942ab870400483045022100a8ae2918d0589bfad341f2d46499c118542537ce22f5cc199d96fc949bdd445302206f56289185e6f5d81a5531632c4985847af1df20f4a078f2290e331411f35f6c01483045022100b4b6c9e7b300f5362d82a69730983eea9de575106747fd424e179499fb78a74602206546801fb3f0f1fcc090003906020575d7b27c851e7fbea3b917480793180bb00169522102b4f2c26870cdd4fd6d93ac0fd89f536beaed2a4c59daeea318f7355d1b3420932102363a336031faf1506ee79c7939a44e3259b35fa25bd5ea7bcf0ce5359d8792c32103d18ae6a34e70400b303ea95cccca3e33a648f63624a52b306e2aedc6a4cfd63753ae00000000');
    });

    it('should verify full signatures correctly', () => {
      const txHex = '01000000000101ad26ff8d387cb1aff967fc76fd96c8036a5ad2f1e9aa5214bc07b019ec63b1830100000023220020c4138370d5d77d8d3ccf3dc7561d0232bc743b8d1c16074881b91556e296a9f8ffffffff0200e1f5050000000017a9144b422c82fef274b72106572af74097773b7dd56587180fe0110000000017a914139de7a47eb613076c790aaaee21d8bbe28942ab870400483045022100a8ae2918d0589bfad341f2d46499c118542537ce22f5cc199d96fc949bdd445302206f56289185e6f5d81a5531632c4985847af1df20f4a078f2290e331411f35f6c01483045022100b4b6c9e7b300f5362d82a69730983eea9de575106747fd424e179499fb78a74602206546801fb3f0f1fcc090003906020575d7b27c851e7fbea3b917480793180bb00169522102b4f2c26870cdd4fd6d93ac0fd89f536beaed2a4c59daeea318f7355d1b3420932102363a336031faf1506ee79c7939a44e3259b35fa25bd5ea7bcf0ce5359d8792c32103d18ae6a34e70400b303ea95cccca3e33a648f63624a52b306e2aedc6a4cfd63753ae00000000';
      const tx = utxolib.bitgo.createTransactionFromHex(txHex, basecoin.network);
      const areSignaturesValid = basecoin.verifySignature(tx, 0, prebuild.txInfo.unspents[0].value);
      areSignaturesValid.should.equal(true);

      const isFirstSignatureValid = basecoin.verifySignature(tx, 0, prebuild.txInfo.unspents[0].value, { signatureIndex: 0 });
      const isSecondSignatureValid = basecoin.verifySignature(tx, 0, prebuild.txInfo.unspents[0].value, { signatureIndex: 1 });
      isFirstSignatureValid.should.equal(true);
      isSecondSignatureValid.should.equal(true);

      const userNode = bip32.fromBase58(userKeychain.pub);
      const backupNode = bip32.fromBase58(backupKeychain.pub);
      const bitgoNode = bip32.fromBase58(bitgoKeychain.pub);
      const derivationPath = `m/0/0/${prebuild.txInfo.unspents[0].chain}/${prebuild.txInfo.unspents[0].index}`;
      const userHex = userNode.derivePath(derivationPath).publicKey.toString('hex');
      const backupHex = backupNode.derivePath(derivationPath).publicKey.toString('hex');
      const bitgoHex = bitgoNode.derivePath(derivationPath).publicKey.toString('hex');

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
      const tx = utxolib.bitgo.createTransactionFromHex(txHex, basecoin.network);
      const areSignaturesValid = basecoin.verifySignature(tx, 0, prebuild.txInfo.unspents[0].value);
      areSignaturesValid.should.equal(true);

      const isFirstSignatureValid = basecoin.verifySignature(tx, 0, prebuild.txInfo.unspents[0].value, { signatureIndex: 0 });
      const isSecondSignatureValid = basecoin.verifySignature(tx, 0, prebuild.txInfo.unspents[0].value, { signatureIndex: 1 });
      isFirstSignatureValid.should.equal(true);
      isSecondSignatureValid.should.equal(false);

      const userNode = bip32.fromBase58(userKeychain.pub);
      const backupNode = bip32.fromBase58(backupKeychain.pub);
      const derivationPath = `m/0/0/${prebuild.txInfo.unspents[0].chain}/${prebuild.txInfo.unspents[0].index}`;
      const userHex = userNode.derivePath(derivationPath).publicKey.toString('hex');
      const backupHex = backupNode.derivePath(derivationPath).publicKey.toString('hex');

      const isUserSignatureValid = basecoin.verifySignature(tx, 0, prebuild.txInfo.unspents[0].value, { publicKey: userHex });
      const isBackupSignatureValid = basecoin.verifySignature(tx, 0, prebuild.txInfo.unspents[0].value, { publicKey: backupHex });
      isUserSignatureValid.should.equal(false);
      isBackupSignatureValid.should.equal(true);
    });

  });

});
