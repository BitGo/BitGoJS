import should from 'should';
import { TransactionType } from '@bitgo/sdk-core';
import { ETHTransactionType, Fee, flushForwarderTokensMethodId, KeyPair, Transaction } from '../../../src';
import { getBuilder } from '../getBuilder';

describe('Eth Transaction builder flush tokens', function () {
  const defaultKeyPair = new KeyPair({
    prv: 'FAC4D04AA0025ECF200D74BC9B5E4616E4B8338B69B61362AAAD49F76E68EF28',
  });

  interface FlushTokensDetails {
    forwarderAddress?: string;
    tokenAddress?: string;
    contractAddress?: string;
    counter?: number;
    fee?: Fee;
    key?: KeyPair;
  }

  const buildTransaction = async function (details: FlushTokensDetails): Promise<Transaction> {
    const txBuilder: any = getBuilder('teth');
    txBuilder.type(TransactionType.FlushTokens);

    if (details.forwarderAddress !== undefined) {
      txBuilder.forwarderAddress(details.forwarderAddress);
    }

    if (details.tokenAddress !== undefined) {
      txBuilder.tokenAddress(details.tokenAddress);
    }

    if (details.fee !== undefined) {
      txBuilder.fee(details.fee);
    }

    if (details.contractAddress !== undefined) {
      txBuilder.contract(details.contractAddress);
    }

    if (details.counter !== undefined) {
      txBuilder.counter(details.counter);
    }

    if (details.key !== undefined) {
      txBuilder.sign({ key: details.key.getKeys().prv });
    }

    return await txBuilder.build();
  };

  describe('should build', () => {
    it('a wallet flush forwarder transaction', async () => {
      const tx = await buildTransaction({
        fee: {
          fee: '10',
          gasLimit: '1000',
        },
        counter: 1,
        forwarderAddress: '0x53b8e91bb3b8f618b5f01004ef108f134f219573',
        tokenAddress: '0xbcf935d206ca32929e1b887a07ed240f0d8ccd22',
        contractAddress: '0x8f977e912ef500548a0c3be6ddde9899f1199b81',
      });

      tx.type.should.equal(TransactionType.FlushTokens);
      const txJson = tx.toJson();
      txJson.gasLimit.should.equal('1000');
      txJson._type.should.equals(ETHTransactionType.LEGACY);
      txJson.gasPrice!.should.equal('10');
      should.equal(txJson.nonce, 1);
      txJson.data.should.startWith(flushForwarderTokensMethodId);
    });

    it('a wallet flush forwarder transaction with eip1559 fee model', async () => {
      const tx = await buildTransaction({
        fee: {
          fee: '30',
          eip1559: {
            maxPriorityFeePerGas: '5',
            maxFeePerGas: '30',
          },
          gasLimit: '1000',
        },
        counter: 1,
        forwarderAddress: '0x53b8e91bb3b8f618b5f01004ef108f134f219573',
        tokenAddress: '0xbcf935d206ca32929e1b887a07ed240f0d8ccd22',
        contractAddress: '0x8f977e912ef500548a0c3be6ddde9899f1199b81',
      });

      tx.type.should.equal(TransactionType.FlushTokens);
      const txJson = tx.toJson();
      txJson.gasLimit.should.equal('1000');
      txJson._type.should.equals(ETHTransactionType.EIP1559);
      txJson.maxFeePerGas!.should.equal('30');
      txJson.maxPriorityFeePerGas!.should.equal('5');
      should.equal(txJson.nonce, 1);
      txJson.data.should.startWith(flushForwarderTokensMethodId);
    });

    it('a wallet flush forwarder transaction with nonce 0', async () => {
      const tx = await buildTransaction({
        fee: {
          fee: '10',
          gasLimit: '1000',
        },
        counter: 0,
        forwarderAddress: '0x53b8e91bb3b8f618b5f01004ef108f134f219573',
        tokenAddress: '0xbcf935d206ca32929e1b887a07ed240f0d8ccd22',
        contractAddress: '0x8f977e912ef500548a0c3be6ddde9899f1199b81',
      });

      tx.type.should.equal(TransactionType.FlushTokens);
      const txJson = tx.toJson();
      txJson.gasLimit.should.equal('1000');
      txJson._type.should.equals(ETHTransactionType.LEGACY);
      txJson.gasPrice!.should.equal('10');
      should.equal(txJson.nonce, 0);
      txJson.data.should.startWith(flushForwarderTokensMethodId);
    });

    it('an unsigned flush transaction from serialized', async () => {
      const tx = await buildTransaction({
        fee: {
          fee: '10',
          gasLimit: '1000',
        },
        counter: 0,
        forwarderAddress: '0x53b8e91bb3b8f618b5f01004ef108f134f219573',
        tokenAddress: '0xbcf935d206ca32929e1b887a07ed240f0d8ccd22',
        contractAddress: '0x8f977e912ef500548a0c3be6ddde9899f1199b81',
      });
      const serialized = tx.toBroadcastFormat();

      // now rebuild from the signed serialized tx and make sure it stays the same
      const newTxBuilder: any = getBuilder('teth');
      newTxBuilder.from(serialized);
      const newTx = await newTxBuilder.build();
      should.equal(newTx.toBroadcastFormat(), serialized);
      newTx.toJson().data.should.startWith(flushForwarderTokensMethodId);
      should.equal(newTx.toJson().v, '0x77');
    });

    it('a signed flush transaction from serialized', async () => {
      const tx = await buildTransaction({
        fee: {
          fee: '10',
          gasLimit: '1000',
        },
        counter: 0,
        forwarderAddress: '0x53b8e91bb3b8f618b5f01004ef108f134f219573',
        tokenAddress: '0xbcf935d206ca32929e1b887a07ed240f0d8ccd22',
        contractAddress: '0x8f977e912ef500548a0c3be6ddde9899f1199b81',
        key: defaultKeyPair,
      });
      const serialized = tx.toBroadcastFormat();

      // now rebuild from the signed serialized tx and make sure it stays the same
      const newTxBuilder: any = getBuilder('teth');
      newTxBuilder.from(serialized);
      const newTx = await newTxBuilder.build();
      should.equal(newTx.toBroadcastFormat(), serialized);
      should.equal(newTx.id, '0x5bfd4c6b9ae9dfbc9e062247c0debe4e1c6870a76c420ce7f6e335390420dcd6');
      const txJson = newTx.toJson();
      should.exist(txJson.v);
      should.exist(txJson.r);
      should.exist(txJson.s);
      should.exist(txJson.from);
    });
  });

  describe('should fail to build', () => {
    it('a transaction without fee', async () => {
      await buildTransaction({
        counter: 0,
        forwarderAddress: '0x53b8e91bb3b8f618b5f01004ef108f134f219573',
        tokenAddress: '0xbcf935d206ca32929e1b887a07ed240f0d8ccd22',
        contractAddress: '0x8f977e912ef500548a0c3be6ddde9899f1199b81',
      }).should.be.rejectedWith('Invalid transaction: missing fee');
    });

    it('a transaction without contractAddress', async () => {
      await buildTransaction({
        fee: {
          fee: '10',
          gasLimit: '10',
        },
        counter: 0,
        forwarderAddress: '0x53b8e91bb3b8f618b5f01004ef108f134f219573',
        tokenAddress: '0xbcf935d206ca32929e1b887a07ed240f0d8ccd22',
      }).should.be.rejectedWith('Invalid transaction: missing contract address');
    });

    it('a transaction without tokenAddress', async () => {
      await buildTransaction({
        fee: {
          fee: '10',
          gasLimit: '10',
        },
        counter: 0,
        forwarderAddress: '0x53b8e91bb3b8f618b5f01004ef108f134f219573',
        contractAddress: '0x8f977e912ef500548a0c3be6ddde9899f1199b81',
      }).should.be.rejectedWith('Invalid transaction: missing token address');
    });

    it('a transaction without forwarderAddress', async () => {
      await buildTransaction({
        fee: {
          fee: '10',
          gasLimit: '10',
        },
        counter: 0,
        tokenAddress: '0xbcf935d206ca32929e1b887a07ed240f0d8ccd22',
        contractAddress: '0x8f977e912ef500548a0c3be6ddde9899f1199b81',
      }).should.be.rejectedWith('Invalid transaction: missing forwarder address');
    });

    it('a transaction with invalid counter', async () => {
      await buildTransaction({
        fee: {
          fee: '10',
          gasLimit: '10',
        },
        counter: -1,
        tokenAddress: '0xbcf935d206ca32929e1b887a07ed240f0d8ccd22',
        contractAddress: '0x8f977e912ef500548a0c3be6ddde9899f1199b81',
      }).should.be.rejectedWith('Invalid counter: -1');
    });
  });
});
