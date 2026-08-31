import 'should';

import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';
import { TransactionType, Wallet } from '@bitgo/sdk-core';
import { FeeMarketEIP1559Transaction, Transaction as LegacyTransaction } from '@ethereumjs/tx';
import { RLP } from '@ethereumjs/rlp';
import { bufArrToArr } from 'ethereumjs-util';

import { AbstractEthLikeNewCoins } from '@bitgo/abstract-eth';
import { Bsc, Tbsc } from '../../src/index';
import { TransactionBuilder } from '../../src/lib';
import { getBuilder } from './getBuilder';

/** Encode ERC-20 transfer(address,uint256) calldata without ethereumjs-abi. */
function encodeErc20Transfer(to: string, amount: string): string {
  const address = to.toLowerCase().replace(/^0x/, '').padStart(64, '0');
  const value = BigInt(amount).toString(16).padStart(64, '0');
  return `0xa9059cbb${address}${value}`;
}

const bitgo: TestBitGoAPI = TestBitGo.decorate(BitGoAPI, { env: 'test' });

describe('Native BNB', function () {
  before(function () {
    bitgo.safeRegister('bsc', Bsc.createInstance);
    bitgo.safeRegister('tbsc', Tbsc.createInstance);
    bitgo.initializeTestVars();
  });

  describe('Basic Coin Info', function () {
    it('should return the right info for bsc', function () {
      const bsc = bitgo.coin('bsc');

      bsc.should.be.an.instanceof(Bsc);
      bsc.getChain().should.equal('bsc');
      bsc.getFamily().should.equal('bsc');
      bsc.getFullName().should.equal('Native BNB');
      bsc.getBaseFactor().should.equal(1e18);
      bsc.supportsTss().should.equal(true);
      bsc.allowsAccountConsolidations().should.equal(true);
    });

    it('should return the right info for tbsc', function () {
      const tbsc = bitgo.coin('tbsc');

      tbsc.should.be.an.instanceof(Tbsc);
      tbsc.getChain().should.equal('tbsc');
      tbsc.getFamily().should.equal('bsc');
      tbsc.getFullName().should.equal('Testnet Native BNB');
      tbsc.getBaseFactor().should.equal(1e18);
      tbsc.supportsTss().should.equal(true);
      tbsc.allowsAccountConsolidations().should.equal(true);
    });
  });

  describe('verifyTssTransaction', function () {
    const recipientAddress = '0x174cfd823af8ce27ed0afee3fcf3c3ba259116be';
    const wrongAddress = '0x7e85bdc27c050e3905ebf4b8e634d9ad6edd0de6';
    const tokenContractAddress = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
    const transferAmount = '1000000000000000000';

    it('should accept a native BNB transfer where txHex matches declared recipient', async function () {
      const coin = bitgo.coin('tbsc') as Tbsc;

      const txBuilder = getBuilder('tbsc') as TransactionBuilder;
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
        txPrebuild: { txHex, coin: 'tbsc', walletId: 'fakeWalletId' } as any,
        wallet,
      });
      result.should.equal(true);
    });

    it('should reject a native BNB transfer when txHex recipient does not match declared recipient', async function () {
      const coin = bitgo.coin('tbsc') as Tbsc;

      const txBuilder = getBuilder('tbsc') as TransactionBuilder;
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
          txPrebuild: { txHex, coin: 'tbsc', walletId: 'fakeWalletId' } as any,
          wallet,
        })
        .should.be.rejectedWith('destination address does not match with the recipient address');
    });

    it('should accept a BEP-20 token transfer where calldata matches declared recipient', async function () {
      const coin = bitgo.coin('tbsc') as Tbsc;

      const erc20TransferData = encodeErc20Transfer(recipientAddress, '10000000');

      const txBuilder = getBuilder('tbsc') as TransactionBuilder;
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
        txPrebuild: { txHex, coin: 'tbsc', walletId: 'fakeWalletId' } as any,
        wallet,
      });
      result.should.equal(true);
    });

    it('should reject a BEP-20 token transfer when calldata recipient does not match declared recipient', async function () {
      const coin = bitgo.coin('tbsc') as Tbsc;

      const erc20TransferData = encodeErc20Transfer(wrongAddress, '10000000');

      const txBuilder = getBuilder('tbsc') as TransactionBuilder;
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
          txPrebuild: { txHex, coin: 'tbsc', walletId: 'fakeWalletId' } as any,
          wallet,
        })
        .should.be.rejectedWith('destination address does not match with the recipient address');
    });

    it('should accept a BEP-20 token transfer using WalletConnect recipients[0].data flow', async function () {
      const coin = bitgo.coin('tbsc') as Tbsc;

      // txHex sends to recipientAddress; recipients[0].data encodes the same intent
      const erc20TransferData = encodeErc20Transfer(recipientAddress, '10000000');

      const txBuilder = getBuilder('tbsc') as TransactionBuilder;
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
          // WalletConnect passes the intended calldata in recipients[0].data
          recipients: [{ address: tokenContractAddress, amount: '0', data: erc20TransferData }],
        } as any,
        txPrebuild: { txHex, coin: 'tbsc', walletId: 'fakeWalletId' } as any,
        wallet,
      });
      result.should.equal(true);
    });

    it('should reject a BEP-20 token transfer using WalletConnect flow when calldata recipient is tampered', async function () {
      const coin = bitgo.coin('tbsc') as Tbsc;

      // txHex sends to wrongAddress (tampered)
      const tamperedData = encodeErc20Transfer(wrongAddress, '10000000');

      const txBuilder = getBuilder('tbsc') as TransactionBuilder;
      txBuilder.type(TransactionType.ContractCall);
      txBuilder.fee({ fee: '10', gasLimit: '60000' });
      txBuilder.counter(1);
      txBuilder.contract(tokenContractAddress);
      txBuilder.data(tamperedData);
      const tx = await txBuilder.build();
      const txHex = tx.toBroadcastFormat();

      // recipients[0].data declares the correct recipient (recipientAddress)
      const correctData = encodeErc20Transfer(recipientAddress, '10000000');

      const wallet = new Wallet(bitgo, coin, { coinSpecific: { baseAddress: recipientAddress } });

      await coin
        .verifyTssTransaction({
          txParams: {
            type: 'transfer',
            recipients: [{ address: tokenContractAddress, amount: '0', data: correctData }],
          } as any,
          txPrebuild: { txHex, coin: 'tbsc', walletId: 'fakeWalletId' } as any,
          wallet,
        })
        .should.be.rejectedWith('destination address does not match with the recipient address');
    });

    describe('assertSignableConsistency (Gap 2 / WCI-1398)', function () {
      function stripHex(hex: string): string {
        return hex.startsWith('0x') ? hex.slice(2) : hex;
      }

      async function buildSerializedTxHex(address: string): Promise<string> {
        const txBuilder = getBuilder('tbsc') as TransactionBuilder;
        txBuilder.type(TransactionType.SingleSigSend);
        txBuilder.fee({ fee: '10', gasLimit: '21000' });
        txBuilder.counter(1);
        txBuilder.contract(address);
        txBuilder.value(transferAmount);
        const tx = await txBuilder.build();
        return stripHex(tx.toBroadcastFormat());
      }

      function deriveSignableHex(serializedTxHex: string, coin: Tbsc): string {
        const common = AbstractEthLikeNewCoins.getCustomChainCommon(coin.getChainId());
        const legacyTx = LegacyTransaction.fromSerializedTx(Buffer.from(serializedTxHex, 'hex'), { common });
        return Buffer.from(RLP.encode(bufArrToArr(legacyTx.getMessageToSign(false)))).toString('hex');
      }

      it('should pass when signableHex is consistent with serializedTxHex', async function () {
        const coin = bitgo.coin('tbsc') as Tbsc;
        const serializedTxHex = await buildSerializedTxHex(recipientAddress);
        const signableHex = deriveSignableHex(serializedTxHex, coin);
        coin.assertSignableConsistency(serializedTxHex, signableHex);
      });

      it('should throw when signableHex does not match serializedTxHex (Gap 2 attack)', async function () {
        const coin = bitgo.coin('tbsc') as Tbsc;
        const benignSerializedTxHex = await buildSerializedTxHex(recipientAddress);
        const maliciousSerializedTxHex = await buildSerializedTxHex(wrongAddress);
        const tamperedSignableHex = deriveSignableHex(maliciousSerializedTxHex, coin);
        (() => coin.assertSignableConsistency(benignSerializedTxHex, tamperedSignableHex)).should.throw(
          'signableHex is inconsistent with serializedTxHex: possible server tampering'
        );
      });

      it('should reject an EIP-1559 typed tx since BSC is pinned to the petersburg hardfork', function () {
        const coin = bitgo.coin('tbsc') as Tbsc;
        const typedTx = FeeMarketEIP1559Transaction.fromTxData(
          {
            nonce: 1,
            maxFeePerGas: 10,
            maxPriorityFeePerGas: 1,
            gasLimit: 21000,
            to: recipientAddress,
            value: 1000,
          },
          { common: AbstractEthLikeNewCoins.getCustomChainCommon(coin.getChainId()) }
        );
        (() => coin.assertSignableConsistency(stripHex(typedTx.serialize().toString('hex')), '')).should.throw(
          /EIP-1559 not enabled on Common/
        );
      });
    });
  });
});
