//
// Tests for Wallets
//

require('should');
const Promise = require('bluebird');
const co = Promise.coroutine;
const bitcoin = require('bitgo-bitcoinjs-lib');
const Wallet = require('../../../src/v2/wallet');

const TestV2BitGo = require('../../lib/test_bitgo');

describe('V2 Wallet:', function() {
  let bitgo;

  before(co(function *() {
    // TODO: replace dev with test
    bitgo = new TestV2BitGo({ env: 'test' });
    bitgo.initializeTestVars();
  }));

  describe('Transaction Signature Verification', function() {
    let basecoin;
    let wallet;
    const userKeychain = {
      prv: 'xprv9s21ZrQH143K3hekyNj7TciR4XNYe1kMj68W2ipjJGNHETWP7o42AjDnSPgKhdZ4x8NBAvaL72RrXjuXNdmkMqLERZza73oYugGtbLFXG8g',
      pub: 'xpub661MyMwAqRbcGBjE5QG7pkf9cZD33UUD6K46q7ELrbuG7FqXfLNGiXYGHeEnGBb5AWREnk1eA28g8ArZvURbhshXWkTtddHRo54fgyVvLdb',
      rawPub: '023636e68b7b204573abda2616aff6b584910dece2543f1cc6d842caac7d74974b',
      rawPrv: '7438a50010ce7b1dfd86e68046cc78ba1ebd242d6d85d9904d3fcc08734bc172'
    };
    const backupKeychain = {
      prv: 'xprv9s21ZrQH143K4NtHwJ6oHbJpUiLygwx1xpyD24wwYcVcPZ7LqEGHY58EfT3vgnQWAvkw6AQ4Gnw1fVN4fiem5gjMf4rKHC1HzYRsXERfjVa',
      pub: 'xpub661MyMwAqRbcGrxm3KdoejFZ2kBU6QfsL3topTMZ6x2bGMSVNmaY5sSiWkNNK7QqShEWc5oeLVi74V8oMxr2uhCw1oRWMTCidLuPYVHHLzf',
      rawPub: '03fae58eed086af828279a626ce2ad7ef6424b76fa0fb7e1c8da5a7de222b79203',
      rawPrv: 'cda3fb304f1e7ac4e599361577767b52c6c04fdea8ca44c0e360e6a0de7027bd'
    };
    const prebuild = {
      txHex: '01000000010fef30ca07288fb78659253227b8514ae9397faf76e53530118712d240bfb1060000000000ffffffff02255df4240000000017a9149799c321e46a9c7bb11835495a96d6ae31af36c58780c3c9010000000017a9144394c8c16c50397285830b449ceca588f5f359e98700000000',
      txInfo: {
        nP2SHInputs: 1,
        nSegwitInputs: 0,
        nOutputs: 2,
        unspents: [
          {
            chain: 0,
            index: 0,
            redeemScript: '5221032c227d73891b33c45f5f02ab7eebdc4f4ed9ffb5565aedbfb478abb1bfd9d467210266824ac31b6a9d6568c3f7ced9aee1c720cd85994dd41d43dc63b0977195729e21037c07484a5d2d3831d38df1b7b45a2459df6fb40b204bbbf24e0f11763c79a50953ae',
            id: '06b1bf40d21287113035e576af7f39e94a51b82732255986b78f2807ca30ef0f:0',
            address: '2MzKPdDF127CNb5h3g3wNXGD7QMSrobKsvV',
            value: 650000000
          }
        ],
        changeAddresses: [
          '2N74pDqYayJq7PhtrvUvrt1t6ZX9C8ogUdk'
        ]
      },
      feeInfo: {
        size: 373,
        fee: 5595,
        feeRate: 15000,
        payGoFee: 0,
        payGoFeeString: '0'
      },
      walletId: '5a78dd561c6258a907f1eeaee132f796'
    };
    const signedTxHex = '02000000010fef30ca07288fb78659253227b8514ae9397faf76e53530118712d240bfb10600000000fdfd00004730440220140811e76ad440c863164a1f9c0956b7a7db17a29f3fe543576dd6279f975243022006ec7def583d18e8ac2de5bb7bf9c647b67d510c07fc7bdc2487ab06f08e3a684147304402205aa8e8646bc5fad6fda5565f8af5e304a5b5b7aa96690dc1562191365ba38a3202205ce0c8a7cbb3448ea4f6f69a8f4a1accae65021a0acc2d90292226c4615bb75b41004c695221032c227d73891b33c45f5f02ab7eebdc4f4ed9ffb5565aedbfb478abb1bfd9d467210266824ac31b6a9d6568c3f7ced9aee1c720cd85994dd41d43dc63b0977195729e21037c07484a5d2d3831d38df1b7b45a2459df6fb40b204bbbf24e0f11763c79a50953aeffffffff02255df4240000000017a9149799c321e46a9c7bb11835495a96d6ae31af36c58780c3c9010000000017a9144394c8c16c50397285830b449ceca588f5f359e98700000000';

    before(co(function *() {
      basecoin = bitgo.coin('tbch');
      const walletData = {
        id: '5a78dd561c6258a907f1eeaee132f796',
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
        coin: 'tbch',
        label: 'Signature Verification Wallet',
        m: 2,
        n: 3,
        keys: [
          '5a78dd56bfe424aa07aa068651b194fd',
          '5a78dd5674a70eb4079f58797dfe2f5e',
          '5a78dd561c6258a907f1eea9f1d079e2'
        ],
        tags: [
          '5a78dd561c6258a907f1eeaee132f796'
        ],
        disableTransactionNotifications: false,
        freeze: {},
        deleted: false,
        approvalsRequired: 1,
        isCold: true,
        coinSpecific: {},
        admin: {
          policy: {
            id: '5a78dd561c6258a907f1eeaf50991950',
            version: 0,
            date: '2018-02-05T22:40:22.761Z',
            mutableUpToDate: '2018-02-07T22:40:22.761Z',
            rules: []
          }
        },
        clientFlags: [],
        balance: 650000000,
        confirmedBalance: 650000000,
        spendableBalance: 650000000,
        balanceString: '650000000',
        confirmedBalanceString: '650000000',
        spendableBalanceString: '650000000',
        receiveAddress: {
          id: '5a78de2bbfe424aa07aa131ec03c8dc1',
          address: '2MyQZVquvjL3ZPBgD8cGdHRkHgfzNQFkVyF',
          chain: 0,
          index: 3,
          coin: 'tbch',
          wallet: '5a78dd561c6258a907f1eeaee132f796',
          coinSpecific: {
            redeemScript: '52210276cfa62b997cb3a9c53579a31bf004af4aab070343800285ee737da175c9af1121028cd41b3df3ad36256da33f470bd75d9b70f05d4f10351a2c9fc5d37d94c9909921038b919223eba3ab96f189465b1cb1904b9eaafa2cbe428d14a918fca659aa136a53ae'
          }
        },
        pendingApprovals: []
      };
      wallet = new Wallet(bitgo, basecoin, walletData);
    }));

    it('should sign a prebuild', co(function *() {
      // sign transaction
      const halfSignedTransaction = yield wallet.signTransaction({
        txPrebuild: prebuild,
        prv: userKeychain.prv
      });
      halfSignedTransaction.txHex.should.equal('02000000010fef30ca07288fb78659253227b8514ae9397faf76e53530118712d240bfb10600000000b6004730440220140811e76ad440c863164a1f9c0956b7a7db17a29f3fe543576dd6279f975243022006ec7def583d18e8ac2de5bb7bf9c647b67d510c07fc7bdc2487ab06f08e3a684100004c695221032c227d73891b33c45f5f02ab7eebdc4f4ed9ffb5565aedbfb478abb1bfd9d467210266824ac31b6a9d6568c3f7ced9aee1c720cd85994dd41d43dc63b0977195729e21037c07484a5d2d3831d38df1b7b45a2459df6fb40b204bbbf24e0f11763c79a50953aeffffffff02255df4240000000017a9149799c321e46a9c7bb11835495a96d6ae31af36c58780c3c9010000000017a9144394c8c16c50397285830b449ceca588f5f359e98700000000');

      prebuild.txHex = halfSignedTransaction.txHex;
      const signedTransaction = yield wallet.signTransaction({
        txPrebuild: prebuild,
        prv: backupKeychain.prv
      });
      signedTransaction.txHex.should.equal(signedTxHex);
    }));

    it('should verify a signed transaction', co(function *() {
      const unspent = prebuild.txInfo.unspents[0];
      const signedTransaction = bitcoin.Transaction.fromHex(signedTxHex);
      const areSignaturesValid = basecoin.verifySignature(signedTransaction, 0, unspent.value);
      areSignaturesValid.should.equal(true);

      // mangle first signature
      const sigScript = bitcoin.script.decompile(signedTransaction.ins[0].script);
      sigScript.length.should.equal(5);
      const firstSignature = sigScript[1];
      const secondSignature = sigScript[2];
      firstSignature.length.should.equal(71);
      secondSignature.length.should.equal(71);

      // mangle random byte of first signature (modifying too much could make the sig script become misclassified)
      firstSignature[10] = 54;
      sigScript[1] = firstSignature;
      signedTransaction.ins[0].script = bitcoin.script.compile(sigScript);

      const areMangledSignaturesValid = basecoin.verifySignature(signedTransaction, 0, unspent.value);
      areMangledSignaturesValid.should.equal(false);

      const isFirstSignatureValid = basecoin.verifySignature(signedTransaction, 0, unspent.value, { signatureIndex: 0 });
      isFirstSignatureValid.should.equal(false);

      // the second signature remains unmodifed and should still be valid
      const isSecondSignatureValid = basecoin.verifySignature(signedTransaction, 0, unspent.value, { signatureIndex: 1 });
      isSecondSignatureValid.should.equal(true);
    }));
  });

});
