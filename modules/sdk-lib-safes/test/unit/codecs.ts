import 'should';
import * as t from 'io-ts';
import { validateJSONAgainstCodec } from '../../src';

describe('validateJSONAgainstCodec', function () {
  type Field = 'alpha' | 'beta' | 'gamma';
  const KNOWN: ReadonlyArray<Field> = ['alpha', 'beta', 'gamma'];
  const codec: t.Type<Partial<Record<Field, string>>, Partial<Record<Field, string>>, unknown> = t.partial({
    alpha: t.string,
    beta: t.string,
    gamma: t.string,
  });

  it('returns a subset of keys in canonical order, even when input is out of order', function () {
    const result = validateJSONAgainstCodec({ gamma: 'g', alpha: 'a' }, codec, KNOWN, 'test');
    Object.keys(result).should.deepEqual(['alpha', 'gamma']);
    result.should.deepEqual({ alpha: 'a', gamma: 'g' });
  });

  it('round-trips a full object byte-for-byte', function () {
    const obj = { alpha: 'a', beta: 'b', gamma: 'c' };
    JSON.stringify(validateJSONAgainstCodec(obj, codec, KNOWN, 'test')).should.equal(JSON.stringify(obj));
  });

  it('allows an empty object (non-empty is enforced by callers)', function () {
    validateJSONAgainstCodec({}, codec, KNOWN, 'test').should.deepEqual({});
  });

  it('rejects an unknown field, naming it', function () {
    (() => validateJSONAgainstCodec({ alpha: 'a', bogus: 'x' }, codec, KNOWN, 'test')).should.throw(
      /unknown field bogus/
    );
  });

  it('rejects a prototype-key field', function () {
    const raw = JSON.parse('{"__proto__":"x"}');
    (() => validateJSONAgainstCodec(raw, codec, KNOWN, 'test')).should.throw(/unknown field __proto__/);
  });

  it('rejects non-object input', function () {
    (() => validateJSONAgainstCodec('str', codec, KNOWN, 'test')).should.throw(/expected an object/);
    (() => validateJSONAgainstCodec(42, codec, KNOWN, 'test')).should.throw(/expected an object/);
    (() => validateJSONAgainstCodec(null, codec, KNOWN, 'test')).should.throw(/expected an object/);
    (() => validateJSONAgainstCodec(['a'], codec, KNOWN, 'test')).should.throw(/expected an object/);
  });

  it('rejects a value that fails the codec', function () {
    (() => validateJSONAgainstCodec({ alpha: 123 }, codec, KNOWN, 'test')).should.throw(/alpha/);
  });
});
