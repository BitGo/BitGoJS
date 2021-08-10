import should from 'should';
import { getBuilder, BaseCoin } from '../../../../src';
import { TransactionBuilder, Transaction } from '../../../../src/coin/avaxc';
import { TxData } from '../../../../src/coin/eth/iface';
import { walletInitBroadcastString, walletInitWithCounterZeroBroadcastString } from '../../../resources/avaxc/avaxc';

describe('Avax C-Chain Wallet Initialization Transaction', function () {
  const owners = {
    owner_1: {
      ethKey: '4ee089aceabf3ddbf748db79b1066c33b7d3ea1ab3eb7e325121bba2bff2f5ca',
      ethAddress: '0xae5a976e9426e0d46ccf8ef7d64ddc2f0b04e21b',
    },
    owner_2: {
      ethKey: 'c9e38f95d8a833086310a047b71418f2a6d45d02ebd682d2e5e40e4a05cf382e',
      ethAddress: '0x8295e364a8f7e23b9d510db955a576c255b1c368',
    },
    owner_3: {
      ethKey: '37c42f015311bc7c5bb98547e3e9e92673a9752455d0ea820ca83524a8e2bc03',
      ethAddress: '0x1f53d18ccb6f6058fe24a926a7d71fe0533df222',
    },
  };

  it('Should build walletInitialization', async function () {
    const builder = getBuilder('tavaxc') as TransactionBuilder;
    builder.fee({
      fee: '280000000000',
      gasLimit: '7000000',
    });
    builder.counter(1);
    builder.type(BaseCoin.TransactionType.WalletInitialization);
    builder.owner(owners.owner_1.ethAddress);
    builder.owner(owners.owner_2.ethAddress);
    builder.owner(owners.owner_3.ethAddress);
    builder.sign({ key: owners.owner_1.ethKey });

    const tx = await builder.build();

    const txJson: TxData = tx.toJson();

    should.exists(txJson.chainId);
    txJson.nonce.should.equals(1);
    txJson.chainId!.should.equals('0xa869');
    txJson.gasLimit.should.equals('7000000');
    txJson.gasPrice.should.equals('280000000000');
    tx.toBroadcastFormat().should.equals(walletInitBroadcastString);
  });

  it('Should build with counter 0 if not manually defined', async function () {
    const builder = getBuilder('tavaxc') as TransactionBuilder;
    builder.fee({
      fee: '280000000000',
      gasLimit: '7000000',
    });
    builder.type(BaseCoin.TransactionType.WalletInitialization);
    builder.owner(owners.owner_1.ethAddress);
    builder.owner(owners.owner_2.ethAddress);
    builder.owner(owners.owner_3.ethAddress);
    builder.sign({ key: owners.owner_1.ethKey });

    const tx = (await builder.build()) as Transaction;

    const txJson: TxData = tx.toJson();

    should.exists(txJson.chainId);
    txJson.nonce.should.equals(0);
    txJson.chainId!.should.equals('0xa869');
    txJson.gasLimit.should.equals('7000000');
    txJson.gasPrice.should.equals('280000000000');
    tx.toBroadcastFormat().should.equals(walletInitWithCounterZeroBroadcastString);
  });

  it('Should throw if building walletInitialization without fee', async function () {
    const builder = getBuilder('tavaxc') as TransactionBuilder;
    builder.counter(1);
    builder.type(BaseCoin.TransactionType.WalletInitialization);
    builder.owner(owners.owner_1.ethAddress);
    builder.owner(owners.owner_2.ethAddress);
    builder.owner(owners.owner_3.ethAddress);
    builder.sign({ key: owners.owner_1.ethKey });

    builder.build().should.be.rejectedWith('Invalid transaction: missing fee');
  });

  it('Should throw if building walletInitialization without type', async function () {
    const builder = getBuilder('tavaxc') as TransactionBuilder;
    builder.fee({
      fee: '280000000000',
      gasLimit: '7000000',
    });
    builder.counter(1);
    should.throws(
      () => builder.owner(owners.owner_1.ethAddress),
      (e) => e.message === 'Multisig wallet owner can only be set for initialization transactions',
    );
  });

  it('Should throw if building walletInitialization without owners', async function () {
    const builder = getBuilder('tavaxc') as TransactionBuilder;
    builder.fee({
      fee: '280000000000',
      gasLimit: '7000000',
    });
    builder.counter(1);
    builder.type(BaseCoin.TransactionType.WalletInitialization);
    should.throws(
      () => builder.sign({ key: owners.owner_1.ethKey }),
      (e) => e.message === 'Cannot sign an wallet initialization transaction without owners',
    );
  });

  it('Should throw if building walletInitialization with only one owner', async function () {
    const builder = getBuilder('tavaxc') as TransactionBuilder;
    builder.fee({
      fee: '280000000000',
      gasLimit: '7000000',
    });
    builder.counter(1);
    builder.type(BaseCoin.TransactionType.WalletInitialization);
    builder.owner(owners.owner_1.ethAddress);
    builder.sign({ key: owners.owner_1.ethKey });

    builder.build().should.be.rejectedWith('Invalid transaction: wrong number of owners -- required: 3, found: 1');
  });

  it('Should throw if building walletInitialization with only two owners', async function () {
    const builder = getBuilder('tavaxc') as TransactionBuilder;
    builder.fee({
      fee: '280000000000',
      gasLimit: '7000000',
    });
    builder.counter(1);
    builder.type(BaseCoin.TransactionType.WalletInitialization);
    builder.owner(owners.owner_1.ethAddress);
    builder.owner(owners.owner_2.ethAddress);
    builder.sign({ key: owners.owner_1.ethKey });

    builder.build().should.be.rejectedWith('Invalid transaction: wrong number of owners -- required: 3, found: 2');
  });
});
