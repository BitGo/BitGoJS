import should from 'should';
import { ZamaStakingBuilder, ZamaStakingOperationType } from '../../src/lib/zamaStakingBuilder';
import { approveMethodId, depositMethodId } from '../../src/lib/zamaStakingUtils';

describe('ZamaStakingBuilder', () => {
  const TOKEN_ADDRESS = '0x94167129172A35ab093B44b8b96213DDbc3cD387';
  const OPERATOR_ADDRESS = '0x1111111111111111111111111111111111111111';
  const RECEIVER_ADDRESS = '0x2222222222222222222222222222222222222222';
  const AMOUNT = '1000000000000000000'; // 1 ZAMA (18 decimals)

  // -------------------------------------------------------------------------
  describe('fluent approve flow', () => {
    it('should build an approve result with correct address and selector', () => {
      const builder = new ZamaStakingBuilder();
      const result = builder
        .type(ZamaStakingOperationType.APPROVE)
        .tokenContractAddress(TOKEN_ADDRESS)
        .spenderAddress(OPERATOR_ADDRESS)
        .amount(AMOUNT)
        .build();

      result.address.should.equal(TOKEN_ADDRESS);
      result.data.slice(0, 10).should.equal(approveMethodId);
      result.value.should.equal('0');
    });

    it('should throw when tokenContractAddress is missing', () => {
      const builder = new ZamaStakingBuilder();
      builder.type(ZamaStakingOperationType.APPROVE).spenderAddress(OPERATOR_ADDRESS).amount(AMOUNT);

      should.throws(() => builder.build(), /Missing token contract address for approve/);
    });

    it('should throw when spenderAddress is missing', () => {
      const builder = new ZamaStakingBuilder();
      builder.type(ZamaStakingOperationType.APPROVE).tokenContractAddress(TOKEN_ADDRESS).amount(AMOUNT);

      should.throws(() => builder.build(), /Missing spender address for approve/);
    });
  });

  // -------------------------------------------------------------------------
  describe('fluent deposit flow', () => {
    it('should build a deposit result with correct address and selector', () => {
      const builder = new ZamaStakingBuilder();
      const result = builder
        .type(ZamaStakingOperationType.DEPOSIT)
        .operatorAddress(OPERATOR_ADDRESS)
        .amount(AMOUNT)
        .receiverAddress(RECEIVER_ADDRESS)
        .build();

      result.address.should.equal(OPERATOR_ADDRESS);
      result.data.slice(0, 10).should.equal(depositMethodId);
      result.value.should.equal('0');
    });

    it('should throw when operatorAddress is missing', () => {
      const builder = new ZamaStakingBuilder();
      builder.type(ZamaStakingOperationType.DEPOSIT).amount(AMOUNT).receiverAddress(RECEIVER_ADDRESS);

      should.throws(() => builder.build(), /Missing operator address for deposit/);
    });

    it('should throw when receiverAddress is missing', () => {
      const builder = new ZamaStakingBuilder();
      builder.type(ZamaStakingOperationType.DEPOSIT).operatorAddress(OPERATOR_ADDRESS).amount(AMOUNT);

      should.throws(() => builder.build(), /Missing receiver address for deposit/);
    });
  });

  // -------------------------------------------------------------------------
  describe('common validation', () => {
    it('should throw when type is not set', () => {
      const builder = new ZamaStakingBuilder();
      builder.amount(AMOUNT);

      should.throws(() => builder.build(), /Missing staking operation type/);
    });

    it('should throw when amount is not set', () => {
      const builder = new ZamaStakingBuilder();
      builder
        .type(ZamaStakingOperationType.APPROVE)
        .tokenContractAddress(TOKEN_ADDRESS)
        .spenderAddress(OPERATOR_ADDRESS);

      should.throws(() => builder.build(), /Missing amount for staking transaction/);
    });

    it('should throw when amount is empty string', () => {
      should.throws(() => new ZamaStakingBuilder().amount(''), /Invalid amount for staking transaction/);
    });

    it('should throw when amount is "0"', () => {
      should.throws(() => new ZamaStakingBuilder().amount('0'), /Invalid amount for staking transaction/);
    });

    it('should throw for invalid eth address on tokenContractAddress', () => {
      should.throws(
        () => new ZamaStakingBuilder().tokenContractAddress('not-an-address'),
        /Invalid token contract address/
      );
    });

    it('should throw for invalid eth address on spenderAddress', () => {
      should.throws(() => new ZamaStakingBuilder().spenderAddress('bad'), /Invalid spender address/);
    });

    it('should throw for invalid eth address on operatorAddress', () => {
      should.throws(() => new ZamaStakingBuilder().operatorAddress('bad'), /Invalid operator address/);
    });

    it('should throw for invalid eth address on receiverAddress', () => {
      should.throws(() => new ZamaStakingBuilder().receiverAddress('bad'), /Invalid receiver address/);
    });
  });

  // -------------------------------------------------------------------------
  describe('parameter isolation', () => {
    it('changing token address should change the result address for approve', () => {
      const TOKEN_2 = '0x3333333333333333333333333333333333333333';
      const r1 = new ZamaStakingBuilder()
        .type(ZamaStakingOperationType.APPROVE)
        .tokenContractAddress(TOKEN_ADDRESS)
        .spenderAddress(OPERATOR_ADDRESS)
        .amount(AMOUNT)
        .build();
      const r2 = new ZamaStakingBuilder()
        .type(ZamaStakingOperationType.APPROVE)
        .tokenContractAddress(TOKEN_2)
        .spenderAddress(OPERATOR_ADDRESS)
        .amount(AMOUNT)
        .build();
      r1.address.should.equal(TOKEN_ADDRESS);
      r2.address.should.equal(TOKEN_2);
    });

    it('changing amount should change the calldata', () => {
      const r1 = new ZamaStakingBuilder()
        .type(ZamaStakingOperationType.APPROVE)
        .tokenContractAddress(TOKEN_ADDRESS)
        .spenderAddress(OPERATOR_ADDRESS)
        .amount(AMOUNT)
        .build();
      const r2 = new ZamaStakingBuilder()
        .type(ZamaStakingOperationType.APPROVE)
        .tokenContractAddress(TOKEN_ADDRESS)
        .spenderAddress(OPERATOR_ADDRESS)
        .amount('2000000000000000000')
        .build();
      r1.data.should.not.equal(r2.data);
    });
  });

  // -------------------------------------------------------------------------
  describe('isStakingData', () => {
    it('should return true for approve selector', () => {
      ZamaStakingBuilder.isStakingData(approveMethodId + '00'.repeat(64)).should.be.true();
    });

    it('should return true for deposit selector', () => {
      ZamaStakingBuilder.isStakingData(depositMethodId + '00'.repeat(64)).should.be.true();
    });

    it('should return false for unknown selector', () => {
      ZamaStakingBuilder.isStakingData('0xdeadbeef' + '00'.repeat(64)).should.be.false();
    });

    it('should return false for empty data', () => {
      ZamaStakingBuilder.isStakingData('').should.be.false();
    });

    it('should return false for short data', () => {
      ZamaStakingBuilder.isStakingData('0x1234').should.be.false();
    });
  });

  // -------------------------------------------------------------------------
  describe('value field', () => {
    it('should always be "0" for both approve and deposit', () => {
      const approve = new ZamaStakingBuilder()
        .type(ZamaStakingOperationType.APPROVE)
        .tokenContractAddress(TOKEN_ADDRESS)
        .spenderAddress(OPERATOR_ADDRESS)
        .amount(AMOUNT)
        .build();
      approve.value.should.equal('0');

      const deposit = new ZamaStakingBuilder()
        .type(ZamaStakingOperationType.DEPOSIT)
        .operatorAddress(OPERATOR_ADDRESS)
        .amount(AMOUNT)
        .receiverAddress(RECEIVER_ADDRESS)
        .build();
      deposit.value.should.equal('0');
    });
  });
});
