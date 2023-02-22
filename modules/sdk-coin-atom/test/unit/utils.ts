import { AuthInfo, TxBody, TxRaw } from 'cosmjs-types/cosmos/tx/v1beta1/tx';
import should from 'should';

import utils from '../../src/lib/utils';
import { address, blockHash, TEST_TX, txIds } from '../resources/atom';

describe('utils', () => {
  it('should validate addresses correctly', () => {
    should.equal(utils.isValidAddress(address.address1), true);
    should.equal(utils.isValidAddress(address.address2), true);
    should.equal(utils.isValidAddress(address.address3), false);
    should.equal(utils.isValidAddress(address.address4), true);
    should.equal(utils.isValidAddress('dfjk35y'), false);
    should.equal(utils.isValidAddress(undefined as unknown as string), false);
    should.equal(utils.isValidAddress(''), false);
  });

  it('should validate block hash correctly', () => {
    should.equal(utils.isValidBlockId(blockHash.hash1), true);
    should.equal(utils.isValidBlockId(blockHash.hash2), true);
    // param is coming as undefined so it was causing an issue
    should.equal(utils.isValidBlockId(undefined as unknown as string), false);
    should.equal(utils.isValidBlockId(''), false);
  });

  it('should validate invalid block hash correctly', () => {
    should.equal(utils.isValidBlockId(''), false);
    should.equal(utils.isValidBlockId('0xade35465gfvdcsxsz24300'), false);
    should.equal(utils.isValidBlockId(blockHash.hash2 + 'ff'), false);
    should.equal(utils.isValidBlockId('latest'), false);
  });

  it('should validate transaction id correctly', () => {
    should.equal(utils.isValidTransactionId(txIds.hash1), true);
    should.equal(utils.isValidTransactionId(txIds.hash2), true);
    should.equal(utils.isValidTransactionId(txIds.hash3), true);
  });

  it('should validate invalid transaction id correctly', () => {
    should.equal(utils.isValidTransactionId(''), false);
    should.equal(utils.isValidTransactionId(txIds.hash1.slice(3)), false);
    should.equal(utils.isValidTransactionId(txIds.hash3 + '00'), false);
    should.equal(utils.isValidTransactionId('dalij43ta0ga2dadda02'), false);
  });

  it('should validate raw transaction correctly', () => {
    should.doesNotThrow(() => utils.validateRawTransaction(TEST_TX.signedTxBase64));
  });

  it('should validate invalid raw transaction correctly', () => {
    should(() => utils.validateRawTransaction(undefined)).throw('Invalid raw transaction: Undefined');

    const emptyMessageTx = Buffer.from(
      TxRaw.encode(
        TxRaw.fromPartial({
          bodyBytes: TxBody.encode(
            TxBody.fromPartial({
              messages: [],
            })
          ).finish(),
          authInfoBytes: AuthInfo.encode(
            AuthInfo.fromJSON({
              signerInfos: [
                {
                  seqence: 0,
                },
              ],
            })
          ).finish(),
        })
      ).finish()
    ).toString('base64');
    should(() => utils.validateRawTransaction(emptyMessageTx)).throw('Invalid raw transaction');
  });
});
