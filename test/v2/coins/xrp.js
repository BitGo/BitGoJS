var assert = require('assert');
var crypto = require('crypto');
var should = require('should');

var common = require('../../../src/common');
var prova = require('../../../src/prova');
const rippleKeypairs = require('ripple-keypairs');
var TestV2BitGo = require('../../lib/test_bitgo');

describe('XRP:', function() {
  var bitgo;
  var basecoin;

  before(function() {
    bitgo = new TestV2BitGo({ env: 'test' });
    bitgo.initializeTestVars();
    return bitgo.authenticateTestUser(bitgo.testUserOTP())
    .then(function() {
      basecoin = bitgo.coin('txrp');
    });
  });

  it('Should verify addresses', function() {
    assert(basecoin.isValidAddress('r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8?dt=1893500718') === true);
    assert(basecoin.isValidAddress('r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8') === true);
    assert(basecoin.isValidAddress('r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8?r=a') === false);
    assert(basecoin.isValidAddress('xrp://r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8') === false);
    assert(basecoin.isValidAddress('r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8?dt=4294967296') === false);
    assert(basecoin.isValidAddress('r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8?dt=4294967295') === true);
    assert(basecoin.isValidAddress('r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8?dt=0x123') === false);
    assert(basecoin.isValidAddress('r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8?dt=0x0') === false);
    assert(basecoin.isValidAddress('r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8?dt=0') === true);
    assert(basecoin.isValidAddress('r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8?dt=-1') === false);
    assert(basecoin.isValidAddress('r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8?dt=1.5') === false);
    assert(basecoin.isValidAddress('r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8?dt=a') === false);
    assert(basecoin.isValidAddress('r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8?dt=b') === false);
    assert(basecoin.isValidAddress('r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8?dt=a54b') === false);
    assert(basecoin.isValidAddress('xrp://r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8?dt=4294967295') === false);
    assert(basecoin.isValidAddress('http://r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8?dt=4294967295') === false);
    assert(basecoin.isValidAddress('http://r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8?a=b&dt=4294967295') === false);
  });

  it('Should generate wallet with custom root address', function() {
    var hdNode = prova.HDNode.fromSeedBuffer(crypto.randomBytes(32));
    var params = {
      passphrase: TestV2BitGo.V2.TEST_WALLET1_PASSCODE,
      label: 'Ripple Root Address Test',
      disableTransactionNotifications: true,
      rootPrivateKey: hdNode.getKey().getPrivateKeyBuffer().toString('hex')
    };
    var expectedAddress = rippleKeypairs.deriveAddress(hdNode.getKey().getPublicKeyBuffer().toString('hex'));

    return basecoin.wallets().generateWallet(params)
    .then(function(res) {
      res.should.have.property('wallet');
      res.should.have.property('userKeychain');
      res.should.have.property('backupKeychain');
      res.should.have.property('bitgoKeychain');

      res.userKeychain.should.have.property('pub');
      res.userKeychain.should.have.property('prv');
      res.userKeychain.should.have.property('encryptedPrv');

      res.backupKeychain.should.have.property('pub');
      res.backupKeychain.should.have.property('prv');

      res.bitgoKeychain.should.have.property('pub');
      res.bitgoKeychain.isBitGo.should.equal(true);
      res.bitgoKeychain.should.not.have.property('prv');
      res.bitgoKeychain.should.not.have.property('encryptedPrv');

      res.wallet._wallet.receiveAddress.address.should.startWith(expectedAddress + '?');
    });
  });

  it('Should be able to explain an XRP transaction', function() {
    const signedExplanation = basecoin.explainTransaction({ txHex: '120000228000000024000000072E00000000201B0018D07161400000000003DE2968400000000000002D73008114726D0D8A26568D5D9680AC80577C912236717191831449EE221CCACC4DD2BF8862B22B0960A84FC771D9F3E010732103AFBB6845826367D738B0D42EA0756C94547E70B064E8FE1260CF21354C898B0B74473045022100CA3A98AA6FC8CCA251C3A2754992E474EA469884EB8D489D2B180EB644AC7695022037EB886DCF57928E5844DB73C2E86DE553FB59DCFC9408F3FD5D802ADB69DFCC8114F0DBA9D34C77B6769F6142AB7C9D0AF67D113EBCE1F1' });
    const unsignedExplanation = basecoin.explainTransaction({ txHex: '{"TransactionType":"Payment","Account":"rBSpCz8PafXTJHppDcNnex7dYnbe3tSuFG","Destination":"rfjub8A4dpSD5nnszUFTsLprxu1W398jwc","DestinationTag":0,"Amount":"253481","Flags":2147483648,"LastLedgerSequence":1626225,"Fee":"45","Sequence":7}' });
    unsignedExplanation.id.should.equal('CA528085F95335027A8D8555E685500C5B3E325AAB22AA0BCB56605CDF97B1C8');
    signedExplanation.id.should.equal('D52681436CC5B94E9D00BC8172047B1A6F3C028D2D0A5CDFB81680039C48ADFD');
    unsignedExplanation.outputAmount.should.equal('253481');
    signedExplanation.outputAmount.should.equal('253481');
  });

  it('Should be unable to explain bogus XRP transaction', function() {
    try {
      basecoin.explainTransaction({ txHex: 'abcdefgH' });
      throw new Error('this is the wrong error!');
    } catch (e) {
      e.message.should.equal('txHex needs to be either hex or JSON string for XRP');
    }
  });

});
