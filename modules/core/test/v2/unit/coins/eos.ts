import * as accountLib from '@bitgo/account-lib';
import * as EosResources from '../../fixtures/coins/eos';
import { TestBitGo } from '../../../lib/test_bitgo';
import { EosTransactionExplanation } from '../../../../src/v2/coins/eos';

describe('Eos:', function () {
  let bitgo;
  let basecoin;
  const sender = EosResources.accounts.account1;
  const receiver = EosResources.accounts.account2;
  before(function () {
    bitgo = new TestBitGo({ env: 'test' });
    bitgo.initializeTestVars();
    basecoin = bitgo.coin('teos');
  });

  const createBaseBuilder = () => {
    const factory = accountLib.register('eos', accountLib.Eos.TransactionBuilderFactory);
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const txBuilder = factory.getEosTransactionBuilder();
    txBuilder
      .testnet()
      .expiration('2019-09-19T16:39:15')
      .refBlockNum(100)
      .refBlockPrefix(100);
    return txBuilder;
  };
  it('should generate a valid transaction signature', async function () {
    const signatureData = EosResources.transactions.transferTransaction.serializedTransaction;
    const tx = {
      txHex: signatureData,
      headers: {
        ref_block_num: 1,
        ref_block_prefix: 'asd',
      },
      transaction: {
        signatures: [],
        packed_trx: signatureData,
        compression: 'none',
      },
      recipients: [{ }],
    };
    const seed = Buffer.from('c3b09c24731be2851b624d9d5b3f60fa129695c24071768d15654bea207b7bb6', 'hex');
    const keyPair = basecoin.generateKeyPair(seed);
    await basecoin.signTransaction({ txPrebuild: tx, keyPair: keyPair });
  });

  it('should explain a transaction hex', async function () {
    const explain = await basecoin.explainTransaction({
      txHex: EosResources.transactions.transferTransaction.serializedTransaction,
      feeInfo: { fee: '0' },
    }) as EosTransactionExplanation;
    explain.outputs[0].address.should.equal(receiver.name);
    explain.outputs[0].amount.should.equal('1.0000 SYS');
    explain.outputs[0].memo?.should.equal('Some memo');
    explain.expiration?.should.equal('2019-09-19T16:39:15.000');
    explain.ref_block_num?.should.equal(100);
    explain.ref_block_prefix?.should.equal(100);
    explain.actions[0].name.should.equal('transfer');
  });

  it('should explain a transfer transaction', async function () {
    const txBuilder = createBaseBuilder();
    txBuilder
      .sign({ key: sender.privateKey });
    txBuilder
      .transferActionBuilder('eosio.token', [sender.name])
      .from(sender.name)
      .to(receiver.name)
      .quantity('1.0000 SYS')
      .memo('Some memo');
    txBuilder.sign({ key: EosResources.accounts.account3.privateKey });
    const tx = await txBuilder.build();
    const explain = await basecoin.explainTransaction({
      txHex: tx.toBroadcastFormat().serializedTransaction,
      feeInfo: { fee: '0' },
    }) as EosTransactionExplanation;
    explain.outputs[0].address.should.equal(receiver.name);
    explain.outputs[0].amount.should.equal('1.0000 SYS');
    explain.outputs[0].memo?.should.equal('Some memo');
    explain.expiration?.should.equal('2019-09-19T16:39:15.000');
    explain.ref_block_num?.should.equal(100);
    explain.ref_block_prefix?.should.equal(100);
    explain.actions[0].name.should.equal('transfer');
  });

  it('should explain a powerup transaction', async function () {
    const txBuilder = createBaseBuilder();
    txBuilder
      .testnet()
      .expiration('2019-09-19T16:39:15')
      .refBlockNum(100)
      .refBlockPrefix(100)
      .sign({ key: sender.privateKey });
    txBuilder
      .powerupActionBuilder('eosio', [sender.name])
      .payer(sender.name)
      .receiver(receiver.name)
      .days(1)
      .netFrac('2000000000')
      .cpuFrac('8000000000')
      .maxPayment('10.0000 EOS');
    txBuilder.sign({ key: EosResources.accounts.account3.privateKey });
    const tx = await txBuilder.build();
    const explain = await basecoin.explainTransaction({
      txHex: tx.toBroadcastFormat().serializedTransaction,
      feeInfo: { fee: '0' },
    }) as EosTransactionExplanation;
    explain.expiration?.should.equal('2019-09-19T16:39:15.000');
    explain.ref_block_num?.should.equal(100);
    explain.ref_block_prefix?.should.equal(100);
    explain.actions[0].name.should.equal('powerup');
  });
});
