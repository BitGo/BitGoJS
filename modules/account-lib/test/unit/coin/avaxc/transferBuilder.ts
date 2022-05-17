import should from 'should';
import { TransferBuilder as AvaxCTransferBuilder } from '../../../../src/coin/avaxc';
import { AvaxC, Eth, getBuilder } from '../../../../src';
import * as testData from '../../../resources/avaxc/avaxc';
import { TransactionType } from '@bitgo/sdk-core';

// import * as testData from '../../../resources/avaxc/avaxc';
const amount = '20000';
const toAddress = '0x7325A3F7d4f9E86AE62Cf742426078C3755730d5';
const keyPair = new AvaxC.KeyPair();
const key = keyPair.getKeys().prv as string;
const tokensNames = [
  'avaxc:png',
  'avaxc:xava',
  'avaxc:klo',
  'avaxc:joe',
  'avaxc:qi',
  'avaxc:usdt',
  'avaxc:usdc',
  'avaxc:link',
  'tavaxc:link',
];

let txBuilder: AvaxC.TransactionBuilder;
const contractAddress = testData.TEST_ACCOUNT.ethAddress;
const initTxBuilder = (): void => {
  txBuilder = getBuilder('tavaxc') as AvaxC.TransactionBuilder;
  txBuilder.fee({
    fee: '280000000000',
    gasLimit: '7000000',
  });
  txBuilder.counter(1);
  txBuilder.type(TransactionType.Send);
  txBuilder.contract(contractAddress);
};

describe('AVAXERC20 Tokens', () => {
  tokensNames.forEach((tokenName) => {
    it(tokenName + ' token transfer should succeed', async () => {
      const builder = new AvaxCTransferBuilder()
        .coin(tokenName)
        .expirationTime(1590078260)
        .amount(amount)
        .to(toAddress)
        .contractSequenceId(2)
        .key(key);
      const result = builder.signAndBuild();
      const decode = Eth.Utils.decodeTokenTransferData(result);
      should.equal(decode.amount, '20000');
      should.equal(decode.expireTime, 1590078260);
      should.equal(decode.sequenceId, 2);
      should.equal(decode.to.toLowerCase(), toAddress.toLowerCase());
    });
  });

  it('a send token transaction', async () => {
    const amount = '100';

    initTxBuilder();
    txBuilder.contract(contractAddress);
    txBuilder
      .transfer()
      .coin('tavaxc:link')
      .amount(amount)
      .to(testData.TEST_ACCOUNT_2.ethAddress)
      .expirationTime(1590066728)
      .contractSequenceId(5)
      .key(testData.OWNER_2.ethKey);
    txBuilder.sign({
      key: testData.OWNER_1.ethKey,
    });
    const tx = await txBuilder.build();
    should.equal(tx.signature.length, 2);
    should.equal(tx.inputs.length, 1);
    should.equal(tx.inputs[0].address.toLowerCase(), contractAddress.toLowerCase());
    should.equal(tx.inputs[0].value, amount);
    should.equal(tx.inputs[0].coin, 'tavaxc:link');

    should.equal(tx.outputs.length, 1);
    should.equal(tx.outputs[0].address.toLowerCase(), testData.TEST_ACCOUNT_2.ethAddress.toLowerCase());
    should.equal(tx.outputs[0].value, amount);
    should.equal(tx.outputs[0].coin, 'tavaxc:link');
  });
});
