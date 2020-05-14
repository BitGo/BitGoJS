import should from 'should';
import { TransferBuilder } from '../../../../src/coin/eth';
import * as testData from '../../../resources/eth/eth';

describe('Eth send multi sig builder', function() {
  describe('shuld build', () => {
    it('should succeed', async () => {
      const builder = new TransferBuilder()
        .data('0x')
        .expirationTime(1590078260)
        .amount(0.01)
        .to('0x7325A3F7d4f9E86AE62Cf742426078C3755730d5')
        .sequenceId(2)
        .key('8CAA00AE63638B0542A304823D66D96FF317A576F692663DB2F85E60FAB2590C');
      const result = builder.build();
      should.equal(result, testData.SEND_FOUNDS_DATA);
    });
    it('should fail if a key param is missing', () => {
      const builder = new TransferBuilder()
        .amount(0.01)
        .to('0x7325A3F7d4f9E86AE62Cf742426078C3755730d5')
        .sequenceId(2);
      should.throws(() => builder.build());
    });
    it('should fail if a sequenceId param is missing', () => {
      const builder = new TransferBuilder()
        .amount(0.01)
        .to('0x7325A3F7d4f9E86AE62Cf742426078C3755730d5')
        .key('8CAA00AE63638B0542A304823D66D96FF317A576F692663DB2F85E60FAB2590C');
      should.throws(() => builder.build());
    });
    it('should fail if a destination param is missing', () => {
      const builder = new TransferBuilder()
        .amount(0.01)
        .sequenceId(2)
        .key('8CAA00AE63638B0542A304823D66D96FF317A576F692663DB2F85E60FAB2590C');
      should.throws(() => builder.build());
    });
    it('should fail if a amount param is missing', () => {
      const builder = new TransferBuilder()
        .to('0x7325A3F7d4f9E86AE62Cf742426078C3755730d5')
        .sequenceId(2)
        .key('8CAA00AE63638B0542A304823D66D96FF317A576F692663DB2F85E60FAB2590C');
      should.throws(() => builder.build());
    });
  });
});
