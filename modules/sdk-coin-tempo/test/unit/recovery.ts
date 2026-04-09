import { Tempo } from '../../src/tempo';
import { Ttempo } from '../../src/ttempo';
import { BitGoAPI } from '@bitgo/sdk-api';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoBase } from '@bitgo/sdk-core';
import { BaseCoin as StaticsBaseCoin } from '@bitgo/statics';
import * as should from 'should';
import * as sinon from 'sinon';

describe('Tempo Recovery', function () {
  let bitgo: TestBitGoAPI;
  let basecoin: Tempo;
  let sandbox: sinon.SinonSandbox;

  const registerCoin = (name: string, coinClass: typeof Tempo | typeof Ttempo): void => {
    bitgo.safeRegister(name, (bitgo: BitGoBase) => {
      const mockStaticsCoin: Readonly<StaticsBaseCoin> = {
        name,
        fullName: name === 'tempo' ? 'Tempo' : 'Testnet Tempo',
        network: {
          type: name === 'tempo' ? 'mainnet' : 'testnet',
        } as any,
        features: ['tss'],
      } as any;
      return coinClass.createInstance(bitgo, mockStaticsCoin);
    });
  };

  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'mock' });
    registerCoin('tempo', Tempo);
    bitgo.initializeTestVars();
    basecoin = bitgo.coin('tempo') as Tempo;
  });

  beforeEach(function () {
    sandbox = sinon.createSandbox();
  });

  afterEach(function () {
    sandbox.restore();
  });

  describe('recover validation', function () {
    it('should reject recovery without tokenContractAddress', async function () {
      await basecoin
        .recover({
          userKey: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
          backupKey: '0x03abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
          walletContractAddress: '0x2476602c78e9a5e0563320c78878faa3952b256f',
          recoveryDestination: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
          isTss: true,
          eip1559: {
            maxFeePerGas: 2000000000,
            maxPriorityFeePerGas: 1000000000,
          },
        })
        .should.be.rejectedWith(/tokenContractAddress is required/);
    });

    it('should reject recovery without isTss flag', async function () {
      await basecoin
        .recover({
          userKey: 'xprv...',
          backupKey: 'xprv...',
          walletContractAddress: '0x2476602c78e9a5e0563320c78878faa3952b256f',
          recoveryDestination: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
          tokenContractAddress: '0x20c0000000000000000000000000000000000000',
        })
        .should.be.rejectedWith(/Tempo recovery requires TSS/);
    });

    it('should reject recovery with bitgoFeeAddress (cross-chain)', async function () {
      await basecoin
        .recover({
          userKey: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
          backupKey: '0x03abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
          walletContractAddress: '0x2476602c78e9a5e0563320c78878faa3952b256f',
          recoveryDestination: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
          tokenContractAddress: '0x20c0000000000000000000000000000000000000',
          bitgoFeeAddress: '0x0000000000000000000000000000000000000001',
          isTss: true,
        })
        .should.be.rejectedWith(/cross-chain recovery is not supported/);
    });
  });

  describe('recoveryBlockchainExplorerQuery', function () {
    it.skip('should query token balance via JSON-RPC', async function () {
      // Skip: requires actual network mocking which is complex with ethers.js
      // The implementation is tested through integration tests
    });

    it.skip('should query nonce via JSON-RPC', async function () {
      // Skip: requires actual network mocking which is complex with ethers.js
      // The implementation is tested through integration tests
    });

    it('should throw for unsupported query', async function () {
      await basecoin
        .recoveryBlockchainExplorerQuery({
          module: 'unknown',
          action: 'unknown',
        })
        .should.be.rejectedWith(/Unsupported Tempo recovery query/);
    });
  });

  describe('unsigned sweep validation', function () {
    it('should require eip1559 params for unsigned sweep', async function () {
      sandbox.stub(basecoin as any, 'validateTip20SweepAmounts').resolves({ sweepAmount: BigInt(1000000) });
      sandbox.stub(basecoin as any, 'resolveTempoRpcUrl').returns('https://rpc.testnet.tempo.xyz');

      await (basecoin as any)
        .buildUnsignedSweepTxnTSS({
          userKey: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
          backupKey: '0x03abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
          walletContractAddress: '0x2476602c78e9a5e0563320c78878faa3952b256f',
          recoveryDestination: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
          tokenContractAddress: '0x20c0000000000000000000000000000000000000',
          isTss: true,
          gasLimit: 100000,
        })
        .should.be.rejectedWith(/eip1559.*required/);
    });
  });

  describe('address parsing with memoId', function () {
    it('should parse memoId from recovery destination', async function () {
      const details = basecoin.getAddressDetails('0x742d35Cc6634C0532925a3b844Bc454e4438f44e?memoId=12345');
      details.baseAddress.should.equal('0x742d35Cc6634C0532925a3b844Bc454e4438f44e');
      details.memoId!.should.equal('12345');
    });

    it('should handle recovery destination without memoId', async function () {
      const details = basecoin.getAddressDetails('0x742d35Cc6634C0532925a3b844Bc454e4438f44e');
      details.baseAddress.should.equal('0x742d35Cc6634C0532925a3b844Bc454e4438f44e');
      should.not.exist(details.memoId);
    });
  });
});
