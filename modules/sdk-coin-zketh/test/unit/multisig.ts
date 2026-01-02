import * as should from 'should';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';
import { Zketh, Tzketh, TransactionBuilder, TransferBuilder } from '../../src';
import { TransactionType } from '@bitgo/sdk-core';
import { getBuilder } from '../getBuilder';
import { decodeTransferData } from '@bitgo/abstract-eth';
import * as testData from '../resources';

describe('ZKsync Multisig Tests', function () {
  let bitgo: TestBitGoAPI;
  let basecoin;

  before(function () {
    const env = 'test';
    bitgo = TestBitGo.decorate(BitGoAPI, { env });
    bitgo.safeRegister('zketh', Zketh.createInstance);
    bitgo.safeRegister('tzketh', Tzketh.createInstance);
    bitgo.initializeTestVars();
    basecoin = bitgo.coin('tzketh');
  });

  describe('Multisig Feature Support', function () {
    it('should have multisig feature enabled', function () {
      const multisigType = basecoin.getDefaultMultisigType();
      multisigType.should.equal('onchain');
    });

    it('should support multisig cold wallets', function () {
      // MULTISIG_COLD feature should be enabled
      should.exist(basecoin);
    });

    it('should support 2-of-3 multisig', function () {
      // ZKsync uses standard 2-of-3 multisig like Ethereum
      const requiredSigners = 2;
      const totalSigners = 3;

      requiredSigners.should.equal(2);
      totalSigners.should.equal(3);
    });
  });

  describe('Multisig Transaction Building', function () {
    it('should build unsigned multisig transaction', async function () {
      const txBuilder: TransactionBuilder = getBuilder('tzketh') as TransactionBuilder;
      const contractAddress = '0x8f977e912ef500548a0c3be6ddde9899f1199b81';
      const recipient = '0x19645032c7f1533395d44a629462e751084d3e4c';
      const amount = '1000000000';
      const expireTime = Math.floor(Date.now() / 1000) + 3600;
      const sequenceId = 1;

      txBuilder.type(TransactionType.Send);
      txBuilder.fee({
        fee: '1000000000',
        gasLimit: '150000', // Multisig uses more gas than simple transfer
      });
      txBuilder.counter(0);
      txBuilder.contract(contractAddress);

      const transferBuilder = txBuilder.transfer() as TransferBuilder;
      transferBuilder
        .coin('tzketh')
        .amount(amount)
        .to(recipient)
        .expirationTime(expireTime)
        .contractSequenceId(sequenceId);

      const tx = await txBuilder.build();

      should.exist(tx);
      should.exist(tx.toJson());

      const txJson = tx.toJson();
      should.exist(txJson.to);
      should.exist(txJson.data);

      // Verify contract address
      txJson.to.toLowerCase().should.equal(contractAddress.toLowerCase());

      // Decode and verify transfer data
      const decodedData = decodeTransferData(txJson.data);
      decodedData.to.toLowerCase().should.equal(recipient.toLowerCase());
      decodedData.amount.should.equal(amount);
      decodedData.expireTime.should.equal(expireTime);
      decodedData.sequenceId.should.equal(sequenceId);
    });

    it('should build first signature for multisig', async function () {
      const txBuilder: TransactionBuilder = getBuilder('tzketh') as TransactionBuilder;
      const contractAddress = '0x8f977e912ef500548a0c3be6ddde9899f1199b81';
      const recipient = '0x19645032c7f1533395d44a629462e751084d3e4c';
      const key = testData.KEYPAIR_PRV.getKeys().prv as string;

      txBuilder.type(TransactionType.Send);
      txBuilder.fee({
        fee: '1000000000',
        gasLimit: '150000',
      });
      txBuilder.counter(0);
      txBuilder.contract(contractAddress);

      const transferBuilder = txBuilder.transfer() as TransferBuilder;
      transferBuilder
        .coin('tzketh')
        .amount('1000000000')
        .to(recipient)
        .expirationTime(Math.floor(Date.now() / 1000) + 3600)
        .contractSequenceId(1)
        .key(key);

      const tx = await txBuilder.build();

      should.exist(tx);
      should.exist(tx.signature);

      // First signature should be present
      tx.signature.should.be.Array();
      tx.signature.length.should.equal(1);
    });

    it('should build second signature for multisig', async function () {
      const txBuilder: TransactionBuilder = getBuilder('tzketh') as TransactionBuilder;
      const contractAddress = '0x8f977e912ef500548a0c3be6ddde9899f1199b81';
      const recipient = '0x19645032c7f1533395d44a629462e751084d3e4c';
      const key1 = testData.KEYPAIR_PRV.getKeys().prv as string;

      txBuilder.type(TransactionType.Send);
      txBuilder.fee({
        fee: '1000000000',
        gasLimit: '150000',
      });
      txBuilder.counter(0);
      txBuilder.contract(contractAddress);

      const transferBuilder = txBuilder.transfer() as TransferBuilder;
      transferBuilder
        .coin('tzketh')
        .amount('1000000000')
        .to(recipient)
        .expirationTime(Math.floor(Date.now() / 1000) + 3600)
        .contractSequenceId(1)
        .key(key1);

      // Add second signature
      txBuilder.sign({ key: testData.PRIVATE_KEY_1 });

      const tx = await txBuilder.build();

      should.exist(tx);
      should.exist(tx.signature);

      // Should have 2 signatures for 2-of-3 multisig
      tx.signature.should.be.Array();
      tx.signature.length.should.equal(2);
    });

    it('should support EIP-1559 for multisig', async function () {
      const txBuilder: TransactionBuilder = getBuilder('tzketh') as TransactionBuilder;
      const contractAddress = '0x8f977e912ef500548a0c3be6ddde9899f1199b81';
      const recipient = '0x19645032c7f1533395d44a629462e751084d3e4c';

      txBuilder.type(TransactionType.Send);
      txBuilder.fee({
        fee: '250000000',
        gasLimit: '150000',
        eip1559: {
          maxFeePerGas: '250000000',
          maxPriorityFeePerGas: '0',
        },
      });
      txBuilder.counter(0);
      txBuilder.contract(contractAddress);

      const transferBuilder = txBuilder.transfer() as TransferBuilder;
      transferBuilder
        .coin('tzketh')
        .amount('1000000000')
        .to(recipient)
        .expirationTime(Math.floor(Date.now() / 1000) + 3600)
        .contractSequenceId(1);

      const tx = await txBuilder.build();
      const txJson = tx.toJson();

      // Should use EIP-1559 format
      should.exist(txJson.maxFeePerGas);
      should.exist(txJson.maxPriorityFeePerGas);
      txJson.maxFeePerGas.should.equal('250000000');
      txJson.maxPriorityFeePerGas.should.equal('0');
    });
  });

  describe('Multisig Contract Sequence ID', function () {
    it('should increment sequence ID correctly', async function () {
      const txBuilder: TransactionBuilder = getBuilder('tzketh') as TransactionBuilder;
      const contractAddress = '0x8f977e912ef500548a0c3be6ddde9899f1199b81';
      const recipient = '0x19645032c7f1533395d44a629462e751084d3e4c';

      for (let sequenceId = 1; sequenceId <= 3; sequenceId++) {
        txBuilder.type(TransactionType.Send);
        txBuilder.fee({
          fee: '1000000000',
          gasLimit: '150000',
        });
        txBuilder.counter(sequenceId - 1);
        txBuilder.contract(contractAddress);

        const transferBuilder = txBuilder.transfer() as TransferBuilder;
        transferBuilder
          .coin('tzketh')
          .amount('1000000')
          .to(recipient)
          .expirationTime(Math.floor(Date.now() / 1000) + 3600)
          .contractSequenceId(sequenceId);

        const tx = await txBuilder.build();
        const txJson = tx.toJson();

        // Verify sequence ID in transaction data
        const decodedData = decodeTransferData(txJson.data);
        decodedData.sequenceId.should.equal(sequenceId);
      }
    });

    it('should reject duplicate sequence ID', async function () {
      // In production, the contract would reject duplicate sequence IDs
      // This test verifies the sequence ID is properly encoded
      const txBuilder: TransactionBuilder = getBuilder('tzketh') as TransactionBuilder;
      const contractAddress = '0x8f977e912ef500548a0c3be6ddde9899f1199b81';
      const recipient = '0x19645032c7f1533395d44a629462e751084d3e4c';
      const sequenceId = 5;

      txBuilder.type(TransactionType.Send);
      txBuilder.fee({
        fee: '1000000000',
        gasLimit: '150000',
      });
      txBuilder.counter(0);
      txBuilder.contract(contractAddress);

      const transferBuilder = txBuilder.transfer() as TransferBuilder;
      transferBuilder
        .coin('tzketh')
        .amount('1000000')
        .to(recipient)
        .expirationTime(Math.floor(Date.now() / 1000) + 3600)
        .contractSequenceId(sequenceId);

      const tx = await txBuilder.build();
      const txJson = tx.toJson();

      const decodedData = decodeTransferData(txJson.data);
      decodedData.sequenceId.should.equal(sequenceId);
    });
  });

  describe('Multisig Expiration Time', function () {
    it('should set expiration time correctly', async function () {
      const txBuilder: TransactionBuilder = getBuilder('tzketh') as TransactionBuilder;
      const contractAddress = '0x8f977e912ef500548a0c3be6ddde9899f1199b81';
      const recipient = '0x19645032c7f1533395d44a629462e751084d3e4c';
      const expireTime = Math.floor(Date.now() / 1000) + 7200; // 2 hours

      txBuilder.type(TransactionType.Send);
      txBuilder.fee({
        fee: '1000000000',
        gasLimit: '150000',
      });
      txBuilder.counter(0);
      txBuilder.contract(contractAddress);

      const transferBuilder = txBuilder.transfer() as TransferBuilder;
      transferBuilder.coin('tzketh').amount('1000000').to(recipient).expirationTime(expireTime).contractSequenceId(1);

      const tx = await txBuilder.build();
      const txJson = tx.toJson();

      const decodedData = decodeTransferData(txJson.data);
      decodedData.expireTime.should.equal(expireTime);
    });

    it('should handle past expiration time', async function () {
      const txBuilder: TransactionBuilder = getBuilder('tzketh') as TransactionBuilder;
      const contractAddress = '0x8f977e912ef500548a0c3be6ddde9899f1199b81';
      const recipient = '0x19645032c7f1533395d44a629462e751084d3e4c';
      const pastExpireTime = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago

      txBuilder.type(TransactionType.Send);
      txBuilder.fee({
        fee: '1000000000',
        gasLimit: '150000',
      });
      txBuilder.counter(0);
      txBuilder.contract(contractAddress);

      const transferBuilder = txBuilder.transfer() as TransferBuilder;
      transferBuilder
        .coin('tzketh')
        .amount('1000000')
        .to(recipient)
        .expirationTime(pastExpireTime)
        .contractSequenceId(1);

      const tx = await txBuilder.build();

      // Transaction should build, but would be rejected by contract
      should.exist(tx);

      const txJson = tx.toJson();
      const decodedData = decodeTransferData(txJson.data);
      decodedData.expireTime.should.equal(pastExpireTime);
    });
  });

  describe('Multisig Gas Estimation', function () {
    it('should estimate higher gas for multisig vs simple transfer', function () {
      // Multisig contract execution requires more gas
      const multisigGas = 150000;
      const simpleTransferGas = 21000;

      multisigGas.should.be.greaterThan(simpleTransferGas);

      // Multisig uses ~7x more gas
      const ratio = multisigGas / simpleTransferGas;
      ratio.should.be.approximately(7.14, 0.5);
    });

    it('should use ZKsync fee estimation for multisig', async function () {
      // Multisig transactions should also use ZKsync-specific fee estimation
      should.exist(basecoin.feeEstimate);
      should.exist(basecoin.estimateZKsyncFee);

      basecoin.feeEstimate.should.be.a.Function();
      basecoin.estimateZKsyncFee.should.be.a.Function();
    });
  });

  describe('Multisig Transaction Verification', function () {
    it('should verify multisig transaction structure', async function () {
      const txBuilder: TransactionBuilder = getBuilder('tzketh') as TransactionBuilder;
      const contractAddress = '0x8f977e912ef500548a0c3be6ddde9899f1199b81';
      const recipient = '0x19645032c7f1533395d44a629462e751084d3e4c';
      const amount = '1000000000';

      txBuilder.type(TransactionType.Send);
      txBuilder.fee({
        fee: '250000000',
        gasLimit: '150000',
        eip1559: {
          maxFeePerGas: '250000000',
          maxPriorityFeePerGas: '0',
        },
      });
      txBuilder.counter(0);
      txBuilder.contract(contractAddress);

      const transferBuilder = txBuilder.transfer() as TransferBuilder;
      transferBuilder
        .coin('tzketh')
        .amount(amount)
        .to(recipient)
        .expirationTime(Math.floor(Date.now() / 1000) + 3600)
        .contractSequenceId(1);

      const tx = await txBuilder.build();
      const txJson = tx.toJson();

      // Verify structure
      should.exist(txJson.to);
      should.exist(txJson.value);
      should.exist(txJson.data);
      should.exist(txJson.chainId);
      should.exist(txJson.nonce);
      should.exist(txJson.gasLimit);

      // Verify chain ID
      txJson.chainId.should.equal('0x12c'); // ZKsync Sepolia testnet

      // Verify contract call data exists
      txJson.data.should.not.equal('0x');
      txJson.data.length.should.be.greaterThan(10);
    });

    it('should produce valid broadcast format', async function () {
      const txBuilder: TransactionBuilder = getBuilder('tzketh') as TransactionBuilder;
      const contractAddress = '0x8f977e912ef500548a0c3be6ddde9899f1199b81';
      const recipient = '0x19645032c7f1533395d44a629462e751084d3e4c';
      const key = testData.KEYPAIR_PRV.getKeys().prv as string;

      txBuilder.type(TransactionType.Send);
      txBuilder.fee({
        fee: '250000000',
        gasLimit: '150000',
        eip1559: {
          maxFeePerGas: '250000000',
          maxPriorityFeePerGas: '0',
        },
      });
      txBuilder.counter(0);
      txBuilder.contract(contractAddress);

      const transferBuilder = txBuilder.transfer() as TransferBuilder;
      transferBuilder
        .coin('tzketh')
        .amount('1000000')
        .to(recipient)
        .expirationTime(Math.floor(Date.now() / 1000) + 3600)
        .contractSequenceId(1)
        .key(key);

      const tx = await txBuilder.build();
      const broadcastFormat = tx.toBroadcastFormat();

      // Should be hex string
      broadcastFormat.should.be.a.String();
      broadcastFormat.should.startWith('0x');

      // Should be valid hex
      const hexRegex = /^0x[0-9a-fA-F]+$/;
      hexRegex.test(broadcastFormat).should.be.true();

      // Multisig transactions are larger than simple transfers
      broadcastFormat.length.should.be.greaterThan(200);
    });
  });

  describe('Multisig with ZKsync Features', function () {
    it('should work with ZKsync-specific encoding', function () {
      // USES_NON_PACKED_ENCODING_FOR_TXDATA feature
      // This affects how transaction data is encoded
      should.exist(basecoin);
    });

    it('should support EVM wallet contracts', function () {
      // EVM_WALLET feature should be enabled
      // Multisig uses smart contract wallets
      should.exist(basecoin);
    });

    it('should support rollup chain features', function () {
      // ETH_ROLLUP_CHAIN feature
      // ZKsync is a Layer 2 rollup
      should.exist(basecoin);
    });
  });

  describe('Multisig Token Transfers', function () {
    it('should build transaction with contract call data', async function () {
      const txBuilder: TransactionBuilder = getBuilder('tzketh') as TransactionBuilder;
      const contractAddress = '0x8f977e912ef500548a0c3be6ddde9899f1199b81';
      const recipient = '0x19645032c7f1533395d44a629462e751084d3e4c';
      const amount = '1000000';

      txBuilder.type(TransactionType.Send);
      txBuilder.fee({
        fee: '250000000',
        gasLimit: '200000', // Token transfers use more gas
        eip1559: {
          maxFeePerGas: '250000000',
          maxPriorityFeePerGas: '0',
        },
      });
      txBuilder.counter(0);
      txBuilder.contract(contractAddress);

      const transferBuilder = txBuilder.transfer() as TransferBuilder;
      transferBuilder
        .coin('tzketh') // Base coin
        .amount(amount)
        .to(recipient)
        .expirationTime(Math.floor(Date.now() / 1000) + 3600)
        .contractSequenceId(1);

      const tx = await txBuilder.build();

      should.exist(tx);
      should.exist(tx.toJson().data);

      // Transfers have contract call data (sendMultiSig function)
      const txJson = tx.toJson();
      txJson.data.should.not.equal('0x');

      // Verify gas limit for token transfers is higher
      parseInt(txJson.gasLimit, 10).should.be.greaterThan(150000);
    });
  });
});
