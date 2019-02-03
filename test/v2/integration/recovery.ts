//
// Test for Recoveries
//

const should = require('should');
const Promise = require('bluebird');
const co = Promise.coroutine;

const TestV2BitGo = require('../../lib/test_bitgo');

describe('V2 Recoveries', function() {
  describe('Wrong Chain Recoveries', function() {
    let bitgo;

    before(co(function *() {
      bitgo = new TestV2BitGo({ env: 'test' });
      bitgo.initializeTestVars();
      yield bitgo.authenticateTestUser(bitgo.testUserOTP());
    }));

    it('should recover BTC sent to the wrong chain', co(function *() {
      const recovery = yield bitgo.coin('tbtc').recoverFromWrongChain({
        coin: bitgo.coin('tltc'),
        txid: '41f5974544068fe91ffa99275a5325ca503b87f11cc04ac74d2ec3390df51bc6',
        recoveryAddress: '2NF5hJyJxQyRsMjsK6STFagLaoAJNF9M4Zm',
        wallet: '5abacebe28d72fbd07e0b8cbba0ff39e',
        walletPassphrase: TestV2BitGo.V2.TEST_RECOVERY_PASSCODE
      });

      should.exist(recovery);
      recovery.recoveryAddress.should.equal('2NF5hJyJxQyRsMjsK6STFagLaoAJNF9M4Zm');
      recovery.recoveryAmount.should.equal(20972800);
      recovery.recoveryCoin.should.equal('tltc');
      recovery.sourceCoin.should.equal('tbtc');
      recovery.txHex.should.equal('0100000001c61bf50d39c32e4dc74ac01cf1873b50ca25535a2799fa1fe98f06444597f54100000000b600473044022072218955d9c218200b0ae502a94128118c5d30d20d5d5ec0b5fad8bc44543e8c02201352b553ca6163f1e99087bebe54425b15371d8f281da769bf5a0c7a2531aaf10100004c69522103b31347f19510acbc7f50822ac4093ca80554946c471b43eb937d0c9118d1122d2102cd3787d12af6eb87e7b9af00118a225e2ce663a5c94f555460ae131139a2afee2103bd558669de622fc57a8157f449c52254218dbc40dedf047891192bdd013cad8953aeffffffff01000540010000000017a914ef856a40c6dc109591b7d4fad170986d0bb404af8700000000');
      recovery.walletId.should.equal('5abacebe28d72fbd07e0b8cbba0ff39e');
      recovery.should.have.property('txInfo');
      recovery.txInfo.should.have.property('unspents');
      recovery.txInfo.should.have.property('inputs');
    }));

    it('should recover LTC sent to the wrong chain', co(function *() {
      const recovery = yield bitgo.coin('tltc').recoverFromWrongChain({
        coin: bitgo.coin('tbtc'),
        txid: 'fe22e43e7894e91ec4b371bfbce02f49b2903cc535e4a2345eeda5271c81db39',
        recoveryAddress: 'Qb3mLF6zy2frAAJmBcuVneJHUsmtk2Jo6V',
        wallet: '5abace103cddfbb607d8239d806671bf',
        walletPassphrase: TestV2BitGo.V2.TEST_RECOVERY_PASSCODE
      });

      should.exist(recovery);
      recovery.recoveryAddress.should.equal('Qb3mLF6zy2frAAJmBcuVneJHUsmtk2Jo6V');
      recovery.recoveryAmount.should.equal(39966000);
      recovery.recoveryCoin.should.equal('tbtc');
      recovery.sourceCoin.should.equal('tltc');
      recovery.txHex.should.equal('010000000139db811c27a5ed5e34a2e435c53c90b2492fe0bcbf71b3c41ee994783ee422fe01000000b700483045022100a26301277e837c9558dc7d7bdeb20531b86aded988e32ef44fdcd1eca8ff1d0002200bfe14f01cb9267e91c4116e2466669175b516d7187f476672c8a66fdb665a580100004c695221032afb7613787f1ab168ae5aea260891a93740a7bd41e66381d73aa07c02e053d321022d342407c7cbe25718d1983db4df95b0000762d9203a35877412d589beebae422103b366f06f3b9f25440d281c78e61aab3375ee8ea4ae72750ac7522c1bdc4e95b153aeffffffff0130d561020000000017a9149e71e9125ef730c576b027d2c10cbdbe1ee1a5528700000000');
      recovery.walletId.should.equal('5abace103cddfbb607d8239d806671bf');
      recovery.should.have.property('txInfo');
      recovery.txInfo.should.have.property('unspents');
      recovery.txInfo.should.have.property('inputs');
    }));

    it('should recover BCH sent to the wrong chain', co(function *() {
      const recovery = yield bitgo.coin('tbch').recoverFromWrongChain({
        coin: bitgo.coin('tbtc'),
        txid: '94143c674bd194ea215143457808440aefa4780a2a81396a1f642d6edaa1ea26',
        recoveryAddress: '2NGZbWp6bZto9pFKV1Y5EEGWTNHwgNfpVD2',
        wallet: '5abace103cddfbb607d8239d806671bf',
        walletPassphrase: TestV2BitGo.V2.TEST_RECOVERY_PASSCODE
      });

      should.exist(recovery);
      recovery.recoveryAddress.should.equal('2NGZbWp6bZto9pFKV1Y5EEGWTNHwgNfpVD2');
      recovery.recoveryAmount.should.equal(59993200);
      recovery.recoveryCoin.should.equal('tbtc');
      recovery.sourceCoin.should.equal('tbch');
      recovery.txHex.should.equal('020000000126eaa1da6e2d641f6a39812a0a78a4ef0a44087845435121ea94d14b673c149400000000b7004830450221009784391e9fab5bd8e3c3902477521ed1e8e8c1f6d584c3ca918cf40053450cdc022016597cf28a6b38fbe0f1eef5608af049912cadc6390b49277602d842c89704a24100004c695221032afb7613787f1ab168ae5aea260891a93740a7bd41e66381d73aa07c02e053d321022d342407c7cbe25718d1983db4df95b0000762d9203a35877412d589beebae422103b366f06f3b9f25440d281c78e61aab3375ee8ea4ae72750ac7522c1bdc4e95b153aeffffffff01706c93030000000017a914ffc45981f784d9bd9feb2d305061404f50bc1e058700000000');
      recovery.walletId.should.equal('5abace103cddfbb607d8239d806671bf');
      recovery.should.have.property('txInfo');
      recovery.txInfo.should.have.property('unspents');
      recovery.txInfo.should.have.property('inputs');
    }));

    /*
    NOTE: The TBCH indexer is offline since the May 2018 hardfork (as of June 1, 2018). This test will not succeed
          until the indexer issues are resolved. The BCH to LTC recovery route has been tested on the main BCH chain.
    TODO: This test is not finished. Once the TBCH indexer is online, an invalid transaction will need to be
          attempted in order to determine values for the txid, recoveryAmount, and txHex values.
    */

    /*
    it('should recover BCH sent to LTC', co(function *() {
      const recovery = yield bitgo.coin('tbch').recoverFromWrongChain({
        coin: bitgo.coin('tltc'),
        txid: '',
        recoveryAddress: '2NGZbWp6bZto9pFKV1Y5EEGWTNHwgNfpVD2',
        wallet: '5abacebe28d72fbd07e0b8cbba0ff39e',
        walletPassphrase: TestV2BitGo.V2.TEST_RECOVERY_PASSCODE
      });

      should.exist(recovery);
      recovery.recoveryAddress.should.equal('2NGZbWp6bZto9pFKV1Y5EEGWTNHwgNfpVD2');
      recovery.recoveryAmount.should.equal();
      recovery.recoveryCoin.should.equal('tltc');
      recovery.sourceCoin.should.equal('tbch');
      recovery.txHex.should.equal();
      recovery.walletId.should.equal('5abacebe28d72fbd07e0b8cbba0ff39e');
      recovery.should.have.property('txInfo');
      recovery.txInfo.should.have.property('unspents');
      recovery.txInfo.should.have.property('inputs');
    }));
    */

    it('should recover LTC sent to BCH', co(function *() {
      const recovery = yield bitgo.coin('tltc').recoverFromWrongChain({
        coin: bitgo.coin('tbch'),
        txid: '4bab9c6238f390c113fb10f2e3a4580c90f956a782feab581640516a94918c15',
        recoveryAddress: 'Qb3mLF6zy2frAAJmBcuVneJHUsmtk2Jo6V',
        wallet: '5abacf7e3cddfbb607d83d276777f55a',
        walletPassphrase: TestV2BitGo.V2.TEST_RECOVERY_PASSCODE
      });

      should.exist(recovery);
      recovery.recoveryAddress.should.equal('Qb3mLF6zy2frAAJmBcuVneJHUsmtk2Jo6V');
      recovery.recoveryAmount.should.equal(9966000);
      recovery.recoveryCoin.should.equal('tbch');
      recovery.sourceCoin.should.equal('tltc');
      recovery.txHex.should.equal('0100000001158c91946a51401658abfe82a756f9900c58a4e3f210fb13c190f338629cab4b01000000b7004830450221008fd893d588cf4c05ba32fdde8f7d81713e1d1baaeff57f9cae0fbc4e8cec51e002206aad45bb8f8c48dd71234a675c1c73dcb5be5eb9287fa60535b178f9229b6c610100004c6952210388d574f35d3454b9ed0af9862bc83f9abb2c2c5bec298248f8da9b50fb0fe1d72103fbe5cf926752281de99adc5a42257ad9081178ab46b42a85b7ae76f15f75cf17210346f91ff493951e85008ae28665a1c272ef9e84bfeddca2014bc1cc821c39a87e53aeffffffff01b01198000000000017a9149e71e9125ef730c576b027d2c10cbdbe1ee1a5528700000000');
      recovery.walletId.should.equal('5abacf7e3cddfbb607d83d276777f55a');
      recovery.should.have.property('txInfo');
      recovery.txInfo.should.have.property('unspents');
      recovery.txInfo.should.have.property('inputs');
    }));
  });
});
