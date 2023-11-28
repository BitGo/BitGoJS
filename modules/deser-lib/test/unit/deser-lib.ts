import { transform, untransform, serialize, deserialize } from '../..';
import * as fixtures from '../fixtures.json';

describe('deser-lib', function () {
  describe('transform', function () {
    it('orders object properties canonically', function () {
      const res = transform({ b: 'second', a: 'first' });
      const properties = Object.getOwnPropertyNames(res);
      properties[0].should.equal('a');
      properties[1].should.equal('b');
      res.a.should.equal('first');
      res.b.should.equal('second');
    });

    describe('canonical ordering', function () {
      it('orders by weight', function () {
        const res = transform([{ weight: 2 }, { weight: 1 }]);
        res[0].weight.should.equal(1);
        res[1].weight.should.equal(2);
      });

      it('orders number values', function () {
        const res = transform([
          { weight: 1, value: 2 },
          { weight: 1, value: 1 },
        ]);
        res[0].value.should.equal(1);
        res[1].value.should.equal(2);
      });

      it('orders string values', function () {
        const res = transform([
          { weight: 1, value: 'b' },
          { weight: 1, value: 'a' },
        ]);
        res[0].value.should.equal('a');
        res[1].value.should.equal('b');
      });

      it('orders byte values', function () {
        const res = transform([
          { weight: 1, value: '0x0b' },
          { weight: 1, value: '0x0a' },
        ]);
        res[0].value.equals(Buffer.from([0x0a])).should.equal(true);
        res[1].value.equals(Buffer.from([0x0b])).should.equal(true);
      });

      it('throws for elements without weight', function () {
        (() => transform([{}, {}])).should.throw();
      });

      it('throws for values that cannot be compared', function () {
        (() =>
          transform([
            { weight: 1, value: {} },
            { weight: 1, value: 1 },
          ])).should.throw();
      });

      it('throws for elements of mixed type', function () {
        (() =>
          transform([
            { weight: 0, value: '0' },
            { weight: 0, value: 0 },
          ])).should.throw();
      });
    });

    it('replaces prefixed hex strings with Buffers', function () {
      const hex = '00010203';
      const res = transform({ value: '0x' + hex });
      Buffer.isBuffer(res.value).should.equal(true);
      res.value.equals(Buffer.from(hex, 'hex')).should.equal(true);
    });

    it('preserves non-prefixed hex strings', function () {
      const string = '00010203';
      const res = transform({ value: string });
      res.value.should.equal(string);
    });

    it('transforms object recursively', function () {
      const res = transform({ value: { b: 'second', a: 'first' } });
      const properties = Object.getOwnPropertyNames(res.value);
      properties[0].should.equal('a');
      properties[1].should.equal('b');
      res.value.a.should.equal('first');
      res.value.b.should.equal('second');
    });

    it('transforms array recursively', function () {
      const res = transform([{ weight: 0, value: { b: 'second', a: 'first' } }]);
      const properties = Object.getOwnPropertyNames(res[0].value);
      properties[0].should.equal('a');
      properties[1].should.equal('b');
      res[0].value.a.should.equal('first');
      res[0].value.b.should.equal('second');
    });
  });

  describe('untransform', function () {
    it('untransforms object', function () {
      const res = untransform({ a: 'first', b: 'second' });
      const properties = Object.getOwnPropertyNames(res);
      properties[0].should.equal('a');
      properties[1].should.equal('b');
      res.a.should.equal('first');
      res.b.should.equal('second');
    });

    it('enforces canonical object property order', function () {
      (() => untransform({ b: 'second', a: 'first' })).should.throw();
    });

    it('enforces canonical array element order', function () {
      (() => untransform([{ weight: 2 }, { weight: 1 }])).should.throw();
    });

    it('replaces Buffers with prefixed hex strings', function () {
      const hex = '00010203';
      const res = untransform({ value: Buffer.from(hex, 'hex') });
      res.value.should.equal('0x' + hex);
    });

    it('preserves non-prefixed hex strings', function () {
      const string = '00010203';
      const res = untransform({ value: string });
      res.value.should.equal(string);
    });

    it('untransforms object recursively', function () {
      const hex = '00010203';
      const res = untransform({ value: { value: Buffer.from(hex, 'hex') } });
      res.value.value.should.equal('0x' + hex);
    });

    it('untransforms array recursively', function () {
      const hex = '00010203';
      const res = untransform([{ value: Buffer.from(hex, 'hex'), weight: 0 }]);
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
      const serialized = deserialized.map((x) => serialize(x).toString('hex'));
      writeFileSync(
        'test/fixtures.json',
        JSON.stringify(
          deserialized.map((deserialized, i) => ({
            deserialized: untransform(transform(deserialized)),
            serialized: serialized[i],
          })),
          null,
          2
        )
      );
    });

    for (let i = 0; i < fixtures.length; i++) {
      it(`deserializes vector[${i}]`, function () {
        const { deserialized, serialized } = fixtures[i];
        serialize(deserialized).equals(Buffer.from(serialized, 'hex')).should.equal(true);
      });
    }

    for (let i = 0; i < fixtures.length; i++) {
      it(`serializes vector[${i}]`, function () {
        const { deserialized, serialized } = fixtures[i];
        JSON.stringify(deserialize(Buffer.from(serialized, 'hex'))).should.equal(JSON.stringify(deserialized));
      });
    }
  });
});
