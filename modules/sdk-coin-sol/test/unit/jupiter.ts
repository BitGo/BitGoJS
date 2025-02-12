import should from 'should';

import { KeyPair, Utils } from '../../src';
import * as testData from '../resources/sol';
import { Transaction as SolTransaction } from '@solana/web3.js';
import { getBuilderFactory } from './getBuilderFactory';
import * as bs58 from 'bs58';

describe('Sol Transaction', () => {
  //const coin = coins.get('tsol');
  const walletKeyPair = new KeyPair(testData.authAccount);
  const wallet = walletKeyPair.getKeys();

  it('do something for jupiter tx', async function () {
    const selling = { address: 'So11111111111111111111111111111111111111112', decimals: 9 };
    const buying = { address: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN', decimals: 6 };
    const sellingAmount = 0.01;

    const quoteResponse = await (
      await fetch(
        `https://api.jup.ag/swap/v1/quote?inputMint=${selling.address}&outputMint=${buying.address}&amount=${
          sellingAmount * Math.pow(10, selling.decimals)
        }&onlyDirectRoutes=true&asLegacyTransaction=true`
      )
    ).json();
    console.log('quoteResponse', JSON.stringify(quoteResponse, null, 2));

    const swapResponse = await (
      await fetch('https://api.jup.ag/swap/v1/swap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quoteResponse,
          userPublicKey: wallet.pub,
          dynamicComputeUnitLimit: false,
          dynamicSlippage: true,
          prioritizationFeeLamports: {
            priorityLevelWithMaxLamports: {
              maxLamports: 1000000,
              priorityLevel: 'veryHigh',
            },
          },
          asLegacyTransaction: true,
        }),
      })
    ).json();
    console.log('swapResponse', swapResponse);

    const transactionBase64 = swapResponse.swapTransaction;
    console.log('transactionBase64', transactionBase64);

    const transaction = SolTransaction.from(Buffer.from(transactionBase64, 'base64'));
    transaction.serialize({ requireAllSignatures: false, verifySignatures: false });

    // console.log('transaction', transaction.instructions);

    // const tx = new Transaction(coin);
    // tx.fromRawTransaction(
    //     transaction.serialize({ requireAllSignatures: false, verifySignatures: false }).toString('base64')
    // );

    // const tx1 = transaction.serialize({ requireAllSignatures: false, verifySignatures: false }).toString('base64');

    const factory = getBuilderFactory('tsol');
    const txBuilder = factory.getTransferBuilderV2();
    txBuilder.from(transactionBase64);

    const txUnsigned = await txBuilder.build();
    txBuilder.sign({ key: wallet.prv });
    const tx = await txBuilder.build();
    //const txJson = tx.toJson();
    const rawTx = tx.toBroadcastFormat();
    should.equal(Utils.isValidRawTransaction(rawTx), true);

    const tx2 = await factory.from(txUnsigned.toBroadcastFormat()).build();
    const signed = tx.signature[0];

    // console.log('Unsigned Transaction:', txUnsigned.toJson());
    // console.log('Rebuilt Transaction:', tx2.toJson());

    should.equal(tx2.toBroadcastFormat(), txUnsigned.toBroadcastFormat());
    should.equal(tx2.signablePayload.toString('hex'), txUnsigned.signablePayload.toString('hex'));

    const txBuilder2 = factory.getTransferBuilderV2();
    txBuilder2.from(transactionBase64);
    await txBuilder2.addSignature({ pub: wallet.pub }, Buffer.from(bs58.decode(signed)));

    const signedTx = await txBuilder2.build();
    should.equal(signedTx.type, tx.type);

    const rawSignedTx = signedTx.toBroadcastFormat();
    should.equal(rawSignedTx, rawTx);
  });
});
