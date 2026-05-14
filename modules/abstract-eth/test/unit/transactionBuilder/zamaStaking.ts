/**
 * TransactionBuilder integration tests for ZAMA ERC-4626 staking delegate flow.
 *
 * Verifies two staking flows end-to-end through the generic staking() API:
 *   Flow 1 — ERC20 approve via staking(ZamaStakingBuilder)
 *   Flow 2 — ERC4626 deposit via staking(ZamaStakingBuilder)
 *
 * This is a reusable test function exported for coin-specific test suites.
 */
import { TransactionType } from '@bitgo/sdk-core';
import should from 'should';
import { TransactionBuilder } from '../../../src';
import { approveMethodId, depositMethodId } from '../../../src/lib/zamaStakingUtils';
import { ZamaStakingBuilder, ZamaStakingOperationType } from '../../../src/lib/zamaStakingBuilder';

const TOKEN_ADDRESS = '0x94167129172A35ab093B44b8b96213DDbc3cD387';
const OPERATOR_ADDRESS = '0x1111111111111111111111111111111111111111';
const RECEIVER_ADDRESS = '0x2222222222222222222222222222222222222222';
const AMOUNT = '1000000000000000000';

export function runZamaStakingTests(coinName: string, getBuilder: (coin: string) => TransactionBuilder): void {
  describe(`${coinName} transaction builder — ZAMA staking delegate flows`, () => {
    let txBuilder: TransactionBuilder;

    beforeEach(() => {
      txBuilder = getBuilder(coinName);
      txBuilder.fee({ fee: '1000000000', gasLimit: '200000' });
      txBuilder.counter(1);
    });

    // -------------------------------------------------------------------------
    describe('Flow 1: ERC20 approve via staking()', () => {
      it('should build a tx with approve calldata', async () => {
        txBuilder.type(TransactionType.ContractCall);
        txBuilder.staking(
          new ZamaStakingBuilder()
            .type(ZamaStakingOperationType.APPROVE)
            .tokenContractAddress(TOKEN_ADDRESS)
            .spenderAddress(OPERATOR_ADDRESS)
            .amount(AMOUNT)
        );

        const tx = await txBuilder.build();
        const json = tx.toJson();

        should.equal(tx.type, TransactionType.ContractCall);
        json.to.should.equal(TOKEN_ADDRESS);
        json.data.should.startWith(approveMethodId);
        json.value.should.equal('0');
      });

      it('should serialize and deserialize correctly (rebuild from hex)', async () => {
        txBuilder.type(TransactionType.ContractCall);
        txBuilder.staking(
          new ZamaStakingBuilder()
            .type(ZamaStakingOperationType.APPROVE)
            .tokenContractAddress(TOKEN_ADDRESS)
            .spenderAddress(OPERATOR_ADDRESS)
            .amount(AMOUNT)
        );

        const originalTx = await txBuilder.build();
        const rawHex = originalTx.toBroadcastFormat();

        const rebuiltBuilder = getBuilder(coinName);
        rebuiltBuilder.from(rawHex);
        const rebuiltTx = await rebuiltBuilder.build();

        should.equal(rebuiltTx.toBroadcastFormat(), rawHex);
      });
    });

    // -------------------------------------------------------------------------
    describe('Flow 2: ERC4626 deposit via staking()', () => {
      it('should build a tx with deposit calldata', async () => {
        txBuilder.type(TransactionType.ContractCall);
        txBuilder.staking(
          new ZamaStakingBuilder()
            .type(ZamaStakingOperationType.DEPOSIT)
            .operatorAddress(OPERATOR_ADDRESS)
            .amount(AMOUNT)
            .receiverAddress(RECEIVER_ADDRESS)
        );

        const tx = await txBuilder.build();
        const json = tx.toJson();

        should.equal(tx.type, TransactionType.ContractCall);
        json.to.should.equal(OPERATOR_ADDRESS);
        json.data.should.startWith(depositMethodId);
        json.value.should.equal('0');
      });

      it('should serialize and deserialize correctly (rebuild from hex)', async () => {
        txBuilder.type(TransactionType.ContractCall);
        txBuilder.staking(
          new ZamaStakingBuilder()
            .type(ZamaStakingOperationType.DEPOSIT)
            .operatorAddress(OPERATOR_ADDRESS)
            .amount(AMOUNT)
            .receiverAddress(RECEIVER_ADDRESS)
        );

        const originalTx = await txBuilder.build();
        const rawHex = originalTx.toBroadcastFormat();

        const rebuiltBuilder = getBuilder(coinName);
        rebuiltBuilder.from(rawHex);
        const rebuiltTx = await rebuiltBuilder.build();

        should.equal(rebuiltTx.toBroadcastFormat(), rawHex);
      });
    });

    // -------------------------------------------------------------------------
    describe('validation', () => {
      it('should throw when staking() is called on non-ContractCall type', () => {
        txBuilder.type(TransactionType.Send);
        should.throws(
          () =>
            txBuilder.staking(
              new ZamaStakingBuilder()
                .type(ZamaStakingOperationType.APPROVE)
                .tokenContractAddress(TOKEN_ADDRESS)
                .spenderAddress(OPERATOR_ADDRESS)
                .amount(AMOUNT)
            ),
          /Staking can only be set for ContractCall transactions/
        );
      });

      it('should throw when staking builder is missing required fields', async () => {
        txBuilder.type(TransactionType.ContractCall);
        txBuilder.staking(new ZamaStakingBuilder().type(ZamaStakingOperationType.APPROVE).amount(AMOUNT));
        await txBuilder.build().should.be.rejectedWith(/Missing token contract address for approve/);
      });
    });
  });
}
