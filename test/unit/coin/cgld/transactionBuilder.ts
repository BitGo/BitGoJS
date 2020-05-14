import should from 'should';
import { RLP } from 'ethers/utils';
import { TransactionType } from '../../../../src/coin/baseCoin/';
import { getBuilder, Eth } from '../../../../src';
import * as testData from '../../../resources/cgld/cgld';
import { deserialize } from '../../../../src/coin/cgld/utils';
import { getContractData } from '../../../../src/coin/eth/utils';
import { fromNat } from '../../../../src/coin/cgld/utils';

describe('Celo Transaction builder', function() {
  let txBuilder;

  beforeEach(() => {
    txBuilder = getBuilder('cgld');
    txBuilder.fee({
      fee: '1000000000',
      gasLimit: '12100000',
    });
    txBuilder.chainId(44786);
    txBuilder.source(defaultKeyPair.getAddress());
    txBuilder.counter(2);
  });

  const defaultKeyPair = new Eth.KeyPair({
    prv: '8CAA00AE63638B0542A304823D66D96FF317A576F692663DB2F85E60FAB2590C',
  });

  describe('should sign', () => {
    it('an init transaction', async () => {
      txBuilder.type(TransactionType.WalletInitialization);
      txBuilder.owner('0x386Fe4E3D2b6Acce93CC13d06e92B00aa50F429c');
      txBuilder.owner('0xBa8eA9C3729686d7DB120efCfC81cD020C8DC1CB');
      txBuilder.owner('0x2fa96fca36dd9d646AC8a4e0C19b4D3a0Dc7e456');
      txBuilder.sign({ key: defaultKeyPair.getKeys().prv });
      const tx = await txBuilder.build(); //shoud build and sign

      tx.type.should.equal(TransactionType.WalletInitialization);
      const txJson = tx.toJson();
      txJson.gasLimit.should.equal('12100000');
      txJson.gasPrice.should.equal('1000000000');
      should.equal(txJson.nonce, 2);
      should.equal(txJson.chainId, 44786);
      should.equal(tx.toBroadcastFormat(), testData.TX_BROADCAST);
    });
    it('an send transaction', async () => {
      txBuilder.type(TransactionType.Send);
      txBuilder.contract('0x8f977e912ef500548a0c3be6ddde9899f1199b81');
      txBuilder
        .transfer(1000000000)
        .to('0x19645032c7f1533395d44a629462e751084d3e4c')
        .expirationTime(1590066728)
        .sequenceId(5)
        .key(defaultKeyPair.getKeys().prv);
      txBuilder.sign({ key: defaultKeyPair.getKeys().prv });
      const tx = await txBuilder.build(); //shoud build and sign
      should.equal(tx.toBroadcastFormat(), testData.SEND_TX_BROADCAST);
    });

    it('decode serialized tx', () => {
      const txBuilder: any = getBuilder('cgld');
      txBuilder.type(TransactionType.WalletInitialization);
      txBuilder.owner(testData.ACCOUNT1);
      txBuilder.owner(testData.ACCOUNT2);
      txBuilder.owner(testData.ACCOUNT3);
      const walletOwners = [testData.ACCOUNT1, testData.ACCOUNT2, testData.ACCOUNT3];
      const txData = testData.TXDATA_EMPTY_DATA;
      txData.data = getContractData(walletOwners);
      const chainIdNumber = '0x' + Number(txData.chainId).toString(16);
      console.log('chain id number', chainIdNumber);
      const chainId = fromNat(chainIdNumber);
      console.log('chain Id', chainId);
      const encodedTxData = RLP.encode([
        txData.nonce,
        txData.gasPrice,
        txData.gasLimit,
        '0x',
        '0x',
        '0x',
        '0x',
        '0x',
        txData.data,
        chainId,
        '0x',
        '0x',
      ]);
      const decodedTx = deserialize(encodedTxData);
      console.log('Decoded Tx ', decodedTx);
    });
  });
});
