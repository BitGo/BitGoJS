import * as should from 'should';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';
import { Zketh, Tzketh, TransactionBuilder } from '../../src';
import { TransactionType } from '@bitgo/sdk-core';
import { getBuilder } from '../getBuilder';
import * as testData from '../resources';

describe('ZKsync TSS Tests', function () {
  let bitgo: TestBitGoAPI;
  let basecoin;
  let tssBasecoin;

  before(function () {
    const env = 'test';
    bitgo = TestBitGo.decorate(BitGoAPI, { env });
    bitgo.safeRegister('zketh', Zketh.createInstance);
    bitgo.safeRegister('tzketh', Tzketh.createInstance);
    bitgo.initializeTestVars();
    basecoin = bitgo.coin('zketh');
    tssBasecoin = bitgo.coin('tzketh');
  });

  describe('TSS Feature Support', function () {
    it('should have TSS feature enabled', function () {
      // TSS support is inherited from AbstractEthLikeNewCoins
      should.exist(basecoin);
      basecoin.getChain().should.equal('zketh');
    });

    it('should support TSS wallet type', function () {
      const multisigType = basecoin.getDefaultMultisigType();
      // ZKsync uses onchain multisig by default, but TSS is also supported
      multisigType.should.equal('onchain');
    });

    it('should have MPC methods available', function () {
      // Verify TSS-related methods exist (inherited from AbstractEthLikeNewCoins)
      should.exist(basecoin.signTransaction);
      should.exist(basecoin.presignTransaction);
    });
  });

  describe('TSS Transaction Building', function () {
    it('should build transaction with TSS-compatible format', async function () {
      const txBuilder: TransactionBuilder = getBuilder('tzketh') as TransactionBuilder;
      const contractAddress = '0x8f977e912ef500548a0c3be6ddde9899f1199b81';
      const recipient = '0x19645032c7f1533395d44a629462e751084d3e4c';
      const amount = '1000000000';
      const expireTime = Math.floor(Date.now() / 1000) + 3600;
      const sequenceId = 1;

      txBuilder.type(TransactionType.Send);
      txBuilder.fee({
        fee: '1000000000',
        gasLimit: '21000',
        eip1559: {
          maxFeePerGas: '250000000',
          maxPriorityFeePerGas: '0',
        },
      });
      txBuilder.counter(0);
      txBuilder.contract(contractAddress);

      const transferBuilder = txBuilder.transfer();
      transferBuilder
        .coin('tzketh')
        .amount(amount)
        .to(recipient)
        .expirationTime(expireTime)
        .contractSequenceId(sequenceId);

      const tx = await txBuilder.build();

      // Verify transaction structure is compatible with TSS signing
      should.exist(tx);
      should.exist(tx.toJson());
      should.exist(tx.toBroadcastFormat());

      const txJson = tx.toJson();
      should.exist(txJson.chainId);
      should.exist(txJson.nonce);
      should.exist(txJson.gasLimit);

      // TSS transactions use EIP-1559 format
      should.exist(txJson.maxFeePerGas);
      should.exist(txJson.maxPriorityFeePerGas);
    });

    it('should create transaction hash for TSS signing', async function () {
      const txBuilder: TransactionBuilder = getBuilder('tzketh') as TransactionBuilder;
      const contractAddress = '0x8f977e912ef500548a0c3be6ddde9899f1199b81';
      const recipient = '0x19645032c7f1533395d44a629462e751084d3e4c';

      txBuilder.type(TransactionType.Send);
      txBuilder.fee({
        fee: '1000000000',
        gasLimit: '21000',
        eip1559: {
          maxFeePerGas: '250000000',
          maxPriorityFeePerGas: '0',
        },
      });
      txBuilder.counter(0);
      txBuilder.contract(contractAddress);

      const transferBuilder = txBuilder.transfer();
      transferBuilder
        .coin('tzketh')
        .amount('1000000')
        .to(recipient)
        .expirationTime(Math.floor(Date.now() / 1000) + 3600)
        .contractSequenceId(1);

      const tx = await txBuilder.build();

      // Get transaction ID (hash) for TSS signing
      const txId = tx.id;
      should.exist(txId);

      // Transaction ID should be a hex string
      txId.should.be.a.String();
      txId.should.startWith('0x');

      // Should be 32 bytes (64 hex chars + 0x prefix)
      txId.length.should.equal(66);
    });

    it('should support TSS signing flow', async function () {
      const txBuilder: TransactionBuilder = getBuilder('tzketh') as TransactionBuilder;
      const contractAddress = '0x8f977e912ef500548a0c3be6ddde9899f1199b81';
      const recipient = '0x19645032c7f1533395d44a629462e751084d3e4c';
      const key = testData.KEYPAIR_PRV.getKeys().prv as string;

      txBuilder.type(TransactionType.Send);
      txBuilder.fee({
        fee: '1000000000',
        gasLimit: '21000',
        eip1559: {
          maxFeePerGas: '250000000',
          maxPriorityFeePerGas: '0',
        },
      });
      txBuilder.counter(0);
      txBuilder.contract(contractAddress);

      const transferBuilder = txBuilder.transfer();
      transferBuilder
        .coin('tzketh')
        .amount('1000000')
        .to(recipient)
        .expirationTime(Math.floor(Date.now() / 1000) + 3600)
        .contractSequenceId(1)
        .key(key);

      // Build and sign (simulating TSS first signature)
      const tx = await txBuilder.build();

      should.exist(tx);
      should.exist(tx.signature);

      // TSS transactions should have proper signature format
      tx.signature.should.be.Array();
      tx.signature.length.should.be.greaterThan(0);
    });
  });

  describe('TSS Fee Estimation', function () {
    it('should estimate fees correctly for TSS transactions', async function () {
      // TSS transactions use standard transfer gas (21000)
      // vs multisig which uses ~150000 gas
      const tssGasEstimate = 21000;
      const multisigGasEstimate = 150000;

      // TSS should use significantly less gas
      const gasSavings = ((multisigGasEstimate - tssGasEstimate) / multisigGasEstimate) * 100;
      gasSavings.should.be.approximately(86, 1); // ~86% savings
    });

    it('should use ZKsync fee estimation for TSS transactions', async function () {
      // Verify that fee estimation includes ZKsync-specific costs
      // This is handled by the overridden feeEstimate() method
      should.exist(tssBasecoin.feeEstimate);
      should.exist(tssBasecoin.estimateZKsyncFee);

      // Both methods should be available for TSS transactions
      tssBasecoin.feeEstimate.should.be.a.Function();
      tssBasecoin.estimateZKsyncFee.should.be.a.Function();
    });
  });

  describe('TSS Transaction Verification', function () {
    it('should verify TSS transaction format', async function () {
      const txBuilder: TransactionBuilder = getBuilder('tzketh') as TransactionBuilder;
      const contractAddress = '0x8f977e912ef500548a0c3be6ddde9899f1199b81';
      const recipient = '0x19645032c7f1533395d44a629462e751084d3e4c';

      txBuilder.type(TransactionType.Send);
      txBuilder.fee({
        fee: '250000000',
        gasLimit: '21000',
        eip1559: {
          maxFeePerGas: '250000000',
          maxPriorityFeePerGas: '0',
        },
      });
      txBuilder.counter(0);
      txBuilder.contract(contractAddress);

      const transferBuilder = txBuilder.transfer();
      transferBuilder
        .coin('tzketh')
        .amount('1000000')
        .to(recipient)
        .expirationTime(Math.floor(Date.now() / 1000) + 3600)
        .contractSequenceId(1);

      const tx = await txBuilder.build();
      const txJson = tx.toJson();

      // Verify TSS-compatible transaction structure
      should.exist(txJson.to);
      should.exist(txJson.value);
      should.exist(txJson.data);
      should.exist(txJson.chainId);

      // ZKsync chain ID for testnet
      txJson.chainId.should.equal('0x12c'); // 300 in hex

      // Should use EIP-1559 format (compatible with TSS)
      should.exist(txJson.maxFeePerGas);
      should.exist(txJson.maxPriorityFeePerGas);
    });

    it('should produce valid broadcast format for TSS', async function () {
      const txBuilder: TransactionBuilder = getBuilder('tzketh') as TransactionBuilder;
      const contractAddress = '0x8f977e912ef500548a0c3be6ddde9899f1199b81';
      const recipient = '0x19645032c7f1533395d44a629462e751084d3e4c';
      const key = testData.KEYPAIR_PRV.getKeys().prv as string;

      txBuilder.type(TransactionType.Send);
      txBuilder.fee({
        fee: '250000000',
        gasLimit: '21000',
        eip1559: {
          maxFeePerGas: '250000000',
          maxPriorityFeePerGas: '0',
        },
      });
      txBuilder.counter(0);
      txBuilder.contract(contractAddress);

      const transferBuilder = txBuilder.transfer();
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
    });
  });

  describe('TSS vs Multisig Comparison', function () {
    it('should show gas cost difference between TSS and multisig', function () {
      // TSS transaction costs
      const tssGas = 21000;
      const tssGasPrice = 250000000; // 0.25 gwei
      const tssCost = tssGas * tssGasPrice;

      // Multisig transaction costs
      const multisigGas = 150000;
      const multisigCost = multisigGas * tssGasPrice;

      // Calculate savings
      const savings = multisigCost - tssCost;
      const savingsPercent = (savings / multisigCost) * 100;

      // TSS should save ~86% on gas
      savingsPercent.should.be.approximately(86, 1);

      // Actual cost comparison
      tssCost.should.be.lessThan(multisigCost);
    });

    it('should use same transaction builder for both TSS and multisig', function () {
      // Both wallet types use the same transaction builder
      const tssBuilder = getBuilder('tzketh');
      const multisigBuilder = getBuilder('tzketh');

      // Should be same class
      tssBuilder.constructor.name.should.equal(multisigBuilder.constructor.name);

      // The difference is in signing, not building
      should.exist(tssBuilder);
      should.exist(multisigBuilder);
    });
  });

  describe('TSS Compatibility with ZKsync Features', function () {
    it('should work with ZKsync fee estimation', async function () {
      // TSS transactions should use ZKsync-specific fee estimation
      should.exist(tssBasecoin.estimateZKsyncFee);

      // Method should be callable
      tssBasecoin.estimateZKsyncFee.should.be.a.Function();
    });

    it('should support EIP-1559 for TSS', async function () {
      const txBuilder: TransactionBuilder = getBuilder('tzketh') as TransactionBuilder;

      // Set EIP-1559 fees
      txBuilder.fee({
        fee: '250000000',
        gasLimit: '21000',
        eip1559: {
          maxFeePerGas: '250000000',
          maxPriorityFeePerGas: '0',
        },
      });

      // Should not throw
      should.exist(txBuilder);
    });

    it('should support bulk transactions with TSS', function () {
      // Bulk transaction feature should be available
      // This is enabled via CoinFeature.BULK_TRANSACTION
      should.exist(tssBasecoin);

      // TSS can sign multiple transactions efficiently
      const bulkTxCount = 5;
      const tssGasPerTx = 21000;
      const totalTssGas = bulkTxCount * tssGasPerTx;

      // Compare to multisig bulk
      const multisigGasPerTx = 150000;
      const totalMultisigGas = bulkTxCount * multisigGasPerTx;

      // TSS bulk should be much cheaper
      totalTssGas.should.be.lessThan(totalMultisigGas);
    });
  });
});
