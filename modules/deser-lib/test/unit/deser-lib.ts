import { Cbor } from '../..';
import * as cborFixtures from '../cbor/fixtures.json';

describe('deser-lib', function () {
  describe('cbor', function () {
    describe('transform', function () {
      it('orders object properties canonically', function () {
        const res = Cbor.transform({ b: 'second', a: 'first' }) as any;
        const properties = Object.getOwnPropertyNames(res);
        properties[0].should.equal('a');
        properties[1].should.equal('b');
        res.a.should.equal('first');
        res.b.should.equal('second');
      });

      describe('canonical ordering', function () {
        it('orders by weight', function () {
          const res = Cbor.transform([
            { weight: 2, value: null },
            { weight: 1, value: null },
          ]) as any;
          res[0].weight.should.equal(1);
          res[1].weight.should.equal(2);
        });

        it('groups equal elements', function () {
          const res = Cbor.transform([
            {
              weight: 2,
              value: 'b',
            },
            {
              weight: 1,
              value: 'a',
            },
            {
              weight: 3,
              value: 'c',
            },
            {
              weight: 2,
              value: 'b',
            },
          ]) as any;
          res[0].weight.should.equal(1);
          res[1].weight.should.equal(2);
          res[2].weight.should.equal(2);
          res[3].weight.should.equal(3);
        });

        it('orders number values', function () {
          const res = Cbor.transform([
            { weight: 1, value: 2 },
            { weight: 1, value: 1 },
          ]) as any;
          res[0].value.should.equal(1);
          res[1].value.should.equal(2);
        });

        it('orders string values', function () {
          const res = Cbor.transform([
            { weight: 1, value: 'ab' },
            { weight: 1, value: 'aa' },
          ]) as any;
          res[0].value.should.equal('aa');
          res[1].value.should.equal('ab');
        });

        it('orders byte values', function () {
          const res = Cbor.transform([
            { weight: 1, value: '0x0b' },
            { weight: 1, value: '0x0a' },
          ]) as any;
          res[0].value.equals(Buffer.from([0x0a])).should.equal(true);
          res[1].value.equals(Buffer.from([0x0b])).should.equal(true);
        });

        it('orders string values of different lengths', function () {
          const res = Cbor.transform([
            { weight: 1, value: 'ab' },
            { weight: 1, value: 'a' },
          ]) as any;
          res[0].value.should.equal('a');
          res[1].value.should.equal('ab');
        });

        it('throws for elements without weight', function () {
          (() => Cbor.transform([{}, {}])).should.throw();
        });

        it('throws for elements without value', function () {
          (() => Cbor.transform([{ weight: 1 }, { weight: 1 }])).should.throw();
        });

        it('throws for values that cannot be compared', function () {
          (() =>
            Cbor.transform([
              { weight: 1, value: {} },
              { weight: 1, value: 1 },
            ])).should.throw();
          (() =>
            Cbor.transform([
              { weight: 1, value: undefined },
              { weight: 1, value: null },
            ])).should.throw();
        });

        it('throws for elements of mixed type', function () {
          (() =>
            Cbor.transform([
              { weight: 0, value: '0' },
              { weight: 0, value: 0 },
            ])).should.throw();
        });
      });

      it('preserves null values', function () {
        const res = Cbor.transform({ value: null }) as any;
        res.should.have.property('value').which.is.null();
      });

      it('replaces prefixed hex strings with Buffers', function () {
        const hex = '00010203';
        const res = Cbor.transform({ value: '0x' + hex }) as any;
        Buffer.isBuffer(res.value).should.equal(true);
        res.value.equals(Buffer.from(hex, 'hex')).should.equal(true);
      });

      it('preserves non-prefixed hex strings', function () {
        const string = '00010203';
        const res = Cbor.transform({ value: string }) as any;
        res.value.should.equal(string);
      });

      it('preserves escaped strings', function () {
        const string = '0xPrefixedString';
        const res = Cbor.transform({ value: '\\' + string }) as any;
        res.value.should.equal(string);
      });

      it('transforms object recursively', function () {
        const res = Cbor.transform({ value: { b: 'second', a: 'first' } }) as any;
        const properties = Object.getOwnPropertyNames(res.value);
        properties[0].should.equal('a');
        properties[1].should.equal('b');
        res.value.a.should.equal('first');
        res.value.b.should.equal('second');
      });

      it('transforms array recursively', function () {
        const res = Cbor.transform([{ weight: 0, value: { b: 'second', a: 'first' } }]) as any;
        const properties = Object.getOwnPropertyNames(res[0].value);
        properties[0].should.equal('a');
        properties[1].should.equal('b');
        res[0].value.a.should.equal('first');
        res[0].value.b.should.equal('second');
      });

      it('throws for invalid hex strings', function () {
        (() => Cbor.transform('0x0g')).should.throw();
      });
    });

    describe('untransform', function () {
      it('untransforms object', function () {
        const res = Cbor.untransform({ a: 'first', b: 'second' }) as any;
        const properties = Object.getOwnPropertyNames(res);
        properties[0].should.equal('a');
        properties[1].should.equal('b');
        res.a.should.equal('first');
        res.b.should.equal('second');
      });

      it('enforces canonical object property order', function () {
        (() => Cbor.untransform({ b: 'second', a: 'first' })).should.throw();
      });

      it('enforces canonical array element order', function () {
        (() => Cbor.untransform([{ weight: 2 }, { weight: 1 }])).should.throw();
      });

      it('replaces Buffers with prefixed hex strings', function () {
        const hex = '00010203';
        const res = Cbor.untransform({ value: Buffer.from(hex, 'hex') }) as any;
        res.value.should.equal('0x' + hex);
      });

      it('preserves non-prefixed hex strings', function () {
        const string = '00010203';
        const res = Cbor.untransform({ value: string }) as any;
        res.value.should.equal(string);
      });

      it('escapes prefixed string', function () {
        const string = '0xPrefixedString';
        const res = Cbor.untransform({ value: string }) as any;
        res.value.should.equal('\\' + string);
      });

      it('untransforms object recursively', function () {
        const hex = '00010203';
        const res = Cbor.untransform({ value: { value: Buffer.from(hex, 'hex') } }) as any;
        res.value.value.should.equal('0x' + hex);
      });

      it('untransforms array recursively', function () {
        const hex = '00010203';
        const res = Cbor.untransform([{ value: Buffer.from(hex, 'hex'), weight: 0 }]) as any;
        res[0].value.should.equal('0x' + hex);
      });
    });

    describe('fixtures', function () {
      xit('creates test vectors', function () {
        const { writeFileSync } = require('fs');
        const deserialized = [
          {
            keys: [
              {
                key: '0x010203',
                weight: 0,
              },
              {
                key: '0x040506',
                weight: 1,
              },
            ],
          },
          {
            a: '0xffffffff',
            b: '0x00000000',
            c: '0xffffffff',
            d: [
              {
                weight: 0,
              },
              {
                weight: 1,
              },
              {
                weight: 2,
              },
              {
                weight: 3,
              },
            ],
          },
          {
            a: [
              {
                value: 'a',
                weight: 0,
              },
              {
                value: 'b',
                weight: 0,
              },
              {
                value: 'c',
                weight: 0,
              },
            ],
          },
          {
            a: [
              {
                weight: 0,
                value: '0x0a',
              },
              {
                weight: 0,
                value: '0x0b',
              },
              {
                weight: 0,
                value: '0x0c',
              },
            ],
          },
          {
            a: [
              {
                weight: 0,
                value: 1,
              },
              {
                weight: 0,
                value: 2,
              },
              {
                weight: 0,
                value: 3,
              },
            ],
          },
        ];
        const serialized = deserialized.map((x) => Cbor.serialize(x).toString('hex'));
        writeFileSync(
          'test/cbor/fixtures.json',
          JSON.stringify(
            deserialized.map((deserialized, i) => ({
              deserialized: Cbor.untransform(Cbor.transform(deserialized)),
              serialized: serialized[i],
            })),
            null,
            2
          )
        );
      });

      for (let i = 0; i < cborFixtures.length; i++) {
        it(`deserializes vector[${i}]`, function () {
          const { deserialized, serialized } = cborFixtures[i];
          Cbor.serialize(deserialized).equals(Buffer.from(serialized, 'hex')).should.equal(true);
        });
      }

      for (let i = 0; i < cborFixtures.length; i++) {
        it(`serializes vector[${i}]`, function () {
          const { deserialized, serialized } = cborFixtures[i];
          JSON.stringify(Cbor.deserialize(Buffer.from(serialized, 'hex'))).should.equal(JSON.stringify(deserialized));
        });
      }
    });
  });
});
