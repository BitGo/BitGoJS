//
// Tests for JSBN
//
// Copyright 2014, BitGo, Inc.  All Rights Reserved.
//

var BigInteger = require('../../src/bitcoin/jsbn/jsbn');
var assert = require('assert');
var should = require('should');

describe('JSBN', function() {
  describe('BigInteger', function() {
    it('can execute common mathematical operations', function() {
      var a = new BigInteger(null);
      a.fromInt(25);
      var b = new BigInteger(null);
      b.fromInt(1002);

      assert.equal(a.add(b).valueOf(), 1027);

      var p = new BigInteger('e564d8b801a61f47', 16, true);
      var xp = new BigInteger('99246db2a3507fa', 16, true);

      xp = xp.add(p);

      assert.equal(xp.toString(16), 'eef71f932bdb2741');
    });

    it('can be signed', function() {
      var a = new BigInteger('1');
      var b = new BigInteger('2');
      var c = a.subtract(b);
      var d = new BigInteger(c);

      assert.equal(c.toByteArray().length, 1);
      assert.equal(d.toByteArray().length, 1);
      c.equals(d).should.be.true;

      a.fromInt(-13);
      assert.equal(a.valueOf(), -13);
    });

    it('can be compared', function() {
      var a, b;

      a = new BigInteger('983741897234', 10);
      b = new BigInteger('123981238416', 10);
      (a.compareTo(b)).should.be.greaterThan(0);

      a = new BigInteger('-1', 10);
      b = new BigInteger('1', 10);
      (a.compareTo(b)).should.be.lessThan(0);

      a = new BigInteger('1', 10);
      b = new BigInteger('-1', 10);
      (a.compareTo(b)).should.be.greaterThan(0);

      a = new BigInteger('1', 10);
      b = new BigInteger('1', 10);
      (a.compareTo(b)).should.equal(0);

      a = new BigInteger('0', 10);
      b = new BigInteger('0', 10);
      (a.compareTo(b)).should.equal(0);

      a = new BigInteger('-12461273864', 10);
      b = new BigInteger('29138479128374', 10);
      (a.compareTo(b)).should.be.lessThan(0);

      a = new BigInteger('9223372036854775807', 10);
      b = new BigInteger('-9223372036854775808', 10);
      (a.compareTo(b)).should.be.greaterThan(0);

      a = new BigInteger('-1', 10);
      b = new BigInteger('-9223372036854775808', 10);
      (a.compareTo(b)).should.be.greaterThan(0);

      a = new BigInteger('-1', 10);
      b = new BigInteger('9223372036854775807', 10);
      (a.compareTo(b)).should.be.lessThan(0);
    });

    it('can be converted to a string and vice versa', function() {
      var a;

      a = new BigInteger('1', 10);
      (a.toString(10)).should.equal('1');

      a = new BigInteger('112374128763487126349871263984761238', 10);
      (a.toString(10)).should.equal('112374128763487126349871263984761238');

      a = new BigInteger('0', 10);
      (a.toString(10)).should.equal('0');

      a = new BigInteger('-1', 10);
      (a.toString(10)).should.equal('-1');

      a = new BigInteger('-987341928347812763498237649812763498172634', 10);
      (a.toString(10)).should.equal('-987341928347812763498237649812763498172634');

      a = new BigInteger('ffff', 16, true);
      (a.toString(10)).should.equal('65535');
      (a.toString(16)).should.equal('ffff');
    });

    it('can be converted to a byte array and vice versa', function() {
      var a;
      var b;
      a = new BigInteger('0', 10);
      b = a.toByteArray();
      b.position = 0;
      (new BigInteger(b).toString(10)).should.equal('0');

      a = new BigInteger('1', 10);
      b = a.toByteArray();
      b.position = 0;
      (new BigInteger(b).toString(10)).should.equal('1');

      a = new BigInteger('-1', 10);
      b = a.toByteArray();
      b.position = 0;
      (new BigInteger(b).toString(10)).should.equal('-1');

      a = new BigInteger('123469827364987236498234', 10);
      b = a.toByteArray();
      b.position = 0;
      (new BigInteger(b).toString(10)).should.equal('123469827364987236498234');

      a = new BigInteger('-298471293048701923847', 10);
      b = a.toByteArray();
      b.position = 0;
      (new BigInteger(b).toString(10)).should.equal('-298471293048701923847');
    });

    describe('bitwise operators', function() {
      it('and', function() {
        var a = new BigInteger('1');
        var b = new BigInteger('9999999999999999');
        var c = a.and(b);
        assert.equal(c.toString(), a.toString());
      });
      it('or', function() {
        var a = new BigInteger('1');
        var b = new BigInteger('16');
        var c = a.or(b);
        assert.equal(c.toString(), new BigInteger('17').toString());
      });
      it('xor', function() {
        var a = new BigInteger('1');
        var b = new BigInteger('17');
        var c = a.xor(b);
        assert.equal(c.toString(), new BigInteger('16').toString());
      });
      it('andNot', function() {
        var a = new BigInteger('1');
        var b = new BigInteger('9999999999999999');
        var c = a.andNot(b);
        assert.equal(c.toString(), BigInteger.ZERO);
      });
      it('shift right/left', function() {
        var a = new BigInteger('1267650600228229401496703205376');
        var b = a.shiftRight(100);
        assert.equal(b.toString(), BigInteger.ONE);

        var c = BigInteger.ONE.shiftLeft(100);
        assert.equal(a.toString(), c.toString());
      });
      it('flip bits', function() {
        var a = new BigInteger('4289396650');
        assert.equal(a.toString(16), 'ffaaffaa');
        assert.equal(a.bitCount(), 24);
        var a = a.flipBit(0);
        assert.equal(a.toString(16), 'ffaaffab');
        var a = a.setBit(2);
        assert.equal(a.toString(16), 'ffaaffaf');
        assert.equal(a.getLowestSetBit(), 0);
        var a = a.clearBit(0);
        assert.equal(a.toString(16), 'ffaaffae');
        assert.equal(a.getLowestSetBit(), 1);
      });
      it('mod', function() {
        var a = new BigInteger('1267650600228229401496703205376');
        var c = a.modInt(1000000);
        assert.equal(c.toString(), '205376');
      });
      it('not', function() {
        var a = new BigInteger('3');
        var c = a.not();
        assert.equal(c.toString(), '-4');
      });
    });

    describe('math operations', function() {
      it('probable prime', function() {
        var a = new BigInteger('1267650600228229401496703205376');
        assert.equal(a.isProbablePrime(), false);
        var a = new BigInteger('15487469');
        assert.equal(a.isProbablePrime(), true);
        var a = new BigInteger('11');
        assert.equal(a.isProbablePrime(), true);
      });
      it('divide and remainder', function() {
        var a = new BigInteger('12345678901234567890');
        var result = a.divideAndRemainder(new BigInteger('555'));
        assert.equal(result[0].toString(), '22244466488710933');
        assert.equal(result[1].toString(), '75');
      });
      it('common denominator', function() {
        var a = new BigInteger('78172398172398172937198371289378129738129372');
        var b = new BigInteger('7893178372193712937918746');
        assert.equal(a.gcd(b).toString(), '2');
      });
      it('modpow', function() {
        var a = new BigInteger('2');

        var b = a.modPow(new BigInteger('2'), new BigInteger('10'));  // 2^4 % 10
        assert.equal(b.toString(), '4');

        b = a.modPow(new BigInteger('10'), new BigInteger('10'));  // 2^10 % 10
        assert.equal(b.toString(), '4');

        b = a.modPow(new BigInteger('100'), new BigInteger('10'));  // 2^100 % 10
        assert.equal(b.toString(), '6');

        b = a.modPow(new BigInteger('1000'), new BigInteger('10'));  // 2^100 % 10
        assert.equal(b.toString(), '6');

        b = a.modPow(new BigInteger('0'), new BigInteger('10'));  // 2^0 % 10
        assert.equal(b.toString(), '1');

        b = a.modPow(new BigInteger('4096'), new BigInteger('10'));  // 2^4096 % 10
        assert.equal(b.toString(), '6');

        b = a.modPow(new BigInteger('8192'), new BigInteger('1000'));  // 2^8192 % 1000
        assert.equal(b.toString(), '896');
      });
      it('to/from byteArrayUnsigned', function() {
        var a1 = [1, 2, 3, 4, 5, 6, 7, 8, 255, 254, 253];
        var a = BigInteger.fromByteArrayUnsigned(a1);
        var a2 = a.toByteArrayUnsigned();
        assert.deepEqual(a1, a2);
      });
      it('to/from byteArraySigned', function() {
        var a1 = [1, 2, 3, 4, 5, 6, 7, 8, 255, 254, 253];
        var a = BigInteger.fromByteArraySigned(a1);
        var a2 = a.toByteArraySigned();
        assert.deepEqual(a1, a2);

        var a1 = [0x80, 255, 2, 3, 4, 5, 6, 7, 8, 255, 254, 253];
        var a = BigInteger.fromByteArraySigned(a1);
        var a2 = a.toByteArraySigned();
      });
    });
  });
});
