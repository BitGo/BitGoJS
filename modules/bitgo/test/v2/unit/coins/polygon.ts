import { TestBitGo } from '../../../lib/test_bitgo';
import { Polygon } from '../../../../src/v2/coins/polygon';
import { Tpolygon } from '../../../../src/v2/coins/tpolygon';
import * as should from 'should';
import { getBuilder, Polygon as PolygonAccountLib } from '@bitgo/account-lib';
import { TransactionType } from '@bitgo/sdk-core';

describe('Polygon', function () {
  let bitgo;
  let basecoin;

  /**
   * Build an unsigned account-lib multi-signature send transactino
   * @param destination The destination address of the transaction
   * @param contractAddress The address of the smart contract processing the transaction
   * @param contractSequenceId The sequence id of the contract
   * @param nonce The nonce of the sending address
   * @param expireTime The expire time of the transaction
   * @param amount The amount to send to the recipient
   * @param gasPrice The gas price of the transaction
   * @param gasLimit The gas limit of the transaction
   */
  const buildUnsignedTransaction = async function ({
    destination,
    contractAddress,
    contractSequenceId = 1,
    nonce = 0,
    expireTime = Math.floor(new Date().getTime() / 1000),
    amount = '100000',
    gasPrice = '10000',
    gasLimit = '20000',
  }) {
    const txBuilder: PolygonAccountLib.TransactionBuilder = getBuilder('tpolygon') as PolygonAccountLib.TransactionBuilder;
    txBuilder.type(TransactionType.Send);
    txBuilder.fee({
      fee: gasPrice,
      gasLimit: gasLimit,
    });
    txBuilder.counter(nonce);
    txBuilder.contract(contractAddress);
    const transferBuilder = txBuilder.transfer() as PolygonAccountLib.TransferBuilder;

    transferBuilder
      .coin('tpolygon')
      .expirationTime(expireTime)
      .amount(amount)
      .to(destination)
      .contractSequenceId(contractSequenceId);

    return await txBuilder.build();
  };

  before(function () {
    bitgo = new TestBitGo({ env: 'mock' });
    bitgo.initializeTestVars();
    basecoin = bitgo.coin('tpolygon');
  });

  describe('Instantiate', () => {

    it('should instantiate the coin', function () {
      let localBasecoin = bitgo.coin('tpolygon');
      localBasecoin.should.be.an.instanceof(Tpolygon);

      localBasecoin = bitgo.coin('polygon');
      localBasecoin.should.be.an.instanceof(Polygon);
    });

  });

  describe('Explain transaction:', () => {

    it('should fail if the params object is missing parameters', async function () {
      const explainParams = {
        feeInfo: { fee: 1 },
        txHex: null,
      };
      await basecoin.explainTransaction(explainParams).should.be.rejectedWith('missing explain tx parameters');
    });

    it('explain a transfer transaction', async function () {
      const destination = '0xfaa8f14f46a99eb439c50e0c3b835cc21dad51b4';
      const contractAddress = '0x9e2c5712ab4caf402a98c4bf58c79a0dfe718ad1';

      const unsignedTransaction = await buildUnsignedTransaction({
        destination,
        contractAddress,
      });

      const explainParams = {
        halfSigned: {
          txHex: unsignedTransaction.toBroadcastFormat(),
        },
        feeInfo: { fee: 1 },
      };
      const explanation = await basecoin.explainTransaction(explainParams);
      should.exist(explanation.id);
    });

  });

  describe('EIP1559', function () {
    it('should sign a transaction with EIP1559 fee params', async function () {
      const coin = bitgo.coin('tpolygon');

      const userKeychain = {
        prv: 'xprv9s21ZrQH143K3hekyNj7TciR4XNYe1kMj68W2ipjJGNHETWP7o42AjDnSPgKhdZ4x8NBAvaL72RrXjuXNdmkMqLERZza73oYugGtbLFXG8g',
        pub: 'xpub661MyMwAqRbcGBjE5QG7pkf9cZD33UUD6K46q7ELrbuG7FqXfLNGiXYGHeEnGBb5AWREnk1eA28g8ArZvURbhshXWkTtddHRo54fgyVvLdb',
        rawPub: '023636e68b7b204573abda2616aff6b584910dece2543f1cc6d842caac7d74974b',
        rawPrv: '7438a50010ce7b1dfd86e68046cc78ba1ebd242d6d85d9904d3fcc08734bc172',
      };

      const halfSignedTransaction = await coin.signTransaction({
        txPrebuild: {
          eip1559: { maxPriorityFeePerGas: 10, maxFeePerGas: 10 },
          isBatch: false,
          recipients: [{
            amount: '42',
            address: '0xc93b13642d93b4218bb85f67317d6b37286e8028',
          }],
          expireTime: 1627949214,
          contractSequenceId: 12,
          gasLimit: undefined,
          gasPrice: undefined,
          hopTransaction: undefined,
          backupKeyNonce: undefined,
          sequenceId: undefined,
          nextContractSequenceId: 0,
        },
        prv: userKeychain.prv,
      });

      halfSignedTransaction.halfSigned.eip1559.maxPriorityFeePerGas.should.equal(10);
      halfSignedTransaction.halfSigned.eip1559.maxFeePerGas.should.equal(10);

    });
  });

});
