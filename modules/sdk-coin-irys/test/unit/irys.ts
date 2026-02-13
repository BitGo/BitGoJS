import should from 'should';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';
import { Irys, TIrys } from '../../src';

describe('Irys', function () {
  let bitgo: TestBitGoAPI;
  let irys: Irys;
  let tirys: TIrys;

  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'mock' });
    bitgo.safeRegister('irys', Irys.createInstance);
    bitgo.safeRegister('tirys', TIrys.createInstance);
    bitgo.initializeTestVars();
    irys = bitgo.coin('irys') as Irys;
    tirys = bitgo.coin('tirys') as TIrys;
  });

  describe('Irys Mainnet', function () {
    it('should instantiate the coin', function () {
      irys.should.be.instanceOf(Irys);
    });

    it('should have correct chain name', function () {
      irys.getChain().should.equal('irys');
    });

    it('should have correct full name', function () {
      irys.getFullName().should.equal('Irys');
    });

    it('should support TSS', function () {
      irys.supportsTss().should.be.true();
    });

    it('should use ECDSA MPC algorithm', function () {
      irys.getMPCAlgorithm().should.equal('ecdsa');
    });

    it('should return a commitment transaction builder', function () {
      const builder = irys.getCommitmentTransactionBuilder();
      should.exist(builder);
      builder.should.be.instanceOf(Object);
    });

    it('should return the Irys API URL', function () {
      const apiUrl = irys.getIrysApiUrl();
      should.exist(apiUrl);
      apiUrl!.should.be.a.String();
      apiUrl!.should.equal('https://node1.irys.xyz/v1');
    });
  });

  describe('Irys Testnet (TIrys)', function () {
    it('should instantiate the coin', function () {
      tirys.should.be.instanceOf(TIrys);
      tirys.should.be.instanceOf(Irys);
    });

    it('should have correct chain name', function () {
      tirys.getChain().should.equal('tirys');
    });

    it('should have correct full name', function () {
      tirys.getFullName().should.equal('Irys Testnet');
    });

    it('should support TSS', function () {
      tirys.supportsTss().should.be.true();
    });

    it('should use ECDSA MPC algorithm', function () {
      tirys.getMPCAlgorithm().should.equal('ecdsa');
    });

    it('should return a commitment transaction builder', function () {
      const builder = tirys.getCommitmentTransactionBuilder();
      should.exist(builder);
      builder.should.be.instanceOf(Object);
    });

    it('should return the Irys testnet API URL', function () {
      const apiUrl = tirys.getIrysApiUrl();
      should.exist(apiUrl);
      apiUrl!.should.be.a.String();
      apiUrl!.should.equal('https://testnet-node1.irys.xyz/v1');
    });
  });
});
