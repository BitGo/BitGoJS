import * as should from 'should';

import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';

import { Xdc, Txdc } from '../../src/index';
import { UnsignedSweepTxMPCv2 } from '@bitgo/abstract-eth';
import { mockDataUnsignedSweep, mockDataNonBitGoRecovery } from '../resources';
import nock from 'nock';
import { common, TransactionType, Wallet } from '@bitgo/sdk-core';
import { Transaction } from '@ethereumjs/tx';
import { stripHexPrefix } from '@ethereumjs/util';

import { TransactionBuilder } from '../../src/lib';
import { getBuilder } from './getBuilder';

/** Encode ERC-20 transfer(address,uint256) calldata without ethereumjs-abi. */
function encodeErc20Transfer(to: string, amount: string): string {
  const address = to.toLowerCase().replace(/^0x/, '').padStart(64, '0');
  const value = BigInt(amount).toString(16).padStart(64, '0');
  return `0xa9059cbb${address}${value}`;
}

const bitgo: TestBitGoAPI = TestBitGo.decorate(BitGoAPI, { env: 'test' });

describe('xdc', function () {
  before(function () {
    bitgo.safeRegister('xdc', Xdc.createInstance);
    bitgo.safeRegister('txdc', Txdc.createInstance);
    bitgo.initializeTestVars();
  });

  describe('Basic Coin Info', function () {
    it('should return the right info for xdc', function () {
      const xdc = bitgo.coin('xdc');

      xdc.should.be.an.instanceof(Xdc);
      xdc.getChain().should.equal('xdc');
      xdc.getFamily().should.equal('xdc');
      xdc.getFullName().should.equal('XDC');
      xdc.getBaseFactor().should.equal(1e18);
      xdc.supportsTss().should.equal(true);
      xdc.allowsAccountConsolidations().should.equal(false);
    });

    it('should return the right info for txdc', function () {
      const txdc = bitgo.coin('txdc');

      txdc.should.be.an.instanceof(Txdc);
      txdc.getChain().should.equal('txdc');
      txdc.getFamily().should.equal('xdc');
      txdc.getFullName().should.equal('Testnet XDC');
      txdc.getBaseFactor().should.equal(1e18);
      txdc.supportsTss().should.equal(true);
      txdc.allowsAccountConsolidations().should.equal(false);
    });
  });

  describe('verifyTssTransaction', function () {
    const recipientAddress = '0x174cfd823af8ce27ed0afee3fcf3c3ba259116be';
    const wrongAddress = '0x7e85bdc27c050e3905ebf4b8e634d9ad6edd0de6';
    const tokenContractAddress = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
    const transferAmount = '1000000000000000000';

    it('should accept a native XDC transfer where txHex matches declared recipient', async function () {
      const coin = bitgo.coin('txdc') as Txdc;

      const txBuilder = getBuilder('txdc') as TransactionBuilder;
      txBuilder.type(TransactionType.SingleSigSend);
      txBuilder.fee({ fee: '10', gasLimit: '21000' });
      txBuilder.counter(1);
      txBuilder.contract(recipientAddress);
      txBuilder.value(transferAmount);
      const tx = await txBuilder.build();
      const txHex = tx.toBroadcastFormat();

      const wallet = new Wallet(bitgo, coin, { coinSpecific: { baseAddress: recipientAddress } });

      const result = await coin.verifyTssTransaction({
        txParams: {
          type: 'transfer',
          recipients: [{ address: recipientAddress, amount: transferAmount }],
        } as any,
        txPrebuild: { txHex, coin: 'txdc', walletId: 'fakeWalletId' } as any,
        wallet,
      });
      result.should.equal(true);
    });

    it('should reject a native XDC transfer when txHex recipient does not match declared recipient', async function () {
      const coin = bitgo.coin('txdc') as Txdc;

      const txBuilder = getBuilder('txdc') as TransactionBuilder;
      txBuilder.type(TransactionType.SingleSigSend);
      txBuilder.fee({ fee: '10', gasLimit: '21000' });
      txBuilder.counter(1);
      txBuilder.contract(wrongAddress);
      txBuilder.value(transferAmount);
      const tx = await txBuilder.build();
      const txHex = tx.toBroadcastFormat();

      const wallet = new Wallet(bitgo, coin, { coinSpecific: { baseAddress: recipientAddress } });

      await coin
        .verifyTssTransaction({
          txParams: {
            type: 'transfer',
            recipients: [{ address: recipientAddress, amount: transferAmount }],
          } as any,
          txPrebuild: { txHex, coin: 'txdc', walletId: 'fakeWalletId' } as any,
          wallet,
        })
        .should.be.rejectedWith('destination address does not match with the recipient address');
    });

    it('should accept an ERC-20 token transfer where calldata matches declared recipient', async function () {
      const coin = bitgo.coin('txdc') as Txdc;

      const erc20TransferData = encodeErc20Transfer(recipientAddress, '10000000');

      const txBuilder = getBuilder('txdc') as TransactionBuilder;
      txBuilder.type(TransactionType.ContractCall);
      txBuilder.fee({ fee: '10', gasLimit: '60000' });
      txBuilder.counter(1);
      txBuilder.contract(tokenContractAddress);
      txBuilder.data(erc20TransferData);
      const tx = await txBuilder.build();
      const txHex = tx.toBroadcastFormat();

      const wallet = new Wallet(bitgo, coin, { coinSpecific: { baseAddress: recipientAddress } });

      const result = await coin.verifyTssTransaction({
        txParams: {
          type: 'transfer',
          recipients: [{ address: recipientAddress, amount: '10000000' }],
        } as any,
        txPrebuild: { txHex, coin: 'txdc', walletId: 'fakeWalletId' } as any,
        wallet,
      });
      result.should.equal(true);
    });

    it('should reject an ERC-20 token transfer when calldata recipient does not match declared recipient', async function () {
      const coin = bitgo.coin('txdc') as Txdc;

      const erc20TransferData = encodeErc20Transfer(wrongAddress, '10000000');

      const txBuilder = getBuilder('txdc') as TransactionBuilder;
      txBuilder.type(TransactionType.ContractCall);
      txBuilder.fee({ fee: '10', gasLimit: '60000' });
      txBuilder.counter(1);
      txBuilder.contract(tokenContractAddress);
      txBuilder.data(erc20TransferData);
      const tx = await txBuilder.build();
      const txHex = tx.toBroadcastFormat();

      const wallet = new Wallet(bitgo, coin, { coinSpecific: { baseAddress: recipientAddress } });

      await coin
        .verifyTssTransaction({
          txParams: {
            type: 'transfer',
            recipients: [{ address: recipientAddress, amount: '10000000' }],
          } as any,
          txPrebuild: { txHex, coin: 'txdc', walletId: 'fakeWalletId' } as any,
          wallet,
        })
        .should.be.rejectedWith('destination address does not match with the recipient address');
    });
  });
});

