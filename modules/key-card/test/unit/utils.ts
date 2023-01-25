import 'should';
import { splitKeys } from '../../src';

describe('getSplitKeys', function () {
  it('only returns one item when input shorter than limit', function () {
    const key = 'hello world';
    const limit = 20;
    const keys = splitKeys(key, limit);
    keys.length.should.equal(1);
    keys[0].should.equal(key);
  });

  it('splits key up into multiple items when exceeding the limit', function () {
    const key = 'hello world this is a short message';
    const limit = 5;
    const keys = splitKeys(key, limit);
    keys.length.should.equal(7);
    for (const splitKey of keys.slice(0, keys.length - 1)) {
      splitKey.length.should.equal(limit);
    }
    keys[keys.length - 1].length.should.be.lessThanOrEqual(limit);
    keys[0].should.equal('hello');
    keys[1].should.equal(' worl');
    keys[2].should.equal('d thi');
    keys[3].should.equal('s is ');
    keys[4].should.equal('a sho');
    keys[5].should.equal('rt me');
    keys[6].should.equal('ssage');
  });
});
