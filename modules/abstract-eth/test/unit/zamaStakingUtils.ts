import 'should';
import EthereumAbi from 'ethereumjs-abi';
import {
  buildApproveCalldata,
  buildDepositCalldata,
  approveMethodId,
  depositMethodId,
  approveTypes,
  depositTypes,
} from '../../src/lib/zamaStakingUtils';

describe('zamaStakingUtils', () => {
  const SPENDER_ADDRESS = '0x1111111111111111111111111111111111111111';
  const RECEIVER_ADDRESS = '0x2222222222222222222222222222222222222222';
  const AMOUNT = '1000000000000000000'; // 1 ZAMA (18 decimals)
  const LARGE_AMOUNT = '100000000000000000000000'; // 100,000 ZAMA

  // -------------------------------------------------------------------------
  describe('method selectors', () => {
    it('approveMethodId should be 0x095ea7b3', () => {
      approveMethodId.should.equal('0x095ea7b3');
    });

    it('depositMethodId should be 0x6e553f65', () => {
      depositMethodId.should.equal('0x6e553f65');
    });
  });

  // -------------------------------------------------------------------------
  describe('buildApproveCalldata', () => {
    it('should produce calldata starting with the approve selector', () => {
      const calldata = buildApproveCalldata(SPENDER_ADDRESS, AMOUNT);
      calldata.slice(0, 10).should.equal(approveMethodId);
    });

    it('should be 0x-prefixed', () => {
      const calldata = buildApproveCalldata(SPENDER_ADDRESS, AMOUNT);
      calldata.startsWith('0x').should.be.true();
    });

    it('should encode the spender address in the calldata', () => {
      const calldata = buildApproveCalldata(SPENDER_ADDRESS, AMOUNT);
      // Spender address (lowercase, without 0x prefix) should be in the calldata
      calldata.toLowerCase().should.containEql(SPENDER_ADDRESS.slice(2).toLowerCase());
    });

    it('should produce the correct total length (4 selector + 32 address + 32 uint256 = 68 bytes = 136 hex + 2 prefix)', () => {
      const calldata = buildApproveCalldata(SPENDER_ADDRESS, AMOUNT);
      // 0x + 8 (selector) + 64 (address padded) + 64 (uint256 padded) = 138 chars
      calldata.length.should.equal(2 + 8 + 64 + 64);
    });

    it('should produce different calldata for different amounts', () => {
      const calldata1 = buildApproveCalldata(SPENDER_ADDRESS, AMOUNT);
      const calldata2 = buildApproveCalldata(SPENDER_ADDRESS, LARGE_AMOUNT);
      calldata1.should.not.equal(calldata2);
    });

    it('should produce different calldata for different spender addresses', () => {
      const calldata1 = buildApproveCalldata(SPENDER_ADDRESS, AMOUNT);
      const calldata2 = buildApproveCalldata(RECEIVER_ADDRESS, AMOUNT);
      calldata1.should.not.equal(calldata2);
    });

    it('should round-trip decode to the original parameters', () => {
      const calldata = buildApproveCalldata(SPENDER_ADDRESS, AMOUNT);
      const payload = Buffer.from(calldata.slice(10), 'hex');
      const [decodedSpender, decodedAmount] = EthereumAbi.rawDecode([...approveTypes], payload);
      ('0x' + (decodedSpender as Buffer).toString('hex')).should.equal(SPENDER_ADDRESS.toLowerCase());
      decodedAmount.toString().should.equal(AMOUNT);
    });
  });

  // -------------------------------------------------------------------------
  describe('buildDepositCalldata', () => {
    it('should produce calldata starting with the deposit selector', () => {
      const calldata = buildDepositCalldata(AMOUNT, RECEIVER_ADDRESS);
      calldata.slice(0, 10).should.equal(depositMethodId);
    });

    it('should be 0x-prefixed', () => {
      const calldata = buildDepositCalldata(AMOUNT, RECEIVER_ADDRESS);
      calldata.startsWith('0x').should.be.true();
    });

    it('should encode the receiver address in the calldata', () => {
      const calldata = buildDepositCalldata(AMOUNT, RECEIVER_ADDRESS);
      calldata.toLowerCase().should.containEql(RECEIVER_ADDRESS.slice(2).toLowerCase());
    });

    it('should produce the correct total length (4 selector + 32 uint256 + 32 address = 68 bytes)', () => {
      const calldata = buildDepositCalldata(AMOUNT, RECEIVER_ADDRESS);
      calldata.length.should.equal(2 + 8 + 64 + 64);
    });

    it('should produce different calldata for different amounts', () => {
      const calldata1 = buildDepositCalldata(AMOUNT, RECEIVER_ADDRESS);
      const calldata2 = buildDepositCalldata(LARGE_AMOUNT, RECEIVER_ADDRESS);
      calldata1.should.not.equal(calldata2);
    });

    it('should produce different calldata for different receiver addresses', () => {
      const calldata1 = buildDepositCalldata(AMOUNT, SPENDER_ADDRESS);
      const calldata2 = buildDepositCalldata(AMOUNT, RECEIVER_ADDRESS);
      calldata1.should.not.equal(calldata2);
    });

    it('should round-trip decode to the original parameters', () => {
      const calldata = buildDepositCalldata(AMOUNT, RECEIVER_ADDRESS);
      const payload = Buffer.from(calldata.slice(10), 'hex');
      const [decodedAmount, decodedReceiver] = EthereumAbi.rawDecode([...depositTypes], payload);
      decodedAmount.toString().should.equal(AMOUNT);
      ('0x' + (decodedReceiver as Buffer).toString('hex')).should.equal(RECEIVER_ADDRESS.toLowerCase());
    });
  });
});