describe('Build Unsigned Sweep for Self-Custody Cold Wallets - (MPCv2)', function () {
  const bitgo = TestBitGo.decorate(BitGoAPI, { env: 'test' });
  bitgo.register('txdc', Txdc.createInstance);
  const explorerUrl = common.Environments[bitgo.getEnv()].xdcExplorerBaseUrl as string;
  const gasPrice = 20000000000;
  const gasLimitValue = 500000;
  const chain_id = 51;

  it('should generate an unsigned sweep without derivation path', async () => {
    nock(explorerUrl)
      .get('/api')
      .twice()
      .query(mockDataUnsignedSweep.getTxListRequest)
      .reply(200, mockDataUnsignedSweep.getTxListResponse);
    nock(explorerUrl)
      .get('/api')
      .query(mockDataUnsignedSweep.getBalanceRequest)
      .reply(200, mockDataUnsignedSweep.getBalanceResponse);

    const baseCoin: any = bitgo.coin('txdc');
    const transaction = (await baseCoin.recover({
      userKey: mockDataUnsignedSweep.userKey,
      backupKey: mockDataUnsignedSweep.backupKey,
      walletContractAddress: mockDataUnsignedSweep.walletBaseAddress,
      recoveryDestination: mockDataUnsignedSweep.recoveryDestination,
      isTss: true,
      gasPrice: gasPrice,
      gasLimit: gasLimitValue,
      replayProtectionOptions: {
        chain: chain_id,
        hardfork: 'petersburg',
      },
    })) as UnsignedSweepTxMPCv2;
    should.exist(transaction);
    transaction.should.have.property('txRequests');
    transaction.txRequests.length.should.equal(1);
    const txRequest = transaction.txRequests[0];
    txRequest.should.have.property('walletCoin');
    txRequest.walletCoin.should.equal('txdc');
    txRequest.should.have.property('transactions');
    txRequest.transactions.length.should.equal(1);
    const tx = txRequest.transactions[0];
    tx.should.have.property('nonce');
    tx.should.have.property('unsignedTx');
    tx.unsignedTx.should.have.property('serializedTxHex');
    tx.unsignedTx.should.have.property('signableHex');
    tx.unsignedTx.should.have.property('derivationPath');
    tx.unsignedTx.should.have.property('feeInfo');
    tx.unsignedTx.feeInfo?.should.have.property('fee');
    tx.unsignedTx.feeInfo?.should.have.property('feeString');
    tx.unsignedTx.should.have.property('parsedTx');
    tx.unsignedTx.parsedTx?.should.have.property('spendAmount');
    tx.unsignedTx.parsedTx?.should.have.property('outputs');
  });
});

