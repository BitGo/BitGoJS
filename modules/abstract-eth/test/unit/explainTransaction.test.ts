import { BitGoAPI } from '@bitgo/sdk-api';
import { Hteth } from '@bitgo/sdk-coin-eth';

import * as should from 'should';

describe('AbstractEthLikeCoin explainTransaction', function () {
  let bitgo: BitGoAPI;
  let hteth;

  before(function () {
    bitgo = new BitGoAPI({ env: 'test' });
    bitgo.register('hteth', Hteth.createInstance);
    hteth = bitgo.coin('hteth');
  });

  it('should explain a SingleSigSend transaction and return outputs', async function () {
    const txHex =
      '02f483088bb080830d4ae184012759d5830178749477aafabf1b7155f00292acf2be008e8fc9ef7b3a87038d7ea4c6800080c0808080';
    const feeInfo = { fee: '974670461244' };

    const explanation = await hteth.explainTransaction({
      txHex,
      feeInfo,
    });

    // Assertions to verify the bug is fixed
    should.exist(explanation);
    should.exist(explanation.id);
    explanation.id.should.equal('0x84270a6ec4defc63ff8f37d4e1c5195e6772c634b89450864ecd5e6a8360b2d3');

    should.exist(explanation.outputs);
    explanation.outputs.should.be.an.Array();
    explanation.outputs.length.should.equal(1, 'Should have exactly 1 output');

    // Verify output details
    const output = explanation.outputs[0];
    output.address.should.equal('0x77aafabf1b7155f00292acf2be008e8fc9ef7b3a');
    output.amount.should.equal('1000000000000000'); // 0.001 ETH

    // Verify output amount
    explanation.outputAmount.should.equal('1000000000000000');

    // Verify change outputs (should be empty for ETH)
    explanation.changeOutputs.should.be.an.Array();
    explanation.changeOutputs.length.should.equal(0);
    explanation.changeAmount.should.equal('0');

    // Verify fee
    explanation.fee.should.equal(feeInfo);
  });
});
