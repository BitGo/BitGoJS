//
// Tests for Wallet
//
// Copyright 2014, BitGo, Inc.  All Rights Reserved.
//

const assert = require('assert');
require('should');

const BitGoJS = require('../../src/index');
const TestBitGo = require('../lib/test_bitgo');
let BN = function() {};
const Util = require('../../src/util');

try {
  BN = require('ethereumjs-util').BN;
} catch (e) {
  // do nothing
}

// TODO: WORK IN PROGRESS
describe('Ethereum BitGo.eth:', function() {
  let bitgo;

  before(function() {
    BitGoJS.setNetwork('testnet');

    bitgo = new TestBitGo();
    bitgo.initializeTestVars();
  });

  describe('Ether to Wei conversion', function() {
    it('convert ethereum to wei', function() {
      // 0 ether
      let number = new BN('0');
      bitgo.eth().weiToEtherString(number).should.equal('0');

      // 12345 ether
      number = new BN('12345000000000000000000');
      bitgo.eth().weiToEtherString(number).should.equal('12345');

      // 1234.5 ether
      number = new BN('1234500000000000000000');
      bitgo.eth().weiToEtherString(number).should.equal('1234.5');

      // 1234.505 ether
      number = new BN('1234505000000000000000');
      bitgo.eth().weiToEtherString(number).should.equal('1234.505');
      assert.throws(function() {
        // this number should overflow
        bitgo.eth().weiToEtherString(1234505000000000000000).should.equal('1234.505');
      });

      // 123450 ether
      number = new BN('123450000000000000000000');
      bitgo.eth().weiToEtherString(number).should.equal('123450');

      // a lot of ether with wei
      number = new BN('15234212341234123412341321341234134132423443345');
      bitgo.eth().weiToEtherString(number).should.equal('15234212341234123412341321341.234134132423443345');

      number = new BN('12345');
      bitgo.eth().weiToEtherString(number).should.equal('0.000000000000012345');
    });
  });

  describe('Bitcoin-Ethereum Conversion', function() {
    it('verify padding', function() {
      const incorrectlyPaddedXprv1 = 'xprv9s21ZrQH143K3EsVzrBYfWNonEcQ67i4VS6AodNVijvQnukHpAXpST2LwqoRY5rTJ7sFPJh8qUxGx9MmyfK54dZTvH8ERWZY37x6yL9j5dB';
      const incorrectlyPaddedXprv2 = 'xprv9s21ZrQH143K3QNgDCkvSx3koPxxwckY5vyafntKWCk9jZ7yHcGt4ZV3kHRpi8tsjpRuQY7YGWj9dsSVqckaKvmsx3xKrcj2RMSuuopmAYK';
      const incorrectlyPaddedXprv3 = 'xprv9s21ZrQH143K3tksgZT9ttq5GC2TnSe284TfMDsutsacu4CWvtSw2UdQDNUN28fXs9mhTc6ResUmc3o2enpKiFekB2JP8Kb6N6iBGoJMUBf';
      const incorrectlyPaddedXprv4 = 'xprv9s21ZrQH143K3gxrUzNDWx2NF7WFgjUqmjEFTK7wh46JS72sC1ugYUG7G3KwJNNTa44q3jkUh4yU8g19TGqtQ21DNZ3JzeM2MjwF6vF9MdK';
      const correctlyPaddedXprv005 = 'xprv9s21ZrQH143K2PLs4Qu4C8vogXrVi9sH3gZtkSNnkyte4AZYnjPCTvERYwYGAJoeyEYkxffNjUyUHcMaGu2viZiqauAusDkvQ6ii9rN88Sn';

      Util.xprvToEthPrivateKey(correctlyPaddedXprv005).should
      .equal('433efe74dc0a841c1e398238d3512e5ae8cbfde26a67667ef03a98a3e9291d80');

      Util.xprvToEthPrivateKey(incorrectlyPaddedXprv1).should.not
      .equal('cf63a5439fafb8e89c85952df485f0c14403a706a1ddecdef791941abcfbc0');
      Util.xprvToEthPrivateKey(incorrectlyPaddedXprv1).should
      .equal('00cf63a5439fafb8e89c85952df485f0c14403a706a1ddecdef791941abcfbc0');

      Util.xprvToEthPrivateKey(incorrectlyPaddedXprv2).should.not
      .equal('521e3129c5b9b2ce7496ad2d66aee274ec668f8731199a973ecb455e1dead1');
      Util.xprvToEthPrivateKey(incorrectlyPaddedXprv2).should
      .equal('00521e3129c5b9b2ce7496ad2d66aee274ec668f8731199a973ecb455e1dead1');

      Util.xprvToEthPrivateKey(incorrectlyPaddedXprv3).should.not
      .equal('c578cfe7f0e90575bb1e3cff8e4860c63fcbc3d8afe1a8465fe80078110bcb');
      Util.xprvToEthPrivateKey(incorrectlyPaddedXprv3).should
      .equal('00c578cfe7f0e90575bb1e3cff8e4860c63fcbc3d8afe1a8465fe80078110bcb');

      Util.xprvToEthPrivateKey(incorrectlyPaddedXprv4).should.not
      .equal('24e4f2fee6b3badccacf1bccde5fd937ecf6f8fda1ecca6d2061a6b62aede4');
      Util.xprvToEthPrivateKey(incorrectlyPaddedXprv4).should
      .equal('0024e4f2fee6b3badccacf1bccde5fd937ecf6f8fda1ecca6d2061a6b62aede4');
    });

    it('verify addresses', function() {
      // a random xpub
      const xpub = 'xpub661MyMwAqRbcF73ayX674hFz5Wr26tgRQKR3SexMeySATH1a7Ui7ZnL2re1Vwg6t2vj2xXui4xNmZH7ToTQFNVbBsFSpSGF3sMtjCAeT6H2';
      Util.xpubToEthAddress(xpub).should.equal('0x8383257c2beb7af0a660a79ccac76120151f7348');
    });
  });
});
