import { getBuilderFactory } from '../getBuilderFactory';
import * as testData from '../../resources/sui';
import should from 'should';
import { TransactionType } from '@bitgo/sdk-core';
import utils from '../../../src/lib/utils';
import { Transaction as SuiTransaction } from '../../../src/lib/transaction';
import { SuiTransactionType, TransferProgrammableTransaction } from '../../../src/lib/iface';
import { KeyPair } from '../../../src/lib/keyPair';
import axios from 'axios';
import { GasData } from '../../../src/lib/mystenlab/types';
import { TransferTransaction } from '../../../src';

describe('Sui Transfer Builder', () => {
  const factory = getBuilderFactory('tsui');

  describe('Succeed', () => {
    it('should build a transfer tx', async function () {
      const txBuilder = factory.getTransferBuilder();
      txBuilder.type(SuiTransactionType.Transfer);
      txBuilder.sender(testData.sender.address);
      txBuilder.send(testData.recipients);
      txBuilder.gasData(testData.gasData);
      const tx = await txBuilder.build();
      should.equal(tx.type, TransactionType.Send);
      (tx as SuiTransaction<TransferProgrammableTransaction>).suiTransaction.gasData.payment!.should.deepEqual(
        testData.coinsGasPayment
      );

      tx.inputs.length.should.equal(1);
      tx.inputs[0].should.deepEqual({
        address: testData.sender.address,
        value: (testData.AMOUNT * 2).toString(),
        coin: 'tsui',
      });
      tx.outputs.length.should.equal(2);
      tx.outputs[0].should.deepEqual({
        address: testData.recipients[0].address,
        value: testData.recipients[0].amount,
        coin: 'tsui',
      });
      tx.outputs[1].should.deepEqual({
        address: testData.recipients[1].address,
        value: testData.recipients[1].amount,
        coin: 'tsui',
      });
      const rawTx = tx.toBroadcastFormat();
      should.equal(utils.isValidRawTransaction(rawTx), true);
      should.equal(rawTx, testData.TRANSFER);
    });
  });

  describe('Fail', () => {
    it('should fail for invalid sender', async function () {
      const builder = factory.getTransferBuilder();
      should(() => builder.sender('randomString')).throwError('Invalid or missing sender, got: randomString');
    });

    it('should fail for invalid payTx', async function () {
      const builder = factory.getTransferBuilder();
      should(() => builder.send([testData.invalidRecipients[0]])).throwError(
        'Invalid or missing address, got: randomString'
      );
      should(() => builder.send([testData.invalidRecipients[1]])).throwError('Invalid recipient amount');
    });

    it('should fail for invalid gasData', function () {
      const builder = factory.getTransferBuilder();
      should(() => builder.gasData(testData.invalidGasOwner)).throwError(
        `Invalid gas address ${testData.invalidGasOwner.owner}`
      );
    });

    it('should fail for invalid gasBudget', function () {
      const builder = factory.getTransferBuilder();
      should(() => builder.gasData(testData.invalidGasBudget)).throwError('Invalid gas budget -1');
    });

    it('should fail for invalid gasPayment', function () {
      const builder = factory.getTransferBuilder();
      const invalidGasPayment = {
        ...testData.gasDataWithoutGasPayment,
        payment: [
          {
            objectId: '',
            version: -1,
            digest: '',
          },
        ],
      };
      should(() => builder.gasData(invalidGasPayment)).throwError('Invalid payment, invalid or missing version');
    });

    it('should submit a transaction', async () => {
      const keyPair = new KeyPair({ prv: testData.privateKeys.prvKey1 });
      const keyPair2 = new KeyPair({ prv: testData.privateKeys.prvKey1 });
      const senderAddress = keyPair.getAddress();
      const receiveAddress = keyPair2.getAddress();
      console.log(senderAddress);

      const coinsRes = await axios.post('https://rpc.testnet.sui.io:443', {
        jsonrpc: '2.0',
        id: 1,
        method: 'suix_getCoins',
        params: [senderAddress],
      });
      const coins = coinsRes.data.result.data.map((r) => ({
        digest: r.digest,
        objectId: r.coinObjectId,
        version: r.version,
      }));
      const txBuilder = factory.getTransferBuilder();
      txBuilder.type(SuiTransactionType.Transfer);
      txBuilder.sender(senderAddress);
      txBuilder.send([{ address: receiveAddress, amount: '100000000' }]);
      const gasData: GasData = {
        payment: coins,
        owner: senderAddress,
        budget: 10000000,
        price: 1000,
      };
      txBuilder.gasData(gasData);
      //     txBuilder.sign({ key: keyPair.getKeys().prv});
      const tx = await txBuilder.build();
      const signable = tx.signablePayload;
      const signature = keyPair.signMessageinUint8Array(signable);
      txBuilder.addSignature({ pub: keyPair.getKeys().pub }, Buffer.from(signature));
      const signedtx = (await txBuilder.build()) as TransferTransaction;
      const txHex = signedtx.toBroadcastFormat();
      const sig = Buffer.from(signedtx.serializedSig).toString('base64');
      console.log(txHex);
      console.log(sig);
      const submitRes = await axios.post('https://rpc.testnet.sui.io:443', {
        jsonrpc: '2.0',
        id: 1,
        method: 'sui_executeTransactionBlock',
        params: [txHex, [sig], {}, 'WaitForEffectsCert'],
      });
      console.log(submitRes.data);
    });

    //
    //   txBuilder.output({
    //     address:
    //       'addr_test1qz2fxv2umyhttkxyxp8x0dlpdt3k6cwng5pxj3jhsydzer3jcu5d8ps7zex2k2xt3uqxgjqnnj83ws8lhrn648jjxtwq2ytjqp',
    //     amount: '5000000',
    //   });
    //
    //   txBuilder.ttl(800000000);
    //   txBuilder.sign({ key: keyPair.getKeys().prv });
    //
    //   const tx = await txBuilder.build();
    //   const serializedTx = tx.toBroadcastFormat();
    //   const bytes = Uint8Array.from(Buffer.from(serializedTx, 'hex'));
    //
    //   try {
    //     const res = await axios.post('https://testnet.koios.rest/api/v0/submittx', bytes, axiosConfig);
    //     console.log(res.data);
    //   } catch (err) {
    //     console.log(err);
    //   }
    // });
    //
    // xit('should submit a transaction using signature interface', async () => {
    //   const keyPair = new KeyPair({ prv: testData.privateKeys.prvKey4 });
    //   const senderAddress = keyPair.getAddress(AddressFormat.testnet);
    //   const axiosConfig = {
    //     headers: {
    //       'Content-Type': 'application/cbor',
    //     },
    //     timeout: 10000,
    //   };
    //   const txBuilder = factory.getTransferBuilder();
    //   const utxoData = await await axios.get('https://testnet.koios.rest/api/v0/address_info?_address=' + senderAddress);
    //   const senderBalance = utxoData.data[0].balance;
    //   txBuilder.changeAddress(senderAddress, senderBalance);
    //   const utxoSet = utxoData.data[0].utxo_set;
    //   for (const utxo of utxoSet) {
    //     txBuilder.input({ transaction_id: utxo.tx_hash, transaction_index: utxo.tx_index });
    //   }
    //   txBuilder.output({
    //     address:
    //       'addr_test1qz2fxv2umyhttkxyxp8x0dlpdt3k6cwng5pxj3jhsydzer3jcu5d8ps7zex2k2xt3uqxgjqnnj83ws8lhrn648jjxtwq2ytjqp',
    //     amount: '5000000',
    //   });
    //
    //   txBuilder.ttl(800000000);
    //
    //   const unsignedTx = await txBuilder.build();
    //   const serializedTx = unsignedTx.toBroadcastFormat();
    //
    //   const txBuilder2 = factory.from(serializedTx);
    //   const tx = await txBuilder2.build();
    //   const signableHex = tx.signablePayload.toString('hex');
    //   const signature = keyPair.signMessage(signableHex);
    //   txBuilder2.addSignature({ pub: keyPair.getKeys().pub }, Buffer.from(signature));
    //   const signedTransaction = await txBuilder2.build();
    //   const serializedTransaction = signedTransaction.toBroadcastFormat();
    //   const bytes = Uint8Array.from(Buffer.from(serializedTransaction, 'hex'));
    //
    //   try {
    //     const res = await axios.post('https://testnet.koios.rest/api/v0/submittx', bytes, axiosConfig);
    //     console.log(res.data);
    //   } catch (err) {
    //     console.log(err);
    //   }
    // });
  });
});
