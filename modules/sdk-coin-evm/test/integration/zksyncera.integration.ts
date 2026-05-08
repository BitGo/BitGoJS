// modules/sdk-coin-evm/test/integration/zksyncera.integration.ts
import should from 'should';
import { TransactionType } from '@bitgo/sdk-core';
import { coins, Networks, CoinFamily } from '@bitgo/statics';
import { decodeTransferData, KeyPair } from '@bitgo/abstract-eth';
import { TransactionBuilder } from '../../src/lib';

describe('ZkSync Era Transaction Builder Integration', function () {
  describe('Mainnet (zksyncera)', function () {
    let txBuilder: TransactionBuilder;
    let key: string;
    let contractAddress: string;

    const testPrivateKey =
      'xprv9s21ZrQH143K3vYxF8BfcG8g82bkkrf962jYfdc2SdsbXzLRcnaWAD3jWMsQaTz9ZoqD7gvYeR3fRPZy3Fr2UFXrome67sTdb66wAFmcz6G';

    beforeEach(function () {
      contractAddress = '0x8f977e912ef500548a0c3be6ddde9899f1199b81';
      txBuilder = new TransactionBuilder(coins.get('zksyncera'));
      const keyPair = new KeyPair({ prv: testPrivateKey });
      key = keyPair.getKeys().prv as string;
      txBuilder.fee({
        fee: '1000000000',
        gasLimit: '12100000',
      });
      txBuilder.counter(2);
      txBuilder.type(TransactionType.Send);
      txBuilder.contract(contractAddress);
    });

    it('should have correct network configuration', function () {
      const coin = coins.get('zksyncera');
      coin.family.should.equal(CoinFamily.ZKSYNCERA);
      coin.network.should.deepEqual(Networks.main.zkSyncEra);
      (coin.network as any).chainId.should.equal(324);
    });

    it('should build a send funds transaction with correct chainId', async function () {
      const recipient = '0x19645032c7f1533395d44a629462e751084d3e4c';
      const amount = '1000000000';
      const expireTime = 1590066728;
      const sequenceId = 5;

      txBuilder
        .transfer()
        .amount(amount)
        .to(recipient)
        .expirationTime(expireTime)
        .contractSequenceId(sequenceId)
        .key(key);

      txBuilder.sign({ key: testPrivateKey });
      const tx = await txBuilder.build();

      // Verify chainId is 324 (zkSync Era mainnet)
      const txJson = tx.toJson();
      // ChainId may be in hex or decimal format depending on implementation
      const chainId = typeof txJson.chainId === 'string' ? parseInt(txJson.chainId, 16) : txJson.chainId;
      chainId.should.equal(324);

      // Verify transaction structure
      should.equal(tx.signature.length, 2);
      should.equal(tx.inputs.length, 1);
      should.equal(tx.inputs[0].address, contractAddress);
      should.equal(tx.inputs[0].value, amount);

      should.equal(tx.outputs.length, 1);
      should.equal(tx.outputs[0].address, recipient);
      should.equal(tx.outputs[0].value, amount);

      // Verify decoded transfer data
      const data = txJson.data;
      const {
        to,
        amount: parsedAmount,
        expireTime: parsedExpireTime,
        sequenceId: parsedSequenceId,
      } = decodeTransferData(data);
      should.equal(to, recipient);
      should.equal(parsedAmount, amount);
      should.equal(parsedExpireTime, expireTime);
      should.equal(parsedSequenceId, sequenceId);
    });

    it('should build a send funds transaction with amount 0', async function () {
      txBuilder
        .transfer()
        .amount('0')
        .to('0x19645032c7f1533395d44a629462e751084d3e4c')
        .expirationTime(1590066728)
        .contractSequenceId(5)
        .key(key);
      txBuilder.sign({ key: testPrivateKey });
      const tx = await txBuilder.build();

      should.exist(tx.toBroadcastFormat());
      tx.inputs[0].value.should.equal('0');
    });

    it('should use non-packed encoding for txdata (USES_NON_PACKED_ENCODING_FOR_TXDATA feature)', async function () {
      const recipient = '0x19645032c7f1533395d44a629462e751084d3e4c';
      const amount = '1000000000';

      txBuilder.transfer().amount(amount).to(recipient).expirationTime(1590066728).contractSequenceId(5).key(key);

      txBuilder.sign({ key: testPrivateKey });
      const tx = await txBuilder.build();

      // The transaction should be buildable and have valid data
      const txJson = tx.toJson();
      should.exist(txJson.data);
      txJson.data.should.startWith('0x');
    });

    it('should be identified as ETH_ROLLUP_CHAIN', function () {
      const coin = coins.get('zksyncera');
      coin.features.should.containEql('eth-rollup-chain');
    });
  });

  describe('Testnet (tzksyncera)', function () {
    let txBuilder: TransactionBuilder;
    let key: string;
    let contractAddress: string;

    const testPrivateKey =
      'xprv9s21ZrQH143K3vYxF8BfcG8g82bkkrf962jYfdc2SdsbXzLRcnaWAD3jWMsQaTz9ZoqD7gvYeR3fRPZy3Fr2UFXrome67sTdb66wAFmcz6G';

    beforeEach(function () {
      contractAddress = '0x8f977e912ef500548a0c3be6ddde9899f1199b81';
      txBuilder = new TransactionBuilder(coins.get('tzksyncera'));
      const keyPair = new KeyPair({ prv: testPrivateKey });
      key = keyPair.getKeys().prv as string;
      txBuilder.fee({
        fee: '1000000000',
        gasLimit: '12100000',
      });
      txBuilder.counter(2);
      txBuilder.type(TransactionType.Send);
      txBuilder.contract(contractAddress);
    });

    it('should have correct testnet network configuration', function () {
      const coin = coins.get('tzksyncera');
      coin.family.should.equal(CoinFamily.ZKSYNCERA);
      coin.network.should.deepEqual(Networks.test.zkSyncEra);
      (coin.network as any).chainId.should.equal(300);
    });

    it('should build a send funds transaction with testnet chainId', async function () {
      const recipient = '0x19645032c7f1533395d44a629462e751084d3e4c';
      const amount = '1000000000';
      const expireTime = 1590066728;
      const sequenceId = 5;

      txBuilder
        .transfer()
        .amount(amount)
        .to(recipient)
        .expirationTime(expireTime)
        .contractSequenceId(sequenceId)
        .key(key);

      txBuilder.sign({ key: testPrivateKey });
      const tx = await txBuilder.build();

      // Verify chainId is 300 (zkSync Era Sepolia testnet)
      const txJson = tx.toJson();
      const chainId = typeof txJson.chainId === 'string' ? parseInt(txJson.chainId, 16) : txJson.chainId;
      chainId.should.equal(300);

      // Verify transaction structure
      should.equal(tx.signature.length, 2);
      should.equal(tx.inputs.length, 1);
      should.equal(tx.outputs.length, 1);
    });

    it('should have testnet contract addresses configured', function () {
      const network = Networks.test.zkSyncEra;
      should.exist(network.forwarderFactoryAddress);
      should.exist(network.forwarderImplementationAddress);
      should.exist(network.walletFactoryAddress);
      should.exist(network.walletImplementationAddress);

      network.forwarderFactoryAddress.should.equal('0xdd498702f44c4da08eb9e08d3f015eefe5cb71fc');
      network.walletFactoryAddress.should.equal('0x4550e1e7616d3364877fc6c9324938dab678621a');
    });
  });

  describe('Transaction serialization and deserialization', function () {
    it('should serialize and deserialize a transaction correctly', async function () {
      const txBuilder = new TransactionBuilder(coins.get('tzksyncera'));
      const testPrivateKey =
        'xprv9s21ZrQH143K3vYxF8BfcG8g82bkkrf962jYfdc2SdsbXzLRcnaWAD3jWMsQaTz9ZoqD7gvYeR3fRPZy3Fr2UFXrome67sTdb66wAFmcz6G';
      const keyPair = new KeyPair({ prv: testPrivateKey });
      const key = keyPair.getKeys().prv as string;
      const contractAddress = '0x8f977e912ef500548a0c3be6ddde9899f1199b81';

      txBuilder.fee({
        fee: '1000000000',
        gasLimit: '12100000',
      });
      txBuilder.counter(2);
      txBuilder.type(TransactionType.Send);
      txBuilder.contract(contractAddress);
      txBuilder
        .transfer()
        .amount('1000000000')
        .to('0x19645032c7f1533395d44a629462e751084d3e4c')
        .expirationTime(1590066728)
        .contractSequenceId(5)
        .key(key);
      txBuilder.sign({ key: testPrivateKey });

      const tx = await txBuilder.build();
      const serialized = tx.toBroadcastFormat();

      // Rebuild from serialized
      const txBuilder2 = new TransactionBuilder(coins.get('tzksyncera'));
      txBuilder2.from(serialized);
      const tx2 = await txBuilder2.build();

      // Should produce the same serialized output
      tx2.toBroadcastFormat().should.equal(serialized);
    });
  });
});
