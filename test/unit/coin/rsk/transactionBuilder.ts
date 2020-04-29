import { getBuilder } from '../../../../src';
import should from 'should';

describe('RSK transaction builder should return an ETH Transaction builder', function() {
  const txBuilder: any = getBuilder('rsk');
  txBuilder.toString().should.equal(getBuilder('eth').toString());
});
