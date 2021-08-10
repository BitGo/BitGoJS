import should from 'should';
import { getBuilder, BaseCoin } from '../../../../src';
import { TransactionBuilder, Transaction } from '../../../../src/coin/avaxc';
import { TxData } from '../../../../src/coin/eth/iface';
import { walletInitBroadcastString, walletInitWithCounterZeroBroadcastString, TEST_ACCOUNT_2, TEST_ACCOUNT } from '../../../resources/avaxc/avaxc';

describe('Avax C-Chain Transfer Transaction', function () {
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

  it('Should build transfer tx', async function () {
    const builder = getBuilder('tavaxc') as TransactionBuilder;
    builder.fee({
      fee: '280000000000',
      gasLimit: '7000000',
    });
    builder.counter(1);
    builder.type(BaseCoin.TransactionType.Send);
    builder.contract(TEST_ACCOUNT.ethAddress);
    builder
      .transfer()
      .amount('100000000000000000') // This represents 0.1 Avax = 0.1 Ether
      .contractSequenceId(1)
      .expirationTime(50000)
      .to(TEST_ACCOUNT_2.ethAddress)
      .key(owners.owner_2.ethKey);
    builder.sign({ key: owners.owner_1.ethKey });

    const tx = await builder.build();

    const txJson: TxData = tx.toJson();

    should.exists(txJson.chainId);
    should.exists(txJson.from);
    should.exists(txJson.to);
    txJson.nonce.should.equals(1);
    txJson.from!.should.equals(owners.owner_1.ethAddress);
    txJson.chainId!.should.equals('0xa869');
    txJson.gasLimit.should.equals('7000000');
    txJson.gasPrice.should.equals('280000000000');
  });

  it('Should build with counter 0 if not manually defined', async function () {
    const builder = getBuilder('tavaxc') as TransactionBuilder;
    builder.fee({
      fee: '280000000000',
      gasLimit: '7000000',
    });
    builder.type(BaseCoin.TransactionType.Send);
    builder.contract(TEST_ACCOUNT.ethAddress);
    builder
      .transfer()
      .amount('100000000000000000') // This represents 0.1 Avax = 0.1 Ether
      .contractSequenceId(1)
      .expirationTime(50000)
      .to(TEST_ACCOUNT_2.ethAddress)
      .key(owners.owner_2.ethKey);
    builder.sign({ key: owners.owner_1.ethKey });

    const tx = await builder.build();

    const txJson: TxData = tx.toJson();

    should.exists(txJson.chainId);
    should.exists(txJson.from);
    should.exists(txJson.to);
    txJson.nonce.should.equals(0);
    txJson.from!.should.equals(owners.owner_1.ethAddress);
    txJson.chainId!.should.equals('0xa869');
    txJson.gasLimit.should.equals('7000000');
    txJson.gasPrice.should.equals('280000000000');
  });

  it('Should fail building transfer tx without fee', async function () {
    const builder = getBuilder('tavaxc') as TransactionBuilder;
    builder.counter(1);
    builder.type(BaseCoin.TransactionType.Send);
    builder.contract(TEST_ACCOUNT.ethAddress);
    builder
      .transfer()
      .amount('100000000000000000') // This represents 0.1 Avax = 0.1 Ether
      .contractSequenceId(1)
      .expirationTime(50000)
      .to(TEST_ACCOUNT_2.ethAddress)
      .key(owners.owner_2.ethKey);
    builder.sign({ key: owners.owner_1.ethKey });

    builder.build().should.be.rejectedWith('Invalid transaction: missing fee');
  });

  it('Should fail building transfer without type', async function () {
    const builder = getBuilder('tavaxc') as TransactionBuilder;
    builder.fee({
      fee: '280000000000',
      gasLimit: '7000000',
    });
    builder.counter(1);
    builder.contract(TEST_ACCOUNT.ethAddress);
    //builder.type(BaseCoin.TransactionType.Send);
    builder
      .transfer()
      .amount('100000000000000000') // This represents 0.1 Avax = 0.1 Ether
      .contractSequenceId(1)
      .expirationTime(50000)
      .to(TEST_ACCOUNT_2.ethAddress)
      .key(owners.owner_2.ethKey);
    builder.sign({ key: owners.owner_1.ethKey });

    const tx = await builder.build();

    const txJson: TxData = tx.toJson();

    should.exists(txJson.chainId);
    should.exists(txJson.from);
    should.exists(txJson.to);
    txJson.nonce.should.equals(1);
    txJson.from!.should.equals(owners.owner_1.ethAddress);
    txJson.chainId!.should.equals('0xa869');
    txJson.gasLimit.should.equals('7000000');
    txJson.gasPrice.should.equals('280000000000');
  });
});
