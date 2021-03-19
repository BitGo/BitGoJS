import should from 'should';

import { TransactionType } from '../../../../src/coin/baseCoin/';
import * as testData from '../../../resources/eos/eos';
import { getBuilder, Eos } from '../../../../src';
import { KeyPair } from '../../../../src/coin/eos';
import BigNumber from 'bignumber.js';

describe('EOS Transaction builder', function() {
//   const defaultKeyPair = new Eos.KeyPair({
//     prv:
//       'xprv9s21ZrQH143K3D8TXfvAJgHVfTEeQNW5Ys9wZtnUZkqPzFzSjbEJrWC1vZ4GnXCvR7rQL2UFX3RSuYeU9MrERm1XBvACow7c36vnz5iYyj2',
//   });

  describe('should parse', () => {
    it('an unsigned init transaction', async () => {
      const txBuilder: any = getBuilder('eos');
      txBuilder.from(testData.initializationTransaction);
      const tx = await txBuilder.build();
    //   console.log('THE TX', tx)
    //   tx.id.should.equal('');
    //   tx.type.should.equal(TransactionType.WalletInitialization);
    //   tx.source.should.equal('tz1VRjRpVKnv16AVprFH1tkDn4TDfVqA893A');
    //   should.equal(tx.inputs.length, 1);
    //   should.equal(tx.outputs.length, 1);
    //   tx.inputs[0].address.should.equal('tz1VRjRpVKnv16AVprFH1tkDn4TDfVqA893A');
    //   tx.inputs[0].value.should.equal('1004764');
    //   tx.outputs[0].address.should.equal('');
    //   tx.outputs[0].value.should.equal('1000000');
    //   should.not.exist(tx.delegate);
    //   tx.signature.length.should.equal(0);
    //   Object.keys(tx.getIndexesByTransactionType()).length.should.equal(1);
    //   tx.owners.length.should.equal(3);
    //   tx.owners[0].should.equal('sppk7ZWB8diU2TWehxdkWCV2DTFvn1hPz4qLjiD3nJQozKnoSEnSC8b');
    //   tx.owners[1].should.equal('sppk7Zq9KPtwkzkgAsha4jU29C43McgP2skK56tjd7KJjhcmH6AZC1F');
    //   tx.owners[2].should.equal('sppk7d2ztzbrLdBaTB7yzaWRkPfcWGsrNQNJdkBE9bCTSSzekLNzpvf');
    });
  });
});