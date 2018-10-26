const should = require('should');

const TestV2BitGo = require('../../../lib/test_bitgo');
const prova = require('prova-lib');

describe('RMG:', function() {
  let bitgo;
  let basecoin;

  before(function() {
    bitgo = new TestV2BitGo({ env: 'test' });
    bitgo.initializeTestVars();
    basecoin = bitgo.coin('trmg');
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

  describe('Should test address generation', () => {

    const keychains = [
      {
        pub: 'xpub661MyMwAqRbcGiQhVk1J7cD1YodF9tc5Y1B8vpTjjB1pcB1J1m1QX8fMtYP2sYqFmW6J2ra69tNoARKjvTGo9cGUrbPbJdjwrSzGGzPzWWS',
        prv: 'xprv9s21ZrQH143K4ELEPiUHkUGGzmnkkRtEAnFY8S48AqUqjNg9UDh9yLLt3FcfATyCjbsMB9JCGHAD8MeBTAK1P7trFppkoswu5ZAsHYASfbk'
      },
      {
        pub: 'xpub661MyMwAqRbcFzLXuganogQvd7MrefQQqCcJP2ZDumnCdQecf5cw1P1nD5qBz8SNS1yCLSC9VqpNUWnQU3V6qmnPt2r21oXhicQFzPA6Lby',
        prv: 'xprv9s21ZrQH143K3WG4of3nSYUC55XNFCgZTyghae9cMSFDkcKU7YJgTahJMpdTY9CjCcjgSo2TJ635uUVx176BufUMBFpieKYVJD9J3VvrGRm',
        aspKeyId: 13
      },
      {
        pub: 'xpub661MyMwAqRbcFHpwWrzPB61U2CgBmdD21WNVM1JKUn9rEExkoGE4yafUVFbPSd78vdX8tWcEUQWaALFkU9fUbUM4Cc49DKEJSCYGRnbzCym',
        prv: 'xprv9s21ZrQH143K2okUQqTNox4jUAqhNAVAeHStYcthvScsMSdcFiupRnLzdxzfJithak5Zs92FQJeeJ9Jiya63KfUNxawuMZDCp2cGT9cdMKs',
        aspKeyId: 17
      }
    ];

    let coin;
    let testCoin;
    before(() => {
      coin = bitgo.coin('rmg');
      testCoin = bitgo.coin('trmg');
    });

    it('should generate standard address', () => {
      const generatedAddress = coin.generateAddress({ keychains });
      const generatedTestAddress = testCoin.generateAddress({ keychains });

      [generatedAddress, generatedTestAddress].map((currentAddress) => {
        currentAddress.chain.should.equal(0);
        currentAddress.index.should.equal(0);
        currentAddress.coinSpecific.outputScript.should.equal('5214d80d2328d0ade6089fe5904bf40f496760d1faff5d011153ba');
      });

      generatedAddress.address.should.equal('GQFXaqczsFNe4Br5cadienDQvC3k3ULwr4VTrrAjJ8gMx');
      generatedTestAddress.address.should.equal('TPkFJCop4d7vVHu44z8HcwP6DSKZ133ZLxNkthFZzck46');
    });

    it('should generate custom chain address', () => {
      const generatedAddress = coin.generateAddress({ keychains, chain: 1, index: 113 });
      const generatedTestAddress = testCoin.generateAddress({ keychains, chain: 1, index: 113 });

      [generatedAddress, generatedTestAddress].map((currentAddress) => {
        currentAddress.chain.should.equal(1);
        currentAddress.index.should.equal(113);
        currentAddress.coinSpecific.outputScript.should.equal('5214c085b93b3cd4900f32364d2dfbf3cc0f7896c9d55d011153ba');
      });

      generatedAddress.address.should.equal('GNfgSrTM3djGhsLY4x5oaSmZWyb4gHuywPB8h88YVheW3');
      generatedTestAddress.address.should.equal('TNAQADeAF1UZ8yPWXMaNYbwEpDrsdrcbSH4RiyDL1PJj2');
    });

    it('should generate 3/3 address', () => {
      const generatedAddress = coin.generateAddress({ keychains, threshold: 3 });
      const generatedTestAddress = testCoin.generateAddress({ keychains, threshold: 3 });

      [generatedAddress, generatedTestAddress].map((currentAddress) => {
        currentAddress.chain.should.equal(0);
        currentAddress.index.should.equal(0);
        currentAddress.coinSpecific.outputScript.should.equal('5314d80d2328d0ade6089fe5904bf40f496760d1faff5d011153ba');
      });

      should(generatedAddress.address).equal(null);
      should(generatedTestAddress.address).equal(null);
    });
  });

  describe('RMG Signature Verification', () => {

    const txHex = '010000000152ff5e01929a5660e72ba6c4c5d48065ff518efa388a8ccbbe8ac8794f66f09002000000d52103057cf31112e18bab5fed7144568bc75ef369a04e87094d347044b1d117802b6447304402206d761c1937b27c71e4372b6288e95aa192d07407fe66588a5616da65ad6a28880220596645310f57e987296a6313dfbed682448343e32f4b09a436f71957e9c219e70121021497b39f2f32eeaa1083c52ee265d0fad85338fb82bf8c0ae4a1dbe746e4a45b483045022100bceefd4ac9ed65bd0960e6eeedf75ae32bb2a491437838b45ad59e556ee621df022070eb003e4deed0f80056159ec3c65cdd27bc90506ddb0202d113084f6e739dc801ffffffff0200a02526000000001a52140590ff812a7839b05fe89b68cd9e24c389947639605353bac8445a00000000001a5214c310015ff8d7bb5aa783d2f1020c7cf4e76340c0605353ba00000000';
    const tx = prova.Transaction.fromHex(txHex);
    const inputIndex = 0;
    const amount = 645915848;

    it('should verify signature', function shouldVerifySignature() {
      let isSignatureValid;

      isSignatureValid = basecoin.verifySignature(tx, inputIndex, amount);
      isSignatureValid.should.equal(true);

      isSignatureValid = basecoin.verifySignature(tx, inputIndex, amount, { publicKey: '03057cf31112e18bab5fed7144568bc75ef369a04e87094d347044b1d117802b64' });
      isSignatureValid.should.equal(true);

      isSignatureValid = basecoin.verifySignature(tx, inputIndex, amount, { publicKey: '03057cf31112e18bab5fed7144568bc75ef369a04e87094d347044b1d117802b645' });
      isSignatureValid.should.equal(false);

      isSignatureValid = basecoin.verifySignature(tx, inputIndex, amount, { publicKey: '03057cf31112e18bab5fed7144568bc75ef369a04e87094d347044b1d117802b64', signatureIndex: 0 });
      isSignatureValid.should.equal(true);

      isSignatureValid = basecoin.verifySignature(tx, inputIndex, amount, { publicKey: '03057cf31112e18bab5fed7144568bc75ef369a04e87094d347044b1d117802b64', signatureIndex: 1 });
      isSignatureValid.should.equal(false);

      isSignatureValid = basecoin.verifySignature(tx, inputIndex, amount, { signatureIndex: 1 });
      isSignatureValid.should.equal(true);

      isSignatureValid = basecoin.verifySignature(tx, inputIndex, amount, { signatureIndex: 2 });
      isSignatureValid.should.equal(false);
    });

  });

});
