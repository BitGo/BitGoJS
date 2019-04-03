//
// Test for Recoveries
//

import * as should from 'should';
import * as Promise from 'bluebird';
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
      recovery.recoveryAmount.should.equal(20972720);
      recovery.recoveryCoin.should.equal('tltc');
      recovery.sourceCoin.should.equal('tbtc');
      recovery.txHex.should.equal('0100000001c61bf50d39c32e4dc74ac01cf1873b50ca25535a2799fa1fe98f06444597f54100000000b60047304402207215a1337d7d873ce6eed9bc7984fe69ca7c995a21745dc0a70e2c8afa6740a702204c3a164f817019f90c710fc25f351b3b0847ed155d031c5aeaa3c54b7a73cde10100004c69522103b31347f19510acbc7f50822ac4093ca80554946c471b43eb937d0c9118d1122d2102cd3787d12af6eb87e7b9af00118a225e2ce663a5c94f555460ae131139a2afee2103bd558669de622fc57a8157f449c52254218dbc40dedf047891192bdd013cad8953aeffffffff01b00440010000000017a914ef856a40c6dc109591b7d4fad170986d0bb404af8700000000');
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
      recovery.recoveryAmount.should.equal(39965900);
      recovery.recoveryCoin.should.equal('tbtc');
      recovery.sourceCoin.should.equal('tltc');
      recovery.txHex.should.equal('010000000139db811c27a5ed5e34a2e435c53c90b2492fe0bcbf71b3c41ee994783ee422fe01000000b700483045022100d55ff6eb899c81d2787a0d85084dcba192b65f88c7725dd8d1b3e5cb58efd88b022046dd4bd19ff0b06ed4f4adcc85ff5df09eda9156af7a3f2718cba2e09343ea760100004c695221032afb7613787f1ab168ae5aea260891a93740a7bd41e66381d73aa07c02e053d321022d342407c7cbe25718d1983db4df95b0000762d9203a35877412d589beebae422103b366f06f3b9f25440d281c78e61aab3375ee8ea4ae72750ac7522c1bdc4e95b153aeffffffff01ccd461020000000017a9149e71e9125ef730c576b027d2c10cbdbe1ee1a5528700000000');
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
      recovery.recoveryAmount.should.equal(59993180);
      recovery.recoveryCoin.should.equal('tbtc');
      recovery.sourceCoin.should.equal('tbch');
      recovery.txHex.should.equal('020000000126eaa1da6e2d641f6a39812a0a78a4ef0a44087845435121ea94d14b673c149400000000b60047304402203ba7a2f0d046ef69daadc6e86d0685e5fea8db5e86b69921febda81b7dde4a0c022016209ec9b6d0e4c6ffeff0bfed7bddec9c2de63122a94f83f0741e1cdf15853f4100004c695221032afb7613787f1ab168ae5aea260891a93740a7bd41e66381d73aa07c02e053d321022d342407c7cbe25718d1983db4df95b0000762d9203a35877412d589beebae422103b366f06f3b9f25440d281c78e61aab3375ee8ea4ae72750ac7522c1bdc4e95b153aeffffffff015c6c93030000000017a914ffc45981f784d9bd9feb2d305061404f50bc1e058700000000');
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
      recovery.recoveryAmount.should.equal(9965900);
      recovery.recoveryCoin.should.equal('tbch');
      recovery.sourceCoin.should.equal('tltc');
      recovery.txHex.should.equal('0100000001158c91946a51401658abfe82a756f9900c58a4e3f210fb13c190f338629cab4b01000000b60047304402205ed1bf2259af034ad6be1c3f95717c00e9837fcfb640f46b9f0729e3d16b78e702205dcf7436b69148c097f89c145991f8ed38dadb6a46d261112f1e9470016afd230100004c6952210388d574f35d3454b9ed0af9862bc83f9abb2c2c5bec298248f8da9b50fb0fe1d72103fbe5cf926752281de99adc5a42257ad9081178ab46b42a85b7ae76f15f75cf17210346f91ff493951e85008ae28665a1c272ef9e84bfeddca2014bc1cc821c39a87e53aeffffffff014c1198000000000017a9149e71e9125ef730c576b027d2c10cbdbe1ee1a5528700000000');
      recovery.walletId.should.equal('5abacf7e3cddfbb607d83d276777f55a');
      recovery.should.have.property('txInfo');
      recovery.txInfo.should.have.property('unspents');
      recovery.txInfo.should.have.property('inputs');
    }));
  });
});