describe('Non Bitgo Recovery for Hot Wallets', function () {
  const bitgo = TestBitGo.decorate(BitGoAPI, { env: 'test' });
  bitgo.register('txdc', Txdc.createInstance);
  const explorerUrl = common.Environments[bitgo.getEnv()].xdcExplorerBaseUrl as string;
  const gasPrice = 20000000000;
  const chain_id = 51;
  const gasLimitvalue = 500000;

  it('should generate a signed non-bitgo recovery tx', async () => {
    nock(explorerUrl)
      .get('/api')
      .twice()
      .query(mockDataNonBitGoRecovery.getTxListRequest)
      .reply(200, mockDataNonBitGoRecovery.getTxListResponse);
    nock(explorerUrl)
      .get('/api')
      .query(mockDataNonBitGoRecovery.getBalanceRequest)
      .reply(200, mockDataNonBitGoRecovery.getBalanceResponse);

    const baseCoin: any = bitgo.coin('txdc');
    const transaction = await baseCoin.recover({
      userKey: mockDataNonBitGoRecovery.userKeyData,
      backupKey: mockDataNonBitGoRecovery.backupKeyData,
      walletContractAddress: mockDataNonBitGoRecovery.walletRootAddress,
      walletPassphrase: mockDataNonBitGoRecovery.walletPassphrase,
      recoveryDestination: mockDataNonBitGoRecovery.recoveryDestination,
      isTss: true,
      gasPrice: gasPrice,
      gasLimit: gasLimitvalue,
      replayProtectionOptions: {
        chain: chain_id,
        hardfork: 'petersburg',
      },
    });
    should.exist(transaction);
    transaction.should.have.property('id');
    transaction.should.have.property('tx');
    const tx = Transaction.fromSerializedTx(Buffer.from(stripHexPrefix(transaction.tx), 'hex'));
    tx.getSenderAddress().toString().should.equal(mockDataNonBitGoRecovery.walletRootAddress);
    const jsonTx = tx.toJSON();
    jsonTx.to?.should.equal(mockDataNonBitGoRecovery.recoveryDestination);
  });
});
