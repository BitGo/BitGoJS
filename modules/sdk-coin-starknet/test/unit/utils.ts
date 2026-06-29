import utils, {
  encodeShortString,
  getSelectorFromName,
  compileExecuteCalldata,
  calculateInvokeTransactionHash,
  calculateDeployAccountTransactionHash,
} from '../../src/lib/utils';
import { coins } from '@bitgo/statics';
import { TransactionBuilderFactory } from '../../src/lib/transactionBuilderFactory';
import { Accounts, SandboxTransferData, KnownGoodInvokeTx } from '../resources/starknet';
import { MASK_128 } from '../../src/lib/constants';
import 'should';

describe('Starknet Utils', () => {
  describe('isValidAddress', () => {
    it('should accept a valid Starknet address', () => {
      utils.isValidAddress(Accounts.account1.address).should.equal(true);
    });

    it('should accept a second valid address', () => {
      utils.isValidAddress(Accounts.account2.address).should.equal(true);
    });

    it('should reject an invalid address', () => {
      utils.isValidAddress('not_an_address').should.equal(false);
    });

    it('should reject an empty string', () => {
      utils.isValidAddress('').should.equal(false);
    });

    it('should reject address without 0x prefix', () => {
      utils.isValidAddress('04a1f29b8b8e3d3c9f6c9b7a8d2e1f0c5b4a3d2e1f0c5b4a3d2e1f0c5b4a3d2e').should.equal(false);
    });
  });

  describe('isValidPublicKey', () => {
    it('should accept a valid uncompressed public key', () => {
      utils.isValidPublicKey(Accounts.account1.publicKey).should.equal(true);
    });

    it('should reject an invalid public key', () => {
      utils.isValidPublicKey('not_a_key').should.equal(false);
    });

    it('should reject an empty string', () => {
      utils.isValidPublicKey('').should.equal(false);
    });
  });

  describe('isValidPrivateKey', () => {
    it('should accept a valid private key', () => {
      utils.isValidPrivateKey(Accounts.account1.secretKey).should.equal(true);
    });

    it('should reject an invalid private key', () => {
      utils.isValidPrivateKey('not_a_key').should.equal(false);
    });

    it('should reject an empty string', () => {
      utils.isValidPrivateKey('').should.equal(false);
    });
  });

  describe('getUncompressedPublicKey', () => {
    it('should return 128 hex chars from uncompressed key', () => {
      const result = utils.getUncompressedPublicKey(Accounts.account1.publicKey);
      result.length.should.equal(128);
    });
  });

  describe('formatEthAccountSignature', () => {
    it('should format signature as 5 felt252 values', () => {
      const r = 'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
      const s = '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      const result = utils.formatEthAccountSignature(r, s, 0);
      result.length.should.equal(5);
      result.forEach((val) => val.should.startWith('0x'));
    });

    it('should handle recid 0 and 1', () => {
      const r = 'aaaa';
      const s = 'bbbb';
      const sig0 = utils.formatEthAccountSignature(r, s, 0);
      const sig1 = utils.formatEthAccountSignature(r, s, 1);
      sig0[4].should.equal('0x0');
      sig1[4].should.equal('0x1');
    });
  });

  describe('encodeShortString', () => {
    it('should encode "invoke" correctly', () => {
      encodeShortString('invoke').should.equal(0x696e766f6b65n);
    });

    it('should encode "L1_GAS" correctly', () => {
      encodeShortString('L1_GAS').should.equal(0x4c315f474153n);
    });

    it('should encode "L2_GAS" correctly', () => {
      encodeShortString('L2_GAS').should.equal(0x4c325f474153n);
    });

    it('should encode "L1_DATA" correctly', () => {
      encodeShortString('L1_DATA').should.equal(0x4c315f44415441n);
    });

    it('should reject strings longer than 31 chars', () => {
      (() => encodeShortString('a'.repeat(32))).should.throw(/too long/);
    });
  });

  describe('getSelectorFromName', () => {
    it('should compute selector for "transfer"', () => {
      const selector = getSelectorFromName('transfer');
      (typeof selector).should.equal('bigint');
      (selector > 0n).should.equal(true);
      (selector < 1n << 250n).should.equal(true);
    });

    it('should be deterministic', () => {
      getSelectorFromName('transfer').should.equal(getSelectorFromName('transfer'));
    });
  });

  describe('compileExecuteCalldata', () => {
    it('should compile a single transfer call', () => {
      const calls = [
        {
          contractAddress: SandboxTransferData.tokenContract,
          entrypoint: 'transfer',
          calldata: [
            SandboxTransferData.receiverAddress,
            '0x' + (BigInt(SandboxTransferData.amount) & MASK_128).toString(16),
            '0x' + (BigInt(SandboxTransferData.amount) >> 128n).toString(16),
          ],
        },
      ];
      const compiled = compileExecuteCalldata(calls);
      compiled[0].should.equal('0x1'); // num_calls = 1
      compiled[1].should.equal(SandboxTransferData.tokenContract); // to
      compiled.length.should.equal(1 + 1 + 1 + 1 + 3); // num_calls + to + selector + data_len + 3 calldata
    });
  });

  describe('calculateInvokeTransactionHash', () => {
    it('should produce a deterministic hash', () => {
      const calls = [
        {
          contractAddress: SandboxTransferData.tokenContract,
          entrypoint: 'transfer',
          calldata: [
            SandboxTransferData.receiverAddress,
            '0x' + (BigInt(SandboxTransferData.amount) & MASK_128).toString(16),
            '0x' + (BigInt(SandboxTransferData.amount) >> 128n).toString(16),
          ],
        },
      ];
      const compiledCalldata = compileExecuteCalldata(calls);

      const hash1 = calculateInvokeTransactionHash({
        senderAddress: SandboxTransferData.senderAddress,
        compiledCalldata,
        chainId: SandboxTransferData.chainId,
        nonce: '0x0',
        resourceBounds: SandboxTransferData.resourceBounds,
      });

      const hash2 = calculateInvokeTransactionHash({
        senderAddress: SandboxTransferData.senderAddress,
        compiledCalldata,
        chainId: SandboxTransferData.chainId,
        nonce: '0x0',
        resourceBounds: SandboxTransferData.resourceBounds,
      });

      hash1.should.equal(hash2);
      hash1.should.startWith('0x');
    });

    it('should produce different hashes for different nonces', () => {
      const calls = [
        {
          contractAddress: SandboxTransferData.tokenContract,
          entrypoint: 'transfer',
          calldata: [SandboxTransferData.receiverAddress, '0xde0b6b3a7640000', '0x0'],
        },
      ];
      const compiledCalldata = compileExecuteCalldata(calls);

      const hash1 = calculateInvokeTransactionHash({
        senderAddress: SandboxTransferData.senderAddress,
        compiledCalldata,
        chainId: SandboxTransferData.chainId,
        nonce: '0x0',
        resourceBounds: SandboxTransferData.resourceBounds,
      });

      const hash2 = calculateInvokeTransactionHash({
        senderAddress: SandboxTransferData.senderAddress,
        compiledCalldata,
        chainId: SandboxTransferData.chainId,
        nonce: '0x1',
        resourceBounds: SandboxTransferData.resourceBounds,
      });

      hash1.should.not.equal(hash2);
    });

    it('should not include proof_facts when absent', () => {
      const calls = [
        {
          contractAddress: SandboxTransferData.tokenContract,
          entrypoint: 'transfer',
          calldata: [SandboxTransferData.receiverAddress, '0xde0b6b3a7640000', '0x0'],
        },
      ];
      const compiledCalldata = compileExecuteCalldata(calls);

      const hashWithout = calculateInvokeTransactionHash({
        senderAddress: SandboxTransferData.senderAddress,
        compiledCalldata,
        chainId: SandboxTransferData.chainId,
        nonce: '0x0',
        resourceBounds: SandboxTransferData.resourceBounds,
      });

      const hashWithEmpty = calculateInvokeTransactionHash({
        senderAddress: SandboxTransferData.senderAddress,
        compiledCalldata,
        chainId: SandboxTransferData.chainId,
        nonce: '0x0',
        resourceBounds: SandboxTransferData.resourceBounds,
        proofFacts: [],
      });

      // Empty proofFacts should be omitted, producing same hash as absent
      hashWithout.should.equal(hashWithEmpty);
    });

    it('should match known-good sandbox tx hash (0x739a728...)', () => {
      const tv = KnownGoodInvokeTx;
      const amountBig = BigInt(tv.amount);
      const calls = [
        {
          contractAddress: tv.tokenContract,
          entrypoint: 'transfer',
          calldata: [
            tv.receiverAddress,
            '0x' + (amountBig & MASK_128).toString(16),
            '0x' + (amountBig >> 128n).toString(16),
          ],
        },
      ];
      const compiledCalldata = compileExecuteCalldata(calls);

      const hash = calculateInvokeTransactionHash({
        senderAddress: tv.senderAddress,
        compiledCalldata,
        chainId: tv.chainId,
        nonce: tv.nonce,
        resourceBounds: tv.resourceBounds,
        tip: tv.tip,
      });

      hash.should.equal(tv.expectedTxHash);
    });
  });

  describe('calculateDeployAccountTransactionHash', () => {
    it('should be deterministic for the same deploy inputs', () => {
      const fullPub = utils.getUncompressedPublicKey(Accounts.account1.publicKey);
      const { address, constructorCalldata, salt } = utils.computeStarknetAddress(fullPub);
      const params = {
        contractAddress: address,
        classHash: '0x3940bc18abf1df6bc540cabadb1cad9486c6803b95801e57b6153ae21abfe06',
        constructorCalldata,
        contractAddressSalt: salt,
        chainId: SandboxTransferData.chainId,
        nonce: '0x0',
        resourceBounds: SandboxTransferData.resourceBounds,
        tip: '0x0',
      };
      const hash1 = calculateDeployAccountTransactionHash(params);
      const hash2 = calculateDeployAccountTransactionHash(params);
      hash1.should.equal(hash2);
      hash1.should.startWith('0x');
    });

    it('should match hash from WalletInitializationBuilder build', async () => {
      const factory = new TransactionBuilderFactory(coins.get('starknet'));
      const builder = factory.getWalletInitializationBuilder();
      builder.fromPublicKey(Accounts.account1.publicKey).nonce('0x0').chainId(SandboxTransferData.chainId);
      const tx = (await builder.build()) as import('../../src/lib/transaction').Transaction;
      const fullPub = utils.getUncompressedPublicKey(Accounts.account1.publicKey);
      const { address, constructorCalldata, salt } = utils.computeStarknetAddress(fullPub);
      const hash = calculateDeployAccountTransactionHash({
        contractAddress: address,
        classHash: '0x3940bc18abf1df6bc540cabadb1cad9486c6803b95801e57b6153ae21abfe06',
        constructorCalldata,
        contractAddressSalt: salt,
        chainId: SandboxTransferData.chainId,
        nonce: '0x0',
        resourceBounds: SandboxTransferData.resourceBounds,
      });
      hash.should.equal(tx.starknetTransactionData.transactionHash);
    });
  });
});
