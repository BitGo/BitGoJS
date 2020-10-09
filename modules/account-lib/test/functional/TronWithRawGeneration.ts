import TronWeb from 'tronweb';
import {
  FirstExpectedKeyAddress,
  FirstPrivateKey,
  FirstSigOnBuildTransaction,
  SecondExpectedKeyAddress,
  SecondPrivateKey,
  UnsignedBuildTransaction,
} from '../resources/trx';
import { createRawTransaction, TransactionBuilder } from '../../src/coin/trx';
import { getBuilder } from '../../src';
import { TxCreateDataBuilderFactory } from '../../src/coin/trx/rawTtransaction/txCreateDataBuilderFactory';

describe('create a raw transaction and then sign it throught account-lib', () => {
  const privateKeyFrom = FirstPrivateKey;
  const privateKeyTo = SecondPrivateKey;
  const fromAddress = FirstExpectedKeyAddress;
  const toAddress = SecondExpectedKeyAddress; // address _to
  const amount = '10223'; // amount

  const tronWeb = new TronWeb({ fullHost: 'https://api.shasta.trongrid.io', privateKey: privateKeyFrom });

  it('should create a raw tx, sign it and broadcast it to the network', async () => {
    const rawBuilder = TxCreateDataBuilderFactory.getSendFound();
    const createData = rawBuilder
      .source({ address: fromAddress })
      .to({ address: toAddress })
      .amount(amount)
      .build();
    const rawTx = await createRawTransaction(tronWeb, createData);

    const txBuilder = getBuilder('ttrx') as TransactionBuilder;
    txBuilder.from(JSON.stringify(rawTx));
    txBuilder.extendValidTo(100000);
    txBuilder.sign({ key: privateKeyFrom });
    txBuilder.sign({ key: privateKeyTo });

    const tx = await txBuilder.build();

    const result = await tronWeb.trx.sendRawTransaction(tx.toJson()).catch(err => console.error(err));
    console.log(result);
  });
});
