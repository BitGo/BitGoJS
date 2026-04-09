import { Cbor } from '../..';
import * as cborFixtures from '../cbor/fixtures.json';

describe('deser-lib', function () {
  describe('cbor', function () {
    describe('transform', function () {
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
        const res = Cbor.transform({ value: { b: 'first', a: 'second' } }) as any;
        const properties = Object.getOwnPropertyNames(res.value);
        properties[0].should.equal('b');
        properties[1].should.equal('a');
        res.value.b.should.equal('first');
        res.value.a.should.equal('second');
      });

      it('transforms array recursively', function () {
        const res = Cbor.transform([{ weight: 0, value: { b: 'first', a: 'second' } }]) as any;
        const properties = Object.getOwnPropertyNames(res[0].value);
        properties[0].should.equal('b');
        properties[1].should.equal('a');
        res[0].value.b.should.equal('first');
        res[0].value.a.should.equal('second');
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
