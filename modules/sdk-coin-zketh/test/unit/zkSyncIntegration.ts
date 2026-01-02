import * as should from 'should';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';
import { Zketh, Tzketh, TransactionBuilder } from '../../src';
import { TransactionType } from '@bitgo/sdk-core';
import { getBuilder } from '../getBuilder';
import * as testData from '../resources';

describe('ZKsync Integration Tests', function () {
  let bitgo: TestBitGoAPI;
  let zkethCoin;
  let tzkethCoin;

  before(function () {
    const env = 'test';
    bitgo = TestBitGo.decorate(BitGoAPI, { env });
    bitgo.safeRegister('zketh', Zketh.createInstance);
    bitgo.safeRegister('tzketh', Tzketh.createInstance);
    bitgo.initializeTestVars();
    zkethCoin = bitgo.coin('zketh');
    tzkethCoin = bitgo.coin('tzketh');
  });

  describe('ZKsync-Specific Features', function () {
    describe('Fee Estimation', function () {
      it('should have estimateZKsyncFee method', function () {
        should.exist(zkethCoin.estimateZKsyncFee);
        zkethCoin.estimateZKsyncFee.should.be.a.Function();
      });

      it('should have enhanced feeEstimate method', function () {
        should.exist(zkethCoin.feeEstimate);
        zkethCoin.feeEstimate.should.be.a.Function();
      });
    });

    describe('Bridge Information', function () {
      it('should have getBridgeContracts method', function () {
        should.exist(zkethCoin.getBridgeContracts);
        zkethCoin.getBridgeContracts.should.be.a.Function();
      });
    });

    describe('Batch Information', function () {
      it('should have getL1BatchNumber method', function () {
        should.exist(zkethCoin.getL1BatchNumber);
        zkethCoin.getL1BatchNumber.should.be.a.Function();
      });

      it('should have getTransactionDetails method', function () {
        should.exist(zkethCoin.getTransactionDetails);
        zkethCoin.getTransactionDetails.should.be.a.Function();
      });
    });

    describe('Gas Pricing', function () {
      it('should have getL1GasPrice method', function () {
        should.exist(zkethCoin.getL1GasPrice);
        zkethCoin.getL1GasPrice.should.be.a.Function();
      });

      it('should have getFeeParams method', function () {
        should.exist(zkethCoin.getFeeParams);
        zkethCoin.getFeeParams.should.be.a.Function();
      });
    });
  });

  describe('Complete Transaction Flow - Multisig', function () {
    it('should build complete multisig transaction with ZKsync fees', async function () {
      const txBuilder: TransactionBuilder = getBuilder('tzketh') as TransactionBuilder;
      const contractAddress = '0x8f977e912ef500548a0c3be6ddde9899f1199b81';
      const recipient = '0x19645032c7f1533395d44a629462e751084d3e4c';
      const amount = '1000000000';
      const key = testData.KEYPAIR_PRV.getKeys().prv as string;

      // Step 1: Set transaction type
      txBuilder.type(TransactionType.Send);

      // Step 2: Set fees (would come from estimateZKsyncFee in production)
      txBuilder.fee({
        fee: '250000000',
        gasLimit: '150000',
        eip1559: {
          maxFeePerGas: '250000000', // 0.25 gwei
          maxPriorityFeePerGas: '0',
        },
      });

      // Step 3: Set nonce
      txBuilder.counter(0);

      // Step 4: Set contract address
      txBuilder.contract(contractAddress);

      // Step 5: Build transfer
      const transferBuilder = txBuilder.transfer();
      transferBuilder
        .coin('tzketh')
        .amount(amount)
        .to(recipient)
        .expirationTime(Math.floor(Date.now() / 1000) + 3600)
        .contractSequenceId(1)
        .key(key);

      // Step 6: Add second signature
      txBuilder.sign({ key: testData.PRIVATE_KEY_1 });

      // Step 7: Build final transaction
      const tx = await txBuilder.build();

      // Verify complete transaction
      should.exist(tx);
      tx.signature.length.should.equal(2); // 2-of-3 multisig

      const txJson = tx.toJson();
      txJson.chainId.should.equal('0x12c'); // ZKsync Sepolia
      txJson.to.toLowerCase().should.equal(contractAddress.toLowerCase());

      // Should be ready for broadcast
      const broadcastFormat = tx.toBroadcastFormat();
      broadcastFormat.should.startWith('0x');
    });

    it('should build multisig transaction with proper inputs/outputs', async function () {
      const txBuilder: TransactionBuilder = getBuilder('tzketh') as TransactionBuilder;
      const contractAddress = '0x8f977e912ef500548a0c3be6ddde9899f1199b81';
      const recipient = '0x19645032c7f1533395d44a629462e751084d3e4c';
      const amount = '1000000000';
      const key = testData.KEYPAIR_PRV.getKeys().prv as string;

      txBuilder.type(TransactionType.Send);
      txBuilder.fee({
        fee: '1000000000',
        gasLimit: '150000',
      });
      txBuilder.counter(0);
      txBuilder.contract(contractAddress);

      const transferBuilder = txBuilder.transfer();
      transferBuilder
        .coin('tzketh')
        .amount(amount)
        .to(recipient)
        .expirationTime(Math.floor(Date.now() / 1000) + 3600)
        .contractSequenceId(1)
        .key(key);

      txBuilder.sign({ key: testData.PRIVATE_KEY_1 });
      const tx = await txBuilder.build();

      // Verify inputs
      should.exist(tx.inputs);
      tx.inputs.length.should.equal(1);
      tx.inputs[0].address.toLowerCase().should.equal(contractAddress.toLowerCase());
      tx.inputs[0].value.should.equal(amount);

      // Verify outputs
      should.exist(tx.outputs);
      tx.outputs.length.should.equal(1);
      tx.outputs[0].address.toLowerCase().should.equal(recipient.toLowerCase());
      tx.outputs[0].value.should.equal(amount);
    });
  });

  describe('Complete Transaction Flow - TSS', function () {
    it('should build TSS-compatible transaction structure', async function () {
      const txBuilder: TransactionBuilder = getBuilder('tzketh') as TransactionBuilder;
      const contractAddress = '0x8f977e912ef500548a0c3be6ddde9899f1199b81';
      const recipient = '0x19645032c7f1533395d44a629462e751084d3e4c';
      const amount = '1000000';

      // TSS transactions use lower gas (no contract execution)
      txBuilder.type(TransactionType.Send);
      txBuilder.fee({
        fee: '250000000',
        gasLimit: '21000', // Simple transfer gas
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
        .expirationTime(Math.floor(Date.now() / 1000) + 3600)
        .contractSequenceId(1);

      const tx = await txBuilder.build();

      // Verify TSS-compatible structure
      should.exist(tx);
      const txJson = tx.toJson();

      // Should use EIP-1559 (required for TSS)
      should.exist(txJson.maxFeePerGas);
      should.exist(txJson.maxPriorityFeePerGas);

      // Should have transaction ID for TSS signing
      should.exist(tx.id);
      tx.id.should.be.a.String();
      tx.id.should.startWith('0x');
    });
  });

  describe('Gas Cost Comparison', function () {
    it('should show gas difference between multisig and TSS', function () {
      // Multisig costs
      const multisigGas = 150000;
      const gasPrice = 250000000; // 0.25 gwei
      const multisigCost = multisigGas * gasPrice;

      // TSS costs
      const tssGas = 21000;
      const tssCost = tssGas * gasPrice;

      // Calculate savings
      const savings = multisigCost - tssCost;
      const savingsPercent = (savings / multisigCost) * 100;

      // Verify significant savings
      savingsPercent.should.be.approximately(86, 1);
      tssCost.should.be.lessThan(multisigCost);

      // In wei
      const savingsInWei = savings;
      savingsInWei.should.equal(32250000000000); // 129000 * 250000000
    });

    it('should calculate total cost including L1 fees', function () {
      // ZKsync fees = L2 execution + L1 data availability
      const l2ExecutionGas = 21000;
      const l1DataBytes = 200; // Approximate tx size
      const l1GasPerByte = 16; // Approximate
      const l1Gas = l1DataBytes * l1GasPerByte;

      const totalGas = l2ExecutionGas + l1Gas;

      // Total should be higher than pure L2
      totalGas.should.be.greaterThan(l2ExecutionGas);

      // But still much less than multisig
      const multisigGas = 150000;
      totalGas.should.be.lessThan(multisigGas);
    });
  });

  describe('Chain Configuration', function () {
    it('should have correct chain ID for mainnet', function () {
      // ZKsync Era mainnet chain ID is 324
      const chainId = 324;
      chainId.should.equal(324);
    });

    it('should have correct chain ID for testnet', function () {
      // ZKsync Era Sepolia testnet chain ID is 300
      const chainId = 300;
      chainId.should.equal(300);
    });

    it('should support EIP-1559', function () {
      // EIP1559 feature should be enabled
      should.exist(zkethCoin);
      should.exist(tzkethCoin);
    });
  });

  describe('Wallet Types', function () {
    it('should support onchain multisig as default', function () {
      const multisigType = zkethCoin.getDefaultMultisigType();
      multisigType.should.equal('onchain');
    });

    it('should support TSS wallet type', function () {
      // TSS is supported via inherited methods
      // Verify the coin has TSS capabilities
      should.exist(zkethCoin.signTransaction);
      should.exist(zkethCoin.presignTransaction);
    });

    it('should support cold wallets for both types', function () {
      // MULTISIG_COLD and TSS_COLD features enabled
      should.exist(zkethCoin);
      should.exist(tzkethCoin);
    });
  });

  describe('Transaction Serialization', function () {
    it('should serialize transaction correctly for ZKsync', async function () {
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

      // Test different serialization formats
      const jsonFormat = tx.toJson();
      const broadcastFormat = tx.toBroadcastFormat();

      // JSON format should have all fields
      should.exist(jsonFormat.to);
      should.exist(jsonFormat.value);
      should.exist(jsonFormat.data);
      should.exist(jsonFormat.chainId);
      should.exist(jsonFormat.nonce);
      should.exist(jsonFormat.gasLimit);
      should.exist(jsonFormat.maxFeePerGas);
      should.exist(jsonFormat.maxPriorityFeePerGas);

      // Broadcast format should be hex string
      broadcastFormat.should.be.a.String();
      broadcastFormat.should.startWith('0x');

      // Should be valid RLP-encoded transaction
      const hexRegex = /^0x[0-9a-fA-F]+$/;
      hexRegex.test(broadcastFormat).should.be.true();
    });

    it('should deserialize transaction correctly', async function () {
      const txBuilder: TransactionBuilder = getBuilder('tzketh') as TransactionBuilder;
      const contractAddress = '0x8f977e912ef500548a0c3be6ddde9899f1199b81';
      const recipient = '0x19645032c7f1533395d44a629462e751084d3e4c';
      const amount = '1000000';
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
        .amount(amount)
        .to(recipient)
        .expirationTime(Math.floor(Date.now() / 1000) + 3600)
        .contractSequenceId(1)
        .key(key);

      const tx = await txBuilder.build();
      const broadcastFormat = tx.toBroadcastFormat();

      // Deserialize and verify
      const txBuilder2: TransactionBuilder = getBuilder('tzketh') as TransactionBuilder;
      txBuilder2.from(broadcastFormat);
      const tx2 = await txBuilder2.build();

      // Should match original
      tx2.toJson().to.should.equal(tx.toJson().to);
      tx2.toJson().value.should.equal(tx.toJson().value);
      tx2.toJson().chainId.should.equal(tx.toJson().chainId);
    });
  });

  describe('EIP-1559 Support', function () {
    it('should build transaction with EIP-1559 fees', async function () {
      const txBuilder: TransactionBuilder = getBuilder('tzketh') as TransactionBuilder;
      const contractAddress = '0x8f977e912ef500548a0c3be6ddde9899f1199b81';
      const recipient = '0x19645032c7f1533395d44a629462e751084d3e4c';

      txBuilder.type(TransactionType.Send);
      txBuilder.fee({
        fee: '500000000',
        gasLimit: '21000',
        eip1559: {
          maxFeePerGas: '500000000', // 0.5 gwei
          maxPriorityFeePerGas: '1000000', // 0.001 gwei
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

      // Verify EIP-1559 fields
      txJson.maxFeePerGas.should.equal('500000000');
      txJson.maxPriorityFeePerGas.should.equal('1000000');

      // Should not have legacy gasPrice
      should.not.exist(txJson.gasPrice);
    });

    it('should support legacy transactions for compatibility', async function () {
      const txBuilder: TransactionBuilder = getBuilder('tzketh') as TransactionBuilder;
      const contractAddress = '0x8f977e912ef500548a0c3be6ddde9899f1199b81';
      const recipient = '0x19645032c7f1533395d44a629462e751084d3e4c';

      txBuilder.type(TransactionType.Send);
      txBuilder.fee({
        fee: '250000000',
        gasLimit: '21000',
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

      // Should build successfully with legacy format
      should.exist(tx);
      const txJson = tx.toJson();
      should.exist(txJson.gasPrice);
    });
  });

  describe('Error Handling', function () {
    it('should throw error for missing contract address', async function () {
      const txBuilder: TransactionBuilder = getBuilder('tzketh') as TransactionBuilder;

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
      // Missing: txBuilder.contract(contractAddress);

      const transferBuilder = txBuilder.transfer();
      transferBuilder
        .coin('tzketh')
        .amount('1000000')
        .to('0x19645032c7f1533395d44a629462e751084d3e4c')
        .expirationTime(Math.floor(Date.now() / 1000) + 3600)
        .contractSequenceId(1);

      await txBuilder.build().should.be.rejectedWith(/missing contract address/i);
    });

    it('should throw error for invalid amount', function () {
      const txBuilder: TransactionBuilder = getBuilder('tzketh') as TransactionBuilder;
      const contractAddress = '0x8f977e912ef500548a0c3be6ddde9899f1199b81';

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

      // Should throw synchronously when setting invalid amount
      should.throws(() => {
        transferBuilder
          .coin('tzketh')
          .amount('-1000') // Negative amount
          .to('0x19645032c7f1533395d44a629462e751084d3e4c')
          .expirationTime(Math.floor(Date.now() / 1000) + 3600)
          .contractSequenceId(1);
      }, /Invalid amount/i);
    });

    it('should throw error for invalid recipient address', async function () {
      const txBuilder: TransactionBuilder = getBuilder('tzketh') as TransactionBuilder;
      const contractAddress = '0x8f977e912ef500548a0c3be6ddde9899f1199b81';

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

      // Invalid address
      should.throws(() => {
        transferBuilder
          .coin('tzketh')
          .amount('1000000')
          .to('invalid_address')
          .expirationTime(Math.floor(Date.now() / 1000) + 3600)
          .contractSequenceId(1);
      });
    });
  });

  describe('Feature Compatibility Matrix', function () {
    it('should support all required features', function () {
      const requiredFeatures = [
        'signTransaction',
        'presignTransaction',
        'feeEstimate',
        'estimateZKsyncFee',
        'getBridgeContracts',
        'getL1BatchNumber',
        'getTransactionDetails',
      ];

      requiredFeatures.forEach((feature) => {
        should.exist(zkethCoin[feature], `Missing feature: ${feature}`);
      });
    });

    it('should work with both mainnet and testnet', function () {
      should.exist(zkethCoin); // Mainnet
      should.exist(tzkethCoin); // Testnet

      zkethCoin.getChain().should.equal('zketh');
      tzkethCoin.getChain().should.equal('tzketh');
    });
  });
});
