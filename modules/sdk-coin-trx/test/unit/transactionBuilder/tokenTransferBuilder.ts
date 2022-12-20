import should from 'should';
import { getBuilder } from '../../../src/lib/builder';
import { WrappedBuilder } from '../../../src';
import {
  PARTICIPANTS,
  BLOCK_HASH,
  BLOCK_NUMBER,
  TOKEN_TX_CONTRACT,
  FEE_LIMIT,
  USDT_CONTRACT_ADDRESS,
  TOKEN_TRANSFER_RECIPIENT,
} from '../../resources';

describe('TRX Token Transfer Builder', () => {
  const initTxBuilder = (amount = 1000000000) => {
    const builder = (getBuilder('ttrx:usdt') as WrappedBuilder).getTokenTransferBuilder();
    builder
      .source({ address: PARTICIPANTS.custodian.address })
      .to({ address: USDT_CONTRACT_ADDRESS })
      .block({ number: BLOCK_NUMBER, hash: BLOCK_HASH })
      .fee({ feeLimit: FEE_LIMIT });
    return builder;
  };

  describe('should build', () => {
    describe('non serialized transactions', () => {
      it('a signed token contract call transaction', async () => {
        const txBuilder = initTxBuilder();
        txBuilder.tokenTransferData(TOKEN_TRANSFER_RECIPIENT, 1000000000).sign({ key: PARTICIPANTS.custodian.pk });
        const tx = await txBuilder.build();
        const txJson = tx.toJson();
        const rawData = txJson.raw_data;
        should.deepEqual(rawData.contract, TOKEN_TX_CONTRACT);
      });
    });
  });
});
