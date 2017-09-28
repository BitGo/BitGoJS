require('should');

const TestV2BitGo = require('../../lib/test_bitgo');

describe('RMG:', function() {
  let bitgo;
  let basecoin;

  before(function() {
    bitgo = new TestV2BitGo({ env: 'test' });
    bitgo.initializeTestVars();
    return bitgo.authenticateTestUser(bitgo.testUserOTP())
    .then(function() {
      basecoin = bitgo.coin('trmg');
    });
  });

  it('Should explain transaction', function() {
    const txHex = '01000000018ff8476a60aaf5af8fb9fcf76430e07d53c8d3be512c78ebd42456711dddf9a6000000006a21025ceeba2ab4a635df2c0301a3d773da06ac5a18a7c3e0d09a795d7e57d233edf14730440220419c3c5f24da5709f946de50844bc3209f1bb0c6e916b9217795d0602b2cfe82022047e94c4ebe2fdc199c947ec577603ea8885f654f8c07b2aeb224ed0e075e7c1a01ffffffff0100f2052a010000001d521435dbbf04bca061e49dace08f858d8775c0a57c8e030000015153ba00000000';
    const explanation = basecoin.explainTransaction({ txHex: txHex });
    explanation.should.have.property('id');
    explanation.should.have.property('outputAmount');
    explanation.should.have.property('changeAmount');
    explanation.should.have.property('outputs');
    explanation.should.have.property('changeOutputs');
    explanation.should.have.property('displayOrder');
    explanation.id.should.equal('dae902f2224fce1d0c482b1d0c65b29d3e36c419d15e2a714d163edce7b10280');
    explanation.outputs.length.should.equal(1);
    explanation.outputs[0].address.should.equal('TCq7ZvyjTugZ3xDY8m1Mdgm95v4QmMpMfm3Fg8GCeE1uf');
    explanation.outputs[0].amount.should.equal(5000000000);
  });
});
