import assert from 'assert';
import should from 'should';

import { coins } from '@bitgo/statics';

import { WalletInitBuilder } from '../../../../src/lib/walletInitBuilder';
import { WalletInitTransaction } from '../../../../src/lib/walletInitialization/walletInitTransaction';
import { WalletInitRequest } from '../../../../src/lib/iface';

import { GenerateTopologyResponse, InvalidGenerateTopologyResponse, WalletInitRequestData } from '../../../resources';

describe('Wallet Initialization Builder', () => {
  it('should get the wallet init request object', function () {
    const txBuilder = new WalletInitBuilder(coins.get('tcanton'));
    const { publicKey, synchronizer, partyHint } = WalletInitRequestData;
    txBuilder.publicKey(publicKey);
    txBuilder.synchronizer(synchronizer);
    txBuilder.partyHint(partyHint);
    const requestObj: WalletInitRequest = txBuilder.toRequestObject();
    should.exist(requestObj);
    assert.equal(requestObj.synchronizer, synchronizer);
    assert.equal(requestObj.partyHint, partyHint);
    assert.equal(requestObj.localParticipantObservationOnly, false);
    assert.equal(requestObj.confirmationThreshold, 1);
    assert.equal(requestObj.observingParticipantUids.length, 0);
    assert.equal(requestObj.otherConfirmingParticipantUids.length, 0);
    should.exist(requestObj.publicKey);
    assert.equal(requestObj.publicKey.keyData, publicKey);
    should.exist(requestObj.publicKey.format);
    should.exist(requestObj.publicKey.format);
    should.exist(requestObj.publicKey.keySpec);
  });

  it('should validate raw transaction', function () {
    const txBuilder = new WalletInitBuilder(coins.get('tcanton'));
    txBuilder.transaction = GenerateTopologyResponse;
    txBuilder.validateRawTransaction(GenerateTopologyResponse.topologyTransactions);
  });

  it('should validate the transaction', function () {
    const txBuilder = new WalletInitBuilder(coins.get('tcanton'));
    txBuilder.transaction = GenerateTopologyResponse;
    const walletInitTxn = new WalletInitTransaction(coins.get('tcanton'));
    walletInitTxn.preparedParty = GenerateTopologyResponse;
    txBuilder.validateTransaction(walletInitTxn);
  });

  it('should throw error in validating raw transaction', function () {
    const txBuilder = new WalletInitBuilder(coins.get('tcanton'));
    txBuilder.transaction = InvalidGenerateTopologyResponse;
    try {
      txBuilder.validateRawTransaction(InvalidGenerateTopologyResponse.topologyTransactions);
    } catch (e) {
      assert.equal(e.message, 'invalid raw transaction, hash not matching');
    }
  });

  it('should throw error in validating raw transaction', function () {
    const txBuilder = new WalletInitBuilder(coins.get('tcanton'));
    txBuilder.transaction = InvalidGenerateTopologyResponse;
    const walletInitTxn = new WalletInitTransaction(coins.get('tcanton'));
    walletInitTxn.preparedParty = InvalidGenerateTopologyResponse;
    try {
      txBuilder.validateTransaction(walletInitTxn);
    } catch (e) {
      assert.equal(e.message, 'invalid transaction');
    }
  });
});
