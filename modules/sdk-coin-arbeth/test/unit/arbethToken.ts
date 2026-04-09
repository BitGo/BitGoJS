import * as should from 'should';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import nock from 'nock';
import { OfflineVaultTxInfo, optionalDeps } from '@bitgo/abstract-eth';
import { BitGoAPI } from '@bitgo/sdk-api';

import { ArbethToken } from '../../src';
import * as mockData from '../fixtures/arbeth';
import { common } from '@bitgo/sdk-core';

describe('Arbeth Token:', function () {
  let bitgo: TestBitGoAPI;
  let arbethTokenCoin;
  const baseUrl = common.Environments.test.arbiscanBaseUrl as string;
  const tokenName = 'tarbeth:link';
  const walletContractAddress = '0xdf07117705a9f8dc4c2a78de66b7f1797dba9d4e';
  const tokenContractAddress = '0xe5b6c29411b3ad31c3613bba0145293fc9957256';
  const recipientAddress = '0xa9c34eb3d3631501de56d9cfc5363f9335cfcff6';

  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'test' });
    ArbethToken.createTokenConstructors().forEach(({ name, coinConstructor }) => {
      bitgo.safeRegister(name, coinConstructor);
    });
    bitgo.initializeTestVars();
    arbethTokenCoin = bitgo.coin(tokenName);
  });

  it('should return constants', function () {
    arbethTokenCoin.getChain().should.equal('tarbeth:link');
    arbethTokenCoin.getBaseChain().should.equal('tarbeth');
    arbethTokenCoin.getFullName().should.equal('Arbeth Token');
    arbethTokenCoin.getBaseFactor().should.equal(1e18);
    arbethTokenCoin.type.should.equal(tokenName);
    arbethTokenCoin.name.should.equal('Arbitrum Test LINK');
    arbethTokenCoin.coin.should.equal('tarbeth');
    arbethTokenCoin.network.should.equal('Testnet');
    arbethTokenCoin.decimalPlaces.should.equal(18);
  });

  it('should return same token by contract address', function () {
    const tokencoinBycontractAddress = bitgo.coin(arbethTokenCoin.tokenContractAddress);
    arbethTokenCoin.should.deepEqual(tokencoinBycontractAddress);
  });

  it('should generate an unsigned sweep', async function () {
    const userXpub =
      'xpub661MyMwAqRbcEeTc8789MK5PUGEYiPG4F4V17n2Rd2LoTATA1XoCnJT5FAYAShQxSxtFjpo5NHmcWwTp2LiWGBMwpUcAA3HywhxivgYfq7q';
    const backupXpub =
      'xpub661MyMwAqRbcFZX15xpZf4ERCGHiVSJm8r5C4yh1yXV2GrdZCUPYo4WQr6tN9oUywKXsgSHo7Risf9r22GH5joVD2hEEEhqnSCvK8qy11wW';

    const backupKeyAddress = '0x4f2c4830cc37f2785c646f89ded8a919219fa0e9';
    nock(baseUrl)
      .get('/api')
      .twice()
      .query(mockData.getTxListRequest(backupKeyAddress))
      .reply(200, mockData.getTxListResponse);
    nock(baseUrl)
      .get('/api')
      .query(mockData.getTokenBalanceRequest(tokenContractAddress, walletContractAddress))
      .reply(200, mockData.getTokenBalanceResponse);
    nock(baseUrl)
      .get('/api')
      .query(mockData.getBalanceRequest(backupKeyAddress))
      .reply(200, mockData.getBalanceResponse);
    nock(baseUrl).get('/api').query(mockData.getContractCallRequest).reply(200, mockData.getContractCallResponse);
    const transaction = (await arbethTokenCoin.recover({
      userKey: userXpub,
      backupKey: backupXpub,
      walletContractAddress: walletContractAddress,
      tokenContractAddress,
      recoveryDestination: recipientAddress,
      eip1559: { maxFeePerGas: 20000000000, maxPriorityFeePerGas: 10000000000 },
      gasLimit: 8000000,
    })) as OfflineVaultTxInfo;
    should.exist(transaction);
    transaction.should.have.property('txHex');
    transaction.should.have.property('contractSequenceId');
    transaction.should.have.property('expireTime');
    transaction.should.have.property('gasLimit');
    transaction.gasLimit.should.equal('8000000');
    transaction.should.have.property('walletContractAddress');
    transaction.walletContractAddress.should.equal(walletContractAddress);
    transaction.should.have.property('recipients');
    const recipient = transaction.recipients[0];
    recipient.should.have.property('address');
    recipient.address.should.equal(recipientAddress);
    recipient.should.have.property('amount');
    recipient.amount.should.equal('9999999999999999948');
  });

  it('should construct a recovery transaction without BitGo', async function () {
    const backupKeyAddress = '0x6d22efdd634996248170c948e5726007fc251bb3';
    nock(baseUrl).get('/api').query(mockData.getTxListRequest(backupKeyAddress)).reply(200, mockData.getTxListResponse);
    nock(baseUrl)
      .get('/api')
      .query(mockData.getBalanceRequest(walletContractAddress))
      .reply(200, mockData.getBalanceResponse);

    nock(baseUrl)
      .get('/api')
      .query(mockData.getTokenBalanceRequest(tokenContractAddress, walletContractAddress))
      .reply(200, mockData.getTokenBalanceResponse);
    nock(baseUrl)
      .get('/api')
      .query(mockData.getBalanceRequest(backupKeyAddress))
      .reply(200, mockData.getBalanceResponse);
    nock(baseUrl).get('/api').query(mockData.getContractCallRequest).reply(200, mockData.getContractCallResponse);

    const transaction = (await arbethTokenCoin.recover({
      userKey:
        '{"iv":"VFZ3jvXhxo1Z+Yaf2MtZnA==","v":1,"iter":10000,"ks":256,"ts":64,"mode"\n' +
        ':"ccm","adata":"","cipher":"aes","salt":"p+fkHuLa/8k=","ct":"hYG7pvljLIgCjZ\n' +
        '53PBlCde5KZRmlUKKHLtDMk+HJfuU46hW+x+C9WsIAO4gFPnTCvFVmQ8x7czCtcNFub5AO2otOG\n' +
        'OsX4GE2gXOEmCl1TpWwwNhm7yMUjGJUpgW6ZZgXSXdDitSKi4V/hk78SGSzjFOBSPYRa6I="}\n',
      backupKey:
        '{"iv":"AbsCtv1qwPIhOgyrCpNagA==","v":1,"iter":10000,"ks":256,"ts":64,"mode"\n' +
        ':"ccm","adata":"","cipher":"aes","salt":"5vpUDBUlzm8=","ct":"PapYYCjBXRLUKA\n' +
        'JbOsB/EJ9B8fUmVQTxMPjUnQyAky12me9K66GiMEAxTD7kd6bYAQJuuTkATXKU7Bnf7vK9JxNOw\n' +
        'oji7HF9eFH0aD4/hX5SWFfHF2Qfi+TnXv6hVsMAoisDZs3/F67/ZUaDYR0ZsdrQ4Q/cLD0="}\n',

      walletContractAddress: walletContractAddress,
      tokenContractAddress,
      walletPassphrase: 'oPXkPN5Q0c8i44i0',
      recoveryDestination: recipientAddress,
      gasLimit: 500000,
    })) as OfflineVaultTxInfo;
    should.exist(transaction);
    transaction.should.have.property('tx');
    transaction.should.have.property('id');
    const decodedTx = optionalDeps.EthTx.Transaction.fromSerializedTx(optionalDeps.ethUtil.toBuffer(transaction.tx));
    decodedTx.should.have.property('gasPrice');
    decodedTx.should.have.property('nonce');
    decodedTx.should.have.property('to');
    decodedTx.data.toString('hex').should.startWith('0dcd7a6c');
  });
});
