import { coins } from '@bitgo/statics';
import { Transaction } from '../../src/lib';
import { Transaction as SolTransaction } from '@solana/web3.js';
import { getBuilderFactory } from './getBuilderFactory';

describe('Sol Transaction', () => {
  const coin = coins.get('tsol');

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
          userPublicKey: '3wxBJB1gkkvkd9mwoi3fjsUMSfvh22CAWhG83JtDGXz3',
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

    const tx = new Transaction(coin);
    tx.fromRawTransaction(
      transaction.serialize({ requireAllSignatures: false, verifySignatures: false }).toString('base64')
    );

    const factory = getBuilderFactory('tsol');
    const builder = factory.from(transactionBase64);
    const newtx = builder.from(transactionBase64);
    console.log('newtx', newtx);
  });
});
