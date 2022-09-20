import * as nock from 'nock';
import * as should from 'should';

import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';

import { Ethw } from '../../src/index';
import { nockEthwRecovery } from '../lib/recovery-nocks';

nock.disableNetConnect();

const bitgo: TestBitGoAPI = TestBitGo.decorate(BitGoAPI, { env: 'test' });
bitgo.safeRegister('ethw', Ethw.createInstance);

describe('Ethereum pow', function () {
  let basecoin;

  before(function () {
    bitgo.initializeTestVars();
    basecoin = bitgo.coin('ethw');
  });

  after(function () {
    nock.cleanAll();
  });

  it('should instantiate the coin', function () {
    const basecoin = bitgo.coin('ethw');
    basecoin.should.be.an.instanceof(Ethw);
  });

  describe('Recover Ethereum PoW', function () {
    beforeEach(() => {
      nock.cleanAll();
    });
    let recoveryParams;
    before(() => {
      recoveryParams = {
        userKey:
          '{"iv":"+TkmT3GJ5msVWQjBrt3lsw==","v":1,"iter":10000,"ks":256,"ts":64,"mode"\n' +
          ':"ccm","adata":"","cipher":"aes","salt":"cCE20fGIobs=","ct":"NVIdYIh91J3aRI\n' +
          '8GG0JE3DhXW3AUmz2G5RqMejdz1+t4/vovIP7lleegI7VYyWiiLvlM0OCFf3EVvV/RyXr8+2vsn\n' +
          'Q0Vn8c2CV5FRZ80OjGYrW3A/6T/zpOz6E8CMvnD++iIpeO4r2eZJavejZxdzlxF0BRz7VI="}',
        backupKey:
          '{"iv":"asB356ofC7nZtg4NBvQkiQ==","v":1,"iter":10000,"ks":256,"ts":64,"mode"\n' +
          ':"ccm","adata":"","cipher":"aes","salt":"1hr2HhBbBIk=","ct":"8CZc6upt+XNOto\n' +
          'KDD38TUg3ZUjzW+DraZlkcku2bNp0JS2s1g/iC6YTGUGtPoxDxumDlXwlWQx+5WPjZu79M8DCrI\n' +
          't9aZaOvHkGH9aFtMbavFX419TcrwDmpUeQFN0hRkfrIHXyHNbTpGSVAjHvHMtzDMaw+ACg="}',
        walletPassphrase: TestBitGo.V2.TEST_RECOVERY_PASSCODE,
        walletContractAddress: '0x5df5a96b478bb1808140d87072143e60262e8670',
        recoveryDestination: '0xac05da78464520aa7c9d4c19bd7a440b111b3054',
        replayProtectionOptions: {
          chain: 10001,
          hardfork: 'london',
        },
      };
    });

    it('should throw on invalid gasLimit', async function () {
      nockEthwRecovery(bitgo);
      await basecoin
        .recover({
          ...recoveryParams,
          gasLimit: -400000,
          gasPrice: 25000000000,
        })
        .should.be.rejectedWith('Gas limit must be between 30000 and 20000000');
    });

    it('should throw if etherscan errs', async function () {
      const nockUnsuccessfulEtherscanData: any[] = [
        {
          params: {
            method: 'eth_getTransactionCount',
            params: ['0x74c2137d54b0fc9f907e13f14e0dd18485fee924', 'latest'],
          },
          response: {
            result: '0x0',
            id: 0,
            jsonrpc: '2.0',
          },
        },
        {
          params: {
            method: 'eth_getBalance',
            params: ['0x74c2137d54b0fc9f907e13f14e0dd18485fee924', 'latest'],
          },
          response: {
            error: {
              code: -32602,
              message:
                'invalid argument 0: json: cannot unmarshal hex string of odd length into Go value of type common.Address',
            },
            id: 0,
            jsonrpc: '2.0',
          },
        },
      ];
      nockEthwRecovery(bitgo, nockUnsuccessfulEtherscanData);
      await basecoin
        .recover(recoveryParams)
        .should.be.rejectedWith(
          'ETHW full node error: -32602 - invalid argument 0: json: cannot unmarshal hex string of odd length into Go value of type common.Address'
        );
    });

    it('should throw if backup key address has insufficient balance', async function () {
      const insufficientFeeData: any[] = [
        {
          params: {
            method: 'eth_getTransactionCount',
            params: ['0x74c2137d54b0fc9f907e13f14e0dd18485fee924', 'latest'],
          },
          response: {
            id: 0,
            jsonrpc: '2.0',
            result: '0x0',
          },
        },
        {
          params: {
            method: 'eth_getBalance',
            params: ['0x74c2137d54b0fc9f907e13f14e0dd18485fee924', 'latest'],
          },
          response: {
            id: 0,
            jsonrpc: '2.0',
            result: '0x4d2',
          },
        },
      ];
      nockEthwRecovery(bitgo, insufficientFeeData);
      await basecoin
        .recover({
          ...recoveryParams,
          gasLimit: 300000,
          gasPrice: 1000000000,
        })
        .should.be.rejectedWith(
          'Backup key address 0x74c2137d54b0fc9f907e13f14e0dd18485fee924 has balance 0.000001234 Gwei.' +
            'This address must have a balance of at least 300000 Gwei to perform recoveries. Try sending some ETH to this address then retry.'
        );
    });

    it('should throw on invalid gasPrice', async function () {
      nockEthwRecovery(bitgo);
      await basecoin
        .recover({
          ...recoveryParams,
          gasLimit: 400000,
          gasPrice: 2500000,
        })
        .should.be.rejectedWith('Gas price must be between 1000000000 and 2500000000000');
    });

    it('should successfully construct a tx with custom gas price and limit', async function () {
      nockEthwRecovery(bitgo);
      const recovery = await basecoin.recover({
        ...recoveryParams,
        gasLimit: 400000,
        gasPrice: 1000000000,
      });
      // id and tx will always be different because of expireTime
      should.exist(recovery);
      recovery.should.have.property('id');
      recovery.should.have.property('tx');
      await checkRecoveryTxExplanation(recovery.tx, 2200000000000000000, recoveryParams.recoveryDestination);
    });

    it('should construct a recovery transaction without BitGo', async function () {
      nockEthwRecovery(bitgo);
      const recovery = await basecoin.recover(recoveryParams);
      // id and tx will always be different because of expireTime
      should.exist(recovery);
      recovery.should.have.property('id');
      recovery.should.have.property('tx');
      await checkRecoveryTxExplanation(recovery.tx, 2200000000000000000, recoveryParams.recoveryDestination);
    });

    it('should construct a recovery transaction without BitGo and with KRS', async function () {
      nockEthwRecovery(bitgo);
      const recovery = await basecoin.recover({
        ...recoveryParams,
        backupKey:
          'xpub661MyMwAqRbcGsCNiG4BzbxLmXnJFo4K5gVSE2b9AxufAtpuTun1SYwg9Uykqqf4DrKrDZ6KqPm9ehthWbCma7pnaMrtXY11nY7MeFbEDPm',
        krsProvider: 'keyternal',
      });

      // id and tx will always be different because of expireTime
      should.exist(recovery);
      recovery.should.have.property('id');
      recovery.should.have.property('tx');
      await checkRecoveryTxExplanation(recovery.tx, 2200000000000000000, recoveryParams.recoveryDestination);
    });

    it('should error when the backup key is unfunded (cannot pay gas)', async function () {
      nockEthwRecovery(bitgo);
      await basecoin
        .recover({
          userKey:
            '{"iv":"VNvG6t3fHfxMcfvNuafYYA==","v":1,"iter":10000,"ks":256,"ts":64,"mode"\n' +
            ':"ccm","adata":"","cipher":"aes","salt":"mc9pCk3H43w=","ct":"Qe4Z1evaXcrOMC\n' +
            'cQ/XMVVBO9M/99D1QQ6LxkG8z3fQtwwOVXM3/6doNrriprUqs+adpFC93KRcAaDroL1E6o17J2k\n' +
            'mcpXRd2CuXRFORZmZ/6QBfjKfCJ3aq0kEkDVv37gZNVT3aNtGkNSQdCEWKQLwd1++r5AkA="}\n',
          backupKey:
            '{"iv":"EjD7x0OJX9kNM/C3yEDvyQ==","v":1,"iter":10000,"ks":256,"ts":64,"mode"\n' +
            ':"ccm","adata":"","cipher":"aes","salt":"Na9NvRRe3n8=","ct":"B/AtSLHolsdNLr\n' +
            '4Dlij4kQ0E6NyUUs6wo6T2HtPDAPO0hyhPPbh1OAYqIS7VlL9xmJRFC2zPxwRJvzf6OWC/m48HX\n' +
            'vgLoXYgahArhalzJVlRxcXUz4HOhozRWfv/eK3t5HJfm+25+WBOiW8YgSE7hVEYTbeBRD4="}',
          walletContractAddress: '0x22ff743216b58aeb3efc46985406b50112e9e176',
          walletPassphrase: TestBitGo.V2.TEST_RECOVERY_PASSCODE,
          recoveryDestination: '0xac05da78464520aa7c9d4c19bd7a440b111b3054',
        })
        .should.be.rejectedWith(
          'Backup key address 0xba6d9d82cf2920c544b834b72f4c6d11a3ef3de6 has balance 0 Gwei.This address must have a balance of at least 10000000 Gwei to perform recoveries. Try sending some ETH to this address then retry.'
        );
    });

    it('should generate an ETH unsigned sweep', async function () {
      nockEthwRecovery(bitgo);

      const transaction = await basecoin.recover({
        userKey:
          'xpub661MyMwAqRbcFXDcWD2vxuebcT1ZpTF4Vke6qmMW8yzddwNYpAPjvYEEL5jLfyYXW2fuxtAxY8TgjPUJLcf1C8qz9N6VgZxArKX4EwB8rH5',
        backupKey:
          'xpub661MyMwAqRbcGhSaXikpuTC9KU88Xx9LrjKSw1JKsvXNgabpTdgjy7LSovh9ZHhcqhAHQu7uthu7FguNGdcC4aXTKK5gqTcPe4WvLYRbCSG',
        walletContractAddress: TestBitGo.V2.TEST_ETH_WALLET_FIRST_ADDRESS,
        recoveryDestination: TestBitGo.V2.TEST_ERC20_TOKEN_RECIPIENT,
        gasPrice: '20000000000',
        gasLimit: '500000',
      });
      should.exist(transaction);
      transaction.should.have.property('tx');
      transaction.should.have.property('contractSequenceId');
      transaction.should.have.property('expireTime');
      transaction.should.have.property('gasLimit');
      transaction.gasLimit.should.equal('500000');
      transaction.should.have.property('gasPrice');
      transaction.gasPrice.should.equal('20000000000');
      transaction.should.have.property('walletContractAddress');
      transaction.walletContractAddress.should.equal(TestBitGo.V2.TEST_ETH_WALLET_FIRST_ADDRESS);
      transaction.should.have.property('recipient');
      transaction.recipient.should.have.property('address');
      transaction.recipient.address.should.equal(TestBitGo.V2.TEST_ERC20_TOKEN_RECIPIENT);
      transaction.recipient.should.have.property('amount');
      transaction.recipient.amount.should.equal('9999999999999999928');
      checkRecoveryTxExplanation(transaction.tx, 9999999999999999928, TestBitGo.V2.TEST_ERC20_TOKEN_RECIPIENT);
    });

    async function checkRecoveryTxExplanation(tx, recoveryAmount, recoveryDestination) {
      const explanation = await basecoin.explainTransaction({ txHex: '0x' + tx, feeInfo: { fee: 1 } });
      explanation.should.have.property('outputs');
      explanation.outputs.should.containEql({
        amount: recoveryAmount.toFixed(),
        address: recoveryDestination,
      });
      explanation.should.have.property('changeOutputs', []);
      explanation.should.have.property('changeAmount', '0');
      explanation.should.have.property('fee', { fee: 1 });
    }
  });
});
