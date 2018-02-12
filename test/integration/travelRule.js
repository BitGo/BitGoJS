//
// Tests for Travel Rule
//
// Copyright 2016, BitGo, Inc.  All Rights Reserved.
//

const assert = require('assert');
require('should');
const _ = require('lodash');

const BitGoJS = require('../../src/index');
const bitcoin = BitGoJS.bitcoin;
const sjcl = require('../../src/sjcl.min');
const TestBitGo = require('../lib/test_bitgo');

const txid = TestBitGo.TRAVEL_RULE_TXID;

describe('Travel Rule API', function() {
  let bitgo;
  let travel;

  before(function(done) {
    bitgo = new TestBitGo();
    bitgo.initializeTestVars();
    bitgo.authenticateTestUser(bitgo.testUserOTP(), function(err, response) {
      if (err) {
        throw err;
      }
      travel = bitgo.travelRule();
      done();
    });
  });

  describe('Travel Rule - Recipients', function() {
    it('arguments', function() {
      assert.throws(function() { travel.getRecipients({}); });
      assert.throws(function() { travel.getRecipients('invalid'); });
    });

    it('success', function() {
      return travel.getRecipients({ txid: txid })
      .then(function(recipients) {
        recipients.should.have.length(3);
        let r = recipients[0];
        r.outputIndex.should.equal(0);
        r.enterprise.should.equal('SDKOther');
        r.amount.should.equal(100000);
        r.address.should.equal('2MyKoaanySBPCA2Br7dGvaZEgEGp7YRZvif');
        r.pubKey.should.equal('02fbb4b2f489535af4660202836ec041f2751700bfa1e65a72dee039b7ae3a3ac3');
        r = recipients[1];
        r.outputIndex.should.equal(1);
        r.enterprise.should.equal('SDKOther');
        r.amount.should.equal(100000);
        r.address.should.equal('2N11YQ5mb73CDhupX8peKqb3xFdD9kr78Wf');
        r.pubKey.should.equal('03ad5f7e98150f595233b21a4ec2b40738e987ab9ee61bdc6236bec0ddbbbec144');
        r = recipients[2];
        r.outputIndex.should.equal(3);
        r.enterprise.should.equal('SDKOther');
        r.amount.should.equal(600000);
        r.address.should.equal('2N1Tt75MNKFHRBE68HXHB7FSmLpmGCQDuJC');
        r.pubKey.should.equal('0285a71a06ccf085f7b9668d944aa06f0439eed32279fed28dc5f73349e1503fd4');
      });
    });
  });

  describe('Travel Rule - Validate Travel Info', function() {
    it('empty', function() {
      // was set to sender.validateTravelInfo({}) before eslint caught undefined variable, I assume it was
      // meant to be travel
      assert.throws(function() { travel.validateTravelInfo({}); });
    });

    it('invalid params', function() {
      assert.throws(function() { travel.validateTravelInfo({ amount: '3' }); });
      assert.throws(function() { travel.validateTravelInfo({ amount: 1, toAddress: 1 }); });
      assert.throws(function() { travel.validateTravelInfo({ amount: 1, toEnterprise: 1 }); });
      assert.throws(function() { travel.validateTravelInfo({ amount: 1, fromUserName: 1 }); });
      assert.throws(function() { travel.validateTravelInfo({ amount: 1, fromUserAddress: 1 }); });
      assert.throws(function() { travel.validateTravelInfo({ amount: 1, toUserName: 1 }); });
      assert.throws(function() { travel.validateTravelInfo({ amount: 1, toUserAccount: 1 }); });
      assert.throws(function() { travel.validateTravelInfo({ amount: 1, toUserAddress: 1 }); });
      assert.throws(function() { travel.validateTravelInfo({ amount: 1, extra: 'extra' }); });
    });

    it('valid', function() {
      travel.validateTravelInfo({ amount: 1, fromUserName: 'bob' }).fromUserName.should.equal('bob');
    });
  });

  describe('Travel Rule - Decrypt received info', function() {

    it('arguments', function() {
      assert.throws(function() { travel.decryptReceivedTravelInfo({}); });
      assert.throws(function() { travel.decryptReceivedTravelInfo({ tx: 'foo' }); });
      assert.throws(function() { travel.decryptReceivedTravelInfo({ tx: { receivedTravelInfo: [1] } }); });
      assert.throws(function() { travel.decryptReceivedTravelInfo({ tx: { receivedTravelInfo: [1] }, keychain: 'foo' }); });
      assert.throws(function() { travel.decryptReceivedTravelInfo({ tx: { receivedTravelInfo: [1] }, keychain: {} }); });
      const res = travel.decryptReceivedTravelInfo({ tx: { foo: 'bar' }, keychain: { xprv: 'blah' } });
      res.foo.should.equal('bar');
    });

    it('decrypts successfully', function() {
      const toPrivate = bitcoin.HDNode.fromSeedHex('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
      const fromPrivate = bitcoin.makeRandomKey();
      const path = '/99/99';
      const toPubKey = bitcoin.hdPath(toPrivate).deriveKey(path).getPublicKeyBuffer().toString('hex');
      const secret = bitgo.getECDHSecret({
        eckey: fromPrivate,
        otherPubKeyHex: toPubKey
      });
      const encryptedTravelInfo = sjcl.encrypt(secret, JSON.stringify({ fromUserName: 'frobozz' }));
      const fakeTravelInfo = {
        toPubKey: toPubKey,
        toPubKeyPath: path,
        fromPubKey: fromPrivate.getPublicKeyBuffer().toString('hex'),
        encryptedTravelInfo: encryptedTravelInfo
      };
      const fakeTx = {
        id: 'aabbcc',
        receivedTravelInfo: [fakeTravelInfo, fakeTravelInfo]
      };
      const tx = travel.decryptReceivedTravelInfo({ tx: fakeTx, hdnode: toPrivate });
      const infos = tx.receivedTravelInfo;
      infos.should.have.length(2);
      infos[0].travelInfo.fromUserName.should.equal('frobozz');
      infos[1].travelInfo.fromUserName.should.equal('frobozz');
    });

  });

  describe('Travel Rule - Send many', function() {

    it('arguments', function() {
      assert.throws(function() { travel.sendMany({}); });
      assert.throws(function() { travel.sendMany({ txid: txid }); });
      assert.throws(function() { travel.sendMany({ txid: txid, travelInfos: 'foo' }); });
      assert.throws(function() { travel.sendMany({ txid: txid, travelInfos: {} }, 'invalid'); });
      assert.throws(function() { travel.sendMany({ txid: txid, travelInfos: [{}] }); });
    });

    it('no matches', function() {
      const travelInfos = [{
        outputIndex: 2,
        fromUserName: 'Bob'
      }];
      return travel.sendMany({ txid: txid, travelInfos: travelInfos })
      .then(function(res) {
        res.matched.should.equal(0);
        _.keys(res.results).should.have.length(0);
      });
    });

    it('bad travel info', function() {
      const travelInfos = [{
        outputIndex: 0,
        fromUserName: 1
      }];
      assert.throws(function() { travel.sendMany({ txid: txid, travelInfos: travelInfos }); });
    });

    it('amount mismatch', function() {
      const travelInfos = [{
        outputIndex: 0,
        fromUserName: 'Bob',
        amount: 42
      }];
      return travel.sendMany({ txid: txid, travelInfos: travelInfos })
      .then(function() {
        assert(false); // should not get here
      })
      .catch(function(err) {
        err.message.should.equal('amount did not match for output index 0');
      });
    });

    it('success with single', function() {
      const travelInfos = [{
        outputIndex: 0,
        fromUserName: 'Alice'
      }];
      return travel.sendMany({ txid: txid, travelInfos: travelInfos })
      .then(function(res) {
        res.matched.should.equal(1);
        res.results.should.have.length(1);
        const r = res.results[0].result;
        r.should.have.property('id');
        r.should.have.property('date');
        r.fromEnterpriseId.should.equal('5578ebc76eb47487743b903166e6543a');
        r.fromEnterprise.should.equal('SDKTest');
        r.toEnterpriseId.should.equal('57057916c03b4a5d0644e2ad94a9e070');
        r.transactionId.should.equal(txid);
        r.toAddress.should.equal('2MyKoaanySBPCA2Br7dGvaZEgEGp7YRZvif');
        r.should.have.property('fromPubKey');
        r.should.have.property('toPubKey');
        r.should.have.property('encryptedTravelInfo');
      });
    });

    it('success with multiple', function() {
      const travelInfos = [
        {
          outputIndex: 0,
          fromUserName: 'Alice'
        },
        {
          outputIndex: 3,
          fromUserName: 'Bob'
        }
      ];
      return travel.sendMany({ txid: txid, travelInfos: travelInfos })
      .then(function(res) {
        res.matched.should.equal(2);
        res.results.should.have.length(2);
        _(res.results).map('result').filter().value().should.have.length(2);
      });
    });
  });
});
