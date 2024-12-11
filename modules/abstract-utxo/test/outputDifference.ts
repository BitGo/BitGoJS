import 'should';
import { outputDifference } from '../src/transaction/fixedScript/parseTransaction';

describe('Missing output detection', function () {
  it('should recognize count mismatch dupes', function () {
    const expectedOutputs = [
      {
        address: '2N6eb6Gosm2jt4o3djFLjb4kuKyPgAj8teZ',
        amount: '300000',
      },
      {
        amount: '300000',
        address: '2N6eb6Gosm2jt4o3djFLjb4kuKyPgAj8teZ',
      },
    ];

    const actualOutputs = [
      {
        address: '2N6eb6Gosm2jt4o3djFLjb4kuKyPgAj8teZ',
        amount: 300000,
      },
      {
        address: '2N2womedYhTC3YCDtviFte5G7teQczpVcds',
        amount: 15349374,
      },
    ];
    // missing should be one entry of the two

    const missingOutputs = outputDifference(expectedOutputs, actualOutputs);

    missingOutputs.length.should.equal(1);
    missingOutputs[0].address.should.equal('2N6eb6Gosm2jt4o3djFLjb4kuKyPgAj8teZ');
    missingOutputs[0].amount.should.equal('300000');
  });

  it('should be order-agnostic', function () {
    const expectedOutputs = [
      {
        address: '2N6eb6Gosm2jt4o3djFLjb4kuKyPgAj8teZ',
        amount: '300000',
      },
      {
        amount: '300000',
        address: '2N6eb6Gosm2jt4o3djFLjb4kuKyPgAj8teZ',
      },
    ];

    const actualOutputs = [
      {
        address: '2N2womedYhTC3YCDtviFte5G7teQczpVcds',
        amount: 15349374,
      },
      {
        address: '2N6eb6Gosm2jt4o3djFLjb4kuKyPgAj8teZ',
        amount: 300000,
      },
    ];
    // missing should be one entry of the two

    const missingOutputs = outputDifference(expectedOutputs, actualOutputs);

    missingOutputs.length.should.equal(1);
    missingOutputs[0].address.should.equal('2N6eb6Gosm2jt4o3djFLjb4kuKyPgAj8teZ');
    missingOutputs[0].amount.should.equal('300000');
  });

  it('should preserve all dupes', function () {
    const expectedOutputs = [
      {
        address: '2N6eb6Gosm2jt4o3djFLjb4kuKyPgAj8teZ',
        amount: '300000',
      },
      {
        amount: '300000',
        address: '2N6eb6Gosm2jt4o3djFLjb4kuKyPgAj8teZ',
      },
    ];

    const actualOutputs = [
      {
        address: '2N2womedYhTC3YCDtviFte5G7teQczpVcds',
        amount: 15349374,
      },
    ];
    // missing should be one entry of the two

    const missingOutputs = outputDifference(expectedOutputs, actualOutputs);

    missingOutputs.length.should.equal(2);
    missingOutputs[0].address.should.equal('2N6eb6Gosm2jt4o3djFLjb4kuKyPgAj8teZ');
    missingOutputs[1].address.should.equal('2N6eb6Gosm2jt4o3djFLjb4kuKyPgAj8teZ');
    missingOutputs[0].amount.should.equal('300000');
    missingOutputs[1].amount.should.equal('300000');
  });
});
