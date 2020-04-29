import { getBuilder } from '../../../../src';
import should from 'should';

describe('ETC transaction builder should return an ETH Transaction builder', function() {
  const txBuilder: any = getBuilder('etc');
  txBuilder.toString().should.equal(getBuilder('eth').toString());
});
