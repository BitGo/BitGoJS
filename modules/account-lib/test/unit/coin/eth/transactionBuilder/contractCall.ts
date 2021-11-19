import should from 'should';
import { Eth, getBuilder } from '../../../../../src';
import { TransactionType } from '../../../../../src/coin/baseCoin';

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
    should.equal(tx.toBroadcastFormat(), rawTx);
  });

  it('should deserialize an serialize raw transaction', async () => {
    txBuilder.from(rawTx);
    const tx = await txBuilder.build();
    should.equal(tx.toBroadcastFormat(), rawTx);
  });

  it('should build a contract call type transaction, deserialize it, sign it and serialize it again', async () => {
    txBuilder.contract('0x7Fc37878DCa69C9AC48397500279305F798b1572');
    txBuilder.data('0x2bf90baacecf367fdc11132a0ccfeb91692cb31ff126083c353459e0572a0b34c48e9523');
    const txUnsigned = await txBuilder.build();

    const builderFrom = getBuilder('teth') as Eth.TransactionBuilder;
    builderFrom.from(txUnsigned.toBroadcastFormat());
    builderFrom.sign({ key: '064A3BF8B08A3426E8A719AE5E4115228A75E7A1449CB1B734E51C7DC8A867BE' });
    const tx = await builderFrom.build();

    should.equal(tx.toBroadcastFormat(), rawTx);
    should.equal(txUnsigned.toJson().v, '0x77');
  });

  it('should thrown if contract or data is missing', async () => {
    await txBuilder.build().should.be.rejectedWith('Invalid transaction: missing contract address');
    txBuilder.contract(contractAddress);
    await txBuilder.build().should.be.rejectedWith('Invalid transaction: missing contract call data field');
  });

  it('should properly build tx for eth2 staking staking deposit', async () => {
    // Eth2 staking contract
    txBuilder.contract('0x00000000219ab540356cbb839cbe05303d7705fa');
    // Sample data from https://etherscan.io/tx/0x4c5c36a2a41843ca0f304f4e5d49f4d97cd7b2654305866ccd747c4d44ea9827
    const data =
      '0x22895118000000000000000000000000000000000000000000000' +
      '00000000000000000800000000000000000000000000000000000000000' +
      '0000000000000000000000e000000000000000000000000000000000000' +
      '00000000000000000000000000120c8b2f03a5ed728430b3f87e787b40a' +
      'b67d208a396b86ac440019d39fab67d4f60000000000000000000000000' +
      '0000000000000000000000000000000000000308743c17f3454e2214aa5' +
      'f003e4f628c7015f3f2db3e79891b2449c53e1235642a5e7048ecd36054' +
      'cba63378555d09aab000000000000000000000000000000000000000000' +
      '000000000000000000000000000000000000000000000000000020002cf' +
      '4ab587c4394477a6bb0d6c5b113a050212269919ddea3aa5df37d6688e4' +
      '00000000000000000000000000000000000000000000000000000000000' +
      '0006080a701cfa9672b4b60743f29555344d3160df7cd78e396fe7efb42' +
      '92da89e68c2a0e7468117af2a0daaf2cde67c7f93b12406b9bf4fac8714' +
      'f8bf882a2f919929b57d852382bdcb7405949a03dff09e7686521220a51' +
      'cf495ed53e4c32c538f1';
    txBuilder.data(data);
    txBuilder.sign({ key: '064A3BF8B08A3426E8A719AE5E4115228A75E7A1449CB1B734E51C7DC8A867BE' });
    const tx = await txBuilder.build();
    should.exist(tx);
  });
});
