import { Eth, getBuilder } from '../../../../../src';
import { TransactionType } from '../../../../../src/coin/baseCoin';
import should from 'should';

describe('Eth contract call transaction builder', () => {
  let txBuilder;
  let contractAddress;
  const rawTx =
    '0xf889398506fc23ac0083be8c72947fc37878dca69c9ac48397500279305f798b157280a42bf90baacecf367fdc11132a0ccfeb91692cb31ff126083c353459e0572a0b34c48e952377a0206c902a536c5327ea2861965538963b6180f7d13e36ffd4abb7aa9628f72eb9a05ee209b7b02a2ea3fbf6033701d6e959dfc1e78452235245cf2b8d3f9110c6af';

  beforeEach(() => {
    contractAddress = '0x8f977e912ef500548a0c3be6ddde9899f1199b81';
    // testData.KEYPAIR_PRV.getKeys().prv as string;
    txBuilder = getBuilder('teth') as Eth.TransactionBuilder;
    txBuilder.type(TransactionType.ContractCall);
    txBuilder.fee({
      fee: '30000000000',
      gasLimit: '12487794',
    });
    txBuilder.counter(57);
  });

  it('should build a contract call type transaction', async () => {
    txBuilder.contract('0x7Fc37878DCa69C9AC48397500279305F798b1572');
    txBuilder.data('0x2bf90baacecf367fdc11132a0ccfeb91692cb31ff126083c353459e0572a0b34c48e9523');
    txBuilder.sign({ key: '064A3BF8B08A3426E8A719AE5E4115228A75E7A1449CB1B734E51C7DC8A867BE' });
    const tx = await txBuilder.build();
    should.exist(tx);
    const json = tx.toJson();
    should.equal(tx.toBroadcastFormat(), rawTx);
  });

  it('should deserialize an serialize raw transaction', async () => {
    txBuilder.from(rawTx);
    const tx = await txBuilder.build();
    should.equal(tx.toBroadcastFormat(), rawTx);
  });

  it('should build a contract call type transaction, deserialize it, sing it and serialize it again', async () => {
    txBuilder.contract('0x7Fc37878DCa69C9AC48397500279305F798b1572');
    txBuilder.data('0x2bf90baacecf367fdc11132a0ccfeb91692cb31ff126083c353459e0572a0b34c48e9523');
    const txUnsigned = await txBuilder.build();

    const builderFrom = getBuilder('teth') as Eth.TransactionBuilder;
    builderFrom.from(txUnsigned.toBroadcastFormat());
    builderFrom.sign({ key: '064A3BF8B08A3426E8A719AE5E4115228A75E7A1449CB1B734E51C7DC8A867BE' });
    const tx = await builderFrom.build();

    should.equal(tx.toBroadcastFormat(), rawTx);
  });

  it('should thrown if contract or data is missing', async () => {
    const missingContract = await txBuilder.build().catch(e => e);
    should.equal(missingContract.message, 'Invalid transaction: missing contract address');
    txBuilder.contract(contractAddress);
    const missingData = await txBuilder.build().catch(e => e);
    should.equal(missingData.message, 'Invalid transaction: missing contract call data field');
  });
});
