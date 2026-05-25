/**
 * @prettier
 */

import { bigIntToBufferBE, Secp256k1Curve } from '../../../src';

describe('secp256k1 curve implementation', function () {
  const sec256k1 = new Secp256k1Curve();
  const testValue = BigInt(12000);

  it('should properly generate a random number in the specified range', function () {
    const start = BigInt(1);
    const stop = sec256k1.order();
    const test = sec256k1.scalarRandom();
    const isOkay = test >= start && test <= stop;
    isOkay.should.equal(true);
  });

  it('should correctly perform scalar add', function () {
    const valueOne = sec256k1.scalarAdd(sec256k1.order() - BigInt(1), testValue);
    valueOne.should.equal(testValue - BigInt(1));
    const valueTwo = sec256k1.scalarAdd(BigInt(5), testValue);
    valueTwo.should.equal(BigInt(5) + testValue);
  });

  it('should correctly perform scalar sub', function () {
    const valueOne = sec256k1.scalarSub(BigInt(2) * testValue, testValue);
    valueOne.should.equal(testValue);
    const valueTwo = sec256k1.scalarSub(BigInt(5), testValue);
    valueTwo.should.equal(sec256k1.order() + (BigInt(5) - testValue));
  });

  it('should correctly perform scalar multiplication', function () {
    const valueOne = sec256k1.scalarMult(sec256k1.order(), testValue);
    valueOne.should.equal(BigInt(0));
    const valueTwo = sec256k1.scalarMult(BigInt(5), testValue);
    valueTwo.should.equal(BigInt(5) * testValue);
  });

  it('should correctly perform scalar reduce', function () {
    const valueOne = sec256k1.scalarReduce(sec256k1.order() + testValue);
    valueOne.should.equal(testValue);
    const valueTwo = sec256k1.scalarReduce(sec256k1.order() - testValue);
    valueTwo.should.equal(sec256k1.order() - testValue);
  });

  it('should correctly perform scalar negate', function () {
    const valueOne = sec256k1.scalarNegate(testValue);
    valueOne.should.equal(sec256k1.order() - testValue);
    const valueTwo = sec256k1.scalarNegate(sec256k1.order() - testValue);
    valueTwo.should.equal(testValue);
  });

  it('should correctly perform inverts', function () {
    // Had to convert bigint to string as comparison was not properly working in mocha
    const testOne = sec256k1.scalarInvert(BigInt(3)).toString();
    testOne.should.equal('77194726158210796949047323339125271901891709519383269588403442094345440996225');

    const testTwo = sec256k1.scalarInvert(sec256k1.order() + BigInt(1)).toString();
    testTwo.should.equal('1');

    const testThree = sec256k1
      .scalarInvert(BigInt('57657865876576467547584635432343132435146576543543134312435443514313234131324551034534'))
      .toString();
    testThree.should.equal('45199239020920791752653273479365580486664737121914751844510223387235717825519');

    const testFour = sec256k1.scalarInvert(BigInt('-23232424342224')).toString();
    testFour.should.equal('109007816100548644677753129517258866095932985532097924870123596204155595187610');

    const testFive = sec256k1.scalarInvert(testValue);
    testFive.toString().should.equal('16664411509403755791375590925833668071820872792496863322396593062116822075060');
    // Checking invert(invert(x)) === x
    sec256k1.scalarInvert(testFive).should.equal(testValue);
  });

  it('should correctly perform point add', function () {
    const A = BigInt('0x0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798');
    const B = BigInt('0x0252972572d465d016d4c501887b8df303eee3ed602c056b1eb09260dfa0da0ab2');
    const publicKey = '0x0' + sec256k1.pointAdd(A, B).toString(16);
    publicKey.should.equal('0x03e2d3ec45106a89f82e7d46400faefc191ed72344caa781bfa97677a999d0828e');
  });

  it('should correctly perform point multiplication', function () {
    const point = BigInt('0x032a574ea59cae80b09d6ba415746e9b031abfbe83f149b43b37be035b87164872');
    const scalar = testValue;
    const result = '0x' + sec256k1.pointMultiply(point, scalar).toString(16);
    result.should.equal('0x31887d9e82e359036f4e972eadc5635df991bccff35774e28c23b278cf696381e');
  });

  it('should correctly perform base point multiplication', function () {
    const privKey = BigInt('0x79FE45D61339181238E49424E905446A35497A8ADEA8B7D5241A1E7F2C95A04D');
    const publicKey = '0x0' + sec256k1.basePointMult(privKey).toString(16);
    publicKey.should.equal('0x032a574ea59cae80b09d6ba415746e9b031abfbe83f149b43b37be035b87164872');
  });

  it('should correctly verify signature', function () {
    const publicKey = BigInt('0x33ccfc7998b1ce2fad8b3f287d873f07ca8b3037897c2136c11100c02213c028e');
    const signature = Buffer.from(
      '006a43d5da66ec4b4c6eb307d18791b9744cc59dd2402ad395bb9efb513898c07f767139118b76e387564bf572b2cc481dbf3068b7ac27620f83a2819d735b7e5f',
      'hex'
    );
    const message = bigIntToBufferBE(BigInt('0xbe5548911159dca31c02102c9df8c842adb50ac6def360c343ee5586f2749c0c'));
    let verify = sec256k1.verify(message, signature, publicKey);
    verify.should.equal(true);
    const messageWrong = bigIntToBufferBE(BigInt('0xd3b91b70417e766b738288cb1c5f6ef13a607011134544d4bce2ebf6ed5944ef'));
    verify = sec256k1.verify(messageWrong, signature, publicKey);
    verify.should.equal(false);
  });

  it('should have the correct curve order', function () {
    const curveOrder = sec256k1.order().toString(16).toUpperCase();
    curveOrder.should.equal('FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141');
  });
});
